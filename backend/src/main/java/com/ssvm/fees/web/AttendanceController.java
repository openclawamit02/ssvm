package com.ssvm.fees.web;

import com.ssvm.fees.domain.model.AttendanceRecord;
import com.ssvm.fees.infrastructure.AttendanceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;

    public AttendanceController(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    @PostMapping("/record")
    public ResponseEntity<?> recordAttendance(@RequestBody List<AttendanceRecord> records) {
        attendanceRepository.saveAll(records);
        return ResponseEntity.ok(Map.of("status", "success", "message", "Attendance recorded"));
    }

    @GetMapping("/daily")
    public ResponseEntity<List<AttendanceRecord>> getDailyAttendance(
            @RequestParam String date,
            @RequestParam AttendanceRecord.PersonType type) {
        return ResponseEntity.ok(attendanceRepository.findByDateAndPersonType(LocalDate.parse(date), type));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(@RequestParam AttendanceRecord.PersonType type) {
        List<Map<String, Object>> stats = attendanceRepository.getAttendanceStats(type);
        
        if (stats.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "highest", 0,
                "lowest", 0,
                "belowThresholdCount", 0
            ));
        }

        double highest = stats.stream()
                .mapToDouble(s -> (double) s.get("percentage"))
                .max().orElse(0);
        
        double lowest = stats.stream()
                .mapToDouble(s -> (double) s.get("percentage"))
                .min().orElse(0);
        
        long belowThresholdCount = stats.stream()
                .filter(s -> (double) s.get("percentage") < 75.0)
                .count();

        return ResponseEntity.ok(Map.of(
            "highest", highest,
            "lowest", lowest,
            "belowThresholdCount", belowThresholdCount,
            "totalCount", stats.size()
        ));
    }

    @GetMapping("/flagged")
    public ResponseEntity<?> getFlagged(@RequestParam AttendanceRecord.PersonType type, @RequestParam(defaultValue = "75.0") double threshold) {
        return ResponseEntity.ok(attendanceRepository.findByAttendanceBelow(type, threshold));
    }
}

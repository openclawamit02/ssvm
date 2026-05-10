package com.ssvm.fees.web;

import com.ssvm.fees.domain.model.Student;
import com.ssvm.fees.domain.model.Teacher;
import com.ssvm.fees.infrastructure.StudentRepository;
import com.ssvm.fees.infrastructure.TeacherRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/directory")
@CrossOrigin(origins = "*")
public class DirectoryController {

    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;

    public DirectoryController(StudentRepository studentRepository, TeacherRepository teacherRepository) {
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
    }

    @GetMapping("/students")
    public ResponseEntity<Page<Student>> getStudents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String studentClass,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        var pageRequest = PageRequest.of(page, size);
        if (studentClass != null && !studentClass.isBlank()) {
            if (search != null && !search.isBlank()) {
                return ResponseEntity.ok(studentRepository.findByStudentClassAndNameContainingIgnoreCase(studentClass, search, pageRequest));
            }
            return ResponseEntity.ok(studentRepository.findByStudentClass(studentClass, pageRequest));
        }
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(studentRepository.findByNameContainingIgnoreCaseOrRollNumberContainingIgnoreCase(search, search, pageRequest));
        }
        return ResponseEntity.ok(studentRepository.findAll(pageRequest));
    }

    @GetMapping("/teachers")
    public ResponseEntity<Page<Teacher>> getTeachers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        var pageRequest = PageRequest.of(page, size);
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(teacherRepository.findByNameContainingIgnoreCaseOrEmployeeIdContainingIgnoreCase(search, search, pageRequest));
        }
        return ResponseEntity.ok(teacherRepository.findAll(pageRequest));
    }

    @PostMapping("/students")
    public ResponseEntity<Student> createStudent(@RequestBody Student student) {
        return ResponseEntity.ok(studentRepository.save(student));
    }

    @PutMapping("/students/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable String id, @RequestBody Student student) {
        student.setId(id);
        return ResponseEntity.ok(studentRepository.save(student));
    }

    @DeleteMapping("/students/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable String id) {
        studentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/teachers")
    public ResponseEntity<Teacher> createTeacher(@RequestBody Teacher teacher) {
        return ResponseEntity.ok(teacherRepository.save(teacher));
    }

    @PutMapping("/teachers/{id}")
    public ResponseEntity<Teacher> updateTeacher(@PathVariable String id, @RequestBody Teacher teacher) {
        teacher.setId(id);
        return ResponseEntity.ok(teacherRepository.save(teacher));
    }

    @DeleteMapping("/teachers/{id}")
    public ResponseEntity<Void> deleteTeacher(@PathVariable String id) {
        teacherRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        return ResponseEntity.ok(Map.of(
            "totalStudents", studentRepository.count(),
            "totalTeachers", teacherRepository.count(),
            "genderDistribution", Map.of(
                "M", studentRepository.countByGenderIgnoreCase("Male"),
                "F", studentRepository.countByGenderIgnoreCase("Female")
            ),
            "statusCounts", Map.of(
                "Active", studentRepository.countByStatusIgnoreCase("Active"),
                "Inactive", studentRepository.countByStatusIgnoreCase("Inactive")
            )
        ));
    }
}

package com.ssvm.fees.infrastructure;

import com.ssvm.fees.domain.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Repository
public interface AttendanceRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByDateAndPersonType(LocalDate date, AttendanceRecord.PersonType personType);
    List<AttendanceRecord> findByPersonIdAndPersonType(String personId, AttendanceRecord.PersonType personType);

    @Query("SELECT a.personId as personId, " +
           "CAST(SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS double) / COUNT(a) * 100 as percentage " +
           "FROM AttendanceRecord a " +
           "WHERE a.personType = :type " +
           "GROUP BY a.personId")
    List<Map<String, Object>> getAttendanceStats(@Param("type") AttendanceRecord.PersonType type);

    @Query("SELECT a.personId as personId, " +
           "CAST(SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS double) / COUNT(a) * 100 as percentage " +
           "FROM AttendanceRecord a " +
           "WHERE a.personType = :type " +
           "GROUP BY a.personId " +
           "HAVING (CAST(SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS double) / COUNT(a) * 100) < :threshold")
    List<Map<String, Object>> findByAttendanceBelow(@Param("type") AttendanceRecord.PersonType type, @Param("threshold") double threshold);
}

import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getClassAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;

    const attendanceStats = await query(
      `SELECT
        COUNT(DISTINCT student_id) as total_students,
        COUNT(*) as total_attendance_records,
        COUNT(*) FILTER (WHERE status = 'present') as total_present,
        COUNT(*) FILTER (WHERE status = 'absent') as total_absent,
        ROUND(COUNT(*) FILTER (WHERE status = 'present') * 100.0 / NULLIF(COUNT(*), 0), 2) as attendance_percentage
       FROM attendance
       WHERE class_id = $1`,
      [classId]
    );

    const gradeDistribution = await query(
      `SELECT
        grade,
        COUNT(*) as count
       FROM grades
       WHERE class_id = $1
       GROUP BY grade
       ORDER BY grade`,
      [classId]
    );

    const subjectWisePerformance = await query(
      `SELECT
        s.name as subject_name,
        s.code as subject_code,
        COUNT(*) as total_assessments,
        ROUND(AVG(g.marks_obtained / g.max_marks * 100), 2) as average_percentage,
        MIN(g.marks_obtained / g.max_marks * 100) as min_percentage,
        MAX(g.marks_obtained / g.max_marks * 100) as max_percentage
       FROM grades g
       JOIN subjects s ON g.subject_id = s.id
       WHERE g.class_id = $1
       GROUP BY s.id, s.name, s.code
       ORDER BY s.name`,
      [classId]
    );

    const topPerformers = await query(
      `SELECT
        u.id,
        u.first_name,
        u.last_name,
        e.roll_number,
        COUNT(*) as total_assessments,
        ROUND(AVG(g.marks_obtained / g.max_marks * 100), 2) as average_percentage,
        SUM(g.marks_obtained) as total_marks,
        SUM(g.max_marks) as total_possible_marks
       FROM grades g
       JOIN users u ON g.student_id = u.id
       JOIN enrollments e ON u.id = e.student_id AND e.class_id = g.class_id
       WHERE g.class_id = $1
       GROUP BY u.id, u.first_name, u.last_name, e.roll_number
       HAVING COUNT(*) >= 3
       ORDER BY average_percentage DESC
       LIMIT 10`,
      [classId]
    );

    const weakStudents = await query(
      `SELECT
        u.id,
        u.first_name,
        u.last_name,
        e.roll_number,
        COUNT(*) as total_assessments,
        ROUND(AVG(g.marks_obtained / g.max_marks * 100), 2) as average_percentage,
        SUM(g.marks_obtained) as total_marks,
        SUM(g.max_marks) as total_possible_marks
       FROM grades g
       JOIN users u ON g.student_id = u.id
       JOIN enrollments e ON u.id = e.student_id AND e.class_id = g.class_id
       WHERE g.class_id = $1
       GROUP BY u.id, u.first_name, u.last_name, e.roll_number
       HAVING COUNT(*) >= 3 AND AVG(g.marks_obtained / g.max_marks * 100) < 50
       ORDER BY average_percentage ASC
       LIMIT 10`,
      [classId]
    );

    const monthlyTrend = await query(
      `SELECT
        DATE_TRUNC('month', exam_date) as month,
        ROUND(AVG(marks_obtained / max_marks * 100), 2) as average_percentage
       FROM grades
       WHERE class_id = $1 AND exam_date IS NOT NULL
       GROUP BY DATE_TRUNC('month', exam_date)
       ORDER BY month DESC
       LIMIT 6`,
      [classId]
    );

    res.json({
      attendanceStats: attendanceStats.rows[0],
      gradeDistribution: gradeDistribution.rows,
      subjectWisePerformance: subjectWisePerformance.rows,
      topPerformers: topPerformers.rows,
      weakStudents: weakStudents.rows,
      monthlyTrend: monthlyTrend.rows
    });
  } catch (error) {
    console.error('Get class analytics error:', error);
    res.status(500).json({ message: 'Error fetching class analytics' });
  }
};

export const getStudentAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;

    const overallPerformance = await query(
      `SELECT
        COUNT(*) as total_assessments,
        ROUND(AVG(marks_obtained / max_marks * 100), 2) as average_percentage,
        SUM(marks_obtained) as total_marks,
        SUM(max_marks) as total_possible_marks,
        COUNT(*) FILTER (WHERE grade IN ('A+', 'A')) as excellent_grades,
        COUNT(*) FILTER (WHERE grade = 'F') as failed_grades
       FROM grades
       WHERE student_id = $1`,
      [studentId]
    );

    const subjectWisePerformance = await query(
      `SELECT
        s.name as subject_name,
        s.code as subject_code,
        COUNT(*) as total_assessments,
        ROUND(AVG(g.marks_obtained / g.max_marks * 100), 2) as average_percentage,
        MIN(g.marks_obtained / g.max_marks * 100) as min_percentage,
        MAX(g.marks_obtained / g.max_marks * 100) as max_percentage
       FROM grades g
       JOIN subjects s ON g.subject_id = s.id
       WHERE g.student_id = $1
       GROUP BY s.id, s.name, s.code
       ORDER BY average_percentage DESC`,
      [studentId]
    );

    const attendanceStats = await query(
      `SELECT
        COUNT(*) as total_days,
        COUNT(*) FILTER (WHERE status = 'present') as present_days,
        COUNT(*) FILTER (WHERE status = 'absent') as absent_days,
        COUNT(*) FILTER (WHERE status = 'late') as late_days,
        ROUND(COUNT(*) FILTER (WHERE status = 'present') * 100.0 / NULLIF(COUNT(*), 0), 2) as attendance_percentage
       FROM attendance
       WHERE student_id = $1`,
      [studentId]
    );

    const recentGrades = await query(
      `SELECT g.*, s.name as subject_name, et.name as exam_type_name,
              ROUND((g.marks_obtained / g.max_marks * 100), 2) as percentage
       FROM grades g
       LEFT JOIN subjects s ON g.subject_id = s.id
       LEFT JOIN exam_types et ON g.exam_type_id = et.id
       WHERE g.student_id = $1
       ORDER BY g.exam_date DESC, g.created_at DESC
       LIMIT 10`,
      [studentId]
    );

    const progressTrend = await query(
      `SELECT
        DATE_TRUNC('month', exam_date) as month,
        ROUND(AVG(marks_obtained / max_marks * 100), 2) as average_percentage
       FROM grades
       WHERE student_id = $1 AND exam_date IS NOT NULL
       GROUP BY DATE_TRUNC('month', exam_date)
       ORDER BY month DESC
       LIMIT 6`,
      [studentId]
    );

    res.json({
      overallPerformance: overallPerformance.rows[0],
      subjectWisePerformance: subjectWisePerformance.rows,
      attendanceStats: attendanceStats.rows[0],
      recentGrades: recentGrades.rows,
      progressTrend: progressTrend.rows
    });
  } catch (error) {
    console.error('Get student analytics error:', error);
    res.status(500).json({ message: 'Error fetching student analytics' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (userRole === 'teacher') {
      const myClasses = await query(
        'SELECT COUNT(*) as total_classes FROM classes WHERE teacher_id = $1',
        [userId]
      );

      const myStudents = await query(
        `SELECT COUNT(DISTINCT e.student_id) as total_students
         FROM classes c
         JOIN enrollments e ON c.id = e.class_id
         WHERE c.teacher_id = $1 AND e.status = 'active'`,
        [userId]
      );

      const todaysClasses = await query(
        `SELECT COUNT(*) as today_classes
         FROM timetable t
         WHERE t.teacher_id = $1 AND t.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)`,
        [userId]
      );

      const recentAttendance = await query(
        `SELECT COUNT(*) as records_today
         FROM attendance a
         JOIN classes c ON a.class_id = c.id
         WHERE c.teacher_id = $1 AND a.date = CURRENT_DATE`,
        [userId]
      );

      res.json({
        totalClasses: myClasses.rows[0].total_classes,
        totalStudents: myStudents.rows[0].total_students,
        todaysClasses: todaysClasses.rows[0].today_classes,
        attendanceMarkedToday: recentAttendance.rows[0].records_today
      });
    } else if (userRole === 'student') {
      const myClasses = await query(
        `SELECT COUNT(*) as enrolled_classes
         FROM enrollments
         WHERE student_id = $1 AND status = 'active'`,
        [userId]
      );

      const myAttendance = await query(
        `SELECT
          COUNT(*) FILTER (WHERE status = 'present') * 100.0 / NULLIF(COUNT(*), 0) as attendance_percentage
         FROM attendance
         WHERE student_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'`,
        [userId]
      );

      const myGrades = await query(
        `SELECT
          ROUND(AVG(marks_obtained / max_marks * 100), 2) as average_percentage
         FROM grades
         WHERE student_id = $1`,
        [userId]
      );

      res.json({
        enrolledClasses: myClasses.rows[0].enrolled_classes,
        attendancePercentage: myAttendance.rows[0].attendance_percentage || 0,
        averageGrade: myGrades.rows[0].average_percentage || 0
      });
    } else {
      const totalTeachers = await query(
        'SELECT COUNT(*) as total FROM users WHERE role = \'teacher\''
      );

      const totalStudents = await query(
        'SELECT COUNT(*) as total FROM users WHERE role = \'student\''
      );

      const totalClasses = await query(
        'SELECT COUNT(*) as total FROM classes'
      );

      res.json({
        totalTeachers: totalTeachers.rows[0].total,
        totalStudents: totalStudents.rows[0].total,
        totalClasses: totalClasses.rows[0].total
      });
    }
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
};

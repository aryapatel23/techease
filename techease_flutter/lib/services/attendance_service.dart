import 'package:intl/intl.dart';

import '../models/student.dart';
import 'api_client.dart';

class AttendanceService {
  final ApiClient apiClient;

  AttendanceService(this.apiClient);

  Future<void> markBulkAttendance({
    required int classId,
    required int subjectId,
    required DateTime date,
    required List<AttendanceInput> entries,
  }) async {
    final formattedDate = DateFormat('yyyy-MM-dd').format(date);
    await apiClient.post('/attendance/bulk', body: {
      'classId': classId,
      'subjectId': subjectId,
      'date': formattedDate,
      'attendanceData': entries
          .map((entry) => {
                'studentId': entry.student.id,
                'status': entry.status,
                'remarks': entry.remarks,
              })
          .toList(),
    });
  }
}

class AttendanceInput {
  final Student student;
  String status;
  String? remarks;

  AttendanceInput({required this.student, this.status = 'present', this.remarks});
}

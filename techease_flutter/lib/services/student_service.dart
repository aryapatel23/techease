import '../models/student.dart';
import 'api_client.dart';

class StudentService {
  final ApiClient apiClient;

  StudentService(this.apiClient);

  Future<List<Student>> fetchStudents({int? classId, String? search}) async {
    final query = <String, dynamic>{};
    if (classId != null) query['classId'] = classId;
    if (search != null && search.trim().isNotEmpty) query['search'] = search.trim();

    final payload = await apiClient.get('/students', query: query.isEmpty ? null : query);
    final students = (payload['students'] as List<dynamic>? ?? const []);
    return students
        .whereType<Map<String, dynamic>>()
        .map(Student.fromJson)
        .toList();
  }
}

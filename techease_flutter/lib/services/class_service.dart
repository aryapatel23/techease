import '../models/class_room.dart';
import '../models/subject.dart';
import 'api_client.dart';

class ClassService {
  final ApiClient apiClient;

  ClassService(this.apiClient);

  Future<List<ClassRoom>> fetchClasses() async {
    final payload = await apiClient.get('/classes');
    final classes = (payload['classes'] as List<dynamic>? ?? const []);
    return classes
        .whereType<Map<String, dynamic>>()
        .map(ClassRoom.fromJson)
        .toList();
  }

  Future<List<Subject>> fetchSubjects() async {
    final payload = await apiClient.get('/classes/subjects');
    final subjects = (payload['subjects'] as List<dynamic>? ?? const []);
    return subjects
        .whereType<Map<String, dynamic>>()
        .map(Subject.fromJson)
        .toList();
  }
}

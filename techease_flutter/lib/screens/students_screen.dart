import 'package:flutter/material.dart';

import '../models/student.dart';
import '../services/student_service.dart';

class StudentsScreen extends StatefulWidget {
  final StudentService studentService;

  const StudentsScreen({super.key, required this.studentService});

  @override
  State<StudentsScreen> createState() => _StudentsScreenState();
}

class _StudentsScreenState extends State<StudentsScreen> {
  bool loading = true;
  List<Student> students = const [];
  String? error;
  String query = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      final list = await widget.studentService.fetchStudents(search: query);
      setState(() => students = list);
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: TextField(
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.search),
              hintText: 'Search students',
            ),
            onChanged: (value) => query = value,
            onSubmitted: (_) => _load(),
          ),
        ),
        Expanded(
          child: loading
              ? const Center(child: CircularProgressIndicator())
              : error != null
                  ? Center(child: Text(error!))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: students.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final item = students[index];
                          return Card(
                            child: ListTile(
                              leading: CircleAvatar(child: Text(item.firstName.isNotEmpty ? item.firstName[0] : '?')),
                              title: Text(item.fullName),
                              subtitle: Text(item.email),
                              trailing: Text(item.rollNumber ?? '-'),
                            ),
                          );
                        },
                      ),
                    ),
        ),
      ],
    );
  }
}

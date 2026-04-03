import 'package:flutter/material.dart';

import '../models/class_room.dart';
import '../services/class_service.dart';

class ClassesScreen extends StatefulWidget {
  final ClassService classService;

  const ClassesScreen({super.key, required this.classService});

  @override
  State<ClassesScreen> createState() => _ClassesScreenState();
}

class _ClassesScreenState extends State<ClassesScreen> {
  bool loading = true;
  List<ClassRoom> classes = const [];
  String? error;

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
      final list = await widget.classService.fetchClasses();
      setState(() => classes = list);
    } catch (e) {
      setState(() => error = e.toString());
    } finally {
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    if (error != null) return Center(child: Text(error!));

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: classes.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final item = classes[index];
          return Card(
            child: ListTile(
              leading: const CircleAvatar(child: Icon(Icons.class_)),
              title: Text(item.name),
              subtitle: Text('Grade ${item.grade} ${item.section}'),
            ),
          );
        },
      ),
    );
  }
}

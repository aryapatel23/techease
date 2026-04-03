import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/class_room.dart';
import '../models/student.dart';
import '../models/subject.dart';
import '../services/attendance_service.dart';
import '../services/class_service.dart';
import '../services/student_service.dart';

class AttendanceScreen extends StatefulWidget {
  final ClassService classService;
  final StudentService studentService;
  final AttendanceService attendanceService;

  const AttendanceScreen({
    super.key,
    required this.classService,
    required this.studentService,
    required this.attendanceService,
  });

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  List<ClassRoom> classes = const [];
  List<Subject> subjects = const [];
  List<Student> students = const [];
  List<AttendanceInput> entries = const [];

  int? selectedClassId;
  int? selectedSubjectId;
  DateTime selectedDate = DateTime.now();

  bool loading = true;
  bool saving = false;

  @override
  void initState() {
    super.initState();
    _loadBase();
  }

  Future<void> _loadBase() async {
    setState(() => loading = true);
    try {
      final classList = await widget.classService.fetchClasses();
      final subjectList = await widget.classService.fetchSubjects();
      setState(() {
        classes = classList;
        subjects = subjectList;
      });
    } finally {
      setState(() => loading = false);
    }
  }

  Future<void> _loadStudents() async {
    if (selectedClassId == null) return;
    setState(() => loading = true);
    try {
      final list = await widget.studentService.fetchStudents(classId: selectedClassId);
      setState(() {
        students = list;
        entries = list.map((s) => AttendanceInput(student: s)).toList();
      });
    } finally {
      setState(() => loading = false);
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
      initialDate: selectedDate,
    );
    if (picked != null) {
      setState(() => selectedDate = picked);
    }
  }

  Future<void> _submit() async {
    if (selectedClassId == null || selectedSubjectId == null || entries.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select class, subject, and students first.')),
      );
      return;
    }

    setState(() => saving = true);
    try {
      await widget.attendanceService.markBulkAttendance(
        classId: selectedClassId!,
        subjectId: selectedSubjectId!,
        date: selectedDate,
        entries: entries,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Attendance submitted successfully.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading && classes.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                DropdownButtonFormField<int>(
                  initialValue: selectedClassId,
                  items: classes
                      .map((item) => DropdownMenuItem(value: item.id, child: Text(item.label)))
                      .toList(),
                  decoration: const InputDecoration(labelText: 'Class'),
                  onChanged: (value) {
                    setState(() => selectedClassId = value);
                    _loadStudents();
                  },
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<int>(
                  initialValue: selectedSubjectId,
                  items: subjects
                      .map((item) => DropdownMenuItem(value: item.id, child: Text(item.label)))
                      .toList(),
                  decoration: const InputDecoration(labelText: 'Subject'),
                  onChanged: (value) => setState(() => selectedSubjectId = value),
                ),
                const SizedBox(height: 10),
                InkWell(
                  onTap: _pickDate,
                  borderRadius: BorderRadius.circular(12),
                  child: InputDecorator(
                    decoration: const InputDecoration(labelText: 'Date'),
                    child: Text(DateFormat('yyyy-MM-dd').format(selectedDate)),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),
        ...entries.map((entry) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(entry.student.fullName, style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text(entry.student.rollNumber ?? '-', style: const TextStyle(color: Colors.black54)),
                    const SizedBox(height: 10),
                    SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: 'present', label: Text('Present')),
                        ButtonSegment(value: 'absent', label: Text('Absent')),
                        ButtonSegment(value: 'late', label: Text('Late')),
                      ],
                      selected: {entry.status},
                      onSelectionChanged: (value) {
                        setState(() => entry.status = value.first);
                      },
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
        const SizedBox(height: 8),
        FilledButton(
          onPressed: saving ? null : _submit,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Text(saving ? 'Submitting...' : 'Submit Attendance'),
          ),
        )
      ],
    );
  }
}

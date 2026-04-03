import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/attendance_service.dart';
import '../services/class_service.dart';
import '../services/student_service.dart';
import '../state/auth_controller.dart';
import 'attendance_screen.dart';
import 'classes_screen.dart';
import 'dashboard_screen.dart';
import 'students_screen.dart';

class HomeShell extends StatefulWidget {
  final ClassService classService;
  final StudentService studentService;
  final AttendanceService attendanceService;

  const HomeShell({
    super.key,
    required this.classService,
    required this.studentService,
    required this.attendanceService,
  });

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int index = 0;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final user = auth.user!;

    final pages = [
      DashboardScreen(user: user),
      ClassesScreen(classService: widget.classService),
      StudentsScreen(studentService: widget.studentService),
      AttendanceScreen(
        classService: widget.classService,
        studentService: widget.studentService,
        attendanceService: widget.attendanceService,
      ),
    ];

    final labels = ['Dashboard', 'Classes', 'Students', 'Attendance'];

    return Scaffold(
      appBar: AppBar(
        title: Text(labels[index]),
        actions: [
          IconButton(
            tooltip: 'Logout',
            onPressed: () => context.read<AuthController>().logout(),
            icon: const Icon(Icons.logout),
          )
        ],
      ),
      body: pages[index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) => setState(() => index = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.class_outlined), label: 'Classes'),
          NavigationDestination(icon: Icon(Icons.groups_2_outlined), label: 'Students'),
          NavigationDestination(icon: Icon(Icons.fact_check_outlined), label: 'Attendance'),
        ],
      ),
    );
  }
}

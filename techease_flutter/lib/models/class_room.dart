class ClassRoom {
  final int id;
  final String name;
  final String grade;
  final String section;

  ClassRoom({
    required this.id,
    required this.name,
    required this.grade,
    required this.section,
  });

  String get label => '$name - Grade $grade $section';

  factory ClassRoom.fromJson(Map<String, dynamic> json) {
    return ClassRoom(
      id: (json['id'] as num?)?.toInt() ?? 0,
      name: (json['name'] ?? '').toString(),
      grade: (json['grade'] ?? '').toString(),
      section: (json['section'] ?? '').toString(),
    );
  }
}

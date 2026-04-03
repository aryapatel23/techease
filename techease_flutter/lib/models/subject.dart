class Subject {
  final int id;
  final String name;
  final String code;

  Subject({
    required this.id,
    required this.name,
    required this.code,
  });

  String get label => '$name ($code)';

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: (json['id'] as num?)?.toInt() ?? 0,
      name: (json['name'] ?? '').toString(),
      code: (json['code'] ?? '').toString(),
    );
  }
}

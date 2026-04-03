class Student {
  final int id;
  final String firstName;
  final String lastName;
  final String email;
  final String? rollNumber;

  Student({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.rollNumber,
  });

  String get fullName => '$firstName $lastName'.trim();

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: (json['id'] as num?)?.toInt() ?? 0,
      firstName: (json['firstName'] ?? json['first_name'] ?? '').toString(),
      lastName: (json['lastName'] ?? json['last_name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      rollNumber: (json['rollNumber'] ?? json['roll_number'])?.toString(),
    );
  }
}

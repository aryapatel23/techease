import '../models/app_user.dart';
import 'api_client.dart';

class AuthService {
  final ApiClient apiClient;

  AuthService(this.apiClient);

  Future<AuthResponse> login(String email, String password) async {
    final payload = await apiClient.post('/auth/login', body: {
      'email': email,
      'password': password,
    });

    if (payload is! Map<String, dynamic>) {
      throw ApiException('Unexpected login response from server', 500);
    }

    final token = (payload['token'] ?? '').toString().trim();
    final userJson = payload['user'];
    if (token.isEmpty || userJson is! Map<String, dynamic>) {
      final message = (payload['message'] ?? 'Login response is missing user or token').toString();
      throw ApiException(message, 500);
    }

    final user = AppUser.fromJson(userJson);
    return AuthResponse(token: token, user: user);
  }

  Future<AppUser> getProfile() async {
    final payload = await apiClient.get('/auth/profile');
    if (payload is Map<String, dynamic>) {
      final userJson = payload['user'];
      if (userJson is Map<String, dynamic>) {
        return AppUser.fromJson(userJson);
      }
      return AppUser.fromJson(payload);
    }
    throw ApiException('Unexpected profile response from server', 500);
  }
}

class AuthResponse {
  final String token;
  final AppUser user;

  AuthResponse({required this.token, required this.user});
}

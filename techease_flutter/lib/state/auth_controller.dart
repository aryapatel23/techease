import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/app_user.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';

class AuthController extends ChangeNotifier {
  final ApiClient apiClient;
  late final AuthService _authService;

  AuthController(this.apiClient) {
    _authService = AuthService(apiClient);
  }

  AppUser? user;
  String? token;
  bool initializing = true;
  bool loading = false;
  String? error;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    token = prefs.getString('token');
    if (token != null && token!.isNotEmpty) {
      apiClient.setToken(token);
      try {
        user = await _authService.getProfile();
      } catch (_) {
        await logout();
      }
    }
    initializing = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    loading = true;
    error = null;
    notifyListeners();

    try {
      final response = await _authService.login(email, password);
      token = response.token;
      user = response.user;
      apiClient.setToken(token);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', token!);

      loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      loading = false;
      error = e is ApiException ? e.message : e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    token = null;
    user = null;
    apiClient.setToken(null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    notifyListeners();
  }
}

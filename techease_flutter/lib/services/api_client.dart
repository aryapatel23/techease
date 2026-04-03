import 'dart:convert';
import 'dart:async';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../core/config/app_config.dart';

class ApiClient {
  static const String _backendUrlKey = 'http://localhost:5000/api';
  static const String _legacyBackendUrlKey = 'http://10.93.27.222:5000/api';
  static const String _defaultLanBaseUrl = 'http://10.93.27.222:5000/api';
  static const Duration _requestTimeout = Duration(seconds: 15);

  final http.Client _httpClient;
  String? _token;
  String _baseUrl = _defaultLanBaseUrl;

  ApiClient({http.Client? httpClient}) : _httpClient = httpClient ?? http.Client();

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_backendUrlKey);
    if (saved != null && saved.isNotEmpty) {
      _baseUrl = _normalizeBaseUrl(saved);
      return;
    }

    // Migration for incorrectly used preference key in prior builds.
    final legacySaved = prefs.getString(_legacyBackendUrlKey);
    if (legacySaved != null && legacySaved.isNotEmpty) {
      _baseUrl = _normalizeBaseUrl(legacySaved);
      await prefs.setString(_backendUrlKey, _baseUrl);
      await prefs.remove(_legacyBackendUrlKey);
      return;
    }

    // If no saved value exists yet, prefer a reachable LAN default for phone testing.
    _baseUrl = _normalizeBaseUrl(_defaultLanBaseUrl);
    await prefs.setString(_backendUrlKey, _baseUrl);
  }

  String get baseUrl => _baseUrl;

  Future<void> setBaseUrl(String value) async {
    _baseUrl = _normalizeBaseUrl(value);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_backendUrlKey, _baseUrl);
  }

  Future<void> resetBaseUrl() async {
    _baseUrl = _defaultLanBaseUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_backendUrlKey, _baseUrl);
  }

  Future<bool> healthCheck() async {
    try {
      await get('/health');
      return true;
    } catch (_) {
      return false;
    }
  }

  void setToken(String? token) {
    _token = token;
  }

  Uri _buildUri(String path, [Map<String, dynamic>? query]) {
    final base = Uri.parse(_baseUrl);
    return base.replace(
      path: '${base.path}$path',
      queryParameters: query?.map((key, value) => MapEntry(key, value.toString())),
    );
  }

  String _normalizeBaseUrl(String raw) {
    var value = raw.trim();
    if (value.isEmpty) {
      return AppConfig.apiBaseUrl;
    }

    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      value = 'http://$value';
    }

    if (value.endsWith('/')) {
      value = value.substring(0, value.length - 1);
    }

    if (!value.endsWith('/api')) {
      value = '$value/api';
    }

    return value;
  }

  Map<String, String> get _headers {
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (_token != null && _token!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    try {
      final response = await _httpClient
          .get(_buildUri(path, query), headers: _headers)
          .timeout(_requestTimeout);
      return _decodeResponse(response);
    } on TimeoutException {
      throw ApiException(
        'Request timed out. Check backend URL, server status, and network connectivity.',
        408,
      );
    } on SocketException {
      throw ApiException(
        'Cannot reach backend. Verify backend URL and that your phone and laptop are on the same network.',
        503,
      );
    } on http.ClientException {
      throw ApiException(
        'Network request failed. Please verify backend URL and internet/network access.',
        503,
      );
    }
  }

  Future<dynamic> post(String path, {Object? body}) async {
    try {
      final response = await _httpClient
          .post(
            _buildUri(path),
            headers: _headers,
            body: body == null ? null : jsonEncode(body),
          )
          .timeout(_requestTimeout);
      return _decodeResponse(response);
    } on TimeoutException {
      throw ApiException(
        'Request timed out. Check backend URL, server status, and network connectivity.',
        408,
      );
    } on SocketException {
      throw ApiException(
        'Cannot reach backend. Verify backend URL and that your phone and laptop are on the same network.',
        503,
      );
    } on http.ClientException {
      throw ApiException(
        'Network request failed. Please verify backend URL and internet/network access.',
        503,
      );
    }
  }

  Future<dynamic> put(String path, {Object? body}) async {
    try {
      final response = await _httpClient
          .put(
            _buildUri(path),
            headers: _headers,
            body: body == null ? null : jsonEncode(body),
          )
          .timeout(_requestTimeout);
      return _decodeResponse(response);
    } on TimeoutException {
      throw ApiException(
        'Request timed out. Check backend URL, server status, and network connectivity.',
        408,
      );
    } on SocketException {
      throw ApiException(
        'Cannot reach backend. Verify backend URL and that your phone and laptop are on the same network.',
        503,
      );
    } on http.ClientException {
      throw ApiException(
        'Network request failed. Please verify backend URL and internet/network access.',
        503,
      );
    }
  }

  dynamic _decodeResponse(http.Response response) {
    final payload = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return payload;
    }
    final message = payload is Map<String, dynamic>
        ? (payload['message'] ?? 'Request failed').toString()
        : 'Request failed';
    throw ApiException(message, response.statusCode);
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException(this.message, this.statusCode);

  @override
  String toString() => 'ApiException($statusCode): $message';
}

import 'package:flutter/foundation.dart';

class AppConfig {
  // Optional override at runtime:
  // flutter run --dart-define=API_BASE_URL=http://192.168.1.50:5000/api
  static const String _apiBaseUrlFromEnv =
      String.fromEnvironment('API_BASE_URL', defaultValue: '');

  static String get apiBaseUrl {
    if (_apiBaseUrlFromEnv.isNotEmpty) {
      return _apiBaseUrlFromEnv;
    }

    if (kIsWeb) {
      return 'http://localhost:5000/api';
    }

    // Android emulator maps host machine localhost to 10.0.2.2.
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000/api';
    }

    return 'http://localhost:5000/api';
  }
}

import 'package:flutter_test/flutter_test.dart';

import 'package:techease_flutter/main.dart';
import 'package:techease_flutter/services/api_client.dart';

void main() {
  testWidgets('TeachEase app bootstraps', (WidgetTester tester) async {
    await tester.pumpWidget(TeachEaseApp(apiClient: ApiClient()));

    // The app should render at least one frame without throwing.
    expect(find.byType(TeachEaseApp), findsOneWidget);
  });
}

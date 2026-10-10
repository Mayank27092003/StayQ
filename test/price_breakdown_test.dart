import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:stay_q/widgets/price_breakdown_accordion.dart';

void main() {
  testWidgets('explicit zero tax stays zero and estimate is labelled', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: PriceBreakdownAccordion(
      nightRate: 100, nights: 2, serviceFee: 50, taxes: 0))));
    await tester.pumpAndSettle();
    expect(find.text('Fee'), findsOneWidget);
    expect(find.text('Taxes & GST (18%)'), findsOneWidget);
    expect(find.text('₹0.00'), findsOneWidget);
    expect(find.text('Estimated total (INR)'), findsOneWidget);
    expect(find.text('₹250.00'), findsOneWidget);
  });
}

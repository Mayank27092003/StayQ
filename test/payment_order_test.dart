import 'package:flutter_test/flutter_test.dart';
import 'package:stay_q/models/payment_order.dart';

Map<String, dynamic> validOrder() => {
  'order_id': 'order-1', 'payment_session_id': 'session-1',
  'order_amount': '1234.50', 'environment': 'SANDBOX',
};
void main() {
  test('real gateway order fields and decimal price are preserved', () {
    final order = PaymentOrder.fromJson({'order': validOrder()});
    expect(order.id, 'order-1'); expect(order.sessionId, 'session-1');
    expect(order.amount, 1234.50); expect(order.environment, 'SANDBOX');
  });
  for (final invalid in <Map<String, dynamic>>[
    {'order_id': ''}, {'payment_session_id': ''}, {'order_amount': 0},
    {'order_amount': -1}, {'order_amount': 'NaN'}, {'environment': 'UNKNOWN'},
  ]) {
    test('invalid gateway data $invalid cannot start checkout', () {
      expect(() => PaymentOrder.fromJson({...validOrder(), ...invalid}), throwsFormatException);
    });
  }
}

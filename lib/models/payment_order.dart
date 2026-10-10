import 'json_values.dart';

class PaymentOrder {
  final String id;
  final String sessionId;
  final double amount;
  final String environment;
  PaymentOrder({required this.id, required this.sessionId, required this.amount,
      required this.environment});
  factory PaymentOrder.fromJson(Map<String, dynamic> response, {double? bookingAmount}) {
    final data = jsonMap(response['order'] ?? response['data'] ?? response);
    final id = (data['orderId'] ?? data['order_id'])?.toString().trim() ?? '';
    final session = (data['paymentSessionId'] ?? data['payment_session_id'])?.toString().trim() ?? '';
    final amount = jsonDouble(data['amount'] ?? data['orderAmount'] ?? data['order_amount'] ?? bookingAmount);
    final environment = (data['environment'] ??
        const String.fromEnvironment('CASHFREE_ENVIRONMENT', defaultValue: 'SANDBOX')).toString().toUpperCase();
    if (id.isEmpty || session.isEmpty || amount <= 0 ||
        !['SANDBOX', 'PRODUCTION'].contains(environment)) {
      throw const FormatException('The server did not return a valid payment session and price.');
    }
    return PaymentOrder(id: id, sessionId: session, amount: amount, environment: environment);
  }
}

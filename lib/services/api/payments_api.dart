import 'api_client.dart';

class PaymentsApi {
  final ApiClient _client;

  PaymentsApi(this._client);

  /// 1. Create Cashfree Payment Order & Session ID
  Future<Map<String, dynamic>> createPaymentOrder({
    required String bookingId,
    required double amount,
    String? returnUrl,
  }) async {
    final response = await _client.post(
      '/payments/create-order',
      body: {
        'bookingId': bookingId,
        'amount': amount,
        if (returnUrl != null) 'returnUrl': returnUrl,
      },
    );
    return response as Map<String, dynamic>;
  }

  /// 2. Verify Payment Capture Status
  Future<Map<String, dynamic>> verifyPayment(String orderId) async {
    final response = await _client.get('/payments/verify/$orderId');
    return response as Map<String, dynamic>;
  }

  /// 3. Request Refund
  Future<Map<String, dynamic>> requestRefund({
    required String orderId,
    required double amount,
    String? reason,
  }) async {
    final response = await _client.post(
      '/payments/refund',
      body: {
        'orderId': orderId,
        'refundAmount': amount,
        if (reason != null) 'refundReason': reason,
      },
    );
    return response as Map<String, dynamic>;
  }
}

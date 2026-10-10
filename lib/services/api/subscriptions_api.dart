import 'api_client.dart';

class SubscriptionsApi {
  final ApiClient _client;

  SubscriptionsApi(this._client);

  /// Fetch Host Pro Subscription Plans
  Future<Map<String, dynamic>> getHostPlans() async {
    final response = await _client.get('/subscriptions/host-plans');
    return response as Map<String, dynamic>;
  }

  /// Create Cashfree Subscription Order
  Future<Map<String, dynamic>> createSubscriptionOrder({
    required String planId,
    String? idempotencyKey,
    String? userEmail,
    String? userPhone,
    String? userName,
  }) async {
    final response = await _client.post(
      '/subscriptions/create-order',
      idempotencyKey: idempotencyKey,
      body: {
        'planId': planId,
        if (userEmail != null) 'userEmail': userEmail,
        if (userPhone != null) 'userPhone': userPhone,
        if (userName != null) 'userName': userName,
      },
    );
    return response as Map<String, dynamic>;
  }

  /// Verify Subscription Payment
  Future<Map<String, dynamic>> verifySubscription({
    required String orderId,
    required String planId,
    String? userId,
  }) async {
    final response = await _client.post(
      '/subscriptions/verify',
      body: {
        'orderId': orderId,
        'planId': planId,
        if (userId != null) 'userId': userId,
      },
    );
    return response as Map<String, dynamic>;
  }
}

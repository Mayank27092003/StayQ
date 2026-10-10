import 'api_client.dart';

class PricingApi {
  final ApiClient _client;

  PricingApi(this._client);

  /// Get Neighborhood Market Intelligence & StayQ AI Dynamic Pricing
  Future<Map<String, dynamic>> getMarketIntelligence({
    required String city,
    String? locality,
    String? propertyType,
    int? bedrooms,
    double? currentPrice,
    List<String>? amenities,
    String? userId,
  }) async {
    final response = await _client.post(
      '/pricing/market-intelligence',
      body: {
        'city': city,
        if (locality != null) 'locality': locality,
        if (propertyType != null) 'propertyType': propertyType,
        if (bedrooms != null) 'bedrooms': bedrooms,
        if (currentPrice != null) 'currentPrice': currentPrice,
        if (amenities != null) 'amenities': amenities,
        if (userId != null) 'userId': userId,
      },
    );
    return response as Map<String, dynamic>;
  }
}

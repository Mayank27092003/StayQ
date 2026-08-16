import 'api_client.dart';

class BookingsApi {
  final ApiClient _client;

  BookingsApi(this._client);

  Future<List<dynamic>> getUserBookings() async {
    final response = await _client.get('/bookings/my-bookings');
    return response as List<dynamic>;
  }

  Future<List<dynamic>> getHostBookings() async {
    final response = await _client.get('/bookings/host-bookings');
    return response as List<dynamic>;
  }

  Future<dynamic> getBooking(String id) async {
    return await _client.get('/bookings/$id');
  }

  Future<dynamic> createBooking(Map<String, dynamic> data) async {
    return await _client.post('/bookings', body: data);
  }

  Future<dynamic> updateBookingStatus(String id, String status) async {
    return await _client.put('/bookings/$id/status', body: {'status': status});
  }

  Future<void> cancelBooking(String id) async {
    await _client.delete('/bookings/$id');
  }
}

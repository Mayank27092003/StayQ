import 'api_client.dart';

class PropertiesApi {
  final ApiClient _client;

  PropertiesApi(this._client);

  Future<List<dynamic>> getProperties({Map<String, String>? filters}) async {
    final response = await _client.get('/properties', queryParameters: filters);
    return response as List<dynamic>;
  }

  Future<dynamic> getProperty(String id) async {
    return await _client.get('/properties/$id');
  }

  Future<dynamic> createProperty(Map<String, dynamic> data) async {
    return await _client.post('/properties', body: data);
  }

  Future<dynamic> updateProperty(String id, Map<String, dynamic> data) async {
    return await _client.put('/properties/$id', body: data);
  }

  Future<void> deleteProperty(String id) async {
    await _client.delete('/properties/$id');
  }
}

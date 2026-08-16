import 'api_client.dart';

class AuthApi {
  final ApiClient _client;

  AuthApi(this._client);

  Future<dynamic> syncProfile(Map<String, dynamic> profileData) async {
    return await _client.post('/users/sync-profile', body: profileData);
  }

  Future<dynamic> getProfile() async {
    return await _client.get('/users/profile');
  }

  Future<dynamic> updateProfile(Map<String, dynamic> data) async {
    return await _client.put('/users/profile', body: data);
  }
  
  Future<dynamic> becomeHost() async {
    return await _client.post('/users/become-host');
  }
}

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException(this.statusCode, this.message);

  @override
  String toString() => 'ApiException(statusCode: $statusCode, message: $message)';
}

class ApiClient {
  final String baseUrl;
  final http.Client _inner;

  ApiClient({required this.baseUrl, http.Client? client})
      : _inner = client ?? http.Client();

  Future<Map<String, String>> _getHeaders() async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      try {
        // Force refresh if needed by passing true, but usually false is fine
        final token = await user.getIdToken();
        if (token != null) {
          headers['Authorization'] = 'Bearer $token';
        }
      } catch (e) {
        // Log or handle token fetch error
        print('Error fetching auth token: $e');
      }
    }
    return headers;
  }

  Future<dynamic> get(String path, {Map<String, String>? queryParameters}) async {
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: queryParameters);
    final headers = await _getHeaders();
    
    final response = await _inner.get(uri, headers: headers);
    return _handleResponse(response);
  }

  Future<dynamic> post(String path, {dynamic body}) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = await _getHeaders();
    
    final response = await _inner.post(
      uri,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
    return _handleResponse(response);
  }

  Future<dynamic> put(String path, {dynamic body}) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = await _getHeaders();
    
    final response = await _inner.put(
      uri,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
    return _handleResponse(response);
  }

  Future<dynamic> delete(String path) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = await _getHeaders();
    
    final response = await _inner.delete(uri, headers: headers);
    return _handleResponse(response);
  }

  dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      try {
        return jsonDecode(response.body);
      } catch (e) {
        return response.body;
      }
    } else {
      String message = 'Unknown error';
      try {
        final errorData = jsonDecode(response.body);
        final rawMsg = errorData['message'] ?? errorData['error'];
        if (rawMsg is List) {
          message = rawMsg.join(', ');
        } else if (rawMsg is String) {
          message = rawMsg;
        } else if (rawMsg != null) {
          message = rawMsg.toString();
        }
      } catch (_) {
        message = response.body;
      }
      throw ApiException(response.statusCode, message);
    }
  }
}

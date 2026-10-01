import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
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
  static const Duration _defaultTimeout = Duration(seconds: 15);
  static const int _maxRetries = 2;

  static final ApiClient instance = ApiClient(
    baseUrl: 'https://stayq-api-608570851336.asia-south1.run.app/api/v1',
  );

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
        final token = await user.getIdToken();
        if (token != null) {
          headers['Authorization'] = 'Bearer $token';
        }
      } catch (e) {
        debugPrint('Error fetching auth token: $e');
      }
    }
    return headers;
  }

  /// Executes request with automatic timeout and retry logic on network flakiness.
  Future<http.Response> _executeWithRetry(
    Future<http.Response> Function() requestFn, {
    int retries = _maxRetries,
  }) async {
    int attempts = 0;
    while (true) {
      attempts++;
      try {
        return await requestFn().timeout(_defaultTimeout);
      } on TimeoutException {
        if (attempts > retries) {
          throw ApiException(408, 'Request timed out. Please check your internet connection.');
        }
        await Future.delayed(Duration(milliseconds: 500 * attempts));
      } on SocketException {
        if (attempts > retries) {
          throw ApiException(503, 'Network unreachable. Please check your connection.');
        }
        await Future.delayed(Duration(milliseconds: 500 * attempts));
      } on http.ClientException catch (e) {
        if (attempts > retries) {
          throw ApiException(500, 'Connection error: ${e.message}');
        }
        await Future.delayed(Duration(milliseconds: 500 * attempts));
      } catch (e) {
        if (e is ApiException) rethrow;
        throw ApiException(500, 'Unexpected network error: $e');
      }
    }
  }

  Future<dynamic> get(String path, {Map<String, String>? queryParameters}) async {
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: queryParameters);
    final headers = await _getHeaders();
    
    final response = await _executeWithRetry(() => _inner.get(uri, headers: headers));
    return _handleResponse(response);
  }

  Future<dynamic> post(String path, {dynamic body}) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = await _getHeaders();
    
    final response = await _executeWithRetry(() => _inner.post(
      uri,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    ));
    return _handleResponse(response);
  }

  Future<dynamic> put(String path, {dynamic body}) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = await _getHeaders();
    
    final response = await _executeWithRetry(() => _inner.put(
      uri,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    ));
    return _handleResponse(response);
  }

  Future<dynamic> delete(String path) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = await _getHeaders();
    
    final response = await _executeWithRetry(() => _inner.delete(uri, headers: headers));
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
        }
      } catch (_) {
        message = response.body.isNotEmpty ? response.body : 'Server returned ${response.statusCode}';
      }
      throw ApiException(response.statusCode, message);
    }
  }
}

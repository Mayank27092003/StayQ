import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import '../../config/app_config.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);
  @override
  String toString() => message;
}

class ApiClient {
  final String baseUrl;
  final http.Client _inner;
  final Future<String?> Function()? tokenProvider;
  static const timeout = Duration(seconds: 15);
  static final instance = ApiClient(baseUrl: AppConfig.apiBaseUrl);
  ApiClient({required this.baseUrl, http.Client? client, this.tokenProvider})
      : _inner = client ?? http.Client();

  Future<Map<String, String>> _headers({bool authenticated = true,
      String? idempotencyKey}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json', 'Accept': 'application/json',
      if (idempotencyKey != null) 'Idempotency-Key': idempotencyKey,
    };
    if (authenticated) {
      final token = await (tokenProvider?.call() ??
          FirebaseAuth.instance.currentUser?.getIdToken() ?? Future<String?>.value(null));
      if (token == null || token.isEmpty) throw ApiException(401, 'Please sign in and try again.');
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<http.Response> _send(Future<http.Response> Function() send,
      {bool retrySafe = false}) async {
    for (var attempt = 0; ; attempt++) {
      try { return await send().timeout(timeout); }
      on TimeoutException {
        if (!retrySafe || attempt == 2) throw ApiException(408,
            'The request timed out. Refresh its status before trying again.');
      } on http.ClientException {
        if (!retrySafe || attempt == 2) throw ApiException(503,
            'Unable to connect. Please try again.');
      }
      await Future<void>.delayed(Duration(milliseconds: 300 * (attempt + 1)));
    }
  }

  Future<dynamic> get(String path, {Map<String, String>? queryParameters,
      bool authenticated = true}) async {
    final uid = authenticated && tokenProvider == null ? FirebaseAuth.instance.currentUser?.uid : null;
    final headers = await _headers(authenticated: authenticated);
    _assertSession(uid, authenticated);
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: queryParameters);
    final response = await _send(() => _inner.get(uri, headers: headers), retrySafe: true);
    _assertSession(uid, authenticated);
    return _response(response);
  }
  Future<dynamic> post(String path, {dynamic body, String? idempotencyKey,
      bool authenticated = true}) async => _mutate('POST', path, body,
          idempotencyKey: idempotencyKey, authenticated: authenticated);
  Future<dynamic> put(String path, {dynamic body}) async => _mutate('PUT', path, body);
  Future<dynamic> patch(String path, {dynamic body}) async => _mutate('PATCH', path, body);
  Future<dynamic> delete(String path, {dynamic body}) async => _mutate('DELETE', path, body);

  Future<dynamic> _mutate(String method, String path, dynamic body,
      {String? idempotencyKey, bool authenticated = true}) async {
    final uid = authenticated && tokenProvider == null ? FirebaseAuth.instance.currentUser?.uid : null;
    final headers = await _headers(authenticated: authenticated, idempotencyKey: idempotencyKey);
    _assertSession(uid, authenticated);
    final uri = Uri.parse('$baseUrl$path');
    // Never replay a mutation after an ambiguous timeout.
    final response = await _send(() {
      final encoded = body == null ? null : jsonEncode(body);
      switch (method) {
        case 'POST': return _inner.post(uri, headers: headers, body: encoded);
        case 'PUT': return _inner.put(uri, headers: headers, body: encoded);
        case 'PATCH': return _inner.patch(uri, headers: headers, body: encoded);
        default: return _inner.delete(uri, headers: headers, body: encoded);
      }
    });
    _assertSession(uid, authenticated);
    return _response(response);
  }

  void _assertSession(String? uid, bool authenticated) {
    if (authenticated && tokenProvider == null && FirebaseAuth.instance.currentUser?.uid != uid) {
      throw ApiException(409, 'Your account changed. Please try again.');
    }
  }

  dynamic _response(http.Response response) {
    dynamic data;
    if (response.body.isNotEmpty) {
      try { data = jsonDecode(response.body); } on FormatException {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          throw ApiException(502, 'The server returned an invalid response.');
        }
      }
    }
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (data is Map && data['success'] == false) {
        throw ApiException(response.statusCode, data['message']?.toString() ?? 'The request was rejected.');
      }
      return data;
    }
    final raw = data is Map ? data['message'] ?? data['error'] : null;
    final message = raw is List ? raw.join(', ') : raw?.toString();
    throw ApiException(response.statusCode,
        message?.isNotEmpty == true ? message! : 'Request failed (${response.statusCode}).');
  }
  void close() => _inner.close();
}

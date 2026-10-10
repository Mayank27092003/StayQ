import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:stay_q/services/api/api_client.dart';

ApiClient clientWith(http.Client transport, {String? token = 'test-token'}) =>
    ApiClient(baseUrl: 'https://example.invalid/api', client: transport,
      tokenProvider: () async => token);

void main() {
  test('GET retries transport failures and preserves authentication', () async {
    var calls = 0;
    final client = clientWith(MockClient((request) async {
      calls++;
      expect(request.headers['Authorization'], 'Bearer test-token');
      if (calls < 3) throw http.ClientException('connection dropped');
      return http.Response('{"value":42}', 200);
    }));
    addTearDown(client.close);
    expect(await client.get('/read'), {'value': 42});
    expect(calls, 3);
  });

  for (final verb in ['POST', 'PUT', 'PATCH', 'DELETE']) {
    test('$verb is never retried after an ambiguous connection failure', () async {
      var calls = 0;
      final client = clientWith(MockClient((request) async {
        calls++;
        expect(request.method, verb);
        throw http.ClientException('response lost after request reached server');
      }));
      addTearDown(client.close);
      final Future<dynamic> request;
      switch (verb) {
        case 'POST': request = client.post('/write', body: {'value': 1}); break;
        case 'PUT': request = client.put('/write', body: {'value': 1}); break;
        case 'PATCH': request = client.patch('/write', body: {'value': 1}); break;
        default: request = client.delete('/write');
      }
      await expectLater(request, throwsA(isA<ApiException>()));
      expect(calls, 1);
    });
  }

  test('a successful HTTP status cannot override a rejected operation', () async {
    final client = clientWith(MockClient((_) async =>
      http.Response('{"success":false,"message":"Rejected"}', 200)));
    addTearDown(client.close);
    await expectLater(client.post('/write'), throwsA(isA<ApiException>()
      .having((e) => e.message, 'message', 'Rejected')));
  });

  test('malformed success responses fail rather than confirm a write', () async {
    final client = clientWith(MockClient((_) async => http.Response('<html>', 200)));
    addTearDown(client.close);
    await expectLater(client.post('/write'), throwsA(isA<ApiException>()
      .having((e) => e.statusCode, 'status', 502)));
  });

  test('204 deletion is accepted without trying to decode an empty body', () async {
    final client = clientWith(MockClient((_) async => http.Response('', 204)));
    addTearDown(client.close);
    expect(await client.delete('/account'), isNull);
  });

  test('missing credentials prevent authenticated requests from being sent', () async {
    var calls = 0;
    final client = clientWith(MockClient((_) async {
      calls++; return http.Response('{}', 200);
    }), token: null);
    addTearDown(client.close);
    await expectLater(client.get('/private'), throwsA(isA<ApiException>()
      .having((e) => e.statusCode, 'status', 401)));
    expect(calls, 0);
    await client.get('/public', authenticated: false);
    expect(calls, 1);
  });

  test('order retries can carry the same explicit idempotency identity', () async {
    final requests = <http.Request>[];
    final client = clientWith(MockClient((request) async {
      requests.add(request); return http.Response('{"id":"order-1"}', 201);
    }));
    addTearDown(client.close);
    for (var i = 0; i < 2; i++) {
      await client.post('/orders', body: {'bookingId': 'booking-1'},
        idempotencyKey: 'payment:booking-1');
    }
    expect(requests.map((r) => r.headers['Idempotency-Key']),
      everyElement('payment:booking-1'));
    expect(jsonDecode(requests.first.body), {'bookingId': 'booking-1'});
  });
}

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:stay_q/services/api/api_client.dart';
import 'package:stay_q/services/email_verification_service.dart';

void main() {
  for (final otp in ['123456', '000000']) {
    test('legacy fixed OTP $otp still requires acceptance by the server', () async {
      var calls = 0;
      final client = ApiClient(baseUrl: 'https://example.invalid', tokenProvider: () async => 'token',
        client: MockClient((request) async {
          calls++; expect(request.url.path, '/auth/verify-email-otp');
          return http.Response('{"success":false,"message":"Invalid code"}', 400);
        }));
      addTearDown(client.close);
      final result = await EmailVerificationService.verifyOtp('a@example.invalid', otp, client: client);
      expect(result['success'], isFalse); expect(calls, 1);
    });
  }
  test('transport failures cannot verify email ownership', () async {
    final client = ApiClient(baseUrl: 'https://example.invalid', tokenProvider: () async => 'token',
      client: MockClient((_) async { throw http.ClientException('offline'); }));
    addTearDown(client.close);
    expect((await EmailVerificationService.verifyOtp('a@example.invalid', '876543', client: client))['success'], isFalse);
  });
}

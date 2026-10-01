import 'api_client.dart';

class VerificationApi {
  final ApiClient _client;

  VerificationApi(this._client);

  /// 1. Bank Account Penny Drop Verification (For Host Payout or Guest Refund)
  Future<Map<String, dynamic>> verifyBankAccount({
    required String accountNumber,
    required String ifsc,
    String? name,
    String? phone,
    bool? isHost,
  }) async {
    final response = await _client.post(
      '/verification/bank-account',
      body: {
        'accountNumber': accountNumber,
        'ifsc': ifsc.toUpperCase(),
        if (name != null) 'name': name,
        if (phone != null) 'phone': phone,
        if (isHost != null) 'isHost': isHost,
      },
    );
    return response as Map<String, dynamic>;
  }

  /// 2. Aadhaar OKYC — Generate OTP
  Future<Map<String, dynamic>> generateAadhaarOtp({
    required String aadhaarNumber,
  }) async {
    final response = await _client.post(
      '/verification/aadhaar/generate-otp',
      body: {
        'aadhaarNumber': aadhaarNumber,
      },
    );
    return response as Map<String, dynamic>;
  }

  /// 3. Aadhaar OKYC — Verify OTP
  Future<Map<String, dynamic>> verifyAadhaarOtp({
    required String referenceId,
    required String otp,
  }) async {
    final response = await _client.post(
      '/verification/aadhaar/verify-otp',
      body: {
        'referenceId': referenceId,
        'otp': otp,
      },
    );
    return response as Map<String, dynamic>;
  }

  /// 4. PAN Card Verification
  Future<Map<String, dynamic>> verifyPan({
    required String pan,
    String? name,
  }) async {
    final response = await _client.post(
      '/verification/pan',
      body: {
        'pan': pan.toUpperCase(),
        if (name != null) 'name': name,
      },
    );
    return response as Map<String, dynamic>;
  }

  /// 5. UPI ID Verification
  Future<Map<String, dynamic>> verifyUpi({
    required String vpa,
    String? name,
  }) async {
    final response = await _client.post(
      '/verification/upi',
      body: {
        'vpa': vpa.toLowerCase(),
        if (name != null) 'name': name,
      },
    );
    return response as Map<String, dynamic>;
  }

  /// 6. Guest Instant Refund Account Verification
  Future<Map<String, dynamic>> verifyGuestRefundAccount({
    String? accountNumber,
    String? ifsc,
    String? upiId,
    String? accountHolderName,
  }) async {
    final response = await _client.post(
      '/verification/guest-refund-account',
      body: {
        if (accountNumber != null) 'accountNumber': accountNumber,
        if (ifsc != null) 'ifsc': ifsc.toUpperCase(),
        if (upiId != null) 'upiId': upiId,
        if (accountHolderName != null) 'accountHolderName': accountHolderName,
      },
    );
    return response as Map<String, dynamic>;
  }

  /// 7. Current User Verification Status
  Future<Map<String, dynamic>> getVerificationStatus() async {
    final response = await _client.get('/verification/status');
    return response as Map<String, dynamic>;
  }

  /// 8. Face Match — Live Selfie vs ID Card (Cashfree SecureID)
  Future<Map<String, dynamic>> verifyFaceMatch({
    required String selfieImageUrl,
    required String idCardImageUrl,
    double threshold = 0.6,
    String? userId,
  }) async {
    final response = await _client.post(
      '/verification/face-match',
      body: {
        'selfieImageUrl': selfieImageUrl,
        'idCardImageUrl': idCardImageUrl,
        'threshold': threshold,
        if (userId != null) 'userId': userId,
      },
    );
    return response as Map<String, dynamic>;
  }

  /// 9. Cashfree Face Liveness Check (Single-image real human anti-spoofing)
  Future<Map<String, dynamic>> verifyFaceLiveness({
    String? imageUrl,
    String? imageBase64,
    String? verificationId,
    String? userId,
  }) async {
    final response = await _client.post(
      '/verification/face-liveness',
      body: {
        if (imageUrl != null) 'imageUrl': imageUrl,
        if (imageBase64 != null) 'imageBase64': imageBase64,
        if (verificationId != null) 'verificationId': verificationId,
        if (userId != null) 'userId': userId,
      },
    );
    return response as Map<String, dynamic>;
  }
}

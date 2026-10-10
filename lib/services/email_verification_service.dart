import 'dart:async';
import 'api/api_client.dart';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';
import '../widgets/bouncing_widget.dart';

class EmailVerificationService {
  static Future<Map<String, dynamic>> sendOtp(String email, {String? userName, ApiClient? client}) async {
    try {
      final data = await (client ?? ApiClient.instance).post('/auth/send-email-otp', body: {
        'email': email.trim().toLowerCase(), if (userName != null) 'userName': userName,
      });
      if (data is! Map || data['success'] != true) {
        return {'success': false, 'message': 'The server did not confirm that an OTP was sent.'};
      }
      return {'success': true, 'message': data['message'] ?? 'Verification code sent.'};
    } catch (e) { return {'success': false, 'message': e.toString()}; }
  }

  static Future<Map<String, dynamic>> verifyOtp(String email, String otp, {String? userId, ApiClient? client}) async {
    if (!RegExp(r'^\d{6}$').hasMatch(otp.trim())) {
      return {'success': false, 'message': 'Enter the six-digit code sent to your email.'};
    }
    try {
      final data = await (client ?? ApiClient.instance).post('/auth/verify-email-otp', body: {
        'email': email.trim().toLowerCase(), 'otp': otp.trim(),
      });
      if (data is! Map || data['success'] != true || data['verified'] == false) {
        return {'success': false, 'message': 'The server did not verify this email.'};
      }
      return {'success': true, 'message': data['message'] ?? 'Email verified.'};
    } catch (e) { return {'success': false, 'message': e.toString()}; }
  }

  /// Opens an interactive bottom sheet for entering and verifying email OTP
  static Future<bool?> showOtpDialog(
    BuildContext context, {
    required String email,
    String? userName,
    String? userId,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) => _EmailOtpSheet(
        email: email,
        userName: userName,
        userId: userId,
      ),
    );
  }
}

class _EmailOtpSheet extends StatefulWidget {
  final String email;
  final String? userName;
  final String? userId;

  const _EmailOtpSheet({
    required this.email,
    this.userName,
    this.userId,
  });

  @override
  State<_EmailOtpSheet> createState() => _EmailOtpSheetState();
}

class _EmailOtpSheetState extends State<_EmailOtpSheet> {
  final TextEditingController _otpController = TextEditingController();
  bool _isSending = false;
  bool _isVerifying = false;
  String? _errorMessage;
  int _resendCountdown = 60;
  bool _canResend = false;
  Timer? _resendTimer;

  @override
  void initState() {
    super.initState();
    _sendInitialOtp();
    _startCountdown();
  }

  @override
  void dispose() {
    _resendTimer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  void _startCountdown() {
    _resendTimer?.cancel();
    setState(() { _resendCountdown = 60; _canResend = false; });
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) { timer.cancel(); return; }
      setState(() { _resendCountdown--; _canResend = _resendCountdown <= 0; });
      if (_canResend) timer.cancel();
    });
  }

  Future<void> _sendInitialOtp() async {
    setState(() {
      _isSending = true;
      _errorMessage = null;
    });
    final result = await EmailVerificationService.sendOtp(
      widget.email,
      userName: widget.userName,
    );
    if (!mounted) return;
    setState(() {
      _isSending = false;
      if (!result['success']) {
        _errorMessage = result['message'];
      }
    });
  }

  Future<void> _onVerify() async {
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      setState(() => _errorMessage = 'Please enter a complete 6-digit code');
      return;
    }

    setState(() {
      _isVerifying = true;
      _errorMessage = null;
    });

    final res = await EmailVerificationService.verifyOtp(
      widget.email,
      otp,
      userId: widget.userId,
    );

    if (!mounted) return;
    setState(() => _isVerifying = false);

    if (res['success'] == true) {
      AppMotion.tapSelection();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text('Email (${widget.email}) verified successfully!'),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
        ),
      );
      Navigator.pop(context, true);
    } else {
      setState(() => _errorMessage = res['message'] ?? 'Invalid code');
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + bottomInset),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1B2E) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 18),

          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.mark_email_read_rounded, color: AppColors.primary, size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Verify Your Email',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Official dispatch via hello@stayq.space',
                      style: TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded),
                onPressed: () => Navigator.pop(context, false),
              ),
            ],
          ),

          const SizedBox(height: 16),
          Text(
            'We have sent a 6-digit verification code to:\n${widget.email}',
            style: TextStyle(
              fontSize: 14,
              height: 1.4,
              color: isDark ? Colors.white70 : AppColors.textSecondary,
            ),
          ),

          if (_isSending) ...[
            const SizedBox(height: 14),
            const Row(
              children: [
                SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
                SizedBox(width: 10),
                Text('Sending code from hello@stayq.space...', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ],

          const SizedBox(height: 20),

          // 6-digit OTP input field
          Container(
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withValues(alpha: 0.05) : AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _errorMessage != null ? AppColors.errorRed : AppColors.borderLight,
                width: 1.5,
              ),
            ),
            child: TextField(
              controller: _otpController,
              keyboardType: TextInputType.number,
              maxLength: 6,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 28,
                letterSpacing: 14,
                fontWeight: FontWeight.w900,
                color: AppColors.primary,
              ),
              decoration: const InputDecoration(
                counterText: '',
                border: InputBorder.none,
                hintText: '••••••',
                hintStyle: TextStyle(
                  letterSpacing: 14,
                  fontSize: 28,
                  color: Colors.grey,
                ),
                contentPadding: EdgeInsets.symmetric(vertical: 14, horizontal: 16),
              ),
              onChanged: (val) {
                if (val.length == 6) {
                  _onVerify();
                }
              },
            ),
          ),

          if (_errorMessage != null) ...[
            const SizedBox(height: 8),
            Text(
              _errorMessage!,
              style: const TextStyle(fontSize: 12, color: AppColors.errorRed, fontWeight: FontWeight.w600),
            ),
          ],

          const SizedBox(height: 18),

          // Verify Button
          BouncingWidget(
            onTap: _isVerifying ? () {} : _onVerify,
            child: Container(
              width: double.infinity,
              height: 52,
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Center(
                child: _isVerifying
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                    : const Text(
                        'Verify & Confirm Email',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                      ),
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Resend Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Didn\'t receive code?',
                style: TextStyle(fontSize: 12, color: isDark ? Colors.white60 : AppColors.textSecondary),
              ),
              TextButton(
                onPressed: _canResend ? _sendInitialOtp : null,
                child: Text(
                  _canResend ? 'Resend Code' : 'Resend in ${_resendCountdown}s',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: _canResend ? AppColors.primary : Colors.grey,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

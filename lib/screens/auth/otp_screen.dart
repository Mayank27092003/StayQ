import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:pinput/pinput.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../navigation/app_router.dart';
import '../../widgets/custom_toast.dart';

class OtpScreen extends StatefulWidget {
  const OtpScreen({super.key});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final TextEditingController _otpController = TextEditingController();
  Timer? _countdownTimer;
  int _secondsRemaining = 30;
  bool _canResend = false;

  @override
  void initState() {
    super.initState();
    _startCountdownTimer();
  }

  void _startCountdownTimer() {
    _countdownTimer?.cancel();
    setState(() {
      _secondsRemaining = 30;
      _canResend = false;
    });
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_secondsRemaining > 1) {
        setState(() {
          _secondsRemaining--;
        });
      } else {
        timer.cancel();
        setState(() {
          _secondsRemaining = 0;
          _canResend = true;
        });
      }
    });
  }

  Future<void> _handleSuccess(AppProvider provider) async {
    final complete = await provider.checkProfileComplete();
    if (!mounted) return;
    Navigator.pushNamedAndRemoveUntil(
      context,
      complete ? AppRoutes.mainShell : AppRoutes.completeProfile,
      (_) => false,
    );
  }

  void _verifyOTP(String code) async {
    final provider = context.read<AppProvider>();
    try {
      final success = await provider.verifyOTP(code);
      if (!mounted) return;
      if (success) {
        await _handleSuccess(provider);
      }
    } catch (e) {
      if (!mounted) return;
      CustomToast.show(context: context, message: e.toString(), isError: true);
      _otpController.clear();
    }
  }

  void _resendOTP() {
    if (!_canResend) return;
    final provider = context.read<AppProvider>();
    final phone = provider.userPhone;
    if (phone.isEmpty) {
      CustomToast.show(context: context, message: 'Mobile number unavailable. Please go back.', isError: true);
      return;
    }

    _startCountdownTimer();
    provider.verifyPhoneNumber(
      phone,
      onCodeSent: () {
        if (!mounted) return;
        CustomToast.show(context: context, message: 'New 6-digit verification code sent via SMS!', isError: false);
      },
      onVerified: () async {
        final complete = await provider.checkProfileComplete();
        if (!mounted) return;
        Navigator.pushNamedAndRemoveUntil(
          context,
          complete ? AppRoutes.mainShell : AppRoutes.completeProfile,
          (_) => false,
        );
      },
      onError: (err) {
        if (!mounted) return;
        CustomToast.show(context: context, message: err, isError: true);
      },
    );
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final isDark = AppColors.isDark(context);

    final defaultPinTheme = PinTheme(
      width: 54,
      height: 64,
      textStyle: TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: AppColors.text(context),
      ),
      decoration: BoxDecoration(
        color: AppColors.surface(context),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border(context)),
      ),
    );

    final phoneDisplay = provider.userPhone.isNotEmpty ? provider.userPhone : 'your phone number';

    return Scaffold(
      backgroundColor: AppColors.bg(context),
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: IconThemeData(color: AppColors.text(context)),
      ),
      body: Stack(
        children: [
          // Background Gradient matching gateway
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    isDark ? const Color(0xFF1E1035) : AppColors.primaryDark,
                    AppColors.bg(context),
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.center,
                ),
              ),
            ),
          ),
          SafeArea(
            child: SingleChildScrollView(
              physics: const ClampingScrollPhysics(),
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Image.asset(
                      'assets/images/logo_sq.png',
                      height: 80,
                    ).animate().fadeIn(duration: 800.ms).scale(delay: 100.ms),
                  ),
                  const SizedBox(height: 32),
                  Text(
                    "Enter verification code",
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.text(context)),
                  ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.2),
                  const SizedBox(height: 12),
                  Text(
                    "We sent a 6-digit code to $phoneDisplay",
                    style: TextStyle(fontSize: 14, color: AppColors.textSub(context)),
                  ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2),
                  const SizedBox(height: 40),
                  
                  Center(
                    child: Pinput(
                      controller: _otpController,
                      length: 6,
                      defaultPinTheme: defaultPinTheme,
                      focusedPinTheme: defaultPinTheme.copyDecorationWith(
                        border: Border.all(color: AppColors.primary, width: 2),
                      ),
                      submittedPinTheme: defaultPinTheme.copyDecorationWith(
                        border: Border.all(color: AppColors.primary.withValues(alpha: 0.6)),
                      ),
                      hapticFeedbackType: HapticFeedbackType.lightImpact,
                      onCompleted: _verifyOTP,
                      autofocus: true,
                      pinputAutovalidateMode: PinputAutovalidateMode.onSubmit,
                      showCursor: true,
                    ).animate().fadeIn(delay: 400.ms).scale(),
                  ),
                  
                  const SizedBox(height: 32),
                  
                  if (provider.isLoadingAuth)
                    const Center(child: CircularProgressIndicator(color: AppColors.primary))
                  else ...[
                    // Countdown timer and Resend OTP row
                    Center(
                      child: _canResend
                          ? TextButton.icon(
                              onPressed: _resendOTP,
                              icon: const Icon(Icons.refresh_rounded, size: 18, color: AppColors.primary),
                              label: const Text(
                                "Resend 6-Digit OTP",
                                style: TextStyle(
                                  fontSize: 15,
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.timer_outlined, size: 16, color: AppColors.textSub(context)),
                                const SizedBox(width: 6),
                                Text(
                                  "Resend code in ${_secondsRemaining}s",
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: AppColors.textSub(context),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                    ).animate().fadeIn(delay: 600.ms),
                    
                    const SizedBox(height: 12),
                    
                    Center(
                      child: TextButton(
                        onPressed: () {
                          Navigator.pop(context);
                        },
                        child: Text(
                          "Wrong number? Edit phone",
                          style: TextStyle(
                            fontSize: 13,
                            color: AppColors.textSub(context),
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}


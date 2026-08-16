import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../host/onboarding/host_onboarding_screen.dart';
import 'package:provider/provider.dart';
import 'package:pinput/pinput.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../navigation/app_router.dart';
import '../../widgets/custom_toast.dart';

class OtpScreen extends StatefulWidget {
  const OtpScreen({Key? key}) : super(key: key);

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final TextEditingController _otpController = TextEditingController();

  void _verifyOTP(String code) async {
    final provider = context.read<AppProvider>();
    try {
      final success = await provider.verifyOTP(code);
      if (!mounted) return;
      if (success) {
        final isComplete = await provider.checkProfileComplete();
        if (!mounted) return;
        if (provider.isHostMode) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const HostOnboardingScreen()),
          );
        } else if (isComplete) {
          Navigator.pushNamedAndRemoveUntil(context, AppRoutes.mainShell, (route) => false);
        } else {
          Navigator.pushNamedAndRemoveUntil(context, AppRoutes.completeProfile, (route) => false);
        }
      }
    } catch (e) {
      if (!mounted) return;
      CustomToast.show(context: context, message: e.toString(), isError: true);
      _otpController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();

    final defaultPinTheme = PinTheme(
      width: 56,
      height: 64,
      textStyle: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight),
      ),
    );

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: Stack(
        children: [
          // Background Gradient matching gateway
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primaryDark, AppColors.background],
                  begin: Alignment.topCenter,
                  end: Alignment.center, // End at center so bottom is standard background
                ),
              ),
            ),
          ),
          SafeArea(
            child: Padding(
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
                  const Text(
                    "Enter verification code",
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.2),
                  const SizedBox(height: 12),
                  const Text(
                    "We sent it to your phone number.",
                    style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
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
                      onCompleted: _verifyOTP,
                      autofocus: true,
                      pinputAutovalidateMode: PinputAutovalidateMode.onSubmit,
                      showCursor: true,
                    ).animate().fadeIn(delay: 400.ms).scale(),
                  ),
                  
                  const SizedBox(height: 40),
                  
                  if (provider.isLoadingAuth)
                    const Center(child: CircularProgressIndicator())
                  else
                    Center(
                      child: TextButton(
                        onPressed: () {
                          // Trigger resend via provider if needed
                          Navigator.pop(context);
                        },
                        child: const Text("Didn't receive the code? Go back", style: TextStyle(fontSize: 14, color: AppColors.primary, fontWeight: FontWeight.bold)),
                      ).animate().fadeIn(delay: 600.ms),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}


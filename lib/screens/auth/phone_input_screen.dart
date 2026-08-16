import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:intl_phone_field/intl_phone_field.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../navigation/app_router.dart';
import '../../widgets/custom_toast.dart';

class PhoneInputScreen extends StatefulWidget {
  const PhoneInputScreen({Key? key}) : super(key: key);

  @override
  State<PhoneInputScreen> createState() => _PhoneInputScreenState();
}

class _PhoneInputScreenState extends State<PhoneInputScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  String _fullNumber = '';

  void _sendOTP() {
    if (_formKey.currentState!.validate() && _fullNumber.isNotEmpty) {
      final provider = context.read<AppProvider>();
      
      provider.verifyPhoneNumber(
        _fullNumber,
        onCodeSent: () {
          Navigator.pushNamed(context, AppRoutes.otpVerify);
        },
        onError: (error) {
          CustomToast.show(context: context, message: error, isError: true);
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();

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
              child: Form(
                key: _formKey,
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
                      "What's your number?",
                      style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.2),
                    const SizedBox(height: 12),
                    const Text(
                      "We'll send you a verification code.",
                      style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2),
                    const SizedBox(height: 40),
                    
                    IntlPhoneField(
                      controller: _phoneController,
                      decoration: InputDecoration(
                        hintText: 'Phone Number',
                        hintStyle: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textSecondary.withValues(alpha: 0.5)),
                        filled: true,
                        fillColor: AppColors.surfaceLight,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.borderLight)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.borderLight)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primary)),
                      ),
                      initialCountryCode: 'IN', // Default to India but they can change it
                      dropdownIconPosition: IconPosition.trailing,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary, letterSpacing: 2),
                      dropdownTextStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      onChanged: (phone) {
                        _fullNumber = phone.completeNumber;
                      },
                    ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.2),
                    
                    const Spacer(),
                    
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: provider.isLoadingAuth ? null : _sendOTP,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: provider.isLoadingAuth
                            ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white))
                            : const Text('Continue', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.2),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}


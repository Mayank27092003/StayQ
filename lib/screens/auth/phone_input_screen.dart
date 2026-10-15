import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:intl_phone_field/intl_phone_field.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../navigation/app_router.dart';
import '../../widgets/custom_toast.dart';

class PhoneInputScreen extends StatefulWidget {
  const PhoneInputScreen({super.key});

  @override
  State<PhoneInputScreen> createState() => _PhoneInputScreenState();
}

class _PhoneInputScreenState extends State<PhoneInputScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  String _countryCode = '+91';
  String _fullNumber = '';

  void _sendOTP() {
    if (!_formKey.currentState!.validate()) return;

    final cleanDigits = _phoneController.text.replaceAll(RegExp(r'\D'), '');
    if (_countryCode == '+91' && cleanDigits.length != 10) {
      CustomToast.show(context: context, message: 'Please enter a valid 10-digit mobile number', isError: true);
      return;
    }

    final targetNumber = _fullNumber.isNotEmpty
        ? _fullNumber
        : '$_countryCode$cleanDigits';

    final provider = context.read<AppProvider>();
    
    provider.verifyPhoneNumber(
      targetNumber,
      onCodeSent: () {
        if (!mounted) return;
        Navigator.pushNamed(context, AppRoutes.otpVerify);
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
      onError: (error) {
        if (!mounted) return;
        CustomToast.show(context: context, message: error, isError: true);
      },
    );
  }

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final isDark = AppColors.isDark(context);

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
                    Text(
                      "What's your number?",
                      style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.text(context)),
                    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.2),
                    const SizedBox(height: 12),
                    Text(
                      "We'll send you a 6-digit verification code.",
                      style: TextStyle(fontSize: 14, color: AppColors.textSub(context)),
                    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2),
                    const SizedBox(height: 40),
                    
                    IntlPhoneField(
                      controller: _phoneController,
                      decoration: InputDecoration(
                        hintText: '10-digit Mobile Number',
                        hintStyle: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSub(context).withValues(alpha: 0.5),
                        ),
                        filled: true,
                        fillColor: AppColors.surface(context),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: AppColors.border(context)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: AppColors.border(context)),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: const BorderSide(color: AppColors.primary, width: 2),
                        ),
                      ),
                      initialCountryCode: 'IN',
                      dropdownIconPosition: IconPosition.trailing,
                      dropdownIcon: Icon(Icons.arrow_drop_down, color: AppColors.text(context)),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.text(context),
                        letterSpacing: 2,
                      ),
                      dropdownTextStyle: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.text(context),
                      ),
                      validator: (phone) {
                        if (phone == null || phone.number.trim().isEmpty) {
                          return 'Please enter your mobile number';
                        }
                        final clean = phone.number.replaceAll(RegExp(r'\D'), '');
                        if (phone.countryISOCode == 'IN') {
                          if (clean.length != 10) {
                            return 'Enter a valid 10-digit mobile number';
                          }
                          if (!RegExp(r'^[6-9]').hasMatch(clean)) {
                            return 'Mobile number must start with 6, 7, 8, or 9';
                          }
                        } else if (clean.length < 7 || clean.length > 15) {
                          return 'Enter a valid phone number';
                        }
                        return null;
                      },
                      onCountryChanged: (country) {
                        setState(() {
                          _countryCode = '+${country.dialCode}';
                        });
                      },
                      onChanged: (phone) {
                        _fullNumber = phone.completeNumber;
                        _countryCode = '+${phone.countryCode}';
                      },
                    ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.2),
                    
                    const SizedBox(height: 32),
                    
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
                            ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
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


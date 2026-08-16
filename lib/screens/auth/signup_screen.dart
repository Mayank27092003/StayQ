import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../host/onboarding/host_onboarding_screen.dart';
import 'location_permission_screen.dart';

class SignUpScreen extends StatefulWidget {
  final bool isHostSignUp;

  const SignUpScreen({super.key, this.isHostSignUp = false});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _acceptTerms = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(widget.isHostSignUp ? 'Host Registration' : 'Create Account'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
              Text(
                widget.isHostSignUp ? 'Become a Stay Q Host' : 'Join Stay Q Today',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                widget.isHostSignUp
                    ? 'Start earning by hosting your unique space with 24/7 host protection.'
                    : 'Unlock exclusive member rates, instant booking, and curated stays.',
                style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 28),

              // Full Name
              const Text('Full Name', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameController,
                decoration: _inputDecoration('John Doe', Icons.person_outline_rounded),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) return 'Name is required';
                  return null;
                },
              ),

              const SizedBox(height: 18),

              // Email
              const Text('Email Address', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: _inputDecoration('name@example.com', Icons.email_outlined),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) return 'Email is required';
                  if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) return 'Enter a valid email';
                  return null;
                },
              ),

              const SizedBox(height: 18),

              // Phone Number
              const Text('Phone Number', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: _inputDecoration('+91 98765 43210', Icons.phone_outlined),
              ),

              const SizedBox(height: 18),

              // Password
              const Text('Password', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _passwordController,
                obscureText: true,
                decoration: _inputDecoration('Minimum 8 characters', Icons.lock_outline_rounded),
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Password is required';
                  if (value.length < 8) return 'Password must be at least 8 characters';
                  return null;
                },
              ),

              const SizedBox(height: 20),

              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  SizedBox(
                    height: 24,
                    width: 24,
                    child: Checkbox(
                      value: _acceptTerms,
                      activeColor: AppColors.primary,
                      onChanged: (val) => setState(() => _acceptTerms = val ?? true),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        children: [
                          const TextSpan(text: 'I agree to Stay Q\'s '),
                          TextSpan(
                            text: 'Terms of Service',
                            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                            recognizer: TapGestureRecognizer()..onTap = () {
                              launchUrl(Uri.parse('https://stayq.in/terms'));
                            },
                          ),
                          const TextSpan(text: ' and '),
                          TextSpan(
                            text: 'Privacy Policy',
                            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                            recognizer: TapGestureRecognizer()..onTap = () {
                              launchUrl(Uri.parse('https://stayq.in/privacy'));
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 32),

              ElevatedButton(
                onPressed: () {
                  if (!_formKey.currentState!.validate()) return;
                  if (!_acceptTerms) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('You must accept the terms and conditions')),
                    );
                    return;
                  }
                  
                  final provider = Provider.of<AppProvider>(context, listen: false);
                  provider.signUp(
                    _nameController.text.trim(),
                    _emailController.text.trim(),
                    _passwordController.text,
                  );

                  if (widget.isHostSignUp) {
                    if (!provider.isHostMode) provider.toggleHostMode();
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(builder: (_) => const HostOnboardingScreen()),
                    );
                  } else {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(builder: (_) => const LocationPermissionScreen()),
                    );
                  }
                },
                child: Text(widget.isHostSignUp ? 'Create Host Account' : 'Agree & Create Account'),
              ),
            ],
          ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint, IconData icon) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon, color: AppColors.textMuted),
      filled: true,
      fillColor: AppColors.surfaceLight,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide.none,
      ),
    );
  }
}

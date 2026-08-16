import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';

class HostAccountSetupScreen extends StatefulWidget {
  const HostAccountSetupScreen({Key? key}) : super(key: key);

  @override
  State<HostAccountSetupScreen> createState() => _HostAccountSetupScreenState();
}

class _HostAccountSetupScreenState extends State<HostAccountSetupScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);

    // Pre-fill from Firebase if available
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      if (provider.email.isEmpty && user.email != null) {
        provider.email = user.email!;
      }
      if (provider.phone.isEmpty && user.phoneNumber != null) {
        provider.phone = user.phoneNumber!;
      }
      if (provider.firstName.isEmpty && user.displayName != null) {
        final names = user.displayName!.split(' ');
        provider.firstName = names.first;
        if (names.length > 1) {
          provider.lastName = names.sublist(1).join(' ');
        }
      }
    }

    _firstNameController = TextEditingController(text: provider.firstName);
    _lastNameController = TextEditingController(text: provider.lastName);
    _emailController = TextEditingController(text: provider.email);
    _phoneController = TextEditingController(text: provider.phone);

    _firstNameController.addListener(_updateProvider);
    _lastNameController.addListener(_updateProvider);
    _emailController.addListener(_updateProvider);
    _phoneController.addListener(_updateProvider);
  }

  void _updateProvider() {
    Provider.of<HostOnboardingProvider>(context, listen: false).updateAccount(
      _firstNameController.text,
      _lastNameController.text,
      _emailController.text,
      _phoneController.text,
    );
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Widget _buildTextField(
    String label, 
    TextEditingController controller, 
    {TextInputType type = TextInputType.text, String? Function(String?)? validator}
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            controller: controller,
            keyboardType: type,
            validator: validator,
            autovalidateMode: AutovalidateMode.onUserInteraction,
            decoration: InputDecoration(
              filled: true,
              fillColor: AppColors.surfaceLight,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.borderLight),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.borderLight),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
          ),
        ],
      ),
    ).animate().fade(duration: 400.ms).slideY(begin: 0.1, end: 0);
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Account Setup',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 8),
          const Text(
            'Let\'s start with your basic information.',
            style: TextStyle(
              fontSize: 16,
              color: AppColors.textSecondary,
            ),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 32),
          Form(
            key: _formKey,
            child: Column(
              children: [
                _buildTextField(
                  'First Name', 
                  _firstNameController,
                  validator: (value) => (value == null || value.trim().isEmpty) ? 'First name is required' : null,
                ),
                _buildTextField(
                  'Last Name', 
                  _lastNameController,
                  validator: (value) => (value == null || value.trim().isEmpty) ? 'Last name is required' : null,
                ),
                _buildTextField(
                  'Email', 
                  _emailController, 
                  type: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) return 'Email is required';
                    if (!RegExp(r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+").hasMatch(value)) {
                      return 'Enter a valid email';
                    }
                    return null;
                  },
                ),
                _buildTextField(
                  'Phone Number', 
                  _phoneController, 
                  type: TextInputType.phone,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) return 'Phone number is required';
                    if (!RegExp(r'^\+?[0-9]{10,15}$').hasMatch(value)) {
                      return 'Enter a valid phone number (digits only)';
                    }
                    return null;
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

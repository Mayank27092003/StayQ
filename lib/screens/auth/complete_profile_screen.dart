import 'dart:ui';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:intl_phone_field/intl_phone_field.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../navigation/app_router.dart';

class CompleteProfileScreen extends StatefulWidget {
  const CompleteProfileScreen({Key? key}) : super(key: key);

  @override
  State<CompleteProfileScreen> createState() => _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends State<CompleteProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  
  bool _isEmailLocked = false;
  bool _isPhoneLocked = false;
  String _fullNumber = '';
  File? _pickedImage;

  @override
  void initState() {
    super.initState();
    final provider = context.read<AppProvider>();
    
    _nameController = TextEditingController(text: provider.userName);
    _emailController = TextEditingController(text: provider.userEmail);
    
    // Auto-fill phone if available from provider (Firebase Auth)
    String rawPhone = provider.userPhone;
    if (rawPhone.startsWith('+91')) {
      rawPhone = rawPhone.substring(3);
      _fullNumber = provider.userPhone;
    } else if (rawPhone.isNotEmpty) {
      _fullNumber = rawPhone;
    }
    _phoneController = TextEditingController(text: rawPhone); 
    
    if (_emailController.text.isNotEmpty) {
      _isEmailLocked = true;
    }
    if (_phoneController.text.isNotEmpty) {
      _isPhoneLocked = true;
    }
  }

  void _saveProfile() async {
    if (_formKey.currentState!.validate()) {
      final provider = context.read<AppProvider>();
      
      await provider.saveProfileDetails(
        name: _nameController.text.trim(),
        email: _isEmailLocked ? null : _emailController.text.trim(),
        phone: _isPhoneLocked ? null : _fullNumber,
        profileImage: _pickedImage,
      );
      
      if (!mounted) return;
      Navigator.pushNamedAndRemoveUntil(context, AppRoutes.mainShell, (route) => false);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _pickedImage = File(pickedFile.path);
      });
    }
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool isLocked = false,
    TextInputType keyboardType = TextInputType.text,
    String? Function(String?)? validator,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            spreadRadius: 1,
          )
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: TextFormField(
            controller: controller,
            readOnly: isLocked,
            keyboardType: keyboardType,
            style: TextStyle(
              fontSize: 16, 
              fontWeight: FontWeight.bold, 
              color: isLocked ? AppColors.textSecondary : AppColors.textPrimary
            ),
            decoration: InputDecoration(
              labelText: label,
              labelStyle: TextStyle(fontSize: 14, color: AppColors.textSecondary.withValues(alpha: 0.8)),
              prefixIcon: Icon(icon, color: isLocked ? Colors.green.shade400 : AppColors.primary),
              suffixIcon: isLocked ? Icon(Icons.verified_user, color: Colors.green.shade400) : null,
              filled: true,
              fillColor: Colors.transparent,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
            ),
            validator: validator,
          ),
        ),
      ),
    ).animate().fadeIn(duration: 500.ms).slideX(begin: 0.1, curve: Curves.easeOutQuad);
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false, // Force them to complete profile
      ),
      body: Stack(
        children: [
          // Background Gradient matching gateway & OTP
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primaryDark, AppColors.background],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  stops: [0.0, 0.4], // Blend gracefully into background
                ),
              ),
            ),
          ),
          
          SafeArea(
            child: CustomScrollView(
              slivers: [
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Center(
                            child: GestureDetector(
                              onTap: _pickImage,
                              child: Stack(
                                children: [
                                  Container(
                                    width: 100,
                                    height: 100,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppColors.primary.withValues(alpha: 0.2),
                                          blurRadius: 20,
                                          spreadRadius: 5,
                                        )
                                      ],
                                      image: _pickedImage != null
                                          ? DecorationImage(
                                              image: FileImage(_pickedImage!),
                                              fit: BoxFit.cover,
                                            )
                                          : null,
                                    ),
                                    child: _pickedImage == null
                                        ? const Icon(Icons.person, size: 50, color: Colors.grey)
                                        : null,
                                  ),
                                  Positioned(
                                    bottom: 0,
                                    right: 0,
                                    child: Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: const BoxDecoration(
                                        color: AppColors.primary,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
                                    ),
                                  ),
                                ],
                              ),
                            ).animate().fadeIn(duration: 800.ms).scale(delay: 200.ms, curve: Curves.easeOutBack),
                          ),
                          const SizedBox(height: 40),
                          
                          const Text(
                            "Just one more step!",
                            style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.textPrimary, height: 1.2),
                          ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.2),
                          const SizedBox(height: 12),
                          const Text(
                            "Complete your basic details to start exploring premium stays and experiences.",
                            style: TextStyle(fontSize: 16, color: AppColors.textSecondary, height: 1.5),
                          ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2),
                          const SizedBox(height: 40),
                          
                          _buildTextField(
                            controller: _nameController,
                            label: "Full Name",
                            icon: Icons.person_rounded,
                            validator: (val) => val == null || val.isEmpty ? "Please enter your name" : null,
                          ),
                          const SizedBox(height: 20),
                          
                          _buildTextField(
                            controller: _emailController,
                            label: "Email Address",
                            icon: Icons.email_rounded,
                            isLocked: _isEmailLocked,
                            keyboardType: TextInputType.emailAddress,
                            validator: (val) {
                              if (val == null || val.isEmpty) return "Please enter your email";
                              if (!val.contains('@')) return "Enter a valid email";
                              return null;
                            },
                          ),
                          const SizedBox(height: 20),
                          
                          if (_isPhoneLocked) 
                            _buildTextField(
                              controller: _phoneController,
                              label: "Phone Number",
                              icon: Icons.phone_rounded,
                              isLocked: true,
                            )
                          else
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 10,
                                    spreadRadius: 1,
                                  )
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: BackdropFilter(
                                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                                  child: Padding(
                                    padding: const EdgeInsets.only(top: 10),
                                    child: IntlPhoneField(
                                      controller: _phoneController,
                                      decoration: InputDecoration(
                                        labelText: 'Phone Number',
                                        labelStyle: TextStyle(fontSize: 14, color: AppColors.textSecondary.withValues(alpha: 0.8)),
                                        border: InputBorder.none,
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                      ),
                                      initialCountryCode: 'IN',
                                      dropdownIconPosition: IconPosition.trailing,
                                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary, letterSpacing: 2),
                                      dropdownTextStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                      onChanged: (phone) {
                                        _fullNumber = phone.completeNumber;
                                      },
                                    ),
                                  ),
                                ),
                              ),
                            ).animate().fadeIn(delay: 200.ms).slideX(begin: 0.1, curve: Curves.easeOutQuad),
                          
                          const Spacer(),
                          const SizedBox(height: 30),
                          
                          Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              gradient: const LinearGradient(
                                colors: [AppColors.primary, AppColors.primaryDark],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withValues(alpha: 0.4),
                                  blurRadius: 15,
                                  offset: const Offset(0, 5),
                                )
                              ],
                            ),
                            child: ElevatedButton(
                              onPressed: provider.isLoadingAuth ? null : _saveProfile,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                foregroundColor: Colors.white,
                                shadowColor: Colors.transparent,
                                padding: const EdgeInsets.symmetric(vertical: 18),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              child: provider.isLoadingAuth
                                  ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
                                  : const Text('Save & Continue', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1)),
                            ),
                          ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.2, curve: Curves.easeOutBack),
                          const SizedBox(height: 10),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../navigation/app_router.dart';
import 'dart:ui';

class AuthGatewayScreen extends StatelessWidget {
  const AuthGatewayScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // Background Gradient / Image
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primaryDark, AppColors.background],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),
          // Glassmorphism Content
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Spacer(),
                  // Logo 
                  Center(
                    child: Image.asset(
                      'assets/images/logo_sq.png',
                      height: 120,
                    ).animate().fadeIn(duration: 800.ms).scale(delay: 200.ms),
                  ),
                  const SizedBox(height: 40),
                  const Text(
                    'Welcome to Stay Q',
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    textAlign: TextAlign.center,
                  ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.5),
                  const SizedBox(height: 16),
                  const Text(
                    'Discover premium stays & zero-broker rentals anywhere in India.',
                    style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
                    textAlign: TextAlign.center,
                  ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.5),
                  const Spacer(),
                  
                  // Buttons
                  if (provider.isLoadingAuth)
                    const Center(child: CircularProgressIndicator())
                  else ...[
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pushNamed(context, AppRoutes.phoneInput);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 0,
                      ),
                      child: const Text('Continue with Phone', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ).animate().fadeIn(delay: 800.ms).slideY(begin: 0.5),
                    
                    const SizedBox(height: 16),
                    
                    OutlinedButton(
                      onPressed: () async {
                        final success = await provider.signInWithGoogle();
                        if (success && context.mounted) {
                          final isComplete = await provider.checkProfileComplete();
                          if (context.mounted) {
                            if (isComplete) {
                              Navigator.pushNamedAndRemoveUntil(context, AppRoutes.mainShell, (route) => false);
                            } else {
                              Navigator.pushNamedAndRemoveUntil(context, AppRoutes.completeProfile, (route) => false);
                            }
                          }
                        }
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: const BorderSide(color: AppColors.borderLight),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.g_mobiledata, color: AppColors.textPrimary, size: 28),
                          SizedBox(width: 8),
                          Text('Continue with Google', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                        ],
                      ),
                    ).animate().fadeIn(delay: 900.ms).slideY(begin: 0.5),
                  ],
                  const Spacer(),
                  // Host Login Link
                  TextButton(
                    onPressed: () {
                      if (!provider.isHostMode) {
                        provider.toggleHostMode();
                      }
                      Navigator.pushNamed(context, AppRoutes.phoneInput);
                    },
                    child: const Text(
                      'List your property on Stay Q',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ).animate().fadeIn(delay: 1000.ms).slideY(begin: 0.5),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}


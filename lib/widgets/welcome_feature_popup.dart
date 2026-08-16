import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';
import 'bouncing_widget.dart';

class WelcomeFeaturePopup {
  static void show(BuildContext context, bool isHostMode) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _WelcomePopupContent(isHostMode: isHostMode),
    );
  }
}

class _WelcomePopupContent extends StatelessWidget {
  final bool isHostMode;
  
  const _WelcomePopupContent({required this.isHostMode});

  @override
  Widget build(BuildContext context) {
    final title = isHostMode ? "Welcome to Stay Q Hosting!" : "Welcome to Stay Q!";
    final imagePath = isHostMode ? 'assets/images/host_welcome_mascot.png' : 'assets/images/user_welcome_mascot.png';
    final features = isHostMode
        ? [
            "List Hotels, RVs, Camping Sites, and Long-Term Homes.",
            "Zero Commission",
            "AI Assisted Onboarding"
          ]
        : [
            "Discover unique Stays, RVs, and Camping Sites.",
            "Plan trips with Stay Q",
            "Zero Brokerage"
          ];

    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(bottom: 24),
            decoration: BoxDecoration(
              color: Colors.grey.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Image
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: Image.asset(
              imagePath,
              height: 200,
              width: double.infinity,
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => Container(
                height: 200,
                color: AppColors.primary.withValues(alpha: 0.1),
                child: const Icon(Icons.celebration, size: 60, color: AppColors.primary),
              ),
            ),
          ).animate().fadeIn(duration: 500.ms).scale(begin: const Offset(0.9, 0.9)),
          
          const SizedBox(height: 24),
          
          // Title
          Text(
            title,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              height: 1.2,
            ),
            textAlign: TextAlign.center,
          ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0, curve: AppMotion.signatureCurve),
          
          const SizedBox(height: 24),
          
          // Features
          ...features.asMap().entries.map((entry) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.check_circle_rounded,
                      color: AppColors.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      entry.value,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn(delay: (300 + (entry.key * 100)).ms).slideX(begin: 0.1, end: 0, curve: AppMotion.signatureCurve);
          }),
          
          const SizedBox(height: 32),
          
          // Button
          BouncingWidget(
            onTap: () {
              AppMotion.tapSelection();
              Navigator.pop(context);
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(16),
              ),
              alignment: Alignment.center,
              child: const Text(
                "Let's Go!",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.2, end: 0, curve: AppMotion.signatureCurve),
        ],
      ),
    );
  }
}

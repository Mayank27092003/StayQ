import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../../../providers/app_provider.dart';
import '../../../../navigation/app_router.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';

class HostSuccessPassportScreen extends StatelessWidget {
  final String propertyTitle;
  final String city;
  final double pricePerNight;
  final VoidCallback? onGoToDashboard;

  const HostSuccessPassportScreen({
    Key? key,
    this.propertyTitle = 'Luxury Boutique Stay',
    this.city = 'Goa',
    this.pricePerNight = 12500,
    this.onGoToDashboard,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F0E17) : const Color(0xFFFAF8FF),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),

              // Animated Mascot / Verification Hourglass Icon
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF6366F1).withValues(alpha: 0.35),
                      blurRadius: 30,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: const Icon(Icons.hourglass_top_rounded, color: Colors.white, size: 52),
              ).animate().scale(duration: 600.ms, curve: Curves.elasticOut),

              const SizedBox(height: 24),

              const Text(
                'Application Under Review! ⏳',
                style: TextStyle(
                  fontSize: 25,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.5,
                ),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2),

              const SizedBox(height: 8),

              const Text(
                'Your host profile and property listing have been submitted for verification. Our Trust & Safety team is reviewing your documents.',
                style: TextStyle(fontSize: 13, height: 1.45, color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 300.ms),

              const SizedBox(height: 24),

              // Host Passport Card (Under Review State)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF2E1065), Color(0xFF4C1D95), Color(0xFF5B21B6)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF4C1D95).withValues(alpha: 0.4),
                      blurRadius: 28,
                      offset: const Offset(0, 12),
                    ),
                  ],
                  border: Border.all(color: const Color(0xFFFBBF24), width: 1.5),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Image.asset(
                              'assets/images/logo_sq.png',
                              height: 28,
                              errorBuilder: (_, __, ___) => const Icon(Icons.stars_rounded, color: Color(0xFFFBBF24)),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'STAY Q HOST PASS',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFFFBBF24),
                                letterSpacing: 1.2,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF59E0B),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.access_time_filled_rounded, color: Colors.white, size: 12),
                              SizedBox(width: 4),
                              Text(
                                'UNDER REVIEW',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Text(
                      propertyTitle,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '📍 $city • ₹${pricePerNight.toInt()} / night',
                      style: const TextStyle(fontSize: 13, color: Color(0xFFDDD6FE)),
                    ),
                    const SizedBox(height: 18),
                    const Divider(color: Colors.white24),
                    const SizedBox(height: 6),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '⏱️ Estimated Review: 2-4 Hours',
                          style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFFFDE68A)),
                        ),
                        Text(
                          'KYC Submitted',
                          style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF6EE7B7)),
                        ),
                      ],
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.2).shimmer(duration: 1200.ms, delay: 800.ms),

              const Spacer(),

              // Go to Dashboard CTA
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    AppMotion.tapHeavy();
                    if (onGoToDashboard != null) {
                      onGoToDashboard!();
                    } else {
                      final provider = Provider.of<AppProvider>(context, listen: false);
                      if (!provider.isHostMode) {
                        provider.setHostMode(true);
                      }
                      provider.setTabIndex(0);
                      Navigator.pushNamedAndRemoveUntil(context, AppRoutes.mainShell, (route) => false);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    elevation: 0,
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Enter Host Dashboard',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      SizedBox(width: 8),
                      Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 20),
                    ],
                  ),
                ),
              ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.3),

              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}

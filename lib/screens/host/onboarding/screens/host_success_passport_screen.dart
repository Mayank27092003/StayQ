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
    super.key,
    this.propertyTitle = 'Luxury Boutique Stay',
    this.city = 'Goa',
    this.pricePerNight = 12500,
    this.onGoToDashboard,
  });

  void _returnHome(BuildContext context) {
    AppMotion.tapHeavy();
    final provider = Provider.of<AppProvider>(context, listen: false);
    provider.setTabIndex(0);
    // Refresh verification status so user profile reflects submitted payout & KYC
    provider.fetchVerificationStatus();
    Navigator.pushNamedAndRemoveUntil(context, AppRoutes.mainShell, (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F0E17) : const Color(0xFFFAF8FF),
      body: SafeArea(
        child: Column(
          children: [
            // Top Bar with Close Action
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.stars_rounded, color: AppColors.primary, size: 20),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'StayQ Host Pass',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 24),
                    tooltip: 'Close',
                    onPressed: () => _returnHome(context),
                  ),
                ],
              ),
            ),

            // Scrollable Content to Guarantee Zero Overflow
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 12.0),
                child: Column(
                  children: [
                    const SizedBox(height: 12),

                    // Prominent 3D Qube Bellhop Mascot Avatar over the Host Pass
                    Center(
                      child: Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [Color(0xFF8B5CF6), Color(0xFF6366F1), Color(0xFF4C1D95)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF6366F1).withValues(alpha: 0.45),
                              blurRadius: 32,
                              offset: const Offset(0, 12),
                            ),
                          ],
                          border: Border.all(color: const Color(0xFFFBBF24), width: 3.5),
                        ),
                        child: ClipOval(
                          child: Image.asset(
                            'assets/images/qube_stayq_bellhop_avatar.png',
                            fit: BoxFit.cover,
                            errorBuilder: (ctx, err, stack) => Image.asset(
                              'assets/images/qube_stayq_bellhop.png',
                              fit: BoxFit.cover,
                              errorBuilder: (c, e, s) => const Icon(
                                Icons.stars_rounded,
                                color: Color(0xFFFBBF24),
                                size: 58,
                              ),
                            ),
                          ),
                        ),
                      ).animate().scale(duration: 700.ms, curve: Curves.elasticOut),
                    ),

                    const SizedBox(height: 20),

                    const Text(
                      'Application Under Review! ⏳',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5,
                      ),
                      textAlign: TextAlign.center,
                    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2),

                    const SizedBox(height: 8),

                    const Text(
                      'Aapka host profile aur property listing verification ke liye submit ho chuka hai! StayQ Trust & Safety team aapke documents review kar rahi hai.',
                      style: TextStyle(fontSize: 13, height: 1.45, color: AppColors.textSecondary),
                      textAlign: TextAlign.center,
                    ).animate().fadeIn(delay: 300.ms),

                    const SizedBox(height: 24),

                    // Host Passport Card (Under Review State)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(22),
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
                              Expanded(
                                child: Row(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(8),
                                      child: Image.asset(
                                        'assets/images/qube_stayq_bellhop_avatar.png',
                                        height: 28,
                                        width: 28,
                                        fit: BoxFit.cover,
                                        errorBuilder: (ctx, err, stack) => const Icon(
                                          Icons.stars_rounded,
                                          color: Color(0xFFFBBF24),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    const Flexible(
                                      child: Text(
                                        'STAYQ HOST PASS',
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFFFBBF24),
                                          letterSpacing: 1.0,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
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
                          const SizedBox(height: 18),
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
                          const SizedBox(height: 16),
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

                    const SizedBox(height: 32),

                    // Return to Home CTA (Replaces Enter Host Dashboard button)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => _returnHome(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                          elevation: 0,
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.home_rounded, color: Colors.white, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Return to Home',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                    ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.3),

                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../screens/explore/category_view_screen.dart';
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';
import 'bouncing_widget.dart';

class ZeroBrokerModal extends StatelessWidget {
  const ZeroBrokerModal({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      elevation: 0,
      useSafeArea: true,
      builder: (context) => const ZeroBrokerModal(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: AppColors.background.withValues(alpha: 0.95),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
            border: Border(
              top: BorderSide(color: Colors.white.withValues(alpha: 0.4), width: 1.5),
            ),
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top drag handle
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 12, bottom: 24),
                    width: 48,
                    height: 5,
                    decoration: BoxDecoration(
                      color: AppColors.textMuted.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),

                // Hero Illustration Area
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppColors.primaryGradient,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.3),
                        blurRadius: 30,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.handshake_rounded,
                      color: Colors.white,
                      size: 64,
                    ),
                  ),
                ).animate(onPlay: (c) => c.repeat(reverse: true))
                 .scaleXY(begin: 0.95, end: 1.05, duration: 1500.ms, curve: Curves.easeInOut),

                const SizedBox(height: 32),

                // Title
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    'Direct Owner Connect.\nZero Broker Fees.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      height: 1.2,
                      letterSpacing: -0.5,
                    ),
                  ),
                ).animate().slideY(begin: 0.2, end: 0, duration: 500.ms).fadeIn(),

                const SizedBox(height: 32),

                // Features List
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    children: [
                      _buildFeatureRow(
                        icon: Icons.money_off_csred_rounded,
                        color: AppColors.successGreen,
                        title: '0% Brokerage',
                        subtitle: 'No hidden fees or middleman commissions. Pay only for your stay.',
                        delay: 200,
                      ),
                      const SizedBox(height: 24),
                      _buildFeatureRow(
                        icon: Icons.calendar_month_rounded,
                        color: AppColors.primary,
                        title: '11-Month Leases',
                        subtitle: 'Designed for long-term stays. Sign standard 11-month rental agreements seamlessly through the app.',
                        delay: 300,
                      ),
                      const SizedBox(height: 24),
                      _buildFeatureRow(
                        icon: Icons.verified_user_rounded,
                        color: AppColors.starYellow,
                        title: 'Verified Owners',
                        subtitle: 'Every property owner is strictly vetted. Connect directly with total trust & security on Stay Q.',
                        delay: 400,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 40),

                // Primary CTA: Explore Zero Broker Button
                Padding(
                  padding: EdgeInsets.only(
                    left: 24,
                    right: 24,
                    bottom: MediaQuery.of(context).padding.bottom + 24,
                  ),
                  child: Column(
                    children: [
                      BouncingWidget(
                        onTap: () {
                          AppMotion.tapSelection();
                          Navigator.of(context).pop();
                          Provider.of<AppProvider>(context, listen: false).setCategory('Zero Broker');
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const CategoryViewScreen(categoryTitle: 'Zero Broker'),
                            ),
                          );
                        },
                        child: Container(
                          width: double.infinity,
                          height: 56,
                          decoration: BoxDecoration(
                            gradient: AppColors.primaryGradient,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.3),
                                blurRadius: 16,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.search_rounded, color: Colors.white, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'Explore Zero-Broker Homes',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ).animate().slideY(begin: 0.5, end: 0, delay: 500.ms, curve: AppMotion.bounceCurve).fadeIn(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureRow({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required int delay,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    ).animate().fadeIn(delay: Duration(milliseconds: delay)).slideX(begin: 0.1, end: 0);
  }
}

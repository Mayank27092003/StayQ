import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../widgets/host_earnings_simulator_widget.dart';

class HostWelcomeScreen extends StatelessWidget {
  final VoidCallback? onGetStarted;

  const HostWelcomeScreen({Key? key, this.onGetStarted}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return LayoutBuilder(
      builder: (context, constraints) {
        return Container(
          color: isDark ? const Color(0xFF0F0E17) : const Color(0xFFFAF8FF),
          height: constraints.maxHeight,
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 12),

                // Top Banner with Mascot
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              'JOIN 2,400+ BOUTIQUE HOSTS',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                                letterSpacing: 0.6,
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Host with Stay Q',
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w900,
                              color: AppColors.textPrimary,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Zero brokerage. Complete host control.',
                            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: Image.asset(
                        'assets/images/human_host.png',
                        height: 90,
                        width: 90,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => const Icon(Icons.star_rounded, size: 60, color: AppColors.primary),
                      ),
                    ).animate().scale(duration: 500.ms, curve: Curves.easeOutBack),
                  ],
                ),

                const SizedBox(height: 20),

                // Interactive Simulator Dial Widget
                const HostEarningsSimulatorWidget().animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),

                const SizedBox(height: 24),

                // 3 Value Pillars
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1B192A) : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.borderLight.withValues(alpha: 0.7)),
                  ),
                  child: Column(
                    children: [
                      _buildPillarRow(
                        Icons.verified_user_rounded,
                        const Color(0xFF10B981),
                        'Host Safety & Verified Guests',
                        'Government ID verification and dedicated host assistance on every booking.',
                      ),
                      const Divider(height: 24),
                      _buildPillarRow(
                        Icons.bolt_rounded,
                        const Color(0xFFF59E0B),
                        'Instant Payout Releases',
                        'Direct NEFT/UPI settlement within 24 hours of guest check-in.',
                      ),
                      const Divider(height: 24),
                      _buildPillarRow(
                        Icons.support_agent_rounded,
                        AppColors.primary,
                        '24/7 Dedicated Concierge',
                        'Our ops team assists your guests with check-in and support.',
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),

                const SizedBox(height: 28),

                // Primary Start CTA
                if (onGetStarted != null)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        AppMotion.tapHeavy();
                        onGetStarted!();
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
                            'Launch My Listing Wizard',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          SizedBox(width: 8),
                          Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 20),
                        ],
                      ),
                    ),
                  ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1),

                const SizedBox(height: 24),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildPillarRow(IconData icon, Color color, String title, String desc) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 2),
              Text(
                desc,
                style: const TextStyle(fontSize: 11, height: 1.35, color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

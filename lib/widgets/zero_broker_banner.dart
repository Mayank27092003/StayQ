import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../screens/explore/category_view_screen.dart';
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';
import 'bouncing_widget.dart';
import 'zero_broker_modal.dart';
import '../screens/qube/qube_planner_screen.dart';

class ZeroBrokerBanner extends StatelessWidget {
  const ZeroBrokerBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return BouncingWidget(
      onTap: () {
        AppMotion.tapSelection();
        Provider.of<AppProvider>(context, listen: false).setCategory('Zero Broker');
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const CategoryViewScreen(categoryTitle: 'Zero Broker'),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.borderLight, width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 15,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Subtle abstract pattern
            Positioned(
              right: -20,
              top: -20,
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary.withOpacity(0.03),
                ),
              ),
            ),
            Positioned(
              right: 60,
              bottom: -30,
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary.withOpacity(0.03),
                ),
              ),
            ),
            
            // Content
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  // Icon/Mascot Area
                  BouncingWidget(
                    onTap: () {
                      AppMotion.tapSelection();
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const QubePlannerScreen()),
                      );
                    },
                    child: Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLight,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.primary.withOpacity(0.1)),
                        image: const DecorationImage(
                          image: AssetImage('assets/images/user_welcome_mascot.jpg'),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ).animate(onPlay: (c) => c.repeat(reverse: true))
                     .scaleXY(begin: 1.0, end: 1.05, duration: 1200.ms, curve: Curves.easeInOut),
                  ),
                  
                  const SizedBox(width: 16),
                  
                  // Text Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                'ZERO BROKERAGE',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.8,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          '11-Month Leases',
                          style: TextStyle(
                            color: AppColors.textPrimary,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Direct owner connect for long stays.',
                          style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                            height: 1.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Arrow
                  const Icon(
                    Icons.arrow_forward_ios_rounded,
                    color: AppColors.textSecondary,
                    size: 16,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 600.ms).slideY(begin: 0.1, end: 0, curve: AppMotion.signatureCurve);
  }
}

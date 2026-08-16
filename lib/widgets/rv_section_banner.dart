import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';
import 'bouncing_widget.dart';

class RvSectionBanner extends StatelessWidget {
  final VoidCallback onTap;
  const RvSectionBanner({super.key, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return BouncingWidget(
      onTap: () {
        AppMotion.tapSelection();
        onTap();
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: const Color(0xFFEDF4FE), // Soft sky blue tint
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF42A5F5).withOpacity(0.2), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF42A5F5).withOpacity(0.08),
              blurRadius: 15,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Image/Mascot
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF42A5F5).withOpacity(0.3)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                  image: const DecorationImage(
                    image: AssetImage('assets/images/rv_mascot.jpg'),
                    fit: BoxFit.cover,
                  ),
                ),
              ).animate(onPlay: (c) => c.repeat(reverse: true))
               .moveY(begin: -2, end: 2, duration: 1500.ms, curve: Curves.easeInOut),
              
              const SizedBox(height: 12),
              
              // Text Info
              const Text(
                'RV Adventures',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  height: 1.2,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              const Text(
                'Hit the open road',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 11,
                  height: 1.2,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF42A5F5).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Rent RV',
                  style: TextStyle(
                    color: Color(0xFF1E88E5),
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ).animate(onPlay: (c) => c.repeat(reverse: true)).shimmer(duration: 2500.ms, color: Colors.white54),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 600.ms).slideY(begin: 0.1, end: 0, curve: AppMotion.signatureCurve);
  }
}

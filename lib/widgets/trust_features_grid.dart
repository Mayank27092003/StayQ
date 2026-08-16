import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class TrustFeature {
  final String title;
  final String subtitle;
  final IconData icon;

  TrustFeature({
    required this.title,
    required this.subtitle,
    required this.icon,
  });
}

class TrustFeaturesGrid extends StatelessWidget {
  const TrustFeaturesGrid({super.key});

  @override
  Widget build(BuildContext context) {
    final features = [
      TrustFeature(
        title: 'Verified Homes',
        subtitle: 'Quality & safety checked',
        icon: Icons.verified_user_outlined,
      ),
      TrustFeature(
        title: '24/7 Support',
        subtitle: 'We\'re here for you anytime',
        icon: Icons.headset_mic_outlined,
      ),
      TrustFeature(
        title: 'Secure Payments',
        subtitle: 'Your payments are protected',
        icon: Icons.lock_outline_rounded,
      ),
      TrustFeature(
        title: 'Best Price',
        subtitle: 'Get the best deals always',
        icon: Icons.star_outline_rounded,
      ),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: features.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 2.5,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemBuilder: (context, index) {
          final f = features[index];
          return Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surfaceLight.withOpacity(0.6),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    f.icon,
                    color: AppColors.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        f.title,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        f.subtitle,
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

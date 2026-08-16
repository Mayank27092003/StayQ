import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../../../constants/stay_amenities.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';

class AmenitiesScreen extends StatelessWidget {
  const AmenitiesScreen({super.key});

  final List<Map<String, String>> availableTags = const [
    {'title': 'Pet Friendly', 'icon': '🐾', 'value': 'PET_FRIENDLY'},
    {'title': 'Couple Friendly', 'icon': '🥂', 'value': 'COUPLE_FRIENDLY'},
    {'title': 'Family Vacation', 'icon': '👨‍👩‍👧‍👦', 'value': 'FAMILY_FRIENDLY'},
    {'title': 'Workcation Ready', 'icon': '⚡', 'value': 'WORKCATION'},
    {'title': 'Zero Broker Direct', 'icon': '🤝', 'value': 'ZERO_BROKER'},
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Consumer<HostOnboardingProvider>(
      builder: (context, provider, child) {
        final selectedCount = provider.amenities.length + provider.tags.length;

        // Group the 25 amenities by category
        final categories = ['Essentials', 'Facilities', 'Comfort', 'Safety & Power'];

        return SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Amenities & Vibe',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(
                      '$selectedCount Selected',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ).animate().fadeIn().slideX(),
              const SizedBox(height: 6),
              const Text(
                'Select all amenities available at your stay to give guests an accurate preview.',
                style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
              ).animate().fadeIn(delay: 100.ms).slideX(),
              
              const SizedBox(height: 24),

              // Render categorized 25 Stay Q amenities
              for (final cat in categories) ...[
                Text(
                  cat == 'Comfort' ? 'Comfort & Linen' : cat,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: StayAmenities.all
                      .where((item) => item.category == cat)
                      .map((item) {
                    final val = item.value;
                    final isSelected = provider.amenities.contains(val) || 
                        provider.amenities.contains(item.title);
                    return BouncingWidget(
                      onTap: () {
                        AppMotion.tapSelection();
                        provider.toggleAmenity(val);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? (isDark ? const Color(0xFF3B1E63) : const Color(0xFFEDE9FE))
                              : (isDark ? const Color(0xFF1E1C2A) : Colors.white),
                          border: Border.all(
                            color: isSelected ? AppColors.primary : (isDark ? Colors.white12 : AppColors.borderLight),
                            width: isSelected ? 1.8 : 1,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: isSelected
                              ? [
                                  BoxShadow(
                                    color: AppColors.primary.withValues(alpha: 0.2),
                                    blurRadius: 8,
                                    offset: const Offset(0, 3),
                                  )
                                ]
                              : [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.02),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  )
                                ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(item.emoji, style: const TextStyle(fontSize: 16)),
                            const SizedBox(width: 8),
                            Text(
                              item.title,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                color: isSelected ? AppColors.primary : AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),
              ],

              const Text(
                'Property Experience Tags',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 12),

              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: availableTags.map((tag) {
                  final val = tag['value']!;
                  final isSelected = provider.tags.contains(val);
                  return BouncingWidget(
                    onTap: () {
                      AppMotion.tapSelection();
                      provider.toggleTag(val);
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? const Color(0xFF10B981).withValues(alpha: 0.15)
                            : (isDark ? const Color(0xFF1E1C2A) : Colors.white),
                        border: Border.all(
                          color: isSelected ? const Color(0xFF10B981) : (isDark ? Colors.white12 : AppColors.borderLight),
                          width: isSelected ? 1.8 : 1,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(tag['icon']!, style: const TextStyle(fontSize: 16)),
                          const SizedBox(width: 8),
                          Text(
                            tag['title']!,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                              color: isSelected ? const Color(0xFF10B981) : AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ).animate().fadeIn(delay: 300.ms),

              const SizedBox(height: 24),
            ],
          ),
        );
      },
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';

class PropertyTypeScreen extends StatelessWidget {
  const PropertyTypeScreen({Key? key}) : super(key: key);

  final List<Map<String, String>> categories = const [
    {'title': 'Hotel & Resort', 'icon': '🏨', 'value': 'HOTEL', 'subtitle': 'Rooms, suites & dining'},
    {'title': 'Luxury Villa', 'icon': '🏡', 'value': 'VILLA', 'subtitle': 'Private pool & garden'},
    {'title': 'Penthouse & Apt', 'icon': '🏢', 'value': 'APARTMENT', 'subtitle': 'Skyline & city views'},
    {'title': 'Glamping Camp', 'icon': '🏕️', 'value': 'CAMPING_SITE', 'subtitle': 'Stargazing tents'},
    {'title': 'Luxury RV Cruiser', 'icon': '🚐', 'value': 'RV', 'subtitle': 'Off-grid campervan'},
    {'title': 'Alpine Cabin', 'icon': '🪵', 'value': 'CABIN', 'subtitle': 'Himalayan fireplace'},
    {'title': 'Zero-Broker Home', 'icon': '🏠', 'value': 'LONG_TERM_HOME', 'subtitle': '11-month lease'},
    {'title': 'Treehouse Pod', 'icon': '🌳', 'value': 'TREEHOUSE', 'subtitle': 'Rainforest canopy'},
    {'title': 'Heritage Haveli', 'icon': '🏰', 'value': 'HOMESTAY', 'subtitle': 'Royal hospitality'},
  ];

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<HostOnboardingProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'What’s Your Vibe?',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 6),
          const Text(
            'Choose the category that best captures your property’s magic.',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 24),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: categories.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 14,
              mainAxisSpacing: 14,
              childAspectRatio: 1.05,
            ),
            itemBuilder: (context, index) {
              final cat = categories[index];
              final isSelected = provider.propertyType == cat['value'];

              return BouncingWidget(
                onTap: () {
                  AppMotion.tapSelection();
                  provider.updatePropertyType(cat['value']!);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? (isDark ? const Color(0xFF2D1B4E) : const Color(0xFFF3E8FF))
                        : (isDark ? const Color(0xFF1E1C2A) : Colors.white),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isSelected ? AppColors.primary : (isDark ? Colors.white12 : AppColors.borderLight),
                      width: isSelected ? 2 : 1,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.25),
                              blurRadius: 14,
                              offset: const Offset(0, 6),
                            )
                          ]
                        : [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            )
                          ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        cat['icon']!,
                        style: const TextStyle(fontSize: 34),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        cat['title']!,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                          color: isSelected ? AppColors.primary : AppColors.textPrimary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        cat['subtitle']!,
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.textMuted,
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ).animate().scale(delay: (index * 40).ms, duration: 250.ms, curve: Curves.easeOut);
            },
          ),
          const SizedBox(height: 28),

          // Staying with Host Option Section
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDark ? Colors.white12 : AppColors.borderLight,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.people_alt_rounded, size: 20, color: AppColors.primary),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Host Presence & Co-Living',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            'Will you reside on the property during the guest\'s stay?',
                            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: BouncingWidget(
                        onTap: () {
                          AppMotion.tapSelection();
                          provider.updateStayingWithHost(false);
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                          decoration: BoxDecoration(
                            color: !provider.isStayingWithHost
                                ? (isDark ? const Color(0xFF2D1B4E) : const Color(0xFFF3E8FF))
                                : (isDark ? const Color(0xFF15141F) : AppColors.surfaceLight),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: !provider.isStayingWithHost ? AppColors.primary : Colors.transparent,
                              width: 1.5,
                            ),
                          ),
                          child: Column(
                            children: [
                              Icon(
                                Icons.vpn_key_rounded,
                                size: 22,
                                color: !provider.isStayingWithHost ? AppColors.primary : AppColors.textMuted,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Entire Place',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: !provider.isStayingWithHost ? FontWeight.bold : FontWeight.w600,
                                  color: !provider.isStayingWithHost ? AppColors.primary : AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              const Text(
                                'Guest has 100% privacy',
                                style: TextStyle(fontSize: 10, color: AppColors.textMuted),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: BouncingWidget(
                        onTap: () {
                          AppMotion.tapSelection();
                          provider.updateStayingWithHost(true);
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
                          decoration: BoxDecoration(
                            color: provider.isStayingWithHost
                                ? (isDark ? const Color(0xFF2D1B4E) : const Color(0xFFF3E8FF))
                                : (isDark ? const Color(0xFF15141F) : AppColors.surfaceLight),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: provider.isStayingWithHost ? AppColors.primary : Colors.transparent,
                              width: 1.5,
                            ),
                          ),
                          child: Column(
                            children: [
                              Icon(
                                Icons.home_work_rounded,
                                size: 22,
                                color: provider.isStayingWithHost ? AppColors.primary : AppColors.textMuted,
                              ),
                              const SizedBox(height: 6),
                              Text(
                                'Staying with Host',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: provider.isStayingWithHost ? FontWeight.bold : FontWeight.w600,
                                  color: provider.isStayingWithHost ? AppColors.primary : AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              const Text(
                                'Private room + shared space',
                                style: TextStyle(fontSize: 10, color: AppColors.textMuted),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';

class PropertyTypeScreen extends StatelessWidget {
  const PropertyTypeScreen({Key? key}) : super(key: key);

  final List<Map<String, dynamic>> categories = const [
    {
      'title': 'Hotel & Resort',
      'icon': '🏨',
      'value': 'HOTEL',
      'subtitle': 'Rooms, suites & dining',
      'needsHostPresence': false,
    },
    {
      'title': 'Luxury Villa',
      'icon': '🏡',
      'value': 'VILLA',
      'subtitle': 'Private pool & garden',
      'needsHostPresence': true,
    },
    {
      'title': 'Penthouse & Apt',
      'icon': '🏢',
      'value': 'APARTMENT',
      'subtitle': 'Skyline & city views',
      'needsHostPresence': true,
    },
    {
      'title': 'Glamping Camp',
      'icon': '🏕️',
      'value': 'CAMPING_SITE',
      'subtitle': 'Stargazing tents',
      'needsHostPresence': false,
    },
    {
      'title': 'Luxury RV Cruiser',
      'icon': '🚐',
      'value': 'RV',
      'subtitle': 'Off-grid campervan',
      'needsHostPresence': false,
    },
    {
      'title': 'Alpine Cabin',
      'icon': '🪵',
      'value': 'CABIN',
      'subtitle': 'Himalayan fireplace',
      'needsHostPresence': true,
    },
    {
      'title': 'Zero-Broker Home',
      'icon': '🏠',
      'value': 'LONG_TERM_HOME',
      'subtitle': '11-month lease',
      'needsHostPresence': true,
    },
    {
      'title': 'Treehouse Pod',
      'icon': '🌳',
      'value': 'TREEHOUSE',
      'subtitle': 'Rainforest canopy',
      'needsHostPresence': true,
    },
    {
      'title': 'Heritage Haveli',
      'icon': '🏰',
      'value': 'HOMESTAY',
      'subtitle': 'Royal hospitality',
      'needsHostPresence': true,
    },
  ];

  void _showHostPresenceModal(
    BuildContext context,
    HostOnboardingProvider provider,
    Map<String, dynamic> category,
  ) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.fromLTRB(22, 12, 22, 32),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF181625) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.2),
                blurRadius: 30,
                offset: const Offset(0, -10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 5,
                  margin: const EdgeInsets.only(bottom: 18),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.black12,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              Row(
                children: [
                  Text(category['icon'] as String, style: const TextStyle(fontSize: 26)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'How will guests experience your ${category['title']}?',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Select the accommodation type you are offering:',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 20),

              // Option 1: Entire Place
              _buildPresenceOption(
                context: context,
                title: 'Entire Place',
                subtitle: 'Guests have the whole property exclusively to themselves.',
                icon: Icons.vpn_key_rounded,
                isSelected: !provider.isStayingWithHost,
                onTap: () {
                  AppMotion.tapSelection();
                  provider.updatePropertyType(category['value'] as String);
                  provider.updateHostPresence(false);
                  Navigator.pop(context);
                },
              ),

              const SizedBox(height: 12),

              // Option 2: Private Room (Host on property)
              _buildPresenceOption(
                context: context,
                title: 'Private Room with Host on Site',
                subtitle: 'Guests have a private room; host or co-host lives on property.',
                icon: Icons.bedroom_parent_rounded,
                isSelected: provider.isStayingWithHost,
                onTap: () {
                  AppMotion.tapSelection();
                  provider.updatePropertyType(category['value'] as String);
                  provider.updateHostPresence(true);
                  Navigator.pop(context);
                },
              ),

              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  static Widget _buildPresenceOption({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return BouncingWidget(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.12)
              : (isDark ? const Color(0xFF222033) : AppColors.surfaceLight),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.borderLight,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary : AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: isSelected ? Colors.white : AppColors.primary,
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.3),
                  ),
                ],
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 22),
          ],
        ),
      ),
    );
  }

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
            'What’s Your Property Type?',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 6),
          const Text(
            'Select the primary category for your listing.',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 24),

          // 9 Category Grid
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
              final needsHostPresence = cat['needsHostPresence'] as bool;

              return BouncingWidget(
                onTap: () {
                  AppMotion.tapSelection();
                  if (needsHostPresence) {
                    _showHostPresenceModal(context, provider, cat);
                  } else {
                    provider.updatePropertyType(cat['value'] as String);
                    provider.updateHostPresence(false);
                  }
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
                        cat['icon'] as String,
                        style: const TextStyle(fontSize: 34),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        cat['title'] as String,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                          color: isSelected ? AppColors.primary : AppColors.textPrimary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        cat['subtitle'] as String,
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.textMuted,
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (isSelected && needsHostPresence) ...[
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            provider.isStayingWithHost ? 'Private Room' : 'Entire Place',
                            style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ).animate().scale(delay: (index * 30).ms, duration: 250.ms, curve: Curves.easeOut);
            },
          ),
          const SizedBox(height: 36),
        ],
      ),
    );
  }
}

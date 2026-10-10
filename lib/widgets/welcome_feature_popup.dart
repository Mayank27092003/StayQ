import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/app_provider.dart';
import '../screens/explore/category_view_screen.dart';
import '../screens/explore/rv_overland_screen.dart';
import '../screens/host/onboarding/host_onboarding_screen.dart';
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';

class WelcomeFeaturePopup {
  static const _lastShownKey = 'welcome_popup_last_shown_timestamp';
  // If user opens the app after 7+ days of inactivity, show as a welcome back
  static const Duration _reengageCooldown = Duration(days: 7);

  /// Shows the popup on first app launch OR if opened after a long time (7+ days).
  /// During active daily use, it will NEVER annoy the user repeatedly.
  static Future<void> showIfFirstTime(BuildContext context, bool isHostMode) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final lastShownMs = prefs.getInt(_lastShownKey);
      final now = DateTime.now();

      if (lastShownMs != null) {
        final lastShownDate = DateTime.fromMillisecondsSinceEpoch(lastShownMs);
        if (now.difference(lastShownDate) < _reengageCooldown) {
          // User opened the app recently; do not disturb
          return;
        }
      }

      // Record current timestamp
      await prefs.setInt(_lastShownKey, now.millisecondsSinceEpoch);

      if (!context.mounted) return;
      show(context, isHostMode);
    } catch (e) {
      // Ignore preference errors
    }
  }

  static void show(BuildContext context, bool isHostMode) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.55),
      builder: (context) => _WelcomePopupContent(isHostMode: isHostMode),
    );
  }
}

class _WelcomePopupContent extends StatelessWidget {
  final bool isHostMode;

  const _WelcomePopupContent({required this.isHostMode});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final title = isHostMode ? "Welcome to StayQ Hosting!" : "Welcome to StayQ!";
    final subtitle = isHostMode
        ? "List luxury villas, campervans & unique stays."
        : "Discover luxury villas, campervans & scenic road trips.";

    final features = isHostMode
        ? [
            {
              'icon': Icons.directions_bus_rounded,
              'color': const Color(0xFFE05638),
              'title': 'List Campervans & Caravans',
              'desc': 'Host campervans with self-drive or driver options.',
            },
            {
              'icon': Icons.villa_rounded,
              'color': const Color(0xFF0284C7),
              'title': 'Luxury Stays & Villas',
              'desc': 'Direct bookings with verified guest identity.',
            },
            {
              'icon': Icons.auto_awesome_rounded,
              'color': const Color(0xFF10B981),
              'title': 'AI Assisted Management',
              'desc': 'Automated calendar sync, dynamic pricing & chat.',
            },
          ]
        : [
            {
              'icon': Icons.directions_bus_rounded,
              'color': const Color(0xFFE05638),
              'title': 'Campervans & Caravans',
              'desc': 'Bed, AC, kitchen on wheels. Self-drive or with captain.',
            },
            {
              'icon': Icons.holiday_village_rounded,
              'color': const Color(0xFF0284C7),
              'title': 'Unique Stays & Villas',
              'desc': 'Handpicked private villas, beachfront cottages & cabins.',
            },
            {
              'icon': Icons.verified_user_rounded,
              'color': const Color(0xFF10B981),
              'title': 'Verified & Protected',
              'desc': '100% verified properties with 24/7 dedicated support.',
            },
          ];

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.72,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(18, 10, 18, 20),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Top Drag Handle & Close Button Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const SizedBox(width: 32),
                  Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    visualDensity: VisualDensity.compact,
                    color: Colors.grey,
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),

              // Compact Modern Hero Banner (Campervan & Stays)
              Container(
                height: 125,
                width: double.infinity,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: LinearGradient(
                    colors: isDark
                        ? [const Color(0xFF2A1B4E), const Color(0xFF1A132F)]
                        : [const Color(0xFFEDE9FE), const Color(0xFFF3E8FF)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                clipBehavior: Clip.antiAlias,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Image.asset(
                      'assets/images/campervan_wide_8k.jpg',
                      fit: BoxFit.cover,
                      alignment: Alignment.centerRight,
                      errorBuilder: (_, __, ___) => Image.asset(
                        'assets/images/real_rv.jpg',
                        fit: BoxFit.cover,
                      ),
                    ),
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.black.withValues(alpha: 0.75),
                            Colors.black.withValues(alpha: 0.35),
                            Colors.transparent,
                          ],
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                        ),
                      ),
                    ),
                    Positioned(
                      left: 14,
                      top: 18,
                      bottom: 18,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'STAYS & CAMPERVANS',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 8.5,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Explore on Wheels\n& Luxury Stays',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 14.5,
                              fontWeight: FontWeight.bold,
                              height: 1.15,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Title & Subtitle
              Text(
                title,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? Colors.white70 : AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 14),

              // 3 Compact Feature Items
              ...features.map((feat) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(7),
                        decoration: BoxDecoration(
                          color: (feat['color'] as Color).withValues(alpha: 0.12),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(feat['icon'] as IconData, size: 15, color: feat['color'] as Color),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              feat['title'] as String,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12.5,
                                color: isDark ? Colors.white : AppColors.textPrimary,
                              ),
                            ),
                            Text(
                              feat['desc'] as String,
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? Colors.white60 : AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),

              const SizedBox(height: 12),

              // Action Buttons Row
              Row(
                children: [
                  if (!isHostMode) ...[
                    Expanded(
                      flex: 4,
                      child: SizedBox(
                        height: 42,
                        child: OutlinedButton(
                          onPressed: () {
                            AppMotion.tapSelection();
                            Navigator.pop(context);
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const RvOverlandScreen()),
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: AppColors.primary.withValues(alpha: 0.35)),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.route_rounded, size: 14, color: AppColors.primary),
                              SizedBox(width: 4),
                              Text(
                                'RV Routes',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                  color: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],

                  Expanded(
                    flex: 6,
                    child: SizedBox(
                      height: 42,
                      child: ElevatedButton(
                        onPressed: () {
                          AppMotion.tapSelection();
                          Navigator.pop(context);
                          if (!isHostMode) {
                            Provider.of<AppProvider>(context, listen: false).setCategory('RVs');
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const CategoryViewScreen(categoryTitle: 'RVs'),
                              ),
                            );
                          } else {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => const HostOnboardingScreen(
                                  isAddingNewProperty: false,
                                  startAtBeginning: true,
                                ),
                              ),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              isHostMode ? Icons.add_home_rounded : Icons.explore_rounded,
                              size: 15,
                              color: Colors.white,
                            ),
                            const SizedBox(width: 5),
                            Text(
                              isHostMode ? 'Start Hosting' : 'Explore Stays & RVs',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12.5,
                                color: Colors.white,
                              ),
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
      ),
    );
  }
}

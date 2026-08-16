import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';
import 'bouncing_widget.dart';

class BottomNavBar extends StatefulWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;

  const BottomNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  State<BottomNavBar> createState() => _BottomNavBarState();
}

class _BottomNavBarState extends State<BottomNavBar> {
  @override
  Widget build(BuildContext context) {
    // Determine the items based on the current mode (Guest or Host)
    final isHostMode = context.select<AppProvider, bool>((provider) => provider.isHostMode);
    
    final items = isHostMode
        ? [
            _NavItem(label: 'Dashboard', activeIcon: Icons.dashboard_rounded, inactiveIcon: Icons.dashboard_outlined),
            _NavItem(label: 'Listings', activeIcon: Icons.list_alt_rounded, inactiveIcon: Icons.list_alt_outlined),
            _NavItem(label: 'Inbox', activeIcon: Icons.chat_bubble_rounded, inactiveIcon: Icons.chat_bubble_outline_rounded),
            _NavItem(label: 'Profile', activeIcon: Icons.person_rounded, inactiveIcon: Icons.person_outline_rounded),
          ]
        : [
            _NavItem(label: 'Explore', activeIcon: Icons.navigation_rounded, inactiveIcon: Icons.navigation_outlined),
            _NavItem(label: 'Wishlists', activeIcon: Icons.favorite_rounded, inactiveIcon: Icons.favorite_border_rounded),
            _NavItem(label: 'Trips', activeIcon: Icons.work_rounded, inactiveIcon: Icons.work_outline_rounded),
            _NavItem(label: 'Inbox', activeIcon: Icons.chat_bubble_rounded, inactiveIcon: Icons.chat_bubble_outline_rounded),
            _NavItem(label: 'Profile', activeIcon: Icons.person_rounded, inactiveIcon: Icons.person_outline_rounded),
          ];

    return Container(
      margin: const EdgeInsets.only(left: 20, right: 20, bottom: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: AppColors.borderLight, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      child: SafeArea(
        top: false,
        bottom: false, // The margin handles the bottom spacing
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: List.generate(items.length, (index) {
            final isSelected = widget.currentIndex == index;
            final item = items[index];

            return BouncingWidget(
              onTap: () {
                AppMotion.tapSelection();
                widget.onTap(index);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                color: Colors.transparent, // Ensures hit testing area
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _AnimatedIcon(
                      isSelected: isSelected,
                      activeIcon: item.activeIcon,
                      inactiveIcon: item.inactiveIcon,
                    ),
                    const SizedBox(height: 4),
                    AnimatedDefaultTextStyle(
                      duration: AppMotion.standard,
                      curve: AppMotion.signatureCurve,
                      style: TextStyle(
                        fontSize: 11,
                        fontFamily: 'Inter',
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? AppColors.primary : AppColors.textMuted,
                      ),
                      child: Text(item.label),
                    ),
                    const SizedBox(height: 2),
                    // Small dot indicator
                    AnimatedOpacity(
                      duration: AppMotion.standard,
                      opacity: isSelected ? 1.0 : 0.0,
                      child: Container(
                        width: 4,
                        height: 4,
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

class _AnimatedIcon extends StatelessWidget {
  final bool isSelected;
  final IconData activeIcon;
  final IconData inactiveIcon;

  const _AnimatedIcon({
    required this.isSelected,
    required this.activeIcon,
    required this.inactiveIcon,
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0.0, end: isSelected ? 1.0 : 0.0),
      duration: AppMotion.extended,
      curve: AppMotion.bounceCurve,
      builder: (context, value, child) {
        // value goes from 0 to 1 when selected, 1 to 0 when deselected
        // We want a bounce scale: 1.0 -> 1.2 -> 1.0
        // We can approximate this by mapping value: 
        // if value is bouncing around 1.0, the scale follows it.
        // With a bounceCurve, the value will overshoot 1.0 (e.g. up to 1.2) and settle at 1.0.
        // So scale = 1.0 + (value * 0.2) or simply let the curve do the work.
        // If the curve itself overshoots, we just use 1.0 + (value - 1.0) ? 
        // Actually, Tween(0.0 to 1.0) with an elastic/bounce curve will natively overshoot.
        // To make it hit 1.2 max, let's just scale based on value.
        // If we map value from 0 to 1:
        // size = 24
        // scale = 1.0 + (value * 0.1) -> this won't bounce if the curve doesn't overshoot by much.
        // Let's implement a custom keyframe approach or use the curve directly.
        // AppMotion.bounceCurve should provide the bounce.
        
        final double scale = 1.0 + (value * 0.15); // scales up slightly based on value
        
        final Color iconColor = Color.lerp(
          AppColors.textMuted,
          AppColors.primary,
          value.clamp(0.0, 1.0),
        )!;

        return Transform.scale(
          scale: scale,
          child: Icon(
            isSelected ? activeIcon : inactiveIcon,
            color: iconColor,
            size: 24,
          ),
        );
      },
    );
  }
}

class _NavItem {
  final String label;
  final IconData activeIcon;
  final IconData inactiveIcon;

  _NavItem({
    required this.label,
    required this.activeIcon,
    required this.inactiveIcon,
  });
}

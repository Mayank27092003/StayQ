import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';

class SearchBarHeader extends StatelessWidget {
  final VoidCallback onTap;
  final String destination;
  final String dateText;
  final String guestText;

  const SearchBarHeader({
    super.key,
    required this.onTap,
    this.destination = 'Anywhere',
    this.dateText = 'Any week',
    this.guestText = 'Add guests',
  });

  @override
  Widget build(BuildContext context) {
    // Determine the subtitle based on whether values are default or selected
    final displayDest = destination.isEmpty || destination == 'Search destinations' ? 'Anywhere' : destination;
    final displayDate = dateText.isEmpty || dateText == 'Add dates' ? 'Any week' : dateText;
    final displayGuests = guestText.isEmpty || guestText == '0 guests' ? 'Add guests' : guestText;
    
    final subtitle = '$displayDest • $displayDate • $displayGuests';

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : AppColors.textPrimary;
    final subtitleColor = isDark ? Colors.white70 : AppColors.textSecondary;

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(40),
          border: Border.all(
            color: isDark
                ? Colors.white.withValues(alpha: 0.1)
                : AppColors.borderLight.withValues(alpha: 0.5),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 24,
              spreadRadius: -4,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            // Search Icon
            Icon(
              Icons.search_rounded,
              color: textColor,
              size: 28,
            ),
            const SizedBox(width: 16),
            
            // Text Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Where',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: textColor,
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: subtitleColor,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            
            // Filter Button
            Container(
              height: 36,
              width: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isDark ? Colors.white.withValues(alpha: 0.1) : AppColors.borderLight,
                  width: 1,
                ),
              ),
              child: Icon(
                Icons.tune_rounded,
                color: textColor,
                size: 18,
              ),
            ).animate().scale(duration: 300.ms, curve: Curves.easeOutBack),
          ],
        ),
      ),
    );
  }
}


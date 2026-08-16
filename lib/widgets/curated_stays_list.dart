import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models/stay_model.dart';
import '../theme/app_colors.dart';
import 'stay_card.dart';
import '../screens/listing/listing_detail_screen.dart';
import '../screens/explore/category_view_screen.dart';

class CuratedStaysList extends StatelessWidget {
  final String title;
  final String? subtitle;
  final List<StayModel> stays;
  final Function(StayModel) onFavoriteTap;

  const CuratedStaysList({
    super.key,
    required this.title,
    this.subtitle,
    required this.stays,
    required this.onFavoriteTap,
  });

  @override
  Widget build(BuildContext context) {
    if (stays.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.3,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        subtitle!,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ]
                  ],
                ),
              ),
              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => CategoryViewScreen(categoryTitle: title),
                    ),
                  );
                },
                child: const Row(
                  children: [
                    Text(
                      'See all',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                    Icon(Icons.chevron_right_rounded, size: 18, color: AppColors.primary),
                  ],
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 290,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            itemCount: stays.length,
            separatorBuilder: (_, __) => const SizedBox(width: 16),
            itemBuilder: (context, index) {
              final stay = stays[index];
              return StayCard(
                stay: stay,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ListingDetailScreen(stay: stay),
                    ),
                  );
                },
                onFavoriteTap: () => onFavoriteTap(stay),
              ).animate().fade(duration: 400.ms, delay: (index * 100).ms);
            },
          ),
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}

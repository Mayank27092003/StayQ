import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../models/stay_model.dart';
import '../providers/app_provider.dart';
import '../screens/listing/listing_detail_screen.dart';
import '../screens/explore/category_view_screen.dart';
import '../theme/app_colors.dart';

class StayHighlightItem {
  final String title;
  final String subtitle;
  final String imagePath;
  final String tag;
  final bool isAsset;

  StayHighlightItem({
    required this.title,
    required this.subtitle,
    required this.imagePath,
    required this.tag,
    this.isAsset = false,
  });
}

class StaysHighlightCarousel extends StatelessWidget {
  const StaysHighlightCarousel({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Check if there are real published regular stays
    final publishedStays = provider.stays
        .where((s) => !s.isCampervan && !s.isCamping)
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    'Our Stays',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : AppColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.primary, AppColors.accent],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Text(
                      publishedStays.isNotEmpty ? 'VERIFIED' : 'CURATING NOW',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ).animate().shimmer(duration: 2000.ms, delay: 500.ms),
                ],
              ),
              if (publishedStays.isNotEmpty)
                TextButton(
                  onPressed: () {
                    provider.setCategory('All Stays');
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const CategoryViewScreen(categoryTitle: 'All Stays'),
                      ),
                    );
                  },
                  child: const Text(
                    'View All →',
                    style: TextStyle(
                      color: AppColors.primary,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),

        // Carousel Content (Auto-scroll removed)
        SizedBox(
          height: 250,
          child: publishedStays.isNotEmpty
              ? _buildPublishedStaysList(context, publishedStays, isDark)
              : _buildMascotTeaserList(context, isDark),
        ),
      ],
    );
  }

  Widget _buildPublishedStaysList(
      BuildContext context, List<StayModel> stays, bool isDark) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      itemCount: stays.length,
      itemBuilder: (context, index) {
        final stay = stays[index];
        return Padding(
          padding: const EdgeInsets.only(right: 16),
          child: GestureDetector(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => ListingDetailScreen(stay: stay),
                ),
              );
            },
            child: Container(
              width: 220,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF161618) : Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: isDark ? Colors.white12 : AppColors.borderLight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.05),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        if (stay.imageUrls.isNotEmpty)
                          Image.network(
                            stay.imageUrls.first,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Image.asset(
                              'assets/images/real_villa.jpg',
                              fit: BoxFit.cover,
                            ),
                          )
                        else
                          Image.asset(
                            'assets/images/real_villa.jpg',
                            fit: BoxFit.cover,
                          ),
                        Positioned(
                          top: 10,
                          left: 10,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.65),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.star_rounded, size: 12, color: Color(0xFFFFB800)),
                                const SizedBox(width: 3),
                                Text(
                                  stay.rating.toStringAsFixed(1),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          stay.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          stay.location,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '₹${stay.pricePerNight.toInt()} / night',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildMascotTeaserList(BuildContext context, bool isDark) {
    final teasers = [
      StayHighlightItem(
        title: 'Handpicked Villas',
        subtitle: 'Private pool retreats & estates',
        imagePath: 'assets/images/qube_stayq_bellhop.png',
        tag: 'COMING SOON',
        isAsset: true,
      ),
      StayHighlightItem(
        title: 'Heritage Stays',
        subtitle: 'Historic royal forts & chalets',
        imagePath: 'assets/images/qube_stayq_bellhop_avatar.png',
        tag: 'CURATING NOW',
        isAsset: true,
      ),
    ];

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      itemCount: teasers.length,
      itemBuilder: (context, index) {
        final item = teasers[index];
        return Padding(
          padding: const EdgeInsets.only(right: 16),
          child: Container(
            width: 220,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF161618) : Colors.white,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.12)
                    : AppColors.primary.withValues(alpha: 0.18),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: isDark ? 0.15 : 0.08),
                  blurRadius: 14,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Background subtle gradient
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: isDark
                          ? [
                              const Color(0xFF1E1B4B).withValues(alpha: 0.7),
                              const Color(0xFF0F172A),
                            ]
                          : [
                              const Color(0xFFF5F3FF),
                              Colors.white,
                            ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),

                // Qube Mascot Graphic Center
                Positioned(
                  top: 24,
                  left: 20,
                  right: 20,
                  child: Image.asset(
                    item.imagePath,
                    height: 110,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.villa_rounded,
                      size: 60,
                      color: AppColors.primary,
                    ),
                  ),
                ),

                // Coming Soon Tag Badge
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      item.tag,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),

                // Text Content Bottom
                Positioned(
                  bottom: 16,
                  left: 16,
                  right: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        item.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white : AppColors.textPrimary,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        item.subtitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: isDark ? Colors.white70 : AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

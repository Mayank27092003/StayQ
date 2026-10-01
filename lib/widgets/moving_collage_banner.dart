import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../screens/explore/category_view_screen.dart';
import '../theme/app_colors.dart';

class MovingCollageBanner extends StatefulWidget {
  const MovingCollageBanner({super.key});

  @override
  State<MovingCollageBanner> createState() => _MovingCollageBannerState();
}

class _MovingCollageBannerState extends State<MovingCollageBanner> {
  late final ScrollController _scrollController1;
  late final ScrollController _scrollController2;
  Timer? _timer;

  final List<Map<String, String>> _row1Items = [
    {
      'title': 'Leh-Ladakh Trail',
      'tag': 'Overland RV',
      'image': 'assets/images/campervan_wide_8k.jpg',
      'fallback': 'assets/images/real_rv.jpg',
      'category': 'RVs',
    },
    {
      'title': 'Goa Beachfront Villa',
      'tag': 'Private Pool',
      'image': 'assets/images/real_villa.jpg',
      'fallback': 'assets/images/beach_1.jpg',
      'category': 'Beachfront',
    },
    {
      'title': 'Rishikesh Riverside',
      'tag': 'Eco-Glamping',
      'image': 'assets/images/real_camping.jpg',
      'fallback': 'assets/images/cabin_1.jpg',
      'category': 'Camping',
    },
    {
      'title': 'Manali Pine Chalet',
      'tag': 'Mountain View',
      'image': 'assets/images/cabin_1.jpg',
      'fallback': 'assets/images/real_cabin.jpg',
      'category': 'Cabins',
    },
    {
      'title': 'Jaipur Royal Haveli',
      'tag': 'Heritage Stay',
      'image': 'assets/images/real_haveli.jpg',
      'fallback': 'assets/images/villa_1.jpg',
      'category': 'All Stays',
    },
  ];

  final List<Map<String, String>> _row2Items = [
    {
      'title': 'Stargazing Glass Igloo',
      'tag': '360° Night Sky',
      'image': 'assets/images/glass_1.jpg',
      'fallback': 'assets/images/real_camping.jpg',
      'category': 'Camping',
    },
    {
      'title': 'Coastal Highway Caravan',
      'tag': 'Self-Drive RV',
      'image': 'assets/images/real_rv.jpg',
      'fallback': 'assets/images/campervan_wide_8k.jpg',
      'category': 'RVs',
    },
    {
      'title': 'Munnar Treehouse',
      'tag': 'Nature Escape',
      'image': 'assets/images/real_treehouse.jpg',
      'fallback': 'assets/images/cabin_1.jpg',
      'category': 'Cabins',
    },
    {
      'title': 'Infinity Pool Sanctuary',
      'tag': 'Zero-Broker Villa',
      'image': 'assets/images/beach_1.jpg',
      'fallback': 'assets/images/real_villa.jpg',
      'category': 'Amazing Pools',
    },
    {
      'title': 'Western Ghats Glamping',
      'tag': 'Bonfire & Trek',
      'image': 'assets/images/real_camping.jpg',
      'fallback': 'assets/images/cabin_1.jpg',
      'category': 'Camping',
    },
  ];

  @override
  void initState() {
    super.initState();
    _scrollController1 = ScrollController();
    _scrollController2 = ScrollController();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startAutoScroll();
    });
  }

  void _startAutoScroll() {
    _timer = Timer.periodic(const Duration(milliseconds: 35), (timer) {
      if (!mounted) return;

      // Row 1: Forward scroll
      if (_scrollController1.hasClients) {
        final maxScroll1 = _scrollController1.position.maxScrollExtent;
        final current1 = _scrollController1.offset;
        if (current1 >= maxScroll1) {
          _scrollController1.jumpTo(0);
        } else {
          _scrollController1.jumpTo(current1 + 1.2);
        }
      }

      // Row 2: Reverse scroll
      if (_scrollController2.hasClients) {
        final maxScroll2 = _scrollController2.position.maxScrollExtent;
        final current2 = _scrollController2.offset;
        if (current2 <= 0) {
          _scrollController2.jumpTo(maxScroll2);
        } else {
          _scrollController2.jumpTo(current2 - 1.2);
        }
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _scrollController1.dispose();
    _scrollController2.dispose();
    super.dispose();
  }

  void _onCardTap(String category) {
    final provider = Provider.of<AppProvider>(context, listen: false);
    provider.setCategory(category);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CategoryViewScreen(categoryTitle: category),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Duplicate lists for seamless marquee loop
    final duplicatedRow1 = [..._row1Items, ..._row1Items, ..._row1Items];
    final duplicatedRow2 = [..._row2Items, ..._row2Items, ..._row2Items];

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.auto_awesome_mosaic_rounded, color: AppColors.primary, size: 20),
                    SizedBox(width: 8),
                    Text(
                      'Live Travel Collage',
                      style: TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.motion_photos_on_rounded, size: 12, color: AppColors.textSecondary),
                      SizedBox(width: 4),
                      Text(
                        'Auto Exploring',
                        style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Marquee Row 1
          SizedBox(
            height: 125,
            child: ListView.builder(
              controller: _scrollController1,
              scrollDirection: Axis.horizontal,
              physics: const NeverScrollableScrollPhysics(), // Driven by smooth timer
              itemCount: duplicatedRow1.length,
              itemBuilder: (context, index) {
                final item = duplicatedRow1[index];
                return _buildCollageCard(item);
              },
            ),
          ),

          const SizedBox(height: 10),

          // Marquee Row 2
          SizedBox(
            height: 125,
            child: ListView.builder(
              controller: _scrollController2,
              scrollDirection: Axis.horizontal,
              physics: const NeverScrollableScrollPhysics(), // Driven by smooth timer
              itemCount: duplicatedRow2.length,
              itemBuilder: (context, index) {
                final item = duplicatedRow2[index];
                return _buildCollageCard(item);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCollageCard(Map<String, String> item) {
    return GestureDetector(
      onTap: () => _onCardTap(item['category'] ?? 'All Stays'),
      child: Container(
        width: 190,
        margin: const EdgeInsets.symmetric(horizontal: 6),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.12),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.asset(
                item['image']!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Image.asset(
                  item['fallback']!,
                  fit: BoxFit.cover,
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.black.withOpacity(0.1),
                      Colors.black.withOpacity(0.8),
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.white.withOpacity(0.3), width: 0.5),
                  ),
                  child: Text(
                    item['tag']!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.2,
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: 8,
                left: 10,
                right: 10,
                child: Text(
                  item['title']!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.2,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

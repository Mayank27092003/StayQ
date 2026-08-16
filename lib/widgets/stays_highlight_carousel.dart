import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../screens/explore/category_view_screen.dart';
import '../theme/app_colors.dart';

class StayHighlightItem {
  final String title;
  final String subtitle;
  final String imageUrl;
  final String tag;

  StayHighlightItem({
    required this.title,
    required this.subtitle,
    required this.imageUrl,
    required this.tag,
  });
}

class StaysHighlightCarousel extends StatefulWidget {
  const StaysHighlightCarousel({super.key});

  @override
  State<StaysHighlightCarousel> createState() => _StaysHighlightCarouselState();
}

class _StaysHighlightCarouselState extends State<StaysHighlightCarousel> {
  final ScrollController _scrollController = ScrollController();
  bool _isAutoScrolling = true;

  final List<StayHighlightItem> highlights = [
    StayHighlightItem(
      title: 'Amazing Pools',
      subtitle: 'Dive into luxury',
      imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2940&auto=format&fit=crop',
      tag: 'Trending',
    ),
    StayHighlightItem(
      title: 'Beachfront',
      subtitle: 'Wake up to the ocean',
      imageUrl: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2940&auto=format&fit=crop',
      tag: 'Bestseller',
    ),
    StayHighlightItem(
      title: 'Design',
      subtitle: 'Architectural masterpieces',
      imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2940&auto=format&fit=crop',
      tag: 'Ultra Luxe',
    ),
    StayHighlightItem(
      title: 'Cabins',
      subtitle: 'Escape to the woods',
      imageUrl: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=2940&auto=format&fit=crop',
      tag: 'Nature',
    ),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _autoScroll();
    });
  }

  void _autoScroll() {
    if (!mounted) return;
    if (_isAutoScrolling && _scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.offset + 10000,
        duration: const Duration(seconds: 200),
        curve: Curves.linear,
      ).then((_) {
        if (mounted) _autoScroll();
      });
    } else {
      Future.delayed(const Duration(milliseconds: 500), _autoScroll);
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: Row(
            children: [
              const Text(
                'Our Stays',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimary,
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
                      color: AppColors.primary.withOpacity(0.4),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Text(
                  'FEATURED',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.2,
                  ),
                ),
              ).animate().shimmer(duration: 2000.ms, delay: 500.ms),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 320,
          child: NotificationListener<ScrollNotification>(
            onNotification: (notification) {
              if (notification is ScrollStartNotification) {
                if (notification.dragDetails != null) {
                  _isAutoScrolling = false;
                }
              } else if (notification is ScrollEndNotification) {
                _isAutoScrolling = true;
              }
              return false;
            },
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              controller: _scrollController,
              itemBuilder: (context, index) {
                final actualIndex = index % highlights.length;
                final item = highlights[actualIndex];
                return Padding(
                  padding: const EdgeInsets.only(right: 20),
                  child: _HighlightCard(
                    item: item,
                    index: actualIndex,
                    onTap: () {
                      final provider = Provider.of<AppProvider>(context, listen: false);
                      provider.setCategory(item.title);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => CategoryViewScreen(categoryTitle: item.title),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }
}

class _HighlightCard extends StatefulWidget {
  final StayHighlightItem item;
  final int index;
  final VoidCallback onTap;

  const _HighlightCard({
    required this.item,
    required this.index,
    required this.onTap,
  });

  @override
  State<_HighlightCard> createState() => _HighlightCardState();
}

class _HighlightCardState extends State<_HighlightCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isHovered = true),
      onTapUp: (_) {
        setState(() => _isHovered = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _isHovered = false),
      child: AnimatedScale(
        scale: _isHovered ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutBack,
        child: Container(
          width: 240,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(32),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 30,
                spreadRadius: _isHovered ? 5 : 0,
                offset: const Offset(0, 15),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(32),
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Background Image
                AnimatedScale(
                  scale: _isHovered ? 1.05 : 1.0,
                  duration: const Duration(milliseconds: 400),
                  curve: Curves.easeOutCubic,
                  child: Image.network(
                    widget.item.imageUrl,
                    fit: BoxFit.cover,
                  ),
                ),
                
                // Dark Glassmorphism Gradient Overlay
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(0.1),
                        Colors.black.withOpacity(0.9),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      stops: const [0.3, 0.6, 1.0],
                    ),
                  ),
                ),
                
                // Glassmorphism Tag
                Positioned(
                  top: 16,
                  right: 16,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withOpacity(0.4), width: 1),
                        ),
                        child: Text(
                          widget.item.tag,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                  ),
                ).animate().fadeIn(delay: (400 + widget.index * 100).ms).slideX(begin: 0.5),
                
                // Content
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        widget.item.subtitle.toUpperCase(),
                        style: TextStyle(
                          color: AppColors.accent,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.5,
                        ),
                      ).animate().fadeIn(delay: (200 + widget.index * 100).ms).slideY(begin: 0.2),
                      const SizedBox(height: 6),
                      Text(
                        widget.item.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -1,
                          height: 1.1,
                        ),
                      ).animate().fadeIn(delay: (300 + widget.index * 100).ms).slideY(begin: 0.2),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ).animate().fadeIn(
          delay: (widget.index * 100).ms, 
          duration: 600.ms, 
          curve: Curves.easeOutCubic
        ).slideX(begin: 0.2),
      ),
    );
  }
}


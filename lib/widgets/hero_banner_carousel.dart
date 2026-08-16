import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import 'bouncing_widget.dart';

class BannerItem {
  final String imageUrl;
  final String subtitle;
  final String title;
  final String description;
  final String buttonText;

  BannerItem({
    required this.imageUrl,
    required this.subtitle,
    required this.title,
    required this.description,
    required this.buttonText,
  });
}

class HeroBannerCarousel extends StatefulWidget {
  final VoidCallback onExploreTap;

  const HeroBannerCarousel({super.key, required this.onExploreTap});

  @override
  State<HeroBannerCarousel> createState() => _HeroBannerCarouselState();
}

class _HeroBannerCarouselState extends State<HeroBannerCarousel> {
  int _currentPage = 0;
  final PageController _pageController = PageController();
  Timer? _timer;

  final List<BannerItem> _banners = [
    BannerItem(
      imageUrl: 'assets/images/stays_mascot.jpg',
      subtitle: 'PLAN YOUR ESCAPE',
      title: 'Explore Stays',
      description: 'Handpicked premium homes.',
      buttonText: 'View stays',
    ),
    BannerItem(
      imageUrl: 'assets/images/experience_mascot.jpg',
      subtitle: 'DISCOVER MORE',
      title: 'Unique\nExperiences',
      description: 'Memories for a lifetime.',
      buttonText: 'Find activities',
    ),
    BannerItem(
      imageUrl: 'assets/images/qube_mascot.jpg',
      subtitle: 'MEET YOUR AI GUIDE',
      title: 'Say Hi to\nQube',
      description: 'Your personal travel assistant.',
      buttonText: 'Talk to Qube',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (_pageController.hasClients) {
        int next = (_currentPage + 1) % _banners.length;
        _pageController.animateToPage(
          next,
          duration: const Duration(milliseconds: 800),
          curve: Curves.fastOutSlowIn,
        );
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          children: [
            PageView.builder(
              controller: _pageController,
              onPageChanged: (idx) => setState(() => _currentPage = idx),
              itemCount: _banners.length,
              itemBuilder: (context, index) {
                final banner = _banners[index];
                return Stack(
                  fit: StackFit.expand,
                  children: [
                    banner.imageUrl.startsWith('http')
                        ? Image.network(
                            banner.imageUrl,
                            fit: BoxFit.cover,
                            alignment: Alignment.topCenter,
                            errorBuilder: (_, __, ___) => Container(color: AppColors.primaryDark),
                          )
                        : Image.asset(
                            banner.imageUrl,
                            fit: BoxFit.cover,
                            alignment: Alignment.topCenter,
                            errorBuilder: (_, __, ___) => Container(color: AppColors.primaryDark),
                          ),
                    Container(
                      decoration: const BoxDecoration(
                        gradient: AppColors.heroOverlayGradient,
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(left: 20, bottom: 40, right: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Text(
                            banner.subtitle,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 1.5,
                              color: Colors.white.withOpacity(0.9),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            banner.title,
                            style: const TextStyle(
                              fontSize: 24,
                              height: 1.15,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            banner.description,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.white.withOpacity(0.85),
                            ),
                          ),
                          const SizedBox(height: 10),
                          BouncingWidget(
                            onTap: widget.onExploreTap,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  )
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Text(
                                    banner.buttonText,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary,
                                      height: 1.1,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  const Icon(Icons.arrow_forward_rounded, size: 14, color: AppColors.primary),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
            Positioned(
              bottom: 12,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  _banners.length,
                  (index) => GestureDetector(
                    onTap: () {
                      _pageController.animateToPage(
                        index,
                        duration: const Duration(milliseconds: 400),
                        curve: Curves.easeInOut,
                      );
                    },
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: _currentPage == index ? 24 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: _currentPage == index ? AppColors.primary : Colors.white.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(4),
                        boxShadow: [
                          if (_currentPage == index)
                            BoxShadow(color: AppColors.primary.withOpacity(0.4), blurRadius: 4, offset: const Offset(0, 2))
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class RoundedRadiusBorder extends RoundedRectangleBorder {
  const RoundedRadiusBorder({super.borderRadius});
}

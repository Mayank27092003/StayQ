import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../providers/app_provider.dart';
import '../navigation/app_router.dart';
import '../theme/app_colors.dart';

class WalkthroughScreen extends StatefulWidget {
  const WalkthroughScreen({Key? key}) : super(key: key);

  @override
  State<WalkthroughScreen> createState() => _WalkthroughScreenState();
}

class _WalkthroughScreenState extends State<WalkthroughScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<_WalkthroughItem> _items = [
    _WalkthroughItem(
      title: 'Welcome to Stay Q',
      description: 'Discover premium stays and zero-broker rentals across India with your favorite travel buddy.',
      imageUrl: 'assets/images/mascot1.jpg', 
    ),
    _WalkthroughItem(
      title: 'Find Your Perfect Stay',
      description: 'Filter by location, amenities, and price to find the exact vibe you are looking for.',
      imageUrl: 'assets/images/mascot2.jpg',
    ),
    _WalkthroughItem(
      title: 'RVs & Camping',
      description: 'Rent a campervan for a road trip or book a campsite under the stars. Adventure starts here! 🚐⛺',
      imageUrl: 'assets/images/mascot_rv.png',
      imageUrl2: 'assets/images/mascot_camping.png',
    ),
    _WalkthroughItem(
      title: 'Become a Host',
      description: 'Got a spare room or an entire villa? List it in minutes and start earning.',
      imageUrl: 'assets/images/mascot.jpg',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // Background Gradient
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.primaryDark, AppColors.background],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                Expanded(
                  child: PageView.builder(
                    controller: _pageController,
                    onPageChanged: (index) {
                      setState(() {
                        _currentPage = index;
                      });
                    },
                    itemCount: _items.length,
                    itemBuilder: (context, index) {
                      final item = _items[index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24.0),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Spacer(),
                            // Floating Transparent Mascot Image
                            SizedBox(
                              height: 320,
                              width: 280,
                              child: item.imageUrl2 != null
                                ? Row(
                                    children: [
                                      Expanded(
                                        child: Image.asset(
                                          item.imageUrl.replaceAll('.jpg', '.png'),
                                          fit: BoxFit.contain,
                                        ).animate().slideX(begin: -0.2).fadeIn(),
                                      ),
                                      const SizedBox(width: 16),
                                      Expanded(
                                        child: Image.asset(
                                          item.imageUrl2!.replaceAll('.jpg', '.png'),
                                          fit: BoxFit.contain,
                                        ).animate().slideX(begin: 0.2).fadeIn(),
                                      ),
                                    ],
                                  )
                                : (item.imageUrl.startsWith('http') 
                                    ? CachedNetworkImage(
                                        imageUrl: item.imageUrl,
                                        fit: BoxFit.contain,
                                        placeholder: (context, url) => const SizedBox(),
                                        errorWidget: (context, url, error) => const Icon(Icons.broken_image, size: 50, color: Colors.white54),
                                      )
                                    : Image.asset(
                                        item.imageUrl.replaceAll('.jpg', '.png'),
                                        fit: BoxFit.contain,
                                        errorBuilder: (context, error, stackTrace) => const Icon(Icons.broken_image, size: 50, color: Colors.white54),
                                      )),
                            ).animate(key: ValueKey(index)).fadeIn(duration: 600.ms).slideY(begin: 0.1, curve: Curves.easeOut),
                            const SizedBox(height: 48),
                            // Text Details
                            Text(
                              item.title,
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                              textAlign: TextAlign.center,
                            ).animate(key: ValueKey('t_$index')).fadeIn(delay: 200.ms).slideY(begin: 0.3),
                            const SizedBox(height: 16),
                            Text(
                              item.description,
                              style: const TextStyle(
                                fontSize: 16,
                                color: AppColors.textSecondary,
                                height: 1.5,
                              ),
                              textAlign: TextAlign.center,
                            ).animate(key: ValueKey('d_$index')).fadeIn(delay: 400.ms).slideY(begin: 0.3),
                            const Spacer(flex: 2),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                // Bottom Bar
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
                  color: Colors.transparent,
                  child: SafeArea(
                    top: false,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        SmoothPageIndicator(
                          controller: _pageController,
                          count: _items.length,
                          effect: const ExpandingDotsEffect(
                            activeDotColor: AppColors.primary,
                            dotColor: Colors.grey, // Made grey to be visible
                            dotHeight: 8,
                            dotWidth: 8,
                            expansionFactor: 3,
                          ),
                        ),
                        GestureDetector(
                          onTap: () async {
                            if (_currentPage < _items.length - 1) {
                              _pageController.nextPage(
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                              );
                            } else {
                              await context.read<AppProvider>().completeWalkthrough();
                              if (context.mounted) {
                                Navigator.pushReplacementNamed(context, AppRoutes.login);
                              }
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(100),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withOpacity(0.3),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                )
                              ]
                            ),
                            child: Text(
                              _currentPage < _items.length - 1 ? 'Next' : 'Get Started',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _WalkthroughItem {
  final String title;
  final String description;
  final String imageUrl;
  final String? imageUrl2;

  _WalkthroughItem({
    required this.title,
    required this.description,
    required this.imageUrl,
    this.imageUrl2,
  });
}

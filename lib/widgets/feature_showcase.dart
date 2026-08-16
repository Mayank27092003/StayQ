import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_motion.dart';
import 'bouncing_widget.dart';

// ───────────────────────────────────────────────────────────────
// FEATURE SHOWCASE POPUP — Premium app intro with animated slides
// ───────────────────────────────────────────────────────────────
// A full-screen modal that slides through app features with
// rich animations. Shown on first launch or after major updates.
// ───────────────────────────────────────────────────────────────

class FeatureShowcase {
  static void show(BuildContext context) {
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        transitionDuration: AppMotion.extended,
        reverseTransitionDuration: AppMotion.standard,
        pageBuilder: (ctx, anim, secondaryAnim) => const _FeatureShowcaseOverlay(),
        transitionsBuilder: (ctx, anim, secondaryAnim, child) {
          return FadeTransition(
            opacity: CurvedAnimation(parent: anim, curve: Curves.easeOut),
            child: child,
          );
        },
      ),
    );
  }
}

class _FeatureShowcaseOverlay extends StatefulWidget {
  const _FeatureShowcaseOverlay();

  @override
  State<_FeatureShowcaseOverlay> createState() => _FeatureShowcaseOverlayState();
}

class _FeatureShowcaseOverlayState extends State<_FeatureShowcaseOverlay>
    with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  static const _features = [
    _FeatureSlide(
      icon: Icons.explore_rounded,
      accentColor: Color(0xFF5A31F4),
      title: 'Discover Amazing Stays',
      subtitle:
          'Browse thousands of unique properties — from cozy cabins to luxury villas. Filter by price, amenities, and location.',
      backgroundEmoji: '🏠',
    ),
    _FeatureSlide(
      icon: Icons.calendar_today_rounded,
      accentColor: Color(0xFF12B76A),
      title: 'Book Instantly',
      subtitle:
          'Check real-time availability, pick your dates, and book in seconds. No waiting, no hassle — just tap and go.',
      backgroundEmoji: '📅',
    ),
    _FeatureSlide(
      icon: Icons.chat_bubble_outline_rounded,
      accentColor: Color(0xFF2E6DA4),
      title: 'Chat with Hosts',
      subtitle:
          'Message your host directly before and during your stay. Ask questions, get tips, and coordinate check-in seamlessly.',
      backgroundEmoji: '💬',
    ),
    _FeatureSlide(
      icon: Icons.auto_awesome_rounded,
      accentColor: Color(0xFFD6B354),
      title: 'Meet Stay Q — Your Travel Buddy',
      subtitle:
          'Stay Q is your personal travel companion. Ask for local food recommendations, hidden trekking trails, or the best viewpoints.',
      backgroundEmoji: '🐝',
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _nextPage() {
    AppMotion.tapSelection();
    if (_currentPage < _features.length - 1) {
      _pageController.nextPage(
        duration: AppMotion.extended,
        curve: AppMotion.signatureCurve,
      );
    } else {
      // Last page — dismiss
      AppMotion.tapMedium();
      Navigator.of(context).pop();
    }
  }

  void _skip() {
    AppMotion.tapLight();
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black.withValues(alpha: 0.85),
      body: SafeArea(
        child: Column(
          children: [
            // Skip button
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: BouncingWidget(
                  onTap: _skip,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Skip',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
            ).animate().fadeIn(delay: 500.ms, duration: AppMotion.standard),

            // Page View
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (i) => setState(() => _currentPage = i),
                itemCount: _features.length,
                itemBuilder: (context, index) {
                  final feature = _features[index];
                  return _FeatureCard(feature: feature, index: index);
                },
              ),
            ),

            // Dots + CTA
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
              child: Column(
                children: [
                  // Dot Indicators
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(_features.length, (i) {
                      final isActive = i == _currentPage;
                      return AnimatedContainer(
                        duration: AppMotion.standard,
                        curve: AppMotion.signatureCurve,
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: isActive ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: isActive
                              ? _features[_currentPage].accentColor
                              : Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      );
                    }),
                  ),

                  const SizedBox(height: 24),

                  // CTA Button
                  BouncingWidget(
                    onTap: _nextPage,
                    child: AnimatedContainer(
                      duration: AppMotion.standard,
                      width: double.infinity,
                      height: 56,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            _features[_currentPage].accentColor,
                            _features[_currentPage]
                                .accentColor
                                .withValues(alpha: 0.7),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: _features[_currentPage]
                                .accentColor
                                .withValues(alpha: 0.4),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          _currentPage == _features.length - 1
                              ? 'Let\'s Go! 🚀'
                              : 'Next',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ───────────────────────────────────────────────────────────────
// Individual Feature Card with animated icon, particles, and text
// ───────────────────────────────────────────────────────────────
class _FeatureSlide {
  final IconData icon;
  final Color accentColor;
  final String title;
  final String subtitle;
  final String backgroundEmoji;

  const _FeatureSlide({
    required this.icon,
    required this.accentColor,
    required this.title,
    required this.subtitle,
    required this.backgroundEmoji,
  });
}

class _FeatureCard extends StatelessWidget {
  final _FeatureSlide feature;
  final int index;

  const _FeatureCard({required this.feature, required this.index});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Animated Icon with Glow Ring
          Stack(
            alignment: Alignment.center,
            children: [
              // Outer glow ring
              Container(
                width: 160,
                height: 160,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: feature.accentColor.withValues(alpha: 0.15),
                    width: 2,
                  ),
                ),
              )
                  .animate(
                      onPlay: (c) => c.repeat(reverse: true))
                  .scaleXY(
                    begin: 0.9,
                    end: 1.1,
                    duration: 2000.ms,
                    curve: Curves.easeInOut,
                  ),

              // Middle ring
              Container(
                width: 130,
                height: 130,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: feature.accentColor.withValues(alpha: 0.25),
                    width: 2,
                  ),
                ),
              )
                  .animate(
                      onPlay: (c) => c.repeat(reverse: true))
                  .scaleXY(
                    begin: 1.0,
                    end: 0.85,
                    duration: 2400.ms,
                    curve: Curves.easeInOut,
                  ),

              // Core icon circle
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      feature.accentColor,
                      feature.accentColor.withValues(alpha: 0.6),
                    ],
                  ),
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: feature.accentColor.withValues(alpha: 0.4),
                      blurRadius: 30,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: Icon(feature.icon, size: 48, color: Colors.white),
              )
                  .animate()
                  .scaleXY(
                    begin: 0,
                    end: 1,
                    duration: 600.ms,
                    curve: AppMotion.bounceCurve,
                  )
                  .fadeIn(duration: 300.ms),

              // Floating emoji particles
              ..._buildFloatingEmojis(feature.backgroundEmoji),
            ],
          ),

          const SizedBox(height: 48),

          // Title
          Text(
            feature.title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              height: 1.2,
            ),
          )
              .animate()
              .fadeIn(delay: 200.ms, duration: AppMotion.extended)
              .slideY(begin: 0.3, end: 0),

          const SizedBox(height: 16),

          // Subtitle
          Text(
            feature.subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 15,
              color: Colors.white.withValues(alpha: 0.7),
              height: 1.5,
            ),
          )
              .animate()
              .fadeIn(delay: 400.ms, duration: AppMotion.extended)
              .slideY(begin: 0.3, end: 0),
        ],
      ),
    );
  }

  List<Widget> _buildFloatingEmojis(String emoji) {
    final random = Random(index * 42);
    return List.generate(5, (i) {
      final angle = (i / 5) * 2 * pi;
      final radius = 90.0 + random.nextDouble() * 40;
      final x = cos(angle) * radius;
      final y = sin(angle) * radius;
      final delay = (i * 200 + 300);

      return Positioned(
        left: 80 + x - 12,
        top: 80 + y - 12,
        child: Text(emoji, style: const TextStyle(fontSize: 24))
            .animate(
                onPlay: (c) => c.repeat(reverse: true))
            .moveY(
              begin: -8,
              end: 8,
              duration: Duration(milliseconds: 1800 + i * 200),
              curve: Curves.easeInOut,
            )
            .fadeIn(delay: Duration(milliseconds: delay), duration: 600.ms)
            .then()
            .animate(
                onPlay: (c) => c.repeat(reverse: true))
            .rotate(
              begin: -0.05,
              end: 0.05,
              duration: Duration(milliseconds: 2000 + i * 300),
            ),
      );
    });
  }
}

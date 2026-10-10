import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../providers/host_onboarding_provider.dart';
import '../navigation/app_router.dart';
import 'splash/logo_path_painter.dart';
import 'host/onboarding/host_onboarding_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  
  late Animation<double> _drawAnimation;
  late Animation<double> _shimmerAnimation;
  late Animation<double> _imageFadeAnimation;
  late Animation<double> _imageScaleAnimation;
  late Animation<double> _textFadeAnimation;

  @override
  void initState() {
    super.initState();
    
    // Total animation: 5 seconds (Slower and smoother)
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 5000),
    );

    // 0.0s -> 2.0s: Draw the paths (roof -> S -> Q -> windows)
    _drawAnimation = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.50, curve: Curves.easeInOut),
    );

    // 2.0s -> 2.5s: Shimmer effect on the lines
    _shimmerAnimation = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.50, 0.65, curve: Curves.linear),
    );

    // 2.4s -> 3.0s: The 3D logo fades in
    _imageFadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.60, 0.75, curve: Curves.easeIn),
    );

    // 2.4s -> 4.0s: The 3D logo subtly scales up ("breathing")
    _imageScaleAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.60, 1.0, curve: Curves.easeOutCubic),
      ),
    );

    // 3.0s -> 3.6s: "StayQ" text fades in
    _textFadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.75, 0.90, curve: Curves.easeOut),
    );

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        // A tiny delay before navigating to let the final frame linger
        Future.delayed(const Duration(milliseconds: 300), () async {
          if (!mounted) return;
          final provider = context.read<AppProvider>();
          if (!provider.isLoggedIn) {
            Navigator.pushReplacementNamed(context, provider.hasSeenWalkthrough ? AppRoutes.login : AppRoutes.walkthrough); return;
          }
          final complete = await provider.checkProfileComplete();
          if (!mounted) return;
          if (!complete) { Navigator.pushReplacementNamed(context, AppRoutes.completeProfile); return; }
          final draft = context.read<HostOnboardingProvider>();
          await draft.ready;
          if (!mounted) return;
          if (provider.isHostMode && draft.currentPage > 0 && draft.title.isNotEmpty) {
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const HostOnboardingScreen(startAtBeginning: false)));
          } else Navigator.pushReplacementNamed(context, AppRoutes.mainShell);
        });
      }
    });

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Deep purple background matching the logo's vibe
    return Scaffold(
      backgroundColor: const Color(0xFF130925), 
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Align(
            alignment: const Alignment(0, -0.2), // Shifted slightly above dead center
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 300,
                  height: 300,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // The custom painted drawing animation (Now handles exact fill too)
                      CustomPaint(
                        size: const Size(200, 200),
                        painter: LogoPathPainter(
                          progress: _drawAnimation.value,
                          shimmerOffset: _shimmerAnimation.value,
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 12),
                
                // 3. The Wordmark fading in
                Opacity(
                  opacity: _textFadeAnimation.value,
                  child: Transform.translate(
                    offset: Offset(0, (1 - _textFadeAnimation.value) * 15),
                    child: const Text(
                      'STAYQ',
                      style: TextStyle(
                        fontSize: 40,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: 5.0,
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 8),
                
                Opacity(
                  opacity: _textFadeAnimation.value,
                  child: const Text(
                    'HOME STAYS AND BEYOND',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFFB388FF),
                      letterSpacing: 3.0,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

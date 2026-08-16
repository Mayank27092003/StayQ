import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';

class StayQLoader extends StatefulWidget {
  final double size;
  final String? message;

  const StayQLoader({
    super.key,
    this.size = 48.0,
    this.message,
  });

  @override
  State<StayQLoader> createState() => _StayQLoaderState();
}

class _StayQLoaderState extends State<StayQLoader>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _shimmerAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: AppMotion.narrative, // Uses 1200ms
    )..repeat();

    _scaleAnimation = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween<double>(begin: 0.85, end: 1.0)
            .chain(CurveTween(curve: AppMotion.signatureCurve)),
        weight: 50,
      ),
      TweenSequenceItem(
        tween: Tween<double>(begin: 1.0, end: 0.85)
            .chain(CurveTween(curve: AppMotion.signatureCurve)),
        weight: 50,
      ),
    ]).animate(_controller);

    _shimmerAnimation = Tween<double>(begin: -1.0, end: 2.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.linear),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Transform.scale(
              scale: _scaleAnimation.value,
                child: ShaderMask(
                  shaderCallback: (bounds) {
                    return LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      stops: const [0.0, 0.4, 0.5, 0.6, 1.0],
                      colors: [
                        Colors.white,
                        Colors.white,
                        Colors.white.withValues(alpha: 0.2), // The shimmer passing over
                        Colors.white,
                        Colors.white,
                      ],
                      transform: GradientRotation(_shimmerAnimation.value * math.pi),
                    ).createShader(bounds);
                  },
                  child: Image.asset(
                    'assets/images/logo_icon.png',
                    width: widget.size,
                    height: widget.size,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => 
                        Icon(Icons.villa_rounded, size: widget.size, color: AppColors.primary),
                  ),
                ),
            );
          },
        ),
        if (widget.message != null) ...[
          const SizedBox(height: 16),
          Text(
            widget.message!,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }
}


import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';

class AnimatedHeart extends StatefulWidget {
  final bool isWishlisted;
  final VoidCallback onTap;
  final double size;

  const AnimatedHeart({
    Key? key,
    required this.isWishlisted,
    required this.onTap,
    this.size = 24.0,
  }) : super(key: key);

  @override
  State<AnimatedHeart> createState() => _AnimatedHeartState();
}

class _AnimatedHeartState extends State<AnimatedHeart>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _particleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: AppMotion.standard,
    );

    _setupAnimations(widget.isWishlisted);
  }

  void _setupAnimations(bool isWishlisted) {
    if (isWishlisted) {
      _scaleAnimation = TweenSequence<double>([
        TweenSequenceItem(
          tween: Tween<double>(begin: 1.0, end: 1.3)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 40.0,
        ),
        TweenSequenceItem(
          tween: Tween<double>(begin: 1.3, end: 1.0)
              .chain(CurveTween(curve: AppMotion.bounceCurve)),
          weight: 60.0,
        ),
      ]).animate(_controller);

      _particleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(
          parent: _controller,
          curve: const Interval(0.1, 1.0, curve: Curves.easeOut),
        ),
      );
    } else {
      _scaleAnimation = TweenSequence<double>([
        TweenSequenceItem(
          tween: Tween<double>(begin: 1.0, end: 0.8)
              .chain(CurveTween(curve: Curves.easeOut)),
          weight: 50.0,
        ),
        TweenSequenceItem(
          tween: Tween<double>(begin: 0.8, end: 1.0)
              .chain(CurveTween(curve: Curves.easeIn)),
          weight: 50.0,
        ),
      ]).animate(_controller);

      _particleAnimation = const AlwaysStoppedAnimation(0.0);
    }
  }

  @override
  void didUpdateWidget(covariant AnimatedHeart oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.isWishlisted != widget.isWishlisted) {
      _setupAnimations(widget.isWishlisted);
      _controller.forward(from: 0.0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTap() {
    AppMotion.tapMedium();
    widget.onTap();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: _handleTap,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Stack(
            alignment: Alignment.center,
            clipBehavior: Clip.none,
            children: [
              if (widget.isWishlisted && _particleAnimation.value > 0)
                CustomPaint(
                  size: Size(widget.size, widget.size),
                  painter: _ParticlePainter(
                    progress: _particleAnimation.value,
                    color: AppColors.errorRed,
                  ),
                ),
              Transform.scale(
                scale: _scaleAnimation.value,
                child: Icon(
                  widget.isWishlisted ? Icons.favorite : Icons.favorite_border,
                  color: widget.isWishlisted
                      ? AppColors.errorRed
                      : AppColors.textPrimary,
                  size: widget.size,
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ParticlePainter extends CustomPainter {
  final double progress;
  final Color color;

  _ParticlePainter({
    required this.progress,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (progress == 0 || progress == 1) return;

    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = size.width * 1.5;
    final currentRadius = maxRadius * progress;
    final particleRadius = (size.width * 0.15) * (1 - progress);
    
    final paint = Paint()
      ..color = color.withOpacity(1 - progress)
      ..style = PaintingStyle.fill;

    const particleCount = 7;
    for (int i = 0; i < particleCount; i++) {
      final angle = (i * 2 * pi) / particleCount - (pi / 2);
      // Add slight rotation effect as they burst outward
      final finalAngle = angle + (progress * 0.5);
      
      final dx = center.dx + cos(finalAngle) * currentRadius;
      final dy = center.dy + sin(finalAngle) * currentRadius;
      
      canvas.drawCircle(Offset(dx, dy), particleRadius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _ParticlePainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.color != color;
  }
}

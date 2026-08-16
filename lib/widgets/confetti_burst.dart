import 'dart:math';
import 'package:flutter/material.dart';

class ConfettiBurst extends StatefulWidget {
  final Widget child;

  const ConfettiBurst({super.key, required this.child});

  @override
  State<ConfettiBurst> createState() => _ConfettiBurstState();
}

class _ConfettiBurstState extends State<ConfettiBurst> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<_Particle> _particles = [];
  final Random _random = Random();

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    );

    // Generate 40 vibrant confetti particles
    final colors = [
      const Color(0xFF5A31F4),
      const Color(0xFF7F56D9),
      const Color(0xFFFFB800),
      const Color(0xFF12B76A),
      const Color(0xFFF04438),
    ];

    for (int i = 0; i < 40; i++) {
      _particles.add(
        _Particle(
          angle: _random.nextDouble() * 2 * pi,
          speed: 150 + _random.nextDouble() * 250,
          color: colors[i % colors.length],
          size: 6 + _random.nextDouble() * 6,
          rotationSpeed: (_random.nextDouble() - 0.5) * 10,
        ),
      );
    }

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      children: [
        widget.child,
        AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            final progress = _controller.value;
            if (progress >= 1.0) return const SizedBox();

            return CustomPaint(
              size: const Size(300, 300),
              painter: _ConfettiPainter(
                particles: _particles,
                progress: progress,
              ),
            );
          },
        ),
      ],
    );
  }
}

class _Particle {
  final double angle;
  final double speed;
  final Color color;
  final double size;
  final double rotationSpeed;

  _Particle({
    required this.angle,
    required this.speed,
    required this.color,
    required this.size,
    required this.rotationSpeed,
  });
}

class _ConfettiPainter extends CustomPainter {
  final List<_Particle> particles;
  final double progress;

  _ConfettiPainter({required this.particles, required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);

    for (final p in particles) {
      final distance = p.speed * progress;
      final dx = center.dx + cos(p.angle) * distance;
      final dy = center.dy + sin(p.angle) * distance + (progress * progress * 80); // gravity
      final opacity = (1.0 - progress).clamp(0.0, 1.0);

      final paint = Paint()
        ..color = p.color.withValues(alpha: opacity)
        ..style = PaintingStyle.fill;

      canvas.save();
      canvas.translate(dx, dy);
      canvas.rotate(progress * p.rotationSpeed);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromCenter(center: Offset.zero, width: p.size, height: p.size * 1.5),
          const Radius.circular(2),
        ),
        paint,
      );
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

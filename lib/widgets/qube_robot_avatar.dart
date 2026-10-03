import 'dart:math' as math;
import 'package:flutter/material.dart';

/// Interactive, animated 3D Travel Robot Avatar for Qube AI Concierge.
/// Features smooth hovering/levitation, pulsating cybernetic aura,
/// and reactive thinking/processing glow animations.
class QubeRobotAvatar extends StatefulWidget {
  final double size;
  final bool animate;
  final bool isThinking;
  final bool showBadge;
  final VoidCallback? onTap;

  const QubeRobotAvatar({
    super.key,
    this.size = 56,
    this.animate = true,
    this.isThinking = false,
    this.showBadge = false,
    this.onTap,
  });

  @override
  State<QubeRobotAvatar> createState() => _QubeRobotAvatarState();
}

class _QubeRobotAvatarState extends State<QubeRobotAvatar> with TickerProviderStateMixin {
  late AnimationController _floatController;
  late Animation<double> _floatAnimation;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  late AnimationController _spinController;

  @override
  void initState() {
    super.initState();

    // Floating levitation physics
    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    );
    _floatAnimation = Tween<double>(begin: -3.5, end: 3.5).animate(
      CurvedAnimation(parent: _floatController, curve: Curves.easeInOutSine),
    );

    // Cyber aura pulsation
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _pulseAnimation = Tween<double>(begin: 0.85, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Thinking spin ring
    _spinController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    );

    if (widget.animate) {
      _floatController.repeat(reverse: true);
      _pulseController.repeat(reverse: true);
    }

    if (widget.isThinking) {
      _spinController.repeat();
    }
  }

  @override
  void didUpdateWidget(covariant QubeRobotAvatar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isThinking != oldWidget.isThinking) {
      if (widget.isThinking) {
        _spinController.repeat();
        _pulseController.duration = const Duration(milliseconds: 800);
        _pulseController.repeat(reverse: true);
      } else {
        _spinController.stop();
        _pulseController.duration = const Duration(milliseconds: 1500);
        _pulseController.repeat(reverse: true);
      }
    }
  }

  @override
  void dispose() {
    _floatController.dispose();
    _pulseController.dispose();
    _spinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.size;

    Widget avatarContent = SizedBox(
      width: s + 16,
      height: s + 16,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // 1. Pulsing Neon Cyber Aura Glow
          if (widget.animate)
            AnimatedBuilder(
              animation: _pulseAnimation,
              builder: (context, child) {
                final scale = _pulseAnimation.value;
                final isThinking = widget.isThinking;
                return Transform.scale(
                  scale: scale,
                  child: Container(
                    width: s + 8,
                    height: s + 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: isThinking
                              ? const Color(0xFF06B6D4).withValues(alpha: 0.6)
                              : const Color(0xFF8B5CF6).withValues(alpha: 0.38),
                          blurRadius: isThinking ? 22 : 14,
                          spreadRadius: isThinking ? 4 : 1,
                        ),
                        if (isThinking)
                          BoxShadow(
                            color: const Color(0xFFEC4899).withValues(alpha: 0.35),
                            blurRadius: 16,
                            spreadRadius: 2,
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),

          // 2. Rotating Hologram Ring when thinking
          if (widget.isThinking)
            AnimatedBuilder(
              animation: _spinController,
              builder: (context, child) {
                return Transform.rotate(
                  angle: _spinController.value * 2 * math.pi,
                  child: Container(
                    width: s + 12,
                    height: s + 12,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFF06B6D4).withValues(alpha: 0.8),
                        width: 2.2,
                        strokeAlign: BorderSide.strokeAlignOutside,
                      ),
                      gradient: const SweepGradient(
                        colors: [
                          Colors.transparent,
                          Color(0xFF06B6D4),
                          Color(0xFFA855F7),
                          Colors.transparent,
                        ],
                        stops: [0.0, 0.4, 0.7, 1.0],
                      ),
                    ),
                  ),
                );
              },
            ),

          // 3. Robot Sphere Container
          Container(
            width: s,
            height: s,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFF7C3AED), Color(0xFF3B82F6), Color(0xFF06B6D4)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(
                color: widget.isThinking ? const Color(0xFF22D3EE) : Colors.white,
                width: s > 60 ? 2.5 : 1.8,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.2),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: ClipOval(
              child: Image.asset(
                'assets/images/qube_robot.jpg',
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: const Color(0xFF6366F1),
                  child: Icon(
                    Icons.smart_toy_rounded,
                    color: Colors.white,
                    size: s * 0.55,
                  ),
                ),
              ),
            ),
          ),

          // 4. Online / Status Badge (Optional)
          if (widget.showBadge)
            Positioned(
              right: 4,
              bottom: 4,
              child: Container(
                width: math.max(10, s * 0.22),
                height: math.max(10, s * 0.22),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: widget.isThinking ? const Color(0xFF06B6D4) : const Color(0xFF10B981),
                  border: Border.all(color: Colors.white, width: 1.8),
                  boxShadow: [
                    BoxShadow(
                      color: (widget.isThinking ? const Color(0xFF06B6D4) : const Color(0xFF10B981))
                          .withValues(alpha: 0.7),
                      blurRadius: 6,
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );

    // Apply floating translation
    if (widget.animate) {
      avatarContent = AnimatedBuilder(
        animation: _floatAnimation,
        builder: (context, child) {
          return Transform.translate(
            offset: Offset(0, _floatAnimation.value),
            child: child,
          );
        },
        child: avatarContent,
      );
    }

    if (widget.onTap != null) {
      return GestureDetector(
        onTap: widget.onTap,
        child: avatarContent,
      );
    }

    return avatarContent;
  }
}

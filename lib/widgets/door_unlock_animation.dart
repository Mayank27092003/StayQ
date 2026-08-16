import 'dart:math';
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';

class DoorUnlockAnimation extends StatefulWidget {
  final VoidCallback? onCompleted;

  const DoorUnlockAnimation({super.key, this.onCompleted});

  @override
  State<DoorUnlockAnimation> createState() => _DoorUnlockAnimationState();
}

class _DoorUnlockAnimationState extends State<DoorUnlockAnimation> with TickerProviderStateMixin {
  late AnimationController _keyController;
  late AnimationController _doorController;
  late AnimationController _stampController;

  late Animation<double> _keyRotation;
  late Animation<double> _doorAngle;
  late Animation<double> _lightOpacity;
  late Animation<double> _stampScale;

  @override
  void initState() {
    super.initState();

    // 1. Key Turn Controller (0ms - 400ms)
    _keyController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 450),
    );
    _keyRotation = Tween<double>(begin: 0.0, end: pi / 2).animate(
      CurvedAnimation(parent: _keyController, curve: Curves.easeInOutBack),
    );

    // 2. Door Open & Light Spill Controller (450ms - 1000ms)
    _doorController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 650),
    );
    _doorAngle = Tween<double>(begin: 0.0, end: -pi / 3).animate(
      CurvedAnimation(parent: _doorController, curve: AppMotion.signatureCurve),
    );
    _lightOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _doorController, curve: Curves.easeIn),
    );

    // 3. Wax Stamp Controller (1000ms - 1400ms)
    _stampController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _stampScale = Tween<double>(begin: 3.0, end: 1.0).animate(
      CurvedAnimation(parent: _stampController, curve: AppMotion.bounceCurve),
    );

    // Trigger Sequence
    _startSequence();
  }

  void _startSequence() async {
    await Future.delayed(const Duration(milliseconds: 100));
    if (!mounted) return;
    AppMotion.tapLight();
    await _keyController.forward();

    if (!mounted) return;
    AppMotion.tapMedium();
    await _doorController.forward();

    if (!mounted) return;
    AppMotion.tapHeavy();
    await _stampController.forward();

    if (widget.onCompleted != null) {
      widget.onCompleted!();
    }
  }

  @override
  void dispose() {
    _keyController.dispose();
    _doorController.dispose();
    _stampController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 220,
      width: 220,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // 1. Warm Golden Light Spill Beam
          AnimatedBuilder(
            animation: _lightOpacity,
            builder: (context, child) {
              return Opacity(
                opacity: _lightOpacity.value,
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        const Color(0xFFFFD700).withValues(alpha: 0.6),
                        AppColors.primary.withValues(alpha: 0.3),
                        Colors.transparent,
                      ],
                      stops: const [0.0, 0.5, 1.0],
                    ),
                  ),
                ),
              );
            },
          ),

          // 2. Door Frame & Swinging Door Arch
          AnimatedBuilder(
            animation: _doorAngle,
            builder: (context, child) {
              return Transform(
                transform: Matrix4.identity()
                  ..setEntry(3, 2, 0.002) // Perspective 3D
                  ..rotateY(_doorAngle.value),
                alignment: Alignment.centerLeft,
                child: Container(
                  width: 120,
                  height: 160,
                  decoration: BoxDecoration(
                    color: AppColors.primaryDark,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.3),
                        blurRadius: 16,
                        offset: const Offset(4, 8),
                      ),
                    ],
                    border: Border.all(color: const Color(0xFFFFD700), width: 2),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Door Handle / Keyhole
                      AnimatedBuilder(
                        animation: _keyRotation,
                        builder: (context, _) {
                          return Transform.rotate(
                            angle: _keyRotation.value,
                            child: const Icon(
                              Icons.vpn_key_rounded,
                              color: Color(0xFFFFD700),
                              size: 32,
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'STAY Q',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 2.0,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),

          // 3. Golden Wax Stamp Seal Effect
          AnimatedBuilder(
            animation: _stampScale,
            builder: (context, child) {
              if (_stampController.value == 0) return const SizedBox();
              return Transform.scale(
                scale: _stampScale.value,
                child: Container(
                  width: 76,
                  height: 76,
                  decoration: const BoxDecoration(
                    color: Color(0xFFD4AF37), // Metallic Gold Wax
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Color(0x99D4AF37),
                        blurRadius: 20,
                        offset: Offset(0, 6),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.check_rounded,
                      color: Colors.white,
                      size: 44,
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

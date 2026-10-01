import 'package:flutter/material.dart';
import '../screens/qube/qube_planner_screen.dart';
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';

class DraggableQubeMascot extends StatefulWidget {
  const DraggableQubeMascot({super.key});

  @override
  State<DraggableQubeMascot> createState() => _DraggableQubeMascotState();
}

class _DraggableQubeMascotState extends State<DraggableQubeMascot> with SingleTickerProviderStateMixin {
  Offset _position = Offset.zero;
  bool _initialized = false;
  bool _isDragging = false;
  late AnimationController _floatController;
  late Animation<double> _floatAnimation;

  @override
  void initState() {
    super.initState();
    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);
    _floatAnimation = Tween<double>(begin: -3.0, end: 3.0).animate(
      CurvedAnimation(parent: _floatController, curve: Curves.easeInOut),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      final size = MediaQuery.of(context).size;
      final padding = MediaQuery.of(context).padding;
      // Default to right edge, comfortably above bottom nav bar
      _position = Offset(size.width - 78, size.height - padding.bottom - 170);
      _initialized = true;
    }
  }

  @override
  void dispose() {
    _floatController.dispose();
    super.dispose();
  }

  void _openQube(BuildContext context) {
    AppMotion.tapHeavy();
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const QubePlannerScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final padding = MediaQuery.of(context).padding;

    return AnimatedPositioned(
      duration: _isDragging ? Duration.zero : const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
      left: _position.dx,
      top: _position.dy,
      child: RepaintBoundary(
        key: const ValueKey('qube_mascot_repaint_layer'),
        child: GestureDetector(
          onPanStart: (_) {
            setState(() {
              _isDragging = true;
            });
          },
          onPanUpdate: (details) {
            // Strictly clamp dragging bounds inside active screen area
            final newX = (_position.dx + details.delta.dx).clamp(12.0, size.width - 78.0);
            final newY = (_position.dy + details.delta.dy).clamp(padding.top + 24.0, size.height - padding.bottom - 140.0);
            setState(() {
              _position = Offset(newX, newY);
            });
          },
          onPanEnd: (details) {
            // Smoothly snap to nearest left or right edge on release (like chat-heads)
            final snapX = _position.dx < (size.width / 2) ? 14.0 : (size.width - 78.0);
            setState(() {
              _isDragging = false;
              _position = Offset(snapX, _position.dy);
            });
          },
          onTap: () => _openQube(context),
          child: AnimatedBuilder(
            animation: _floatAnimation,
            builder: (context, child) {
              final offsetY = _isDragging ? 0.0 : _floatAnimation.value;
              return Transform.translate(
                offset: Offset(0, offsetY),
                child: child,
              );
            },
            child: Material(
              color: Colors.transparent,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 62,
                    height: 62,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        colors: [AppColors.primary, Color(0xFF7C3AED)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: _isDragging ? 0.2 : 0.35),
                          blurRadius: _isDragging ? 8 : 14,
                          spreadRadius: _isDragging ? 0 : 1,
                          offset: const Offset(0, 3),
                        ),
                      ],
                      border: Border.all(color: Colors.white, width: 2.2),
                    ),
                    child: ClipOval(
                      child: Image.asset(
                        'assets/images/qube_real_human.jpg',
                        fit: BoxFit.cover,
                        alignment: const Alignment(0, -0.65),
                        errorBuilder: (_, __, ___) => const Icon(
                          Icons.travel_explore_rounded,
                          color: Colors.white,
                          size: 30,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 3),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.88),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 0.7),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.25),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.auto_awesome, color: Colors.amber, size: 10),
                        SizedBox(width: 3.5),
                        Text(
                          'Trip Planner',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 9.5,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

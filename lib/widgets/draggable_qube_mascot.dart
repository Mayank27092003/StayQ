import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../screens/qube/qube_planner_screen.dart';
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';

class DraggableQubeMascot extends StatefulWidget {
  const DraggableQubeMascot({super.key});

  @override
  State<DraggableQubeMascot> createState() => _DraggableQubeMascotState();
}

class _DraggableQubeMascotState extends State<DraggableQubeMascot> {
  Offset _position = const Offset(20, 100);
  bool _isDragging = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Default position to bottom right, above bottom nav bar
    final size = MediaQuery.of(context).size;
    if (_position == const Offset(20, 100)) {
      setState(() {
        _position = Offset(size.width - 80, size.height - 180);
      });
    }
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
    return Positioned(
      left: _position.dx,
      top: _position.dy,
      child: GestureDetector(
        onPanStart: (_) => setState(() => _isDragging = true),
        onPanUpdate: (details) {
          setState(() {
            _position += details.delta;
          });
        },
        onPanEnd: (_) => setState(() => _isDragging = false),
        onTap: () => _openQube(context),
        child: Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.4),
                blurRadius: 15,
                spreadRadius: 2,
                offset: const Offset(0, 4),
              ),
            ],
            border: Border.all(color: AppColors.primary, width: 2),
          ),
          child: ClipOval(
            child: Image.asset(
              'assets/images/qube_mascot.jpg',
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const Icon(Icons.auto_awesome, color: AppColors.primary),
            ),
          ),
        ).animate(
          onPlay: (controller) => controller.repeat(reverse: true),
        ).moveY(
          begin: -4, 
          end: 4, 
          duration: _isDragging ? 0.ms : 1500.ms, 
          curve: Curves.easeInOut
        ).scale(
          begin: const Offset(1, 1),
          end: const Offset(1.05, 1.05),
          duration: 1500.ms,
        ),
      ),
    );
  }
}

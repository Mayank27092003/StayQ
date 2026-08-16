import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lottie/lottie.dart';

class HostVerificationScreen extends StatelessWidget {
  const HostVerificationScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 40.0),
      color: Colors.white,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Playful animation combining Lottie/Animate concepts
          Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 150,
                height: 150,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF5A31F4).withOpacity(0.1),
                ),
              ).animate(onPlay: (controller) => controller.repeat())
               .scale(begin: const Offset(0.8, 0.8), end: const Offset(1.2, 1.2), duration: 2000.ms, curve: Curves.easeInOut)
               .fade(begin: 1.0, end: 0.0, duration: 2000.ms, curve: Curves.easeOut),
               
              Container(
                width: 100,
                height: 100,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFF5A31F4),
                ),
                child: const Icon(
                  Icons.search_rounded,
                  size: 50,
                  color: Colors.white,
                ),
              ).animate(onPlay: (controller) => controller.repeat(reverse: true))
               .scaleXY(begin: 0.9, end: 1.1, duration: 1000.ms, curve: Curves.easeInOut)
               .rotate(begin: -0.05, end: 0.05, duration: 1000.ms, curve: Curves.easeInOut),
            ],
          ),
          
          const SizedBox(height: 48),
          
          const Text(
            'Verification Pending',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: Colors.black87,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn(duration: 600.ms).slideY(begin: 0.2, end: 0, curve: Curves.easeOutBack),
          
          const SizedBox(height: 16),
          
          const Text(
            'Your application has been submitted and is under review by the Stay Q team!',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              color: Colors.black54,
              height: 1.5,
            ),
          ).animate().fadeIn(delay: 300.ms, duration: 600.ms).slideY(begin: 0.2, end: 0, curve: Curves.easeOutBack),
          
          const SizedBox(height: 32),
          
          // Playful loading dots
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(3, (index) {
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: 10,
                height: 10,
                decoration: const BoxDecoration(
                  color: Color(0xFF5A31F4),
                  shape: BoxShape.circle,
                ),
              ).animate(onPlay: (controller) => controller.repeat())
               .scaleXY(begin: 0.5, end: 1.2, duration: 600.ms, curve: Curves.easeInOut, delay: (index * 200).ms)
               .then()
               .scaleXY(begin: 1.2, end: 0.5, duration: 600.ms, curve: Curves.easeInOut);
            }),
          ).animate().fadeIn(delay: 600.ms),
        ],
      ),
    );
  }
}

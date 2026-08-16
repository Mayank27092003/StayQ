import 'package:flutter/material.dart';

class AppColors {
  // Brand Primary & Gradient Colors
  static const Color primary = Color(0xFF5A31F4);      // Deep Royal Violet (Accent)
  static const Color primaryDark = Color(0xFF3B1E7B);  // Midnight Violet
  static const Color primaryLight = Color(0xFF7F56D9); // Light Orchid Violet
  static const Color accent = Color(0xFF111111);       // Slate Black (High contrast)
  
  // Background & Surface Colors (Minimalist)
  static const Color background = Color(0xFFFFFFFF);   // Pure White Base
  static const Color cardBg = Color(0xFFFFFFFF);       // Pure White Cards
  static const Color surfaceLight = Color(0xFFF7F7F7); // Ultra Light Gray for contrast
  static const Color borderLight = Color(0xFFEAEAEA);  // Very subtle border
  
  // Dark Mode Tokens (Deep OLED Black)
  static const Color darkBackground = Color(0xFF000000);
  static const Color darkCardBg = Color(0xFF0A0A0A);
  static const Color darkSurface = Color(0xFF141414);
  
  // Text Colors (High Contrast)
  static const Color textPrimary = Color(0xFF111111);  // Stark Black
  static const Color textSecondary = Color(0xFF555555);// Medium Gray
  static const Color textMuted = Color(0xFF999999);    // Soft Gray
  
  // Accent Highlights
  static const Color starYellow = Color(0xFFFFB800);
  static const Color successGreen = Color(0xFF12B76A);
  static const Color warningOrange = Color(0xFFF79009);
  static const Color errorRed = Color(0xFFF04438);
  
  // Gradients (Mostly replaced by flat colors, kept for specific legacy uses)
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF5A31F4), Color(0xFF7F56D9)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient darkGradient = LinearGradient(
    colors: [Color(0xFF141414), Color(0xFF000000)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient heroOverlayGradient = LinearGradient(
    colors: [Colors.transparent, Color(0x66000000), Color(0xCC000000)], // Darker for high contrast text readability
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}

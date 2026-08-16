import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppMotion {
  // Timing Tokens
  static const Duration instant = Duration(milliseconds: 140);
  static const Duration standard = Duration(milliseconds: 300);
  static const Duration extended = Duration(milliseconds: 600);
  static const Duration narrative = Duration(milliseconds: 1200);

  // Signature Custom Deceleration Curve
  static const Curve signatureCurve = Cubic(0.22, 1.0, 0.36, 1.0);
  static const Curve bounceCurve = ElasticOutCurve(0.75);

  // Haptic Helpers
  static void tapSelection() {
    HapticFeedback.selectionClick();
  }

  static void tapLight() {
    HapticFeedback.lightImpact();
  }

  static void tapMedium() {
    HapticFeedback.mediumImpact();
  }

  static void tapHeavy() {
    HapticFeedback.heavyImpact();
  }

  // Motion Safety Check
  static Duration duration(BuildContext context, Duration baseDuration) {
    if (MediaQuery.of(context).disableAnimations) {
      return Duration.zero;
    }
    return baseDuration;
  }
}

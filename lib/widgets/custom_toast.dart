import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:ui';

enum ToastType { success, error, info, warning }

class CustomToast extends StatelessWidget {
  final String title;
  final String? subtitle;
  final ToastType type;
  final IconData? icon;

  const CustomToast({
    super.key,
    required this.title,
    this.subtitle,
    this.type = ToastType.info,
    this.icon,
  });

  static void show({
    required BuildContext context,
    String? title,
    String? message,
    String? subtitle,
    bool isError = false,
    ToastType? type,
    IconData? icon,
    int durationSeconds = 4,
  }) {
    // Support legacy signature
    final resolvedTitle = title ?? message ?? '';
    final resolvedType = type ?? (isError ? ToastType.error : ToastType.info);
    final overlay = Overlay.of(context);
    late OverlayEntry overlayEntry;

    overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: MediaQuery.of(context).padding.top + 16,
        left: 20,
        right: 20,
        child: Material(
          color: Colors.transparent,
          child: CustomToast(
            title: resolvedTitle,
            subtitle: subtitle,
            type: resolvedType,
            icon: icon,
          ).animate().slideY(begin: -1.0, end: 0, duration: 400.ms, curve: Curves.easeOutBack).fadeIn(duration: 300.ms),
        ),
      ),
    );

    overlay.insert(overlayEntry);

    Future.delayed(Duration(seconds: durationSeconds), () {
      if (overlayEntry.mounted) {
        // Unfortunately flutter_animate doesn't support un-animating overlay entries easily without state,
        // so we just remove it.
        overlayEntry.remove();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    Color primaryColor;
    IconData defaultIcon;

    switch (type) {
      case ToastType.success:
        primaryColor = const Color(0xFF4CAF50);
        defaultIcon = Icons.check_circle_rounded;
        break;
      case ToastType.error:
        primaryColor = const Color(0xFFE53935);
        defaultIcon = Icons.error_rounded;
        break;
      case ToastType.warning:
        primaryColor = const Color(0xFFFFA000);
        defaultIcon = Icons.warning_rounded;
        break;
      case ToastType.info:
        primaryColor = const Color(0xFF7C3AED); // App primary
        defaultIcon = Icons.info_rounded;
        break;
    }

    final activeIcon = icon ?? defaultIcon;

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xFF130925).withValues(alpha: 0.85),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1), width: 1),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.25),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: subtitle != null ? CrossAxisAlignment.start : CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: primaryColor.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(activeIcon, color: primaryColor, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        subtitle!,
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.white.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

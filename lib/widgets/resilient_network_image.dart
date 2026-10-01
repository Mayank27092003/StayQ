import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../theme/app_colors.dart';

/// Ultra-resilient, memory-safe network image component.
/// - Downsamples images in memory (memCacheWidth/memCacheHeight) to prevent OOM
/// - Smooth shimmer loading placeholder
/// - Graceful error boundary fallback (never shows broken red/grey boxes)
class ResilientNetworkImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final int memCacheWidth;
  final int memCacheHeight;
  final Widget? errorWidget;

  const ResilientNetworkImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.memCacheWidth = 600,
    this.memCacheHeight = 600,
    this.errorWidget,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Widget imageContent;

    if (imageUrl.trim().isEmpty || !imageUrl.startsWith('http')) {
      imageContent = _buildErrorFallback(isDark);
    } else {
      imageContent = CachedNetworkImage(
        imageUrl: imageUrl,
        width: width,
        height: height,
        fit: fit,
        memCacheWidth: memCacheWidth,
        memCacheHeight: memCacheHeight,
        placeholder: (context, url) => Shimmer.fromColors(
          baseColor: isDark ? const Color(0xFF222030) : const Color(0xFFE8E5F0),
          highlightColor: isDark ? const Color(0xFF333045) : const Color(0xFFF5F3FF),
          child: Container(
            width: width,
            height: height,
            color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
          ),
        ),
        errorWidget: (context, url, error) => errorWidget ?? _buildErrorFallback(isDark),
      );
    }

    if (borderRadius != null) {
      return ClipRRect(
        borderRadius: borderRadius!,
        child: imageContent,
      );
    }

    return imageContent;
  }

  Widget _buildErrorFallback(bool isDark) {
    return Container(
      width: width,
      height: height,
      color: isDark ? const Color(0xFF1F1D2B) : const Color(0xFFF3F1FA),
      child: Center(
        child: Icon(
          Icons.image_not_supported_outlined,
          color: isDark ? Colors.white24 : AppColors.textSecondary.withValues(alpha: 0.4),
          size: (width != null && width! < 60) ? 18 : 26,
        ),
      ),
    );
  }
}

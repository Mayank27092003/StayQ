import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/media_upload_sheet.dart';

class PropertyPhotosScreen extends StatefulWidget {
  const PropertyPhotosScreen({super.key});

  @override
  State<PropertyPhotosScreen> createState() => _PropertyPhotosScreenState();
}

class _PropertyPhotosScreenState extends State<PropertyPhotosScreen> {
  Future<void> _pickPhotosForCategory(String categoryKey) async {
    AppMotion.tapSelection();
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    final List<String>? images = await showStayQUploadSheet(
      context,
      title: 'Upload Photos',
      subtitle: 'Take photos with camera, choose multiple from gallery, or browse files',
      type: MediaUploadType.multipleImages,
    );
    if (images != null && images.isNotEmpty) {
      provider.addPhotosToCategory(categoryKey, images);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${images.length} photo${images.length > 1 ? "s" : ""} added ✓'),
            backgroundColor: const Color(0xFF10B981),
            duration: const Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _pickVideo() async {
    AppMotion.tapSelection();
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    final List<String>? videos = await showStayQUploadSheet(
      context,
      title: 'Upload Property Video',
      subtitle: 'Record a walkthrough video, pick from gallery, or browse files',
      type: MediaUploadType.video,
    );
    if (videos != null && videos.isNotEmpty) {
      for (final v in videos) {
        if (!provider.localVideoPaths.contains(v)) {
          provider.localVideoPaths.add(v);
        }
      }
      provider.setPage(provider.currentPage);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Walkthrough video added ✓'),
            backgroundColor: Color(0xFF10B981),
            duration: Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _showFullPhoto(String path) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(16),
        child: Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: path.startsWith('http')
                  ? Image.network(
                      path,
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => Container(
                        height: 200,
                        color: Colors.black26,
                        child: const Center(
                          child: Icon(Icons.broken_image_rounded, color: Colors.white60, size: 40),
                        ),
                      ),
                    )
                  : Image.file(
                      File(path),
                      fit: BoxFit.contain,
                      cacheWidth: 1200,
                      errorBuilder: (context, error, stackTrace) => Container(
                        height: 200,
                        color: Colors.black26,
                        child: const Center(
                          child: Icon(Icons.broken_image_rounded, color: Colors.white60, size: 40),
                        ),
                      ),
                    ),
            ),
            Positioned(
              top: 8,
              right: 8,
              child: GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    color: Colors.black54,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close, color: Colors.white, size: 22),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<HostOnboardingProvider>(context);
    final categories = provider.getPhotoCategories();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final totalPhotos = provider.totalPhotoCount;
    final filledCategories = provider.categoriesWithPhotos;
    final requiredCategories = categories.where((c) => c.required).toList();
    final filledRequired = requiredCategories.where((c) =>
        (provider.categorizedPhotos[c.key]?.isNotEmpty ?? false)).length;

    return Container(
      color: isDark ? const Color(0xFF0F0E17) : const Color(0xFFF8F7FC),
      child: Column(
        children: [
          // ═══════════════════════════════════════════
          // TOP SUMMARY HEADER
          // ═══════════════════════════════════════════
          Container(
            margin: const EdgeInsets.fromLTRB(20, 16, 20, 8),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark
                    ? [const Color(0xFF1E1C2A), const Color(0xFF252336)]
                    : [Colors.white, const Color(0xFFF5F3FF)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isDark ? Colors.white10 : AppColors.borderLight,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: totalPhotos > 0
                            ? AppColors.primary.withValues(alpha: 0.15)
                            : (isDark ? Colors.white10 : AppColors.surfaceLight),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.photo_library_rounded,
                        color: totalPhotos > 0 ? AppColors.primary : AppColors.textSecondary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Upload Property Photos',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 3),
                          const Text(
                            'Add photos for each area of your property.',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                // Progress bar
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: categories.isEmpty
                              ? 0
                              : filledCategories / categories.length,
                          minHeight: 6,
                          backgroundColor: isDark ? Colors.white12 : const Color(0xFFE8E5F0),
                          valueColor: AlwaysStoppedAnimation<Color>(
                            filledCategories == categories.length
                                ? const Color(0xFF10B981)
                                : AppColors.primary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '$filledCategories / ${categories.length} areas',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: filledCategories == categories.length
                            ? const Color(0xFF10B981)
                            : AppColors.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '$totalPhotos photos',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    if (requiredCategories.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: filledRequired == requiredCategories.length
                              ? const Color(0xFF10B981).withValues(alpha: 0.1)
                              : Colors.orange.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          filledRequired == requiredCategories.length
                              ? '✓ All required done'
                              : '$filledRequired / ${requiredCategories.length} required',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: filledRequired == requiredCategories.length
                                ? const Color(0xFF10B981)
                                : Colors.orange,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.05, end: 0),

          // ═══════════════════════════════════════════
          // CATEGORY SECTIONS (Scrollable)
          // ═══════════════════════════════════════════
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 120),
              itemCount: categories.length + 1, // +1 for video section
              itemBuilder: (context, index) {
                if (index < categories.length) {
                  final cat = categories[index];
                  final photos = provider.getPhotosForCategory(cat.key);
                  return _buildCategorySection(
                    context: context,
                    category: cat,
                    photos: photos,
                    provider: provider,
                    isDark: isDark,
                    animDelay: (index * 60).ms,
                  );
                } else {
                  return _buildVideoSection(provider, isDark);
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySection({
    required BuildContext context,
    required PhotoCategory category,
    required List<String> photos,
    required HostOnboardingProvider provider,
    required bool isDark,
    required Duration animDelay,
  }) {
    final hasPhotos = photos.isNotEmpty;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1828) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: hasPhotos
              ? AppColors.primary.withValues(alpha: 0.25)
              : (isDark ? Colors.white10 : AppColors.borderLight),
          width: hasPhotos ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 12, 0),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: hasPhotos
                        ? AppColors.primary.withValues(alpha: 0.12)
                        : (isDark ? Colors.white10 : AppColors.surfaceLight),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(category.icon, style: const TextStyle(fontSize: 20)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              category.label,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: isDark ? Colors.white : AppColors.textPrimary,
                              ),
                            ),
                          ),
                          if (category.required) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: hasPhotos
                                    ? const Color(0xFF10B981).withValues(alpha: 0.12)
                                    : Colors.red.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                hasPhotos ? '✓' : 'Required',
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                  color: hasPhotos ? const Color(0xFF10B981) : Colors.red,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        hasPhotos
                            ? '${photos.length} photo${photos.length > 1 ? 's' : ''} added'
                            : 'Tap + to add photos',
                        style: TextStyle(
                          fontSize: 11,
                          color: hasPhotos ? AppColors.primary : AppColors.textSecondary,
                          fontWeight: hasPhotos ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),
                // Add photo button
                Material(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  child: InkWell(
                    onTap: () => _pickPhotosForCategory(category.key),
                    borderRadius: BorderRadius.circular(10),
                    child: const Padding(
                      padding: EdgeInsets.all(8),
                      child: Icon(Icons.add_a_photo_rounded, color: AppColors.primary, size: 20),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Photo grid (horizontal scroll)
          if (hasPhotos)
            SizedBox(
              height: 130,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(16, 12, 8, 14),
                itemCount: photos.length + 1, // +1 for add button
                itemBuilder: (context, photoIndex) {
                  if (photoIndex < photos.length) {
                    return _buildPhotoThumbnail(
                      path: photos[photoIndex],
                      categoryKey: category.key,
                      index: photoIndex,
                      provider: provider,
                    );
                  } else {
                    return _buildAddMoreButton(category.key);
                  }
                },
              ),
            )
          else
            GestureDetector(
              onTap: () => _pickPhotosForCategory(category.key),
              child: Container(
                margin: const EdgeInsets.fromLTRB(16, 10, 16, 14),
                height: 90,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.03) : const Color(0xFFF9F8FE),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isDark ? Colors.white10 : const Color(0xFFE0DBF0),
                  ),
                ),
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.add_photo_alternate_outlined,
                        color: AppColors.textSecondary.withValues(alpha: 0.5),
                        size: 28,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Tap to add ${category.label.toLowerCase()} photos',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary.withValues(alpha: 0.6),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    ).animate().fadeIn(delay: animDelay, duration: 350.ms).slideY(begin: 0.04, end: 0);
  }

  Widget _buildPhotoThumbnail({
    required String path,
    required String categoryKey,
    required int index,
    required HostOnboardingProvider provider,
  }) {
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: GestureDetector(
        onTap: () => _showFullPhoto(path),
        child: Stack(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: path.startsWith('http')
                  ? Image.network(
                      path,
                      width: 110,
                      height: 110,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        width: 110,
                        height: 110,
                        color: Colors.black26,
                        child: const Icon(Icons.broken_image_rounded, color: Colors.white54, size: 24),
                      ),
                    )
                  : Image.file(
                      File(path),
                      width: 110,
                      height: 110,
                      fit: BoxFit.cover,
                      cacheWidth: 300,
                      cacheHeight: 300,
                      errorBuilder: (context, error, stackTrace) => Container(
                        width: 110,
                        height: 110,
                        color: Colors.black26,
                        child: const Icon(Icons.broken_image_rounded, color: Colors.white54, size: 24),
                      ),
                    ),
            ),
            Positioned(
              bottom: 6,
              left: 6,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${index + 1}',
                  style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.w700),
                ),
              ),
            ),
            Positioned(
              top: 4,
              right: 4,
              child: GestureDetector(
                onTap: () {
                  AppMotion.tapSelection();
                  provider.removePhotoFromCategory(categoryKey, index);
                },
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.6),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close_rounded, color: Colors.white, size: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddMoreButton(String categoryKey) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: () => _pickPhotosForCategory(categoryKey),
        child: Container(
          width: 80,
          height: 110,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: AppColors.primary.withValues(alpha: 0.25),
            ),
          ),
          child: const Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.add_rounded, color: AppColors.primary, size: 28),
              SizedBox(height: 4),
              Text(
                'Add\nMore',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                  height: 1.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildVideoSection(HostOnboardingProvider provider, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16, top: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1828) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? Colors.white10 : AppColors.borderLight,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 12, 0),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white10 : AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text('🎬', style: TextStyle(fontSize: 20)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Property Walkthrough Video',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        provider.localVideoPaths.isNotEmpty
                            ? '${provider.localVideoPaths.length} video${provider.localVideoPaths.length > 1 ? 's' : ''} added'
                            : 'Optional • Add a video tour of your property',
                        style: TextStyle(
                          fontSize: 11,
                          color: provider.localVideoPaths.isNotEmpty
                              ? AppColors.primary
                              : AppColors.textSecondary,
                          fontWeight: provider.localVideoPaths.isNotEmpty
                              ? FontWeight.w600
                              : FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),
                Material(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                  child: InkWell(
                    onTap: _pickVideo,
                    borderRadius: BorderRadius.circular(10),
                    child: const Padding(
                      padding: EdgeInsets.all(8),
                      child: Icon(Icons.video_call_rounded, color: AppColors.primary, size: 20),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (provider.localVideoPaths.isNotEmpty)
            SizedBox(
              height: 90,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.fromLTRB(16, 12, 8, 14),
                itemCount: provider.localVideoPaths.length,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 10),
                    child: Stack(
                      children: [
                        Container(
                          width: 120,
                          height: 70,
                          decoration: BoxDecoration(
                            color: Colors.black87,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Center(
                            child: Icon(Icons.play_circle_outline_rounded, color: Colors.white54, size: 32),
                          ),
                        ),
                        Positioned(
                          top: 4,
                          right: 4,
                          child: GestureDetector(
                            onTap: () {
                              AppMotion.tapSelection();
                              provider.localVideoPaths.removeAt(index);
                              provider.setPage(provider.currentPage);
                            },
                            child: Container(
                              padding: const EdgeInsets.all(3),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.6),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.close_rounded, color: Colors.white, size: 12),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            )
          else
            const SizedBox(height: 14),
        ],
      ),
    ).animate().fadeIn(delay: 400.ms);
  }
}

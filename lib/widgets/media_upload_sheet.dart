import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';

enum MediaUploadType {
  singleImage,
  multipleImages,
  video,
  documentOrImage,
}

/// Helper method to present a modern 3-way upload modal bottom sheet:
/// 1. Camera (Instant photo/video capture)
/// 2. Photo Gallery (Photo library selection)
/// 3. Browse Files / Documents (Device storage / file explorer)
Future<List<String>?> showStayQUploadSheet(
  BuildContext context, {
  String title = 'Upload File',
  String subtitle = 'Choose how you want to upload',
  MediaUploadType type = MediaUploadType.singleImage,
  CameraDevice preferredCamera = CameraDevice.rear,
  void Function(String path)? onFilePicked,
  void Function(List<String> paths)? onFilesPicked,
}) async {
  AppMotion.tapSelection();
  final isDark = Theme.of(context).brightness == Brightness.dark;

  // Selected upload channel: 'camera', 'video_camera', 'gallery', 'files'
  String? chosenAction;

  await showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (ctx) => SafeArea(
      child: Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF181625) : Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.12),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white24 : Colors.black12,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Title & Subtitle
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 12.5,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 16),

              // Option 1: Camera
              if (type != MediaUploadType.video)
                _buildUploadOptionTile(
                  isDark: isDark,
                  icon: preferredCamera == CameraDevice.front
                      ? Icons.camera_front_rounded
                      : Icons.camera_alt_rounded,
                  iconColor: const Color(0xFF6366F1),
                  title: preferredCamera == CameraDevice.front ? 'Take Selfie (Front Camera)' : 'Take Photo (Camera)',
                  description: 'Capture a fresh photo using your device camera',
                  onTap: () {
                    chosenAction = 'camera';
                    Navigator.pop(ctx);
                  },
                ),

              if (type == MediaUploadType.video)
                _buildUploadOptionTile(
                  isDark: isDark,
                  icon: Icons.videocam_rounded,
                  iconColor: const Color(0xFFEF4444),
                  title: 'Record Video (Camera)',
                  description: 'Record a video walkthrough with camera',
                  onTap: () {
                    chosenAction = 'video_camera';
                    Navigator.pop(ctx);
                  },
                ),

              const SizedBox(height: 10),

              // Option 2: Photo / Media Gallery
              _buildUploadOptionTile(
                isDark: isDark,
                icon: Icons.photo_library_rounded,
                iconColor: const Color(0xFF10B981),
                title: type == MediaUploadType.multipleImages
                    ? 'Photo Gallery (Select Multiple)'
                    : (type == MediaUploadType.video ? 'Video Gallery' : 'Choose from Photo Gallery'),
                description: type == MediaUploadType.multipleImages
                    ? 'Pick one or multiple photos from your library'
                    : 'Choose an existing photo from your album',
                onTap: () {
                  chosenAction = 'gallery';
                  Navigator.pop(ctx);
                },
              ),

              const SizedBox(height: 10),

              // Option 3: Browse Files / Documents
              _buildUploadOptionTile(
                isDark: isDark,
                icon: Icons.folder_open_rounded,
                iconColor: const Color(0xFFF59E0B),
                title: 'Browse Files & Documents',
                description: 'Select files, images, or PDFs from device storage',
                onTap: () {
                  chosenAction = 'files';
                  Navigator.pop(ctx);
                },
              ),
            ],
          ),
        ),
      ),
    ),
  );

  // If user dismissed the bottom sheet without tapping an option
  if (chosenAction == null) {
    return null;
  }

  // Execute the selected picker!
  List<String>? selectedPaths;
  try {
    if (chosenAction == 'camera') {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: preferredCamera,
        imageQuality: 85,
      );
      if (picked != null) {
        selectedPaths = [picked.path];
      }
    } else if (chosenAction == 'video_camera') {
      final picker = ImagePicker();
      final picked = await picker.pickVideo(source: ImageSource.camera);
      if (picked != null) {
        selectedPaths = [picked.path];
      }
    } else if (chosenAction == 'gallery') {
      final picker = ImagePicker();
      if (type == MediaUploadType.multipleImages) {
        final images = await picker.pickMultiImage(imageQuality: 85);
        if (images.isNotEmpty) {
          selectedPaths = images.map((e) => e.path).toList();
        }
      } else if (type == MediaUploadType.video) {
        final video = await picker.pickVideo(source: ImageSource.gallery);
        if (video != null) {
          selectedPaths = [video.path];
        }
      } else {
        final picked = await picker.pickImage(
          source: ImageSource.gallery,
          imageQuality: 85,
        );
        if (picked != null) {
          selectedPaths = [picked.path];
        }
      }
    } else if (chosenAction == 'files') {
      FileType fileType = FileType.custom;
      List<String> extensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
      if (type == MediaUploadType.video) {
        fileType = FileType.video;
        extensions = [];
      }
      final files = await FilePicker.pickFiles(
        type: fileType,
        allowedExtensions: extensions.isNotEmpty ? extensions : null,
      );
      if (files.isNotEmpty) {
        selectedPaths = files
            .where((f) => f.path != null && File(f.path!).existsSync())
            .map((f) => f.path!)
            .toList();
      }
    }
  } catch (e) {
    debugPrint('MediaUploadSheet error during picking: $e');
  }

  if (selectedPaths != null && selectedPaths.isNotEmpty) {
    onFilePicked?.call(selectedPaths.first);
    onFilesPicked?.call(selectedPaths);
    return selectedPaths;
  }

  return null;
}

Widget _buildUploadOptionTile({
  required bool isDark,
  required IconData icon,
  required Color iconColor,
  required String title,
  required String description,
  required VoidCallback onTap,
}) {
  return InkWell(
    onTap: () {
      AppMotion.tapLight();
      onTap();
    },
    borderRadius: BorderRadius.circular(16),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white12 : AppColors.borderLight,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.chevron_right_rounded,
            color: isDark ? Colors.white38 : AppColors.textSecondary,
            size: 20,
          ),
        ],
      ),
    ),
  );
}

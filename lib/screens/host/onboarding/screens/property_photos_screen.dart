import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../../../providers/host_onboarding_provider.dart';

class PropertyPhotosScreen extends StatelessWidget {
  const PropertyPhotosScreen({Key? key}) : super(key: key);

  Future<void> _pickImages(BuildContext context) async {
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    final ImagePicker picker = ImagePicker();
    final List<XFile>? images = await picker.pickMultiImage();
    if (images != null && images.isNotEmpty) {
      provider.localPhotoPaths.addAll(images.map((e) => e.path));
      provider.setPage(provider.currentPage); 
    }
  }

  Future<void> _pickVideo(BuildContext context) async {
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    final ImagePicker picker = ImagePicker();
    final XFile? video = await picker.pickVideo(source: ImageSource.gallery);
    if (video != null) {
      provider.localVideoPaths.add(video.path);
      provider.setPage(provider.currentPage); 
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<HostOnboardingProvider>(context);
    return Container(
      padding: const EdgeInsets.all(24.0),
      color: Colors.grey[50],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Upload Photos',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.black87),
          ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.1, end: 0),
          const SizedBox(height: 8),
          const Text(
            'Showcase your property with high-quality photos. Drag to reorder.',
            style: TextStyle(fontSize: 16, color: Colors.black54),
          ).animate().fadeIn(delay: 100.ms),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _pickImages(context),
                  icon: const Icon(Icons.add_a_photo),
                  label: const Text('Add Photos'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _pickVideo(context),
                  icon: const Icon(Icons.video_call),
                  label: const Text('Add Video'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: (provider.localPhotoPaths.isEmpty && provider.localVideoPaths.isEmpty)
                ? Center(
                    child: Text('No media added yet.', style: TextStyle(color: Colors.grey[500], fontSize: 16)),
                  )
                : ListView(
                    children: [
                      if (provider.localPhotoPaths.isNotEmpty) ...[
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8.0),
                          child: Text('Photos', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        ),
                        ...provider.localPhotoPaths.asMap().entries.map((entry) {
                          final index = entry.key;
                          final path = entry.value;
                          return Padding(
                            key: ValueKey('photo_$path'),
                            padding: const EdgeInsets.only(bottom: 16),
                            child: Stack(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(16),
                                  child: Image.file(
                                    File(path),
                                    width: double.infinity,
                                    height: 200,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                                Positioned(
                                  top: 8,
                                  right: 8,
                                  child: GestureDetector(
                                    onTap: () {
                                      provider.localPhotoPaths.removeAt(index);
                                      provider.setPage(provider.currentPage);
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: const BoxDecoration(
                                        color: Colors.black54,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.close, color: Colors.white, size: 20),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                      ],
                      if (provider.localVideoPaths.isNotEmpty) ...[
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8.0),
                          child: Text('Videos', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        ),
                        ...provider.localVideoPaths.asMap().entries.map((entry) {
                          final index = entry.key;
                          final path = entry.value;
                          return Padding(
                            key: ValueKey('video_$path'),
                            padding: const EdgeInsets.only(bottom: 16),
                            child: Stack(
                              children: [
                                Container(
                                  width: double.infinity,
                                  height: 200,
                                  decoration: BoxDecoration(
                                    color: Colors.black87,
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: const Center(
                                    child: Icon(Icons.play_circle_outline, color: Colors.white54, size: 64),
                                  ),
                                ),
                                Positioned(
                                  top: 8,
                                  right: 8,
                                  child: GestureDetector(
                                    onTap: () {
                                      provider.localVideoPaths.removeAt(index);
                                      provider.setPage(provider.currentPage);
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(6),
                                      decoration: const BoxDecoration(
                                        color: Colors.black54,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.close, color: Colors.white, size: 20),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                      ],
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

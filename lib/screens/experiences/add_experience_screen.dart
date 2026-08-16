import 'dart:io';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../../providers/app_provider.dart';
import '../../models/stay_model.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';
import '../../widgets/stayq_loader.dart';
import '../../widgets/custom_toast.dart';
import '../../widgets/custom_toast.dart';

class AddExperienceScreen extends StatefulWidget {
  const AddExperienceScreen({super.key});

  @override
  State<AddExperienceScreen> createState() => _AddExperienceScreenState();
}

class _AddExperienceScreenState extends State<AddExperienceScreen> {
  final _formKey = GlobalKey<FormState>();
  
  final _titleController = TextEditingController();
  final _locationController = TextEditingController();
  final _priceController = TextEditingController();
  final _durationController = TextEditingController();
  final _maxSpotsController = TextEditingController(text: '8');
  final _timeSlotController = TextEditingController(text: '10:00 AM - 1:00 PM');
  final _descController = TextEditingController();
  
  bool _isLoading = false;
  String _selectedImage = '';
  
  final List<String> _sampleImages = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80', // Cooking class
    'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=1000&q=80', // Photography walk
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1000&q=80', // Yoga
    'https://images.unsplash.com/photo-1504280390224-f7b7640277bd?auto=format&fit=crop&w=1000&q=80', // Surfing
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _locationController.dispose();
    _priceController.dispose();
    _durationController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _pickMedia() async {
    AppMotion.tapSelection();
    final ImagePicker picker = ImagePicker();
    final XFile? media = await picker.pickImage(source: ImageSource.gallery);
    if (media != null) {
      setState(() {
        _selectedImage = media.path;
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedImage.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add a cover image or video')),
      );
      return;
    }

    setState(() => _isLoading = true);
    
    String uploadedImageUrl = '';
    try {
      if (!_selectedImage.startsWith('http')) {
        final ref = FirebaseStorage.instance
            .ref()
            .child('experiences')
            .child('${DateTime.now().millisecondsSinceEpoch}.jpg');
        await ref.putFile(File(_selectedImage));
        uploadedImageUrl = await ref.getDownloadURL();
      } else {
        uploadedImageUrl = _selectedImage;
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to upload image: $e')),
      );
      return;
    }

    if (!mounted) return;
    final provider = Provider.of<AppProvider>(context, listen: false);
    
    final int spots = int.tryParse(_maxSpotsController.text) ?? 8;
    final newExp = StayModel(
      id: '', // Firestore will generate
      title: _titleController.text,
      location: _locationController.text,
      pricePerNight: double.tryParse(_priceController.text) ?? 0,
      rating: 5.0, // Default for new
      reviewCount: 0,
      imageUrls: [uploadedImageUrl],
      category: 'Experiences',
      hostName: provider.userName.isNotEmpty ? provider.userName : 'You',
      hostAvatar: provider.userAvatar,
      amenities: ['Guided', 'Equipment included', 'Drinks'],
      description: _descController.text,
      lat: 0.0,
      lng: 0.0,
      isExperience: true,
      duration: _durationController.text,
      maxSpots: spots,
      availableSpots: spots,
    );

    try {
      await provider.addExperience(newExp);
      
      setState(() => _isLoading = false);
      
      if (!mounted) return;
      Navigator.pop(context); // Go back to profile
      
      // Celebrate!
      CustomToast.show(
        context: context,
        title: 'Experience created successfully! 🎉',
        subtitle: 'Your experience is now live and travelers can start booking it immediately.',
        type: ToastType.success,
        durationSeconds: 8,
      );
      
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Host an Experience'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const StayQLoader(size: 64, message: 'Publishing your experience...'),
                  const SizedBox(height: 24),
                ],
              ),
            )
          : SafeArea(
              child: Form(
                key: _formKey,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Media Upload Area
                      GestureDetector(
                        onTap: _pickMedia,
                        child: Container(
                          height: 200,
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceLight,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: AppColors.borderLight, width: 2, style: BorderStyle.solid),
                            image: _selectedImage.isNotEmpty
                                ? DecorationImage(
                                    image: _selectedImage.startsWith('http')
                                        ? NetworkImage(_selectedImage) as ImageProvider
                                        : FileImage(File(_selectedImage)),
                                    fit: BoxFit.cover,
                                  )
                                : null,
                          ),
                          child: _selectedImage.isEmpty
                              ? Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10),
                                        ],
                                      ),
                                      child: const Icon(Icons.add_a_photo_rounded, color: AppColors.primary, size: 32),
                                    ),
                                    const SizedBox(height: 12),
                                    const Text(
                                      'Add Photos or Video',
                                      style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                    ),
                                    const Text(
                                      'Show guests what they\'ll do',
                                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                    ),
                                  ],
                                )
                              : Align(
                                  alignment: Alignment.topRight,
                                  child: Padding(
                                    padding: const EdgeInsets.all(12),
                                    child: CircleAvatar(
                                      backgroundColor: Colors.black54,
                                      child: IconButton(
                                        icon: const Icon(Icons.edit, color: Colors.white, size: 18),
                                        onPressed: _pickMedia,
                                      ),
                                    ),
                                  ),
                                ),
                        ),
                      ).animate().fadeIn().slideY(begin: 0.1, end: 0),
                      
                      const SizedBox(height: 32),
                      
                      _buildLabel('Title'),
                      _buildTextField(
                        controller: _titleController,
                        hint: 'e.g. Sunset Pasta Making Class',
                        validator: (v) => v!.isEmpty ? 'Required' : null,
                      ).animate().fadeIn(delay: 100.ms),
                      
                      const SizedBox(height: 24),
                      
                      _buildLabel('Location'),
                      _buildTextField(
                        controller: _locationController,
                        hint: 'e.g. Florence, Italy',
                        icon: Icons.location_on_outlined,
                        validator: (v) => v!.isEmpty ? 'Required' : null,
                      ).animate().fadeIn(delay: 150.ms),
                      
                      const SizedBox(height: 24),
                      
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('Price per guest'),
                                _buildTextField(
                                  controller: _priceController,
                                  hint: '₹ 2500',
                                  keyboardType: TextInputType.number,
                                  icon: Icons.currency_rupee_rounded,
                                  validator: (v) => v!.isEmpty ? 'Required' : null,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('Duration'),
                                _buildTextField(
                                  controller: _durationController,
                                  hint: 'e.g. 2.5 hours',
                                  icon: Icons.timer_outlined,
                                  validator: (v) => v!.isEmpty ? 'Required' : null,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ).animate().fadeIn(delay: 200.ms),
                      
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('Max Spots (Group Limit)'),
                                _buildTextField(
                                  controller: _maxSpotsController,
                                  hint: '8 spots',
                                  keyboardType: TextInputType.number,
                                  icon: Icons.event_seat_rounded,
                                  validator: (v) => v!.isEmpty ? 'Required' : null,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('Default Time Slot'),
                                _buildTextField(
                                  controller: _timeSlotController,
                                  hint: '10:00 AM - 1:00 PM',
                                  icon: Icons.schedule_rounded,
                                  validator: (v) => v!.isEmpty ? 'Required' : null,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ).animate().fadeIn(delay: 220.ms),

                      const SizedBox(height: 24),

                      _buildLabel('What we\'ll do'),
                      _buildTextField(
                        controller: _descController,
                        hint: 'Describe the experience step by step...',
                        maxLines: 4,
                        validator: (v) => v!.isEmpty ? 'Required' : null,
                      ).animate().fadeIn(delay: 250.ms),
                      
                      const SizedBox(height: 48),
                      
                      // Submit Button
                      BouncingWidget(
                        onTap: _submitForm,
                        child: Container(
                          width: double.infinity,
                          height: 56,
                          decoration: BoxDecoration(
                            gradient: AppColors.primaryGradient,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0, 6)),
                            ],
                          ),
                          child: const Center(
                            child: Text(
                              'Publish Experience',
                              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.5, end: 0, curve: AppMotion.bounceCurve),
                      
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    IconData? icon,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: validator,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.textMuted),
        prefixIcon: icon != null ? Icon(icon, color: AppColors.textMuted, size: 20) : null,
        filled: true,
        fillColor: AppColors.surfaceLight,
        contentPadding: const EdgeInsets.all(16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: AppColors.errorRed, width: 1),
        ),
      ),
    );
  }
}

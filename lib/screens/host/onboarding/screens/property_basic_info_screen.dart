import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';

class PropertyBasicInfoScreen extends StatefulWidget {
  const PropertyBasicInfoScreen({Key? key}) : super(key: key);

  @override
  State<PropertyBasicInfoScreen> createState() => _PropertyBasicInfoScreenState();
}

class _PropertyBasicInfoScreenState extends State<PropertyBasicInfoScreen> {
  late TextEditingController _titleController;
  late TextEditingController _descController;

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    _titleController = TextEditingController(text: provider.title);
    _descController = TextEditingController(text: provider.description);

    _titleController.addListener(_updateProvider);
    _descController.addListener(_updateProvider);
  }

  void _updateProvider() {
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    provider.updateBasicInfo(
      _titleController.text,
      _descController.text,
      provider.bedrooms,
      provider.bathrooms,
      provider.maxGuests,
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Widget _buildCounter(String label, int value, VoidCallback onDecrement, VoidCallback onIncrement) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
          ),
          Row(
            children: [
              IconButton(
                onPressed: onDecrement,
                icon: const Icon(Icons.remove_circle_outline, color: AppColors.primary),
              ),
              SizedBox(
                width: 30,
                child: Text(
                  value.toString(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
              IconButton(
                onPressed: onIncrement,
                icon: const Icon(Icons.add_circle_outline, color: AppColors.primary),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<HostOnboardingProvider>(context);

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Basic Info',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 6),
          const Text(
            'Give your property a catchy title and clear description for guests.',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 24),

          const Text(
            'Property Title',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: TextField(
              controller: _titleController,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
              decoration: const InputDecoration(
                hintText: 'e.g. Luxury Seaview Villa with Private Infinity Pool',
                hintStyle: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
          ),
          const SizedBox(height: 20),

          const Text(
            'Description',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: TextField(
              controller: _descController,
              maxLines: 5,
              style: const TextStyle(fontSize: 14, height: 1.5, color: AppColors.textPrimary),
              decoration: const InputDecoration(
                hintText: 'Describe your rooms, views, dining options, check-in timings, and house vibe...',
                hintStyle: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
          ),
          const SizedBox(height: 28),

          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.borderLight),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                _buildCounter('Bedrooms', provider.bedrooms, () {
                  if (provider.bedrooms > 0) {
                    provider.updateBasicInfo(provider.title, provider.description, provider.bedrooms - 1, provider.bathrooms, provider.maxGuests);
                  }
                }, () {
                  provider.updateBasicInfo(provider.title, provider.description, provider.bedrooms + 1, provider.bathrooms, provider.maxGuests);
                }),
                const Divider(color: AppColors.borderLight),
                _buildCounter('Bathrooms', provider.bathrooms, () {
                  if (provider.bathrooms > 0) {
                    provider.updateBasicInfo(provider.title, provider.description, provider.bedrooms, provider.bathrooms - 1, provider.maxGuests);
                  }
                }, () {
                  provider.updateBasicInfo(provider.title, provider.description, provider.bedrooms, provider.bathrooms + 1, provider.maxGuests);
                }),
                const Divider(color: AppColors.borderLight),
                _buildCounter('Max Guests', provider.maxGuests, () {
                  if (provider.maxGuests > 1) {
                    provider.updateBasicInfo(provider.title, provider.description, provider.bedrooms, provider.bathrooms, provider.maxGuests - 1);
                  }
                }, () {
                  provider.updateBasicInfo(provider.title, provider.description, provider.bedrooms, provider.bathrooms, provider.maxGuests + 1);
                }),
              ],
            ),
          ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),

          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

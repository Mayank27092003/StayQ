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

  Map<String, String> _getCategoryConfig(String propertyType) {
    switch (propertyType) {
      case 'HOTEL':
        return {
          'badge': '🏨 Hotel & Resort Setup',
          'titleLabel': 'Hotel / Resort Name',
          'titleHint': 'e.g. The Grand Royal Palace & Spa',
          'descHint': 'Describe your suites, in-house dining, banquet halls, 24/7 reception, swimming pool, and check-in policies...',
          'counter1': 'Total Guest Rooms',
          'counter2': 'Attached Bathrooms',
          'counter3': 'Max Guests / Room',
        };
      case 'CAMPING_SITE':
        return {
          'badge': '🏕️ Campsite & Glamping Setup',
          'titleLabel': 'Campsite / Camp Name',
          'titleHint': 'e.g. Pine Forest Stargazing Glamping Pods',
          'descHint': 'Describe your waterproof tents, evening campfire, live BBQ, trekking trails, clean washrooms, and starry nights...',
          'counter1': 'Tents / Pods',
          'counter2': 'Restrooms / Washrooms',
          'counter3': 'Max Campers Allowed',
        };
      case 'RV':
        return {
          'badge': '🚐 Luxury RV / Campervan Setup',
          'titleLabel': 'Campervan / RV Model Name',
          'titleHint': 'e.g. Nomad Cruiser 4x4 Off-Grid Motorhome',
          'descHint': 'Describe vehicle chassis, solar power wattage, kitchen setup, shower/toilet, driving terms, and off-grid amenities...',
          'counter1': 'Sleeping Berths / Beds',
          'counter2': 'Onboard Bath / Shower',
          'counter3': 'Max Passengers',
        };
      case 'LONG_TERM_HOME':
        return {
          'badge': '🏠 11-Month Rental Setup',
          'titleLabel': 'Rental House Title',
          'titleHint': 'e.g. Furnished 3BHK Gated Society Apartment near IT Park',
          'descHint': 'Describe furnishing status, society club house, covered parking, power backup, security deposit, and maintenance terms...',
          'counter1': 'Bedrooms (BHK)',
          'counter2': 'Bathrooms',
          'counter3': 'Balconies',
        };
      case 'APARTMENT':
        return {
          'badge': '🏢 Penthouse & Apartment Setup',
          'titleLabel': 'Apartment / Penthouse Title',
          'titleHint': 'e.g. Luxury Skyline 2BHK Penthouse with Balcony Jacuzzi',
          'descHint': 'Describe the modern interiors, panoramic city view, modular kitchen, elevator access, and rooftop terrace...',
          'counter1': 'Bedrooms',
          'counter2': 'Bathrooms',
          'counter3': 'Max Guests',
        };
      default:
        return {
          'badge': '🏡 ${propertyType.replaceAll('_', ' ')} Setup',
          'titleLabel': 'Property Title',
          'titleHint': 'e.g. Private Sunset Villa with Heated Pool & Chef',
          'descHint': 'Describe the bedrooms, private pool, lush lawn, living room, dining setup, and panoramic scenery...',
          'counter1': 'Bedrooms',
          'counter2': 'Bathrooms',
          'counter3': 'Max Guests',
        };
    }
  }

  Widget _buildCounter(String label, int value, VoidCallback onDecrement, VoidCallback onIncrement) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
          ),
          Row(
            children: [
              IconButton(
                onPressed: onDecrement,
                icon: const Icon(Icons.remove_circle_outline, color: AppColors.primary),
              ),
              SizedBox(
                width: 32,
                child: Text(
                  value.toString(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
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
    final config = _getCategoryConfig(provider.propertyType);

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  config['badge']!,
                  style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: AppColors.primary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
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
          Text(
            'Provide the core details specific to your ${provider.propertyType.replaceAll('_', ' ').toLowerCase()}.',
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 24),

          Text(
            config['titleLabel']!,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
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
              decoration: InputDecoration(
                hintText: config['titleHint'],
                hintStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
          ),
          const SizedBox(height: 20),

          const Text(
            'Detailed Description',
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
              decoration: InputDecoration(
                hintText: config['descHint'],
                hintStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
                _buildCounter(config['counter1']!, provider.bedrooms, () {
                  if (provider.bedrooms > 1) {
                    provider.updateBasicInfo(provider.title, provider.description, provider.bedrooms - 1, provider.bathrooms, provider.maxGuests);
                  }
                }, () {
                  provider.updateBasicInfo(provider.title, provider.description, provider.bedrooms + 1, provider.bathrooms, provider.maxGuests);
                }),
                const Divider(color: AppColors.borderLight),
                _buildCounter(config['counter2']!, provider.bathrooms, () {
                  if (provider.bathrooms > 1) {
                    provider.updateBasicInfo(provider.title, provider.description, provider.bedrooms, provider.bathrooms - 1, provider.maxGuests);
                  }
                }, () {
                  provider.updateBasicInfo(provider.title, provider.description, provider.bedrooms, provider.bathrooms + 1, provider.maxGuests);
                }),
                const Divider(color: AppColors.borderLight),
                _buildCounter(config['counter3']!, provider.maxGuests, () {
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

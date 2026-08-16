import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/stay_model.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/custom_toast.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';

class AddListingWizard extends StatefulWidget {
  const AddListingWizard({super.key});

  @override
  State<AddListingWizard> createState() => _AddListingWizardState();
}

class _AddListingWizardState extends State<AddListingWizard> {
  int _currentStep = 0;

  // Step 1 State
  String _selectedCategory = 'Villa';
  final List<Map<String, dynamic>> _categories = [
    {'title': 'Villa', 'icon': Icons.villa_outlined},
    {'title': 'Apartment', 'icon': Icons.apartment_outlined},
    {'title': 'Cabin', 'icon': Icons.cabin_outlined},
    {'title': 'Lakefront', 'icon': Icons.house_outlined},
    {'title': 'Mansion', 'icon': Icons.castle_outlined},
  ];

  // Step 2 State
  final _titleController = TextEditingController();
  final _locationController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _latController = TextEditingController();
  final _lngController = TextEditingController();
  bool _isStayingWithHost = false;
  String _roomType = 'Entire Place';
  final List<String> _selectedAmenities = ['Fast WiFi', 'Mountain View', 'Kitchen'];
  final List<String> _allAmenities = ['Fast WiFi', 'Mountain View', 'Fireplace', 'Infinity Pool', 'Kitchen', 'Free Parking', 'Sauna', 'Jacuzzi'];
  final List<String> _localImagePaths = [];

  // Step 3 State
  double _pricePerNight = 8500;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text('Step ${_currentStep + 1} of 3', style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Progress Bar Indicator
            LinearProgressIndicator(
              value: (_currentStep + 1) / 3,
              backgroundColor: AppColors.surfaceLight,
              color: AppColors.primary,
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: _buildCurrentStep(),
              ),
            ),

            // Navigation Bar Controls
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.borderLight)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_currentStep > 0)
                    TextButton(
                      onPressed: () => setState(() => _currentStep--),
                      child: const Text('Back', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                    )
                  else
                    const SizedBox(),

                  ElevatedButton(
                    onPressed: () {
                      if (_currentStep < 2) {
                        setState(() => _currentStep++);
                      } else {
                        // Create and Save New Listing
                        final provider = Provider.of<AppProvider>(context, listen: false);
                        final newStay = StayModel(
                          id: 'stay_${DateTime.now().millisecondsSinceEpoch}',
                          title: _titleController.text,
                          location: _locationController.text,
                          pricePerNight: _pricePerNight,
                          rating: 5.0,
                          reviewCount: 1,
                          imageUrls: _localImagePaths.isNotEmpty ? _localImagePaths : [
                            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80',
                            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
                          ],
                          category: _selectedCategory,
                          hostName: provider.userName.isNotEmpty ? provider.userName : 'Host',
                          hostAvatar: provider.userAvatar,
                          isNew: true,
                          amenities: _selectedAmenities,
                          description: _descriptionController.text.isNotEmpty ? _descriptionController.text : 'Luxury stay with modern amenities, serene surroundings, and curated Stay Q comfort.',
                          lat: double.tryParse(_latController.text) ?? 31.1048,
                          lng: double.tryParse(_lngController.text) ?? 77.1734,
                          isStayingWithHost: _isStayingWithHost,
                          hostPresenceType: _isStayingWithHost ? 'Host on premises' : 'Entire place',
                        );

                        provider.addNewListing(newStay);

                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Listing published successfully! 🎉')),
                        );
                        Navigator.pop(context);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(140, 50),
                    ),
                    child: Text(_currentStep == 2 ? 'Publish Listing' : 'Next'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Which of these best describes your place?', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('Choose a category for your property listing.', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
            const SizedBox(height: 24),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _categories.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.4,
              ),
              itemBuilder: (context, index) {
                final cat = _categories[index];
                final isSelected = _selectedCategory == cat['title'];
                return GestureDetector(
                  onTap: () => setState(() => _selectedCategory = cat['title']),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary.withOpacity(0.06) : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected ? AppColors.primary : AppColors.borderLight,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(cat['icon'] as IconData, size: 28, color: isSelected ? AppColors.primary : AppColors.textPrimary),
                        const SizedBox(height: 8),
                        Text(
                          cat['title'] as String,
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: isSelected ? AppColors.primary : AppColors.textPrimary),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        );

      case 1:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Title & Amenities', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            const Text('Property Title', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 6),
            TextField(
              controller: _titleController,
              decoration: InputDecoration(
                filled: true,
                fillColor: AppColors.surfaceLight,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Location', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 6),
            TextField(
              controller: _locationController,
              decoration: InputDecoration(
                filled: true,
                fillColor: AppColors.surfaceLight,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Description', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 6),
            TextField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: InputDecoration(
                filled: true,
                fillColor: AppColors.surfaceLight,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Latitude', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _latController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: AppColors.surfaceLight,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Longitude', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _lngController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: AppColors.surfaceLight,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Text('Host Presence & Privacy Type', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _isStayingWithHost = false),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: !_isStayingWithHost ? const Color(0xFFEFF6FF) : AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: !_isStayingWithHost ? AppColors.primary : AppColors.borderLight,
                          width: !_isStayingWithHost ? 2 : 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Icon(Icons.vpn_key_outlined, size: 20, color: AppColors.primary),
                          SizedBox(height: 6),
                          Text('Entire Place', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          Text('Guests have full privacy', style: TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _isStayingWithHost = true),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _isStayingWithHost ? const Color(0xFFEFF6FF) : AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: _isStayingWithHost ? AppColors.primary : AppColors.borderLight,
                          width: _isStayingWithHost ? 2 : 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Icon(Icons.people_outline_rounded, size: 20, color: AppColors.primary),
                          SizedBox(height: 6),
                          Text('Stay with Host', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          Text('Private room in host home', style: TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            const Text('Select Amenities', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _allAmenities.map((amenity) {
                final isSelected = _selectedAmenities.contains(amenity);
                return FilterChip(
                  label: Text(amenity),
                  selected: isSelected,
                  onSelected: (val) {
                    setState(() {
                      if (val) {
                        _selectedAmenities.add(amenity);
                      } else {
                        _selectedAmenities.remove(amenity);
                      }
                    });
                  },
                  selectedColor: AppColors.primary,
                  checkmarkColor: Colors.white,
                  labelStyle: TextStyle(color: isSelected ? Colors.white : AppColors.textPrimary),
                );
              }).toList(),
            ),
          ],
        );

      case 2:
        final double estEarnings = (_pricePerNight * 20 * 0.85);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Photos & Pricing', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),

            GestureDetector(
              onTap: () async {
                final picker = ImagePicker();
                final images = await picker.pickMultiImage();
                if (images.isNotEmpty) {
                  setState(() {
                    _localImagePaths.addAll(images.map((e) => e.path));
                  });
                }
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Column(
                  children: const [
                    Icon(Icons.cloud_upload_outlined, size: 42, color: AppColors.primary),
                    SizedBox(height: 8),
                    Text('Upload Property Photos', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    SizedBox(height: 4),
                    Text('Tap to select images from gallery', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  ],
                ),
              ),
            ),
            if (_localImagePaths.isNotEmpty) ...[
              const SizedBox(height: 16),
              SizedBox(
                height: 80,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _localImagePaths.length,
                  itemBuilder: (context, index) {
                    return Container(
                      margin: const EdgeInsets.only(right: 8),
                      width: 80,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        image: DecorationImage(
                          image: FileImage(File(_localImagePaths[index])),
                          fit: BoxFit.cover,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],

            const SizedBox(height: 32),

            const Text('Set Your Price Per Night', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),

            Center(
              child: Text(
                '₹${_pricePerNight.toInt()}',
                style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: AppColors.primary),
              ),
            ),

            Slider(
              value: _pricePerNight,
              min: 2000,
              max: 50000,
              divisions: 96,
              activeColor: AppColors.primary,
              onChanged: (val) => setState(() => _pricePerNight = val),
            ),

            const SizedBox(height: 16),

            // Live In-Hand Host Earnings Breakdown Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.payments_rounded, color: Color(0xFF059669), size: 20),
                          SizedBox(width: 6),
                          Text('Net In-Hand Earnings', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A))),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('You keep ~96%', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF059669))),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildEarningsItem('Listed Rate', '₹${_pricePerNight.toInt()}', const Color(0xFF0F172A)),
                      _buildEarningsItem('Stay Q (3%)', '-₹${(_pricePerNight * 0.03).round()}', const Color(0xFFEF4444)),
                      _buildEarningsItem('TDS (1%)', '-₹${(_pricePerNight * 0.01).round()}', const Color(0xFF64748B)),
                      _buildEarningsItem('You Earn', '₹${(_pricePerNight * 0.96).round()}', const Color(0xFF059669), isHighlight: true),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Divider(color: Color(0xFFE2E8F0)),
                  const SizedBox(height: 6),
                  Text(
                    '🛒 Guests will pay approx ₹${(_pricePerNight * 1.118).round()}/night (includes 10% guest service fee + GST).',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF475569)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '💰 Estimated Monthly Net (20 nights): ₹${(_pricePerNight * 20 * 0.96).round().toString()}',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF047857)),
                  ),
                ],
              ),
            ),
          ],
        );

      default:
        return const SizedBox();
    }
  }

  Widget _buildEarningsItem(String label, String value, Color color, {bool isHighlight = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: isHighlight ? const Color(0xFFDCFCE7) : Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: isHighlight ? const Color(0xFFA7F3D0) : const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: color)),
        ],
      ),
    );
  }
}

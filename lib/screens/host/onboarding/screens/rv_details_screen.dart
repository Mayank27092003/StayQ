import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../theme/app_colors.dart';

class RvDetailsScreen extends StatefulWidget {
  const RvDetailsScreen({Key? key}) : super(key: key);

  @override
  State<RvDetailsScreen> createState() => _RvDetailsScreenState();
}

class _RvDetailsScreenState extends State<RvDetailsScreen> {
  // 1. Basic Info
  String _rvType = 'Motorhome';
  final _makeController = TextEditingController();
  final _modelController = TextEditingController();
  final _yearController = TextEditingController();
  String _fuelType = 'Diesel';

  // 2. Interior
  int _beds = 2;
  bool _hasKitchen = true;
  bool _hasBathroom = true;
  bool _hasAc = true;

  // 3. Equipment
  final Map<String, bool> _equipment = {
    'Generator': false,
    'Solar Panels': false,
    'Awning': false,
    'Camping Chairs': false,
  };

  // 4. Photos (mock local state for UI)
  final List<String> _photoSlots = [
    'Front View', 'Rear View', 'Driver Area', 'Living Area',
    'Kitchen', 'Bathroom', 'Bedroom', 'Exterior Side'
  ];
  final Set<int> _uploadedPhotos = {};

  // 5. Pickup & Delivery
  final _pickupController = TextEditingController();
  bool _deliveryAvailable = false;

  // 6. Driving Rules
  double _minAge = 21;
  bool _petFriendly = false;
  bool _offRoadAllowed = false;

  // 7. Insurance & Legal
  final _insuranceController = TextEditingController();

  // 8. Vehicle Condition
  final _mileageController = TextEditingController();
  final _conditionNotesController = TextEditingController();

  // UI State
  final List<bool> _isExpanded = List.generate(8, (_) => false);

  @override
  void initState() {
    super.initState();
    _isExpanded[0] = true; // Open first section by default
  }

  @override
  void dispose() {
    _makeController.dispose();
    _modelController.dispose();
    _yearController.dispose();
    _pickupController.dispose();
    _insuranceController.dispose();
    _mileageController.dispose();
    _conditionNotesController.dispose();
    super.dispose();
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {TextInputType type = TextInputType.text, int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: TextField(
              controller: controller,
              keyboardType: type,
              maxLines: maxLines,
              decoration: const InputDecoration(
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToggleCard(String title, bool value, ValueChanged<bool> onChanged, IconData icon) {
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: value ? AppColors.primary.withOpacity(0.1) : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: value ? AppColors.primary : AppColors.borderLight),
        ),
        child: Row(
          children: [
            Icon(icon, color: value ? AppColors.primary : AppColors.textSecondary),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: value ? AppColors.primary : AppColors.textPrimary,
                ),
              ),
            ),
            Switch(
              value: value,
              onChanged: onChanged,
              activeColor: AppColors.primary,
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'RV Details',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
                letterSpacing: -0.5,
              ),
            ).animate().fadeIn().slideX(),
            const SizedBox(height: 8),
            const Text(
              'Let\'s build an awesome profile for your rig!',
              style: TextStyle(
                fontSize: 16,
                color: AppColors.textSecondary,
              ),
            ).animate().fadeIn(delay: 100.ms).slideX(),
            const SizedBox(height: 32),

            // Use ExpansionPanelList for playful interactive sections
            Theme(
              data: Theme.of(context).copyWith(
                dividerColor: Colors.transparent,
                colorScheme: ColorScheme.light(primary: AppColors.primary),
              ),
              child: ExpansionPanelList(
                elevation: 0,
                expandedHeaderPadding: const EdgeInsets.symmetric(vertical: 8),
                expansionCallback: (int index, bool isExpanded) {
                  setState(() {
                    _isExpanded[index] = isExpanded;
                  });
                },
                children: [
                  // 1. Basic Info
                  ExpansionPanel(
                    isExpanded: _isExpanded[0],
                    canTapOnHeader: true,
                    backgroundColor: Colors.transparent,
                    headerBuilder: (context, isExpanded) => _buildSectionHeader('Basic Info', Icons.directions_car),
                    body: Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Vehicle Type', style: TextStyle(fontWeight: FontWeight.w600)),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: ['Motorhome', 'Campervan', 'Caravan', 'Travel Trailer'].map((type) {
                              final isSelected = _rvType == type;
                              return ChoiceChip(
                                label: Text(type),
                                selected: isSelected,
                                onSelected: (val) => setState(() => _rvType = type),
                                selectedColor: AppColors.primary,
                                labelStyle: TextStyle(color: isSelected ? Colors.white : AppColors.textPrimary),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(child: _buildTextField('Make', _makeController)),
                              const SizedBox(width: 16),
                              Expanded(child: _buildTextField('Model', _modelController)),
                            ],
                          ),
                          Row(
                            children: [
                              Expanded(child: _buildTextField('Year', _yearController, type: TextInputType.number)),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Fuel Type', style: TextStyle(fontWeight: FontWeight.w600)),
                                    const SizedBox(height: 8),
                                    DropdownButtonFormField<String>(
                                      value: _fuelType,
                                      decoration: InputDecoration(
                                        filled: true,
                                        fillColor: AppColors.surfaceLight,
                                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                                      ),
                                      items: ['Gasoline', 'Diesel', 'Electric'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                                      onChanged: (val) => setState(() => _fuelType = val!),
                                    ),
                                    const SizedBox(height: 16),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  // 2. Interior
                  ExpansionPanel(
                    isExpanded: _isExpanded[1],
                    canTapOnHeader: true,
                    backgroundColor: Colors.transparent,
                    headerBuilder: (context, isExpanded) => _buildSectionHeader('Interior & Comfort', Icons.bed),
                    body: Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Number of Beds', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                              Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove_circle_outline),
                                    color: AppColors.primary,
                                    onPressed: () => setState(() { if (_beds > 1) _beds--; }),
                                  ),
                                  Text('$_beds', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline),
                                    color: AppColors.primary,
                                    onPressed: () => setState(() => _beds++),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          _buildToggleCard('Kitchen Available', _hasKitchen, (v) => setState(() => _hasKitchen = v), Icons.kitchen),
                          const SizedBox(height: 12),
                          _buildToggleCard('Bathroom (Shower/Toilet)', _hasBathroom, (v) => setState(() => _hasBathroom = v), Icons.bathtub),
                          const SizedBox(height: 12),
                          _buildToggleCard('Air Conditioning', _hasAc, (v) => setState(() => _hasAc = v), Icons.ac_unit),
                        ],
                      ),
                    ),
                  ),

                  // 3. Equipment
                  ExpansionPanel(
                    isExpanded: _isExpanded[2],
                    canTapOnHeader: true,
                    backgroundColor: Colors.transparent,
                    headerBuilder: (context, isExpanded) => _buildSectionHeader('Equipment', Icons.solar_power),
                    body: Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: _equipment.keys.map((item) {
                          final isSelected = _equipment[item]!;
                          return GestureDetector(
                            onTap: () => setState(() => _equipment[item] = !isSelected),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              decoration: BoxDecoration(
                                color: isSelected ? AppColors.primary : AppColors.surfaceLight,
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(color: isSelected ? AppColors.primary : AppColors.borderLight),
                                boxShadow: isSelected ? [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))] : [],
                              ),
                              child: Text(
                                item,
                                style: TextStyle(
                                  color: isSelected ? Colors.white : AppColors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),

                  // 4. Photos
                  ExpansionPanel(
                    isExpanded: _isExpanded[3],
                    canTapOnHeader: true,
                    backgroundColor: Colors.transparent,
                    headerBuilder: (context, isExpanded) => _buildSectionHeader('Photos (8-12 Required)', Icons.camera_alt),
                    body: Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 1.2,
                        ),
                        itemCount: _photoSlots.length,
                        itemBuilder: (context, index) {
                          final isUploaded = _uploadedPhotos.contains(index);
                          return GestureDetector(
                            onTap: () => setState(() {
                              if (isUploaded) _uploadedPhotos.remove(index);
                              else _uploadedPhotos.add(index);
                            }),
                            child: Container(
                              decoration: BoxDecoration(
                                color: isUploaded ? AppColors.primary.withOpacity(0.1) : AppColors.surfaceLight,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isUploaded ? AppColors.primary : AppColors.borderLight,
                                  width: isUploaded ? 2 : 1,
                                ),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    isUploaded ? Icons.check_circle : Icons.add_a_photo,
                                    color: isUploaded ? AppColors.primary : AppColors.textSecondary,
                                    size: 32,
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    _photoSlots[index],
                                    style: TextStyle(
                                      color: isUploaded ? AppColors.primary : AppColors.textSecondary,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 12,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),

                  // 5. Pickup & Delivery
                  ExpansionPanel(
                    isExpanded: _isExpanded[4],
                    canTapOnHeader: true,
                    backgroundColor: Colors.transparent,
                    headerBuilder: (context, isExpanded) => _buildSectionHeader('Pickup & Delivery', Icons.location_on),
                    body: Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        children: [
                          _buildTextField('Default Pickup Location', _pickupController),
                          _buildToggleCard('Offer Delivery?', _deliveryAvailable, (v) => setState(() => _deliveryAvailable = v), Icons.local_shipping),
                        ],
                      ),
                    ),
                  ),

                  // 6. Rules
                  ExpansionPanel(
                    isExpanded: _isExpanded[5],
                    canTapOnHeader: true,
                    backgroundColor: Colors.transparent,
                    headerBuilder: (context, isExpanded) => _buildSectionHeader('Driving Rules', Icons.rule),
                    body: Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Minimum Driver Age: ${_minAge.toInt()} years', style: const TextStyle(fontWeight: FontWeight.w600)),
                          Slider(
                            value: _minAge,
                            min: 18,
                            max: 30,
                            divisions: 12,
                            activeColor: AppColors.primary,
                            label: _minAge.round().toString(),
                            onChanged: (val) => setState(() => _minAge = val),
                          ),
                          const SizedBox(height: 12),
                          _buildToggleCard('Pet Friendly', _petFriendly, (v) => setState(() => _petFriendly = v), Icons.pets),
                          const SizedBox(height: 12),
                          _buildToggleCard('Off-Road Allowed', _offRoadAllowed, (v) => setState(() => _offRoadAllowed = v), Icons.terrain),
                        ],
                      ),
                    ),
                  ),

                  // 7. Insurance & Legal
                  ExpansionPanel(
                    isExpanded: _isExpanded[6],
                    canTapOnHeader: true,
                    backgroundColor: Colors.transparent,
                    headerBuilder: (context, isExpanded) => _buildSectionHeader('Insurance & Legal', Icons.shield),
                    body: Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: _buildTextField('Insurance Policy Details / Number', _insuranceController, maxLines: 2),
                    ),
                  ),

                  // 8. Vehicle Condition
                  ExpansionPanel(
                    isExpanded: _isExpanded[7],
                    canTapOnHeader: true,
                    backgroundColor: Colors.transparent,
                    headerBuilder: (context, isExpanded) => _buildSectionHeader('Vehicle Condition', Icons.handyman),
                    body: Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        children: [
                          _buildTextField('Current Mileage', _mileageController, type: TextInputType.number),
                          _buildTextField('Noted Scratches / Dents', _conditionNotesController, maxLines: 3),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn(delay: 200.ms),

            const SizedBox(height: 48),
          ],
        ),
      ),
    );
  }
}

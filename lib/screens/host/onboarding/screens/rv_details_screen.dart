import '../../../../models/json_values.dart';
import 'package:provider/provider.dart';
import '../../../../providers/host_onboarding_provider.dart';
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

  // 5. Pickup & Drop Locations
  final _pickupController = TextEditingController();
  final _dropController = TextEditingController();
  bool _sameDropLocation = true;
  bool _deliveryAvailable = false;

  // Pricing & Km Allowance (Per Day)
  String _kmPackage = '100 Km/day';
  final _extraKmRateController = TextEditingController(text: '18');
  final _perDayRateController = TextEditingController(text: '8500');

  // 6. Driving Rules
  double _minAge = 21;
  bool _petFriendly = false;
  bool _offRoadAllowed = false;

  // 7. Insurance & Legal
  final _insuranceController = TextEditingController();

  // 8. Vehicle Condition
  final _mileageController = TextEditingController();
  final _conditionNotesController = TextEditingController();

  final List<String> _customCorridors = [];

  void _showAddCustomCorridorDialog() {
    final textController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Add Custom Travel Corridor', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter the name of your permitted driving route or area (e.g. "Delhi - Spiti Valley Loop"):',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: textController,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'e.g. Manali - Leh Highway',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final text = textController.text.trim();
              if (text.isNotEmpty) {
                _editState(() {
                  if (!_customCorridors.contains(text)) {
                    _customCorridors.add(text);
                  }
                  _draft.updatePermittedTravelAreas(text);
                });
                Navigator.pop(ctx);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Add & Select', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  // UI State
  final List<bool> _isExpanded = List.generate(8, (_) => false);

  @override
  void initState() {
    super.initState();
    _draft = context.read<HostOnboardingProvider>();
    final data = _draft.rvDetails;
    _makeController.text = data['makeController']?.toString() ?? _makeController.text;
    _modelController.text = data['modelController']?.toString() ?? _modelController.text;
    _yearController.text = data['yearController']?.toString() ?? _yearController.text;
    _pickupController.text = data['pickupController']?.toString() ?? _pickupController.text;
    _dropController.text = data['dropController']?.toString() ?? _dropController.text;
    _extraKmRateController.text = data['extraKmRateController']?.toString() ?? _extraKmRateController.text;
    _perDayRateController.text = data['perDayRateController']?.toString() ?? _perDayRateController.text;
    _insuranceController.text = data['insuranceController']?.toString() ?? _insuranceController.text;
    _mileageController.text = data['mileageController']?.toString() ?? _mileageController.text;
    _conditionNotesController.text = data['conditionNotesController']?.toString() ?? _conditionNotesController.text;
    _rvType = data['rvType']?.toString() ?? _rvType;
    _fuelType = data['fuelType']?.toString() ?? _fuelType;
    _beds = jsonInt(data['beds'], _beds);
    _hasKitchen = data['hasKitchen'] is bool ? data['hasKitchen'] as bool : _hasKitchen;
    _hasBathroom = data['hasBathroom'] is bool ? data['hasBathroom'] as bool : _hasBathroom;
    _hasAc = data['hasAc'] is bool ? data['hasAc'] as bool : _hasAc;
    _sameDropLocation = data['sameDropLocation'] is bool ? data['sameDropLocation'] as bool : _sameDropLocation;
    _deliveryAvailable = data['deliveryAvailable'] is bool ? data['deliveryAvailable'] as bool : _deliveryAvailable;
    _kmPackage = data['kmPackage']?.toString() ?? _kmPackage;
    _minAge = jsonDouble(data['minAge'], _minAge);
    _petFriendly = data['petFriendly'] is bool ? data['petFriendly'] as bool : _petFriendly;
    _offRoadAllowed = data['offRoadAllowed'] is bool ? data['offRoadAllowed'] as bool : _offRoadAllowed;
    for (final entry in jsonMap(data['equipment']).entries) { if (_equipment.containsKey(entry.key)) _equipment[entry.key] = entry.value == true; }
    _isExpanded[0] = true;
    _makeController.addListener(_persist);
    _modelController.addListener(_persist);
    _yearController.addListener(_persist);
    _pickupController.addListener(_persist);
    _dropController.addListener(_persist);
    _extraKmRateController.addListener(_persist);
    _perDayRateController.addListener(_persist);
    _insuranceController.addListener(_persist);
    _mileageController.addListener(_persist);
    _conditionNotesController.addListener(_persist);
  }

  late HostOnboardingProvider _draft;
  void _editState(VoidCallback change) { if (!mounted) return; setState(change); _persist(); }
  void _persist() {
    if (!mounted) return;
    _draft.rvDetails = {
      'makeController': _makeController.text,
      'modelController': _modelController.text,
      'yearController': _yearController.text,
      'pickupController': _pickupController.text,
      'dropController': _dropController.text,
      'extraKmRateController': _extraKmRateController.text,
      'perDayRateController': _perDayRateController.text,
      'insuranceController': _insuranceController.text,
      'mileageController': _mileageController.text,
      'conditionNotesController': _conditionNotesController.text,
      'rvType': _rvType,
      'fuelType': _fuelType,
      'beds': _beds,
      'hasKitchen': _hasKitchen,
      'hasBathroom': _hasBathroom,
      'hasAc': _hasAc,
      'sameDropLocation': _sameDropLocation,
      'deliveryAvailable': _deliveryAvailable,
      'kmPackage': _kmPackage,
      'minAge': _minAge,
      'petFriendly': _petFriendly,
      'offRoadAllowed': _offRoadAllowed,
      'equipment': _equipment,
    };
    _draft.pickupLocation = _pickupController.text.trim();
    _draft.dropLocation = _sameDropLocation ? _pickupController.text.trim() : _dropController.text.trim();
    _draft.vehicleType = _rvType;
    _draft.rvFacilities = [if (_hasKitchen) 'Kitchen', if (_hasBathroom) 'Bathroom', if (_hasAc) 'Air conditioning',
      ..._equipment.entries.where((e) => e.value).map((e) => e.key)];
    final rate = double.tryParse(_perDayRateController.text); if (rate != null && rate > 0) _draft.pricePerNight = rate;
    _draft.notifyListeners();
  }

  @override
  void dispose() {
    _makeController.dispose();
    _modelController.dispose();
    _yearController.dispose();
    _pickupController.dispose();
    _dropController.dispose();
    _extraKmRateController.dispose();
    _perDayRateController.dispose();
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
                  _editState(() {
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
                                onSelected: (val) => _editState(() => _rvType = type),
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
                                      onChanged: (val) => _editState(() => _fuelType = val!),
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
                                    onPressed: () => _editState(() { if (_beds > 1) _beds--; }),
                                  ),
                                  Text('$_beds', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline),
                                    color: AppColors.primary,
                                    onPressed: () => _editState(() => _beds++),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          _buildToggleCard('Kitchen Available', _hasKitchen, (v) => _editState(() => _hasKitchen = v), Icons.kitchen),
                          const SizedBox(height: 12),
                          _buildToggleCard('Bathroom (Shower/Toilet)', _hasBathroom, (v) => _editState(() => _hasBathroom = v), Icons.bathtub),
                          const SizedBox(height: 12),
                          _buildToggleCard('Air Conditioning', _hasAc, (v) => _editState(() => _hasAc = v), Icons.ac_unit),
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
                            onTap: () => _editState(() => _equipment[item] = !isSelected),
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
                          const photoKeys = ['exterior_front', 'exterior_side', 'driver_dashboard', 'living_lounge', 'kitchen_galley', 'onboard_bathroom', 'sleeping_berth', 'facilities_storage'];
                          final isUploaded = _draft.getPhotosForCategory(photoKeys[index]).isNotEmpty;
                          return GestureDetector(
                            onTap: () => _editState(() { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add RV photos in the Photos step.'))); }),
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

                  // 5. Pickup & Drop Locations & Km Allowance
                  ExpansionPanel(
                    isExpanded: _isExpanded[4],
                    canTapOnHeader: true,
                    backgroundColor: Colors.transparent,
                    headerBuilder: (context, isExpanded) => _buildSectionHeader(
                      _draft.rvRentalMode == 'STATIONARY' ? 'RV Parked Location & Handover' : 'Pickup, Drop & Travel Corridors',
                      Icons.location_on,
                    ),
                    body: Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildTextField(
                            _draft.rvRentalMode == 'STATIONARY'
                                ? 'Parked Rig Location / Base * (e.g. Scenic Farm, Lonavala)'
                                : 'RV Pickup Location * (e.g. Goa Airport / Panaji Hub)',
                            _pickupController,
                          ),
                          if (_draft.rvRentalMode != 'STATIONARY') ...[
                            const SizedBox(height: 12),
                            _buildToggleCard(
                              'Drop Location same as Pickup?',
                              _sameDropLocation,
                              (v) => _editState(() => _sameDropLocation = v),
                              Icons.swap_horiz_rounded,
                            ),
                            if (!_sameDropLocation) ...[
                              const SizedBox(height: 12),
                              _buildTextField('Designated Drop Location / Hubs *', _dropController),
                            ],
                            const SizedBox(height: 12),
                            _buildToggleCard('Doorstep RV Delivery & Handover Available?', _deliveryAvailable, (v) => _editState(() => _deliveryAvailable = v), Icons.local_shipping),
                            const SizedBox(height: 16),
                            const Text('Permitted Travel Corridors & Areas *', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary)),
                            const SizedBox(height: 4),
                            const Text('Specify where guests are authorized to drive this rig:', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                ...{'All India', 'Himachal & Ladakh Circuit', 'Goa & Konkan Coastal Route', 'Rajasthan Desert Corridor', 'Western Ghats Route', ..._customCorridors, if (_draft.permittedTravelAreas.isNotEmpty) _draft.permittedTravelAreas}.map((area) {
                                  final isSel = _draft.permittedTravelAreas == area;
                                  return ChoiceChip(
                                    label: Text(area, style: TextStyle(color: isSel ? Colors.white : AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 12)),
                                    selected: isSel,
                                    selectedColor: AppColors.primary,
                                    backgroundColor: AppColors.surfaceLight,
                                    onSelected: (sel) {
                                      if (sel) _editState(() => _draft.updatePermittedTravelAreas(area));
                                    },
                                  );
                                }),
                                ActionChip(
                                  avatar: const Icon(Icons.add_road_rounded, size: 16, color: AppColors.primary),
                                  label: const Text('+ Add Custom Corridor', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12)),
                                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                                  side: BorderSide(color: AppColors.primary.withValues(alpha: 0.3)),
                                  onPressed: _showAddCustomCorridorDialog,
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            const Text('Daily Included Kilometer Allowance *', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary)),
                            const SizedBox(height: 4),
                            const Text('Select the driving allowance included in your daily base rate:', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: ['80 Km/day', '100 Km/day', '150 Km/day', '250 Km/day', 'Unlimited'].map((pkg) {
                                final isSel = _kmPackage == pkg;
                                return ChoiceChip(
                                  label: Text(pkg, style: TextStyle(color: isSel ? Colors.white : AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 12)),
                                  selected: isSel,
                                  selectedColor: AppColors.primary,
                                  backgroundColor: AppColors.surfaceLight,
                                  onSelected: (sel) {
                                    if (sel) _editState(() => _kmPackage = pkg);
                                  },
                                );
                              }).toList(),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                if (_kmPackage != 'Unlimited') ...[
                                  Expanded(
                                    child: _buildTextField('Extra Km Charge (₹/km)', _extraKmRateController, type: TextInputType.number),
                                  ),
                                  const SizedBox(width: 14),
                                ],
                                Expanded(
                                  child: _buildTextField('Per Day Rental (₹/day)', _perDayRateController, type: TextInputType.number),
                                ),
                              ],
                            ),
                          ] else ...[
                            const SizedBox(height: 12),
                            _buildTextField('Per Night Stay Rate (₹/night)', _perDayRateController, type: TextInputType.number),
                          ],
                        ],
                      ),
                    ),
                  ),

                  // 6. Rules
                  ExpansionPanel(
                    isExpanded: _isExpanded[5],
                    canTapOnHeader: true,
                    backgroundColor: Colors.transparent,
                    headerBuilder: (context, isExpanded) => _buildSectionHeader(
                      _draft.rvRentalMode == 'STATIONARY' ? 'RV Stay Rules' : 'Driving & Trip Rules',
                      Icons.rule,
                    ),
                    body: Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (_draft.rvRentalMode != 'STATIONARY') ...[
                            Text('Minimum Driver Age: ${_minAge.toInt()} years', style: const TextStyle(fontWeight: FontWeight.w600)),
                            Slider(
                              value: _minAge,
                              min: 18,
                              max: 30,
                              divisions: 12,
                              activeColor: AppColors.primary,
                              label: _minAge.round().toString(),
                              onChanged: (val) => _editState(() => _minAge = val),
                            ),
                            const SizedBox(height: 12),
                            _buildToggleCard('Off-Road Driving Allowed', _offRoadAllowed, (v) => _editState(() => _offRoadAllowed = v), Icons.terrain),
                            const SizedBox(height: 12),
                          ],
                          _buildToggleCard('Pet Friendly', _petFriendly, (v) => _editState(() => _petFriendly = v), Icons.pets),
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

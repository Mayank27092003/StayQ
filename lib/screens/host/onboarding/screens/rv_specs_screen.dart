import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';

class RvSpecsScreen extends StatefulWidget {
  const RvSpecsScreen({Key? key}) : super(key: key);

  @override
  State<RvSpecsScreen> createState() => _RvSpecsScreenState();
}

class _RvSpecsScreenState extends State<RvSpecsScreen> {
  late HostOnboardingProvider _provider;

  String _rvType = 'Campervan';
  String _selectedMake = 'Force Motors';
  String _selectedModel = 'Urbania Luxury Camper';
  String _selectedYear = '2024';
  String _fuelType = 'Diesel';
  String _transmission = 'Manual';

  final TextEditingController _customMakeController = TextEditingController();
  final TextEditingController _customModelController = TextEditingController();
  bool _isCustomMake = false;
  bool _isCustomModel = false;

  final List<String> _rvTypes = [
    'Campervan',
    'Motorhome',
    '4x4 Overland Rig',
    'Caravan',
    'Travel Trailer',
  ];

  final Map<String, List<String>> _makeModels = {
    'Force Motors': [
      'Urbania Luxury Camper',
      'Traveller 3350 Motorhome',
      'Traveller 4020 Super Cruiser',
      'Gurkha 4x4 Expedition',
      'Other Force Model',
    ],
    'JCBL Limited': [
      'Destiny Luxury Motorhome',
      'Signature Caravan',
      'Overlander 4x4 Rig',
      'Other JCBL Model',
    ],
    'Pinnacle Speciality': [
      'Finetza Expandable RV',
      'Magnifica Luxury Van',
      'Opulenz Campervan',
      'Other Pinnacle Model',
    ],
    'OJES Automobiles': [
      'Luxury Bus Motorhome',
      'Explorer Caravan Van',
      'Vanity Luxury Rig',
      'Other OJES Model',
    ],
    'Motorhome Adventures': [
      'Wanderlust 4x4 Camper',
      'Nomad Cruiser Van',
      'Club Overlander Rig',
      'Other MHA Model',
    ],
    'Carvaa Caravans': [
      'Rare Caravan Conversion',
      'Nomad Campervan',
      'Teardrop Travel Trailer',
      'Other Carvaa Model',
    ],
    'Tata Motors': [
      'Winger Platinum Motorhome',
      'Winger Executive Camper',
      'Yodha 4x4 Overland',
      'Xenon Offroad Camper',
      'Other Tata Model',
    ],
    'Mahindra': [
      'Bolero Camper 4x4',
      'Scorpio-N Overland Edition',
      'Thar Expedition Camper',
      'Veero Compact Camper',
      'Other Mahindra Model',
    ],
    'Isuzu': [
      'D-Max V-Cross Overland',
      'S-CAB Expedition Van',
      'MU-X Nomad Rig',
      'Other Isuzu Model',
    ],
    'Eicher Motors': [
      'Pro 2049 Expedition Van',
      'Skyline Motorhome',
      'Pro 3008 Overland Cruiser',
      'Other Eicher Model',
    ],
    'Ashok Leyland': [
      'Bada Dost Camper',
      'MiTR Motorhome',
      'Other Leyland Model',
    ],
    'BharatBenz': [
      'Custom Luxury Coach 1017',
      'Overland Motorhome 1217',
      '1617 Heavy Cruiser',
      'Other BharatBenz Model',
    ],
    'Mercedes-Benz': [
      'Sprinter Luxury RV',
      'V-Class Marco Polo',
      'Unimog Expedition Rig',
      'Other Mercedes Model',
    ],
    'Toyota': [
      'Hilux Overland Camper',
      'HiAce Luxury Cruiser',
      'Land Cruiser Expedition',
      'Other Toyota Model',
    ],
    'Custom / Coachbuilder': [
      'Bespoke Luxury Motorhome',
      'Custom Caravan Trailer',
      'Off-Grid Expedition Camper',
      'Other Custom Model',
    ],
  };

  final List<String> _years = [
    '2026', '2025', '2024', '2023', '2022', '2021',
    '2020', '2019', '2018', '2017', '2016', '2015', '2014', 'Older'
  ];

  @override
  void initState() {
    super.initState();
    _provider = context.read<HostOnboardingProvider>();
    final details = _provider.rvDetails;

    _rvType = details['rvType']?.toString() ?? _rvType;
    _fuelType = details['fuelType']?.toString() ?? _fuelType;
    _transmission = details['transmission']?.toString() ?? _transmission;

    final savedMake = details['makeController']?.toString() ?? '';
    final savedModel = details['modelController']?.toString() ?? '';
    final savedYear = details['yearController']?.toString() ?? '';

    if (savedMake.isNotEmpty) {
      if (_makeModels.containsKey(savedMake)) {
        _selectedMake = savedMake;
      } else {
        _selectedMake = 'Custom / Coachbuilder';
        _isCustomMake = true;
        _customMakeController.text = savedMake;
      }
    }

    if (savedModel.isNotEmpty) {
      final available = _makeModels[_selectedMake] ?? [];
      if (available.contains(savedModel)) {
        _selectedModel = savedModel;
      } else {
        _isCustomModel = true;
        _customModelController.text = savedModel;
      }
    } else {
      _selectedModel = _makeModels[_selectedMake]?.first ?? 'Urbania Luxury Camper';
    }

    if (savedYear.isNotEmpty && _years.contains(savedYear)) {
      _selectedYear = savedYear;
    }

    _customMakeController.addListener(_sync);
    _customModelController.addListener(_sync);
  }

  void _sync() {
    if (!mounted) return;
    final finalMake = _isCustomMake ? _customMakeController.text.trim() : _selectedMake;
    final finalModel = _isCustomModel ? _customModelController.text.trim() : _selectedModel;

    _provider.rvDetails = {
      ..._provider.rvDetails,
      'rvType': _rvType,
      'makeController': finalMake.isNotEmpty ? finalMake : _selectedMake,
      'modelController': finalModel.isNotEmpty ? finalModel : _selectedModel,
      'yearController': _selectedYear,
      'fuelType': _fuelType,
      'transmission': _transmission,
    };
    _provider.notifyListeners();
  }

  @override
  void dispose() {
    _customMakeController.dispose();
    _customModelController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final availableModels = _makeModels[_selectedMake] ?? ['Other Custom Model'];

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step pill badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              'RV SETUP • PAGE 1 OF 4',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
                letterSpacing: 0.8,
              ),
            ),
          ).animate().fadeIn(),
          const SizedBox(height: 8),

          const Text(
            'Rig Identity & Vehicle Specs',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn(delay: 50.ms).slideX(),
          const SizedBox(height: 6),
          const Text(
            'Select your campervan specifications so travelers can find the right rig.',
            style: TextStyle(fontSize: 13.5, color: AppColors.textSecondary, height: 1.4),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 24),

          // 1. Vehicle Type Selector
          const Text(
            'Vehicle Classification *',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _rvTypes.map((type) {
              final isSel = _rvType == type;
              return ChoiceChip(
                label: Text(
                  type,
                  style: TextStyle(
                    color: isSel ? Colors.white : AppColors.textPrimary,
                    fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                    fontSize: 12.5,
                  ),
                ),
                selected: isSel,
                selectedColor: AppColors.primary,
                backgroundColor: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                side: BorderSide(color: isSel ? AppColors.primary : AppColors.borderLight),
                onSelected: (sel) {
                  if (sel) {
                    AppMotion.tapSelection();
                    setState(() => _rvType = type);
                    _sync();
                  }
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 24),

          // 2. Make Dropdown
          _buildDropdownField(
            label: 'Vehicle Manufacturer / Make *',
            value: _selectedMake,
            items: _makeModels.keys.toList(),
            icon: Icons.directions_bus_filled_rounded,
            isDark: isDark,
            onChanged: (val) {
              if (val != null) {
                AppMotion.tapLight();
                setState(() {
                  _selectedMake = val;
                  _isCustomMake = val == 'Custom / Coachbuilder';
                  final newModels = _makeModels[val] ?? [];
                  _selectedModel = newModels.isNotEmpty ? newModels.first : 'Custom Model';
                  _isCustomModel = false;
                });
                _sync();
              }
            },
          ),

          if (_isCustomMake) ...[
            const SizedBox(height: 10),
            _buildCustomInput(
              controller: _customMakeController,
              hint: 'Type custom coachbuilder or chassis brand name',
              isDark: isDark,
            ),
          ],
          const SizedBox(height: 18),

          // 3. Model Dropdown
          _buildDropdownField(
            label: 'Rig Model *',
            value: availableModels.contains(_selectedModel) ? _selectedModel : availableModels.first,
            items: availableModels,
            icon: Icons.local_shipping_rounded,
            isDark: isDark,
            onChanged: (val) {
              if (val != null) {
                AppMotion.tapLight();
                setState(() {
                  _selectedModel = val;
                  _isCustomModel = val.contains('Other');
                });
                _sync();
              }
            },
          ),

          if (_isCustomModel) ...[
            const SizedBox(height: 10),
            _buildCustomInput(
              controller: _customModelController,
              hint: 'Enter your custom model designation',
              isDark: isDark,
            ),
          ],
          const SizedBox(height: 18),

          // 4. Registration Year & Fuel Row
          Row(
            children: [
              Expanded(
                child: _buildDropdownField(
                  label: 'Model Year *',
                  value: _selectedYear,
                  items: _years,
                  icon: Icons.calendar_today_rounded,
                  isDark: isDark,
                  onChanged: (val) {
                    if (val != null) {
                      setState(() => _selectedYear = val);
                      _sync();
                    }
                  },
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: _buildDropdownField(
                  label: 'Fuel Type *',
                  value: _fuelType,
                  items: ['Diesel', 'Petrol', 'Electric', 'Hybrid'],
                  icon: Icons.local_gas_station_rounded,
                  isDark: isDark,
                  onChanged: (val) {
                    if (val != null) {
                      setState(() => _fuelType = val);
                      _sync();
                    }
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),

          // 5. Transmission Dropdown
          _buildDropdownField(
            label: 'Gearbox / Transmission *',
            value: _transmission,
            items: ['Manual', 'Automatic'],
            icon: Icons.settings_suggest_rounded,
            isDark: isDark,
            onChanged: (val) {
              if (val != null) {
                setState(() => _transmission = val);
                _sync();
              }
            },
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String value,
    required List<String> items,
    required IconData icon,
    required bool isDark,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: isDark ? Colors.white : AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: items.contains(value) ? value : items.first,
              isExpanded: true,
              icon: const Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.primary),
              dropdownColor: isDark ? const Color(0xFF1E1C2A) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              items: items.map((item) {
                return DropdownMenuItem<String>(
                  value: item,
                  child: Row(
                    children: [
                      Icon(icon, size: 18, color: AppColors.primary),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          item,
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white : AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCustomInput({
    required TextEditingController controller,
    required String hint,
    required bool isDark,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.5)),
      ),
      child: TextField(
        controller: controller,
        style: TextStyle(
          fontSize: 13.5,
          fontWeight: FontWeight.w600,
          color: isDark ? Colors.white : AppColors.textPrimary,
        ),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          prefixIcon: const Icon(Icons.edit_note_rounded, color: AppColors.primary, size: 20),
        ),
      ),
    );
  }
}

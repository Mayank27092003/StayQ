import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';

class RvLivingComfortScreen extends StatefulWidget {
  const RvLivingComfortScreen({Key? key}) : super(key: key);

  @override
  State<RvLivingComfortScreen> createState() => _RvLivingComfortScreenState();
}

class _RvLivingComfortScreenState extends State<RvLivingComfortScreen> {
  late HostOnboardingProvider _provider;

  int _berths = 4;
  List<String> _selectedBedTypes = ['Fixed Double Bed', 'Convertible Dinette'];
  List<String> _selectedKitchen = ['Gas Stove', 'Mini-Fridge', 'Sink with Water Tap'];
  String _bathroomSetup = 'Private Indoor Toilet & Shower';
  List<String> _selectedClimate = ['Roof AC', '12V Ventilation Fan'];
  List<String> _selectedOffGrid = ['Solar Panels', 'Power Inverter', 'Fresh Water Tank', 'Side Awning'];

  final List<String> _bedOptions = [
    'Fixed Double Bed',
    'Convertible Dinette',
    'Pop-up Roof Tent',
    'Bunk Beds',
    'Single Foldable Cot',
  ];

  final List<String> _kitchenOptions = [
    'Gas Stove',
    'Mini-Fridge',
    'Induction Cooktop',
    'Sink with Water Tap',
    'Microwave',
    'Basic Cookware & Cutlery',
  ];

  final List<String> _bathroomOptions = [
    'Private Indoor Toilet & Shower',
    'Portable Porta-Potty Toilet',
    'Outdoor Shower Tent',
    'Campground Washrooms Only',
  ];

  final List<String> _climateOptions = [
    'Roof AC',
    'Auxiliary Cabin Heater',
    '12V Ventilation Fan',
    'Portable DC Fans',
  ];

  final List<String> _offGridOptions = [
    'Solar Panels',
    'Power Inverter',
    'Fresh Water Tank',
    'Gray Water Tank',
    'Dual Auxiliary Battery',
    'Side Awning',
    'Starlink / Wi-Fi',
    'Outdoor Camping Chairs & Table',
  ];

  @override
  void initState() {
    super.initState();
    _provider = context.read<HostOnboardingProvider>();
    final details = _provider.rvDetails;

    if (details['berths'] is int) {
      _berths = details['berths'] as int;
    } else if (details['berths'] != null) {
      _berths = int.tryParse(details['berths'].toString()) ?? 4;
    }

    if (details['bedTypes'] is List) {
      _selectedBedTypes = List<String>.from(details['bedTypes']);
    }
    if (details['kitchenAmenities'] is List) {
      _selectedKitchen = List<String>.from(details['kitchenAmenities']);
    }
    if (details['bathroomSetup'] is String && details['bathroomSetup'].toString().isNotEmpty) {
      _bathroomSetup = details['bathroomSetup'].toString();
    }
    if (details['climateControl'] is List) {
      _selectedClimate = List<String>.from(details['climateControl']);
    }
    if (details['offGridEquipment'] is List) {
      _selectedOffGrid = List<String>.from(details['offGridEquipment']);
    }
  }

  void _sync() {
    if (!mounted) return;
    _provider.rvDetails = {
      ..._provider.rvDetails,
      'berths': _berths,
      'bedTypes': _selectedBedTypes,
      'kitchenAmenities': _selectedKitchen,
      'bathroomSetup': _bathroomSetup,
      'climateControl': _selectedClimate,
      'offGridEquipment': _selectedOffGrid,
    };
    _provider.maxGuests = _berths;
    _provider.notifyListeners();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
              'RV SETUP • PAGE 2 OF 4',
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
            'Living Comfort & Onboard Amenities',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn(delay: 50.ms).slideX(),
          const SizedBox(height: 6),
          const Text(
            'Detail the sleeping berths, galley kitchen, washroom, and off-grid equipment.',
            style: TextStyle(fontSize: 13.5, color: AppColors.textSecondary, height: 1.4),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 24),

          // 1. Sleeping Berths Stepper
          _buildCard(
            isDark: isDark,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Sleeping Capacity (Berths) *',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'How many travelers can comfortably sleep?',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
                Row(
                  children: [
                    _buildStepperBtn(
                      icon: Icons.remove,
                      onTap: _berths > 1
                          ? () {
                              AppMotion.tapSelection();
                              setState(() => _berths--);
                              _sync();
                            }
                          : null,
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      child: Text(
                        '$_berths',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.primary),
                      ),
                    ),
                    _buildStepperBtn(
                      icon: Icons.add,
                      onTap: _berths < 8
                          ? () {
                              AppMotion.tapSelection();
                              setState(() => _berths++);
                              _sync();
                            }
                          : null,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 2. Bed Layout
          _buildChipSection(
            title: 'Bed Layout & Sleeping Setup',
            subtitle: 'Select all sleeping configurations in your rig',
            options: _bedOptions,
            selected: _selectedBedTypes,
            isDark: isDark,
            onToggle: (item) {
              setState(() {
                if (_selectedBedTypes.contains(item)) {
                  _selectedBedTypes.remove(item);
                } else {
                  _selectedBedTypes.add(item);
                }
              });
              _sync();
            },
          ),
          const SizedBox(height: 20),

          // 3. Kitchen / Galley
          _buildChipSection(
            title: 'Kitchen & Galley Facilities',
            subtitle: 'Cooking equipment available for guests',
            options: _kitchenOptions,
            selected: _selectedKitchen,
            isDark: isDark,
            onToggle: (item) {
              setState(() {
                if (_selectedKitchen.contains(item)) {
                  _selectedKitchen.remove(item);
                } else {
                  _selectedKitchen.add(item);
                }
              });
              _sync();
            },
          ),
          const SizedBox(height: 20),

          // 4. Washroom / Bathroom Setup (Single choice)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Washroom & Shower Setup *',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 4),
              const Text(
                'Select your rig toilet and shower arrangement',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 10),
              Column(
                children: _bathroomOptions.map((opt) {
                  final isSel = _bathroomSetup == opt;
                  return BouncingWidget(
                    onTap: () {
                      AppMotion.tapSelection();
                      setState(() => _bathroomSetup = opt);
                      _sync();
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: isSel ? AppColors.primary.withValues(alpha: 0.08) : (isDark ? const Color(0xFF1E1C2A) : Colors.white),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSel ? AppColors.primary : (isDark ? Colors.white12 : AppColors.borderLight),
                          width: isSel ? 1.6 : 1.0,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isSel ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                            color: isSel ? AppColors.primary : AppColors.textSecondary,
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              opt,
                              style: TextStyle(
                                fontSize: 13.5,
                                fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                                color: isSel ? AppColors.primary : AppColors.textPrimary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // 5. Climate Control
          _buildChipSection(
            title: 'Climate Control',
            subtitle: 'Cabin temperature comfort',
            options: _climateOptions,
            selected: _selectedClimate,
            isDark: isDark,
            onToggle: (item) {
              setState(() {
                if (_selectedClimate.contains(item)) {
                  _selectedClimate.remove(item);
                } else {
                  _selectedClimate.add(item);
                }
              });
              _sync();
            },
          ),
          const SizedBox(height: 20),

          // 6. Off-Grid & Expedition Gear
          _buildChipSection(
            title: 'Off-Grid & Power Equipment',
            subtitle: 'Capabilities for wild camping and off-grid road trips',
            options: _offGridOptions,
            selected: _selectedOffGrid,
            isDark: isDark,
            onToggle: (item) {
              setState(() {
                if (_selectedOffGrid.contains(item)) {
                  _selectedOffGrid.remove(item);
                } else {
                  _selectedOffGrid.add(item);
                }
              });
              _sync();
            },
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildCard({required Widget child, required bool isDark}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
      ),
      child: child,
    );
  }

  Widget _buildStepperBtn({required IconData icon, VoidCallback? onTap}) {
    return BouncingWidget(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: onTap != null ? AppColors.primary.withValues(alpha: 0.12) : Colors.grey.withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 18, color: onTap != null ? AppColors.primary : Colors.grey),
      ),
    );
  }

  Widget _buildChipSection({
    required String title,
    required String subtitle,
    required List<String> options,
    required List<String> selected,
    required bool isDark,
    required ValueChanged<String> onToggle,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
        const SizedBox(height: 4),
        Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.map((opt) {
            final isSel = selected.contains(opt);
            return FilterChip(
              label: Text(
                opt,
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
              onSelected: (_) {
                AppMotion.tapSelection();
                onToggle(opt);
              },
            );
          }).toList(),
        ),
      ],
    );
  }
}

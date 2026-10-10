import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';

class RvMobilityPricingScreen extends StatefulWidget {
  const RvMobilityPricingScreen({Key? key}) : super(key: key);

  @override
  State<RvMobilityPricingScreen> createState() => _RvMobilityPricingScreenState();
}

class _RvMobilityPricingScreenState extends State<RvMobilityPricingScreen> {
  late HostOnboardingProvider _provider;

  String _mobilityMode = 'SELF_DRIVE'; // SELF_DRIVE, CHAUFFEUR, STATIONARY
  int _dailyKm = 150;
  final TextEditingController _extraKmRateController = TextEditingController(text: '18');
  final TextEditingController _baseDailyRateController = TextEditingController(text: '6500');
  final TextEditingController _customCorridorController = TextEditingController();
  late final TextEditingController _weeklyDiscountController;
  late final TextEditingController _monthlyDiscountController;

  List<String> _permittedCorridors = [
    'Golden Triangle (Delhi-Agra-Jaipur)',
    'Himachal & Spiti Circuit',
    'Goa & Konkan Coastal Trail',
  ];

  final List<String> _popularCorridors = [
    'Golden Triangle (Delhi-Agra-Jaipur)',
    'Himachal & Spiti Circuit',
    'Goa & Konkan Coastal Trail',
    'Ladakh Overland Highway',
    'Western Ghats & Coorg',
    'Rajasthan Desert Circuit',
    'Kerala Backwaters Corridor',
    'Northeast & Tawang Route',
  ];

  final List<int> _kmOptions = [80, 100, 150, 250, 0]; // 0 represents Unlimited

  @override
  void initState() {
    super.initState();
    _provider = context.read<HostOnboardingProvider>();
    final details = _provider.rvDetails;

    _mobilityMode = _provider.rvRentalMode.isNotEmpty ? _provider.rvRentalMode : _mobilityMode;

    if (details['dailyKmIncluded'] != null) {
      _dailyKm = int.tryParse(details['dailyKmIncluded'].toString()) ?? _dailyKm;
    }
    if (details['extraKmRate'] != null) {
      _extraKmRateController.text = details['extraKmRate'].toString();
    }
    if (_provider.pricePerNight > 0) {
      _baseDailyRateController.text = _provider.pricePerNight.toInt().toString();
    } else if (details['baseDailyRate'] != null) {
      _baseDailyRateController.text = details['baseDailyRate'].toString();
    }

    _weeklyDiscountController = TextEditingController(
      text: _provider.weeklyDiscountPercent != null
          ? _provider.weeklyDiscountPercent!.toInt().toString()
          : (details['weeklyDiscount']?.toString() ?? '10'),
    );
    _monthlyDiscountController = TextEditingController(
      text: _provider.monthlyDiscountPercent != null
          ? _provider.monthlyDiscountPercent!.toInt().toString()
          : (details['monthlyDiscount']?.toString() ?? '20'),
    );

    if (details['permittedCorridors'] is List && (details['permittedCorridors'] as List).isNotEmpty) {
      _permittedCorridors = List<String>.from(details['permittedCorridors']);
    }

    _extraKmRateController.addListener(_sync);
    _baseDailyRateController.addListener(_sync);
    _weeklyDiscountController.addListener(_sync);
    _monthlyDiscountController.addListener(_sync);

    // Initial sync
    _sync();
  }

  void _sync() {
    if (!mounted) return;
    final rate = double.tryParse(_baseDailyRateController.text.trim()) ?? 0.0;
    final extraRate = double.tryParse(_extraKmRateController.text.trim()) ?? 15.0;
    final weeklyDisc = double.tryParse(_weeklyDiscountController.text.trim()) ?? 0.0;
    final monthlyDisc = double.tryParse(_monthlyDiscountController.text.trim()) ?? 0.0;

    _provider.rvRentalMode = _mobilityMode;
    if (rate > 0) _provider.pricePerNight = rate;
    _provider.weeklyDiscountPercent = weeklyDisc > 0 ? weeklyDisc : null;
    _provider.monthlyDiscountPercent = monthlyDisc > 0 ? monthlyDisc : null;

    _provider.rvDetails = {
      ..._provider.rvDetails,
      'mobilityMode': _mobilityMode,
      'dailyKmIncluded': _dailyKm,
      'extraKmRate': extraRate,
      'baseDailyRate': rate,
      'weeklyDiscount': weeklyDisc,
      'monthlyDiscount': monthlyDisc,
      'permittedCorridors': _permittedCorridors,
    };
    _provider.notifyListeners();
  }

  @override
  void dispose() {
    _extraKmRateController.dispose();
    _baseDailyRateController.dispose();
    _customCorridorController.dispose();
    _weeklyDiscountController.dispose();
    _monthlyDiscountController.dispose();
    super.dispose();
  }

  void _showAddCorridorDialog(bool isDark) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E1C2A) : Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Add Permitted Route / Corridor', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
        content: TextField(
          controller: _customCorridorController,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'e.g. Bangalore - Ooty - Wayanad',
            hintStyle: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              final text = _customCorridorController.text.trim();
              if (text.isNotEmpty && !_permittedCorridors.contains(text)) {
                setState(() => _permittedCorridors.add(text));
                _customCorridorController.clear();
                _sync();
              }
              Navigator.pop(ctx);
            },
            child: const Text('Add Route', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
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
              'RV SETUP • PAGE 3 OF 4',
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
            'Mobility Mode & Rental Tariffs',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn(delay: 50.ms).slideX(),
          const SizedBox(height: 6),
          const Text(
            'Choose how guests can experience your rig: Self-drive, Chauffeur, or Static stay.',
            style: TextStyle(fontSize: 13.5, color: AppColors.textSecondary, height: 1.4),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 24),

          // 1. Mobility Mode Selector
          const Text(
            'Mobility & Rental Mode *',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 10),
          _buildMobilityOption(
            title: 'Self-Drive Campervan',
            subtitle: 'Guest drives the rig themselves after license verification',
            value: 'SELF_DRIVE',
            icon: Icons.directions_car_filled_rounded,
            isDark: isDark,
          ),
          _buildMobilityOption(
            title: 'Chauffeur / Pilot Driven',
            subtitle: 'Experienced professional driver provided by host for the entire road trip',
            value: 'CHAUFFEUR',
            icon: Icons.badge_rounded,
            isDark: isDark,
          ),
          _buildMobilityOption(
            title: 'Stationary / Parked Rig Stay',
            subtitle: 'Rig remains parked at a scenic private campsite or estate (glamping stay)',
            value: 'STATIONARY',
            icon: Icons.park_rounded,
            isDark: isDark,
          ),
          const SizedBox(height: 24),

          // If not stationary, show km packages
          if (_mobilityMode != 'STATIONARY') ...[
            const Text(
              'Daily Included Kilometers *',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 4),
            const Text(
              'Distance included in daily base rate per 24 hours of booking',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _kmOptions.map((km) {
                final isSel = _dailyKm == km;
                final label = km == 0 ? 'Unlimited Km' : '$km km / day';
                return ChoiceChip(
                  label: Text(
                    label,
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
                      setState(() => _dailyKm = km);
                      _sync();
                    }
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 20),

            // Extra Km Rate
            if (_dailyKm > 0) ...[
              const Text(
                'Extra Distance Rate (₹/km) *',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 8),
              _buildPriceInput(
                controller: _extraKmRateController,
                prefix: '₹',
                suffix: '/ km',
                hint: 'e.g. 18',
                isDark: isDark,
              ),
              const SizedBox(height: 20),
            ],

            // Permitted Corridors
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Permitted Overland Corridors',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Highways & circuits authorized for this rig',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
                TextButton.icon(
                  onPressed: () => _showAddCorridorDialog(isDark),
                  icon: const Icon(Icons.add_circle_outline_rounded, size: 16, color: AppColors.primary),
                  label: const Text('Add Custom', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: AppColors.primary)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _popularCorridors.map((corridor) {
                final isSel = _permittedCorridors.contains(corridor);
                return FilterChip(
                  label: Text(
                    corridor,
                    style: TextStyle(
                      color: isSel ? Colors.white : AppColors.textPrimary,
                      fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                  selected: isSel,
                  selectedColor: AppColors.primary,
                  backgroundColor: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  side: BorderSide(color: isSel ? AppColors.primary : AppColors.borderLight),
                  onSelected: (_) {
                    AppMotion.tapSelection();
                    setState(() {
                      if (isSel) {
                        _permittedCorridors.remove(corridor);
                      } else {
                        _permittedCorridors.add(corridor);
                      }
                    });
                    _sync();
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
          ],

          // Base Daily Rate
          const Text(
            'Base Daily Rental Rate (₹) *',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 4),
          const Text(
            'Rate charged per 24 hours of rig hire',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 10),
          _buildPriceInput(
            controller: _baseDailyRateController,
            prefix: '₹',
            suffix: '/ day',
            hint: 'e.g. 6500',
            isDark: isDark,
          ),
          const SizedBox(height: 24),

          // Extended Expedition Discounts
          Row(
            children: [
              const Icon(Icons.discount_outlined, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              const Text(
                'Extended Expedition Discounts (%)',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Incentivize long road trips and cross-country expeditions with automated discounts',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Weekly (7+ Days)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                    const SizedBox(height: 6),
                    _buildPriceInput(
                      controller: _weeklyDiscountController,
                      prefix: '%',
                      suffix: 'off',
                      hint: '10',
                      isDark: isDark,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Monthly (28+ Days)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                    const SizedBox(height: 6),
                    _buildPriceInput(
                      controller: _monthlyDiscountController,
                      prefix: '%',
                      suffix: 'off',
                      hint: '20',
                      isDark: isDark,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildMobilityOption({
    required String title,
    required String subtitle,
    required String value,
    required IconData icon,
    required bool isDark,
  }) {
    final isSel = _mobilityMode == value;
    return BouncingWidget(
      onTap: () {
        AppMotion.tapSelection();
        setState(() => _mobilityMode = value);
        _sync();
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSel ? AppColors.primary.withValues(alpha: 0.08) : (isDark ? const Color(0xFF1E1C2A) : Colors.white),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSel ? AppColors.primary : (isDark ? Colors.white12 : AppColors.borderLight),
            width: isSel ? 1.8 : 1.0,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isSel ? AppColors.primary : AppColors.primary.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: isSel ? Colors.white : AppColors.primary, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: isSel ? FontWeight.w900 : FontWeight.w700,
                      color: isSel ? AppColors.primary : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            Icon(
              isSel ? Icons.check_circle_rounded : Icons.radio_button_off_rounded,
              color: isSel ? AppColors.primary : Colors.grey,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceInput({
    required TextEditingController controller,
    required String prefix,
    required String suffix,
    required String hint,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
      ),
      child: Row(
        children: [
          Text(prefix, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.primary)),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: const TextStyle(fontSize: 16, color: AppColors.textSecondary),
                border: InputBorder.none,
              ),
            ),
          ),
          Text(suffix, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}

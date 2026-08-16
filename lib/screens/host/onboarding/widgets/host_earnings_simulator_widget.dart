import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';

class HostEarningsSimulatorWidget extends StatefulWidget {
  final Function(String city, String type, double monthlyEst)? onCalculated;

  const HostEarningsSimulatorWidget({Key? key, this.onCalculated}) : super(key: key);

  @override
  State<HostEarningsSimulatorWidget> createState() => _HostEarningsSimulatorWidgetState();
}

class _HostEarningsSimulatorWidgetState extends State<HostEarningsSimulatorWidget> {
  String _selectedCity = 'Goa';
  String _selectedType = 'Luxury Villa';
  double _occupancyNights = 18;

  final Map<String, int> _cityBaseRates = {
    'Goa': 14500,
    'Manali': 8500,
    'Udaipur': 16000,
    'Wayanad': 7800,
    'Bengaluru': 5500,
    'Coorg': 9200,
    'Rishikesh': 6800,
  };

  final Map<String, double> _typeMultipliers = {
    'Luxury Villa': 1.4,
    'Mountain Cabin': 1.15,
    'Treehouse': 1.25,
    'Luxury RV': 0.95,
    'Glamping Pod': 1.05,
    'Homestay': 0.75,
  };

  double get _nightlyRate {
    final base = _cityBaseRates[_selectedCity] ?? 8000;
    final mult = _typeMultipliers[_selectedType] ?? 1.0;
    return base * mult;
  }

  double get _monthlyEarnings {
    // 85% net earnings after standard platform fee / deductions
    return (_nightlyRate * _occupancyNights) * 0.85;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? [const Color(0xFF1E1E2E), const Color(0xFF151522)]
              : [const Color(0xFFF9F7FE), const Color(0xFFEDE9FE)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.3),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.1),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.auto_awesome_rounded, color: AppColors.primary, size: 16),
                    SizedBox(width: 6),
                    Text(
                      'REAL-TIME EARNINGS SIMULATOR',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  '⚡ 0% Brokerage',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF10B981),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Main Projected Number Dial
          Center(
            child: Column(
              children: [
                const Text(
                  'Estimated Monthly Potential',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 6),
                TweenAnimationBuilder<double>(
                  tween: Tween<double>(begin: 0, end: _monthlyEarnings),
                  duration: 400.ms,
                  builder: (context, val, _) {
                    final formatted = val.toInt().toString().replaceAllMapped(
                          RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
                          (Match m) => '${m[1]},',
                        );
                    return Text(
                      '₹$formatted',
                      style: TextStyle(
                        fontSize: 38,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : const Color(0xFF2E1065),
                        letterSpacing: -1,
                      ),
                    );
                  },
                ),
                Text(
                  'at ₹${_nightlyRate.toInt()} / night • ${_occupancyNights.toInt()} nights occupancy',
                  style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // City Selector Chips
          const Text(
            'Select Destination',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: _cityBaseRates.keys.map((city) {
                final isSelected = _selectedCity == city;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(city),
                    selected: isSelected,
                    onSelected: (selected) {
                      if (selected) {
                        AppMotion.tapSelection();
                        setState(() => _selectedCity = city);
                        widget.onCalculated?.call(_selectedCity, _selectedType, _monthlyEarnings);
                      }
                    },
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: isSelected ? Colors.white : AppColors.textSecondary,
                    ),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 18),

          // Property Type Selector Chips
          const Text(
            'Property Category',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: _typeMultipliers.keys.map((type) {
                final isSelected = _selectedType == type;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(type),
                    selected: isSelected,
                    onSelected: (selected) {
                      if (selected) {
                        AppMotion.tapSelection();
                        setState(() => _selectedType = type);
                        widget.onCalculated?.call(_selectedCity, _selectedType, _monthlyEarnings);
                      }
                    },
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: isSelected ? Colors.white : AppColors.textSecondary,
                    ),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 20),

          // Occupancy Slider
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Expected Occupancy / Month',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              Text(
                '${_occupancyNights.toInt()} nights',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          Slider(
            value: _occupancyNights,
            min: 5,
            max: 28,
            divisions: 23,
            activeColor: AppColors.primary,
            inactiveColor: AppColors.primary.withValues(alpha: 0.15),
            onChanged: (val) {
              AppMotion.tapLight();
              setState(() => _occupancyNights = val);
              widget.onCalculated?.call(_selectedCity, _selectedType, _monthlyEarnings);
            },
          ),

          // Pro-tip Callout
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.stars_rounded, color: AppColors.primary, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '$_selectedType listings in $_selectedCity average 82% weekend occupancy with Stay Q instant book.',
                    style: const TextStyle(fontSize: 11, height: 1.4, color: AppColors.textPrimary),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

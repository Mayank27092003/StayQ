import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';

class RoomSetupAndPricingScreen extends StatefulWidget {
  const RoomSetupAndPricingScreen({Key? key}) : super(key: key);

  @override
  State<RoomSetupAndPricingScreen> createState() => _RoomSetupAndPricingScreenState();
}

class _RoomSetupAndPricingScreenState extends State<RoomSetupAndPricingScreen> {
  late TextEditingController _priceController;
  late TextEditingController _weekendPriceController;
  late TextEditingController _weeklyDiscountController;
  late TextEditingController _monthlyDiscountController;
  late TextEditingController _roomsController;
  late TextEditingController _bedsController;

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    _priceController = TextEditingController(text: provider.pricePerNight > 0 ? provider.pricePerNight.toInt().toString() : '9500');
    _weekendPriceController = TextEditingController(text: provider.weekendPrice?.toInt().toString() ?? '');
    _weeklyDiscountController = TextEditingController(text: provider.weeklyDiscountPercent?.toInt().toString() ?? '10');
    _monthlyDiscountController = TextEditingController(text: provider.monthlyDiscountPercent?.toInt().toString() ?? '20');
    _roomsController = TextEditingController(text: provider.numberOfRooms.toString());
    _bedsController = TextEditingController(text: provider.bedsPerRoom.toString());

    _priceController.addListener(_updateProvider);
    _weekendPriceController.addListener(_updateProvider);
    _weeklyDiscountController.addListener(_updateProvider);
    _monthlyDiscountController.addListener(_updateProvider);
    _roomsController.addListener(_updateProvider);
    _bedsController.addListener(_updateProvider);
  }

  void _updateProvider() {
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    if (double.tryParse(_priceController.text) != null) provider.pricePerNight = double.parse(_priceController.text);
    provider.weekendPrice = double.tryParse(_weekendPriceController.text);
    provider.weeklyDiscountPercent = double.tryParse(_weeklyDiscountController.text);
    provider.monthlyDiscountPercent = double.tryParse(_monthlyDiscountController.text);
    if (int.tryParse(_roomsController.text) != null) provider.numberOfRooms = int.parse(_roomsController.text);
    if (int.tryParse(_bedsController.text) != null) provider.bedsPerRoom = int.parse(_bedsController.text);
  }

  void _adjustPrice(int delta) {
    AppMotion.tapSelection();
    final current = int.tryParse(_priceController.text) ?? 8000;
    final updated = (current + delta).clamp(500, 500000);
    _priceController.text = updated.toString();
  }

  @override
  void dispose() {
    _priceController.dispose();
    _weekendPriceController.dispose();
    _weeklyDiscountController.dispose();
    _monthlyDiscountController.dispose();
    _roomsController.dispose();
    _bedsController.dispose();
    super.dispose();
  }

  Widget _buildField(String label, TextEditingController controller, {String hint = '0', String prefix = ''}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
          ),
          child: Row(
            children: [
              if (prefix.isNotEmpty) Text(prefix, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary)),
              if (prefix.isNotEmpty) const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: controller,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    isDense: true,
                    hintText: hint,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<HostOnboardingProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currentPrice = double.tryParse(_priceController.text) ?? 9500;
    final monthlyPotential = (currentPrice * 18 * 0.85).toInt();

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Smart Pricing',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 6),
          const Text(
            'Set your base nightly rate. You can change this anytime.',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 28),

          // Big Interactive Price Dial Card
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                      ? [const Color(0xFF261842), const Color(0xFF191428)]
                      : [const Color(0xFFFAF5FF), Colors.white],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
                borderRadius: BorderRadius.circular(28),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                children: [
                  const Text(
                    'BASE RATE PER NIGHT',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.primary, letterSpacing: 0.8),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        '₹',
                        style: TextStyle(fontSize: 42, fontWeight: FontWeight.w900, color: AppColors.primary),
                      ),
                      const SizedBox(width: 6),
                      IntrinsicWidth(
                        child: TextField(
                          controller: _priceController,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(fontSize: 44, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                          decoration: const InputDecoration(
                            border: InputBorder.none,
                            isDense: true,
                            hintText: '0',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Quick Increment Chips
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildQuickAdjustChip('- ₹500', () => _adjustPrice(-500)),
                      const SizedBox(width: 8),
                      _buildQuickAdjustChip('+ ₹500', () => _adjustPrice(500)),
                      const SizedBox(width: 8),
                      _buildQuickAdjustChip('+ ₹2,000', () => _adjustPrice(2000)),
                    ],
                  ),

                  const SizedBox(height: 18),
                  const Divider(color: Colors.black12),
                  const SizedBox(height: 8),

                  // Monthly Projection Mini-Badge
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.trending_up_rounded, color: Color(0xFF10B981), size: 18),
                      const SizedBox(width: 6),
                      Text(
                        'Est. ₹$monthlyPotential / mo (18 nights)',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF10B981)),
                      ),
                    ],
                  ),
                ],
              ),
            ).animate().scale(duration: 350.ms, curve: Curves.easeOutBack),
          ),

          const SizedBox(height: 28),

          // Weekend & Room Capacity Fields
          Row(
            children: [
              Expanded(child: _buildField('Rooms / Units', _roomsController, hint: '1')),
              const SizedBox(width: 14),
              Expanded(child: _buildField('Beds / Unit', _bedsController, hint: '1')),
            ],
          ).animate().fadeIn(delay: 200.ms),

          const SizedBox(height: 20),

          _buildField('Weekend Surge Price (Fri-Sun)', _weekendPriceController, hint: 'e.g. ${(currentPrice * 1.25).toInt()}', prefix: '₹')
              .animate()
              .fadeIn(delay: 250.ms),

          const SizedBox(height: 20),

          Row(
            children: [
              Expanded(child: _buildField('Weekly Discount', _weeklyDiscountController, hint: '10', prefix: '%')),
              const SizedBox(width: 14),
              Expanded(child: _buildField('Monthly Discount', _monthlyDiscountController, hint: '20', prefix: '%')),
            ],
          ).animate().fadeIn(delay: 300.ms),

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildQuickAdjustChip(String label, VoidCallback onTap) {
    return BouncingWidget(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
        ),
      ),
    );
  }
}

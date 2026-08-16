import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';
import '../widgets/location_search_bottom_sheet.dart';

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

  final List<Map<String, String>> _availableBedTypes = const [
    {'title': 'King Size Bed', 'icon': '👑', 'subtitle': '72" × 78" Master suite'},
    {'title': 'Queen Bed', 'icon': '🛏️', 'subtitle': '60" × 78" Standard double'},
    {'title': 'Double / Twin Beds', 'icon': '🛌', 'subtitle': 'Two separate single beds'},
    {'title': 'Single Bed', 'icon': '🛋️', 'subtitle': '36" × 75" Individual sleeper'},
    {'title': 'Bunk Beds', 'icon': '🪜', 'subtitle': 'Tiered multi-level bunks'},
    {'title': 'Sofa Cum Bed', 'icon': '🛋️', 'subtitle': 'Pull-out convertible sofa'},
    {'title': 'Floor Mattress', 'icon': '⛺', 'subtitle': 'Extra rollaway bedding'},
  ];

  final List<String> _hotelPresetCategoryNames = const [
    'Deluxe King Room',
    'Executive Suite',
    'Standard Twin Room',
    'Presidential Suite',
    'Family Suite',
    'Ocean / Pool View Suite',
    'Dormitory (6-Bed)',
  ];

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);

    // If multi-inventory property and categories are empty, initialize default hotel setup
    if (provider.isMultiInventoryProperty && provider.roomCategories.isEmpty) {
      provider.roomCategories = [
        RoomCategoryConfig(
          id: 'cat_${DateTime.now().millisecondsSinceEpoch}_1',
          categoryName: 'Deluxe King Room',
          quantity: 20,
          bedType: 'King Size Bed',
          bedCount: 1,
          maxGuests: 2,
          pricePerNight: 3500.0,
          hasAttachedBathroom: true,
          hasAc: true,
          hasTv: true,
          hasBalcony: true,
          hasBreakfast: true,
        ),
        RoomCategoryConfig(
          id: 'cat_${DateTime.now().millisecondsSinceEpoch}_2',
          categoryName: 'Executive Suite',
          quantity: 10,
          bedType: 'King Size Bed',
          bedCount: 1,
          maxGuests: 3,
          pricePerNight: 5500.0,
          hasAttachedBathroom: true,
          hasAc: true,
          hasTv: true,
          hasBalcony: true,
          hasBathtub: true,
          hasBreakfast: true,
        ),
      ];
      provider.saveDraftToPrefs();
    } else if (!provider.isMultiInventoryProperty && provider.roomCategories.isEmpty) {
      // Initialize villa bedrooms
      final count = provider.bedrooms > 0 ? provider.bedrooms : 2;
      provider.roomCategories = List.generate(
        count,
        (i) => RoomCategoryConfig(
          id: 'room_${DateTime.now().millisecondsSinceEpoch}_$i',
          categoryName: i == 0 ? 'Master Bedroom' : 'Bedroom ${i + 1}',
          quantity: 1,
          bedType: i == 0 ? 'King Size Bed' : 'Queen Bed',
          bedCount: 1,
          maxGuests: 2,
          pricePerNight: provider.pricePerNight,
          hasAttachedBathroom: true,
          hasAc: true,
          hasBalcony: i == 0,
        ),
      );
      provider.saveDraftToPrefs();
    }

    _priceController = TextEditingController(
      text: provider.pricePerNight > 0 ? provider.pricePerNight.toInt().toString() : '9500',
    );
    _weekendPriceController = TextEditingController(
      text: provider.weekendPrice?.toInt().toString() ?? '',
    );
    _weeklyDiscountController = TextEditingController(
      text: provider.weeklyDiscountPercent?.toInt().toString() ?? '10',
    );
    _monthlyDiscountController = TextEditingController(
      text: provider.monthlyDiscountPercent?.toInt().toString() ?? '20',
    );
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
    if (double.tryParse(_priceController.text) != null) {
      provider.pricePerNight = double.parse(_priceController.text);
    }
    provider.weekendPrice = double.tryParse(_weekendPriceController.text);
    provider.weeklyDiscountPercent = double.tryParse(_weeklyDiscountController.text);
    provider.monthlyDiscountPercent = double.tryParse(_monthlyDiscountController.text);
    if (int.tryParse(_roomsController.text) != null) {
      provider.numberOfRooms = int.parse(_roomsController.text);
    }
    if (int.tryParse(_bedsController.text) != null) {
      provider.bedsPerRoom = int.parse(_bedsController.text);
    }
  }

  void _adjustPrice(int delta) {
    AppMotion.tapSelection();
    final current = int.tryParse(_priceController.text) ?? 8000;
    final updated = (current + delta).clamp(500, 500000);
    _priceController.text = updated.toString();
  }

  void _openLocationSearchSheet() {
    AppMotion.tapSelection();
    LocationSearchBottomSheet.show(
      context,
      onLocationSelected: (result) {
        final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
        provider.updateLocation(
          result.title,
          result.city.isNotEmpty ? result.city : provider.city,
          result.state.isNotEmpty ? result.state : provider.state,
          result.lat != 0.0 ? result.lat : 28.6139,
          result.lng != 0.0 ? result.lng : 77.2090,
        );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('📍 Location updated to ${result.title}, ${result.city}'),
            backgroundColor: AppColors.primary,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      },
    );
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
              if (prefix.isNotEmpty)
                Text(prefix, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary)),
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
    final isHotel = provider.isMultiInventoryProperty;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isHotel ? 'Hotel Inventory & Room Rates' : 'Rooms & Pricing',
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 6),
          Text(
            isHotel
                ? 'Manage room categories (Deluxe, Suite, etc.), unit counts, and nightly pricing.'
                : 'Configure individual bedroom layouts ("Where you\'ll sleep") and full property rates.',
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 18),

          // Location Benchmark Quick-Pill Trigger
          BouncingWidget(
            onTap: _openLocationSearchSheet,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          provider.city.isNotEmpty ? '${provider.city}, ${provider.state}' : 'Location Not Set',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.primary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '${provider.propertyType.replaceAll('_', ' ')} pricing benchmark active',
                          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text(
                      'Edit Map',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          ).animate().fadeIn(duration: 350.ms),

          const SizedBox(height: 20),

          // ══════════════════════════════════════════════════════════════
          // MODE A: HOTEL & MULTI-INVENTORY INVENTORY BUILDER
          // ══════════════════════════════════════════════════════════════
          if (isHotel) ...[
            _buildHotelInventorySection(provider, isDark),
          ]
          // ══════════════════════════════════════════════════════════════
          // MODE B: VILLA / HOMESTAY / ENTIRE SPACE BEDROOM BUILDER
          // ══════════════════════════════════════════════════════════════
          else ...[
            _buildVillaSleepingLayoutSection(provider, isDark),
          ],

          const SizedBox(height: 28),

          // Global Discount Policies
          const Text(
            'Extended Stay Discounts',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 6),
          const Text(
            'Encourage longer guest bookings with automated weekly & monthly discounts:',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: _buildField('Weekly Discount (7+ nights)', _weeklyDiscountController, hint: '10', prefix: '%')),
              const SizedBox(width: 14),
              Expanded(child: _buildField('Monthly Discount (30+ nights)', _monthlyDiscountController, hint: '20', prefix: '%')),
            ],
          ).animate().fadeIn(delay: 250.ms),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // HOTEL / RESORT INVENTORY UI
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildHotelInventorySection(HostOnboardingProvider provider, bool isDark) {
    final totalInventory = provider.roomCategories.fold(0, (sum, r) => sum + r.quantity);
    final minPrice = provider.roomCategories.isEmpty
        ? 0
        : provider.roomCategories.map((r) => r.pricePerNight).reduce((a, b) => a < b ? a : b).toInt();
    final maxPrice = provider.roomCategories.isEmpty
        ? 0
        : provider.roomCategories.map((r) => r.pricePerNight).reduce((a, b) => a > b ? a : b).toInt();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Live Aggregate Inventory Banner
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: isDark
                  ? [const Color(0xFF261842), const Color(0xFF191428)]
                  : [const Color(0xFFFAF5FF), Colors.white],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.08),
                blurRadius: 15,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Icon(Icons.hotel_rounded, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$totalInventory Total Rooms Inventory',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${provider.roomCategories.length} Room Types • Rates ₹$minPrice ${minPrice != maxPrice ? "- ₹$maxPrice" : ""}/night',
                      style: const TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ).animate().scale(duration: 350.ms),

        const SizedBox(height: 22),

        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Room Categories & Rates',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
            ),
            Text(
              '${provider.roomCategories.length} categories',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // List of Room Category Cards
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: provider.roomCategories.length,
          separatorBuilder: (_, __) => const SizedBox(height: 16),
          itemBuilder: (context, index) {
            final category = provider.roomCategories[index];
            return _buildHotelRoomCategoryCard(provider, category, index, isDark);
          },
        ),

        const SizedBox(height: 16),

        // Add Room Category Button
        BouncingWidget(
          onTap: () {
            AppMotion.tapSelection();
            final newIndex = provider.roomCategories.length + 1;
            final defaultName = newIndex <= _hotelPresetCategoryNames.length
                ? _hotelPresetCategoryNames[newIndex - 1]
                : 'Room Type $newIndex';

            provider.addRoomCategory(
              RoomCategoryConfig(
                id: 'cat_${DateTime.now().millisecondsSinceEpoch}',
                categoryName: defaultName,
                quantity: 10,
                bedType: 'King Size Bed',
                bedCount: 1,
                maxGuests: 2,
                pricePerNight: 3500.0,
                hasAttachedBathroom: true,
                hasAc: true,
                hasTv: true,
                hasBalcony: false,
              ),
            );
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 14),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.primary, width: 1.5),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.add_circle_outline_rounded, color: AppColors.primary, size: 20),
                SizedBox(width: 8),
                Text(
                  'Add Another Room Category',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.primary),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHotelRoomCategoryCard(
    HostOnboardingProvider provider,
    RoomCategoryConfig category,
    int index,
    bool isDark,
  ) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Card Header: Category Name + Delete button
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '#${index + 1}',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: TextFormField(
                  initialValue: category.categoryName,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                  decoration: const InputDecoration(
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                    border: InputBorder.none,
                    hintText: 'Category Name (e.g. Deluxe Room)',
                  ),
                  onChanged: (val) {
                    category.categoryName = val;
                    provider.updateRoomCategory(index, category);
                  },
                ),
              ),
              if (provider.roomCategories.length > 1)
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 20),
                  onPressed: () => provider.removeRoomCategory(index),
                ),
            ],
          ),

          const Divider(height: 20),

          // Inventory & Price Row
          Row(
            children: [
              // Number of Units / Quantity Stepper
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Room Inventory', style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        _buildMiniStepperButton(Icons.remove, () {
                          if (category.quantity > 1) {
                            category.quantity--;
                            provider.updateRoomCategory(index, category);
                          }
                        }),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            '${category.quantity}',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                          ),
                        ),
                        _buildMiniStepperButton(Icons.add, () {
                          category.quantity++;
                          provider.updateRoomCategory(index, category);
                        }),
                      ],
                    ),
                  ],
                ),
              ),

              // Price Per Night for this Category
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Price / Night', style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.black26 : AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.borderLight),
                      ),
                      child: Row(
                        children: [
                          const Text('₹', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primary)),
                          const SizedBox(width: 6),
                          Expanded(
                            child: TextFormField(
                              initialValue: category.pricePerNight.toInt().toString(),
                              keyboardType: TextInputType.number,
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                              decoration: const InputDecoration(
                                isDense: true,
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.zero,
                              ),
                              onChanged: (val) {
                                final p = double.tryParse(val);
                                if (p != null) {
                                  category.pricePerNight = p;
                                  provider.updateRoomCategory(index, category);
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Bed Type Selection Chips
          const Text('Bed Setup:', style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _availableBedTypes.take(4).map((bed) {
              final isSelected = category.bedType == bed['title'];
              return GestureDetector(
                onTap: () {
                  category.bedType = bed['title']!;
                  provider.updateRoomCategory(index, category);
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary.withValues(alpha: 0.12) : (isDark ? Colors.black26 : AppColors.surfaceLight),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: isSelected ? AppColors.primary : AppColors.borderLight),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(bed['icon']!, style: const TextStyle(fontSize: 14)),
                      const SizedBox(width: 6),
                      Text(
                        bed['title']!,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                          color: isSelected ? AppColors.primary : AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 14),

          // Feature Toggles (Attached Bath, AC, Balcony, Breakfast)
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildFeatureToggleChip('🚿 Ensuite Bath', category.hasAttachedBathroom, (val) {
                category.hasAttachedBathroom = val;
                provider.updateRoomCategory(index, category);
              }),
              _buildFeatureToggleChip('❄️ AC', category.hasAc, (val) {
                category.hasAc = val;
                provider.updateRoomCategory(index, category);
              }),
              _buildFeatureToggleChip('🌅 Balcony', category.hasBalcony, (val) {
                category.hasBalcony = val;
                provider.updateRoomCategory(index, category);
              }),
              _buildFeatureToggleChip('☕ Breakfast', category.hasBreakfast, (val) {
                category.hasBreakfast = val;
                provider.updateRoomCategory(index, category);
              }),
            ],
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VILLA / HOMESTAY SLEEPING LAYOUT UI
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildVillaSleepingLayoutSection(HostOnboardingProvider provider, bool isDark) {
    final currentPrice = double.tryParse(_priceController.text) ?? 9500;
    final monthlyPotential = (currentPrice * 18 * 0.85).toInt();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Big Interactive Price Dial Card
        Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 26),
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
                  'ENTIRE PROPERTY RATE PER NIGHT',
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
                      'Est. ₹$monthlyPotential / mo (18 nights booked)',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF10B981)),
                    ),
                  ],
                ),
              ],
            ),
          ).animate().scale(duration: 350.ms, curve: Curves.easeOutBack),
        ),

        const SizedBox(height: 28),

        // Bedroom Layout Breakdown ("Where you'll sleep")
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Individual Bedroom Layouts',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
            ),
            Row(
              children: [
                _buildMiniStepperButton(Icons.remove, () {
                  if (provider.roomCategories.length > 1) {
                    provider.removeRoomCategory(provider.roomCategories.length - 1);
                  }
                }),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text(
                    '${provider.roomCategories.length} Bedrooms',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.primary),
                  ),
                ),
                _buildMiniStepperButton(Icons.add, () {
                  final newNum = provider.roomCategories.length + 1;
                  provider.addRoomCategory(
                    RoomCategoryConfig(
                      id: 'room_${DateTime.now().millisecondsSinceEpoch}',
                      categoryName: 'Bedroom $newNum',
                      quantity: 1,
                      bedType: 'Queen Bed',
                      bedCount: 1,
                      maxGuests: 2,
                      hasAttachedBathroom: true,
                      hasAc: true,
                    ),
                  );
                }),
              ],
            ),
          ],
        ),
        const SizedBox(height: 12),

        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: provider.roomCategories.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final room = provider.roomCategories[index];
            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.bed_rounded, color: AppColors.primary, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextFormField(
                          initialValue: room.categoryName,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding: EdgeInsets.zero,
                            border: InputBorder.none,
                            hintText: 'Bedroom Name (e.g. Master Suite)',
                          ),
                          onChanged: (val) {
                            room.categoryName = val;
                            provider.updateRoomCategory(index, room);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _availableBedTypes.take(4).map((bed) {
                      final isSelected = room.bedType == bed['title'];
                      return GestureDetector(
                        onTap: () {
                          room.bedType = bed['title']!;
                          provider.updateRoomCategory(index, room);
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.primary.withValues(alpha: 0.12) : (isDark ? Colors.black26 : Colors.white),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: isSelected ? AppColors.primary : AppColors.borderLight),
                          ),
                          child: Text(
                            '${bed['icon']} ${bed['title']}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                              color: isSelected ? AppColors.primary : AppColors.textPrimary,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _buildFeatureToggleChip('🚿 Attached Bath', room.hasAttachedBathroom, (val) {
                        room.hasAttachedBathroom = val;
                        provider.updateRoomCategory(index, room);
                      }),
                      const SizedBox(width: 8),
                      _buildFeatureToggleChip('❄️ AC', room.hasAc, (val) {
                        room.hasAc = val;
                        provider.updateRoomCategory(index, room);
                      }),
                      const SizedBox(width: 8),
                      _buildFeatureToggleChip('🌅 Balcony', room.hasBalcony, (val) {
                        room.hasBalcony = val;
                        provider.updateRoomCategory(index, room);
                      }),
                    ],
                  ),
                ],
              ),
            );
          },
        ),

        const SizedBox(height: 20),

        _buildField('Weekend Surge Price (Fri-Sun)', _weekendPriceController, hint: 'e.g. ${(currentPrice * 1.25).toInt()}', prefix: '₹')
            .animate()
            .fadeIn(delay: 200.ms),
      ],
    );
  }

  Widget _buildMiniStepperButton(IconData icon, VoidCallback onTap) {
    return BouncingWidget(
      onTap: () {
        AppMotion.tapSelection();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: AppColors.primary, size: 16),
      ),
    );
  }

  Widget _buildFeatureToggleChip(String label, bool isSelected, Function(bool) onToggle) {
    return GestureDetector(
      onTap: () {
        AppMotion.tapSelection();
        onToggle(!isSelected);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF10B981).withValues(alpha: 0.12) : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSelected ? const Color(0xFF10B981) : AppColors.borderLight),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected ? const Color(0xFF047857) : AppColors.textSecondary,
          ),
        ),
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

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../models/stay_model.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';
import '../../widgets/animated_calendar_picker.dart';
import 'booking_confirmation_screen.dart';

class CampingCheckoutScreen extends StatefulWidget {
  final StayModel stay;
  final DateTimeRange selectedDates;

  const CampingCheckoutScreen({
    Key? key,
    required this.stay,
    required this.selectedDates,
  }) : super(key: key);

  @override
  State<CampingCheckoutScreen> createState() => _CampingCheckoutScreenState();
}

class _CampingCheckoutScreenState extends State<CampingCheckoutScreen> {
  late DateTimeRange _selectedDates;
  bool _isCalendarVisible = false;
  int _campersCount = 1;
  int _selectedTentType = 0; // 0: Basic, 1: Dome, 2: Luxury, 3: Own
  final Set<int> _selectedAddOns = {};
  int _paymentMethod = 0; // 0: UPI, 1: Card
  bool _isExpandedBreakdown = false;

  final List<Map<String, dynamic>> _tentTypes = [
    {
      'title': '⛺ Basic Tent (2-person)',
      'price': 0,
      'subtitle': 'Included',
    },
    {
      'title': '🏕️ Dome Tent (4-person)',
      'price': 500,
      'subtitle': '₹500/night',
    },
    {
      'title': '✨ Luxury Glamping Tent',
      'price': 1500,
      'subtitle': '₹1,500/night',
    },
    {
      'title': '🎒 Bringing My Own Tent',
      'price': -200,
      'subtitle': '-₹200/night discount',
    },
  ];

  final List<Map<String, dynamic>> _addOns = [
    {
      'title': '🔥 Campfire Setup',
      'price': 300,
      'perPerson': false,
    },
    {
      'title': '🎒 Gear Rental Kit',
      'price': 500,
      'perPerson': false,
    },
    {
      'title': '🍳 Outdoor Cooking Setup',
      'price': 400,
      'perPerson': false,
    },
    {
      'title': '🌅 Guided Sunrise Trek',
      'price': 600,
      'perPerson': true,
    },
  ];

  @override
  void initState() {
    super.initState();
    _selectedDates = widget.selectedDates;
  }

  int get _nights {
    final diff = _selectedDates.end.difference(_selectedDates.start).inDays;
    return diff == 0 ? 1 : diff;
  }

  double get _campsiteTotal => widget.stay.pricePerNight * _nights;

  double get _tentTotal {
    final tentPrice = _tentTypes[_selectedTentType]['price'] as int;
    return tentPrice * _nights * 1.0;
  }

  double get _addOnsTotal {
    double total = 0;
    for (int i in _selectedAddOns) {
      final addon = _addOns[i];
      if (addon['perPerson'] == true) {
        total += (addon['price'] as int) * _campersCount;
      } else {
        total += addon['price'] as int;
      }
    }
    return total;
  }

  double get _subtotal => _campsiteTotal + _tentTotal + _addOnsTotal;

  double get _serviceFee => _subtotal * 0.05;

  double get _total => _subtotal + _serviceFee;

  void _confirmBooking() {
    AppMotion.tapHeavy();
    final provider = Provider.of<AppProvider>(context, listen: false);
    provider.addBooking(
      widget.stay,
      _selectedDates.start,
      _selectedDates.end,
      _campersCount,
    );

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => BookingConfirmationScreen(
          stay: widget.stay,
          totalAmount: (_subtotal + _serviceFee).toDouble(),
          selectedDates: _selectedDates,
          guests: _campersCount,
          paymentMethod: 'Credit Card',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Campsite Booking', style: TextStyle(color: AppColors.textPrimary)),
        backgroundColor: AppColors.surfaceLight,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppColors.textPrimary),
      ),
      body: Stack(
        children: [
          ListView(
            padding: const EdgeInsets.only(bottom: 120),
            children: [
              _buildSummaryCard().animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, curve: Curves.easeOutCubic),
              _buildTripDatesSection().animate().fadeIn(delay: 100.ms, duration: 400.ms).slideY(begin: 0.1, curve: Curves.easeOutCubic),
              _buildCampersCounter().animate().fadeIn(delay: 150.ms, duration: 400.ms).slideY(begin: 0.1, curve: Curves.easeOutCubic),
              _buildTentTypeSelector().animate().fadeIn(delay: 200.ms, duration: 400.ms).slideY(begin: 0.1, curve: Curves.easeOutCubic),
              _buildAddOnsSection().animate().fadeIn(delay: 250.ms, duration: 400.ms).slideY(begin: 0.1, curve: Curves.easeOutCubic),
              _buildPriceBreakdown().animate().fadeIn(delay: 300.ms, duration: 400.ms).slideY(begin: 0.1, curve: Curves.easeOutCubic),
              _buildPaymentMethods().animate().fadeIn(delay: 350.ms, duration: 400.ms).slideY(begin: 0.1, curve: Curves.easeOutCubic),
            ],
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _buildBottomBar().animate().slideY(begin: 1.0, curve: Curves.easeOutCubic, duration: 500.ms),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: widget.stay.imageUrls.isNotEmpty
                ? Image.network(
                    widget.stay.imageUrls.first,
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      width: 80,
                      height: 80,
                      color: Colors.grey.shade300,
                      child: const Icon(Icons.terrain, color: Colors.grey),
                    ),
                  )
                : Container(
                    width: 80,
                    height: 80,
                    color: Colors.grey.shade300,
                    child: const Icon(Icons.terrain, color: Colors.grey),
                  ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.stay.title,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  widget.stay.location,
                  style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.star, color: AppColors.starYellow, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      widget.stay.rating.toStringAsFixed(1),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTripDatesSection() {
    final dateFormat = DateFormat('MMM d');
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Trip Dates', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.calendar_month, color: AppColors.primary, size: 24),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${dateFormat.format(_selectedDates.start)} - ${dateFormat.format(_selectedDates.end)}',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                            ),
                            Text(
                              '$_nights night${_nights > 1 ? 's' : ''}',
                              style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ],
                    ),
                    TextButton(
                      onPressed: () {
                        AppMotion.tapSelection();
                        setState(() {
                          _isCalendarVisible = !_isCalendarVisible;
                        });
                      },
                      child: Text(_isCalendarVisible ? 'Done' : 'Change', style: const TextStyle(color: AppColors.primary)),
                    ),
                  ],
                ),
                if (_isCalendarVisible) ...[
                  const Divider(height: 24),
                  AnimatedCalendarPicker(
                    initialRange: _selectedDates,
                    onRangeSelected: (range) {
                      setState(() {
                        _selectedDates = range;
                      });
                    },
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCampersCounter() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Number of Campers', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.group, color: AppColors.textSecondary),
                    SizedBox(width: 12),
                    Text('Campers', style: TextStyle(fontSize: 16, color: AppColors.textPrimary)),
                  ],
                ),
                Row(
                  children: [
                    BouncingWidget(
                      onTap: () {
                        if (_campersCount > 1) {
                          AppMotion.tapLight();
                          setState(() => _campersCount--);
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _campersCount > 1 ? AppColors.surfaceLight : Colors.grey.shade200,
                          border: Border.all(color: _campersCount > 1 ? AppColors.primary : AppColors.borderLight),
                        ),
                        child: Icon(Icons.remove, size: 20, color: _campersCount > 1 ? AppColors.primary : AppColors.textMuted),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Text(
                      '$_campersCount',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const SizedBox(width: 16),
                    BouncingWidget(
                      onTap: () {
                        if (_campersCount < 10) {
                          AppMotion.tapLight();
                          setState(() => _campersCount++);
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _campersCount < 10 ? AppColors.surfaceLight : Colors.grey.shade200,
                          border: Border.all(color: _campersCount < 10 ? AppColors.primary : AppColors.borderLight),
                        ),
                        child: Icon(Icons.add, size: 20, color: _campersCount < 10 ? AppColors.primary : AppColors.textMuted),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTentTypeSelector() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Tent Type', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 12),
          Column(
            children: List.generate(_tentTypes.length, (index) {
              final tent = _tentTypes[index];
              final isSelected = _selectedTentType == index;
              return BouncingWidget(
                onTap: () {
                  AppMotion.tapSelection();
                  setState(() => _selectedTentType = index);
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary.withOpacity(0.05) : AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isSelected ? AppColors.primary : AppColors.borderLight, width: isSelected ? 2 : 1),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(tent['title'], style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                            const SizedBox(height: 4),
                            Text(tent['subtitle'], style: TextStyle(fontSize: 14, color: isSelected ? AppColors.primary : AppColors.textSecondary)),
                          ],
                        ),
                      ),
                      Icon(
                        isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                        color: isSelected ? AppColors.primary : AppColors.textSecondary,
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildAddOnsSection() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Add-ons', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 12),
          Column(
            children: List.generate(_addOns.length, (index) {
              final addon = _addOns[index];
              final isSelected = _selectedAddOns.contains(index);
              return BouncingWidget(
                onTap: () {
                  AppMotion.tapSelection();
                  setState(() {
                    if (isSelected) {
                      _selectedAddOns.remove(index);
                    } else {
                      _selectedAddOns.add(index);
                    }
                  });
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary.withOpacity(0.05) : AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isSelected ? AppColors.primary : AppColors.borderLight, width: isSelected ? 2 : 1),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(addon['title'], style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
                      ),
                      Row(
                        children: [
                          Text(
                            '₹${addon['price']}${addon['perPerson'] ? '/person' : ''}',
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          ),
                          const SizedBox(width: 12),
                          Icon(
                            isSelected ? Icons.check_box : Icons.check_box_outline_blank,
                            color: isSelected ? AppColors.primary : AppColors.textSecondary,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceBreakdown() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.borderLight),
        ),
        child: Column(
          children: [
            InkWell(
              onTap: () {
                AppMotion.tapLight();
                setState(() => _isExpandedBreakdown = !_isExpandedBreakdown);
              },
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Price Breakdown', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    Icon(_isExpandedBreakdown ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, color: AppColors.textSecondary),
                  ],
                ),
              ),
            ),
            if (_isExpandedBreakdown)
              Padding(
                padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
                child: Column(
                  children: [
                    const Divider(),
                    const SizedBox(height: 8),
                    _buildPriceRow('Campsite (₹${widget.stay.pricePerNight} × $_nights nights)', _campsiteTotal),
                    const SizedBox(height: 8),
                    _buildPriceRow('Tent Charges', _tentTotal),
                    const SizedBox(height: 8),
                    _buildPriceRow('Add-ons', _addOnsTotal),
                    const SizedBox(height: 8),
                    _buildPriceRow('Service Fee', _serviceFee),
                    const SizedBox(height: 12),
                    const Divider(),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                        Text('₹${_total.toStringAsFixed(2)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary)),
                      ],
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceRow(String label, double amount) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(child: Text(label, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary))),
        Text('₹${amount.toStringAsFixed(2)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
      ],
    );
  }

  Widget _buildPaymentMethods() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Payment Method', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildPaymentCard(
                  index: 0,
                  title: 'UPI / Google Pay',
                  icon: Icons.account_balance_wallet_rounded,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildPaymentCard(
                  index: 1,
                  title: 'Credit or Debit Card',
                  icon: Icons.credit_card_rounded,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentCard({required int index, required String title, required IconData icon}) {
    final isSelected = _paymentMethod == index;
    return BouncingWidget(
      onTap: () {
        AppMotion.tapSelection();
        setState(() => _paymentMethod = index);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withOpacity(0.05) : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? AppColors.primary : AppColors.borderLight, width: isSelected ? 2 : 1),
        ),
        child: Column(
          children: [
            Icon(icon, size: 32, color: isSelected ? AppColors.primary : AppColors.textSecondary),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                color: isSelected ? AppColors.primary : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, -4),
            blurRadius: 16,
          ),
        ],
      ),
      child: SafeArea(
        child: BouncingWidget(
          onTap: _confirmBooking,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppColors.primary, Color(0xFF9C27B0)],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: Text(
                'Confirm Camping — ₹${_total.toStringAsFixed(0)}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

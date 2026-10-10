import '../../services/booking_checkout.dart';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../models/stay_model.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';
import '../../widgets/animated_calendar_picker.dart';
import '../../widgets/cashfree_payment_sheet.dart';
import 'booking_confirmation_screen.dart';
import 'checkout_screen.dart';

class RVCheckoutScreen extends StatefulWidget {
  final StayModel stay;
  final DateTimeRange selectedDates;
  final List<DateTime>? blockedDates;

  const RVCheckoutScreen({
    Key? key,
    required this.stay,
    required this.selectedDates,
    this.blockedDates,
  }) : super(key: key);

  @override
  State<RVCheckoutScreen> createState() => _RVCheckoutScreenState();
}

class _RVCheckoutScreenState extends State<RVCheckoutScreen> {
  final _checkout = BookingCheckout();

  late DateTimeRange _currentDates;
  bool _isEditingDates = false;
  
  final TextEditingController _pickupController = TextEditingController();
  final TextEditingController _dropController = TextEditingController();

  int _mileageOption = 0; // 0: 100km, 1: 200km, 2: Unlimited
  bool _addDriver = false;
  int _insuranceOption = 0; // 0: Basic, 1: Premium
  int _paymentMethod = 0; // 0: UPI, 1: Card
  
  bool _isPriceExpanded = true;

  @override
  void initState() {
    super.initState();
    _currentDates = widget.selectedDates;
    _pickupController.text = widget.stay.location;
    _dropController.text = widget.stay.location;
  }
  
  @override
  void dispose() {
    _pickupController.dispose();
    _dropController.dispose();
    super.dispose();
  }

  int get _days {
    final int calculatedDays = _currentDates.duration.inDays;
    return calculatedDays > 0 ? calculatedDays : 1;
  }

  int get _baseRent => (widget.stay.pricePerNight * _days).round();
  
  int get _mileageCost {
    if (_mileageOption == 1) return 500 * _days;
    if (_mileageOption == 2) return 1000 * _days;
    return 0;
  }
  
  int get _driverCost => _addDriver ? 800 * _days : 0;
  
  int get _insuranceCost => _insuranceOption == 1 ? 300 * _days : 0;
  
  int get _subtotal => _baseRent + _mileageCost + _driverCost + _insuranceCost;
  
  int get _serviceFee => (_subtotal * 0.05).round();
  
  int get _total => _subtotal + _serviceFee;

  final _currencyFormat = NumberFormat.currency(symbol: '₹', decimalDigits: 0, locale: 'en_IN');

  @override
  Widget build(BuildContext context) {
    return CheckoutScreen(
      stay: widget.stay,
      selectedDates: widget.selectedDates,
      blockedDates: widget.blockedDates,
    );
  }
  
  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: AppColors.textPrimary,
      ),
    );
  }

  Widget _buildRVSummaryCard() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: AppColors.borderLight),
      ),
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SizedBox(
              width: 100,
              height: 100,
              child: widget.stay.imageUrls.isNotEmpty
                  ? Image.network(
                      widget.stay.firstImage,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        color: AppColors.surfaceLight,
                        child: const Icon(Icons.airport_shuttle_rounded, color: AppColors.primary),
                      ),
                    )
                  : Container(
                      color: AppColors.surfaceLight,
                      child: const Icon(Icons.airport_shuttle_rounded, color: AppColors.primary),
                    ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    widget.stay.category,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.stay.title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, color: AppColors.starYellow, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      widget.stay.rating.toString(),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      ' (${widget.stay.reviewCount} reviews)',
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
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

  Widget _buildTripDurationSection() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.calendar_month_rounded, color: AppColors.primary, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${DateFormat('MMM d').format(_currentDates.start)} - ${DateFormat('MMM d, yyyy').format(_currentDates.end)}',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$_days day${_days > 1 ? 's' : ''}',
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () {
                    AppMotion.tapLight();
                    setState(() {
                      _isEditingDates = !_isEditingDates;
                    });
                  },
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    textStyle: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  child: Text(_isEditingDates ? 'Done' : 'Change'),
                ),
              ],
            ),
          ),
          if (_isEditingDates)
            Padding(
              padding: const EdgeInsets.only(bottom: 16, left: 16, right: 16),
              child: AnimatedCalendarPicker(blockedDates: widget.blockedDates ?? widget.stay.blockedDates, 
                initialRange: _currentDates,
                onRangeSelected: (dates) {
                  setState(() {
                    _currentDates = dates;
                  });
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLocationFields() {
    return Column(
      children: [
        _buildTextField('Pickup Location', Icons.location_on_rounded, _pickupController),
        const SizedBox(height: 12),
        _buildTextField('Drop-off Location', Icons.flag_rounded, _dropController),
      ],
    );
  }

  Widget _buildTextField(String label, IconData icon, TextEditingController controller) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          icon: Icon(icon, color: AppColors.textSecondary, size: 20),
          labelText: label,
          labelStyle: const TextStyle(color: AppColors.textMuted),
          border: InputBorder.none,
          focusedBorder: InputBorder.none,
          enabledBorder: InputBorder.none,
        ),
        style: const TextStyle(
          color: AppColors.textPrimary,
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildMileageSelector() {
    return Column(
      children: [
        _buildRadioCard(
          title: '100 km/day',
          subtitle: 'Included in base price',
          value: 0,
          groupValue: _mileageOption,
          onChanged: (val) {
            AppMotion.tapSelection();
            setState(() => _mileageOption = val!);
          },
        ),
        const SizedBox(height: 12),
        _buildRadioCard(
          title: '200 km/day',
          subtitle: '+₹500/day extra',
          value: 1,
          groupValue: _mileageOption,
          onChanged: (val) {
            AppMotion.tapSelection();
            setState(() => _mileageOption = val!);
          },
        ),
        const SizedBox(height: 12),
        _buildRadioCard(
          title: 'Unlimited Mileage',
          subtitle: '+₹1,000/day extra',
          value: 2,
          groupValue: _mileageOption,
          onChanged: (val) {
            AppMotion.tapSelection();
            setState(() => _mileageOption = val!);
          },
        ),
      ],
    );
  }

  Widget _buildDriverToggle() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: SwitchListTile(
        activeColor: AppColors.primary,
        title: const Text(
          'Add Professional Driver',
          style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.textPrimary),
        ),
        subtitle: const Text(
          '+₹800/day',
          style: TextStyle(color: AppColors.textSecondary),
        ),
        value: _addDriver,
        secondary: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.person_rounded, color: AppColors.primary),
        ),
        onChanged: (val) {
          AppMotion.tapSelection();
          setState(() => _addDriver = val);
        },
      ),
    );
  }

  Widget _buildInsuranceSelector() {
    return Column(
      children: [
        _buildRadioCard(
          title: 'Basic Insurance',
          subtitle: 'Standard coverage included',
          value: 0,
          groupValue: _insuranceOption,
          onChanged: (val) {
            AppMotion.tapSelection();
            setState(() => _insuranceOption = val!);
          },
        ),
        const SizedBox(height: 12),
        _buildRadioCard(
          title: 'Premium Insurance',
          subtitle: 'Full coverage — +₹300/day',
          value: 1,
          groupValue: _insuranceOption,
          onChanged: (val) {
            AppMotion.tapSelection();
            setState(() => _insuranceOption = val!);
          },
        ),
      ],
    );
  }

  Widget _buildPaymentMethods() {
    return Column(
      children: [
        _buildRadioCard(
          title: 'UPI / Google Pay',
          icon: Icons.account_balance_wallet_rounded,
          value: 0,
          groupValue: _paymentMethod,
          onChanged: (val) {
            AppMotion.tapSelection();
            setState(() => _paymentMethod = val!);
          },
        ),
        const SizedBox(height: 12),
        _buildRadioCard(
          title: 'Credit or Debit Card',
          icon: Icons.credit_card_rounded,
          value: 1,
          groupValue: _paymentMethod,
          onChanged: (val) {
            AppMotion.tapSelection();
            setState(() => _paymentMethod = val!);
          },
        ),
      ],
    );
  }

  Widget _buildRadioCard({
    required String title,
    String? subtitle,
    IconData? icon,
    required int value,
    required int groupValue,
    required ValueChanged<int?> onChanged,
  }) {
    final bool isSelected = value == groupValue;
    
    return BouncingWidget(
      onTap: () => onChanged(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withOpacity(0.05) : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.borderLight,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            if (icon != null) ...[
              Icon(icon, color: isSelected ? AppColors.primary : AppColors.textSecondary),
              const SizedBox(width: 12),
            ],
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 13,
                        color: isSelected ? AppColors.primary.withOpacity(0.8) : AppColors.textSecondary,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? AppColors.primary : AppColors.borderLight,
                  width: 2,
                ),
                color: isSelected ? AppColors.primary : Colors.transparent,
              ),
              child: isSelected 
                  ? const Icon(Icons.check, size: 14, color: Colors.white) 
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceBreakdownAccordion() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        children: [
          BouncingWidget(
            onTap: () {
              AppMotion.tapLight();
              setState(() => _isPriceExpanded = !_isPriceExpanded);
            },
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Price Breakdown',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Icon(
                    _isPriceExpanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                    color: AppColors.textSecondary,
                  ),
                ],
              ),
            ),
          ),
          if (_isPriceExpanded)
            Padding(
              padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
              child: Column(
                children: [
                  const Divider(color: AppColors.borderLight, height: 1),
                  const SizedBox(height: 16),
                  _buildPriceRow('Base rent (${_currencyFormat.format(widget.stay.pricePerNight)} × $_days days)', _baseRent),
                  if (_mileageCost > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: _buildPriceRow('Mileage addon', _mileageCost),
                    ),
                  if (_driverCost > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: _buildPriceRow('Professional driver', _driverCost),
                    ),
                  if (_insuranceCost > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: _buildPriceRow('Premium insurance', _insuranceCost),
                    ),
                  const SizedBox(height: 8),
                  _buildPriceRow('Fee', _serviceFee),
                  const SizedBox(height: 12),
                  const Divider(color: AppColors.borderLight, height: 1),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Text(
                        _currencyFormat.format(_total),
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: AppColors.primary,
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

  Widget _buildPriceRow(String label, int amount) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
            ),
          ),
        ),
        Text(
          _currencyFormat.format(amount),
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 14,
        bottom: MediaQuery.of(context).padding.bottom + 14,
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceLight,
        border: const Border(top: BorderSide(color: AppColors.borderLight)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            offset: const Offset(0, -4),
            blurRadius: 12,
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: BouncingWidget(
          onTap: () async {
            if (_checkout.busy) return;
            final provider = context.read<AppProvider>();
            final guests = provider.adultsCount + provider.childrenCount;
            final booking = await _checkout.run(context, provider, widget.stay, _currentDates, guests,
              estimate: _total.toDouble(), blockedDates: widget.blockedDates ?? widget.stay.blockedDates, options: {'category': 'RV', 'children': provider.childrenCount,
                'infants': provider.infantsCount, 'pets': provider.petsCount,
                'pickupLocation': _pickupController.text.trim(), 'dropLocation': _dropController.text.trim(),
                'mileageOption': _mileageOption, 'addDriver': _addDriver, 'insuranceOption': _insuranceOption});
            if (booking == null || !mounted) return;
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => BookingConfirmationScreen(
              booking: booking, stay: booking.stay, totalAmount: booking.totalAmount,
              selectedDates: DateTimeRange(start: booking.checkIn, end: booking.checkOut),
              guests: booking.adults + booking.children, paymentMethod: _checkout.payment?.paymentMethod ?? 'Server confirmed')));
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: const Color(0xFF111111),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.12),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Center(
              child: Text(
                'Confirm RV Booking — ${_currencyFormat.format(_total)}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
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

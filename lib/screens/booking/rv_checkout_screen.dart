import '../../services/booking_checkout.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/stay_model.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';
import '../../widgets/animated_calendar_picker.dart';
import 'booking_confirmation_screen.dart';
import '../../navigation/app_router.dart';
import '../profile/kyc_verification_screen.dart';

class RVCheckoutScreen extends StatefulWidget {
  final StayModel stay;
  final DateTimeRange selectedDates;
  final List<DateTime>? blockedDates;

  const RVCheckoutScreen({
    super.key,
    required this.stay,
    required this.selectedDates,
    this.blockedDates,
  });

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
    return Scaffold(
      backgroundColor: AppColors.bg(context),
      appBar: AppBar(
        title: Text(
          'RV Rental Checkout',
          style: TextStyle(
            color: AppColors.text(context),
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        backgroundColor: AppColors.bg(context),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.chevron_left_rounded, size: 28, color: AppColors.text(context)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildRVSummaryCard(),
            const SizedBox(height: 24),
            _buildSectionTitle('Trip Duration'),
            const SizedBox(height: 12),
            _buildTripDurationSection(),
            const SizedBox(height: 24),
            _buildSectionTitle('Pickup & Drop-off'),
            const SizedBox(height: 12),
            _buildLocationFields(),
            const SizedBox(height: 24),
            _buildSectionTitle('Mileage Allowance'),
            const SizedBox(height: 12),
            _buildMileageSelector(),
            const SizedBox(height: 24),
            _buildSectionTitle('Trip Add-ons'),
            const SizedBox(height: 12),
            _buildDriverToggle(),
            const SizedBox(height: 24),
            _buildSectionTitle('Protection Plan'),
            const SizedBox(height: 12),
            _buildInsuranceSelector(),
            const SizedBox(height: 24),
            _buildSectionTitle('Payment Method'),
            const SizedBox(height: 12),
            _buildPaymentMethods(),
            const SizedBox(height: 24),
            _buildPriceBreakdownAccordion(),
            const SizedBox(height: 40),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }
  
  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: AppColors.text(context),
      ),
    );
  }

  Widget _buildRVSummaryCard() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card(context),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: AppColors.border(context)),
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
                        color: AppColors.card(context),
                        child: const Icon(Icons.airport_shuttle_rounded, color: AppColors.primary),
                      ),
                    )
                  : Container(
                      color: AppColors.card(context),
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
                    color: AppColors.primary.withValues(alpha: 0.1),
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
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text(context),
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
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.text(context),
                      ),
                    ),
                    Text(
                      ' (${widget.stay.reviewCount} reviews)',
                      style: TextStyle(
                        color: AppColors.textSub(context),
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
        color: AppColors.card(context),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border(context)),
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
                        color: AppColors.primary.withValues(alpha: 0.1),
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
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: AppColors.text(context),
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$_days day${_days > 1 ? 's' : ''}',
                          style: TextStyle(
                            color: AppColors.textSub(context),
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
              child: AnimatedCalendarPicker(
                blockedDates: widget.blockedDates ?? widget.stay.blockedDates, 
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
        color: AppColors.card(context),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border(context)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          icon: Icon(icon, color: AppColors.textSub(context), size: 20),
          labelText: label,
          labelStyle: TextStyle(color: AppColors.textSub(context)),
          border: InputBorder.none,
          focusedBorder: InputBorder.none,
          enabledBorder: InputBorder.none,
        ),
        style: TextStyle(
          color: AppColors.text(context),
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
        color: AppColors.card(context),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border(context)),
      ),
      child: SwitchListTile(
        activeTrackColor: AppColors.primary,
        title: Text(
          'Add Professional Driver',
          style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.text(context)),
        ),
        subtitle: Text(
          '+₹800/day',
          style: TextStyle(color: AppColors.textSub(context)),
        ),
        value: _addDriver,
        secondary: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
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
          color: isSelected ? AppColors.primary.withValues(alpha: 0.08) : AppColors.card(context),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border(context),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            if (icon != null) ...[
              Icon(icon, color: isSelected ? AppColors.primary : AppColors.textSub(context)),
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
                      color: isSelected ? AppColors.primary : AppColors.text(context),
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 13,
                        color: isSelected ? AppColors.primary.withValues(alpha: 0.8) : AppColors.textSub(context),
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
                  color: isSelected ? AppColors.primary : AppColors.border(context),
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
        color: AppColors.card(context),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border(context)),
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
                  Text(
                    'Price Breakdown',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: AppColors.text(context),
                    ),
                  ),
                  Icon(
                    _isPriceExpanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                    color: AppColors.textSub(context),
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
                  Divider(color: AppColors.border(context), height: 1),
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
                  _buildPriceRow('Platform service fee (5%)', _serviceFee),
                  const SizedBox(height: 12),
                  Divider(color: AppColors.border(context), height: 1),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: AppColors.text(context),
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
            style: TextStyle(
              color: AppColors.textSub(context),
              fontSize: 14,
            ),
          ),
        ),
        Text(
          _currencyFormat.format(amount),
          style: TextStyle(
            color: AppColors.text(context),
            fontWeight: FontWeight.w500,
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildBottomBar() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 14,
        bottom: MediaQuery.of(context).padding.bottom + 14,
      ),
      decoration: BoxDecoration(
        color: AppColors.card(context),
        border: Border(top: BorderSide(color: AppColors.border(context))),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
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
            if (!provider.isLoggedIn) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Please log in or sign up to continue booking.')),
              );
              Navigator.pushNamed(context, AppRoutes.login);
              return;
            }
            if (!provider.isAadhaarVerified) {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const KycVerificationScreen(initialTabIndex: 1)),
              );
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('UIDAI Aadhaar verification is mandatory before renting an RV.')),
              );
              return;
            }
            if (widget.stay.govtIdRequired && !provider.isGovIdVerified) {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const KycVerificationScreen(initialTabIndex: 1)),
              );
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('This host requires ID verification before booking.')),
              );
              return;
            }
            final guests = provider.adultsCount + provider.childrenCount;
            final booking = await _checkout.run(
              context,
              provider,
              widget.stay,
              _currentDates,
              guests,
              estimate: _total.toDouble(),
              blockedDates: widget.blockedDates ?? widget.stay.blockedDates,
              options: {
                'category': 'RV',
                'children': provider.childrenCount,
                'infants': provider.infantsCount,
                'pets': provider.petsCount,
                'pickupLocation': _pickupController.text.trim(),
                'dropLocation': _dropController.text.trim(),
                'mileageOption': _mileageOption,
                'addDriver': _addDriver,
                'insuranceOption': _insuranceOption,
              },
            );
            if (booking == null || !mounted || !context.mounted) return;
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (_) => BookingConfirmationScreen(
                  booking: booking,
                  stay: booking.stay,
                  totalAmount: booking.totalAmount,
                  selectedDates: DateTimeRange(start: booking.checkIn, end: booking.checkOut),
                  guests: booking.adults + booking.children,
                  paymentMethod: _checkout.payment?.paymentMethod ?? 'Server confirmed',
                ),
              ),
            );
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: isDark ? AppColors.primary : const Color(0xFF111111),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.12),
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

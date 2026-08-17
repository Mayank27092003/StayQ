import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/stay_model.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';
import '../../widgets/price_breakdown_accordion.dart';
import '../../widgets/animated_calendar_picker.dart';
import '../../widgets/cashfree_payment_sheet.dart';
import 'booking_confirmation_screen.dart';

class CheckoutScreen extends StatefulWidget {
  final StayModel stay;
  final DateTimeRange selectedDates;

  const CheckoutScreen({super.key, required this.stay, required this.selectedDates});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String _selectedPaymentMethod = 'Apple Pay';
  bool _showCalendar = false;
  late DateTimeRange _tripDates;

  @override
  void initState() {
    super.initState();
    _tripDates = widget.selectedDates;
  }

  String _getMonthName(int month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (month >= 1 && month <= 12) ? months[month - 1] : '';
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final stay = widget.stay;
    final int nights = _tripDates.end.difference(_tripDates.start).inDays;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.chevron_left_rounded, size: 28),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Confirm and pay',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primary.withValues(alpha: 0.2),
              backgroundImage: (provider.userAvatar.isNotEmpty && provider.userAvatar.startsWith('http'))
                  ? NetworkImage(provider.userAvatar)
                  : null,
              child: (provider.userAvatar.isEmpty || !provider.userAvatar.startsWith('http'))
                  ? Text(
                      provider.userName.isNotEmpty ? provider.userName[0].toUpperCase() : 'U',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                    )
                  : null,
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Property Summary Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: (stay.imageUrls.isNotEmpty && stay.imageUrls.first.startsWith('http'))
                              ? Image.network(
                                  stay.imageUrls.first,
                                  width: 84,
                                  height: 84,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(width: 84, height: 84, color: AppColors.surfaceLight),
                                )
                              : stay.imageUrls.isNotEmpty
                                  ? Image.asset(
                                      stay.imageUrls.first,
                                      width: 84,
                                      height: 84,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => Container(width: 84, height: 84, color: AppColors.surfaceLight),
                                    )
                                  : Container(width: 84, height: 84, color: AppColors.surfaceLight),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                stay.category,
                                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                stay.title,
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Icon(Icons.star_rounded, color: AppColors.primary, size: 14),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${stay.rating} (${stay.reviewCount} reviews)',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: stay.isStayingWithHost ? const Color(0xFFEFF6FF) : const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            stay.isStayingWithHost ? Icons.people_outline_rounded : Icons.vpn_key_outlined,
                            size: 16,
                            color: stay.isStayingWithHost ? const Color(0xFF2563EB) : const Color(0xFF059669),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              stay.isStayingWithHost 
                                  ? 'Staying with Host • Private bedroom on-site'
                                  : 'Entire Place • Exclusive private access',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: stay.isStayingWithHost ? const Color(0xFF1E40AF) : const Color(0xFF047857),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Interactive Price Accordion with Number Roll-Up Counter
              PriceBreakdownAccordion(
                nightRate: stay.pricePerNight,
                nights: nights > 0 ? nights : 1,
                cleaningFee: 0.0,
                serviceFee: 0.0,
                taxes: ((stay.pricePerNight * (nights > 0 ? nights : 1)) * 0.18).roundToDouble(),
              ),

              const SizedBox(height: 24),

              // Your Trip Section with Animated Calendar
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Your trip', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  TextButton(
                    onPressed: () {
                      AppMotion.tapSelection();
                      setState(() => _showCalendar = !_showCalendar);
                    },
                    child: Text(
                      _showCalendar ? 'Done' : 'Change Dates',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                  ),
                ],
              ),

              if (_showCalendar) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.borderLight),
                  ),
                  child: AnimatedCalendarPicker(
                    initialRange: _tripDates,
                    onRangeSelected: (range) {
                      setState(() => _tripDates = range);
                    },
                  ),
                ),
              ],

              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Dates', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(height: 2),
                      Text(
                        '${_tripDates.start.day} ${_getMonthName(_tripDates.start.month)} – ${_tripDates.end.day} ${_getMonthName(_tripDates.end.month)}',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text('Guests', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      const SizedBox(height: 2),
                      Text(
                        '${provider.adultsCount + provider.childrenCount} guests',
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Payment Methods
              const Text('Payment method', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 14),

              _PaymentOptionTile(
                title: 'UPI (Instant Pay)',
                subtitle: 'Google Pay, PhonePe, Paytm, BHIM, UPI ID',
                icon: Icons.qr_code_scanner_rounded,
                isSelected: _selectedPaymentMethod == 'UPI',
                onTap: () => setState(() => _selectedPaymentMethod = 'UPI'),
              ),
              const SizedBox(height: 10),
              _PaymentOptionTile(
                title: 'Credit or Debit Card',
                subtitle: 'Visa, Mastercard, RuPay',
                icon: Icons.credit_card_rounded,
                isSelected: _selectedPaymentMethod == 'Credit or Debit Card',
                onTap: () => setState(() => _selectedPaymentMethod = 'Credit or Debit Card'),
              ),
              const SizedBox(height: 10),
              _PaymentOptionTile(
                title: 'Netbanking',
                subtitle: 'HDFC, ICICI, SBI, Axis & all Indian banks',
                icon: Icons.account_balance_rounded,
                isSelected: _selectedPaymentMethod == 'Netbanking',
                onTap: () => setState(() => _selectedPaymentMethod = 'Netbanking'),
              ),
              const SizedBox(height: 10),
              _PaymentOptionTile(
                title: 'Apple Pay / Google Wallet',
                subtitle: 'One-tap biometric checkout',
                icon: Icons.apple_rounded,
                isSelected: _selectedPaymentMethod == 'Apple Pay',
                onTap: () => setState(() => _selectedPaymentMethod = 'Apple Pay'),
              ),

              const SizedBox(height: 24),

              // Cancellation Policy
              const Text('Cancellation policy', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              const Text(
                'Free cancellation up to 48 hours before check-in. Partial refund applies after.',
                style: TextStyle(fontSize: 13, height: 1.5, color: AppColors.textSecondary),
              ),

              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: () async {
                    AppMotion.tapHeavy();
                    final int finalNights = nights > 0 ? nights : 1;
                    final double subtotal = stay.pricePerNight * finalNights;
                    final double cleaning = 0.0;
                    final double service = 0.0;
                    final double taxes = (subtotal * 0.18).roundToDouble();
                    final double calculatedTotal = subtotal + cleaning + service + taxes;
                    final effectiveGuests = provider.adultsCount + provider.childrenCount;

                    final paymentResult = await CashfreePaymentSheet.show(
                      context,
                      bookingId: 'sq_book_${DateTime.now().millisecondsSinceEpoch}',
                      totalAmount: calculatedTotal,
                      propertyTitle: stay.title,
                      customerName: provider.userName.isNotEmpty ? provider.userName : 'Stay Q Guest',
                      customerEmail: provider.userEmail.isNotEmpty ? provider.userEmail : 'guest@stayq.space',
                      customerPhone: provider.userPhone.isNotEmpty ? provider.userPhone : '9876543210',
                    );

                    if (paymentResult != null && paymentResult.isSuccess && mounted) {
                      provider.addBooking(
                        stay,
                        _tripDates.start,
                        _tripDates.end,
                        effectiveGuests > 0 ? effectiveGuests : 2,
                      );
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(
                          builder: (_) => BookingConfirmationScreen(
                            stay: stay,
                            totalAmount: calculatedTotal,
                            selectedDates: _tripDates,
                            guests: effectiveGuests > 0 ? effectiveGuests : 2,
                            paymentMethod: paymentResult.paymentMethod,
                          ),
                        ),
                      );
                    }
                  },
                  child: const Text('Pay & Confirm Booking', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _PaymentOptionTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _PaymentOptionTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return BouncingWidget(
      onTap: () {
        AppMotion.tapSelection();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withValues(alpha: 0.04) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.borderLight,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.surfaceLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: AppColors.textPrimary, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ],
              ),
            ),
            Icon(
              isSelected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
              color: isSelected ? AppColors.primary : AppColors.textMuted,
            ),
          ],
        ),
      ),
    );
  }
}

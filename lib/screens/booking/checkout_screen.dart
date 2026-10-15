import '../../services/booking_checkout.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/stay_model.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/price_breakdown_accordion.dart';
import '../../widgets/animated_calendar_picker.dart';
import 'booking_confirmation_screen.dart';
import '../profile/kyc_verification_screen.dart';
import '../../navigation/app_router.dart';

class CheckoutScreen extends StatefulWidget {
  final StayModel stay;
  final DateTimeRange selectedDates;
  final List<DateTime>? blockedDates;

  const CheckoutScreen({super.key, required this.stay, required this.selectedDates, this.blockedDates});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _checkout = BookingCheckout();

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

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppColors.bg(context),
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
                  color: AppColors.card(context),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.border(context)),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: (stay.imageUrls.isNotEmpty && stay.firstImage.startsWith('http'))
                              ? Image.network(
                                  stay.firstImage,
                                  width: 84,
                                  height: 84,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, _, _) => Container(width: 84, height: 84, color: AppColors.card(context)),
                                )
                              : stay.imageUrls.isNotEmpty
                                  ? Image.asset(
                                      stay.firstImage,
                                      width: 84,
                                      height: 84,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, _, _) => Container(width: 84, height: 84, color: AppColors.card(context)),
                                    )
                                  : Container(width: 84, height: 84, color: AppColors.card(context)),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                stay.category,
                                style: TextStyle(fontSize: 12, color: AppColors.textSub(context)),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                stay.title,
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.text(context)),
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
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.text(context)),
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
                        color: stay.isStayingWithHost
                            ? (isDark ? const Color(0xFF1E3A8A).withValues(alpha: 0.3) : const Color(0xFFEFF6FF))
                            : (isDark ? const Color(0xFF064E3B).withValues(alpha: 0.3) : const Color(0xFFECFDF5)),
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
                                color: stay.isStayingWithHost
                                    ? (isDark ? const Color(0xFF93C5FD) : const Color(0xFF1E40AF))
                                    : (isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857)),
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

              // Referral Rewards Redemption Card (10% Checkout Cap)
              if (provider.referralBalance > 0)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(
                    'Referral balance: ₹${provider.referralBalance.toStringAsFixed(0)}. '
                    'Credit redemption is currently unavailable at checkout.',
                    style: TextStyle(color: AppColors.textSub(context), fontSize: 13),
                  ),
                ),

              // Interactive Price Accordion with Number Roll-Up Counter
              () {
                final int finalNights = nights > 0 ? nights : 1;
                final double subtotal = stay.pricePerNight * finalNights;
                final double cleaning = stay.cleaningFee;
                final double service = (subtotal * 0.10).roundToDouble();
                final double taxes = (service * 0.18).roundToDouble();
                const double discount = 0;
                return PriceBreakdownAccordion(
                  nightRate: stay.pricePerNight,
                  nights: finalNights,
                  cleaningFee: cleaning,
                  serviceFee: service,
                  taxes: taxes,
                  referralDiscount: discount,
                );
              }(),

              const SizedBox(height: 24),

              // Your Trip Section with Animated Calendar
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Your trip', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.text(context))),
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
                    color: AppColors.card(context),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.border(context)),
                  ),
                  child: AnimatedCalendarPicker(blockedDates: widget.blockedDates ?? widget.stay.blockedDates, 
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
                      Text('Dates', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.text(context))),
                      const SizedBox(height: 2),
                      Text(
                        '${_tripDates.start.day} ${_getMonthName(_tripDates.start.month)} – ${_tripDates.end.day} ${_getMonthName(_tripDates.end.month)}',
                        style: TextStyle(color: AppColors.textSub(context), fontSize: 13),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('Guests', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.text(context))),
                      const SizedBox(height: 2),
                      Text(
                        '${provider.adultsCount + provider.childrenCount} guests',
                        style: TextStyle(color: AppColors.textSub(context), fontSize: 13),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 24),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Payment Methods', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.text(context))),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.shield_rounded, size: 13, color: Color(0xFF059669)),
                        SizedBox(width: 4),
                        Text(
                          'RBI Licensed PG',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.card(context),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border(context)),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFF111111).withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(Icons.flash_on_rounded, color: AppColors.text(context), size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Instant UPI & QR Code',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.text(context)),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Google Pay, PhonePe, Paytm, CRED & BHIM',
                                style: TextStyle(color: AppColors.textSub(context), fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '0% Fee',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569)),
                          ),
                        ),
                      ],
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Divider(height: 1, color: AppColors.border(context)),
                    ),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFF111111).withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(Icons.credit_card_rounded, color: AppColors.text(context), size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Cards & Net Banking',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.text(context)),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Visa, Mastercard, RuPay & 50+ Banks',
                                style: TextStyle(color: AppColors.textSub(context), fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        Icon(Icons.lock_outline_rounded, size: 16, color: AppColors.textSub(context)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.lock_rounded, size: 14, color: Color(0xFF10B981)),
                  const SizedBox(width: 6),
                  Text(
                    '256-bit encrypted checkout powered by Cashfree Payments',
                    style: TextStyle(fontSize: 12, color: AppColors.textSub(context), fontWeight: FontWeight.w500),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Cancellation Policy
              Text('Cancellation policy', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.text(context))),
              const SizedBox(height: 6),
              Text(
                'Free cancellation up to 48 hours before check-in. Partial refund applies after.',
                style: TextStyle(fontSize: 13, height: 1.5, color: AppColors.textSub(context)),
              ),

              const SizedBox(height: 32),

              if (!provider.isAadhaarVerified)
                Container(
                  margin: const EdgeInsets.only(bottom: 20),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF450A0A).withValues(alpha: 0.3) : const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isDark ? const Color(0xFF7F1D1D) : const Color(0xFFFECACA)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.shield_outlined, color: Color(0xFFEF4444)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Aadhaar Verification Required',
                              style: TextStyle(fontWeight: FontWeight.bold, color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFF991B1B), fontSize: 14),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'UIDAI verification is mandatory before booking.',
                              style: TextStyle(color: isDark ? const Color(0xFFF87171) : const Color(0xFFB91C1C), fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const KycVerificationScreen(initialTabIndex: 1)),
                          );
                        },
                        child: const Text('Verify Now', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFEF4444))),
                      ),
                    ],
                  ),
                ),

              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isDark ? AppColors.primary : const Color(0xFF111111),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: () async {
                    if (_checkout.busy) return;
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
                        const SnackBar(content: Text('UIDAI Aadhaar verification is mandatory before booking.')),
                      );
                      return;
                    }
                    if (stay.govtIdRequired && !provider.isGovIdVerified) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const KycVerificationScreen(initialTabIndex: 1)),
                      );
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('This host requires ID verification before booking. Please complete quick KYC.')),
                      );
                      return;
                    }
                    final guests = provider.adultsCount + provider.childrenCount;
                    final nights = _tripDates.end.difference(_tripDates.start).inDays;
                    final subtotal = stay.pricePerNight * nights;
                    final service = (subtotal * 0.10).roundToDouble();
                    final estimate = subtotal + stay.cleaningFee + service + (service * 0.18).roundToDouble();
                    final booking = await _checkout.run(context, provider, stay, _tripDates, guests,
                      estimate: estimate, blockedDates: widget.blockedDates ?? widget.stay.blockedDates, options: {'children': provider.childrenCount,
                        'infants': provider.infantsCount, 'pets': provider.petsCount});
                    if (booking == null || !mounted || !context.mounted) return;
                    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => BookingConfirmationScreen(
                      booking: booking, stay: booking.stay, totalAmount: booking.totalAmount,
                      selectedDates: DateTimeRange(start: booking.checkIn, end: booking.checkOut),
                      guests: booking.adults + booking.children,
                      paymentMethod: _checkout.payment?.paymentMethod ?? 'Server confirmed')));
                  },
                  child: Text(
                    (!stay.govtIdRequired || provider.isGovIdVerified) ? 'Pay & Confirm Booking' : 'Verify ID to Pay & Confirm',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
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


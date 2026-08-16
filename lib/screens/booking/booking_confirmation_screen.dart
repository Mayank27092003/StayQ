import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../models/stay_model.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/door_unlock_animation.dart';
import '../../widgets/confetti_burst.dart';
import '../../widgets/bouncing_widget.dart';
import '../../services/qube_trigger_service.dart';
import '../../widgets/custom_toast.dart';
import 'package:intl/intl.dart';
import 'dart:math';

class BookingConfirmationScreen extends StatefulWidget {
  final StayModel stay;
  final double totalAmount;
  final DateTimeRange selectedDates;
  final int guests;
  final String paymentMethod;

  const BookingConfirmationScreen({
    super.key,
    required this.stay,
    required this.totalAmount,
    required this.selectedDates,
    required this.guests,
    required this.paymentMethod,
  });

  @override
  State<BookingConfirmationScreen> createState() => _BookingConfirmationScreenState();
}

class _BookingConfirmationScreenState extends State<BookingConfirmationScreen> {
  late String _confCode;

  @override
  void initState() {
    super.initState();
    _confCode = 'SQ-${Random().nextInt(900000) + 100000}${String.fromCharCode(65 + Random().nextInt(26))}';
    // Fire the first-booking celebration check
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<AppProvider>(context, listen: false);
      QubeTriggerService.instance.checkFirstBookingCelebration(
        context,
        totalBookings: provider.bookings.length,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final stay = widget.stay;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            children: [
              const SizedBox(height: 12),

              // Signature Door Unlock Animation & Confetti Moment
              ConfettiBurst(
                child: const DoorUnlockAnimation(),
              ),

              const SizedBox(height: 16),

              const Text(
                'Your escape is\nbooked!',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 28,
                  height: 1.15,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ).animate().fade(duration: AppMotion.extended).slideY(begin: 0.2, end: 0),

              const SizedBox(height: 10),

              const Text(
                'A confirmation email is on its way to your inbox. Get ready for an unforgettable journey.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.5,
                  color: AppColors.textSecondary,
                ),
              ),

              const SizedBox(height: 28),

              // Summary Card
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Hero(
                      tag: 'stay_hero_${stay.id}',
                      child: ClipRRect(
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                        child: (stay.imageUrls.isNotEmpty && stay.imageUrls.first.startsWith('http'))
                            ? Image.network(
                                stay.imageUrls.first,
                                height: 180,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(height: 180, color: AppColors.surfaceLight),
                              )
                            : stay.imageUrls.isNotEmpty 
                                ? Image.asset(
                                    stay.imageUrls.first,
                                    height: 180,
                                    width: double.infinity,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Container(height: 180, color: AppColors.surfaceLight),
                                  )
                                : Container(height: 180, color: AppColors.surfaceLight),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                stay.category.toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primary,
                                  letterSpacing: 1.0,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: stay.isStayingWithHost ? const Color(0xFFEFF6FF) : const Color(0xFFECFDF5),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  stay.isStayingWithHost ? 'Staying with Host' : 'Entire Space',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: stay.isStayingWithHost ? const Color(0xFF2563EB) : const Color(0xFF059669),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            stay.title,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            stay.location,
                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              const Icon(Icons.calendar_today_rounded, size: 18, color: AppColors.textSecondary),
                              const SizedBox(width: 10),
                              Text('${DateFormat('MMM d').format(widget.selectedDates.start)} — ${DateFormat('MMM d, yyyy').format(widget.selectedDates.end)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              const Icon(Icons.people_outline_rounded, size: 18, color: AppColors.textSecondary),
                              const SizedBox(width: 10),
                              Text('${widget.guests} Guests', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Confirmation Code Box with Copy Feedback
              BouncingWidget(
                onTap: () {
                  AppMotion.tapLight();
                  Clipboard.setData(ClipboardData(text: _confCode));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Confirmation code copied!')),
                  );
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.borderLight),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'CONFIRMATION CODE',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textMuted, letterSpacing: 1.2),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _confCode,
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppColors.primary, letterSpacing: 2.0),
                      ),
                      const SizedBox(height: 4),
                      const Text('Tap to copy code', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Total Amount Box
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.primaryDark,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Total Amount', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    const SizedBox(height: 4),
                    Text(
                      '₹${widget.totalAmount.toStringAsFixed(2)}',
                      style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text('Paid via ${widget.paymentMethod}', style: const TextStyle(color: Colors.white60, fontSize: 11)),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Unlocked Stay Access & Address Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFCBD5E1)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.lock_open_rounded, color: Color(0xFF059669), size: 18),
                        SizedBox(width: 8),
                        Text(
                          'UNLOCKED STAY ACCESS',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF059669), letterSpacing: 1.0),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      stay.location,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Door Access PIN: 8492#  •  Host On-Site Check-in',
                      style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Action Buttons
              ElevatedButton.icon(
                icon: const Icon(Icons.confirmation_number_outlined, size: 18),
                label: const Text('Download Stay Q Booking Pass (PDF)'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: () {
                  AppMotion.tapHeavy();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Downloading Stay Q Booking Pass for ${stay.title}... 📄'),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                },
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                icon: const Icon(Icons.luggage_outlined, size: 18),
                label: const Text('View in My Trips'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: () {
                  Navigator.pushNamedAndRemoveUntil(context, '/main', (route) => false);
                },
              ),
              const SizedBox(height: 12),
              TextButton.icon(
                icon: const Icon(Icons.home_rounded, size: 18, color: AppColors.textSecondary),
                label: const Text('Back to Explore', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                onPressed: () => Navigator.pushNamedAndRemoveUntil(context, '/main', (route) => false),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

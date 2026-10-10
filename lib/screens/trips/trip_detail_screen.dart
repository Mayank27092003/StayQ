import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/booking_model.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../providers/messaging_provider.dart';
import '../../providers/app_provider.dart';
import '../../widgets/digital_boarding_pass_sheet.dart';
import '../inbox/chat_detail_screen.dart';
import '../listing/listing_detail_screen.dart';

class TripDetailScreen extends StatelessWidget {

  final BookingModel booking;

  const TripDetailScreen({super.key, required this.booking});

  Future<void> _shareItinerary(BuildContext context) async {
    AppMotion.tapMedium();
    final stay = booking.stay;
    final df = DateFormat('EEE, MMM dd, yyyy');
    final checkInStr = df.format(booking.checkIn);
    final checkOutStr = df.format(booking.checkOut);
    final nights = booking.checkOut.difference(booking.checkIn).inDays;
    final pin = booking.accessPin?.isNotEmpty == true ? booking.accessPin! : 'Awaiting host instructions';

    final itineraryText = '''STAYQ TRIP ITINERARY
Property: ${stay.title}
Location: ${stay.location}
Booking Code: ${booking.confirmationCode}
Dates: $checkInStr to $checkOutStr ($nights nights)
Access: ${stay.isStayingWithHost ? "In-Person Check-in with ${stay.hostName}" : "Access: $pin"}
Booking total: ₹${booking.totalAmount.toStringAsFixed(0)}
Official Desk: hello@stayq.space''';

    await Clipboard.setData(ClipboardData(text: itineraryText));

    final encoded = Uri.encodeComponent(itineraryText);
    final waUri = Uri.parse('whatsapp://send?text=$encoded');
    final webWaUri = Uri.parse('https://api.whatsapp.com/send?text=$encoded');

    try {
      if (await canLaunchUrl(waUri)) {
        await launchUrl(waUri, mode: LaunchMode.externalApplication);
      } else if (await canLaunchUrl(webWaUri)) {
        await launchUrl(webWaUri, mode: LaunchMode.externalApplication);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Trip itinerary copied to clipboard! 📋'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Trip itinerary copied to clipboard! 📋'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _openDirections(BuildContext context) async {
    AppMotion.tapMedium();
    final stay = booking.stay;
    final query = Uri.encodeComponent('${stay.title}, ${stay.location}');
    final mapsUri = Uri.parse('https://www.google.com/maps/search/?api=1&query=$query');
    try {
      if (await canLaunchUrl(mapsUri)) {
        await launchUrl(mapsUri, mode: LaunchMode.externalApplication);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Location: ${stay.location}')),
          );
        }
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Location: ${stay.location}')),
        );
      }
    }
  }

  void _openBoardingPass(BuildContext context) {
    AppMotion.tapHeavy();
    final stay = booking.stay;
    final provider = context.read<AppProvider>();
    final guestName = booking.guestName.isNotEmpty
        ? booking.guestName
        : (provider.userName.isNotEmpty ? provider.userName : 'Valued Guest');

    DigitalBoardingPassSheet.show(
      context,
      accessPin: booking.isConfirmed && booking.isPaid ? booking.accessPin : null,
      isPaid: booking.isPaid,
      confirmationCode: booking.confirmationCode,
      guestName: guestName,
      stayTitle: stay.title,
      stayLocation: stay.location,
      category: stay.category,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      totalAmount: booking.totalAmount,
      hostName: stay.hostName,
      isStayingWithHost: stay.isStayingWithHost,
    );
  }

  @override
  Widget build(BuildContext context) {
    final stay = booking.stay;
    final dateFormat = DateFormat('EEE, MMM dd, yyyy');
    final checkInStr = dateFormat.format(booking.checkIn);
    final checkOutStr = dateFormat.format(booking.checkOut);
    final nights = booking.checkOut.difference(booking.checkIn).inDays;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Trip Details', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            tooltip: 'Share Itinerary',
            onPressed: () => _shareItinerary(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Property Hero Card
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => ListingDetailScreen(stay: stay)),
                );
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: AppColors.borderLight),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: SizedBox(
                        width: 90,
                        height: 90,
                        child: (stay.imageUrls.isNotEmpty && stay.firstImage.startsWith('http'))
                            ? Image.network(
                                stay.firstImage,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => Container(
                                  color: AppColors.surfaceLight,
                                  child: const Icon(Icons.holiday_village_rounded, color: AppColors.primary, size: 32),
                                ),
                              )
                            : Container(
                                color: AppColors.surfaceLight,
                                child: const Icon(Icons.holiday_village_rounded, color: AppColors.primary, size: 32),
                              ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.successGreen.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  booking.status.name.toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.successGreen,
                                  ),
                                ),
                              ),
                              if (stay.isStayingWithHost) ...[
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEFF6FF),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    'With Host',
                                    style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF2563EB),
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            stay.title,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            stay.location,
                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Check-in & Check-out Dates Box
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('CHECK-IN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textMuted, letterSpacing: 1.0)),
                            const SizedBox(height: 4),
                            Text(checkInStr, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                            const SizedBox(height: 2),
                            const Text('From 2:00 PM', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          ],
                        ),
                      ),
                      Container(height: 40, width: 1, color: AppColors.borderLight),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text('CHECK-OUT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textMuted, letterSpacing: 1.0)),
                            const SizedBox(height: 4),
                            Text(checkOutStr, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                            const SizedBox(height: 2),
                            const Text('Until 11:00 AM', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24, color: AppColors.borderLight),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('$nights ${nights == 1 ? "night" : "nights"} • ${booking.adults + booking.children} guests', style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                      Text('Code: ${booking.confirmationCode}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary)),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Unlocked Access & Door PIN
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFF86EFAC)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.key_rounded, color: Color(0xFF15803D), size: 20),
                      const SizedBox(width: 8),
                      Text(
                        stay.isStayingWithHost ? 'HOST IN-PERSON CHECK-IN' : 'DIGITAL SELF CHECK-IN ACCESS',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF15803D), letterSpacing: 1.0),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (!stay.isStayingWithHost) ...[
                    Text(
                      (booking.accessPin?.isNotEmpty == true ? 'Access PIN: ${booking.accessPin}' : 'Awaiting host access instructions'),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF0F172A), letterSpacing: 1.5),
                    ),
                    const SizedBox(height: 4),
                    const Text('Use only the access instructions supplied for this booking.', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                    const SizedBox(height: 6),
                  ] else ...[
                    Text(
                      'Hosted Stay with ${stay.hostName}',
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 4),
                    Text('Direct key handover upon arrival. Host ${stay.hostName} will welcome you.', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                    const SizedBox(height: 6),
                  ],
                  const Text('Ask your host for the property Wi-Fi details.', style: TextStyle(fontSize: 13, color: Color(0xFF334155))),
                  if (stay.isStayingWithHost) ...[
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.person_pin_rounded, color: Color(0xFF2563EB), size: 18),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Host on premises. Private bedroom with access to shared lounge and kitchen.',
                              style: TextStyle(fontSize: 12, color: Color(0xFF1E293B)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Quick Host Communication & Navigation
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.chat_bubble_outline_rounded, size: 18),
                    label: const Text('Contact Host'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: () async {
                      AppMotion.tapSelection();
                      final provider = Provider.of<AppProvider>(context, listen: false);
                      if (!provider.isLoggedIn) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please log in to chat with the host')),
                        );
                        return;
                      }

                      final messaging = Provider.of<MessagingProvider>(context, listen: false);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Connecting to ${stay.hostName}...'), duration: const Duration(seconds: 1)),
                      );

                      final convId = await messaging.createOrGetConversation(
                        hostId: stay.hostId,
                        propertyId: stay.id,
                        bookingId: booking.id,
                      );

                      if (convId == null) {
                        if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(messaging.error ?? 'Conversation could not be opened.')));
                        return;
                      }
                      if (context.mounted) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ChatDetailScreen(
                              chatId: convId,
                              otherUserName: stay.hostName.isNotEmpty ? stay.hostName : 'Host',
                              otherUserAvatar: stay.hostAvatar,
                            ),
                          ),
                        );
                      }
                    },

                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.directions_rounded, size: 18),
                    label: const Text('Directions'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textPrimary,
                      side: const BorderSide(color: AppColors.borderLight),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: () => _openDirections(context),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Download Boarding Pass PDF Action
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.confirmation_number_rounded, size: 18),
                label: const Text('View & Download StayQ Booking Pass'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF073359),
                  foregroundColor: const Color(0xFFC5A880),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 2,
                ),
                onPressed: () => _openBoardingPass(context),
              ),
            ),

            const SizedBox(height: 24),

            // Total Paid Details
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Payment Summary', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(booking.isPaid ? 'Total Paid' : 'Booking total', style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
                      Text('₹${booking.totalAmount.toStringAsFixed(2)}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(booking.isPaid ? 'Payment verified' : 'Payment status is available in Trips', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

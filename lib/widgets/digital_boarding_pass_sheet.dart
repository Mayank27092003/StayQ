import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';

class DigitalBoardingPassSheet extends StatelessWidget {
  final String confirmationCode;
  final String guestName;
  final String stayTitle;
  final String stayLocation;
  final String category;
  final DateTime checkIn;
  final DateTime checkOut;
  final double totalAmount;
  final String hostName;
  final bool isStayingWithHost;
  final String? accessPin;
  final bool isPaid;

  const DigitalBoardingPassSheet({
    super.key,
    required this.confirmationCode,
    required this.guestName,
    required this.stayTitle,
    required this.stayLocation,
    required this.category,
    required this.checkIn,
    required this.checkOut,
    required this.totalAmount,
    required this.hostName,
    required this.isStayingWithHost,
    this.accessPin,
    this.isPaid = false,
  });

  static void show(
    BuildContext context, {
    required String confirmationCode,
    required String guestName,
    required String stayTitle,
    required String stayLocation,
    required String category,
    required DateTime checkIn,
    required DateTime checkOut,
    required double totalAmount,
    required String hostName,
    required bool isStayingWithHost,
    String? accessPin,
    bool isPaid = false,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => DigitalBoardingPassSheet(
        accessPin: accessPin,
        isPaid: isPaid,
        confirmationCode: confirmationCode,
        guestName: guestName,
        stayTitle: stayTitle,
        stayLocation: stayLocation,
        category: category,
        checkIn: checkIn,
        checkOut: checkOut,
        totalAmount: totalAmount,
        hostName: hostName,
        isStayingWithHost: isStayingWithHost,
      ),
    );
  }

  String get _doorPin => accessPin?.isNotEmpty == true ? accessPin! : 'Awaiting host instructions';

  String _formatPassText() {
    final df = DateFormat('EEE, MMM dd, yyyy');
    return '''STAYQ | OFFICIAL DIGITAL STAY PASS
----------------------------------------
Booking Code: $confirmationCode
Guest Name: $guestName
Property: $stayTitle
Location: $stayLocation
Category: ${category.toUpperCase()}

Check-in: ${df.format(checkIn)} (from 2:00 PM)
Check-out: ${df.format(checkOut)} (by 11:00 AM)
Access: ${isStayingWithHost ? 'In-Person Check-in with Host $hostName' : 'Access: $_doorPin'}

Booking total: ₹${totalAmount.toStringAsFixed(0)} (${isPaid ? 'Payment verified' : 'Check payment status in Trips'})
Host: ${hostName.isNotEmpty ? hostName : 'Host'}

Official Desk: hello@stayq.space
----------------------------------------
Present this pass upon check-in or scan QR code.''';
  }

  Future<void> _shareOnWhatsApp(BuildContext context) async {
    final text = Uri.encodeComponent(_formatPassText());
    final waUri = Uri.parse('whatsapp://send?text=$text');
    final webWaUri = Uri.parse('https://api.whatsapp.com/send?text=$text');

    try {
      if (await canLaunchUrl(waUri)) {
        await launchUrl(waUri, mode: LaunchMode.externalApplication);
      } else if (await canLaunchUrl(webWaUri)) {
        await launchUrl(webWaUri, mode: LaunchMode.externalApplication);
      } else {
        await Clipboard.setData(ClipboardData(text: _formatPassText()));
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('WhatsApp not detected. Boarding Pass copied to clipboard! 📋'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (_) {
      await Clipboard.setData(ClipboardData(text: _formatPassText()));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Boarding Pass details copied to clipboard! 📋'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd MMM yyyy');
    final nights = checkOut.difference(checkIn).inDays;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.only(
        top: 16,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).padding.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Modal Handle
            Center(
              child: Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 18),

            // Top Header Title & Close
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF073359).withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.confirmation_number_rounded, color: Color(0xFF073359), size: 20),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'Official Digital Stay Pass',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: AppColors.textSecondary),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // BOARDING PASS CARD CONTAINER
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFFFDFBF7),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFE2D7C3), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Pass Header Band
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                    decoration: const BoxDecoration(
                      color: Color(0xFF073359),
                      borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
                      border: Border(bottom: BorderSide(color: Color(0xFFC5A880), width: 3)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.stars_rounded, color: Color(0xFFC5A880), size: 18),
                            SizedBox(width: 8),
                            Text(
                              'STAYQ LUXURY PASS',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFC5A880),
                                letterSpacing: 1.5,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFF10B981)),
                          ),
                          child: const Text(
                            'CONFIRMED',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF10B981)),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Pass Body
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Property and Category
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    category.toUpperCase(),
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), letterSpacing: 1.2),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    stayTitle,
                                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textSecondary),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          stayLocation,
                                          style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),
                        const Divider(height: 1, color: Color(0xFFE2D7C3)),
                        const SizedBox(height: 16),

                        // Guest Name & Confirmation Code
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('GUEST NAME', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
                                  const SizedBox(height: 4),
                                  Text(
                                    guestName.isNotEmpty ? guestName : 'Valued Guest',
                                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text('CONFIRMATION CODE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
                                const SizedBox(height: 4),
                                GestureDetector(
                                  onTap: () {
                                    Clipboard.setData(ClipboardData(text: confirmationCode));
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('Copied $confirmationCode to clipboard!'),
                                        behavior: SnackBarBehavior.floating,
                                        duration: const Duration(seconds: 1),
                                      ),
                                    );
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF073359).withValues(alpha: 0.08),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Row(
                                      children: [
                                        Text(
                                          confirmationCode,
                                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF073359), letterSpacing: 0.8),
                                        ),
                                        const SizedBox(width: 4),
                                        const Icon(Icons.copy_rounded, size: 12, color: Color(0xFF073359)),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Check-in / Check-out Grid
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('CHECK-IN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                                    const SizedBox(height: 2),
                                    Text(dateFormat.format(checkIn), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                                    const Text('From 2:00 PM', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text('$nights ${nights == 1 ? "Night" : "Nights"}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF475569))),
                              ),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    const Text('CHECK-OUT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                                    const SizedBox(height: 2),
                                    Text(dateFormat.format(checkOut), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                                    const Text('By 11:00 AM', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Access Key / PIN Box
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF059669).withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFF059669).withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.key_rounded, color: Color(0xFF059669), size: 20),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      isStayingWithHost ? 'HOST IN-PERSON CHECK-IN' : 'CHECK-IN INSTRUCTIONS',
                                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF059669), letterSpacing: 1.0),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      isStayingWithHost
                                          ? 'Hosted Stay with ${hostName.isNotEmpty ? hostName : "Host"}'
                                          : 'Access: $_doorPin',
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // QR CODE FOR CHECK-IN
                        Center(
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: const Color(0xFFCBD5E1), width: 1.5),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.04),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Image.network(
                                  'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=STAYQ-$confirmationCode',
                                  width: 140,
                                  height: 140,
                                  errorBuilder: (_, __, ___) => const SizedBox(
                                    width: 140,
                                    height: 140,
                                    child: Center(child: Icon(Icons.qr_code_2_rounded, size: 100, color: Color(0xFF073359))),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'SCAN AT CHECK-IN',
                                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF64748B), letterSpacing: 1.5),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),
                        const Divider(height: 1, color: Color(0xFFE2D7C3)),
                        const SizedBox(height: 12),

                        // Bottom Summary Row
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('TOTAL PAID', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
                                Text(
                                  '₹${totalAmount.toStringAsFixed(0)}',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF073359)),
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: const [
                                Text('OFFICIAL DESK', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8))),
                                Text(
                                  'hello@stayq.space',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ACTION BUTTONS
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.share_rounded, size: 18),
                    label: const Text('Share Pass'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF25D366),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: () {
                      AppMotion.tapHeavy();
                      _shareOnWhatsApp(context);
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.copy_all_rounded, size: 18),
                    label: const Text('Copy Details'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textPrimary,
                      side: const BorderSide(color: AppColors.borderLight),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    onPressed: () {
                      AppMotion.tapMedium();
                      Clipboard.setData(ClipboardData(text: _formatPassText()));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Official Digital Stay Pass details copied! 📋'),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

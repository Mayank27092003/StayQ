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

  String _getCountdownText() {
    final now = DateTime.now();
    if (now.isBefore(checkIn)) {
      final diff = checkIn.difference(now);
      if (diff.inDays > 0) {
        return '${diff.inDays}d ${diff.inHours % 24}h until Check-in';
      } else if (diff.inHours > 0) {
        return '${diff.inHours}h ${diff.inMinutes % 60}m until Check-in';
      } else {
        return '${diff.inMinutes}m until Check-in';
      }
    } else if (now.isAfter(checkIn) && now.isBefore(checkOut)) {
      return 'Check-in Active • Stay in Progress';
    } else {
      return 'Stay Completed';
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd MMM yyyy');
    final nights = checkOut.difference(checkIn).inDays;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final countdownStr = _getCountdownText();

    return Container(
      decoration: BoxDecoration(
        color: AppColors.card(context),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
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
                  color: isDark ? Colors.white24 : Colors.black12,
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
                        color: isDark ? const Color(0xFF93C5FD).withValues(alpha: 0.15) : const Color(0xFF073359).withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.confirmation_number_rounded, color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF073359), size: 20),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Official Digital Stay Pass',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppColors.text(context),
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: Icon(Icons.close_rounded, color: AppColors.textSub(context)),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // BOARDING PASS CARD CONTAINER
            Container(
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E222D) : const Color(0xFFFDFBF7),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: isDark ? const Color(0xFF333A48) : const Color(0xFFE2D7C3), width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.06),
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

                  // Check-in Time Countdown Banner
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                      border: Border(bottom: BorderSide(color: isDark ? const Color(0xFF333A48) : const Color(0xFFE2E8F0))),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.hourglass_top_rounded, size: 14, color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF073359)),
                        const SizedBox(width: 6),
                        Text(
                          countdownStr,
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.bold,
                            color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF073359),
                            letterSpacing: 0.5,
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
                                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isDark ? Colors.white : const Color(0xFF0F172A)),
                                  ),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Icon(Icons.location_on_outlined, size: 14, color: isDark ? const Color(0xFF94A3B8) : AppColors.textSecondary),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          stayLocation,
                                          style: TextStyle(fontSize: 13, color: isDark ? const Color(0xFFCBD5E1) : AppColors.textSecondary),
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
                        Divider(height: 1, color: isDark ? const Color(0xFF333A48) : const Color(0xFFE2D7C3)),
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
                                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: isDark ? Colors.white : const Color(0xFF0F172A)),
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
                                      color: isDark ? const Color(0xFF93C5FD).withValues(alpha: 0.15) : const Color(0xFF073359).withValues(alpha: 0.08),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Row(
                                      children: [
                                        Text(
                                          confirmationCode,
                                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF073359), letterSpacing: 0.8),
                                        ),
                                        const SizedBox(width: 4),
                                        Icon(Icons.copy_rounded, size: 12, color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF073359)),
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
                            color: isDark ? const Color(0xFF141720) : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: isDark ? const Color(0xFF333A48) : const Color(0xFFE2E8F0)),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('CHECK-IN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                                    const SizedBox(height: 2),
                                    Text(dateFormat.format(checkIn), style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: isDark ? Colors.white : const Color(0xFF0F172A))),
                                    const Text('From 2:00 PM', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF262D3D) : const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text('$nights ${nights == 1 ? "Night" : "Nights"}', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569))),
                              ),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    const Text('CHECK-OUT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                                    const SizedBox(height: 2),
                                    Text(dateFormat.format(checkOut), style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: isDark ? Colors.white : const Color(0xFF0F172A))),
                                    const Text('By 11:00 AM', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Access Key / Door PIN Box
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF059669).withValues(alpha: isDark ? 0.15 : 0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFF059669).withValues(alpha: isDark ? 0.4 : 0.3)),
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
                                      isStayingWithHost ? 'HOST IN-PERSON CHECK-IN' : 'DOOR CODE & ACCESS',
                                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF059669), letterSpacing: 1.0),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      isStayingWithHost
                                          ? 'Hosted Stay with ${hostName.isNotEmpty ? hostName : "Host"}'
                                          : 'Access Code: $_doorPin',
                                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: isDark ? Colors.white : const Color(0xFF0F172A)),
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
                                  border: Border.all(color: isDark ? const Color(0xFF475569) : const Color(0xFFCBD5E1), width: 1.5),
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
                                  errorBuilder: (_, _, _) => const SizedBox(
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
                        Divider(height: 1, color: isDark ? const Color(0xFF333A48) : const Color(0xFFE2D7C3)),
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
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF073359)),
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
                      foregroundColor: AppColors.text(context),
                      side: BorderSide(color: AppColors.border(context)),
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

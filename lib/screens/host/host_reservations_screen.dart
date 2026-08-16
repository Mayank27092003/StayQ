import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/app_provider.dart';
import '../../models/booking_model.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';

class HostReservationsScreen extends StatelessWidget {
  const HostReservationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Reservations', style: TextStyle(fontWeight: FontWeight.bold)),
          bottom: const TabBar(
            indicatorColor: AppColors.primary,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
            tabs: [
              Tab(text: 'Pending'),
              Tab(text: 'Upcoming'),
              Tab(text: 'Completed'),
            ],
          ),
        ),
        body: Consumer<AppProvider>(
          builder: (context, provider, _) {
            final pending = provider.hostBookings.where((b) => b.status == BookingStatus.pending).toList();
            final upcoming = provider.hostBookings.where((b) => b.status == BookingStatus.confirmed || b.status == BookingStatus.upcoming).toList();
            final completed = provider.hostBookings.where((b) => b.status == BookingStatus.completed || b.status == BookingStatus.cancelled).toList();

            return TabBarView(
              children: [
                _BookingList(bookings: pending, isPending: true),
                _BookingList(bookings: upcoming, isPending: false),
                _BookingList(bookings: completed, isPending: false),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _BookingList extends StatelessWidget {
  final List<BookingModel> bookings;
  final bool isPending;

  const _BookingList({required this.bookings, required this.isPending});

  @override
  Widget build(BuildContext context) {
    if (bookings.isEmpty) {
      return const Center(child: Text('No reservations here.', style: TextStyle(color: AppColors.textSecondary)));
    }
    
    return ListView.separated(
      padding: const EdgeInsets.all(20),
      itemCount: bookings.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final b = bookings[index];
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.borderLight),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10)],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    child: b.guestAvatar.isNotEmpty && b.guestAvatar.startsWith('http')
                        ? ClipOval(
                            child: Image.network(
                              b.guestAvatar,
                              width: 40,
                              height: 40,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Text(
                                b.guestName.isNotEmpty ? b.guestName[0].toUpperCase() : 'G',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                              ),
                            ),
                          )
                        : Text(
                            b.guestName.isNotEmpty ? b.guestName[0].toUpperCase() : 'G',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                          ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(b.guestName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        Text('Total payout: ₹${b.totalAmount.toInt()}', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isPending ? AppColors.starYellow.withValues(alpha: 0.2) : AppColors.successGreen.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      isPending ? 'Action Required' : b.status.name.toUpperCase(),
                      style: TextStyle(
                        fontSize: 10, 
                        fontWeight: FontWeight.bold, 
                        color: isPending ? AppColors.starYellow : AppColors.successGreen,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              Row(
                children: [
                  Expanded(child: Text(b.stay.title, style: const TextStyle(fontWeight: FontWeight.bold))),
                  if (b.stay.isStayingWithHost)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.people_alt_rounded, size: 12, color: Color(0xFF2563EB)),
                          SizedBox(width: 4),
                          Text(
                            'With Host',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF2563EB)),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              Text('${DateFormat('MMM d').format(b.checkIn)} - ${DateFormat('MMM d').format(b.checkOut)} • ${b.adults} Guests'),
              
              if (isPending) ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: BouncingWidget(
                        onTap: () {
                          AppMotion.tapSelection();
                          Provider.of<AppProvider>(context, listen: false).updateBookingStatus(b.id, BookingStatus.cancelled);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Reservation declined and dates released.')),
                          );
                        },
                        child: Container(
                          height: 44,
                          decoration: BoxDecoration(
                            border: Border.all(color: AppColors.errorRed),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Center(child: Text('Reject', style: TextStyle(color: AppColors.errorRed, fontWeight: FontWeight.bold))),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: BouncingWidget(
                        onTap: () {
                          AppMotion.tapSelection();
                          Provider.of<AppProvider>(context, listen: false).updateBookingStatus(b.id, BookingStatus.confirmed);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Reservation accepted! Guest notified.')),
                          );
                        },
                        child: Container(
                          height: 44,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Center(child: Text('Accept', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

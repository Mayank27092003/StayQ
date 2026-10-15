import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/empty_state_view.dart';
import '../../models/booking_model.dart';
import '../../widgets/digital_boarding_pass_sheet.dart';
import '../listing/write_review_screen.dart';
import 'trip_detail_screen.dart';

class TripsScreen extends StatefulWidget {
  const TripsScreen({super.key});

  @override
  State<TripsScreen> createState() => _TripsScreenState();
}

class _TripsScreenState extends State<TripsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  bool _isUpcoming(BookingModel bk, DateTime now) {
    if (bk.status == BookingStatus.cancelled) return false;
    if (bk.status == BookingStatus.upcoming) return true;
    return bk.checkIn.isAfter(now) && (bk.isPaid || bk.status == BookingStatus.confirmed);
  }

  bool _isActive(BookingModel bk, DateTime now) {
    if (bk.status == BookingStatus.cancelled) return false;
    final isWithinStay = now.isAfter(bk.checkIn) && now.isBefore(bk.checkOut);
    final isTodayCheckIn = now.year == bk.checkIn.year &&
        now.month == bk.checkIn.month &&
        now.day == bk.checkIn.day;
    return (isWithinStay || (isTodayCheckIn && bk.status == BookingStatus.confirmed)) &&
        bk.status != BookingStatus.completed;
  }

  bool _isCompleted(BookingModel bk, DateTime now) {
    if (bk.status == BookingStatus.completed) return true;
    if (bk.status == BookingStatus.cancelled) return true;
    return now.isAfter(bk.checkOut);
  }

  void _openBoardingPass(BuildContext context, BookingModel booking) {
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

  Widget _buildTripCard(BuildContext context, BookingModel bk, {required String category}) {
    final dateFormat = DateFormat('MMM dd, yyyy');
    final isDark = AppColors.isDark(context);
    final now = DateTime.now();
    final isActiveTrip = _isActive(bk, now);
    final isCancelled = bk.status == BookingStatus.cancelled;

    Color badgeColor;
    Color badgeTextColor;
    String badgeText;

    if (isCancelled) {
      badgeColor = Colors.red.withValues(alpha: 0.12);
      badgeTextColor = Colors.red;
      badgeText = 'CANCELLED';
    } else if (isActiveTrip) {
      badgeColor = const Color(0xFF2563EB).withValues(alpha: 0.15);
      badgeTextColor = const Color(0xFF2563EB);
      badgeText = 'ACTIVE NOW';
    } else if (bk.status == BookingStatus.completed || now.isAfter(bk.checkOut)) {
      badgeColor = isDark ? Colors.white12 : Colors.black.withValues(alpha: 0.08);
      badgeTextColor = AppColors.textSub(context);
      badgeText = 'COMPLETED';
    } else {
      badgeColor = AppColors.successGreen.withValues(alpha: 0.12);
      badgeTextColor = AppColors.successGreen;
      badgeText = 'UPCOMING';
    }

    return GestureDetector(
      onTap: () {
        AppMotion.tapSelection();
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => TripDetailScreen(booking: bk),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card(context),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActiveTrip
                ? const Color(0xFF2563EB).withValues(alpha: 0.5)
                : AppColors.border(context),
            width: isActiveTrip ? 1.5 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: (bk.stay.imageUrls.isNotEmpty && bk.stay.firstImage.startsWith('http'))
                      ? Image.network(
                          bk.stay.firstImage,
                          width: 80,
                          height: 80,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => Container(
                            width: 80,
                            height: 80,
                            color: AppColors.surface(context),
                            child: const Icon(Icons.holiday_village_rounded, color: AppColors.primary, size: 30),
                          ),
                        )
                      : Container(
                          width: 80,
                          height: 80,
                          color: AppColors.surface(context),
                          child: const Icon(Icons.holiday_village_rounded, color: AppColors.primary, size: 30),
                        ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: badgeColor,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              badgeText,
                              style: TextStyle(
                                fontSize: 9.5,
                                fontWeight: FontWeight.w800,
                                color: badgeTextColor,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          if (bk.stay.isStayingWithHost) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
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
                        bk.stay.title,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: AppColors.text(context),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Icon(Icons.location_on_outlined, size: 12, color: AppColors.textSub(context)),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              bk.stay.location,
                              style: TextStyle(fontSize: 12, color: AppColors.textSub(context)),
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
            Divider(height: 24, color: AppColors.border(context)),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('DATES', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textSub(context))),
                    const SizedBox(height: 2),
                    Text(
                      '${dateFormat.format(bk.checkIn)} - ${dateFormat.format(bk.checkOut)}',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.text(context)),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('CONFIRMATION CODE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textSub(context))),
                    const SizedBox(height: 2),
                    Text(
                      bk.confirmationCode,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                  ],
                ),
              ],
            ),
            if (bk.status == BookingStatus.completed && !isCancelled) ...[
              Divider(height: 24, color: AppColors.border(context)),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    AppMotion.tapSelection();
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => WriteReviewScreen(booking: bk)),
                    );
                  },
                  icon: const Icon(Icons.star_outline_rounded, size: 18),
                  label: const Text('Write a Review'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ] else if (!isCancelled) ...[
              Divider(height: 20, color: AppColors.border(context)),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _openBoardingPass(context, bk),
                      icon: const Icon(Icons.qr_code_2_rounded, size: 16),
                      label: const Text('Boarding Pass', style: TextStyle(fontSize: 12)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: BorderSide(color: AppColors.primary.withValues(alpha: 0.5)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        AppMotion.tapSelection();
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => TripDetailScreen(booking: bk),
                          ),
                        );
                      },
                      icon: const Icon(Icons.info_outline_rounded, size: 16),
                      label: const Text('Trip Details', style: TextStyle(fontSize: 12)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.surface(context),
                        foregroundColor: AppColors.text(context),
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                          side: BorderSide(color: AppColors.border(context)),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTabListView({
    required BuildContext context,
    required List<BookingModel> bookings,
    required AppProvider provider,
    required String emptyTitle,
    required String emptyMessage,
    required String emptyButtonText,
    required VoidCallback onEmptyAction,
    required String category,
  }) {
    if (bookings.isEmpty) {
      return EmptyStateView(
        title: emptyTitle,
        message: emptyMessage,
        buttonText: emptyButtonText,
        onAction: onEmptyAction,
      );
    }

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () async {
        await provider.fetchBookings();
      },
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        itemCount: bookings.length,
        itemBuilder: (context, index) {
          return _buildTripCard(context, bookings[index], category: category);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final now = DateTime.now();

    final allRelevantBookings = provider.bookings.where((bk) =>
        bk.isPaid ||
        (bk.status != BookingStatus.pending)
    ).toList();

    final upcomingBookings = allRelevantBookings
        .where((bk) => _isUpcoming(bk, now))
        .toList();

    final activeBookings = allRelevantBookings
        .where((bk) => _isActive(bk, now))
        .toList();

    final completedBookings = allRelevantBookings
        .where((bk) => _isCompleted(bk, now))
        .toList();

    return Scaffold(
      backgroundColor: AppColors.bg(context),
      appBar: AppBar(
        title: const Text('My Trips', style: TextStyle(fontWeight: FontWeight.bold)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.surface(context),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.border(context)),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(20),
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              labelColor: Colors.white,
              unselectedLabelColor: AppColors.textSub(context),
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              dividerColor: Colors.transparent,
              padding: const EdgeInsets.all(3),
              tabs: [
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Upcoming'),
                      if (upcomingBookings.isNotEmpty) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.25),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${upcomingBookings.length}',
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Active'),
                      if (activeBookings.isNotEmpty) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                          decoration: BoxDecoration(
                            color: const Color(0xFF2563EB),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${activeBookings.length}',
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Completed'),
                      if (completedBookings.isNotEmpty) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.25),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${completedBookings.length}',
                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: SafeArea(
        child: TabBarView(
          controller: _tabController,
          children: [
            // Tab 1: Upcoming
            _buildTabListView(
              context: context,
              bookings: upcomingBookings,
              provider: provider,
              emptyTitle: 'No upcoming trips',
              emptyMessage: 'Ready for your next adventure? Find amazing stays across India.',
              emptyButtonText: 'Start Searching',
              onEmptyAction: () => context.read<AppProvider>().setTabIndex(0),
              category: 'Upcoming',
            ),
            // Tab 2: Active
            _buildTabListView(
              context: context,
              bookings: activeBookings,
              provider: provider,
              emptyTitle: 'No active stay right now',
              emptyMessage: 'When you check into a stay, your active trip pass and door key will show up here.',
              emptyButtonText: 'View Upcoming Trips',
              onEmptyAction: () => _tabController.animateTo(0),
              category: 'Active',
            ),
            // Tab 3: Completed
            _buildTabListView(
              context: context,
              bookings: completedBookings,
              provider: provider,
              emptyTitle: 'No past trips yet',
              emptyMessage: 'Completed trips and review options will be safely archived here.',
              emptyButtonText: 'Explore Stays',
              onEmptyAction: () => context.read<AppProvider>().setTabIndex(0),
              category: 'Completed',
            ),
          ],
        ),
      ),
    );
  }
}

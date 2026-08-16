import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:ui' as ui;
import '../../providers/app_provider.dart';
import '../../providers/host_dashboard_provider.dart';
import '../../theme/app_colors.dart';
import 'onboarding/host_onboarding_screen.dart';
import 'host_availability_screen.dart';
import 'manage_listings_screen.dart';
import 'host_reservations_screen.dart';
import 'add_listing_wizard.dart';
import '../profile/security_screen.dart';
import '../profile/support_screen.dart';

class HostDashboardScreen extends StatefulWidget {
  const HostDashboardScreen({super.key});

  @override
  State<HostDashboardScreen> createState() => _HostDashboardScreenState();
}

class _HostDashboardScreenState extends State<HostDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appProvider = context.read<AppProvider>();
      final hostId = appProvider.userId ?? 'mock_host_id';
      context.read<HostDashboardProvider>().fetchDashboardData(hostId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final dashboard = context.watch<HostDashboardProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded, color: AppColors.textPrimary),
          onPressed: () {
            showModalBottomSheet(
              context: context,
              builder: (context) => SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ListTile(
                      leading: const Icon(Icons.settings),
                      title: const Text('Settings'),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const SecurityScreen()));
                      },
                    ),
                    ListTile(
                      leading: const Icon(Icons.help),
                      title: const Text('Help & Support'),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const SupportScreen()));
                      },
                    ),
                    ListTile(
                      leading: const Icon(Icons.swap_horiz),
                      title: const Text('Switch to Guest mode'),
                      onTap: () {
                        context.read<AppProvider>().toggleHostMode();
                        Navigator.pop(context);
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        title: const Text(
          'Host Dashboard',
          style: TextStyle(fontWeight: FontWeight.w800, color: AppColors.textPrimary, letterSpacing: -0.5),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: CircleAvatar(
              radius: 18,
              backgroundColor: AppColors.primary.withValues(alpha: 0.2),
              backgroundImage: (appProvider.userAvatar.isNotEmpty && appProvider.userAvatar.startsWith('http'))
                  ? NetworkImage(appProvider.userAvatar)
                  : null,
              child: (appProvider.userAvatar.isEmpty || !appProvider.userAvatar.startsWith('http'))
                  ? Text(
                      appProvider.userName.isNotEmpty ? appProvider.userName[0].toUpperCase() : 'H',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                    )
                  : null,
            ),
          ),
        ],
      ),
      body: dashboard.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async {
                final hostId = appProvider.userId ?? 'mock_host_id';
                await context.read<HostDashboardProvider>().fetchDashboardData(hostId);
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildGreeting(appProvider.userName),
                    const SizedBox(height: 24),
                    _buildActionButtons(context),
                    const SizedBox(height: 32),
                    _buildChartSegmentedControl(dashboard),
                    _buildDynamicChart(dashboard),
                    const SizedBox(height: 32),
                    _buildOverviewStats(dashboard),
                    const SizedBox(height: 32),
                    _buildUpcomingGuests(dashboard),
                    const SizedBox(height: 32),
                    _buildRecentRequests(context, dashboard),
                    const SizedBox(height: 100), // Bottom padding
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildGreeting(String name) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Welcome back,\n$name',
          style: const TextStyle(
            fontSize: 28,
            height: 1.15,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.2, end: 0),
        const SizedBox(height: 8),
        const Text(
          'Here is what\'s happening with your properties today.',
          style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
        ).animate().fadeIn(delay: 100.ms, duration: 400.ms).slideY(begin: 0.2, end: 0),
      ],
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                icon: const Icon(Icons.add_home_work_rounded, size: 20),
                label: const Text('List a new property'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  elevation: 4,
                  shadowColor: AppColors.primary.withValues(alpha: 0.4),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const HostOnboardingScreen(isAddingNewProperty: true)),
                  );
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildQuickActionCard(
                context,
                icon: Icons.calendar_month_rounded,
                title: 'Availability',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HostAvailabilityScreen())),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildQuickActionCard(
                context,
                icon: Icons.holiday_village_rounded,
                title: 'My Listings',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ManageListingsScreen())),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildQuickActionCard(
                context,
                icon: Icons.receipt_long_rounded,
                title: 'Reservations',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HostReservationsScreen())),
              ),
            ),
          ],
        ),
      ],
    ).animate().fadeIn(delay: 200.ms).scale(begin: const Offset(0.95, 0.95));
  }

  Widget _buildQuickActionCard(BuildContext context, {required IconData icon, required String title, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.borderLight),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: AppColors.primary, size: 22),
            const SizedBox(height: 6),
            Text(
              title,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChartSegmentedControl(HostDashboardProvider dashboard) {
    const types = ['Earnings', 'Bookings', 'Views'];
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Row(
        children: types.map((type) {
          final isSelected = dashboard.selectedChartType == type;
          return Expanded(
            child: GestureDetector(
              onTap: () => dashboard.setChartType(type),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: isSelected
                      ? [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))]
                      : [],
                ),
                child: Center(
                  child: Text(
                    type,
                    style: TextStyle(
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                      color: isSelected ? Colors.white : AppColors.textSecondary,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    ).animate().fadeIn(delay: 250.ms);
  }

  Widget _buildDynamicChart(HostDashboardProvider dashboard) {
    if (dashboard.chartData.isEmpty) return const SizedBox.shrink();

    // Find max amount to scale the bars
    double maxAmount = 0;
    for (var data in dashboard.chartData) {
      if ((data['amount'] as num).toDouble() > maxAmount) {
        maxAmount = (data['amount'] as num).toDouble();
      }
    }
    if (maxAmount == 0) maxAmount = 1;

    String displayTitle = '';
    String displayValue = '';
    IconData displayIcon = Icons.trending_up_rounded;

    if (dashboard.selectedChartType == 'Earnings') {
      displayTitle = 'EARNINGS THIS MONTH';
      displayValue = '₹${dashboard.earningsThisMonth.toInt().toString().replaceAllMapped(RegExp(r'\\B(?=(\\d{3})+(?!\\d))'), (match) => ",")}';
      displayIcon = Icons.account_balance_wallet_rounded;
    } else if (dashboard.selectedChartType == 'Bookings') {
      displayTitle = 'TOTAL BOOKINGS (6 MO)';
      int totalBookings = dashboard.chartData.fold(0, (sum, item) => sum + (item['amount'] as num).toInt());
      displayValue = totalBookings.toString();
      displayIcon = Icons.calendar_month_rounded;
    } else {
      displayTitle = 'TOTAL VIEWS (6 MO)';
      int totalViews = dashboard.chartData.fold(0, (sum, item) => sum + (item['amount'] as num).toInt());
      displayValue = totalViews.toString().replaceAllMapped(RegExp(r'\\B(?=(\\d{3})+(?!\\d))'), (match) => ",");
      displayIcon = Icons.visibility_rounded;
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.primaryDark,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryDark.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    displayTitle,
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white.withOpacity(0.7), letterSpacing: 1.0),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    displayValue,
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(displayIcon, color: Colors.white, size: 24),
              ),
            ],
          ),
          const SizedBox(height: 32),
          SizedBox(
            height: 120,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: dashboard.chartData.asMap().entries.map((entry) {
                final index = entry.key;
                final data = entry.value;
                final amount = (data['amount'] as num).toDouble();
                final heightFactor = amount / maxAmount;
                final isCurrent = index == dashboard.chartData.length - 1;

                return Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 800),
                      curve: Curves.easeOutQuart,
                      height: 100 * heightFactor,
                      width: 32,
                      decoration: BoxDecoration(
                        color: isCurrent ? AppColors.accent : Colors.white.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ).animate(delay: (300 + (index * 100)).ms).slideY(begin: 1, end: 0),
                    const SizedBox(height: 8),
                    Text(
                      data['month'],
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                        color: Colors.white.withOpacity(0.8),
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1);
  }

  Widget _buildOverviewStats(HostDashboardProvider dashboard) {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            title: 'Active Listings',
            value: dashboard.activeListings.toString(),
            icon: Icons.home_work_rounded,
            delay: 400,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildStatCard(
            title: 'Pending Requests',
            value: dashboard.recentRequests.length.toString(),
            icon: Icons.notification_important_rounded,
            delay: 500,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard({required String title, required String value, required IconData icon, required int delay}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.primary, size: 28),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
        ],
      ),
    ).animate().fadeIn(delay: delay.ms).scale(begin: const Offset(0.9, 0.9));
  }

  Widget _buildUpcomingGuests(HostDashboardProvider dashboard) {
    if (dashboard.upcomingGuests.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Upcoming Guests',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ).animate().fadeIn(delay: 600.ms),
        const SizedBox(height: 16),
        SizedBox(
          height: 120,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: dashboard.upcomingGuests.length,
            itemBuilder: (context, index) {
              final booking = dashboard.upcomingGuests[index];
              return Container(
                width: 280,
                margin: const EdgeInsets.only(right: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundImage: AssetImage(booking.guestAvatar.isNotEmpty ? booking.guestAvatar : 'assets/images/users/user1.jpg'),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            booking.guestName.isNotEmpty ? booking.guestName : 'Guest',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            booking.stay.title.isNotEmpty ? booking.stay.title : 'Property',
                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Arrives in 2 days', // Dynamic calculation can be added here
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.accent),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(delay: (650 + (index * 100)).ms).slideX(begin: 0.2);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildRecentRequests(BuildContext context, HostDashboardProvider dashboard) {
    if (dashboard.recentRequests.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Booking Requests',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ).animate().fadeIn(delay: 800.ms),
        const SizedBox(height: 16),
        ...dashboard.recentRequests.map((booking) {
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundImage: AssetImage(booking.guestAvatar.isNotEmpty ? booking.guestAvatar : 'assets/images/users/user2.jpg'),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${booking.guestName.isNotEmpty ? booking.guestName : "A new guest"} requested to book',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                booking.stay.title.isNotEmpty ? booking.stay.title : 'Your property',
                                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                          Text(
                            '₹${booking.totalAmount}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          showDialog(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Decline Request'),
                              content: const Text('Are you sure you want to decline this booking request?'),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                TextButton(
                                  onPressed: () {
                                    dashboard.updateBookingStatus(booking.id, 'cancelled');
                                    Navigator.pop(ctx);
                                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Booking declined')));
                                  }, 
                                  child: const Text('Decline', style: TextStyle(color: Colors.red)),
                                ),
                              ],
                            ),
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.textPrimary,
                          side: const BorderSide(color: AppColors.borderLight),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Decline'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          dashboard.updateBookingStatus(booking.id, 'confirmed');
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Booking confirmed')));
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Approve'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ).animate().fadeIn(delay: 900.ms).slideY(begin: 0.1);
        }).toList(),
      ],
    );
  }
}

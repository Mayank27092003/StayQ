import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../providers/app_provider.dart';
import '../../providers/host_dashboard_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';
import 'onboarding/host_onboarding_screen.dart';
import 'host_availability_screen.dart';
import 'manage_listings_screen.dart';
import 'host_reservations_screen.dart';
import 'onboarding/screens/bank_details_screen.dart';
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
      _loadDashboardData();
    });
  }

  void _loadDashboardData() {
    final appProvider = context.read<AppProvider>();
    final currentUser = FirebaseAuth.instance.currentUser;
    final hostId = currentUser?.uid ?? appProvider.userId ?? 'mock_host_id';
    context.read<HostDashboardProvider>().fetchDashboardData(hostId);
  }

  String _resolveHostName(AppProvider appProvider, HostDashboardProvider dashboard) {
    if (dashboard.hostName.isNotEmpty && dashboard.hostName != 'Host' && dashboard.hostName != 'Guest') {
      return dashboard.hostName;
    }
    if (appProvider.userName.isNotEmpty && appProvider.userName != 'Guest') {
      return appProvider.userName;
    }
    final fbUser = FirebaseAuth.instance.currentUser;
    if (fbUser?.displayName != null && fbUser!.displayName!.isNotEmpty) {
      return fbUser.displayName!;
    }
    return 'Host Partner';
  }

  String _getTimeBasedGreeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return 'Good Morning';
    } else if (hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();
    final dashboard = context.watch<HostDashboardProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hostName = _resolveHostName(appProvider, dashboard);

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF13111C) : const Color(0xFFF8F9FD),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded, color: AppColors.textPrimary),
          onPressed: () {
            AppMotion.tapSelection();
            _showHostMenuSheet(context);
          },
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF5A31F4), Color(0xFF8B5CF6)]),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.stars_rounded, color: Colors.white, size: 14),
                  SizedBox(width: 4),
                  Text(
                    'HOST PORTAL',
                    style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.8),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          // Switch to Guest Mode Pill
          BouncingWidget(
            onTap: () {
              AppMotion.tapSelection();
              context.read<AppProvider>().toggleHostMode();
            },
            child: Container(
              margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.swap_horiz_rounded, color: AppColors.primary, size: 16),
                  SizedBox(width: 4),
                  Text(
                    'Guest Mode',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Host Avatar with Gold Verified Ring
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFF59E0B), width: 2),
              ),
              child: CircleAvatar(
                radius: 16,
                backgroundColor: AppColors.primary.withValues(alpha: 0.2),
                backgroundImage: (dashboard.hostAvatar.isNotEmpty && dashboard.hostAvatar.startsWith('http'))
                    ? NetworkImage(dashboard.hostAvatar)
                    : (appProvider.userAvatar.isNotEmpty && appProvider.userAvatar.startsWith('http'))
                        ? NetworkImage(appProvider.userAvatar)
                        : null,
                child: (dashboard.hostAvatar.isEmpty && (appProvider.userAvatar.isEmpty || !appProvider.userAvatar.startsWith('http')))
                    ? Text(
                        hostName.isNotEmpty ? hostName[0].toUpperCase() : 'H',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 13),
                      )
                    : null,
              ),
            ),
          ),
        ],
      ),
      body: dashboard.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async => _loadDashboardData(),
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. Dynamic Host Greeting & Status Badge
                    _buildDynamicGreeting(hostName, dashboard),
                    const SizedBox(height: 20),

                    // 2. Primary Revenue & Earnings Card
                    _buildPrimaryEarningsCard(dashboard, isDark),
                    const SizedBox(height: 20),

                    // 3. Quick Action Hub (6-Tile Luxury Matrix)
                    _buildQuickActionHub(context, isDark),
                    const SizedBox(height: 28),

                    // 4. Interactive Multi-Metric Analytics Chart
                    _buildChartSegmentedControl(dashboard),
                    _buildDynamicChart(dashboard, isDark),
                    const SizedBox(height: 28),

                    // 5. Secondary Performance KPIs
                    _buildPerformanceKpiGrid(dashboard, isDark),
                    const SizedBox(height: 28),

                    // 6. Upcoming Guests & Arrivals
                    _buildUpcomingGuests(dashboard, isDark),
                    const SizedBox(height: 28),

                    // 7. Real-Time Booking Requests
                    _buildRecentRequests(context, dashboard, isDark),
                    const SizedBox(height: 60),
                  ],
                ),
              ),
            ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // GREETING & HOST BADGES
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildDynamicGreeting(String hostName, HostDashboardProvider dashboard) {
    final greeting = _getTimeBasedGreeting();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$greeting,',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    hostName,
                    style: const TextStyle(
                      fontSize: 26,
                      height: 1.15,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                ],
              ),
            ),
            // Superhost & Verified Pill
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFFFEF3C7), Color(0xFFFDE68A)]),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.workspace_premium_rounded, color: Color(0xFFB45309), size: 16),
                  SizedBox(width: 4),
                  Text(
                    'SUPERHOST',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFFB45309)),
                  ),
                ],
              ),
            ),
          ],
        ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.2, end: 0),
        const SizedBox(height: 6),
        Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 14),
            const SizedBox(width: 6),
            Text(
              '${dashboard.activeListings} Active Listings (${dashboard.totalRooms > 0 ? "${dashboard.totalRooms} Rooms" : "Full Space"}) • Instant Payouts Active',
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
            ),
          ],
        ).animate().fadeIn(delay: 100.ms),
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRIMARY EARNINGS CARD
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildPrimaryEarningsCard(HostDashboardProvider dashboard, bool isDark) {
    final earnings = dashboard.earningsThisMonth.toInt();
    final formattedEarnings = earnings.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2C1654), Color(0xFF1E1035), Color(0xFF130924)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(26),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF5A31F4).withValues(alpha: 0.25),
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
              const Row(
                children: [
                  Icon(Icons.account_balance_wallet_rounded, color: Color(0xFFA78BFA), size: 18),
                  SizedBox(width: 8),
                  Text(
                    'MONTHLY NET EARNINGS',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFFA78BFA), letterSpacing: 1.0),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.trending_up_rounded, color: Color(0xFF10B981), size: 14),
                    SizedBox(width: 4),
                    Text(
                      '+18.4%',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              const Text(
                '₹',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFFA78BFA)),
              ),
              const SizedBox(width: 6),
              Text(
                formattedEarnings.isEmpty ? '0' : formattedEarnings,
                style: const TextStyle(fontSize: 40, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -1),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(color: Colors.white12),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Occupancy Rate: ${dashboard.occupancyRate.toInt()}%',
                style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.8), fontWeight: FontWeight.w600),
              ),
              Row(
                children: [
                  const Icon(Icons.star_rounded, color: Color(0xFFFBBF24), size: 16),
                  const SizedBox(width: 4),
                  Text(
                    '${dashboard.rating} (${dashboard.reviewCount} Reviews)',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(delay: 150.ms).scale(duration: 400.ms);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // QUICK ACTION HUB (6 LUXURY TILES)
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildQuickActionHub(BuildContext context, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Host Command Center',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 12),
        // Primary Listing Banner Button
        BouncingWidget(
          onTap: () {
            AppMotion.tapSelection();
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const HostOnboardingScreen(isAddingNewProperty: true)),
            );
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF5A31F4), Color(0xFF7C3AED)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.35),
                  blurRadius: 15,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: const Row(
              children: [
                Icon(Icons.add_home_work_rounded, color: Colors.white, size: 24),
                SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'List a New Space',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
                      Text(
                        'Villas, Hotels (100+ rooms), RVs, Campsites & Leases',
                        style: TextStyle(fontSize: 11, color: Colors.white70),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward_ios_rounded, color: Colors.white70, size: 16),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // 4 Grid Quick Action Cards
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.6,
          children: [
            _buildActionTile(
              icon: Icons.holiday_village_rounded,
              title: 'My Listings',
              subtitle: 'Manage & Edit Rooms',
              badge: '${context.watch<HostDashboardProvider>().activeListings} Active',
              isDark: isDark,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ManageListingsScreen())),
            ),
            _buildActionTile(
              icon: Icons.calendar_month_rounded,
              title: 'Calendar',
              subtitle: 'Block Dates & Rates',
              badge: 'Smart Sync',
              isDark: isDark,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HostAvailabilityScreen())),
            ),
            _buildActionTile(
              icon: Icons.receipt_long_rounded,
              title: 'Reservations',
              subtitle: 'Guest Bookings',
              badge: '${context.watch<HostDashboardProvider>().upcomingGuests.length} Guests',
              isDark: isDark,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const HostReservationsScreen())),
            ),
            _buildActionTile(
              icon: Icons.account_balance_rounded,
              title: 'Payouts & Bank',
              subtitle: 'Cashfree Fast Payout',
              badge: 'Verified',
              isDark: isDark,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BankDetailsScreen())),
            ),
          ],
        ),
      ],
    ).animate().fadeIn(delay: 200.ms);
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required String badge,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return BouncingWidget(
      onTap: () {
        AppMotion.tapSelection();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: AppColors.primary, size: 20),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    badge,
                    style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: Color(0xFF10B981)),
                  ),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                ),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 10.5, color: AppColors.textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTERACTIVE ANALYTICS CHART
  // ══════════════════════════════════════════════════════════════════════════
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
              onTap: () {
                AppMotion.tapSelection();
                dashboard.setChartType(type);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: isSelected
                      ? [BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 4))]
                      : [],
                ),
                child: Center(
                  child: Text(
                    type,
                    style: TextStyle(
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                      color: isSelected ? Colors.white : AppColors.textSecondary,
                      fontSize: 12.5,
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

  Widget _buildDynamicChart(HostDashboardProvider dashboard, bool isDark) {
    if (dashboard.chartData.isEmpty) return const SizedBox.shrink();

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
      displayTitle = 'MONTHLY REVENUE BREAKDOWN (6 MO)';
      displayValue = '₹${dashboard.earningsThisMonth.toInt().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => "${m[1]},")}';
      displayIcon = Icons.account_balance_wallet_rounded;
    } else if (dashboard.selectedChartType == 'Bookings') {
      displayTitle = 'TOTAL GUEST BOOKINGS (6 MO)';
      int totalBookings = dashboard.chartData.fold(0, (sum, item) => sum + (item['amount'] as num).toInt());
      displayValue = '$totalBookings Bookings';
      displayIcon = Icons.calendar_month_rounded;
    } else {
      displayTitle = 'TOTAL LISTING IMPRESSIONS & VIEWS';
      int totalViews = dashboard.chartData.fold(0, (sum, item) => sum + (item['amount'] as num).toInt());
      displayValue = totalViews.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => "${m[1]},");
      displayIcon = Icons.visibility_rounded;
    }

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF261842), Color(0xFF191428)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
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
                    style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Colors.white.withValues(alpha: 0.7), letterSpacing: 0.8),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    displayValue,
                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(displayIcon, color: Colors.white, size: 22),
              ),
            ],
          ),
          const SizedBox(height: 28),
          SizedBox(
            height: 120,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: dashboard.chartData.asMap().entries.map((entry) {
                final index = entry.key;
                final data = entry.value;
                final amount = (data['amount'] as num).toDouble();
                final heightFactor = (amount / maxAmount).clamp(0.08, 1.0);
                final isCurrent = index == dashboard.chartData.length - 1;

                return Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 800),
                      curve: Curves.easeOutQuart,
                      height: 85 * heightFactor,
                      width: 32,
                      decoration: BoxDecoration(
                        gradient: isCurrent
                            ? const LinearGradient(
                                colors: [Color(0xFFF59E0B), Color(0xFFFBBF24)],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              )
                            : LinearGradient(
                                colors: [const Color(0xFF8B5CF6), const Color(0xFF5A31F4).withValues(alpha: 0.4)],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ).animate(delay: (200 + (index * 80)).ms).slideY(begin: 1, end: 0),
                    const SizedBox(height: 8),
                    Text(
                      data['month'],
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECONDARY PERFORMANCE KPIS
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildPerformanceKpiGrid(HostDashboardProvider dashboard, bool isDark) {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            title: 'Active Listings',
            value: '${dashboard.activeListings} Places',
            icon: Icons.home_work_rounded,
            color: AppColors.primary,
            isDark: isDark,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: _buildStatCard(
            title: 'Pending Requests',
            value: '${dashboard.recentRequests.length} Pending',
            icon: Icons.notification_important_rounded,
            color: const Color(0xFFF59E0B),
            isDark: isDark,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UPCOMING GUESTS CAROUSEL
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildUpcomingGuests(HostDashboardProvider dashboard, bool isDark) {
    if (dashboard.upcomingGuests.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Upcoming Guest Arrivals',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
            ),
            Text(
              'Confirmed',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
            ),
          ],
        ),
        const SizedBox(height: 14),
        SizedBox(
          height: 130,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            itemCount: dashboard.upcomingGuests.length,
            itemBuilder: (context, index) {
              final booking = dashboard.upcomingGuests[index];
              return Container(
                width: 290,
                margin: const EdgeInsets.only(right: 14),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4)),
                  ],
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 26,
                      backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                      backgroundImage: booking.guestAvatar.isNotEmpty ? NetworkImage(booking.guestAvatar) : null,
                      child: booking.guestAvatar.isEmpty
                          ? Text(
                              booking.guestName.isNotEmpty ? booking.guestName[0] : 'G',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                            )
                          : null,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            booking.guestName.isNotEmpty ? booking.guestName : 'Guest',
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: AppColors.textPrimary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            booking.stay.title.isNotEmpty ? booking.stay.title : 'Property Space',
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              '✓ Check-in Ready',
                              style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Color(0xFF047857)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RECENT REQUESTS & APPROVALS
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildRecentRequests(BuildContext context, HostDashboardProvider dashboard, bool isDark) {
    if (dashboard.recentRequests.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Pending Booking Approvals',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 14),
        ...dashboard.recentRequests.map((booking) {
          return Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                      child: Text(
                        booking.guestName.isNotEmpty ? booking.guestName[0] : 'G',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${booking.guestName.isNotEmpty ? booking.guestName : "Guest"} requested booking',
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14, color: AppColors.textPrimary),
                          ),
                          Text(
                            booking.stay.title.isNotEmpty ? booking.stay.title : 'Your Property',
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '₹${booking.totalAmount.toInt()}',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: AppColors.primary),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          AppMotion.tapSelection();
                          dashboard.updateBookingStatus(booking.id, 'cancelled');
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Booking declined')));
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.redAccent,
                          side: const BorderSide(color: Colors.redAccent),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Decline', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          AppMotion.tapSelection();
                          dashboard.updateBookingStatus(booking.id, 'confirmed');
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('✓ Booking approved successfully!'),
                              backgroundColor: Color(0xFF10B981),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          elevation: 2,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Approve & Confirm', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        }).toList(),
      ],
    );
  }

  void _showHostMenuSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.account_balance_rounded, color: AppColors.primary),
              title: const Text('Payout & Bank Account (Cashfree)', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: const Text('Manage IFSC, PAN and UPI Payouts'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const BankDetailsScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.security_rounded, color: AppColors.primary),
              title: const Text('Host Security & Verification', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: const Text('Two-factor authentication & KYC'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const SecurityScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.support_agent_rounded, color: AppColors.primary),
              title: const Text('Host 24/7 Priority Support', style: TextStyle(fontWeight: FontWeight.w700)),
              subtitle: const Text('Direct line to Stay Q Host Concierge'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(context, MaterialPageRoute(builder: (_) => const SupportScreen()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.swap_horiz_rounded, color: AppColors.primary),
              title: const Text('Switch to Guest Mode', style: TextStyle(fontWeight: FontWeight.w700)),
              onTap: () {
                context.read<AppProvider>().toggleHostMode();
                Navigator.pop(context);
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

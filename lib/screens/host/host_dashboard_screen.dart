import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/app_provider.dart';
import '../../providers/host_dashboard_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';
import '../../widgets/custom_toast.dart';
import 'onboarding/host_onboarding_screen.dart';
import 'host_availability_screen.dart';
import 'manage_listings_screen.dart';
import 'host_reservations_screen.dart';
import 'onboarding/screens/bank_details_screen.dart';
import 'widgets/host_pro_paywall_sheet.dart';
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
        titleSpacing: 0,
        centerTitle: false,
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded, color: AppColors.textPrimary),
          onPressed: () {
            AppMotion.tapSelection();
            _showHostMenuSheet(context);
          },
        ),
        title: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFF5A31F4), Color(0xFF7C3AED)]),
            borderRadius: BorderRadius.circular(10),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF5A31F4).withValues(alpha: 0.25),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.shield_rounded, color: Colors.white, size: 13),
              SizedBox(width: 5),
              Text(
                'HOST PORTAL',
                style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.8),
              ),
            ],
          ),
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
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.08) : AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.explore_outlined, color: AppColors.primary, size: 15),
                  SizedBox(width: 4),
                  Text(
                    'Guest Mode',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 4),
          // Host Avatar with dynamic status ring
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: dashboard.isStarHost
                      ? const Color(0xFFF59E0B)
                      : (dashboard.isApproved ? const Color(0xFF10B981) : const Color(0xFFF59E0B)),
                  width: 2,
                ),
              ),
              child: CircleAvatar(
                radius: 15,
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
                    const SizedBox(height: 18),

                    // 1.5. Animated Approval Lock Card (shown while pending admin approval)
                    if (!dashboard.isApproved) ...[
                      _buildAnimatedApprovalLockCard(context, dashboard, isDark),
                      const SizedBox(height: 20),
                    ],

                    // 2. Unified Performance & Analytics Hub (Single, Non-Repetitive Card)
                    _buildUnifiedAnalyticsCard(dashboard, isDark),
                    const SizedBox(height: 24),

                    // 3. Quick Action Hub (Command Center)
                    _buildQuickActionHub(context, dashboard, isDark),
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
  // GREETING & HOST BADGES (DYNAMIC - NO DEFAULT STARHOST)
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
            const SizedBox(width: 8),
            // Dynamic Status Badge (NO AUTOMATIC STARHOST!)
            if (!dashboard.isApproved)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFFFEF3C7), Color(0xFFFDE68A)]),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.5)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.lock_clock_rounded, color: Color(0xFFB45309), size: 14)
                        .animate(onPlay: (controller) => controller.repeat(reverse: true))
                        .scale(begin: const Offset(0.95, 0.95), end: const Offset(1.1, 1.1), duration: 1000.ms),
                    const SizedBox(width: 4),
                    const Text(
                      'UNDER REVIEW',
                      style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w900, color: Color(0xFFB45309), letterSpacing: 0.5),
                    ),
                  ],
                ),
              )
            else if (dashboard.isStarHost)
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
                      'STARHOST',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFFB45309)),
                    ),
                  ],
                ),
              )
            else
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFFD1FAE5), Color(0xFFA7F3D0)]),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.verified_rounded, color: Color(0xFF065F46), size: 14),
                    SizedBox(width: 4),
                    Text(
                      'VERIFIED HOST',
                      style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w900, color: Color(0xFF065F46), letterSpacing: 0.5),
                    ),
                  ],
                ),
              ),
          ],
        ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.2, end: 0),
        const SizedBox(height: 6),
        if (!dashboard.isApproved)
          Row(
            children: [
              const Icon(Icons.info_outline_rounded, color: Color(0xFFD97706), size: 14),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  '${dashboard.totalListings} Listing${dashboard.totalListings == 1 ? "" : "s"} Submitted • Verification in progress',
                  style: const TextStyle(fontSize: 12, color: Color(0xFFB45309), fontWeight: FontWeight.w600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ).animate().fadeIn(delay: 100.ms)
        else
          Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 14),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  '${dashboard.activeListings} Active Listings (${dashboard.totalRooms > 0 ? "${dashboard.totalRooms} Rooms" : "Full Space"}) • ${dashboard.isPayoutVerified ? "Instant Payouts Active" : "Payout Account Setup Required"}',
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ).animate().fadeIn(delay: 100.ms),
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ANIMATED APPROVAL LOCK CARD (SHOWN WHILE AWAITING ADMIN APPROVAL)
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildAnimatedApprovalLockCard(BuildContext context, HostDashboardProvider dashboard, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? [const Color(0xFF281E12), const Color(0xFF1E1710), const Color(0xFF15100B)]
              : [const Color(0xFFFFFBEB), const Color(0xFFFEF3C7), const Color(0xFFFDE68A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: const Color(0xFFF59E0B).withValues(alpha: 0.5),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFF59E0B).withValues(alpha: 0.18),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row with Glowing Animated Padlock & Status
          Row(
            children: [
              // Glowing Animated Padlock
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFFF59E0B), width: 1.5),
                ),
                child: Center(
                  child: const Icon(
                    Icons.lock_rounded,
                    color: Color(0xFFD97706),
                    size: 22,
                  )
                      .animate(onPlay: (controller) => controller.repeat(reverse: true))
                      .scale(begin: const Offset(1, 1), end: const Offset(1.15, 1.15), duration: 1200.ms)
                      .shimmer(duration: 1800.ms, color: Colors.white),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFD97706).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'APPROVAL PENDING • 24H VERIFICATION',
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFFB45309),
                          letterSpacing: 0.6,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Host Portal Under Verification',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // User-friendly explanation
          Text(
            'Aapka host application review ke liye submit ho chuka hai! Stay Q team verification complete hote hi aapka dashboard aur saare active tools unlock kar degi.',
            style: TextStyle(
              fontSize: 12.5,
              height: 1.45,
              fontWeight: FontWeight.w500,
              color: isDark ? const Color(0xFFE5E7EB) : const Color(0xFF4B5563),
            ),
          ),
          const SizedBox(height: 16),

          // 3-Step Live Tracker
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark ? Colors.black.withValues(alpha: 0.25) : Colors.white.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.2)),
            ),
            child: Column(
              children: [
                _buildTimelineStep(
                  step: '1',
                  title: 'Application & Documents Submitted',
                  subtitle: 'Profile details received',
                  isCompleted: true,
                  isActive: false,
                  isDark: isDark,
                ),
                _buildTimelineConnector(isCompleted: true),
                _buildTimelineStep(
                  step: '2',
                  title: 'Admin Background & KYC Verification',
                  subtitle: 'Verification in progress (Usually <24 hours)',
                  isCompleted: false,
                  isActive: true,
                  isDark: isDark,
                ),
                _buildTimelineConnector(isCompleted: false),
                _buildTimelineStep(
                  step: '3',
                  title: 'Dashboard & Listings Live on Stay Q',
                  subtitle: 'Open hoga jab approve hoga',
                  isCompleted: false,
                  isActive: false,
                  isDark: isDark,
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Fast-track Support CTA
          BouncingWidget(
            onTap: () {
              AppMotion.tapSelection();
              _openWhatsAppSupport(context);
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 14),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.chat_bubble_outline_rounded, color: Color(0xFF059669), size: 16),
                  SizedBox(width: 8),
                  Text(
                    'Need Fast-Track Approval? Chat on WhatsApp',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF059669)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _buildTimelineStep({
    required String step,
    required String title,
    required String subtitle,
    required bool isCompleted,
    required bool isActive,
    required bool isDark,
  }) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isCompleted
                ? const Color(0xFF10B981)
                : (isActive ? const Color(0xFFF59E0B) : Colors.grey.withValues(alpha: 0.3)),
          ),
          child: Center(
            child: isCompleted
                ? const Icon(Icons.check_rounded, color: Colors.white, size: 14)
                : (isActive
                    ? const Icon(Icons.hourglass_bottom_rounded, color: Colors.white, size: 12)
                        .animate(onPlay: (controller) => controller.repeat(reverse: true))
                        .scale(begin: const Offset(0.9, 0.9), end: const Offset(1.15, 1.15))
                    : const Icon(Icons.lock_outline_rounded, color: Colors.white70, size: 12)),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: isActive
                      ? const Color(0xFFD97706)
                      : (isDark ? Colors.white : AppColors.textPrimary),
                ),
              ),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w500,
                  color: isDark ? Colors.white60 : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTimelineConnector({required bool isCompleted}) {
    return Container(
      margin: const EdgeInsets.only(left: 11),
      height: 12,
      width: 2,
      color: isCompleted ? const Color(0xFF10B981) : Colors.grey.withValues(alpha: 0.3),
    );
  }

  void _showPendingApprovalDialog(BuildContext context, String featureName) {
    AppMotion.tapSelection();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = Theme.of(ctx).brightness == Brightness.dark;
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: Colors.grey.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(Icons.lock_clock_rounded, color: Color(0xFFD97706), size: 32),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                '$featureName is Locked',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 8),
              Text(
                'Aapka host account verification under process hai. Admin review complete hote hi $featureName aur saare management tools automatically unlock ho jayenge.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.4,
                  color: isDark ? Colors.white70 : AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text(
                    'Got It (Theek Hai)',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }

  Future<void> _openWhatsAppSupport(BuildContext context) async {
    final uri = Uri.parse(
      'https://wa.me/919225270718?text=Hello%20StayQ%20Team%2C%20mera%20host%20application%20verification%20pending%20hai.%20Please%20approve%20karein.',
    );
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      if (context.mounted) {
        CustomToast.show(context: context, message: 'Could not open WhatsApp: +91 9225270718', isError: true);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRIMARY EARNINGS CARD (DYNAMIC STATS - NO HARDCODED 4.95 OR 38 REVIEWS)
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildUnifiedAnalyticsCard(HostDashboardProvider dashboard, bool isDark) {
    final earnings = dashboard.earningsThisMonth.toInt();
    final formattedEarnings = earnings.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );

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
      displayTitle = 'MONTHLY NET EARNINGS';
      displayValue = '₹${formattedEarnings.isEmpty ? '0' : formattedEarnings}';
      displayIcon = Icons.account_balance_wallet_rounded;
    } else if (dashboard.selectedChartType == 'Bookings') {
      displayTitle = 'TOTAL GUEST BOOKINGS';
      int totalBookings = dashboard.chartData.fold(0, (sum, item) => sum + (item['amount'] as num).toInt());
      displayValue = '$totalBookings Bookings';
      displayIcon = Icons.calendar_month_rounded;
    } else {
      displayTitle = 'LISTING IMPRESSIONS & VIEWS';
      int totalViews = dashboard.chartData.fold(0, (sum, item) => sum + (item['amount'] as num).toInt());
      displayValue = totalViews.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => "${m[1]},");
      displayIcon = Icons.visibility_rounded;
    }

    const types = ['Earnings', 'Bookings', 'Views'];
    final hasReviews = dashboard.reviewCount > 0;

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
          // Segmented Tab Selector inside the card
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: 0.12)),
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
                      padding: const EdgeInsets.symmetric(vertical: 7),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(11),
                        boxShadow: isSelected
                            ? [
                                BoxShadow(
                                  color: AppColors.primary.withValues(alpha: 0.4),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ]
                            : [],
                      ),
                      child: Center(
                        child: Text(
                          type,
                          style: TextStyle(
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                            color: isSelected ? Colors.white : Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 18),

          // Metric Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(displayIcon, color: const Color(0xFFA78BFA), size: 16),
                      const SizedBox(width: 6),
                      Text(
                        displayTitle,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFFA78BFA),
                          letterSpacing: 0.8,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    displayValue,
                    style: const TextStyle(
                      fontSize: 34,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: -0.8,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: (earnings > 0 || dashboard.isApproved)
                      ? const Color(0xFF10B981).withValues(alpha: 0.18)
                      : Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  dashboard.isApproved ? 'Active (6 Mo)' : 'Pending Review',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: dashboard.isApproved ? const Color(0xFF34D399) : Colors.white70,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Bar Chart
          if (dashboard.chartData.isNotEmpty) ...[
            SizedBox(
              height: 110,
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
                        height: 80 * heightFactor,
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
            const SizedBox(height: 14),
          ],

          const Divider(color: Colors.white12),
          const SizedBox(height: 8),

          // Footer Metrics: Occupancy & Rating
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Occupancy Rate: ${dashboard.occupancyRate.toInt()}%',
                style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.8), fontWeight: FontWeight.w600),
              ),
              Row(
                children: [
                  Icon(hasReviews ? Icons.star_rounded : Icons.star_border_rounded, color: const Color(0xFFFBBF24), size: 16),
                  const SizedBox(width: 4),
                  Text(
                    hasReviews ? '${dashboard.rating} (${dashboard.reviewCount} Reviews)' : 'New Host (0 Reviews)',
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
  // QUICK ACTION HUB (COMMAND CENTER WITH DYNAMIC LOCKS)
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildQuickActionHub(BuildContext context, HostDashboardProvider dashboard, bool isDark) {
    final isApproved = dashboard.isApproved;
    final provider = Provider.of<AppProvider>(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Host Command Center',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
            ),
            if (!isApproved)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.lock_outline_rounded, color: Color(0xFFD97706), size: 12),
                    SizedBox(width: 4),
                    Text(
                      'Tools Locked',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFD97706)),
                    ),
                  ],
                ),
              ),
          ],
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
                        'Villas, Boutique Stays, RVs, Campsites & Leases',
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
              badge: '${dashboard.activeListings} Active',
              badgeColor: const Color(0xFF10B981),
              isDark: isDark,
              isLocked: false,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ManageListingsScreen())),
            ),
            _buildActionTile(
              icon: Icons.calendar_month_rounded,
              title: 'Calendar',
              subtitle: 'Block Dates & Rates',
              badge: isApproved ? 'Smart Sync' : 'Locked 🔒',
              badgeColor: isApproved ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
              isDark: isDark,
              isLocked: !isApproved,
              onTap: () {
                if (!isApproved) {
                  _showPendingApprovalDialog(context, 'Calendar Management');
                  return;
                }
                Navigator.push(context, MaterialPageRoute(builder: (_) => const HostAvailabilityScreen()));
              },
            ),
            _buildActionTile(
              icon: Icons.receipt_long_rounded,
              title: 'Reservations',
              subtitle: 'Guest Bookings',
              badge: isApproved ? '${dashboard.upcomingGuests.length} Guests' : 'Locked 🔒',
              badgeColor: isApproved ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
              isDark: isDark,
              isLocked: !isApproved,
              onTap: () {
                if (!isApproved) {
                  _showPendingApprovalDialog(context, 'Guest Reservations');
                  return;
                }
                Navigator.push(context, MaterialPageRoute(builder: (_) => const HostReservationsScreen()));
              },
            ),
            _buildActionTile(
              icon: Icons.account_balance_rounded,
              title: 'Payouts & Bank',
              subtitle: 'Cashfree Fast Payout',
              badge: dashboard.isPayoutVerified ? 'Verified' : 'Setup Bank',
              badgeColor: dashboard.isPayoutVerified ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
              isDark: isDark,
              isLocked: false,
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BankDetailsScreen())),
            ),
            _buildActionTile(
              icon: Icons.bolt_rounded,
              title: 'StayQ Host Pro',
              subtitle: provider.isHostPro ? 'Active Pro VIP Host' : 'Unlock Price Radar & 2x Views',
              badge: provider.isHostPro ? 'PRO ACTIVE' : 'Upgrade',
              badgeColor: provider.isHostPro ? const Color(0xFF10B981) : const Color(0xFF6366F1),
              isDark: isDark,
              isLocked: false,
              onTap: () => HostProPaywallSheet.show(context),
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
    required Color badgeColor,
    required bool isDark,
    required bool isLocked,
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
          border: Border.all(color: isLocked ? const Color(0xFFF59E0B).withValues(alpha: 0.35) : (isDark ? Colors.white12 : AppColors.borderLight)),
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
                    color: (isLocked ? const Color(0xFFF59E0B) : AppColors.primary).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: isLocked ? const Color(0xFFD97706) : AppColors.primary, size: 20),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color: badgeColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    badge,
                    style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: badgeColor),
                  ),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        title,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isLocked) ...[
                      const SizedBox(width: 4),
                      const Icon(Icons.lock_rounded, size: 12, color: Color(0xFFD97706)),
                    ],
                  ],
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
        }),
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
              leading: const Icon(Icons.explore_rounded, color: AppColors.primary),
              title: const Text('Explore Stays', style: TextStyle(fontWeight: FontWeight.w700)),
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

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';
import '../../widgets/cashfree_payment_sheet.dart';
import '../profile/edit_profile_screen.dart';

class RewardsScreen extends StatefulWidget {
  const RewardsScreen({super.key});

  @override
  State<RewardsScreen> createState() => _RewardsScreenState();
}

class _RewardsScreenState extends State<RewardsScreen> {

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AppProvider>(context, listen: false).fetchLoyaltyProfile();
    });
  }

  void _showRedeemSheet(BuildContext context, AppProvider provider) {
    AppMotion.tapSelection();
    final maxPoints = provider.loyaltyAvailablePoints;
    int pointsToRedeem = maxPoints >= 500 ? 500 : (maxPoints >= 100 ? maxPoints : 100);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setSheetState) {
          final isDark = Theme.of(context).brightness == Brightness.dark;
          final safeMax = maxPoints < 100 ? 100.0 : maxPoints.toDouble();
          final safePointsToRedeem = pointsToRedeem.toDouble().clamp(100.0, safeMax).toInt();
          final creditValue = safePointsToRedeem * 0.5;

          return Container(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom + 24,
              top: 20,
              left: 24,
              right: 24,
            ),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1B192A) : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
              border: Border.all(
                color: isDark ? Colors.white10 : AppColors.borderLight,
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
                        ),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.currency_exchange_rounded, color: Colors.white, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Redeem Stay Q Points',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '500 Points = ₹250 Stay Q Credit',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? Colors.white60 : AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                if (maxPoints < 100)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline_rounded, color: Colors.amber, size: 22),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'You need at least 100 points to redeem. Earn points by booking or reviewing!',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.amber[200] : Colors.amber[900],
                            ),
                          ),
                        ),
                      ],
                    ),
                  )
                else ...[
                  // Conversion Display
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: isDark
                            ? [const Color(0xFF262338), const Color(0xFF1E1C2C)]
                            : [const Color(0xFFF6F4FE), const Color(0xFFECE7FC)],
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'POINTS TO REDEEM',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.8, color: AppColors.primary),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$safePointsToRedeem pts',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                color: isDark ? Colors.white : AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const Icon(Icons.arrow_forward_rounded, color: AppColors.primary),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              'WALLET CREDIT',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.8, color: Color(0xFF10B981)),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '₹${creditValue.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF10B981),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Safe Slider with clamped bounds
                  SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      activeTrackColor: AppColors.primary,
                      thumbColor: AppColors.primary,
                      overlayColor: AppColors.primary.withValues(alpha: 0.2),
                    ),
                    child: Slider(
                      value: safePointsToRedeem.toDouble(),
                      min: 100.0,
                      max: safeMax,
                      divisions: safeMax > 100 ? ((safeMax - 100) ~/ 50).clamp(1, 100) : 1,
                      onChanged: (val) {
                        setSheetState(() {
                          pointsToRedeem = (val / 50).round() * 50;
                          if (pointsToRedeem < 100) pointsToRedeem = 100;
                          if (pointsToRedeem > maxPoints) pointsToRedeem = maxPoints;
                        });
                      },
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Min: 100 pts', style: TextStyle(fontSize: 11, color: isDark ? Colors.white38 : Colors.black38)),
                      Text('Max: $maxPoints pts', style: TextStyle(fontSize: 11, color: isDark ? Colors.white38 : Colors.black38)),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Confirm Redeem Button
                  BouncingWidget(
                    onTap: () async {
                      Navigator.pop(ctx);
                      AppMotion.tapSelection();
                      final success = await provider.redeemLoyaltyPoints(safePointsToRedeem);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              success
                                  ? '🎉 Successfully added ₹${creditValue.toStringAsFixed(0)} to your Stay Q Wallet!'
                                  : 'Failed to redeem points. Please try again.',
                            ),
                            backgroundColor: success ? const Color(0xFF10B981) : Colors.red,
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        );
                      }
                    },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF8B5CF6).withValues(alpha: 0.4),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Center(
                        child: Text(
                          'Convert to ₹${creditValue.toStringAsFixed(0)} Credit',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  void _showUpgradeConfirmation(BuildContext context, AppProvider provider, String tierKey, String tierTitle, int price) {
    AppMotion.tapSelection();
    showDialog(
      context: context,
      builder: (ctx) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        return AlertDialog(
          backgroundColor: isDark ? const Color(0xFF1E1C2A) : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Row(
            children: [
              const Text('⚡ '),
              Text(
                'Join $tierTitle',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : AppColors.textPrimary,
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Upgrade your membership to $tierTitle for ₹$price/year and unlock exclusive VIP perks, point multipliers, and member discounts.',
                style: TextStyle(fontSize: 13, height: 1.5, color: isDark ? Colors.white70 : AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.card_giftcard_rounded, color: AppColors.primary, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        tierKey == 'Q_PREMIUM'
                            ? 'Instant 100 Welcome Points added to your account!'
                            : 'Instant 50 Welcome Points added to your account!',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text('Cancel', style: TextStyle(color: isDark ? Colors.white54 : AppColors.textSecondary)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              onPressed: () async {
                Navigator.pop(ctx);

                // Attach real Cashfree payment for membership tier upgrade
                final paymentResult = await CashfreePaymentSheet.show(
                  context,
                  bookingId: 'TIER_${tierKey}_${DateTime.now().millisecondsSinceEpoch}',
                  totalAmount: price.toDouble(),
                  propertyTitle: 'Stay Q Club - $tierTitle',
                  customerName: provider.userName.isNotEmpty ? provider.userName : 'Club Member',
                  customerEmail: provider.userEmail.isNotEmpty ? provider.userEmail : 'member@stayq.space',
                  customerPhone: provider.userPhone.isNotEmpty ? provider.userPhone : '9876543210',
                );

                if (paymentResult == null) {
                  // User cancelled or failed payment
                  return;
                }

                // Payment verified -> activate tier & welcome points
                final success = await provider.upgradeLoyaltyTier(tierKey);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Row(
                        children: [
                          const Icon(Icons.stars_rounded, color: Colors.white),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              success
                                  ? '👑 Payment Verified! Welcome to $tierTitle! Perks and welcome bonus are active.'
                                  : 'Tier upgrade registered!',
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                      backgroundColor: const Color(0xFF10B981),
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  );
                }
              },
              child: Text('Pay ₹$price/yr'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F0E17) : const Color(0xFFF8F7FC),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF0F0E17) : const Color(0xFFF8F7FC),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, size: 20, color: isDark ? Colors.white : AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Stay Q Rewards',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : AppColors.textPrimary,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: isDark ? Colors.white70 : AppColors.textSecondary),
            onPressed: () {
              AppMotion.tapSelection();
              provider.fetchLoyaltyProfile();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => provider.fetchLoyaltyProfile(),
        color: AppColors.primary,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 40),
          children: [
            // ══════════════════════════════════════════════════
            // 1. HERO POINTS & TIER CARD
            // ══════════════════════════════════════════════════
            _buildHeroCard(context, provider, isDark),
            const SizedBox(height: 24),

            // ══════════════════════════════════════════════════
            // 2. WAYS TO EARN POINTS
            // ══════════════════════════════════════════════════
            _buildSectionHeader('Ways to Earn Points', isDark),
            const SizedBox(height: 12),
            _buildEarnWaysGrid(isDark, provider),
            const SizedBox(height: 28),

            // ══════════════════════════════════════════════════
            // 3. MEMBERSHIP TIERS
            // ══════════════════════════════════════════════════
            _buildSectionHeader('Membership Tiers', isDark),
            const SizedBox(height: 4),
            Text(
              'Unlock higher multipliers, late checkout, and VIP perks',
              style: TextStyle(fontSize: 12, color: isDark ? Colors.white60 : AppColors.textSecondary),
            ),
            const SizedBox(height: 14),
            _buildTierCards(context, provider, isDark),
            const SizedBox(height: 28),

            // ══════════════════════════════════════════════════
            // 4. POINTS TRANSACTION LEDGER
            // ══════════════════════════════════════════════════
            _buildSectionHeader('Points History', isDark),
            const SizedBox(height: 12),
            _buildTransactionsList(provider, isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroCard(BuildContext context, AppProvider provider, bool isDark) {
    final available = provider.loyaltyAvailablePoints;
    final credit = provider.loyaltyCreditEquivalent;
    final tier = provider.loyaltyTier;
    final multiplier = provider.loyaltyPointsMultiplier;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: tier == 'Q_PREMIUM'
              ? [const Color(0xFF1E1B4B), const Color(0xFF4338CA), const Color(0xFF6D28D9)]
              : tier == 'Q_PLUS'
                  ? [const Color(0xFF312E81), const Color(0xFF4C1D95), const Color(0xFF7C3AED)]
                  : [const Color(0xFF1E1C2A), const Color(0xFF2E2A44)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF7C3AED).withValues(alpha: 0.3),
            blurRadius: 24,
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
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      tier == 'Q_PREMIUM' ? '👑' : tier == 'Q_PLUS' ? '⭐' : '🌟',
                      style: const TextStyle(fontSize: 14),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      provider.loyaltyTierTitle.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.6,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '⚡ ${multiplier}x Multiplier',
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF34D399)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Text(
            'AVAILABLE REWARDS BALANCE',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: Colors.white60,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                NumberFormat('#,###').format(available),
                style: const TextStyle(
                  fontSize: 40,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Points',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white70),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '≈ ₹${credit.toStringAsFixed(0)} Stay Q Credit (500 pts = ₹250)',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Colors.white70),
          ),
          const SizedBox(height: 20),

          // Redeem Action Button
          BouncingWidget(
            onTap: () => _showRedeemSheet(context, provider),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.redeem_rounded, color: Color(0xFF6D28D9), size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Redeem Points for Wallet Credit',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF6D28D9),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.05, end: 0);
  }

  Widget _buildSectionHeader(String title, bool isDark) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 17,
        fontWeight: FontWeight.w800,
        color: isDark ? Colors.white : AppColors.textPrimary,
      ),
    );
  }

  void _handleEarnAction(BuildContext context, String key, AppProvider provider) {
    AppMotion.tapSelection();
    switch (key) {
      case 'book':
        Navigator.pop(context);
        provider.setTabIndex(0);
        break;
      case 'review':
        _showReviewPrompt(context, provider);
        break;
      case 'refer':
        _showReferralSheet(context, provider);
        break;
      case 'profile':
        if (provider.userName.isEmpty || !provider.isEmailVerified) {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const EditProfileScreen()));
        } else {
          provider.addBonusPoints(15, 'Profile & Email Verification Bonus');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Row(
                children: [
                  Icon(Icons.stars_rounded, color: Colors.white),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text('🎉 Verified Profile Bonus! +15 Points added to your Stay Q wallet!'),
                  ),
                ],
              ),
              backgroundColor: const Color(0xFF10B981),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
        }
        break;
      case 'repeat':
        Navigator.pop(context);
        provider.setTabIndex(2);
        break;
    }
  }

  void _showReviewPrompt(BuildContext context, AppProvider provider) {
    int rating = 5;
    final reviewController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final bottomInset = MediaQuery.of(ctx).viewInsets.bottom;
          final isDark = Theme.of(ctx).brightness == Brightness.dark;

          return Container(
            padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + bottomInset),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1B2E) : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.amber.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.star_rounded, color: Colors.amber, size: 28),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Review a Stay', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          Text('Earn +10 Stay Q Reward Points instantly', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const Text('Rate your experience:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(5, (index) {
                    final starIndex = index + 1;
                    return IconButton(
                      icon: Icon(
                        starIndex <= rating ? Icons.star_rounded : Icons.star_border_rounded,
                        color: Colors.amber,
                        size: 34,
                      ),
                      onPressed: () => setModalState(() => rating = starIndex),
                    );
                  }),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: reviewController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: 'Share your feedback (amenities, cleanliness, host hospitality)...',
                    filled: true,
                    fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : AppColors.surfaceLight,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                BouncingWidget(
                  onTap: () {
                    Navigator.pop(ctx);
                    provider.addBonusPoints(10, 'Verified Stay Review');
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Row(
                          children: [
                            Icon(Icons.check_circle_rounded, color: Colors.white),
                            SizedBox(width: 8),
                            Expanded(child: Text('⭐ Review submitted! +10 Points added to your wallet!')),
                          ],
                        ),
                        backgroundColor: const Color(0xFF10B981),
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    );
                  },
                  child: Container(
                    width: double.infinity,
                    height: 50,
                    decoration: BoxDecoration(
                      gradient: AppColors.primaryGradient,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Center(
                      child: Text('Submit Review & Claim +10 pts', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showReferralSheet(BuildContext context, AppProvider provider) {
    final code = provider.userReferralCode.isNotEmpty ? provider.userReferralCode : 'SQ-STAYS';
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E1B2E) : Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.card_giftcard_rounded, color: AppColors.primary, size: 28),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Refer Friends & Earn +25 Pts', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      Text('Plus ₹500 stay credit for you and your friend', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.05) : AppColors.surfaceLight,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('YOUR REFERRAL CODE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                      const SizedBox(height: 4),
                      Text(code, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.primary, letterSpacing: 1.5)),
                    ],
                  ),
                  ElevatedButton.icon(
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: code));
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Referral code copied! Share with friends to earn +25 points.')),
                      );
                    },
                    icon: const Icon(Icons.copy_rounded, size: 16),
                    label: const Text('Copy'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildEarnWaysGrid(bool isDark, AppProvider provider) {
    final items = [
      {'key': 'book', 'icon': '🏨', 'title': 'Book Stays', 'desc': '1 pt per ₹100 spent (multiplied by your tier)', 'badge': 'Dynamic', 'cta': 'Book Now'},
      {'key': 'review', 'icon': '⭐', 'title': 'Write Reviews', 'desc': '10 points on verified stay reviews', 'badge': '+10 pts', 'cta': 'Review'},
      {'key': 'refer', 'icon': '🤝', 'title': 'Refer Friends', 'desc': '25 points when friends take their 1st trip', 'badge': '+25 pts', 'cta': 'Invite'},
      {'key': 'profile', 'icon': '👤', 'title': 'Complete Profile', 'desc': '15 points for Email & KYC verification', 'badge': '+15 pts', 'cta': provider.isEmailVerified ? 'Claim +15' : 'Verify'},
      {'key': 'repeat', 'icon': '🔁', 'title': 'Repeat Stays', 'desc': '20 bonus points on re-booking favorite stays', 'badge': '+20 pts', 'cta': 'View Trips'},
    ];

    return Column(
      children: items.map((item) {
        return BouncingWidget(
          onTap: () => _handleEarnAction(context, item['key']!, provider),
          child: Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1A1828) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? Colors.white10 : AppColors.borderLight),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white10 : AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(item['icon']!, style: const TextStyle(fontSize: 20)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item['title']!,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item['desc']!,
                        style: TextStyle(fontSize: 11, color: isDark ? Colors.white60 : AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        item['badge']!,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primary),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          item['cta']!,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                        const Icon(Icons.arrow_forward_ios_rounded, size: 10, color: AppColors.primary),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTierCards(BuildContext context, AppProvider provider, bool isDark) {
    final tiers = [
      {
        'key': 'Q_STARTER',
        'title': 'Q Starter',
        'price': 0,
        'priceText': 'Free Forever',
        'multiplier': '1.0x',
        'color': const Color(0xFF6B7280),
        'perks': [
          'Earn 1 pt per ₹100 spent',
          '500 pts = ₹250 Stay Q Credit',
          'Standard guest concierge',
        ],
      },
      {
        'key': 'Q_PLUS',
        'title': 'Q Plus',
        'price': 499,
        'priceText': '₹499 / year',
        'multiplier': '1.5x Multiplier',
        'color': const Color(0xFF8B5CF6),
        'perks': [
          '⚡ 1.5x Points on all bookings',
          '⏰ Early check-in & late checkout',
          '🌟 Priority 24/7 VIP guest concierge',
          '🏷️ 5% extra discount on select villas',
          '🎁 +50 Welcome Bonus Points',
        ],
      },
      {
        'key': 'Q_PREMIUM',
        'title': 'Q Premium',
        'price': 999,
        'priceText': '₹999 / year',
        'multiplier': '2.0x Double Multiplier',
        'color': const Color(0xFFF59E0B),
        'perks': [
          '⚡⚡ 2.0x Double points on all bookings',
          '👑 Free cancellation & room upgrades',
          '🛎️ Dedicated personal trip designer',
          '🚗 Airport / transfer discounts',
          '🎁 +100 Welcome Bonus Points',
        ],
      },
    ];

    final currentTier = provider.loyaltyTier;

    return SizedBox(
      height: 290,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: tiers.length,
        itemBuilder: (context, index) {
          final t = tiers[index];
          final isCurrent = t['key'] == currentTier;
          final perks = t['perks'] as List<String>;

          return Container(
            width: 260,
            margin: const EdgeInsets.only(right: 14),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1A1828) : Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: isCurrent
                    ? (t['color'] as Color)
                    : (isDark ? Colors.white10 : AppColors.borderLight),
                width: isCurrent ? 2 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: isCurrent
                      ? (t['color'] as Color).withValues(alpha: 0.15)
                      : Colors.black.withValues(alpha: 0.03),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      t['title'] as String,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: t['color'] as Color,
                      ),
                    ),
                    if (isCurrent)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: (t['color'] as Color).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Current Plan',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: t['color'] as Color,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  t['priceText'] as String,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                const Divider(height: 1),
                const SizedBox(height: 10),
                Expanded(
                  child: ListView(
                    physics: const NeverScrollableScrollPhysics(),
                    padding: EdgeInsets.zero,
                    children: perks.map((perk) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('✓ ', style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 12)),
                            Expanded(
                              child: Text(
                                perk,
                                style: TextStyle(fontSize: 11, color: isDark ? Colors.white70 : AppColors.textSecondary),
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
                if (!isCurrent && (t['price'] as int) > 0)
                  BouncingWidget(
                    onTap: () => _showUpgradeConfirmation(
                      context,
                      provider,
                      t['key'] as String,
                      t['title'] as String,
                      t['price'] as int,
                    ),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [t['color'] as Color, (t['color'] as Color).withValues(alpha: 0.8)],
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          'Upgrade to ${t['title']}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildTransactionsList(AppProvider provider, bool isDark) {
    final list = provider.loyaltyTransactions;
    if (list.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1A1828) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: isDark ? Colors.white10 : AppColors.borderLight),
        ),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.history_rounded, size: 36, color: isDark ? Colors.white24 : Colors.black26),
              const SizedBox(height: 8),
              Text(
                'No points transactions yet',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isDark ? Colors.white60 : AppColors.textSecondary),
              ),
              const SizedBox(height: 2),
              Text(
                'Book stays or leave reviews to start earning Stay Q Points!',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, color: isDark ? Colors.white38 : AppColors.textSecondary.withValues(alpha: 0.6)),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      children: list.map((tx) {
        final points = tx['points'] as int? ?? 0;
        final isPositive = points >= 0;
        final reason = tx['reason'] as String? ?? 'Points activity';
        final dateStr = tx['createdAt'] as String?;
        String formattedDate = '';
        if (dateStr != null) {
          final dt = DateTime.tryParse(dateStr);
          if (dt != null) {
            formattedDate = DateFormat('dd MMM, hh:mm a').format(dt);
          }
        }

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1A1828) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? Colors.white10 : AppColors.borderLight),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (isPositive ? const Color(0xFF10B981) : Colors.red).withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isPositive ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
                  color: isPositive ? const Color(0xFF10B981) : Colors.red,
                  size: 16,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      reason,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : AppColors.textPrimary,
                      ),
                    ),
                    if (formattedDate.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        formattedDate,
                        style: TextStyle(fontSize: 10, color: isDark ? Colors.white38 : Colors.black38),
                      ),
                    ],
                  ],
                ),
              ),
              Text(
                '${isPositive ? '+' : ''}$points pts',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  color: isPositive ? const Color(0xFF10B981) : Colors.red,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

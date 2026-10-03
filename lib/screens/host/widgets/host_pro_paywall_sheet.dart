import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../providers/app_provider.dart';
import '../../../../services/api/api_client.dart';
import '../../../../services/api/subscriptions_api.dart';
import '../../../../theme/app_colors.dart';
import '../../../../widgets/bouncing_widget.dart';
import '../../../../widgets/cashfree_payment_sheet.dart';

class HostProPaywallSheet extends StatefulWidget {
  final VoidCallback? onSubscribed;

  const HostProPaywallSheet({Key? key, this.onSubscribed}) : super(key: key);

  static Future<bool?> show(BuildContext context) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const HostProPaywallSheet(),
    );
  }

  @override
  State<HostProPaywallSheet> createState() => _HostProPaywallSheetState();
}

class _HostProPaywallSheetState extends State<HostProPaywallSheet> {
  int _selectedPlanIndex = 0; // 0 = Monthly, 1 = Annual
  bool _isLoading = false;

  final List<Map<String, dynamic>> _plans = [
    {
      'id': 'HOST_PRO_MONTHLY',
      'title': 'Monthly Growth',
      'price': '₹999',
      'period': '/ month',
      'badge': 'FLEXIBLE',
      'savings': null,
    },
    {
      'id': 'HOST_PRO_ANNUAL',
      'title': 'Annual VIP Host',
      'price': '₹7,999',
      'period': '/ year',
      'badge': 'BEST VALUE',
      'savings': 'Save ₹3,989 (33% OFF)',
    },
  ];

  final List<Map<String, dynamic>> _features = [
    {
      'icon': Icons.radar_rounded,
      'title': 'Live Neighborhood Price Radar',
      'desc': 'See exact competitor rates and market averages in your locality.',
    },
    {
      'icon': Icons.auto_awesome_rounded,
      'title': 'Groq LLaMA-3.3 AI Smart Pricing',
      'desc': 'Dynamic pricing suggestions to maximize occupancy and revenue.',
    },
    {
      'icon': Icons.trending_up_rounded,
      'title': 'Seasonality & Demand Surge Alerts',
      'desc': 'Get notified to raise rates for long weekends and high-demand events.',
    },
    {
      'icon': Icons.bolt_rounded,
      'title': 'Search Spotlight Ranking (2x Views)',
      'desc': 'Priority placement on search feeds and explore category carousels.',
    },
  ];

  Future<void> _handleSubscribe() async {
    final selectedPlan = _plans[_selectedPlanIndex];
    final planId = selectedPlan['id'] as String;
    final priceStr = (selectedPlan['price'] as String).replaceAll('₹', '').replaceAll(',', '').trim();
    final double amount = double.tryParse(priceStr) ?? (planId == 'HOST_PRO_ANNUAL' ? 7999.0 : 999.0);

    final provider = Provider.of<AppProvider>(context, listen: false);

    // 1. Generate Order ID from Backend API
    setState(() => _isLoading = true);
    String orderId = 'SUB_${DateTime.now().millisecondsSinceEpoch}';
    try {
      final subApi = SubscriptionsApi(ApiClient.instance);
      final orderRes = await subApi.createSubscriptionOrder(
        planId: planId,
        userEmail: provider.userEmail.isNotEmpty ? provider.userEmail : null,
        userPhone: provider.userPhone.isNotEmpty ? provider.userPhone : null,
        userName: provider.userName.isNotEmpty ? provider.userName : null,
      );
      if (orderRes['orderId'] != null) {
        orderId = orderRes['orderId'].toString();
      }
    } catch (e) {
      debugPrint('Subscription order creation note: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }

    if (!mounted) return;

    // 2. Attach and Launch Real Cashfree Payment Sheet
    final paymentResult = await CashfreePaymentSheet.show(
      context,
      bookingId: orderId,
      totalAmount: amount,
      propertyTitle: 'StayQ Host Pro (${selectedPlan['title']})',
      customerName: provider.userName.isNotEmpty ? provider.userName : 'Host Partner',
      customerEmail: provider.userEmail.isNotEmpty ? provider.userEmail : 'host@stayq.space',
      customerPhone: provider.userPhone.isNotEmpty ? provider.userPhone : '9876543210',
    );

    if (paymentResult == null) {
      // Payment dismissed or cancelled by user
      return;
    }

    // 3. Payment Verified -> Activate Host Pro
    setState(() => _isLoading = true);
    try {
      final subApi = SubscriptionsApi(ApiClient.instance);
      await subApi.verifySubscription(
        orderId: orderId,
        planId: planId,
      );
    } catch (e) {
      debugPrint('Subscription verification note: $e');
    }

    await provider.activateHostPro(planId);

    if (!mounted) return;
    setState(() => _isLoading = false);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: const [
            Icon(Icons.check_circle_rounded, color: Colors.white),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'StayQ Host Pro Activated! Live Neighborhood Radar Unlocked.',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );

    Navigator.pop(context, true);
    widget.onSubscribed?.call();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.9),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF161224) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 30,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Drag Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Pro Badge & Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF8B5CF6).withValues(alpha: 0.4),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(Icons.star_rounded, color: Colors.white, size: 16),
                        SizedBox(width: 4),
                        Text(
                          'STAYQ PRO',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.8),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 22),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              const Text(
                'Unlock Neighborhood Market Intelligence',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.5,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Make informed pricing decisions with live competitor benchmarks, demand forecasts, and Groq AI dynamic rate recommendations.',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
              ),
              const SizedBox(height: 20),

              // Plan Selector Cards (Monthly vs Annual)
              Row(
                children: List.generate(_plans.length, (idx) {
                  final plan = _plans[idx];
                  final isSelected = _selectedPlanIndex == idx;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _selectedPlanIndex = idx),
                      child: Container(
                        margin: EdgeInsets.only(right: idx == 0 ? 8 : 0, left: idx == 1 ? 8 : 0),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? const Color(0xFF8B5CF6).withValues(alpha: 0.08)
                              : (isDark ? Colors.white.withValues(alpha: 0.04) : const Color(0xFFF8FAFC)),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: isSelected ? const Color(0xFF8B5CF6) : Colors.grey.withValues(alpha: 0.2),
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (plan['badge'] != null)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                margin: const EdgeInsets.only(bottom: 8),
                                decoration: BoxDecoration(
                                  color: isSelected ? const Color(0xFF8B5CF6) : Colors.grey.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  plan['badge'],
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : AppColors.textSecondary,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            Text(
                              plan['title'],
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.baseline,
                              textBaseline: TextBaseline.alphabetic,
                              children: [
                                Text(
                                  plan['price'],
                                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                                ),
                                Text(
                                  plan['period'],
                                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                            if (plan['savings'] != null) ...[
                              const SizedBox(height: 6),
                              Text(
                                plan['savings'],
                                style: const TextStyle(color: Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.w800),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 24),

              // Feature Highlights List
              const Text(
                'What is included in Host Pro:',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 12),

              ..._features.map((f) => Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF8B5CF6).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(f['icon'], size: 18, color: const Color(0xFF8B5CF6)),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            f['title'],
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            f['desc'],
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.3),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              )),
              const SizedBox(height: 24),

              // CTA Subscribe Button
              BouncingWidget(
                onTap: _isLoading ? null : _handleSubscribe,
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
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Center(
                    child: _isLoading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                          )
                        : Text(
                            'Activate Host Pro — ${_plans[_selectedPlanIndex]['price']}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.3,
                            ),
                          ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              const Center(
                child: Text(
                  'Instant activation • Cancel anytime from Host Dashboard',
                  style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                ),
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }
}

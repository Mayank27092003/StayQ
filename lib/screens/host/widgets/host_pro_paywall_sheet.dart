import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/app_provider.dart';
import '../../../services/api/api_client.dart';
import '../../../services/api/subscriptions_api.dart';
import '../../../theme/app_colors.dart';
import '../../../widgets/bouncing_widget.dart';
import '../../../widgets/cashfree_payment_sheet.dart';
import '../../../models/payment_order.dart';
import '../../../models/json_values.dart';

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
  final String _purchaseKey = 'host-pro:${DateTime.now().microsecondsSinceEpoch}:${Random.secure().nextInt(1 << 32)}';
  PaymentOrder? _pendingOrder;
  String? _pendingPlan;

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
      'desc': 'View available market benchmarks for your locality.',
    },
    {
      'icon': Icons.auto_awesome_rounded,
      'title': 'Pricing recommendations',
      'desc': 'View pricing suggestions when supplied by the server.',
    },
    {
      'icon': Icons.trending_up_rounded,
      'title': 'Market insights',
      'desc': 'Available insights depend on market data for your locality.',
    },
    {
      'icon': Icons.bolt_rounded,
      'title': 'Search spotlight eligibility',
      'desc': 'Placement depends on the active plan and server ranking rules.',
    },
  ];

  Future<void> _handleSubscribe() async {
    if (_isLoading) return;
    final plan = _plans[_selectedPlanIndex]; final planId = plan['id'] as String;
    final provider = context.read<AppProvider>();
    setState(() => _isLoading = true);
    try {
      final api = SubscriptionsApi(ApiClient.instance);
      if (_pendingPlan != planId) { _pendingOrder = null; _pendingPlan = planId; }
      _pendingOrder ??= PaymentOrder.fromJson(await api.createSubscriptionOrder(planId: planId,
        idempotencyKey: '$_purchaseKey:$planId',
        userEmail: provider.userEmail, userPhone: provider.userPhone, userName: provider.userName));
      if (!mounted) return;
      Map<String, dynamic>? verified;
      final payment = await CashfreePaymentSheet.show(context, bookingId: _pendingOrder!.id,
        existingOrder: _pendingOrder, totalAmount: _pendingOrder!.amount,
        propertyTitle: 'StayQ Host Pro (${plan['title']})', customerName: provider.userName,
        customerEmail: provider.userEmail, customerPhone: provider.userPhone,
        verifyOrder: (orderId) async {
          final result = await api.verifySubscription(orderId: orderId, planId: planId);
          final subscription = jsonMap(result['subscription']);
          if (result['isPaid'] != true || (result['isActive'] != true && subscription['status'] != 'ACTIVE')) {
            throw StateError('Payment or subscription activation is still pending.');
          }
          verified = result; return result;
        });
      if (payment == null || verified == null || !mounted) return;
      await provider.activateHostPro(planId, verifiedSubscription: verified!);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Host Pro subscription confirmed.')));
      widget.onSubscribed?.call(); Navigator.pop(context, true);
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()))); }
    finally { if (mounted) setState(() => _isLoading = false); }
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
                'Make informed pricing decisions with live competitor benchmarks, demand forecasts, and StayQ AI dynamic rate recommendations.',
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
                  'Activation follows server payment confirmation',
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

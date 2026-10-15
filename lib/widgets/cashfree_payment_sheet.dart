import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpaymentgateway/cfpaymentgatewayservice.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpayment/cfwebcheckoutpayment.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfsession/cfsession.dart';
import 'package:flutter_cashfree_pg_sdk/utils/cfenums.dart';
import '../models/payment_order.dart';
import '../services/api/api_client.dart';
import '../services/api/payments_api.dart';
import '../theme/app_colors.dart';

class PaymentSuccessResult {
  final bool isSuccess;
  final String orderId;
  final String paymentId;
  final String paymentMethod;
  final double amount;
  const PaymentSuccessResult({required this.isSuccess, required this.orderId,
    required this.paymentId, required this.paymentMethod, required this.amount});
}

class CashfreePaymentSheet extends StatefulWidget {
  final String bookingId;
  final double totalAmount;
  final String propertyTitle;
  final String customerName;
  final String customerEmail;
  final String customerPhone;
  final PaymentOrder? existingOrder;
  final Future<Map<String, dynamic>> Function(String)? verifyOrder;
  const CashfreePaymentSheet({super.key, required this.bookingId,
    required this.totalAmount, required this.propertyTitle, this.customerName = '',
    this.customerEmail = '', this.customerPhone = '', this.existingOrder, this.verifyOrder});
  static bool _active = false;
  static Future<PaymentSuccessResult?> show(BuildContext context, {
    required String bookingId, required double totalAmount, required String propertyTitle,
    String customerName = '', String customerEmail = '', String customerPhone = '',
    PaymentOrder? existingOrder,
    Future<Map<String, dynamic>> Function(String)? verifyOrder,
  }) async {
    if (_active) throw ApiException(409, 'A checkout is already open.');
    _active = true;
    try {
      return await showModalBottomSheet<PaymentSuccessResult>(context: context,
        isScrollControlled: true, isDismissible: false, enableDrag: false,
        builder: (_) => CashfreePaymentSheet(bookingId: bookingId, totalAmount: totalAmount,
          propertyTitle: propertyTitle, customerName: customerName, customerEmail: customerEmail,
          customerPhone: customerPhone, existingOrder: existingOrder, verifyOrder: verifyOrder));
    } finally { _active = false; }
  }
  @override
  State<CashfreePaymentSheet> createState() => _CashfreePaymentSheetState();
}

class _CashfreePaymentSheetState extends State<CashfreePaymentSheet> {
  final _gateway = CFPaymentGatewayService();
  final _payments = PaymentsApi(ApiClient.instance);
  final String? _uid = FirebaseAuth.instance.currentUser?.uid;
  final _phoneController = TextEditingController();
  PaymentOrder? _order;
  bool _loading = true;
  bool _paying = false;
  bool _needsPhone = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  @override
  void dispose() {
    _phoneController.dispose();
    CFPaymentGatewayService.verifyPayment = (id) {};
    CFPaymentGatewayService.onError = (error, id) {};
    super.dispose();
  }

  String _resolvePhone() {
    String p = widget.customerPhone.replaceAll(RegExp(r'[^0-9]'), '');
    if (p.length == 12 && p.startsWith('91')) p = p.substring(2);
    if (p.length < 10) {
      final authPhone = FirebaseAuth.instance.currentUser?.phoneNumber?.replaceAll(RegExp(r'[^0-9]'), '') ?? '';
      if (authPhone.length >= 10) {
        p = (authPhone.length == 12 && authPhone.startsWith('91')) ? authPhone.substring(2) : authPhone;
      }
    }
    if (p.length < 10 && _phoneController.text.trim().replaceAll(RegExp(r'[^0-9]'), '').length >= 10) {
      p = _phoneController.text.trim().replaceAll(RegExp(r'[^0-9]'), '');
      if (p.length == 12 && p.startsWith('91')) p = p.substring(2);
    }
    return p;
  }

  Future<void> _initialize() async {
    if (mounted) setState(() { _loading = true; _error = null; });
    try {
      final phone = _resolvePhone();
      if (widget.existingOrder == null && phone.length < 10) {
        if (!mounted) return;
        setState(() {
          _loading = false;
          _needsPhone = true;
        });
        return;
      }

      final order = widget.existingOrder ?? PaymentOrder.fromJson(
        await _payments.createPaymentOrder(
          bookingId: widget.bookingId,
          amount: widget.totalAmount,
          customerName: widget.customerName.isNotEmpty ? widget.customerName : 'StayQ Guest',
          customerEmail: widget.customerEmail.isNotEmpty ? widget.customerEmail : 'guest@stayq.space',
          customerPhone: phone,
        ),
        bookingAmount: widget.totalAmount,
      );

      if (widget.existingOrder == null && (order.amount - widget.totalAmount).abs() > 0.005) {
        throw ApiException(409, 'The payment amount differs from the booking price. Refresh your booking.');
      }
      if (!mounted || FirebaseAuth.instance.currentUser?.uid != _uid) return;
      setState(() {
        _order = order;
        _loading = false;
        _needsPhone = false;
      });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  Future<void> _verify(String id) async {
    if (!mounted || _order?.id != id || FirebaseAuth.instance.currentUser?.uid != _uid) return;
    setState(() { _paying = true; _error = null; });
    try {
      Map<String, dynamic>? lastResult;
      // Retry verification with backoff up to 5 times (total ~10s window)
      // to allow Cashfree webhooks and bank settlement to reflect status as PAID
      for (int attempt = 1; attempt <= 5; attempt++) {
        if (!mounted || FirebaseAuth.instance.currentUser?.uid != _uid) return;
        try {
          final result = await (widget.verifyOrder?.call(id) ?? _payments.verifyPayment(id));
          lastResult = result;
          if (result['isPaid'] == true) {
            final returnedId = (result['orderId'] ?? result['order_id'])?.toString();
            if (returnedId != null && returnedId != id) throw ApiException(502, 'Payment reference does not match.');
            if (!mounted) return;
            Navigator.pop(context, PaymentSuccessResult(
              isSuccess: true,
              orderId: id,
              paymentId: result['paymentId']?.toString() ?? '',
              paymentMethod: result['paymentMethod']?.toString() ?? 'Cashfree Checkout',
              amount: _order!.amount,
            ));
            return;
          }
        } catch (e) {
          if (attempt == 5) rethrow;
        }
        if (attempt < 5) {
          await Future.delayed(Duration(seconds: attempt == 1 ? 1 : 2));
        }
      }
      if (lastResult?['isPaid'] != true) {
        throw ApiException(409, 'Payment confirmation is still pending with your bank. Tap "Verify Status" below once approved.');
      }
    } catch (e) {
      if (mounted) setState(() { _paying = false; _error = e.toString().replaceFirst('Exception: ', ''); });
    }
  }

  void _pay() {
    final order = _order;
    if (order == null || _paying || FirebaseAuth.instance.currentUser?.uid != _uid) return;
    setState(() { _paying = true; _error = null; });
    try {
      _gateway.setCallback((id) { _verify(id); }, (error, id) {
        if (!mounted || (id != order.id && id != 'order_id_not_found')) return;
        setState(() { _paying = false; _error = error.getMessage() ?? 'Checkout was cancelled or failed.'; });
      });
      final session = CFSessionBuilder().setEnvironment(order.environment == 'PRODUCTION'
          ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX)
          .setOrderId(order.id).setPaymentSessionId(order.sessionId).build();
      _gateway.doPayment(CFWebCheckoutPaymentBuilder().setSession(session).build());
    } catch (e) { if (mounted) setState(() { _paying = false; _error = e.toString().replaceFirst('Exception: ', ''); }); }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);

    return PopScope(
      canPop: !_paying,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.card(context),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(top: BorderSide(color: AppColors.border(context))),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Drag handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white24 : Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.propertyTitle,
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.text(context)),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 3),
                          const Text(
                            'StayQ Verified Booking',
                            style: TextStyle(fontSize: 12, color: Color(0xFF10B981), fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: _paying ? null : () => Navigator.pop(context),
                      icon: Icon(Icons.close_rounded, color: AppColors.icon(context)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                if (_loading)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 40),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          CircularProgressIndicator(color: AppColors.primary),
                          const SizedBox(height: 14),
                          Text('Preparing Cashfree Session…', style: TextStyle(fontSize: 13, color: AppColors.textSub(context))),
                        ],
                      ),
                    ),
                  )
                else if (_needsPhone) ...[
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppColors.surface(context),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.border(context)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Mobile Number Required', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.text(context))),
                        const SizedBox(height: 6),
                        Text('Cashfree Payment Gateway requires a 10-digit mobile number for transaction receipts.', style: TextStyle(fontSize: 12, color: AppColors.textSub(context))),
                        const SizedBox(height: 14),
                        TextField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          maxLength: 10,
                          style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.text(context)),
                          decoration: InputDecoration(
                            counterText: '',
                            prefixText: '+91 ',
                            prefixStyle: TextStyle(fontWeight: FontWeight.bold, color: AppColors.text(context)),
                            hintText: 'Enter 10-digit mobile',
                            filled: true,
                            fillColor: isDark ? const Color(0xFF1E1E24) : Colors.white,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.border(context))),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () {
                        if (_phoneController.text.trim().replaceAll(RegExp(r'[^0-9]'), '').length < 10) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid 10-digit phone number.')));
                          return;
                        }
                        _initialize();
                      },
                      child: const Text('Continue to Payment', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    ),
                  ),
                ] else if (_order != null) ...[
                  // Amount Card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppColors.surface(context),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.border(context)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Total Payable',
                              style: TextStyle(fontSize: 13, color: AppColors.textSub(context), fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'Includes Fee & 18% GST',
                              style: TextStyle(fontSize: 11, color: Color(0xFF10B981), fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                        Text(
                          '₹${_order!.amount.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                            color: AppColors.text(context),
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Payment Rails Pill Row
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppColors.surface(context),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border(context)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.shield_outlined, size: 16, color: Color(0xFF059669)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Supports UPI (GPay, PhonePe, Paytm), Cards & Netbanking',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.text(context)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                if (_error != null)
                  Container(
                    margin: const EdgeInsets.symmetric(vertical: 14),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF450A0A).withValues(alpha: 0.6) : const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isDark ? const Color(0xFF7F1D1D) : const Color(0xFFFECACA)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(_error!, style: TextStyle(color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFFB91C1C), fontSize: 13)),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 20),

                if (!_loading && !_needsPhone && _order == null)
                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: _initialize,
                      child: const Text('Retry Loading Checkout', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    ),
                  ),

                if (_order != null) ...[
                  SizedBox(
                    height: 54,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: _paying ? null : _pay,
                      child: _paying
                          ? const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                ),
                                SizedBox(width: 12),
                                Text('Verifying payment with gateway…', style: TextStyle(fontWeight: FontWeight.bold)),
                              ],
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.lock_rounded, size: 16),
                                const SizedBox(width: 8),
                                Text(
                                  'Pay ₹${_order!.amount.toStringAsFixed(2)} Securely',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: _paying ? null : () => _verify(_order!.id),
                    child: Text(
                      'Already completed payment? Verify Status',
                      style: TextStyle(color: AppColors.textSub(context), fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

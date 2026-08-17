import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';
import 'bouncing_widget.dart';

class PriceBreakdownAccordion extends StatefulWidget {
  final double nightRate;
  final int nights;
  final double cleaningFee;
  final double serviceFee;
  final double taxes;

  const PriceBreakdownAccordion({
    super.key,
    required this.nightRate,
    required this.nights,
    this.cleaningFee = 0.0,
    this.serviceFee = 0.0,
    this.taxes = 0.0,
  });

  @override
  State<PriceBreakdownAccordion> createState() => _PriceBreakdownAccordionState();
}

class _PriceBreakdownAccordionState extends State<PriceBreakdownAccordion> {
  bool _isExpanded = true;

  @override
  Widget build(BuildContext context) {
    final double subtotal = widget.nightRate * widget.nights;
    final double calculatedTaxes = widget.taxes > 0 ? widget.taxes : ((subtotal + widget.cleaningFee) * 0.18);
    final double total = subtotal + widget.cleaningFee + widget.serviceFee + calculatedTaxes;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        children: [
          BouncingWidget(
            onTap: () {
              AppMotion.tapSelection();
              setState(() => _isExpanded = !_isExpanded);
            },
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Price details',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Icon(
                  _isExpanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                  color: AppColors.primary,
                ),
              ],
            ),
          ),

          AnimatedCrossFade(
            duration: AppMotion.standard,
            firstCurve: AppMotion.signatureCurve,
            secondCurve: AppMotion.signatureCurve,
            crossFadeState: _isExpanded ? CrossFadeState.showFirst : CrossFadeState.showSecond,
            firstChild: Padding(
              padding: const EdgeInsets.only(top: 14),
              child: Column(
                children: [
                  _priceRow('₹${widget.nightRate.toStringAsFixed(0)} x ${widget.nights} nights', subtotal),
                  if (widget.cleaningFee > 0) ...[
                    const SizedBox(height: 10),
                    _priceRow('Cleaning & Sanitization', widget.cleaningFee),
                  ],
                  if (widget.serviceFee > 0) ...[
                    const SizedBox(height: 10),
                    _priceRow('Stay Q service fee', widget.serviceFee),
                  ],
                  const SizedBox(height: 10),
                  _priceRow('Taxes & GST (18%)', calculatedTaxes),
                ],
              ),
            ),
            secondChild: const SizedBox(width: double.infinity),
          ),

          const Padding(
            padding: EdgeInsets.symmetric(vertical: 14),
            child: Divider(color: AppColors.borderLight),
          ),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total (INR)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),

              // Animated Roll-Up Price Counter
              TweenAnimationBuilder<double>(
                tween: Tween<double>(begin: 0, end: total),
                duration: AppMotion.extended,
                curve: AppMotion.signatureCurve,
                builder: (context, val, child) {
                  return Text(
                    '₹${val.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _priceRow(String label, double amount) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
        TweenAnimationBuilder<double>(
          tween: Tween<double>(begin: 0, end: amount),
          duration: AppMotion.extended,
          curve: AppMotion.signatureCurve,
          builder: (context, val, child) {
            return Text(
              '₹${val.toStringAsFixed(2)}',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
            );
          },
        ),
      ],
    );
  }
}

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';
import 'host_success_passport_screen.dart';

class PropertyReviewAndSubmitScreen extends StatefulWidget {
  const PropertyReviewAndSubmitScreen({Key? key}) : super(key: key);

  @override
  State<PropertyReviewAndSubmitScreen> createState() => _PropertyReviewAndSubmitScreenState();
}

class _PropertyReviewAndSubmitScreenState extends State<PropertyReviewAndSubmitScreen> {
  bool _isSubmitting = false;

  String _maskAccount(String account) {
    if (account.length <= 4) return '****';
    return '*' * (account.length - 4) + account.substring(account.length - 4);
  }

  Future<void> _handleSubmit(HostOnboardingProvider provider) async {
    AppMotion.tapSelection();
    setState(() => _isSubmitting = true);

    try {
      final success = await provider.submitProperty();
      if (success) {
        await provider.clearDraftPrefs();
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => HostSuccessPassportScreen(
                propertyTitle: provider.title.isNotEmpty ? provider.title : 'Luxury Boutique Stay',
                city: provider.city.isNotEmpty ? provider.city : 'Goa',
                pricePerNight: provider.pricePerNight > 0 ? provider.pricePerNight : 12500,
              ),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Submission failed. Please check network connection and try again.'),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<HostOnboardingProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.verified_rounded, color: Color(0xFF10B981), size: 20),
              ),
              const SizedBox(width: 10),
              const Text(
                'FINAL STEP',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF10B981), letterSpacing: 1),
              ),
            ],
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 6),
          const Text(
            'Review & Publish Listing',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 4),
          const Text(
            'Everything looks exceptional. Please review your property details before publishing:',
            style: TextStyle(fontSize: 13.5, color: AppColors.textSecondary),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 24),

          // ══════════════════════════════════════════════════════════════
          // HERO PROPERTY PREVIEW CARD
          // ══════════════════════════════════════════════════════════════
          Container(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.06),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Photos Carousel / Single Cover
                if (provider.localPhotoPaths.isNotEmpty)
                  SizedBox(
                    height: 180,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: provider.localPhotoPaths.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 4),
                      itemBuilder: (context, i) => Image.file(
                        File(provider.localPhotoPaths[i]),
                        width: provider.localPhotoPaths.length == 1 ? MediaQuery.of(context).size.width - 48 : 260,
                        height: 180,
                        fit: BoxFit.cover,
                        cacheWidth: 600,
                        errorBuilder: (context, error, stackTrace) => Container(
                          width: 260,
                          height: 180,
                          color: Colors.black26,
                          child: const Icon(Icons.broken_image_rounded, color: Colors.white54, size: 30),
                        ),
                      ),
                    ),
                  )
                else
                  Container(
                    height: 140,
                    color: AppColors.primary.withValues(alpha: 0.1),
                    child: const Center(
                      child: Icon(Icons.photo_library_outlined, size: 40, color: AppColors.primary),
                    ),
                  ),

                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              provider.propertyType.replaceAll('_', ' '),
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primary),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              provider.isStayingWithHost ? 'Homestay / Co-Living' : '100% Private Stay',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF10B981)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        provider.title.isNotEmpty ? provider.title : 'Untitled Stay Q Listing',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.location_on_rounded, size: 16, color: AppColors.primary),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              provider.city.isNotEmpty
                                  ? '${provider.landmark.isNotEmpty ? "${provider.landmark}, " : ""}${provider.city}, ${provider.state} ${provider.pincode.isNotEmpty ? "(${provider.pincode})" : ""}'
                                  : 'Location Pending',
                              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Starting Rate', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                              const SizedBox(height: 2),
                              Text(
                                '₹${provider.pricePerNight.toInt()} / night',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.primary),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              const Text('Capacity', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                              const SizedBox(height: 2),
                              Text(
                                '${provider.maxGuests} Guests • ${provider.bedrooms} Rooms',
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.05),

          const SizedBox(height: 20),

          // ══════════════════════════════════════════════════════════════
          // INVENTORY / ROOM CATEGORIES BREAKDOWN
          // ══════════════════════════════════════════════════════════════
          _buildSectionHeader('Room Setup & Inventory', Icons.meeting_room_outlined),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
            ),
            child: Column(
              children: provider.roomCategories.map((r) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.bed_rounded, color: AppColors.primary, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              r.categoryName,
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                            ),
                            Text(
                              '${r.quantity} Unit • ${r.bedType} • ₹${r.pricePerNight.toInt()}/night',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      if (r.hasAttachedBathroom)
                        const Padding(
                          padding: EdgeInsets.only(left: 4),
                          child: Text('🚿', style: TextStyle(fontSize: 14)),
                        ),
                      if (r.hasAc)
                        const Padding(
                          padding: EdgeInsets.only(left: 4),
                          child: Text('❄️', style: TextStyle(fontSize: 14)),
                        ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ).animate().fadeIn(delay: 250.ms),

          const SizedBox(height: 20),

          // ══════════════════════════════════════════════════════════════
          // POLICIES & SECURITY DEPOSIT
          // ══════════════════════════════════════════════════════════════
          _buildSectionHeader('Policies & House Rules', Icons.policy_outlined),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
            ),
            child: Column(
              children: [
                _buildInfoRow('Cancellation', provider.cancellationPolicy, isHighlighted: true),
                const Divider(height: 16),
                _buildInfoRow('Government ID', provider.govtIdRequired ? 'Mandatory at check-in' : 'Optional'),
                const Divider(height: 16),
                _buildInfoRow('Quiet Hours', provider.quietHoursEnabled ? provider.quietHoursText : 'None set'),
                const Divider(height: 16),
                _buildInfoRow('Pets Allowed', provider.petsAllowed ? 'Yes 🐾' : 'No ❌'),
                const Divider(height: 16),
                _buildInfoRow('Smoking Indoors', provider.smokingAllowed ? 'Yes 🚭' : 'No ❌'),
                if (provider.securityDepositEnabled) ...[
                  const Divider(height: 16),
                  _buildInfoRow('Security Deposit', '₹${provider.securityDepositAmount.toInt()} (Refundable)'),
                ],
              ],
            ),
          ).animate().fadeIn(delay: 300.ms),

          const SizedBox(height: 20),

          // ══════════════════════════════════════════════════════════════
          // PAYOUT ACCOUNT SUMMARY
          // ══════════════════════════════════════════════════════════════
          _buildSectionHeader('Payout & Settlements', Icons.account_balance_wallet_outlined),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.account_balance_rounded, color: Color(0xFF10B981), size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        provider.upiId.isNotEmpty ? 'UPI ID: ${provider.upiId}' : 'Bank A/C: ${_maskAccount(provider.accountNumber)}',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                      ),
                      Text(
                        provider.ifscCode.isNotEmpty ? 'IFSC: ${provider.ifscCode}' : 'Direct Bank Payout',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text('Verified', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 350.ms),

          const SizedBox(height: 32),

          // ══════════════════════════════════════════════════════════════
          // SUBMIT LISTING BUTTON
          // ══════════════════════════════════════════════════════════════
          BouncingWidget(
            onTap: _isSubmitting ? null : () => _handleSubmit(provider),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF5A31F4), Color(0xFF7C3AED)],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF5A31F4).withValues(alpha: 0.35),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (_isSubmitting)
                    const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white),
                    )
                  else
                    const Icon(Icons.rocket_launch_rounded, color: Colors.white, size: 22),
                  const SizedBox(width: 10),
                  Text(
                    _isSubmitting ? 'Publishing Your Property...' : 'Submit & Publish Listing',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ),
            ),
          ).animate().fadeIn(delay: 400.ms).scale(begin: const Offset(0.98, 0.98), end: const Offset(1, 1)),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isHighlighted = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: isHighlighted ? AppColors.primary : AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}


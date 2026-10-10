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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<HostOnboardingProvider>().checkHostListingStatus();
      }
    });
  }

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
            SnackBar(
              content: Text(provider.lastError ?? 'Submission failed. Please check requirements and try again.'),
              backgroundColor: Colors.redAccent,
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 4),
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
                  color: provider.isAddingSubsequentProperty
                      ? const Color(0xFF6366F1).withValues(alpha: 0.15)
                      : const Color(0xFF10B981).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  provider.isAddingSubsequentProperty ? Icons.add_business_rounded : Icons.verified_user_rounded,
                  color: provider.isAddingSubsequentProperty ? const Color(0xFF6366F1) : const Color(0xFF10B981),
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                provider.isAddingSubsequentProperty ? 'NEW PROPERTY APPLICATION' : 'FIRST-TIME HOST APPLICATION',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: provider.isAddingSubsequentProperty ? const Color(0xFF6366F1) : const Color(0xFF10B981),
                  letterSpacing: 1,
                ),
              ),
            ],
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 6),
          Text(
            provider.isAddingSubsequentProperty ? 'Submit for Property Application' : 'Apply for Host Application',
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 4),
          Text(
            provider.isAddingSubsequentProperty
                ? 'Review your listing specifications before submitting for property verification and activation.'
                : 'Welcome to Stay Q! Please review your credentials and property details to apply for host partnership:',
            style: const TextStyle(fontSize: 13.5, color: AppColors.textSecondary),
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
                              provider.propertyType == 'RV'
                                  ? (provider.rvRentalMode == 'SELF_DRIVE' ? 'Self-Drive RV' : provider.rvRentalMode == 'CHAUFFEUR' ? 'Chauffeur RV' : 'Parked RV Stay')
                                  : provider.propertyType == 'CAMPING_SITE'
                                      ? (provider.campingType == 'GLAMPING' ? 'Glamping Campsite' : provider.campingType == 'TENT_PITCH' ? 'Tent Pitch Campground' : 'Multi-Unit Campsite')
                                      : (provider.isStayingWithHost ? 'Homestay / Co-Living' : '100% Private Stay'),
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF10B981)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        provider.title.isNotEmpty ? provider.title : 'Untitled StayQ Listing',
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
                          Expanded(
                            flex: 5,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  provider.propertyType == 'LONG_TERM_HOME'
                                      ? 'Monthly Rent'
                                      : provider.propertyType == 'RV'
                                          ? 'Daily Rig Tariff'
                                          : provider.propertyType == 'CAMPING_SITE'
                                              ? 'Starting Pitch Rate'
                                              : 'Starting Rate',
                                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  provider.propertyType == 'LONG_TERM_HOME'
                                      ? '₹${(provider.monthlyRent ?? provider.pricePerNight).toInt()} / mo'
                                      : provider.propertyType == 'RV'
                                          ? '₹${provider.pricePerNight.toInt()} / day'
                                          : '₹${provider.pricePerNight.toInt()} / night',
                                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: AppColors.primary),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            flex: 5,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  provider.propertyType == 'LONG_TERM_HOME'
                                      ? 'Unit Configuration'
                                      : provider.propertyType == 'RV'
                                          ? 'Sleeping Capacity'
                                          : provider.propertyType == 'CAMPING_SITE'
                                              ? 'Campsite Capacity'
                                              : 'Capacity',
                                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  provider.propertyType == 'LONG_TERM_HOME'
                                      ? '${provider.bedrooms} BHK • ${provider.bathrooms} Bath'
                                      : provider.propertyType == 'RV'
                                          ? '${provider.rvDetails['berths'] ?? provider.maxGuests} Berths • ${provider.rvRentalMode == 'SELF_DRIVE' ? 'Self-Drive' : provider.rvRentalMode == 'CHAUFFEUR' ? 'Chauffeur' : 'Static'}'
                                          : provider.propertyType == 'CAMPING_SITE'
                                              ? '${provider.maxGuests} Campers • ${provider.roomCategories.isNotEmpty ? provider.roomCategories.length : 1} Pitches'
                                              : '${provider.maxGuests} Guests • ${provider.bedrooms} Rooms',
                                  textAlign: TextAlign.right,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                                ),
                              ],
                            ),
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
          // DYNAMIC INVENTORY / SETUP BREAKDOWN PER CATEGORY
          // ══════════════════════════════════════════════════════════════
          if (provider.propertyType == 'RV') ...[
            _buildSectionHeader('RV Rig Specifications & Mobility Tariffs', Icons.directions_bus_filled_rounded),
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
                  _buildInfoRow('Vehicle Make & Model', '${provider.rvDetails['makeController'] ?? 'Force Motors'} ${provider.rvDetails['modelController'] ?? 'Camper'}', isHighlighted: true),
                  const Divider(height: 16),
                  _buildInfoRow('Rig Type & Year', '${provider.rvDetails['rvType'] ?? 'Campervan'} (${provider.rvDetails['yearController'] ?? '2024'}) • ${provider.rvDetails['fuelType'] ?? 'Diesel'} • ${provider.rvDetails['transmission'] ?? 'Manual'}'),
                  const Divider(height: 16),
                  _buildInfoRow('Sleeping Berths', '${provider.rvDetails['berths'] ?? provider.maxGuests} Berths (Beds: ${(provider.rvDetails['bedTypes'] as List?)?.join(', ') ?? 'Queen/Dinette'})'),
                  const Divider(height: 16),
                  _buildInfoRow('Mobility Mode', provider.rvRentalMode == 'SELF_DRIVE' ? 'Self-Drive Rig' : provider.rvRentalMode == 'CHAUFFEUR' ? 'Chauffeur Driven' : 'Parked Estate Stay'),
                  const Divider(height: 16),
                  _buildInfoRow('Daily Distance Limit', '${provider.rvDetails['dailyKmIncluded'] ?? 150} km/day (Extra: ₹${provider.rvDetails['extraKmRate'] ?? 18}/km)'),
                  const Divider(height: 16),
                  _buildInfoRow('Permitted Corridors', (provider.rvDetails['permittedCorridors'] as List?)?.join(', ') ?? 'All India Corridors'),
                  if (provider.weeklyDiscountPercent != null && provider.weeklyDiscountPercent! > 0) ...[
                    const Divider(height: 16),
                    _buildInfoRow('Weekly Expedition Discount', '${provider.weeklyDiscountPercent!.toInt()}% OFF (7+ days)'),
                  ],
                  if (provider.monthlyDiscountPercent != null && provider.monthlyDiscountPercent! > 0) ...[
                    const Divider(height: 16),
                    _buildInfoRow('Monthly Expedition Discount', '${provider.monthlyDiscountPercent!.toInt()}% OFF (28+ days)'),
                  ],
                ],
              ),
            ).animate().fadeIn(delay: 250.ms),
          ] else if (provider.propertyType == 'CAMPING_SITE') ...[
            _buildSectionHeader('Campsite Units & Bookable Pitches', Icons.cabin_rounded),
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
                  if (provider.roomCategories.isNotEmpty)
                    ...provider.roomCategories.map((r) {
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
                              child: const Icon(Icons.cabin_rounded, color: AppColors.primary, size: 18),
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
                          ],
                        ),
                      );
                    })
                  else ...[
                    _buildInfoRow('Camping Type', provider.campingType.replaceAll('_', ' '), isHighlighted: true),
                    const Divider(height: 16),
                    _buildInfoRow('Total Pitches', 'Open Wilderness Campsite'),
                  ],
                  if (provider.weeklyDiscountPercent != null && provider.weeklyDiscountPercent! > 0) ...[
                    const Divider(height: 16),
                    _buildInfoRow('Weekly Stay Discount', '${provider.weeklyDiscountPercent!.toInt()}% OFF (7+ nights)'),
                  ],
                  if (provider.monthlyDiscountPercent != null && provider.monthlyDiscountPercent! > 0) ...[
                    const Divider(height: 16),
                    _buildInfoRow('Monthly Stay Discount', '${provider.monthlyDiscountPercent!.toInt()}% OFF (30+ nights)'),
                  ],
                ],
              ),
            ).animate().fadeIn(delay: 250.ms),
          ] else if (provider.propertyType == 'LONG_TERM_HOME') ...[
            _buildSectionHeader('Zero Broker Rental Terms & Economics', Icons.verified_user_rounded),
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
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.verified_rounded, color: Color(0xFF10B981), size: 20),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '100% Zero Brokerage Listing • Direct Tenant Agreement',
                            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: Color(0xFF10B981)),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildInfoRow('Monthly Rent', '₹${(provider.monthlyRent ?? provider.pricePerNight).toInt()} / month', isHighlighted: true),
                  const Divider(height: 16),
                  _buildInfoRow('Security Deposit', '₹${provider.securityDepositAmount.toInt()} (Refundable)'),
                  const Divider(height: 16),
                  _buildInfoRow('Lock-in / Lease Period', '${provider.leaseDurationMonths > 0 ? provider.leaseDurationMonths : 11} Months'),
                  const Divider(height: 16),
                  _buildInfoRow('Notice Period', '30 Days Mandatory'),
                  const Divider(height: 16),
                  _buildInfoRow('Furnishing Status', provider.amenities.contains('Furniture') ? 'Fully Furnished' : 'Semi / Unfurnished'),
                ],
              ),
            ).animate().fadeIn(delay: 250.ms),
          ] else ...[
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
          ],

          const SizedBox(height: 20),

          // ══════════════════════════════════════════════════════════════
          // DYNAMIC POLICIES & SECURITY DEPOSIT PER CATEGORY
          // ══════════════════════════════════════════════════════════════
          if (provider.propertyType == 'RV') ...[
            _buildSectionHeader('RV Driving Rules & Vehicle Security', Icons.security_rounded),
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
                  _buildInfoRow('Driver Eligibility', '${provider.rvDetails['minDriverAge'] ?? 23}+ Yrs Age • ${provider.rvDetails['minLicenseTenureYears'] ?? 2}+ Yrs DL', isHighlighted: true),
                  const Divider(height: 16),
                  _buildInfoRow('Speed Limiter', provider.rvDetails['speedLimiterEquipped'] == false ? 'Not equipped' : '80 km/h RTO Limiter Equipped'),
                  const Divider(height: 16),
                  _buildInfoRow('Terrain Policy', provider.rvDetails['offRoadPolicy']?.toString() ?? 'Mild Gravel Permitted'),
                  const Divider(height: 16),
                  _buildInfoRow('Night Driving', provider.rvDetails['nightDrivingPolicy']?.toString() ?? 'Restricted after 8 PM'),
                  const Divider(height: 16),
                  _buildInfoRow('Fuel Return', provider.rvDetails['fullToFullFuel'] == false ? 'As Delivered' : 'Full-to-Full Fuel'),
                  const Divider(height: 16),
                  _buildInfoRow('Vehicle Security Deposit', '₹${provider.securityDepositEnabled ? provider.securityDepositAmount.toInt() : 15000} (Damage Hold)'),
                ],
              ),
            ).animate().fadeIn(delay: 300.ms),
          ] else if (provider.propertyType == 'CAMPING_SITE') ...[
            _buildSectionHeader('Wilderness & Campfire Rules', Icons.nature_people_rounded),
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
                  _buildInfoRow('Leave No Trace', '100% Trash Pack Out Mandatory', isHighlighted: true),
                  const Divider(height: 16),
                  _buildInfoRow('Campfire Safety', 'Designated Fire Rings Only'),
                  const Divider(height: 16),
                  _buildInfoRow('Wildlife Quiet Hours', '10:00 PM - 06:00 AM'),
                  const Divider(height: 16),
                  _buildInfoRow('Pets in Camp', provider.petsAllowed ? 'Allowed on Leash 🐾' : 'Prohibited ❌'),
                  const Divider(height: 16),
                  _buildInfoRow('Eco Security Deposit', '₹${provider.securityDepositEnabled ? provider.securityDepositAmount.toInt() : 1500} (Refundable)'),
                ],
              ),
            ).animate().fadeIn(delay: 300.ms),
          ] else if (provider.propertyType == 'LONG_TERM_HOME') ...[
            _buildSectionHeader('Tenancy Governance & Society Rules', Icons.gavel_rounded),
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
                  _buildInfoRow('Tenant Verification', 'Police KYC Mandatory Before Move-In', isHighlighted: true),
                  const Divider(height: 16),
                  _buildInfoRow('Society NOC', 'Host Facilitates Society Clearance'),
                  const Divider(height: 16),
                  _buildInfoRow('Subletting', 'Strictly Prohibited ❌'),
                  const Divider(height: 16),
                  _buildInfoRow('Pets in Flat', provider.petsAllowed ? 'Permitted 🐾' : 'Not Allowed ❌'),
                  const Divider(height: 16),
                  _buildInfoRow('Move-In Security Deposit', '₹${provider.securityDepositAmount.toInt()} (Refundable on Vacating)'),
                ],
              ),
            ).animate().fadeIn(delay: 300.ms),
          ] else ...[
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
          ],

          const SizedBox(height: 20),

          // ══════════════════════════════════════════════════════════════
          // DOCUMENTS & COMPLIANCE SUMMARY
          // ══════════════════════════════════════════════════════════════
          _buildSectionHeader(
            provider.propertyType == 'RV'
                ? 'RV Registration & Compliance'
                : provider.propertyType == 'CAMPING_SITE'
                    ? 'Campsite Land & Tourism Permits'
                    : 'Ownership & Legal Documents',
            Icons.verified_user_outlined,
          ),
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
                if (provider.propertyType == 'RV') ...[
                  _buildDocRow('Vehicle Registration (RC)', provider.propertyRegistryDocPath.isNotEmpty || provider.propertyRegistryDocUrl.isNotEmpty),
                  const Divider(height: 16),
                  _buildDocRow('Commercial Vehicle Insurance', provider.leaseAgreementDocPath.isNotEmpty || provider.leaseAgreementDocUrl.isNotEmpty),
                  const Divider(height: 16),
                  _buildDocRow('Vehicle Fitness & PUC', provider.electricityBillDocPath.isNotEmpty || provider.electricityBillDocUrl.isNotEmpty),
                ] else if (provider.propertyType == 'CAMPING_SITE') ...[
                  _buildDocRow('Land Title / 7/12 Extract', provider.propertyRegistryDocPath.isNotEmpty || provider.propertyRegistryDocUrl.isNotEmpty),
                  const Divider(height: 16),
                  _buildDocRow('Panchayat / Tourism NOC', provider.landlordNocDocPath.isNotEmpty || provider.landlordNocDocUrl.isNotEmpty),
                  const Divider(height: 16),
                  _buildDocRow('Safety Clearance', provider.electricityBillDocPath.isNotEmpty || provider.electricityBillDocUrl.isNotEmpty),
                ] else if (provider.propertyType == 'LONG_TERM_HOME') ...[
                  _buildDocRow('Property Title Deed', provider.propertyRegistryDocPath.isNotEmpty || provider.propertyRegistryDocUrl.isNotEmpty),
                  const Divider(height: 16),
                  _buildDocRow('Electricity / Utility Bill', provider.electricityBillDocPath.isNotEmpty || provider.electricityBillDocUrl.isNotEmpty),
                  if (provider.societyNocDocPath.isNotEmpty || provider.societyNocDocUrl.isNotEmpty) ...[
                    const Divider(height: 16),
                    _buildDocRow('Society NOC', true),
                  ],
                ] else ...[
                  _buildDocRow(
                    provider.ownershipType == 'OWNED' ? 'Property Registry / Sale Deed' : 'Registered Lease Agreement',
                    provider.ownershipType == 'OWNED'
                        ? (provider.propertyRegistryDocPath.isNotEmpty || provider.propertyRegistryDocUrl.isNotEmpty)
                        : (provider.leaseAgreementDocPath.isNotEmpty || provider.leaseAgreementDocUrl.isNotEmpty),
                  ),
                  if (provider.ownershipType != 'OWNED') ...[
                    const Divider(height: 16),
                    _buildDocRow('Landlord NOC', provider.landlordNocDocPath.isNotEmpty || provider.landlordNocDocUrl.isNotEmpty),
                  ],
                  const Divider(height: 16),
                  _buildDocRow('Electricity / Utility Bill', provider.electricityBillDocPath.isNotEmpty || provider.electricityBillDocUrl.isNotEmpty),
                  if (provider.isInsideGatedSociety) ...[
                    const Divider(height: 16),
                    _buildDocRow('Society / RWA NOC', provider.societyNocDocPath.isNotEmpty || provider.societyNocDocUrl.isNotEmpty),
                  ],
                ],
              ],
            ),
          ).animate().fadeIn(delay: 320.ms),

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

          const SizedBox(height: 28),

          // Dynamic Application Context Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: provider.isAddingSubsequentProperty
                  ? const Color(0xFF6366F1).withValues(alpha: 0.08)
                  : const Color(0xFF10B981).withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: provider.isAddingSubsequentProperty
                    ? const Color(0xFF6366F1).withValues(alpha: 0.3)
                    : const Color(0xFF10B981).withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  provider.isAddingSubsequentProperty ? Icons.domain_add_rounded : Icons.handshake_rounded,
                  color: provider.isAddingSubsequentProperty ? const Color(0xFF6366F1) : const Color(0xFF10B981),
                  size: 22,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        provider.isAddingSubsequentProperty ? 'Portfolio Expansion' : 'Host Partnership & First Listing',
                        style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w800,
                          color: provider.isAddingSubsequentProperty ? const Color(0xFF6366F1) : const Color(0xFF10B981),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        provider.isAddingSubsequentProperty
                            ? 'As an existing verified host, this property will be submitted under your host account for quick verification and instant publishing.'
                            : 'This is your first listing! Your host KYC, bank account, and property details will be submitted together to establish your verified Stay Q host account.',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 380.ms),

          const SizedBox(height: 20),

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
                    Icon(
                      provider.isAddingSubsequentProperty ? Icons.domain_verification_rounded : Icons.rocket_launch_rounded,
                      color: Colors.white,
                      size: 22,
                    ),
                  const SizedBox(width: 10),
                  Text(
                    _isSubmitting
                        ? (provider.isAddingSubsequentProperty ? 'Submitting Property Application...' : 'Submitting Host Application...')
                        : (provider.isAddingSubsequentProperty ? 'Submit for Property Application' : 'Apply for Host Application'),
                    style: const TextStyle(
                      fontSize: 15.5,
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
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 4,
            child: Text(
              label,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 6,
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: isHighlighted ? AppColors.primary : AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocRow(String label, bool isAttached) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2.5),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
            ),
          ),
          const SizedBox(width: 8),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isAttached ? Icons.check_circle_rounded : Icons.pending_rounded,
                color: isAttached ? const Color(0xFF10B981) : Colors.orange,
                size: 16,
              ),
              const SizedBox(width: 4),
              Text(
                isAttached ? 'Attached ✓' : 'Pending',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: isAttached ? const Color(0xFF10B981) : Colors.orange,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}


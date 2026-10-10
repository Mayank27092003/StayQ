import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';
import '../../../../widgets/media_upload_sheet.dart';

class HostVerificationScreen extends StatefulWidget {
  const HostVerificationScreen({Key? key}) : super(key: key);

  @override
  State<HostVerificationScreen> createState() => _HostVerificationScreenState();
}

class _HostVerificationScreenState extends State<HostVerificationScreen> {
  Future<void> _pickDocument(String docType, String docTitle) async {
    AppMotion.tapSelection();
    await showStayQUploadSheet(
      context,
      title: 'Upload $docTitle',
      subtitle: 'Take a clear photo, choose from gallery, or browse PDF / files',
      type: MediaUploadType.documentOrImage,
      onFilePicked: (pickedPath) {
        _saveDocPath(docType, pickedPath);
      },
    );
  }

  void _saveDocPath(String docType, String filePath) {
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    switch (docType) {
      case 'electricity':
        provider.updatePropertyDocuments(electricityBill: filePath);
        break;
      case 'registry':
        provider.updatePropertyDocuments(registry: filePath);
        break;
      case 'lease':
        provider.updatePropertyDocuments(leaseAgreement: filePath);
        break;
      case 'noc':
        provider.updatePropertyDocuments(landlordNoc: filePath);
        break;
      case 'society_noc':
        provider.updatePropertyDocuments(societyNoc: filePath);
        break;
      case 'owner_id':
        provider.updatePropertyDocuments(ownerIdProof: filePath);
        break;
      case 'selfie_face':
        provider.updatePropertyDocuments(selfieFaceProof: filePath);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<HostOnboardingProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isRv = provider.propertyType == 'RV';
    final isCamping = provider.propertyType == 'CAMPING_SITE';
    final isLongTerm = provider.propertyType == 'LONG_TERM_HOME';

    String screenTitle = 'Property Documents & Compliance';
    String screenSubtitle = 'Submit proof of legal ownership or authorization along with compliance certificates.';
    String declarationText = 'I certify that I possess full legal authorization under Indian Law to host guests at this property, and all uploaded documents are genuine.';

    if (isRv) {
      screenTitle = 'RV Registration & Compliance';
      screenSubtitle = 'Submit legal RTO registration (RC), commercial insurance, and fitness/PUC compliance.';
      declarationText = 'I certify that I am the legal owner or authorized fleet manager of this vehicle with valid commercial permits and fitness under the Motor Vehicles Act.';
    } else if (isCamping) {
      screenTitle = 'Campsite Land & Tourism Compliance';
      screenSubtitle = 'Submit land revenue title / 7/12 extract, local Panchayat/Tourism NOC, and safety clearance.';
      declarationText = 'I certify that I hold legal rights to operate a campsite on these premises with necessary local panchayat/tourism permissions.';
    } else if (isLongTerm) {
      screenTitle = 'Ownership Deed & Tenancy NOC';
      screenSubtitle = 'Submit title deed and society NOC for zero brokerage long-term tenancy listing.';
      declarationText = 'I certify that I am authorized to lease this property and all terms comply with the local Tenancy Act.';
    }

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Screen Title
          Text(
            screenTitle,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 6),
          Text(
            screenSubtitle,
            style: const TextStyle(fontSize: 13.5, color: AppColors.textSecondary, height: 1.4),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 18),

          // One-Time Host Verification Status Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark
                    ? [const Color(0xFF1B2E24), const Color(0xFF0F1E16)]
                    : [const Color(0xFFECFDF5), const Color(0xFFD1FAE5)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4), width: 1.5),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: const BoxDecoration(
                    color: Color(0xFF10B981),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.verified_user_rounded, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'One-Time StarHost Verification',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF065F46)),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Documents are securely saved. When you list your next property, your host credentials will be auto-applied!',
                        style: TextStyle(fontSize: 11.5, color: Color(0xFF047857)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 150.ms),

          const SizedBox(height: 24),

          // ══════════════════════════════════════════════════════════════════
          // DYNAMIC DOCUMENTS BASED ON LISTING CATEGORY
          // ══════════════════════════════════════════════════════════════════
          if (isRv) ...[
            _buildRvDocumentsSection(provider, isDark),
          ] else if (isCamping) ...[
            _buildCampingDocumentsSection(provider, isDark),
          ] else if (isLongTerm) ...[
            _buildLongTermDocumentsSection(provider, isDark),
          ] else ...[
            // Standard Residential Stays (Owned vs Leased)
            const Text(
              'Select Property Ownership Type',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 10),

            Row(
              children: [
                _buildOwnershipTab(
                  provider,
                  type: 'OWNED',
                  icon: Icons.home_rounded,
                  label: 'Owned Property',
                  subtitle: 'I am the Legal Owner',
                  isDark: isDark,
                ),
                const SizedBox(width: 12),
                _buildOwnershipTab(
                  provider,
                  type: 'LEASED_SUBLET',
                  icon: Icons.description_rounded,
                  label: 'Leased / Sublet',
                  subtitle: 'Rented + Landlord NOC',
                  isDark: isDark,
                ),
              ],
            ).animate().fadeIn(delay: 200.ms),

            const SizedBox(height: 24),

            if (provider.ownershipType == 'OWNED') ...[
              _buildOwnedDocumentsSection(provider, isDark),
            ] else ...[
              _buildLeasedDocumentsSection(provider, isDark),
            ],
          ],

          const SizedBox(height: 24),

          // 3. Legal Undertaking & Declaration
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Checkbox(
                  value: provider.isLegalDeclarationAccepted,
                  activeColor: AppColors.primary,
                  onChanged: (val) {
                    provider.updatePropertyDocuments(declarationAccepted: val ?? true);
                  },
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 10),
                    child: Text(
                      declarationText,
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
                    ),
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 350.ms),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 1. RV DOCUMENTS SECTION
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildRvDocumentsSection(HostOnboardingProvider provider, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Required Vehicle & RTO Documents',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 6),
        const Text(
          'Ensure all vehicle documents reflect matching registration and commercial tourist carriage permits.',
          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 14),

        _buildUploadCard(
          title: '1. Vehicle Registration Certificate (RC) *',
          subtitle: 'Commercial / Tourist permit RC book or smart card showing chassis and engine numbers.',
          docPath: provider.propertyRegistryDocPath,
          icon: Icons.directions_bus_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('registry', 'Vehicle RC'),
        ),

        const SizedBox(height: 14),

        _buildUploadCard(
          title: '2. Commercial Vehicle Insurance Policy *',
          subtitle: 'Active comprehensive insurance covering passenger liability and commercial self-drive / chauffeur operations.',
          docPath: provider.leaseAgreementDocPath,
          icon: Icons.shield_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('lease', 'Commercial Insurance Policy'),
        ),

        const SizedBox(height: 14),

        _buildUploadCard(
          title: '3. Vehicle Fitness Certificate & PUC *',
          subtitle: 'Valid RTO fitness certificate and valid Pollution Under Control (PUC) clearance.',
          docPath: provider.electricityBillDocPath,
          icon: Icons.verified_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('electricity', 'Fitness & PUC Certificate'),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. CAMPING DOCUMENTS SECTION
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildCampingDocumentsSection(HostOnboardingProvider provider, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Required Campsite Land & Tourism Permits',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 6),
        const Text(
          'Submit evidence of legal possession of the camping grounds and local authority permits.',
          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 14),

        _buildUploadCard(
          title: '1. Land Ownership Title / 7/12 Extract / Lease *',
          subtitle: 'Revenue extract, 7/12 document, sale deed, or registered long-term lease for campsite grounds.',
          docPath: provider.propertyRegistryDocPath,
          icon: Icons.landscape_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('registry', 'Land Ownership / 7/12 Extract'),
        ),

        const SizedBox(height: 14),

        _buildUploadCard(
          title: '2. Gram Panchayat / Tourism Department NOC *',
          subtitle: 'Permission or registration certificate from local Gram Panchayat or state tourism board.',
          docPath: provider.landlordNocDocPath,
          icon: Icons.holiday_village_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('noc', 'Panchayat / Tourism NOC'),
        ),

        const SizedBox(height: 14),

        _buildUploadCard(
          title: '3. Fire & Environmental Safety Clearance (Optional)',
          subtitle: 'Local fire safety clearance, eco-sensitive zone NOC, or power utility bill.',
          docPath: provider.electricityBillDocPath,
          icon: Icons.local_fire_department_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('electricity', 'Safety Clearance / Utility Bill'),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. LONG-TERM HOME (ZERO BROKERAGE) DOCUMENTS SECTION
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildLongTermDocumentsSection(HostOnboardingProvider provider, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Required Ownership & Society NOC',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 6),
        const Text(
          'For 0% brokerage long-term rentals, direct ownership deed and active utility records verify direct landlord listing.',
          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 14),

        _buildUploadCard(
          title: '1. Property Ownership Deed / Allotment Letter *',
          subtitle: 'Sale deed, registered conveyance deed, or builder allotment letter.',
          docPath: provider.propertyRegistryDocPath,
          icon: Icons.home_work_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('registry', 'Ownership Deed'),
        ),

        const SizedBox(height: 14),

        _buildUploadCard(
          title: '2. Electricity / Water Utility Bill (Latest 3 Months) *',
          subtitle: 'Recent power or utility bill showing address & landlord name.',
          docPath: provider.electricityBillDocPath,
          icon: Icons.electric_bolt_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('electricity', 'Electricity Bill'),
        ),

        const SizedBox(height: 14),

        _buildUploadCard(
          title: '3. Society / Resident Welfare Association (RWA) NOC',
          subtitle: 'Society manager or RWA committee clearance approving residential tenancy.',
          docPath: provider.societyNocDocPath,
          icon: Icons.domain_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('society_noc', 'Society NOC'),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // OWNERSHIP TYPE SELECTOR TAB (FOR RESIDENTIAL)
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildOwnershipTab(
    HostOnboardingProvider provider, {
    required String type,
    required IconData icon,
    required String label,
    required String subtitle,
    required bool isDark,
  }) {
    final isSelected = provider.ownershipType == type;

    return Expanded(
      child: BouncingWidget(
        onTap: () {
          AppMotion.tapSelection();
          provider.updatePropertyDocuments(ownership: type);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.primary.withValues(alpha: 0.12)
                : (isDark ? const Color(0xFF1E1C2A) : Colors.white),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppColors.primary : AppColors.borderLight,
              width: isSelected ? 2 : 1,
            ),
            boxShadow: isSelected
                ? [BoxShadow(color: AppColors.primary.withValues(alpha: 0.15), blurRadius: 10, offset: const Offset(0, 4))]
                : [],
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? AppColors.primary : AppColors.textSecondary, size: 24),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                  color: isSelected ? AppColors.primary : AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(fontSize: 9.5, color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // OWNED RESIDENTIAL PROPERTY DOCUMENTS
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildOwnedDocumentsSection(HostOnboardingProvider provider, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Required Ownership Documents',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 6),
        const Text(
          'As the direct property owner, landlord NOC is not required.',
          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 14),

        _buildUploadCard(
          title: '1. Sale Deed / Property Registry / Tax Receipt *',
          subtitle: 'Ownership title deed, 7/12 extract, or recent property tax receipt.',
          docPath: provider.propertyRegistryDocPath,
          icon: Icons.assignment_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('registry', 'Sale Deed / Registry'),
        ),

        const SizedBox(height: 14),

        _buildUploadCard(
          title: '2. Electricity / Water Utility Bill (Latest 3 Months) *',
          subtitle: 'Active utility bill showing property address & owner name.',
          docPath: provider.electricityBillDocPath,
          icon: Icons.electric_bolt_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('electricity', 'Electricity Bill'),
        ),

        const SizedBox(height: 14),

        // Society / Apartment Toggle
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Is this inside a Flat, Apartment or Gated Society?',
                      style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                    ),
                    Text(
                      provider.isInsideGatedSociety
                          ? 'Society NOC / RWA permission is required'
                          : 'Individual house / standalone villa (No Society NOC needed)',
                      style: TextStyle(
                        fontSize: 11,
                        color: provider.isInsideGatedSociety ? AppColors.primary : AppColors.textSecondary,
                        fontWeight: provider.isInsideGatedSociety ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
              Switch(
                value: provider.isInsideGatedSociety,
                activeColor: AppColors.primary,
                onChanged: (val) {
                  provider.updatePropertyDocuments(isGatedSociety: val);
                },
              ),
            ],
          ),
        ),

        if (provider.isInsideGatedSociety) ...[
          const SizedBox(height: 14),
          _buildUploadCard(
            title: '3. Society / Resident Welfare Association (RWA) NOC *',
            subtitle: 'Permission certificate from society manager or committee for homestay/guest hosting.',
            docPath: provider.societyNocDocPath,
            icon: Icons.domain_rounded,
            isDark: isDark,
            onUpload: () => _pickDocument('society_noc', 'Society NOC'),
          ),
        ],
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LEASED / SUBLET RESIDENTIAL PROPERTY DOCUMENTS
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildLeasedDocumentsSection(HostOnboardingProvider provider, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Required Sublease & Tenancy Documents',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 6),
        const Text(
          'For leased properties, both registered lease agreement & landlord NOC are mandatory.',
          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 14),

        _buildUploadCard(
          title: '1. Registered Rent / Lease Agreement *',
          subtitle: 'Valid agreement showing active tenancy term and premises details.',
          docPath: provider.leaseAgreementDocPath,
          icon: Icons.article_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('lease', 'Rent / Lease Agreement'),
        ),

        const SizedBox(height: 14),

        _buildUploadCard(
          title: '2. Landlord No-Objection Certificate (NOC) *',
          subtitle: 'Written & signed NOC from property owner permitting StayQ hosting / sublease.',
          docPath: provider.landlordNocDocPath,
          icon: Icons.verified_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('noc', 'Landlord NOC'),
        ),

        const SizedBox(height: 14),

        // Society / Apartment Toggle
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Is this inside a Flat, Apartment or Gated Society?',
                      style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                    ),
                    Text(
                      provider.isInsideGatedSociety
                          ? 'Society NOC / RWA permission is required'
                          : 'Individual house / standalone building (No Society NOC needed)',
                      style: TextStyle(
                        fontSize: 11,
                        color: provider.isInsideGatedSociety ? AppColors.primary : AppColors.textSecondary,
                        fontWeight: provider.isInsideGatedSociety ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ),
              Switch(
                value: provider.isInsideGatedSociety,
                activeColor: AppColors.primary,
                onChanged: (val) {
                  provider.updatePropertyDocuments(isGatedSociety: val);
                },
              ),
            ],
          ),
        ),

        if (provider.isInsideGatedSociety) ...[
          const SizedBox(height: 14),
          _buildUploadCard(
            title: '3. Society / Resident Welfare Association (RWA) NOC *',
            subtitle: 'Permission certificate from society manager or committee for homestay/guest hosting.',
            docPath: provider.societyNocDocPath,
            icon: Icons.domain_rounded,
            isDark: isDark,
            onUpload: () => _pickDocument('society_noc', 'Society NOC'),
          ),
        ],

        const SizedBox(height: 14),

        _buildUploadCard(
          title: '${provider.isInsideGatedSociety ? "4" : "3"}. Electricity / Utility Bill (Latest 3 Months) *',
          subtitle: 'Recent bill establishing active utility connection at premises.',
          docPath: provider.electricityBillDocPath,
          icon: Icons.electric_bolt_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('electricity', 'Electricity Bill'),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // REUSABLE DOCUMENT UPLOAD CARD
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildUploadCard({
    required String title,
    required String subtitle,
    required String docPath,
    required IconData icon,
    required bool isDark,
    required VoidCallback onUpload,
  }) {
    final hasFile = docPath.isNotEmpty;
    final isPdf = docPath.toLowerCase().endsWith('.pdf');

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: hasFile ? const Color(0xFF10B981) : AppColors.borderLight,
          width: hasFile ? 1.5 : 1,
        ),
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
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: hasFile ? const Color(0xFF10B981).withValues(alpha: 0.1) : AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  hasFile ? Icons.check_circle_rounded : icon,
                  color: hasFile ? const Color(0xFF10B981) : AppColors.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, height: 1.3),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Upload Action / Status Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (hasFile) ...[
                Row(
                  children: [
                    if (isPdf)
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: Colors.red.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
                        ),
                        child: const Icon(Icons.picture_as_pdf_rounded, color: Colors.red, size: 20),
                      )
                    else if (!docPath.startsWith('http'))
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(File(docPath), width: 36, height: 36, fit: BoxFit.cover),
                      )
                    else
                      const Icon(Icons.image_rounded, color: Color(0xFF10B981), size: 24),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '✓ Document Attached',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF047857)),
                        ),
                        if (isPdf)
                          const Text(
                            'PDF Document',
                            style: TextStyle(fontSize: 10, color: AppColors.textSecondary),
                          ),
                      ],
                    ),
                  ],
                ),
                TextButton(
                  onPressed: onUpload,
                  child: const Text('Change File', style: TextStyle(fontSize: 12, color: AppColors.primary, fontWeight: FontWeight.bold)),
                ),
              ] else ...[
                const SizedBox.shrink(),
                BouncingWidget(
                  onTap: onUpload,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.upload_file_rounded, color: Colors.white, size: 16),
                        SizedBox(width: 6),
                        Text(
                          'Upload Document',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';

class HostVerificationScreen extends StatefulWidget {
  const HostVerificationScreen({Key? key}) : super(key: key);

  @override
  State<HostVerificationScreen> createState() => _HostVerificationScreenState();
}

class _HostVerificationScreenState extends State<HostVerificationScreen> {
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickDocument(String docType) async {
    AppMotion.tapSelection();
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt_rounded, color: AppColors.primary),
              title: const Text('Take a Photo of Document'),
              onTap: () async {
                Navigator.pop(ctx);
                final picked = await _picker.pickImage(source: ImageSource.camera, imageQuality: 85);
                if (picked != null) {
                  _saveDocPath(docType, picked.path);
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_rounded, color: AppColors.primary),
              title: const Text('Upload from Gallery / Files'),
              onTap: () async {
                Navigator.pop(ctx);
                final picked = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
                if (picked != null) {
                  _saveDocPath(docType, picked.path);
                }
              },
            ),
          ],
        ),
      ),
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

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Screen Title
          const Text(
            'Property Documents & Host Verification',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 6),
          const Text(
            'Submit proof of legal ownership or registered lease agreement, along with host ID and live selfie match.',
            style: TextStyle(fontSize: 13.5, color: AppColors.textSecondary, height: 1.4),
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

          // 1. Ownership Type Selection (Two Options Only: Owned vs Leased)
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

          // 2. Dynamic Required Document Cards Based on Ownership
          if (provider.ownershipType == 'OWNED') ...[
            _buildOwnedDocumentsSection(provider, isDark),
          ] else ...[
            _buildLeasedDocumentsSection(provider, isDark),
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
                const Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(top: 10),
                    child: Text(
                      'I certify that I possess full legal authorization under Indian Law to host guests at this property, and all uploaded documents are genuine.',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
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
  // OWNERSHIP TYPE SELECTOR TAB
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
  // ══════════════════════════════════════════════════════════════════════════
  // OWNED PROPERTY DOCUMENTS (No Landlord NOC, Society NOC only for flats)
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

        // Document 1: Sale Deed / Registry Papers / Property Tax
        _buildUploadCard(
          title: '1. Sale Deed / Property Registry / Tax Receipt *',
          subtitle: 'Ownership title deed, 7/12 extract, or recent property tax receipt.',
          docPath: provider.propertyRegistryDocPath,
          icon: Icons.assignment_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('registry'),
        ),

        const SizedBox(height: 14),

        // Document 2: Electricity / Utility Bill
        _buildUploadCard(
          title: '2. Electricity / Water Utility Bill (Latest 3 Months) *',
          subtitle: 'Active utility bill showing property address & owner name.',
          docPath: provider.electricityBillDocPath,
          icon: Icons.electric_bolt_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('electricity'),
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
            onUpload: () => _pickDocument('society_noc'),
          ),
        ],

        const SizedBox(height: 14),

        // KYC Already Verified Banner
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF10B981).withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4)),
          ),
          child: Row(
            children: [
              const Icon(Icons.verified_user_rounded, color: Color(0xFF10B981), size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Host ID & Live Selfie — Already Verified ✓',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: const Color(0xFF065F46)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Your Aadhaar/PAN and face selfie were verified via Cashfree SecureID in the previous step.',
                      style: TextStyle(fontSize: 11, color: const Color(0xFF047857)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LEASED / SUBLET PROPERTY DOCUMENTS (Lease + Landlord NOC + Society NOC)
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

        // Document 1: Rent / Lease Agreement
        _buildUploadCard(
          title: '1. Registered Rent / Lease Agreement *',
          subtitle: 'Valid agreement showing active tenancy term and premises details.',
          docPath: provider.leaseAgreementDocPath,
          icon: Icons.article_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('lease'),
        ),

        const SizedBox(height: 14),

        // Document 2: Landlord NOC
        _buildUploadCard(
          title: '2. Landlord No-Objection Certificate (NOC) *',
          subtitle: 'Written & signed NOC from property owner permitting Stay Q hosting / sublease.',
          docPath: provider.landlordNocDocPath,
          icon: Icons.verified_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('noc'),
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
            onUpload: () => _pickDocument('society_noc'),
          ),
        ],

        const SizedBox(height: 14),

        // Document 4: Electricity / Utility Bill
        _buildUploadCard(
          title: '${provider.isInsideGatedSociety ? "4" : "3"}. Electricity / Utility Bill (Latest 3 Months) *',
          subtitle: 'Recent bill establishing active utility connection at premises.',
          docPath: provider.electricityBillDocPath,
          icon: Icons.electric_bolt_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('electricity'),
        ),

        const SizedBox(height: 14),

        // KYC Already Verified Banner
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFF10B981).withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4)),
          ),
          child: Row(
            children: [
              const Icon(Icons.verified_user_rounded, color: Color(0xFF10B981), size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Host ID & Live Selfie — Already Verified ✓',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: const Color(0xFF065F46)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Your Aadhaar/PAN and face selfie were verified via Cashfree SecureID in the previous step.',
                      style: TextStyle(fontSize: 11, color: const Color(0xFF047857)),
                    ),
                  ],
                ),
              ),
            ],
          ),
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
                    if (!docPath.startsWith('http'))
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: Image.file(File(docPath), width: 36, height: 36, fit: BoxFit.cover),
                      )
                    else
                      const Icon(Icons.image_rounded, color: Color(0xFF10B981), size: 24),
                    const SizedBox(width: 8),
                    const Text(
                      '✓ Document Attached',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF047857)),
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

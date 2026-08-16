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
      case 'trade':
        provider.updatePropertyDocuments(tradeLicense: filePath);
        break;
      case 'owner_id':
        provider.updatePropertyDocuments(ownerIdProof: filePath);
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
            'Property Documents & Legal Ownership',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 6),
          const Text(
            'Submit proof of property ownership or lease agreement. This is a one-time verification for your StarHost credentials.',
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

          // 1. Ownership Type Selection
          const Text(
            'Select Ownership Type',
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
                subtitle: 'I am the Owner',
                isDark: isDark,
              ),
              const SizedBox(width: 10),
              _buildOwnershipTab(
                provider,
                type: 'LEASED_SUBLET',
                icon: Icons.description_rounded,
                label: 'Leased / Sublet',
                subtitle: 'Rented + NOC',
                isDark: isDark,
              ),
              const SizedBox(width: 10),
              _buildOwnershipTab(
                provider,
                type: 'COMMERCIAL_HOTEL',
                icon: Icons.hotel_rounded,
                label: 'Hotel / Resort',
                subtitle: 'Trade License',
                isDark: isDark,
              ),
            ],
          ).animate().fadeIn(delay: 200.ms),

          const SizedBox(height: 24),

          // 2. Dynamic Required Document Cards Based on Ownership
          if (provider.ownershipType == 'OWNED') ...[
            _buildOwnedDocumentsSection(provider, isDark),
          ] else if (provider.ownershipType == 'LEASED_SUBLET') ...[
            _buildLeasedDocumentsSection(provider, isDark),
          ] else ...[
            _buildCommercialHotelDocumentsSection(provider, isDark),
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
  // OWNED PROPERTY DOCUMENTS (Electricity Bill + Registry / Sale Deed)
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildOwnedDocumentsSection(HostOnboardingProvider provider, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Required Ownership Proofs (Ghar ke Kagaj)',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 12),

        // Document 1: Electricity / Utility Bill or Property Tax
        _buildUploadCard(
          title: '1. Electricity / Utility Bill or Property Tax Receipt',
          subtitle: 'Recent bill (within 3 months) showing property address & owner name.',
          docPath: provider.electricityBillDocPath,
          icon: Icons.electric_bolt_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('electricity'),
        ),

        const SizedBox(height: 14),

        // Document 2: Sale Deed / Registry Papers / Title Deed
        _buildUploadCard(
          title: '2. Sale Deed / Property Registry Papers / Khata Certificate',
          subtitle: 'Front page / index page of registry establishing legal title.',
          docPath: provider.propertyRegistryDocPath,
          icon: Icons.assignment_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('registry'),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LEASED / SUBLET PROPERTY DOCUMENTS (Lease Agreement + Landlord NOC)
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildLeasedDocumentsSection(HostOnboardingProvider provider, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Required Sublease & Tenancy Documents',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 12),

        // Document 1: Rent / Lease Agreement
        _buildUploadCard(
          title: '1. Registered Rent / Lease Agreement',
          subtitle: 'Valid agreement showing tenancy term and premises details.',
          docPath: provider.leaseAgreementDocPath,
          icon: Icons.article_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('lease'),
        ),

        const SizedBox(height: 14),

        // Document 2: Landlord NOC
        _buildUploadCard(
          title: '2. Landlord No-Objection Certificate (NOC)',
          subtitle: 'Written NOC from property owner permitting Stay Q hosting.',
          docPath: provider.landlordNocDocPath,
          icon: Icons.verified_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('noc'),
        ),

        const SizedBox(height: 14),

        // Document 3: Primary Owner ID Copy
        _buildUploadCard(
          title: '3. Primary Property Owner ID Proof (Optional / Recommended)',
          subtitle: 'Aadhaar / PAN copy of the main property owner.',
          docPath: provider.ownerIdProofDocPath,
          icon: Icons.badge_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('owner_id'),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COMMERCIAL HOTEL DOCUMENTS (Trade License + GST)
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildCommercialHotelDocumentsSection(HostOnboardingProvider provider, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Required Commercial Hospitality Licenses',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 12),

        // Document 1: Trade License / Shop & Establishment
        _buildUploadCard(
          title: '1. Trade License / Hotel Operating License',
          subtitle: 'Municipal or Tourism Board license for commercial operation.',
          docPath: provider.tradeLicenseDocPath,
          icon: Icons.business_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('trade'),
        ),

        const SizedBox(height: 14),

        // Document 2: Electricity Bill / Property Tax of Hotel
        _buildUploadCard(
          title: '2. Commercial Electricity / Utility Bill or GST Certificate',
          subtitle: 'Recent commercial bill or GST certificate of establishment.',
          docPath: provider.electricityBillDocPath,
          icon: Icons.receipt_long_rounded,
          isDark: isDark,
          onUpload: () => _pickDocument('electricity'),
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

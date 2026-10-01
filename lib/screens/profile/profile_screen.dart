import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';
import '../experiences/add_experience_screen.dart';
import 'edit_profile_screen.dart';
import 'wishlist_screen.dart';
import 'kyc_verification_screen.dart';
import 'payments_screen.dart';
import 'notifications_screen.dart';
import 'security_screen.dart';
import 'support_screen.dart';
import '../rewards/rewards_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  ImageProvider? _getAvatarImage(String avatar) {
    if (avatar.isEmpty) return null;
    if (avatar.startsWith('http')) return NetworkImage(avatar);
    try {
      final file = File(avatar);
      if (file.existsSync()) return FileImage(file);
    } catch (_) {}
    return AssetImage(avatar);
  }

  void _showPhotoPickerSheet(BuildContext context, AppProvider provider) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
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
            const Text(
              'Change Profile Photo',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            const Text(
              'Choose how you would like to set your profile picture:',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.camera_alt_rounded, color: AppColors.primary),
              ),
              title: const Text('Take a Photo', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Use camera to capture a new photo'),
              onTap: () async {
                Navigator.pop(ctx);
                final picker = ImagePicker();
                final picked = await picker.pickImage(source: ImageSource.camera, imageQuality: 85);
                if (picked != null) {
                  await provider.updateUserAvatar(picked.path);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Row(
                          children: [
                            Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                            SizedBox(width: 8),
                            Text('Profile photo updated permanently!'),
                          ],
                        ),
                        backgroundColor: Color(0xFF10B981),
                      ),
                    );
                  }
                }
              },
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.photo_library_rounded, color: Color(0xFF10B981)),
              ),
              title: const Text('Choose from Gallery', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: const Text('Select a photo from your gallery'),
              onTap: () async {
                Navigator.pop(ctx);
                final picker = ImagePicker();
                final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
                if (picked != null) {
                  await provider.updateUserAvatar(picked.path);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Row(
                          children: [
                            Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                            SizedBox(width: 8),
                            Text('Profile photo updated permanently!'),
                          ],
                        ),
                        backgroundColor: Color(0xFF10B981),
                      ),
                    );
                  }
                }
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final isDark = provider.isDarkMode;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Profile', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // User Info Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(
                    color: isDark ? Colors.white.withValues(alpha: 0.1) : AppColors.borderLight,
                  ),
                ),
                child: Row(
                  children: [
                    // Interactive Avatar with Camera Badge
                    GestureDetector(
                      onTap: () => _showPhotoPickerSheet(context, provider),
                      child: Stack(
                        children: [
                          CircleAvatar(
                            radius: 36,
                            backgroundColor: AppColors.primary.withOpacity(0.2),
                            backgroundImage: _getAvatarImage(provider.userAvatar),
                            child: provider.userAvatar.isEmpty
                                ? Text(
                                    provider.userName.isNotEmpty ? provider.userName[0].toUpperCase() : 'U',
                                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primary),
                                  )
                                : null,
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                                border: Border.all(color: Theme.of(context).colorScheme.surface, width: 2),
                              ),
                              child: const Icon(Icons.camera_alt_rounded, size: 14, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  provider.userName.isNotEmpty ? provider.userName : 'Stay Q User',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Theme.of(context).textTheme.titleLarge?.color,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (provider.isGovIdVerified) ...[
                                const SizedBox(width: 6),
                                const Icon(Icons.verified_rounded, color: Color(0xFF10B981), size: 20),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            provider.userEmail.isNotEmpty ? provider.userEmail : 'No Email Added',
                            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                          if (provider.userPhone.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 2),
                              child: Text(
                                provider.userPhone,
                                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // ══════════════════════════════════════════════════════════════
              // VERIFIED IDENTITY & TRUST SHOWCASE CARD
              // ══════════════════════════════════════════════════════════════
              if (provider.isGovIdVerified || provider.isBankVerified || provider.isUpiVerified) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: const Color(0xFF10B981).withValues(alpha: 0.3),
                      width: 1.5,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(
                              color: Color(0xFF10B981),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.shield_rounded, color: Colors.white, size: 16),
                          ),
                          const SizedBox(width: 10),
                          const Expanded(
                            child: Text(
                              'Stay Q Verified Identity',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF047857),
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              '100% VERIFIED',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (provider.isGovIdVerified)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              const Icon(Icons.badge_rounded, color: Color(0xFF10B981), size: 16),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'UIDAI / Govt ID: ${provider.verifiedGovIdType} (${provider.verifiedGovIdNumber}) • ${provider.verifiedFullName}',
                                  style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                                ),
                              ),
                            ],
                          ),
                        ),
                      if (provider.isBankVerified)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              const Icon(Icons.account_balance_rounded, color: Color(0xFF10B981), size: 16),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Bank A/C: ${provider.verifiedBankName} (${provider.verifiedAccountNumber}) • Cashfree Penny Drop Verified',
                                  style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                                ),
                              ),
                            ],
                          ),
                        ),
                      if (provider.isUpiVerified)
                        Row(
                          children: [
                            const Icon(Icons.flash_on_rounded, color: Color(0xFF10B981), size: 16),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'UPI ID: ${provider.verifiedUpiId} • Active Payout VPA',
                                style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 20),

              // Switch to Host Mode Card Banner
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.swap_horiz_rounded, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            provider.isHostMode ? 'Host Portal Active' : 'Become a Host',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            provider.isHostMode ? 'Manage listings and earnings' : 'Earn income by hosting your space',
                            style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.85)),
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: provider.isHostMode,
                      activeThumbColor: Colors.white,
                      activeTrackColor: AppColors.primaryDark,
                      onChanged: (value) {
                        AppMotion.tapSelection();
                        provider.toggleHostMode();
                      },
                    ),
                  ],
                ),
              ),



              const SizedBox(height: 16),

              // Host an Experience Button
              BouncingWidget(
                onTap: () {
                  AppMotion.tapSelection();
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const AddExperienceScreen()),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isDark ? Colors.white.withValues(alpha: 0.1) : AppColors.borderLight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.auto_awesome_rounded,
                          color: AppColors.primary,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Host an Experience',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Lead a local tour, class, or activity',
                              style: TextStyle(
                                fontSize: 13,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: AppColors.textMuted,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // ══════════════════════════════════════════════════════════════
              // STAY Q REWARDS & LOYALTY CARD
              // ══════════════════════════════════════════════════════════════
              BouncingWidget(
                onTap: () {
                  AppMotion.tapSelection();
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const RewardsScreen()),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1E1B4B), Color(0xFF4C1D95), Color(0xFF7C3AED)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF7C3AED).withValues(alpha: 0.3),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.stars_rounded, color: Colors.white, size: 28),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Text(
                                  'Stay Q Rewards',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF10B981),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    provider.loyaltyTierTitle.toUpperCase(),
                                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${provider.loyaltyAvailablePoints} Points (≈ ₹${provider.loyaltyCreditEquivalent.toStringAsFixed(0)} Credit)',
                              style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.9), fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: Colors.white70,
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Menu Options
              _SettingsTile(
                icon: Icons.stars_rounded,
                title: 'Stay Q Rewards & Club',
                subtitle: '${provider.loyaltyAvailablePoints} Points • ${provider.loyaltyTierTitle}',
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const RewardsScreen()));
                },
              ),
              _SettingsTile(
                icon: Icons.card_giftcard_rounded,
                title: 'Refer & Earn ₹500',
                subtitle: 'Redeem up to 10% on checkout • ₹${provider.referralBalance.toStringAsFixed(0)} available',
                onTap: () => _showReferralSheet(context, provider),
              ),
              _SettingsTile(
                icon: Icons.person_outline_rounded, 
                title: 'Personal Information',
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const EditProfileScreen()));
                },
              ),
              _SettingsTile(
                icon: Icons.favorite_border_rounded, 
                title: 'Wishlists',
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const WishlistScreen()));
                },
              ),
              _SettingsTile(
                icon: Icons.payment_rounded, 
                title: 'Payments & Payouts',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PaymentsScreen())),
              ),
              _SettingsTile(
                icon: Icons.verified_user_rounded, 
                title: 'Identity & SecureID KYC',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const KycVerificationScreen())),
              ),
              _SettingsTile(
                icon: Icons.notifications_none_rounded, 
                title: 'Notifications',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
              ),
              _SettingsTile(
                icon: Icons.security_rounded, 
                title: 'Security & Privacy',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SecurityScreen())),
              ),
              _SettingsTile(
                icon: Icons.help_outline_rounded, 
                title: 'Help & Support',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SupportScreen())),
              ),

              const SizedBox(height: 24),

              if (provider.isLoggedIn)
                BouncingWidget(
                  onTap: () {
                    AppMotion.tapLight();
                    provider.logout();
                  },
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.errorRed.withValues(alpha: 0.1),
                      foregroundColor: AppColors.errorRed,
                      elevation: 0,
                    ),
                    icon: const Icon(Icons.logout_rounded, size: 18),
                    label: const Text('Log Out'),
                    onPressed: () async {
                      AppMotion.tapLight();
                      await provider.logout();
                      if (context.mounted) {
                        Navigator.of(context, rootNavigator: true).pushNamedAndRemoveUntil(
                          '/login',
                          (route) => false,
                        );
                      }
                    },
                  ),
                )
              else
                BouncingWidget(
                  onTap: () {
                    AppMotion.tapLight();
                    Navigator.pushNamed(context, '/login');
                  },
                  child: ElevatedButton(
                    onPressed: () {
                      AppMotion.tapLight();
                      Navigator.pushNamed(context, '/login');
                    },
                    child: const Text('Log In / Sign Up'),
                  ),
                ),

              const SizedBox(height: 24),

              // App Version
              Center(
                child: const Text(
                  'Stay Q v1.0.0 • Quatalyst Private Limited',
                  style: TextStyle(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                ),
              ),

              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  void _showReferralSheet(BuildContext context, AppProvider provider) {
    final code = provider.userReferralCode.isNotEmpty ? provider.userReferralCode : 'SQ-STAYS';
    final shareUrl = 'https://stayq.space/?ref=$code';
    final isDark = provider.isDarkMode;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.2),
              blurRadius: 24,
              offset: const Offset(0, -6),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 48,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            const SizedBox(height: 20),

            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.card_giftcard_rounded, color: AppColors.primary, size: 28),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Refer Friends & Earn ₹500',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'They get ₹300 welcome credit instantly',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 20),

            // Referral Wallet Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                      ? [const Color(0xFF1E1035), const Color(0xFF2E1065)]
                      : [const Color(0xFFFBF5FF), const Color(0xFFF5F3FF)],
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Your Wallet Balance',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                      ),
                      Text(
                        '₹${provider.referralBalance.toStringAsFixed(0)}',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.primary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'YOUR REFERRAL CODE',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textMuted),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              code,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: AppColors.primary,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ],
                        ),
                        TextButton.icon(
                          style: TextButton.styleFrom(
                            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                            foregroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          ),
                          icon: const Icon(Icons.copy_rounded, size: 16),
                          label: const Text('Copy', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: code));
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Referral code copied to clipboard!')),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Key Terms
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.verified_rounded, color: Color(0xFF059669), size: 16),
                      SizedBox(width: 6),
                      Text('10% Checkout Redemption Cap', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'You can redeem up to 10% of the booking subtotal on every checkout. Unused wallet rewards stay saved for future trips.',
                    style: TextStyle(fontSize: 11, color: AppColors.textSecondary.withValues(alpha: 0.9), height: 1.4),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Share Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF25D366),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                icon: const Icon(Icons.share_rounded, size: 18),
                label: const Text('Share Code with Friends', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                onPressed: () {
                  final text = 'Hey! Use my referral code $code on Stay Q (https://stayq.space) to get ₹300 welcome credit with 0% brokerage luxury stays!';
                  Clipboard.setData(ClipboardData(text: text));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Share link & text copied to clipboard!')),
                  );
                },
              ),
            ),

            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.1) : AppColors.borderLight,
        ),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.surfaceLight.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.textPrimary, size: 20),
        ),
        title: Text(
          title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Theme.of(context).textTheme.bodyLarge?.color,
          ),
        ),
        subtitle: subtitle != null
            ? Text(
                subtitle!,
                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
              )
            : null,
        trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
        onTap: () {
          AppMotion.tapSelection();
          if (onTap != null) onTap!();
        },
      ),
    );
  }
}

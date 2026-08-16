import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';
import '../auth/login_screen.dart';
import '../experiences/add_experience_screen.dart';
import 'edit_profile_screen.dart';
import 'wishlist_screen.dart';
import 'kyc_verification_screen.dart';
import 'payments_screen.dart';
import 'notifications_screen.dart';
import 'security_screen.dart';
import 'support_screen.dart';
import '../host/onboarding/host_onboarding_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

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
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: AppColors.primary.withOpacity(0.2),
                      backgroundImage: provider.userAvatar.isNotEmpty && provider.userAvatar.startsWith('http')
                          ? NetworkImage(provider.userAvatar)
                          : (provider.userAvatar.isNotEmpty ? AssetImage(provider.userAvatar) as ImageProvider : null),
                      child: provider.userAvatar.isEmpty
                          ? Text(
                              provider.userName.isNotEmpty ? provider.userName[0].toUpperCase() : 'U',
                              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primary),
                            )
                          : null,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            provider.userName,
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).textTheme.titleLarge?.color,
                            ),
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

              const SizedBox(height: 20),

              // Dark Mode Theme Toggle Card
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isDark ? Colors.white.withValues(alpha: 0.1) : AppColors.borderLight,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            isDark ? Icons.dark_mode_rounded : Icons.light_mode_rounded,
                            color: AppColors.primary,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Text(
                          'Dark Mode',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Theme.of(context).textTheme.bodyLarge?.color,
                          ),
                        ),
                      ],
                    ),
                    Switch(
                      value: isDark,
                      activeThumbColor: Colors.white,
                      activeTrackColor: AppColors.primary,
                      onChanged: (_) {
                        AppMotion.tapSelection();
                        provider.toggleThemeMode();
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

              const SizedBox(height: 32),

              // Menu Options
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
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback? onTap;

  const _SettingsTile({required this.icon, required this.title, this.onTap});

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
        trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
        onTap: () {
          AppMotion.tapSelection();
          if (onTap != null) onTap!();
        },
      ),
    );
  }
}

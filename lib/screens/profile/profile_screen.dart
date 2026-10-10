import 'dart:io';
import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
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
import '../host/onboarding/host_onboarding_screen.dart';
import '../../services/email_verification_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with TickerProviderStateMixin {
  late AnimationController _entryController;
  late AnimationController _shimmerController;
  late AnimationController _pulseController;
  late AnimationController _rotationController;

  late Animation<double> _heroSlideAnimation;
  late Animation<double> _heroFadeAnimation;
  late Animation<double> _cardSlideAnimation;
  late Animation<double> _cardFadeAnimation;
  late Animation<double> _bentoSlideAnimation;
  late Animation<double> _bentoFadeAnimation;
  late Animation<double> _listSlideAnimation;
  late Animation<double> _listFadeAnimation;

  @override
  void initState() {
    super.initState();

    // 1. Staggered Spring Entry Controller
    _entryController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1100),
    );

    _heroSlideAnimation = Tween<double>(begin: 40, end: 0).animate(
      CurvedAnimation(
        parent: _entryController,
        curve: const Interval(0.0, 0.45, curve: Curves.easeOutBack),
      ),
    );
    _heroFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _entryController,
        curve: const Interval(0.0, 0.4, curve: Curves.easeOut),
      ),
    );

    _cardSlideAnimation = Tween<double>(begin: 45, end: 0).animate(
      CurvedAnimation(
        parent: _entryController,
        curve: const Interval(0.2, 0.65, curve: Curves.easeOutBack),
      ),
    );
    _cardFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _entryController,
        curve: const Interval(0.2, 0.6, curve: Curves.easeOut),
      ),
    );

    _bentoSlideAnimation = Tween<double>(begin: 50, end: 0).animate(
      CurvedAnimation(
        parent: _entryController,
        curve: const Interval(0.4, 0.85, curve: Curves.easeOutBack),
      ),
    );
    _bentoFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _entryController,
        curve: const Interval(0.4, 0.8, curve: Curves.easeOut),
      ),
    );

    _listSlideAnimation = Tween<double>(begin: 50, end: 0).animate(
      CurvedAnimation(
        parent: _entryController,
        curve: const Interval(0.6, 1.0, curve: Curves.easeOutCubic),
      ),
    );
    _listFadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _entryController,
        curve: const Interval(0.6, 0.95, curve: Curves.easeOut),
      ),
    );

    // 2. Holographic Shimmer Sweep (2.4s loop)
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat();

    // 3. Breathing Pulse (2.0s loop)
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    // 4. Rotating Iridescent Aura (5.0s loop)
    _rotationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 5000),
    )..repeat();

    _entryController.forward();
  }

  @override
  void dispose() {
    _entryController.dispose();
    _shimmerController.dispose();
    _pulseController.dispose();
    _rotationController.dispose();
    super.dispose();
  }

  Future<void> _verifyEmail(BuildContext context, AppProvider provider) async {
    AppMotion.tapSelection();
    final email = provider.userEmail.trim();
    if (email.isEmpty) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const EditProfileScreen()),
      );
      return;
    }
    final verified = await EmailVerificationService.showOtpDialog(
      context,
      email: email,
      userName: provider.userName,
      userId: provider.userId,
    );
    if (verified == true) {
      provider.setEmailVerified(true, email: email);
    }
  }

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
    AppMotion.tapSelection();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.96),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
            border: Border.all(color: Colors.black.withValues(alpha: 0.08)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.12),
                blurRadius: 30,
                offset: const Offset(0, -6),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.black26,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Change Profile Photo',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.4,
                  color: Color(0xFF1E1B4B),
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Select camera or gallery to update your StayQ VIP pass',
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: _AppleActionTile(
                      icon: Icons.camera_alt_rounded,
                      title: 'Camera',
                      subtitle: 'Take new portrait',
                      color: const Color(0xFF007AFF),
                      onTap: () async {
                        Navigator.pop(ctx);
                        final picker = ImagePicker();
                        final picked = await picker.pickImage(
                          source: ImageSource.camera,
                          imageQuality: 85,
                        );
                        if (picked != null) {
                          await provider.updateUserAvatar(picked.path);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Profile photo updated!'),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          }
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: _AppleActionTile(
                      icon: Icons.photo_library_rounded,
                      title: 'Photos',
                      subtitle: 'Choose from library',
                      color: const Color(0xFF34C759),
                      onTap: () async {
                        Navigator.pop(ctx);
                        final picker = ImagePicker();
                        final picked = await picker.pickImage(
                          source: ImageSource.gallery,
                          imageQuality: 85,
                        );
                        if (picked != null) {
                          await provider.updateUserAvatar(picked.path);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Profile photo updated!'),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          }
                        }
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // ── 1. ULTRA-ANIMATED AURORA MESH IN BACKGROUND ──
          Positioned(
            top: -90,
            right: -90,
            child: IgnorePointer(
              child: AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  final scale = 1.0 + (_pulseController.value * 0.15);
                  final opacity = 0.22 + (_pulseController.value * 0.12);
                  return Transform.scale(
                    scale: scale,
                    child: Container(
                      width: 320,
                      height: 320,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            const Color(0xFF8B5CF6).withValues(alpha: opacity),
                            const Color(0xFF6366F1).withValues(alpha: opacity * 0.6),
                            const Color(0xFF38BDF8).withValues(alpha: opacity * 0.2),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          Positioned(
            top: 280,
            left: -100,
            child: IgnorePointer(
              child: AnimatedBuilder(
                animation: _shimmerController,
                builder: (context, child) {
                  final angle = _shimmerController.value * 2 * math.pi;
                  final dx = math.sin(angle) * 16;
                  final dy = math.cos(angle) * 16;
                  return Transform.translate(
                    offset: Offset(dx, dy),
                    child: Container(
                      width: 300,
                      height: 300,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            const Color(0xFF06B6D4).withValues(alpha: 0.18),
                            const Color(0xFF10B981).withValues(alpha: 0.10),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          SafeArea(
            child: RefreshIndicator.adaptive(
              color: const Color(0xFF7C3AED),
              onRefresh: () async {
                AppMotion.tapLight();
                await Future.wait([
                  provider.fetchProfile(),
                  provider.fetchVerificationStatus(),
                ]);
              },
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics(),
                ),
                slivers: [
                  // ── Top Bar with Apple SF Typography ──
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(22, 16, 22, 10),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Account',
                                style: TextStyle(
                                  fontSize: 34,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -1.2,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'StayQ Verified Profile & VIP Pass',
                                style: TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                          // Referral QR Pass Pill
                          BouncingWidget(
                            onTap: () => _showReferralSheet(context, provider),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: const Color(0xFFE2E8F0),
                                  width: 1.2,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.04),
                                    blurRadius: 10,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.qr_code_rounded,
                                    size: 18,
                                    color: Color(0xFF7C3AED),
                                  ),
                                  SizedBox(width: 6),
                                  Text(
                                    'VIP Pass',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF7C3AED),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // ── Animated Content Body ──
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const SizedBox(height: 8),

                          // 1. Ultra-Animated Hero Identity Card
                          AnimatedBuilder(
                            animation: _entryController,
                            builder: (context, child) {
                              return Transform.translate(
                                offset: Offset(0, _heroSlideAnimation.value),
                                child: Opacity(
                                  opacity: _heroFadeAnimation.value,
                                  child: child,
                                ),
                              );
                            },
                            child: _buildUltraHeroCard(context, provider),
                          ),

                          const SizedBox(height: 18),

                          // 2. Liquid Morphing Mode Switcher
                          AnimatedBuilder(
                            animation: _entryController,
                            builder: (context, child) {
                              return Transform.translate(
                                offset: Offset(0, _heroSlideAnimation.value * 0.7),
                                child: Opacity(
                                  opacity: _heroFadeAnimation.value,
                                  child: child,
                                ),
                              );
                            },
                            child: _buildLiquidModeSwitcher(context, provider),
                          ),

                          const SizedBox(height: 18),

                          // 3. Holographic Apple VIP Titanium Card (Rewards Pass)
                          AnimatedBuilder(
                            animation: _entryController,
                            builder: (context, child) {
                              return Transform.translate(
                                offset: Offset(0, _cardSlideAnimation.value),
                                child: Opacity(
                                  opacity: _cardFadeAnimation.value,
                                  child: child,
                                ),
                              );
                            },
                            child: _buildHolographicVipCard(context, provider),
                          ),

                          const SizedBox(height: 18),

                          // 4. Ultra-Animated Bento Duo (Trust Radar + Referral Cash)
                          AnimatedBuilder(
                            animation: _entryController,
                            builder: (context, child) {
                              return Transform.translate(
                                offset: Offset(0, _bentoSlideAnimation.value),
                                child: Opacity(
                                  opacity: _bentoFadeAnimation.value,
                                  child: child,
                                ),
                              );
                            },
                            child: _buildAnimatedBentoGrid(context, provider),
                          ),

                          const SizedBox(height: 18),

                          // 5. Host an Experience Studio Card
                          AnimatedBuilder(
                            animation: _entryController,
                            builder: (context, child) {
                              return Transform.translate(
                                offset: Offset(0, _bentoSlideAnimation.value * 0.7),
                                child: Opacity(
                                  opacity: _bentoFadeAnimation.value,
                                  child: child,
                                ),
                              );
                            },
                            child: _buildExperienceStudioCard(context),
                          ),

                          const SizedBox(height: 24),

                          // 6. Modern Apple Settings Bento Groups
                          AnimatedBuilder(
                            animation: _entryController,
                            builder: (context, child) {
                              return Transform.translate(
                                offset: Offset(0, _listSlideAnimation.value),
                                child: Opacity(
                                  opacity: _listFadeAnimation.value,
                                  child: child,
                                ),
                              );
                            },
                            child: _buildAnimatedSettingsHub(context, provider),
                          ),

                          const SizedBox(height: 32),

                          // 7. Sign Out & Log In Actions
                          if (provider.isLoggedIn)
                            _buildSignOutAction(context, provider)
                          else
                            _buildLogInAction(context),

                          const SizedBox(height: 28),

                          // 8. Footer Brand
                          const Center(
                            child: Column(
                              children: [
                                Text(
                                  'STAYQ CONCIERGE PLATFORM',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1.4,
                                    color: Color(0xFF94A3B8),
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  '0% Brokerage • 100% Verified Stays • v1.0.0',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Color(0xFFCBD5E1),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 40),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  // 1. ULTRA-ANIMATED HERO IDENTITY CARD
  // ══════════════════════════════════════════════════════════════
  Widget _buildUltraHeroCard(BuildContext context, AppProvider provider) {
    return _AnimatedGlassCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Double Rotating Iridescent Ring Avatar
              GestureDetector(
                onTap: () => _showPhotoPickerSheet(context, provider),
                child: AnimatedBuilder(
                  animation: Listenable.merge([_rotationController, _pulseController]),
                  builder: (context, child) {
                    final angle = _rotationController.value * 2 * math.pi;
                    final pulse = _pulseController.value;
                    return Container(
                      padding: const EdgeInsets.all(3.5),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: SweepGradient(
                          colors: const [
                            Color(0xFF7C3AED),
                            Color(0xFF38BDF8),
                            Color(0xFF10B981),
                            Color(0xFFF59E0B),
                            Color(0xFFEC4899),
                            Color(0xFF7C3AED),
                          ],
                          transform: GradientRotation(angle),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF8B5CF6)
                                .withValues(alpha: 0.3 + (pulse * 0.2)),
                            blurRadius: 16 + (pulse * 8),
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: Stack(
                          children: [
                            CircleAvatar(
                              radius: 36,
                              backgroundColor: const Color(0xFFF1F5F9),
                              backgroundImage: _getAvatarImage(provider.userAvatar),
                              child: provider.userAvatar.isEmpty
                                  ? Text(
                                      provider.userName.isNotEmpty
                                          ? provider.userName[0].toUpperCase()
                                          : 'U',
                                      style: const TextStyle(
                                        fontSize: 26,
                                        fontWeight: FontWeight.w900,
                                        color: Color(0xFF7C3AED),
                                      ),
                                    )
                                  : null,
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF007AFF),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white, width: 2),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF007AFF)
                                          .withValues(alpha: 0.35),
                                      blurRadius: 6,
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  Icons.camera_alt_rounded,
                                  size: 13,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(width: 18),

              // User Info & Status
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            provider.userName.isNotEmpty
                                ? provider.userName
                                : 'StayQ Traveler',
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.6,
                              color: Color(0xFF0F172A),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 6),
                        // Live Radar Verified Beacon
                        _LiveRadarBeacon(isVerified: provider.isGovIdVerified),
                      ],
                    ),
                    const SizedBox(height: 4),

                    // Email with Verified Tag
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            provider.userEmail.isNotEmpty
                                ? provider.userEmail
                                : 'No email added',
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (provider.isEmailVerified)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 7,
                              vertical: 2.5,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'VERIFIED',
                              style: TextStyle(
                                color: Color(0xFF15803D),
                                fontSize: 9.5,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 0.5,
                              ),
                            ),
                          )
                        else if (provider.userEmail.isNotEmpty)
                          GestureDetector(
                            onTap: () => _verifyEmail(context, provider),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2.5,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFFEF3C7),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: const Color(0xFFF59E0B),
                                  width: 0.8,
                                ),
                              ),
                              child: const Text(
                                'Verify OTP',
                                style: TextStyle(
                                  color: Color(0xFFB45309),
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),

                    if (provider.userPhone.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(
                            Icons.phone_iphone_rounded,
                            size: 13,
                            color: Color(0xFF94A3B8),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            provider.userPhone,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),

              // Edit Squircle Button
              BouncingWidget(
                onTap: () {
                  AppMotion.tapSelection();
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const EditProfileScreen()),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.all(11),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: const Icon(
                    Icons.edit_rounded,
                    size: 17,
                    color: Color(0xFF334155),
                  ),
                ),
              ),
            ],
          ),

          // User Bio
          if (provider.userBio.isNotEmpty) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.format_quote_rounded,
                    size: 16,
                    color: Color(0xFF94A3B8),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      provider.userBio,
                      style: const TextStyle(
                        fontSize: 13,
                        fontStyle: FontStyle.italic,
                        color: Color(0xFF475569),
                        height: 1.35,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Quick Metadata Pills
          if (provider.userLocation.isNotEmpty ||
              provider.userGender.isNotEmpty ||
              provider.userDob.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                if (provider.userLocation.isNotEmpty)
                  _AnimatedPill(
                    icon: Icons.location_on_rounded,
                    text: provider.userLocation,
                    color: const Color(0xFF007AFF),
                  ),
                if (provider.userGender.isNotEmpty)
                  _AnimatedPill(
                    icon: Icons.person_rounded,
                    text: provider.userGender,
                    color: const Color(0xFF8B5CF6),
                  ),
                if (provider.userDob.isNotEmpty)
                  _AnimatedPill(
                    icon: Icons.cake_rounded,
                    text: provider.userDob,
                    color: const Color(0xFFF43F5E),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  // 2. LIQUID MORPHING MODE SWITCHER
  // ══════════════════════════════════════════════════════════════
  Widget _buildLiquidModeSwitcher(BuildContext context, AppProvider provider) {
    if (provider.isHost || provider.isHostMode) {
      return Container(
        padding: const EdgeInsets.all(5),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: _LiquidSegmentPill(
                isSelected: !provider.isHostMode,
                icon: Icons.luggage_rounded,
                label: 'Traveler Mode',
                activeGradient: const LinearGradient(
                  colors: [Color(0xFF0284C7), Color(0xFF0EA5E9)],
                ),
                onTap: () {
                  if (provider.isHostMode) {
                    AppMotion.tapSelection();
                    provider.setHostMode(false);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Switched to Traveler Mode'),
                        behavior: SnackBarBehavior.floating,
                        duration: Duration(milliseconds: 1400),
                      ),
                    );
                  }
                },
              ),
            ),
            const SizedBox(width: 6),
            Expanded(
              child: _LiquidSegmentPill(
                isSelected: provider.isHostMode,
                icon: Icons.dashboard_customize_rounded,
                label: 'Host Portal',
                activeGradient: const LinearGradient(
                  colors: [Color(0xFF7C3AED), Color(0xFF9333EA)],
                ),
                onTap: () {
                  if (!provider.isHostMode) {
                    AppMotion.tapSelection();
                    provider.setHostMode(true);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Switched to Host Portal'),
                        behavior: SnackBarBehavior.floating,
                        duration: Duration(milliseconds: 1400),
                      ),
                    );
                  }
                },
              ),
            ),
          ],
        ),
      );
    } else {
      // Non-Host User: Animated Become a Host Card
      return BouncingWidget(
        onTap: () {
          AppMotion.tapSelection();
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const HostOnboardingScreen(isAddingNewProperty: false),
            ),
          );
        },
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1E1B4B), Color(0xFF4338CA), Color(0xFF6D28D9)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF4F46E5).withValues(alpha: 0.35),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  color: Colors.white24,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.add_home_work_rounded,
                  color: Colors.white,
                  size: 26,
                ),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Become a StayQ Host',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -0.3,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Earn income with 0% brokerage • Fast verification',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Start',
                      style: TextStyle(
                        color: Color(0xFF4F46E5),
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward_rounded,
                      color: Color(0xFF4F46E5),
                      size: 14,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }
  }

  // ══════════════════════════════════════════════════════════════
  // 3. HOLOGRAPHIC VIP TITANIUM CARD (STAYQ REWARDS PASS)
  // ══════════════════════════════════════════════════════════════
  Widget _buildHolographicVipCard(BuildContext context, AppProvider provider) {
    return BouncingWidget(
      onTap: () {
        AppMotion.tapSelection();
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const RewardsScreen()),
        );
      },
      child: AnimatedBuilder(
        animation: _shimmerController,
        builder: (context, child) {
          final shimmerPosition = _shimmerController.value;
          return Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [
                  Color(0xFF0F172A),
                  Color(0xFF1E1B4B),
                  Color(0xFF31104B),
                  Color(0xFF0F172A),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(26),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.18),
                width: 1.4,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF7C3AED).withValues(alpha: 0.28),
                  blurRadius: 24,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Stack(
              children: [
                // Shimmer Light Sweep Effect
                Positioned.fill(
                  child: FractionallySizedBox(
                    alignment: Alignment(shimmerPosition * 3 - 1.5, 0),
                    widthFactor: 0.45,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.transparent,
                            Colors.white.withValues(alpha: 0.12),
                            Colors.white.withValues(alpha: 0.22),
                            Colors.white.withValues(alpha: 0.12),
                            Colors.transparent,
                          ],
                          transform: const GradientRotation(1.1),
                        ),
                      ),
                    ),
                  ),
                ),

                // Card Content
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.stars_rounded,
                                color: Color(0xFFFFD60A),
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 10),
                            const Text(
                              'STAYQ VIP PASS',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 1.4,
                                color: Colors.white70,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 11,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF7C3AED), Color(0xFF4F46E5)],
                            ),
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF7C3AED)
                                    .withValues(alpha: 0.4),
                                blurRadius: 8,
                              ),
                            ],
                          ),
                          child: Text(
                            provider.loyaltyTierTitle.toUpperCase(),
                            style: const TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.8,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            TweenAnimationBuilder<double>(
                              tween: Tween<double>(
                                begin: 0,
                                end: provider.loyaltyAvailablePoints.toDouble(),
                              ),
                              duration: const Duration(milliseconds: 900),
                              curve: Curves.easeOutCubic,
                              builder: (context, value, _) {
                                return Text(
                                  value.toInt().toString(),
                                  style: const TextStyle(
                                    fontSize: 36,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -1.0,
                                    color: Colors.white,
                                  ),
                                );
                              },
                            ),
                            const Text(
                              'Available Loyalty Points',
                              style: TextStyle(
                                fontSize: 12.5,
                                color: Colors.white60,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 9,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.15),
                            ),
                          ),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.account_balance_wallet_rounded,
                                size: 16,
                                color: Color(0xFF34C759),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                '≈ ₹${provider.loyaltyCreditEquivalent.toStringAsFixed(0)} Credit',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  // 4. ANIMATED BENTO GRID (Trust Radar + Referral Cash)
  // ══════════════════════════════════════════════════════════════
  Widget _buildAnimatedBentoGrid(BuildContext context, AppProvider provider) {
    final bool hasPayout = provider.isBankVerified || provider.isUpiVerified;
    final bool hasGovId = provider.isGovIdVerified;
    final bool hasEmail = provider.isEmailVerified;
    final int totalSteps = (provider.isHostMode || hasPayout) ? 3 : 2;
    final int verifiedCount =
        (hasEmail ? 1 : 0) + (hasGovId ? 1 : 0) + (hasPayout ? 1 : 0);
    final double trustProgress = (verifiedCount / totalSteps).clamp(0.0, 1.0);

    return Row(
      children: [
        // Left Tile: Trust & Security Radar
        Expanded(
          child: _AnimatedGlassCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(9),
                      decoration: BoxDecoration(
                        color: (trustProgress == 1.0
                                ? const Color(0xFF34C759)
                                : const Color(0xFFFF9500))
                            .withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(
                        Icons.shield_rounded,
                        color: trustProgress == 1.0
                            ? const Color(0xFF34C759)
                            : const Color(0xFFFF9500),
                        size: 20,
                      ),
                    ),
                    Text(
                      '${(trustProgress * 100).toInt()}%',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: trustProgress == 1.0
                            ? const Color(0xFF34C759)
                            : const Color(0xFFFF9500),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                const Text(
                  'Trust & Security',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.3,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  trustProgress == 1.0
                      ? '100% verified credentials'
                      : '$verifiedCount of $totalSteps verified',
                  style: const TextStyle(
                    fontSize: 11.5,
                    color: Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(5),
                  child: TweenAnimationBuilder<double>(
                    tween: Tween<double>(begin: 0, end: trustProgress),
                    duration: const Duration(milliseconds: 900),
                    curve: Curves.easeOutCubic,
                    builder: (context, value, _) {
                      return LinearProgressIndicator(
                        value: value,
                        minHeight: 5,
                        backgroundColor: const Color(0xFFE2E8F0),
                        valueColor: AlwaysStoppedAnimation(
                          trustProgress == 1.0
                              ? const Color(0xFF34C759)
                              : const Color(0xFFFF9500),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(width: 14),

        // Right Tile: Referral Cash
        Expanded(
          child: BouncingWidget(
            onTap: () => _showReferralSheet(context, provider),
            child: _AnimatedGlassCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(9),
                        decoration: BoxDecoration(
                          color: const Color(0xFFAF52DE).withValues(alpha: 0.14),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(
                          Icons.card_giftcard_rounded,
                          color: Color(0xFFAF52DE),
                          size: 20,
                        ),
                      ),
                      const Icon(
                        Icons.arrow_forward_ios_rounded,
                        size: 13,
                        color: Color(0xFF94A3B8),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Refer & Earn',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.3,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '₹${provider.referralBalance.toStringAsFixed(0)} Wallet Cash',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF16A34A),
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Get ₹500 on friend trip',
                    style: TextStyle(
                      fontSize: 11.5,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ══════════════════════════════════════════════════════════════
  // 5. HOST AN EXPERIENCE STUDIO CARD
  // ══════════════════════════════════════════════════════════════
  Widget _buildExperienceStudioCard(BuildContext context) {
    return BouncingWidget(
      onTap: () {
        AppMotion.tapSelection();
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const AddExperienceScreen()),
        );
      },
      child: _AnimatedGlassCard(
        padding: const EdgeInsets.all(18),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFFF2D55), Color(0xFFFF9500)],
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFFF2D55).withValues(alpha: 0.35),
                    blurRadius: 14,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.auto_awesome_rounded,
                color: Colors.white,
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
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.3,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Qube AI assisted 5-step masterclass creator',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: Color(0xFF94A3B8),
            ),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  // 6. ANIMATED SETTINGS BENTO HUB (Clean, no Dark Appearance)
  // ══════════════════════════════════════════════════════════════
  Widget _buildAnimatedSettingsHub(
    BuildContext context,
    AppProvider provider,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Group 1: Account & Credentials ──
        _buildSectionHeader('ACCOUNT & IDENTITY'),
        _AppleBentoContainer(
          items: [
            _AppleBentoItem(
              icon: Icons.person_rounded,
              iconColor: const Color(0xFF007AFF),
              title: 'Personal Information',
              subtitle: 'Name, phone, emergency contacts',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const EditProfileScreen()),
              ),
            ),
            _AppleBentoItem(
              icon: Icons.verified_user_rounded,
              iconColor: const Color(0xFF34C759),
              title: 'Identity & SecureID KYC',
              subtitle: provider.isGovIdVerified
                  ? 'Aadhaar / PAN Verified'
                  : 'Action Required for Verified Badge',
              trailingText: provider.isGovIdVerified ? 'Verified' : 'Pending',
              trailingColor: provider.isGovIdVerified
                  ? const Color(0xFF16A34A)
                  : const Color(0xFFD97706),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const KycVerificationScreen()),
              ),
            ),
            _AppleBentoItem(
              icon: Icons.credit_card_rounded,
              iconColor: const Color(0xFF8B5CF6),
              title: provider.isHostMode
                  ? 'Host Payouts & Banking'
                  : 'Payment Methods & Wallet',
              subtitle: provider.isHostMode
                  ? 'Bank accounts, IFSC, and payout VPAs'
                  : 'Saved UPI, cards, and StayQ wallet balance',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PaymentsScreen()),
              ),
            ),
            _AppleBentoItem(
              icon: Icons.favorite_rounded,
              iconColor: const Color(0xFFFF2D55),
              title: 'Wishlists & Saved Stays',
              subtitle: 'Curated bookmarks and dream itineraries',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const WishlistScreen()),
              ),
            ),
          ],
        ),

        const SizedBox(height: 24),

        // ── Group 2: Notifications & Security ──
        _buildSectionHeader('NOTIFICATIONS & PRIVACY'),
        _AppleBentoContainer(
          items: [
            _AppleBentoItem(
              icon: Icons.notifications_rounded,
              iconColor: const Color(0xFFFF9500),
              title: 'Push Notifications & Alerts',
              subtitle: 'Reservation alerts, promotions, check-in guides',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              ),
            ),
            _AppleBentoItem(
              icon: Icons.lock_rounded,
              iconColor: const Color(0xFF64748B),
              title: 'Security & Privacy',
              subtitle: 'Biometrics, passwords, session protection',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SecurityScreen()),
              ),
            ),
          ],
        ),

        const SizedBox(height: 24),

        // ── Group 3: Concierge Desk ──
        _buildSectionHeader('SUPPORT & REDRESSAL'),
        _AppleBentoContainer(
          items: [
            _AppleBentoItem(
              icon: Icons.headset_mic_rounded,
              iconColor: const Color(0xFF06B6D4),
              title: 'StayQ 24/7 Priority Concierge',
              subtitle: 'Instant support for bookings, stays & disputes',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SupportScreen()),
              ),
            ),
            _AppleBentoItem(
              icon: Icons.card_giftcard_rounded,
              iconColor: const Color(0xFFAF52DE),
              title: 'Refer & Earn ₹500',
              subtitle: 'Share invite link with friends for checkout discounts',
              onTap: () => _showReferralSheet(context, provider),
            ),
            if (provider.isLoggedIn)
              _AppleBentoItem(
                icon: Icons.delete_forever_rounded,
                iconColor: const Color(0xFFFF3B30),
                title: 'Delete Account',
                subtitle: 'Permanently remove personal data & history',
                titleColor: const Color(0xFFFF3B30),
                onTap: () => _confirmDeleteAccount(context, provider),
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 14, bottom: 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.8,
          color: Color(0xFF94A3B8),
        ),
      ),
    );
  }

  // ── Sign Out Button ──
  Widget _buildSignOutAction(BuildContext context, AppProvider provider) {
    return BouncingWidget(
      onTap: () async {
        AppMotion.tapSelection();
        await provider.logout();
        if (context.mounted) {
          Navigator.of(context, rootNavigator: true).pushNamedAndRemoveUntil(
            '/login',
            (route) => false,
          );
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFFEE2E2),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFFECACA)),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.logout_rounded,
              color: Color(0xFFDC2626),
              size: 20,
            ),
            SizedBox(width: 8),
            Text(
              'Sign Out of StayQ',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: Color(0xFFDC2626),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogInAction(BuildContext context) {
    return BouncingWidget(
      onTap: () {
        AppMotion.tapLight();
        Navigator.pushNamed(context, '/login');
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          gradient: AppColors.primaryGradient,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.3),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: const Center(
          child: Text(
            'Sign In / Create Account',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
        ),
      ),
    );
  }

  // ── Helper Dialogs ──
  void _confirmDeleteAccount(BuildContext context, AppProvider provider) {
    showCupertinoDialog(
      context: context,
      builder: (dialogCtx) => CupertinoAlertDialog(
        title: const Text('Delete Account?'),
        content: const Padding(
          padding: EdgeInsets.only(top: 8.0),
          child: Text(
            'This action is irreversible. All your bookings, wishlists, and StayQ loyalty points will be permanently deleted.',
          ),
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancel'),
            onPressed: () => Navigator.pop(dialogCtx),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            onPressed: () async {
              Navigator.pop(dialogCtx);
              final messenger = ScaffoldMessenger.of(context);
              final success = await provider.deleteAccount();
              if (!context.mounted) return;
              messenger.showSnackBar(
                SnackBar(
                  content: Text(
                    success
                        ? 'Account deletion confirmed.'
                        : provider.sessionError ?? 'Account deletion failed.',
                  ),
                ),
              );
              if (success) {
                Navigator.of(context).pushNamedAndRemoveUntil(
                  '/login',
                  (route) => false,
                );
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _showReferralSheet(BuildContext context, AppProvider provider) {
    AppMotion.tapSelection();
    final code = provider.userReferralCode;
    if (code.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Your referral code could not be loaded. Please refresh.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    final shareUrl = 'https://stayq.space/?ref=$code';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.96),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
            border: Border.all(color: Colors.black.withValues(alpha: 0.08)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.15),
                blurRadius: 30,
                offset: const Offset(0, -8),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 5,
                  decoration: BoxDecoration(
                    color: Colors.black26,
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
                      color: const Color(0xFFAF52DE).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(
                      Icons.card_giftcard_rounded,
                      color: Color(0xFFAF52DE),
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Refer Friends & Earn ₹500',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.3,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'They receive ₹300 welcome credits on signup',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Code Box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'YOUR INVITE CODE',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.0,
                            color: Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          code,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.5,
                            color: Color(0xFF7C3AED),
                          ),
                        ),
                      ],
                    ),
                    BouncingWidget(
                      onTap: () {
                        AppMotion.tapSelection();
                        Clipboard.setData(ClipboardData(text: code));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Referral code copied!'),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF7C3AED),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.copy_rounded, color: Colors.white, size: 14),
                            SizedBox(width: 4),
                            Text(
                              'Copy',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Wallet Balance
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Your Referral Wallet Balance:',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF15803D),
                      ),
                    ),
                    Text(
                      '₹${provider.referralBalance.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF15803D),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Share Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF25D366),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  icon: const Icon(Icons.share_rounded, size: 18),
                  label: const Text(
                    'Share Invite Link with Friends',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                  ),
                  onPressed: () {
                    AppMotion.tapSelection();
                    final text =
                        'Hey! Use my invite code $code on StayQ ($shareUrl) to get ₹300 welcome credits on luxury stays!';
                    Clipboard.setData(ClipboardData(text: text));
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Share link copied to clipboard!'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════════════════════════
// REUSABLE ULTRA-ANIMATED COMPONENTS
// ══════════════════════════════════════════════════════════════

class _AnimatedGlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;

  const _AnimatedGlassCard({
    required this.child,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: padding ?? const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.90),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.8),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF64748B).withValues(alpha: 0.08),
                blurRadius: 20,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: child,
        ),
      ),
    );
  }
}

class _LiveRadarBeacon extends StatefulWidget {
  final bool isVerified;

  const _LiveRadarBeacon({required this.isVerified});

  @override
  State<_LiveRadarBeacon> createState() => _LiveRadarBeaconState();
}

class _LiveRadarBeaconState extends State<_LiveRadarBeacon>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = widget.isVerified ? const Color(0xFF10B981) : const Color(0xFFF59E0B);
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final progress = _controller.value;
        return Stack(
          alignment: Alignment.center,
          children: [
            // Expanding Radar Ring
            Container(
              width: 18 + (progress * 10),
              height: 18 + (progress * 10),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: color.withValues(alpha: (1.0 - progress) * 0.6),
                  width: 1.5,
                ),
              ),
            ),
            // Center Beacon
            Container(
              width: 16,
              height: 16,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: const Icon(
                Icons.check,
                size: 9,
                color: Colors.white,
              ),
            ),
          ],
        );
      },
    );
  }
}

class _LiquidSegmentPill extends StatelessWidget {
  final bool isSelected;
  final IconData icon;
  final String label;
  final Gradient activeGradient;
  final VoidCallback onTap;

  const _LiquidSegmentPill({
    required this.isSelected,
    required this.icon,
    required this.label,
    required this.activeGradient,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          gradient: isSelected ? activeGradient : null,
          color: isSelected ? null : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.15),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : const Color(0xFF64748B),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                color: isSelected ? Colors.white : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AnimatedPill extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color color;

  const _AnimatedPill({
    required this.icon,
    required this.text,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 5),
          Text(
            text,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _AppleActionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _AppleActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return BouncingWidget(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.14),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _AppleBentoContainer extends StatelessWidget {
  final List<_AppleBentoItem> items;

  const _AppleBentoContainer({required this.items});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF64748B).withValues(alpha: 0.05),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: List.generate(items.length, (index) {
            final item = items[index];
            final isLast = index == items.length - 1;

            return Column(
              children: [
                BouncingWidget(
                  onTap: item.onTap,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    child: Row(
                      children: [
                        // Vibrant Squircle Icon
                        Container(
                          padding: const EdgeInsets.all(9),
                          decoration: BoxDecoration(
                            color: item.iconColor.withValues(alpha: 0.14),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            item.icon,
                            color: item.iconColor,
                            size: 19,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.title,
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.3,
                                  color: item.titleColor ?? const Color(0xFF0F172A),
                                ),
                              ),
                              if (item.subtitle != null) ...[
                                const SizedBox(height: 2),
                                Text(
                                  item.subtitle!,
                                  style: const TextStyle(
                                    fontSize: 11.5,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        if (item.trailingText != null) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: (item.trailingColor ?? const Color(0xFF64748B))
                                  .withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              item.trailingText!,
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w800,
                                color: item.trailingColor ?? const Color(0xFF64748B),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                        ],
                        const Icon(
                          Icons.chevron_right_rounded,
                          size: 18,
                          color: Color(0xFFCBD5E1),
                        ),
                      ],
                    ),
                  ),
                ),
                if (!isLast)
                  const Divider(
                    height: 1,
                    thickness: 0.8,
                    indent: 58,
                    endIndent: 0,
                    color: Color(0xFFF1F5F9),
                  ),
              ],
            );
          }),
        ),
      ),
    );
  }
}

class _AppleBentoItem {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String? subtitle;
  final Color? titleColor;
  final String? trailingText;
  final Color? trailingColor;
  final VoidCallback? onTap;

  _AppleBentoItem({
    required this.icon,
    required this.iconColor,
    required this.title,
    this.subtitle,
    this.titleColor,
    this.trailingText,
    this.trailingColor,
    this.onTap,
  });
}

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/search_bar_header.dart';
import '../../widgets/category_selector.dart';
import '../../widgets/zero_broker_banner.dart';
import '../../widgets/rv_overland_feature_card.dart';
import '../../widgets/camping_section_banner.dart';
import '../../widgets/trust_features_grid.dart';
import '../../widgets/curated_stays_list.dart';
import '../../widgets/stays_highlight_carousel.dart';
import '../../widgets/floating_map_button.dart';
import '../../widgets/master_home_slider.dart';
import '../search/search_filter_modal.dart';
import 'category_view_screen.dart';
import '../../widgets/bouncing_widget.dart';
import '../../widgets/home_bento_box.dart';
import '../../widgets/moving_collage_banner.dart';
import '../profile/notifications_screen.dart';
import '../rewards/rewards_screen.dart';
import '../experiences/experience_detail_screen.dart';
import '../experiences/add_experience_screen.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback onOpenMap;

  const HomeScreen({super.key, required this.onOpenMap});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedTab = 0; // 0 for Stays, 1 for Experiences
  bool _hasSeenExperiencePopup = false;

  void _showExperiencePopup() {
    showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.6),
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(24),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(32),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.2),
                  blurRadius: 40,
                  spreadRadius: 10,
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Mascot Image
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Image.asset(
                    'assets/images/experience_mascot_human.jpg',
                    height: 180,
                    width: 180,
                    fit: BoxFit.cover,
                  ),
                ).animate().scale(delay: 200.ms, duration: 500.ms, curve: Curves.easeOutBack),
                const SizedBox(height: 24),
                
                const Text(
                  'Explore Experiences!',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    color: AppColors.primary,
                  ),
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.5),
                const SizedBox(height: 12),
                
                const Text(
                  'Beyond just stays, discover local culture, thrilling adventures, and curated activities around you. StayQ can help you plan your entire itinerary!',
                  style: TextStyle(
                    fontSize: 15,
                    color: AppColors.textSecondary,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.5),
                const SizedBox(height: 32),
                
                // Action Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text(
                      'Start Exploring',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                ).animate().fadeIn(delay: 800.ms).scale(),
              ],
            ),
          ),
        ).animate().fadeIn(duration: 400.ms).scaleXY(begin: 0.8, end: 1.0, curve: Curves.easeOutCubic);
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Stack(
          children: [
            CustomScrollView(
              slivers: [
                // Top Header Bar
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Ultra Premium Logo without background
                        Row(
                          children: [
                            Image.asset(
                              'assets/images/logo_sq.png',
                              height: 36,
                              fit: BoxFit.contain,
                              color: AppColors.primary,
                            ).animate().scale(duration: 500.ms, curve: Curves.easeOutBack),
                            const SizedBox(width: 8),
                            ShaderMask(
                              shaderCallback: (bounds) => const LinearGradient(
                                colors: [AppColors.primary, AppColors.accent],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ).createShader(bounds),
                              child: const Text(
                                'StayQ',
                                style: TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white, // Required for ShaderMask
                                  letterSpacing: -1,
                                ),
                              ),
                            ).animate().fadeIn(duration: 600.ms).slideX(begin: -0.1),
                          ],
                        ),
                        Row(
                          children: [
                            GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const RewardsScreen()),
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: AppColors.borderLight),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.04),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(3),
                                      decoration: const BoxDecoration(
                                        color: Color(0xFFFEF3C7),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.account_balance_wallet_rounded,
                                        size: 14,
                                        color: Color(0xFFD97706),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      '${provider.loyaltyAvailablePoints} pts',
                                      style: const TextStyle(
                                        color: AppColors.textPrimary,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: -0.2,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                border: Border.all(color: AppColors.borderLight),
                              ),
                              child: Stack(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.notifications_none_rounded, size: 22),
                                    color: AppColors.textPrimary,
                                    tooltip: 'Notifications',
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                                      );
                                    },
                                  ),
                                  Positioned(
                                    top: 10,
                                    right: 10,
                                    child: Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: AppColors.primary,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 10),
                            GestureDetector(
                              onTap: () {
                                if (!provider.isLoggedIn) {
                                  Navigator.pushNamed(context, '/login');
                                } else {
                                  Navigator.pushNamed(context, '/profile');
                                }
                              },
                              child: CircleAvatar(
                                radius: 20,
                                backgroundColor: AppColors.primary.withValues(alpha: 0.2),
                                backgroundImage: (provider.userAvatar.isNotEmpty && !provider.userAvatar.contains('assets'))
                                    ? NetworkImage(provider.userAvatar) as ImageProvider
                                    : null,
                                child: (provider.userAvatar.isEmpty || provider.userAvatar.contains('assets'))
                                    ? Text(
                                        provider.userName.isNotEmpty ? provider.userName[0].toUpperCase() : (provider.isLoggedIn ? '?' : ''),
                                        style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 18),
                                      )
                                    : null,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                // Search Bar Pill
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    child: SearchBarHeader(
                      destination: provider.searchDestination.isNotEmpty ? provider.searchDestination : 'Where',
                      dateText: provider.selectedDateRange != null
                          ? '${provider.selectedDateRange!.start.day}/${provider.selectedDateRange!.start.month} - ${provider.selectedDateRange!.end.day}/${provider.selectedDateRange!.end.month}'
                          : 'Add dates',
                      guestText: '${provider.adultsCount + provider.childrenCount} guests',
                      onTap: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const SearchFilterModal(),
                        );
                      },
                    ),
                  ),
                ),

                // Category Selector Row (RV and Camping First, Equal Buttons)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: CategorySelector(
                      selectedCategory: provider.selectedCategory,
                      onSelectCategory: (category) {
                        provider.setCategory(category);
                        if (category != 'All Stays') {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CategoryViewScreen(categoryTitle: category),
                            ),
                          );
                        }
                      },
                    ),
                  ),
                ),

                // 1. FIRST: Bento Box Grid (RVs, Camping, Qube AI Planner, Luxury Stays)
                const SliverToBoxAdapter(
                  child: HomeBentoBox(),
                ),

                // 2. SECOND: Moving Collage Marquee
                const SliverToBoxAdapter(
                  child: MovingCollageBanner(),
                ),

                // 3. THIRD: India's 1st RV & Overland Tourism Feature Card (Full Details)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.only(bottom: 8),
                    child: RvOverlandFeatureCard(),
                  ),
                ),

                // 4. FOURTH: Camping & Eco-Glamping Banner (Customer Booking Showcase)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.only(bottom: 12),
                    child: CampingSectionBanner(),
                  ),
                ),

                // 5. Stays Highlight Carousel
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.only(bottom: 20),
                    child: StaysHighlightCarousel(),
                  ),
                ),

                // 6. Zero Broker Banner (11 months)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.only(bottom: 24),
                    child: ZeroBrokerBanner(),
                  ),
                ),

                // Master Toggle (Stays vs Experiences)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 24),
                    child: MasterHomeSlider(
                      selectedIndex: _selectedTab,
                      onChanged: (index) {
                        setState(() {
                          _selectedTab = index;
                        });
                        if (index == 1 && !_hasSeenExperiencePopup) {
                          _hasSeenExperiencePopup = true;
                          _showExperiencePopup();
                        }
                      },
                    ),
                  ),
                ),

                // Content based on selected tab with Slide Animation
                SliverToBoxAdapter(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 600),
                    switchInCurve: Curves.easeOutCubic,
                    switchOutCurve: Curves.easeInCubic,
                    transitionBuilder: (Widget child, Animation<double> animation) {
                      final inAnimation = Tween<Offset>(begin: const Offset(1.0, 0.0), end: Offset.zero).animate(animation);
                      final outAnimation = Tween<Offset>(begin: const Offset(-1.0, 0.0), end: Offset.zero).animate(animation);
                      
                      return SlideTransition(
                        position: (child.key == ValueKey(_selectedTab)) ? inAnimation : outAnimation,
                        child: FadeTransition(opacity: animation, child: child),
                      );
                    },
                    child: _selectedTab == 0
                        ? Container(
                            key: const ValueKey(0),
                            child: Column(
                              children: [
                                // Trust Badges Grid (Stays)
                                const Padding(
                                  padding: EdgeInsets.only(bottom: 24),
                                  child: TrustFeaturesGrid(),
                                ),
                                if (provider.filteredStays.isEmpty)
                                  Center(
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Container(
                                          width: 120,
                                          height: 120,
                                          decoration: const BoxDecoration(color: AppColors.surfaceLight, shape: BoxShape.circle),
                                          child: const Center(child: Text('🧊', style: TextStyle(fontSize: 60))),
                                        ).animate(onPlay: (controller) => controller.repeat(reverse: true))
                                         .scaleXY(begin: 1.0, end: 1.1, duration: 1000.ms, curve: Curves.easeInOut)
                                         .moveY(begin: 0, end: -10, duration: 1000.ms, curve: Curves.easeInOut),
                                        const SizedBox(height: 24),
                                        const Text('StayQ is looking for stays...', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                                        const SizedBox(height: 8),
                                        const Text('No properties found for your search.', style: TextStyle(fontSize: 14, color: AppColors.textSecondary)),
                                        const SizedBox(height: 100),
                                      ],
                                    ),
                                  )
                                else ...[
                                  CuratedStaysList(
                                    title: 'Premium Stays',
                                    subtitle: 'Exclusive properties for an unforgettable experience',
                                    stays: provider.filteredStays.where((s) => s.pricePerNight > 12000 || s.rating >= 4.9).toList(),
                                    onFavoriteTap: provider.toggleWishlist,
                                  ),
                                  CuratedStaysList(
                                    title: 'Popular near you',
                                    subtitle: 'Highly booked stays in your vicinity',
                                    stays: provider.filteredStays.where((s) => s.rating >= 4.7).toList()..shuffle(),
                                    onFavoriteTap: provider.toggleWishlist,
                                  ),
                                  CuratedStaysList(
                                    title: 'Guest Favorites',
                                    subtitle: 'The most loved homes on StayQ',
                                    stays: provider.filteredStays.where((s) => s.isGuestFavorite).toList(),
                                    onFavoriteTap: provider.toggleWishlist,
                                  ),
                                  const SizedBox(height: 100),
                                ],
                              ],
                            ),
                          )
                        : Container(
                            key: const ValueKey(1),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text(
                                        'Curated Local Experiences',
                                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                      ),
                                      TextButton.icon(
                                        onPressed: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(builder: (_) => const AddExperienceScreen()),
                                          );
                                        },
                                        icon: const Icon(Icons.add_circle_outline_rounded, size: 16, color: AppColors.primary),
                                        label: const Text('Host an Experience', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primary)),
                                      ),
                                    ],
                                  ),
                                ),
                                if (provider.filteredExperiences.isEmpty)
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
                                    child: Center(
                                      child: Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Container(
                                            width: 80,
                                            height: 80,
                                            decoration: BoxDecoration(
                                              color: AppColors.primary.withValues(alpha: 0.1),
                                              shape: BoxShape.circle,
                                            ),
                                            child: const Center(child: Text('✨', style: TextStyle(fontSize: 40))),
                                          ),
                                          const SizedBox(height: 18),
                                          Text(
                                            provider.searchDestination.isNotEmpty && provider.searchDestination != 'Where'
                                                ? 'No experiences in "${provider.searchDestination}" yet'
                                                : 'No experiences hosted yet',
                                            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                            textAlign: TextAlign.center,
                                          ),
                                          const SizedBox(height: 8),
                                          const Text(
                                            'Be the first host to list an authentic StayQ experience in this destination!',
                                            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                            textAlign: TextAlign.center,
                                          ),
                                          const SizedBox(height: 20),
                                          ElevatedButton.icon(
                                            onPressed: () {
                                              Navigator.push(
                                                context,
                                                MaterialPageRoute(builder: (_) => const AddExperienceScreen()),
                                              );
                                            },
                                            icon: const Icon(Icons.add_rounded, size: 18),
                                            label: const Text('Host an Experience'),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppColors.primary,
                                              foregroundColor: Colors.white,
                                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                              elevation: 0,
                                            ),
                                          ),
                                          const SizedBox(height: 40),
                                        ],
                                      ),
                                    ),
                                  )
                                else
                                  ListView.separated(
                                    shrinkWrap: true,
                                    physics: const NeverScrollableScrollPhysics(),
                                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                                    itemCount: provider.filteredExperiences.length,
                                    separatorBuilder: (_, __) => const SizedBox(height: 20),
                                    itemBuilder: (context, index) {
                                      final exp = provider.filteredExperiences[index];
                                      return GestureDetector(
                                        onTap: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => ExperienceDetailScreen(experience: exp),
                                            ),
                                          );
                                        },
                                        child: Container(
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius: BorderRadius.circular(20),
                                            boxShadow: [
                                              BoxShadow(
                                                color: Colors.black.withValues(alpha: 0.05),
                                                blurRadius: 14,
                                                offset: const Offset(0, 4),
                                              ),
                                            ],
                                            border: Border.all(color: AppColors.borderLight),
                                          ),
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              ClipRRect(
                                                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                                                child: Stack(
                                                  children: [
                                                    SizedBox(
                                                      height: 190,
                                                      width: double.infinity,
                                                      child: Image(
                                                        image: exp.firstImage.startsWith('http')
                                                            ? NetworkImage(exp.firstImage) as ImageProvider
                                                            : AssetImage(exp.firstImage),
                                                        fit: BoxFit.cover,
                                                        errorBuilder: (_, __, ___) => Container(
                                                          color: AppColors.surfaceLight,
                                                          child: const Icon(Icons.broken_image, size: 40, color: AppColors.textMuted),
                                                        ),
                                                      ),
                                                    ),
                                                    Positioned(
                                                      top: 12,
                                                      left: 12,
                                                      child: Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                        decoration: BoxDecoration(
                                                          color: Colors.black.withValues(alpha: 0.7),
                                                          borderRadius: BorderRadius.circular(12),
                                                        ),
                                                        child: Text(
                                                          exp.category.replaceAll('_', ' '),
                                                          style: const TextStyle(
                                                            color: Colors.white,
                                                            fontSize: 11,
                                                            fontWeight: FontWeight.bold,
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                    Positioned(
                                                      top: 12,
                                                      right: 12,
                                                      child: Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                        decoration: BoxDecoration(
                                                          color: const Color(0xFF059669),
                                                          borderRadius: BorderRadius.circular(12),
                                                        ),
                                                        child: Text(
                                                          '${exp.remainingSlots} spots left',
                                                          style: const TextStyle(
                                                            color: Colors.white,
                                                            fontSize: 11,
                                                            fontWeight: FontWeight.bold,
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                              Padding(
                                                padding: const EdgeInsets.all(16),
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Row(
                                                      children: [
                                                        const Icon(Icons.star_rounded, size: 16, color: Color(0xFFF59E0B)),
                                                        const SizedBox(width: 4),
                                                        Text(
                                                          exp.rating.toStringAsFixed(1),
                                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                                        ),
                                                        Text(
                                                          ' • ${exp.city.isNotEmpty ? exp.city : exp.location}',
                                                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                                                        ),
                                                        const Spacer(),
                                                        if (exp.pickupProvided)
                                                          Container(
                                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                            decoration: BoxDecoration(
                                                              color: const Color(0xFFECFDF5),
                                                              borderRadius: BorderRadius.circular(8),
                                                            ),
                                                            child: Row(
                                                              children: const [
                                                                Icon(Icons.directions_car_rounded, size: 12, color: Color(0xFF059669)),
                                                                SizedBox(width: 4),
                                                                Text(
                                                                  'Pickup',
                                                                  style: TextStyle(
                                                                    fontSize: 11,
                                                                    color: Color(0xFF059669),
                                                                    fontWeight: FontWeight.bold,
                                                                  ),
                                                                ),
                                                              ],
                                                            ),
                                                          ),
                                                      ],
                                                    ),
                                                    const SizedBox(height: 8),
                                                    Text(
                                                      exp.title,
                                                      style: const TextStyle(
                                                        fontSize: 16,
                                                        fontWeight: FontWeight.bold,
                                                        color: AppColors.textPrimary,
                                                      ),
                                                      maxLines: 2,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                    const SizedBox(height: 8),
                                                    Row(
                                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                      children: [
                                                        Row(
                                                          children: [
                                                            const Icon(Icons.schedule_rounded, size: 14, color: AppColors.textMuted),
                                                            const SizedBox(width: 4),
                                                            Text(
                                                              exp.scheduleTime ?? exp.timeSlot ?? '12:00 PM - 03:00 PM',
                                                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                                            ),
                                                          ],
                                                        ),
                                                        RichText(
                                                          text: TextSpan(
                                                            text: '₹${exp.pricePerPerson.toInt()} ',
                                                            style: const TextStyle(
                                                              fontSize: 16,
                                                              fontWeight: FontWeight.w900,
                                                              color: AppColors.textPrimary,
                                                            ),
                                                            children: const [
                                                              TextSpan(
                                                                text: '/ person',
                                                                style: TextStyle(
                                                                  fontSize: 12,
                                                                  fontWeight: FontWeight.normal,
                                                                  color: AppColors.textSecondary,
                                                                ),
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
                                        ),
                                      );
                                    },
                                  ),
                                const SizedBox(height: 100),
                              ],
                            ),
                          ),
                  ),
                ),
              ],
            ),

            // Floating Map Pill Button
            Positioned(
              bottom: 24,
              left: 0,
              right: 0,
              child: Center(
                child: FloatingMapButton(onTap: widget.onOpenMap),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildExperienceCategory(BuildContext context, String title, String imagePath) {
    return BouncingWidget(
      onTap: () {
        Provider.of<AppProvider>(context, listen: false).setCategory(title);
        Navigator.push(context, MaterialPageRoute(builder: (_) => CategoryViewScreen(categoryTitle: title)));
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.borderLight, width: 2),
              image: DecorationImage(
                image: AssetImage(imagePath),
                fit: BoxFit.cover,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

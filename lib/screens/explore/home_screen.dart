import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/search_bar_header.dart';
import '../../widgets/category_selector.dart';
import '../../widgets/hero_banner_carousel.dart';
import '../../widgets/zero_broker_banner.dart';
import '../../widgets/camping_section_banner.dart';
import '../../widgets/rv_section_banner.dart';
import '../../widgets/trust_features_grid.dart';
import '../../widgets/curated_stays_list.dart';
import '../../widgets/stay_card.dart';
import '../../widgets/stays_highlight_carousel.dart';
import '../../widgets/floating_map_button.dart';
import '../../widgets/master_home_slider.dart';
import '../search/search_filter_modal.dart';
import '../map/map_discovery_screen.dart';
import '../listing/listing_detail_screen.dart';
import '../auth/login_screen.dart';
import '../inbox/inbox_screen.dart';
import 'category_view_screen.dart';
import '../../widgets/category_popup.dart';
import '../../widgets/bouncing_widget.dart';

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
                  'Beyond just stays, discover local culture, thrilling adventures, and curated activities around you. Stay Q can help you plan your entire itinerary!',
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
                        // Ultra Premium Logo
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                gradient: AppColors.primaryGradient,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primary.withOpacity(0.3),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: const Icon(Icons.maps_home_work_rounded, color: Colors.white, size: 22),
                            ).animate().scale(duration: 500.ms, curve: Curves.easeOutBack),
                            const SizedBox(width: 10),
                            ShaderMask(
                              shaderCallback: (bounds) => const LinearGradient(
                                colors: [AppColors.primary, AppColors.accent],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ).createShader(bounds),
                              child: const Text(
                                'Stay Q',
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
                            Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                border: Border.all(color: AppColors.borderLight),
                              ),
                              child: IconButton(
                                icon: const Icon(Icons.chat_bubble_outline_rounded, size: 20),
                                color: AppColors.textPrimary,
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => const InboxScreen()),
                                  );
                                },
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

                // Category Selector Row
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
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

                // Hero Banner
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 8, bottom: 8),
                    child: HeroBannerCarousel(
                      onExploreTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const MapDiscoveryScreen()),
                        );
                      },
                    ),
                  ),
                ),

                // NEW: Our Stays Highlight Carousel
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 24),
                    child: StaysHighlightCarousel(),
                  ),
                ),

                // RV & Camping (Side-by-side Row)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: RvSectionBanner(
                            onTap: () {
                              CategoryPopup.show(
                                context,
                                title: 'List Your RV',
                                description: 'Your RV is sitting idle? List it on Stay Q and let travelers rent it for their open-road adventures!',
                                imagePath: 'assets/images/mascot_rv.jpg',
                                onExplore: () {
                                  provider.setCategory('All Stays');
                                  Navigator.push(context, MaterialPageRoute(builder: (_) => const CategoryViewScreen(categoryTitle: 'RVs')));
                                },
                              );
                            },
                          ),
                        ),
                        Expanded(
                          child: CampingSectionBanner(
                            onTap: () {
                              CategoryPopup.show(
                                context,
                                title: 'List Your Camp',
                                description: 'Did you know you can list your own camping site on Stay Q and earn money? Turn your land into an experience!',
                                imagePath: 'assets/images/camping_mascot.jpg',
                                onExplore: () {
                                  provider.setCategory('Cabins');
                                  Navigator.push(context, MaterialPageRoute(builder: (_) => const CategoryViewScreen(categoryTitle: 'Cabins')));
                                },
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Zero Broker Banner (11 months)
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
                                        const Text('Stay Q is looking for stays...', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
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
                                    subtitle: 'The most loved homes on Stay Q',
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
                              children: [
                                const Padding(
                                  padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                  child: Align(
                                    alignment: Alignment.centerLeft,
                                    child: Text(
                                      'Discover Unique Experiences',
                                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                    ),
                                  ),
                                ),
                                SizedBox(
                                  height: 110,
                                  child: ListView(
                                    scrollDirection: Axis.horizontal,
                                    padding: const EdgeInsets.symmetric(horizontal: 20),
                                    children: [
                                      _buildExperienceCategory(context, 'Trekking', 'assets/images/experiences/exp_trekking_1786510554588.jpg'),
                                      const SizedBox(width: 12),
                                      _buildExperienceCategory(context, 'Food & Drink', 'assets/images/experiences/exp_local_food_1786510665352.jpg'),
                                      const SizedBox(width: 12),
                                      _buildExperienceCategory(context, 'Scuba Diving', 'assets/images/experiences/exp_scuba_diving_1786510828235.jpg'),
                                      const SizedBox(width: 12),
                                      _buildExperienceCategory(context, 'Cultural Walk', 'assets/images/experiences/exp_cultural_walk_1786510844827.jpg'),
                                      const SizedBox(width: 12),
                                      _buildExperienceCategory(context, 'Yoga Retreat', 'assets/images/experiences/exp_yoga_retreat_1786510934894.jpg'),
                                      const SizedBox(width: 12),
                                      _buildExperienceCategory(context, 'Nature', 'assets/images/experiences/exp_nature_wildlife_1786510950052.jpg'),
                                      const SizedBox(width: 12),
                                      _buildExperienceCategory(context, 'Nightlife', 'assets/images/experiences/exp_nightlife_1786510964273.jpg'),
                                      const SizedBox(width: 12),
                                      _buildExperienceCategory(context, 'Workshops', 'assets/images/experiences/exp_workshops_1786510984781.jpg'),
                                      const SizedBox(width: 12),
                                      _buildExperienceCategory(context, 'Local Life', 'assets/images/experiences/exp_local_life_1786510999810.jpg'),
                                      const SizedBox(width: 12),
                                      _buildExperienceCategory(context, 'Sports', 'assets/images/experiences/exp_sports_1786511016655.jpg'),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 20),
                                CuratedStaysList(
                                  title: 'Top Rated Experiences',
                                  subtitle: 'Highly recommended by guests',
                                  stays: provider.stays.where((s) => s.isGuestFavorite).toList()..shuffle(), 
                                  onFavoriteTap: provider.toggleWishlist,
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

class _ExperienceCard extends StatelessWidget {
  final String title;
  final String price;
  final String imageUrl;

  const _ExperienceCard({
    required this.title,
    required this.price,
    required this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 170,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            child: AspectRatio(
              aspectRatio: 1.5,
              child: Image.asset(imageUrl, fit: BoxFit.cover),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(price, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

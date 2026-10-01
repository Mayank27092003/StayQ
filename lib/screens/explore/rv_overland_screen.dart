import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import 'category_view_screen.dart';

class RvOverlandScreen extends StatefulWidget {
  const RvOverlandScreen({super.key});

  @override
  State<RvOverlandScreen> createState() => _RvOverlandScreenState();
}

class _RvOverlandScreenState extends State<RvOverlandScreen> {
  int _selectedStoryIndex = 0;
  int _selectedKmIndex = 1;

  final List<Map<String, dynamic>> _visualStories = [
    {
      'title': 'Your Home on Wheels',
      'tagline': 'Plush double bed, AC, mini kitchen & hot shower.',
      'image': 'assets/images/rv_interior_cozy.jpg',
      'badge': 'LUXURY INTERIOR',
      'badgeColor': Color(0xFFE05638),
      'features': ['Comfy Queen Bed', 'Induction Kitchen & Sink', 'Hot Water Shower', '24/7 Power Backup'],
    },
    {
      'title': 'Wake Up Anywhere',
      'tagline': 'Park right by golden beaches, rivers, or misty mountains.',
      'image': 'assets/images/rv_beach_camp.jpg',
      'badge': 'UNLIMITED FREEDOM',
      'badgeColor': Color(0xFF0284C7),
      'features': ['Beachfront Sunsets', 'Outdoor Awning & Chairs', 'Campfire Friendly', 'Star Gazing Decks'],
    },
    {
      'title': 'Safe Resort Pit-Stops',
      'tagline': 'Guarded parking, 220V power recharge & swimming pool access.',
      'image': 'assets/images/rv_resort_dock.jpg',
      'badge': 'VERIFIED DOCKS',
      'badgeColor': Color(0xFF10B981),
      'features': ['220V Power Hookup', 'Fresh Filtered Water', 'Resort Pool & Dining', '24/7 Gated Security'],
    },
    {
      'title': 'Drive or Take a Driver',
      'tagline': 'Self-drive with normal license, or hire an expert local captain.',
      'image': 'assets/images/rv_roadtrip_drive.jpg',
      'badge': 'EFFORTLESS TRAVEL',
      'badgeColor': Color(0xFF8B5CF6),
      'features': ['Normal Car License', 'Automatic & Manual', 'Optional Verified Driver', '24/7 Roadside Help'],
    },
  ];

  final List<Map<String, dynamic>> _routes = [
    {
      'title': 'Goa ⇄ Kerala Coastal Highway',
      'duration': '6 – 8 Days',
      'distance': '950 km',
      'badge': 'Most Popular',
      'image': 'assets/images/rv_beach_camp.jpg',
      'stops': 'Goa → Gokarna → Murudeshwar → Kochi',
      'highlights': ['Beach RV Docks', 'Seafood Hubs', 'Cliff Sunsets'],
    },
    {
      'title': 'Western Ghats Monsoon Loop',
      'duration': '4 – 6 Days',
      'distance': '620 km',
      'badge': 'Scenic Hills',
      'image': 'assets/images/rv_interior_cozy.jpg',
      'stops': 'Mumbai / Pune → Lonavala → Mahabaleshwar → Goa',
      'highlights': ['Waterfalls', 'Valley Views', 'Cool Weather'],
    },
    {
      'title': 'Himalayan Mountain Circuit',
      'duration': '8 – 12 Days',
      'distance': '1,150 km',
      'badge': 'High Altitude',
      'image': 'assets/images/rv_roadtrip_drive.jpg',
      'stops': 'Chandigarh → Manali → Jispa → Sarchu → Leh',
      'highlights': ['Snow Passes', 'Heated Cabins', '4x4 Campervans'],
    },
  ];

  final List<Map<String, dynamic>> _kmOptions = [
    {
      'title': '80 km / Day',
      'desc': 'Relaxed staycation at one or two spots',
      'extra': '₹15/km after limit',
    },
    {
      'title': '100 km / Day',
      'desc': 'Ideal for coastal roadtrips & sightseeing',
      'extra': '₹14/km after limit',
      'popular': true,
    },
    {
      'title': 'Unlimited km',
      'desc': 'Complete freedom with zero extra km charges',
      'extra': 'No extra fees',
    },
  ];

  void _openRvCategory() {
    AppMotion.tapSelection();
    Provider.of<AppProvider>(context, listen: false).setCategory('RVs');
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const CategoryViewScreen(categoryTitle: 'RVs'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: CustomScrollView(
        slivers: [
          // ─── 1. HERO APP BAR ───
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            backgroundColor: const Color(0xFF1E1C2A),
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.45),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
              ),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.45),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.share_rounded, color: Colors.white, size: 18),
                ),
                onPressed: () {},
              ),
              const SizedBox(width: 8),
            ],
            flexibleSpace: FlexibleSpaceBar(
              centerTitle: true,
              title: const Text(
                'Campervans & Caravans',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 16,
                  letterSpacing: -0.3,
                ),
              ),
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.asset(
                    'assets/images/campervan_wide_8k.jpg',
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Image.asset(
                      'assets/images/real_rv.jpg',
                      fit: BoxFit.cover,
                    ),
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.black.withValues(alpha: 0.35),
                          Colors.black.withValues(alpha: 0.85),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                  Positioned(
                    top: 80,
                    left: 20,
                    right: 20,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.directions_bus_rounded, color: Colors.white, size: 13),
                              SizedBox(width: 5),
                              Text(
                                "India's #1 Campervan Network",
                                style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'Your Hotel Room On Wheels.\nWake Up Wherever You Want.',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 19,
                            fontWeight: FontWeight.w900,
                            height: 1.25,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ─── 2. QUICK FEATURE PILLS ───
          SliverToBoxAdapter(
            child: Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildFeaturePill(Icons.bed_rounded, 'Double Bed', const Color(0xFFE05638)),
                    const SizedBox(width: 8),
                    _buildFeaturePill(Icons.ac_unit_rounded, 'Full AC', const Color(0xFF0284C7)),
                    const SizedBox(width: 8),
                    _buildFeaturePill(Icons.shower_rounded, 'Hot Shower', const Color(0xFF10B981)),
                    const SizedBox(width: 8),
                    _buildFeaturePill(Icons.bolt_rounded, 'Power Backup', const Color(0xFFF59E0B)),
                    const SizedBox(width: 8),
                    _buildFeaturePill(Icons.pets_rounded, 'Pet Friendly', const Color(0xFF8B5CF6)),
                    const SizedBox(width: 8),
                    _buildFeaturePill(Icons.verified_user_rounded, 'Insured', const Color(0xFF059669)),
                  ],
                ),
              ),
            ),
          ),

          // ─── 3. VISUAL EXPERIENCE WALKTHROUGH ───
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'How RV Travel Works',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: AppColors.textPrimary,
                              letterSpacing: -0.5,
                            ),
                          ),
                          SizedBox(height: 3),
                          Text(
                            'Simple, comfortable, and 100% hassle-free',
                            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'Visual Tour',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Horizontal Story Selector Tabs
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: List.generate(_visualStories.length, (index) {
                        final isSelected = _selectedStoryIndex == index;
                        final story = _visualStories[index];
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: GestureDetector(
                            onTap: () => setState(() => _selectedStoryIndex = index),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: isSelected ? AppColors.primary : Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: isSelected ? AppColors.primary : AppColors.borderLight,
                                ),
                                boxShadow: isSelected
                                    ? [
                                        BoxShadow(
                                          color: AppColors.primary.withValues(alpha: 0.25),
                                          blurRadius: 8,
                                          offset: const Offset(0, 3),
                                        ),
                                      ]
                                    : [],
                              ),
                              child: Text(
                                story['title'] as String,
                                style: TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.bold,
                                  color: isSelected ? Colors.white : AppColors.textPrimary,
                                ),
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Active Visual Showcase Card (Realistic Photo + Features)
                  _buildVisualCard(_visualStories[_selectedStoryIndex]),
                ],
              ),
            ),
          ),

          // ─── 4. POPULAR ROADTRIP ROUTES ───
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Curated Roadtrip Routes',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    'Tested corridors with verified night pit-stops along the way',
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 14),

                  // Route Cards
                  ..._routes.map((route) {
                    return Container(
                      margin: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.borderLight),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.03),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Route Photo with Badge
                          Stack(
                            children: [
                              SizedBox(
                                height: 130,
                                width: double.infinity,
                                child: Image.asset(
                                  route['image'] as String,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Image.asset(
                                    'assets/images/real_rv.jpg',
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                              Positioned.fill(
                                child: Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        Colors.black.withValues(alpha: 0.1),
                                        Colors.black.withValues(alpha: 0.65),
                                      ],
                                      begin: Alignment.topCenter,
                                      end: Alignment.bottomCenter,
                                    ),
                                  ),
                                ),
                              ),
                              Positioned(
                                top: 12,
                                left: 12,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    route['badge'] as String,
                                    style: const TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ),
                              Positioned(
                                bottom: 10,
                                left: 14,
                                right: 14,
                                child: Text(
                                  route['title'] as String,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          // Route Details
                          Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.schedule_rounded, size: 14, color: AppColors.textSecondary),
                                    const SizedBox(width: 4),
                                    Text(
                                      route['duration'] as String,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                                    ),
                                    const SizedBox(width: 14),
                                    const Icon(Icons.route_rounded, size: 14, color: AppColors.textSecondary),
                                    const SizedBox(width: 4),
                                    Text(
                                      route['distance'] as String,
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const Icon(Icons.pin_drop_rounded, size: 14, color: AppColors.primary),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        route['stops'] as String,
                                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 6,
                                  children: (route['highlights'] as List<String>).map((hl) {
                                    return Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF3F4F6),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        hl,
                                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),

          // ─── 5. SIMPLE KM PACKAGES (NO FLUFF) ───
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Daily Kilometer Packages',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.4,
                    ),
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    'Choose the right plan for your journey. No hidden fees.',
                    style: TextStyle(fontSize: 12.5, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 12),

                  Row(
                    children: List.generate(_kmOptions.length, (i) {
                      final isSelected = _selectedKmIndex == i;
                      final opt = _kmOptions[i];
                      final isPopular = opt['popular'] == true;

                      return Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedKmIndex = i),
                          child: Container(
                            margin: EdgeInsets.only(right: i < _kmOptions.length - 1 ? 8 : 0),
                            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.primary.withValues(alpha: 0.06) : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isSelected ? AppColors.primary : AppColors.borderLight,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: Column(
                              children: [
                                if (isPopular)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    margin: const EdgeInsets.only(bottom: 6),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text(
                                      'POPULAR',
                                      style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                                    ),
                                  )
                                else
                                  const SizedBox(height: 18),
                                FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Text(
                                    opt['title'] as String,
                                    style: TextStyle(
                                      fontSize: 13.5,
                                      fontWeight: FontWeight.w900,
                                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Text(
                                    opt['extra'] as String,
                                    style: const TextStyle(fontSize: 10.5, color: AppColors.textSecondary),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ],
              ),
            ),
          ),

          // ─── 6. BOTTOM CTA BUTTON ───
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 10, 20, 36),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _openRvCategory,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.directions_car_filled_rounded, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Browse Available Campervans',
                          style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15.5),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeaturePill(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color),
          ),
        ],
      ),
    );
  }

  Widget _buildVisualCard(Map<String, dynamic> story) {
    final badgeColor = story['badgeColor'] as Color;
    final features = story['features'] as List<String>;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Realistic Image Showcase with Badge
          Stack(
            children: [
              SizedBox(
                height: 200,
                width: double.infinity,
                child: Image.asset(
                  story['image'] as String,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Image.asset(
                    'assets/images/campervan_wide_8k.jpg',
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              Positioned(
                top: 14,
                left: 14,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: badgeColor,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.25),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Text(
                    story['badge'] as String,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ),
            ],
          ),

          // Content Details
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  story['title'] as String,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  story['tagline'] as String,
                  style: const TextStyle(
                    fontSize: 13.5,
                    color: AppColors.textSecondary,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 14),

                // 2x2 Feature Tags Grid
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: features.map((feat) {
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF9FAFB),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.borderLight),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.check_circle_rounded, size: 14, color: Color(0xFF10B981)),
                          const SizedBox(width: 6),
                          Text(
                            feat,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.05);
  }
}

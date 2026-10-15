import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../models/stay_model.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import 'category_view_screen.dart';
import 'corridor_detail_screen.dart';
import '../listing/listing_detail_screen.dart';
import '../../models/corridor_model.dart';
import '../../models/corridor_region.dart';
import '../../data/curated_corridors_dataset.dart';
import '../../services/corridors_repository.dart';
import '../qube/qube_planner_screen.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

class RvOverlandScreen extends StatefulWidget {
  const RvOverlandScreen({super.key});

  @override
  State<RvOverlandScreen> createState() => _RvOverlandScreenState();
}

class _RvOverlandScreenState extends State<RvOverlandScreen> {
  int _selectedStoryIndex = 0;
  int _selectedKmIndex = 1;
  CorridorRegion _selectedRegion = CorridorRegion.northIndia;
  List<CorridorModel> _corridors = curatedCampervanCorridors;
  bool _isLoadingCorridors = false;
  final CorridorsRepository _corridorsRepo = CorridorsRepository();

  @override
  void initState() {
    super.initState();
    _loadCorridors();
  }

  Future<void> _loadCorridors() async {
    setState(() => _isLoadingCorridors = true);
    final list = await _corridorsRepo.getCorridors();
    if (mounted && list.isNotEmpty) {
      setState(() {
        _corridors = list;
        _isLoadingCorridors = false;
      });
    } else if (mounted) {
      setState(() => _isLoadingCorridors = false);
    }
  }

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

  String _getRegionLabel(CorridorRegion region) {
    switch (region) {
      case CorridorRegion.northIndia:
        return 'North India';
      case CorridorRegion.southIndia:
        return 'South India';
      case CorridorRegion.gujaratRajasthan:
        return 'Gujarat & Rajasthan';
      case CorridorRegion.northEast:
        return 'North East';
    }
  }

  String _getRegionEmoji(CorridorRegion region) {
    switch (region) {
      case CorridorRegion.northIndia:
        return '🏔️';
      case CorridorRegion.southIndia:
        return '🌊';
      case CorridorRegion.gujaratRajasthan:
        return '🏜️';
      case CorridorRegion.northEast:
        return '🌿';
    }
  }

  String _getRegionImage(CorridorRegion region) {
    switch (region) {
      case CorridorRegion.northIndia:
        return 'assets/images/corridor_north_india.jpg';
      case CorridorRegion.southIndia:
        return 'assets/images/corridor_south_india.jpg';
      case CorridorRegion.gujaratRajasthan:
        return 'assets/images/corridor_gujarat_rajasthan.jpg';
      case CorridorRegion.northEast:
        return 'assets/images/corridor_north_east.jpg';
    }
  }

  String _getRegionTitle(CorridorRegion region) {
    switch (region) {
      case CorridorRegion.northIndia:
        return 'Himalayan Passes & Royal Heritage';
      case CorridorRegion.southIndia:
        return 'Coastal Highways & Western Ghats Loops';
      case CorridorRegion.gujaratRajasthan:
        return 'Desert Dunes & Salt Flat Frontiers';
      case CorridorRegion.northEast:
        return 'Living Root Bridges & Emerald Valleys';
    }
  }

  String _getRegionDescription(CorridorRegion region) {
    switch (region) {
      case CorridorRegion.northIndia:
        return 'Snow-capped mountain views, Tibetan monasteries, pine trails & royal forts with verified pit-stops.';
      case CorridorRegion.southIndia:
        return 'Arabian Sea coastal highways, coffee estate loops, beach camps & cliffside sunset docks.';
      case CorridorRegion.gujaratRajasthan:
        return 'Thar desert stargazing dunes, white salt flats of Kutch, historic royal palaces & wild safaris.';
      case CorridorRegion.northEast:
        return 'Dawki crystal rivers, cloud-capped valleys, living root bridges & offbeat tea-estate campervan docks.';
    }
  }

  void _planWithQube(CorridorModel corridor) {
    AppMotion.tapSelection();
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => QubePlannerScreen(
          initialPrompt:
              'I want to plan a campervan roadtrip for the "${corridor.name}" (${corridor.durationFormatted}, ${corridor.distanceFormatted}). '
              'The route covers: ${corridor.route}. '
              'Theme: ${corridor.theme}. '
              'Can you create a day-by-day campervan itinerary with recommended overnight pit-stops and scenic viewpoints?',
        ),
      ),
    );
  }

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
    final provider = Provider.of<AppProvider>(context);
    final fleetRvs = provider.stays
        .where((s) => s.isRv || s.propertyType == 'RV' || s.category.toUpperCase().contains('RV'))
        .toList();

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
                    errorBuilder: (_, _, _) => Image.asset(
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

          // ─── 2B. ACTIVE FLEET INVENTORY ───
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF10B981),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              const Text(
                                'ACTIVE FLEET IN INDIA',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 0.6,
                                  color: Color(0xFF10B981),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Available Campervans',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: AppColors.textPrimary,
                              letterSpacing: -0.5,
                            ),
                          ),
                        ],
                      ),
                      if (fleetRvs.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE05638).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE05638).withValues(alpha: 0.3)),
                          ),
                          child: Text(
                            '${fleetRvs.length} Ready',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFFE05638),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Pre-inspected mobile suites ready for self-drive or with verified captain.',
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 16),
                  if (fleetRvs.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: AppColors.borderLight),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.airport_shuttle_rounded, color: AppColors.primary, size: 36),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Fleet Radar Searching...',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                ),
                                const SizedBox(height: 2),
                                const Text(
                                  'Connecting to active campervans in network.',
                                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                          ),
                          TextButton(
                            onPressed: () => provider.fetchStays(),
                            child: const Text('Refresh'),
                          ),
                        ],
                      ),
                    )
                  else
                    Column(
                      children: fleetRvs.map((stay) => _buildFleetCard(stay, provider)).toList(),
                    ),
                ],
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
                      const Expanded(
                        child: Column(
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
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF111111).withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'Visual Tour',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF111111)),
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

          // ─── 4. REGIONAL CAMPERVAN CORRIDORS ───
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'CURATED ITINERARIES',
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.6,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                      const Spacer(),
                      if (_isLoadingCorridors)
                        const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Regional Travel Corridors',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Vetted overland routes with verified 220V power docks, night halts & camping spots',
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.35),
                  ),
                  const SizedBox(height: 16),

                  // Region Selection Tabs
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    physics: const BouncingScrollPhysics(),
                    child: Row(
                      children: CorridorRegion.values.map((region) {
                        final isSelected = _selectedRegion == region;
                        final count = _corridors.where((c) => c.region == region).length;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: InkWell(
                            onTap: () {
                              AppMotion.tapSelection();
                              setState(() => _selectedRegion = region);
                            },
                            borderRadius: BorderRadius.circular(14),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: isSelected ? AppColors.primary : Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: isSelected ? AppColors.primary : AppColors.borderLight,
                                  width: isSelected ? 1.5 : 1,
                                ),
                                boxShadow: isSelected
                                    ? [
                                        BoxShadow(
                                          color: AppColors.primary.withValues(alpha: 0.25),
                                          blurRadius: 8,
                                          offset: const Offset(0, 3),
                                        ),
                                      ]
                                    : [
                                        BoxShadow(
                                          color: Colors.black.withValues(alpha: 0.02),
                                          blurRadius: 4,
                                          offset: const Offset(0, 1),
                                        ),
                                      ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    _getRegionEmoji(region),
                                    style: const TextStyle(fontSize: 15),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    _getRegionLabel(region),
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w800,
                                      color: isSelected ? Colors.white : AppColors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? Colors.white.withValues(alpha: 0.25)
                                          : const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      '$count',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        color: isSelected ? Colors.white : AppColors.textSecondary,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Realistic Collage Showcase Hero Card for Active Region
                  _buildRegionCollageHeroCard(_selectedRegion),
                  const SizedBox(height: 16),

                  // List of Corridor Cards for selected region
                  ..._corridors
                      .where((c) => c.region == _selectedRegion)
                      .toList()
                      .map((corridor) => _buildCorridorCard(corridor)),
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
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.directions_car_filled_rounded, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          fleetRvs.isNotEmpty
                              ? 'Browse All Campervans (${fleetRvs.length})'
                              : 'Browse Available Campervans',
                          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15.5),
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

  Widget _buildFleetCard(StayModel stay, AppProvider provider) {
    final currencyFormatter = NumberFormat.currency(symbol: '₹', decimalDigits: 0);
    final photo = stay.imageUrls.isNotEmpty ? stay.imageUrls.first : 'assets/images/campervan_wide_8k.jpg';
    final isNetwork = photo.startsWith('http://') || photo.startsWith('https://');

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(22),
        child: InkWell(
          borderRadius: BorderRadius.circular(22),
          onTap: () {
            AppMotion.tapSelection();
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => ListingDetailScreen(stay: stay)),
            );
          },
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(21)),
                    child: AspectRatio(
                      aspectRatio: 16 / 9,
                      child: isNetwork
                          ? Image.network(
                              photo,
                              fit: BoxFit.cover,
                              errorBuilder: (_, _, _) => Image.asset('assets/images/campervan_wide_8k.jpg', fit: BoxFit.cover),
                            )
                          : Image.asset(photo, fit: BoxFit.cover),
                    ),
                  ),
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.7),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.verified_rounded, color: Color(0xFF10B981), size: 14),
                          SizedBox(width: 4),
                          Text(
                            'STAYQ VERIFIED RV',
                            style: TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    top: 12,
                    right: 12,
                    child: IconButton(
                      icon: Container(
                        padding: const EdgeInsets.all(7),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.45),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          stay.isWishlisted ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                          color: stay.isWishlisted ? Colors.redAccent : Colors.white,
                          size: 18,
                        ),
                      ),
                      onPressed: () => provider.toggleWishlist(stay),
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                stay.title,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 3),
                              Row(
                                children: [
                                  const Icon(Icons.location_on_rounded, size: 14, color: AppColors.textSecondary),
                                  const SizedBox(width: 3),
                                  Expanded(
                                    child: Text(
                                      stay.location.isNotEmpty ? stay.location : (stay.city.isNotEmpty ? stay.city : 'India'),
                                      style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        if (stay.rating > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFBBF24).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.star_rounded, size: 14, color: Color(0xFFD97706)),
                                const SizedBox(width: 3),
                                Text(
                                  stay.rating.toStringAsFixed(1),
                                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: Color(0xFFB45309)),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        _buildFleetChip(Icons.airline_seat_flat_rounded, 'Queen Bed'),
                        _buildFleetChip(Icons.ac_unit_rounded, 'Full AC'),
                        _buildFleetChip(Icons.power_rounded, '220V Power'),
                        _buildFleetChip(Icons.bathtub_outlined, 'Shower & Toilet'),
                        if (stay.maxGuests > 0)
                          _buildFleetChip(Icons.people_alt_outlined, '${stay.maxGuests} Berths'),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const Divider(height: 1, color: AppColors.borderLight),
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              RichText(
                                text: TextSpan(
                                  children: [
                                    TextSpan(
                                      text: currencyFormatter.format(stay.pricePerNight),
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.w900,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    const TextSpan(
                                      text: ' / day',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const Text(
                                'Includes Insurance & Roadside SOS',
                                style: TextStyle(fontSize: 10.5, color: Color(0xFF10B981), fontWeight: FontWeight.w600),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton.icon(
                          onPressed: () {
                            AppMotion.tapSelection();
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => ListingDetailScreen(stay: stay)),
                            );
                          },
                          icon: const Icon(Icons.key_rounded, size: 16),
                          label: const Text('View & Book', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF111111),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
      ),
    );
  }

  Widget _buildFleetChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: AppColors.textSecondary),
          const SizedBox(width: 4),
          Text(
            label,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
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
                  errorBuilder: (_, _, _) => Image.asset(
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

  Widget _buildRegionCollageHeroCard(CorridorRegion region) {
    final count = _corridors.where((c) => c.region == region).length;
    final imagePath = _getRegionImage(region);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              SizedBox(
                height: 190,
                width: double.infinity,
                child: Image.asset(
                  imagePath,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) => Image.asset(
                    'assets/images/campervan_wide_8k.jpg',
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.black.withValues(alpha: 0.15),
                        Colors.black.withValues(alpha: 0.75),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),
              ),
              Positioned(
                top: 14,
                left: 14,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(_getRegionEmoji(region), style: const TextStyle(fontSize: 13)),
                      const SizedBox(width: 6),
                      Text(
                        _getRegionLabel(region).toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                top: 14,
                right: 14,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.3),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Text(
                    '$count Curated Routes',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
              Positioned(
                bottom: 14,
                left: 16,
                right: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getRegionTitle(region),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      _getRegionDescription(region),
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 12.5,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                _buildQuickFeatureTag(Icons.electric_bolt_rounded, '220V Pit-Stops'),
                const SizedBox(width: 8),
                _buildQuickFeatureTag(Icons.verified_user_rounded, 'Safe Night Docks'),
                const SizedBox(width: 8),
                _buildQuickFeatureTag(Icons.route_rounded, 'Scenic Highways'),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 250.ms);
  }

  Widget _buildQuickFeatureTag(IconData icon, String text) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 6),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 13, color: AppColors.primary),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                text,
                style: const TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCorridorCard(CorridorModel corridor) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1D2D) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? const Color(0xFF2E2C44) : AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            AppMotion.tapSelection();
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => CorridorDetailScreen(corridor: corridor),
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Numbering/Badge & Duration/Distance Stats
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '#${corridor.sortOrder}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                    if (corridor.badge != null) ...[
                      const SizedBox(width: 8),
                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E3A8A).withValues(alpha: 0.5) : const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: isDark ? const Color(0xFF3B82F6).withValues(alpha: 0.4) : const Color(0xFFBFDBFE)),
                          ),
                          child: Text(
                            corridor.badge!,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: isDark ? const Color(0xFF93C5FD) : const Color(0xFF1D4ED8),
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                    ],
                    const Spacer(),
                    Row(
                      children: [
                        Icon(Icons.schedule_rounded, size: 14, color: isDark ? Colors.white54 : AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text(
                          corridor.durationFormatted,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Icon(Icons.straighten_rounded, size: 14, color: isDark ? Colors.white54 : AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text(
                          corridor.distanceFormatted,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Corridor Name
                Text(
                  corridor.name,
                  style: TextStyle(
                    fontSize: 17.5,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : AppColors.textPrimary,
                    letterSpacing: -0.3,
                  ),
                ),
                const SizedBox(height: 4),

                // Theme
                Row(
                  children: [
                    const Icon(Icons.stars_rounded, size: 14, color: Color(0xFFE05638)),
                    const SizedBox(width: 5),
                    Expanded(
                      child: Text(
                        corridor.theme,
                        style: const TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFFE05638),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Route Pathway Visual Chain
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF161522) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: isDark ? const Color(0xFF2E2C44) : const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.alt_route_rounded, size: 15, color: AppColors.primary),
                          const SizedBox(width: 6),
                          Text(
                            'ROUTE PATHWAY (${corridor.stops.length} STOPS)',
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.5,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        corridor.route,
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // Description
                Text(
                  corridor.description,
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? const Color(0xFF94A3B8) : AppColors.textSecondary,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 10),

                // Highlights Chips
                if (corridor.highlights.isNotEmpty) ...[
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: corridor.highlights.map((hl) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF28273A) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(7),
                        ),
                        child: Text(
                          hl,
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 10),
                ],

                // Advisory Notes or Permits (if present)
                if (corridor.advisoryNotes != null || corridor.permits.isNotEmpty) ...[
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF3F2B04) : const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: isDark ? const Color(0xFF78350F) : const Color(0xFFFDE68A)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (corridor.advisoryNotes != null)
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.info_outline_rounded, size: 14, color: Color(0xFFF59E0B)),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  corridor.advisoryNotes!,
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                                    height: 1.35,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        if (corridor.permits.isNotEmpty) ...[
                          if (corridor.advisoryNotes != null) const SizedBox(height: 4),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.assignment_outlined, size: 14, color: Color(0xFFF59E0B)),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'Permits: ${corridor.permits.join(', ')}',
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                                    height: 1.35,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                ],

                // Source Attribution
                if (corridor.sourceName != null) ...[
                  Row(
                    children: [
                      const Icon(Icons.verified_rounded, size: 13, color: Color(0xFF0284C7)),
                      const SizedBox(width: 5),
                      Expanded(
                        child: Text(
                          'Curated & inspired by ${corridor.sourceName}',
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? const Color(0xFF38BDF8) : const Color(0xFF0369A1),
                            fontWeight: FontWeight.w600,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                ],

                // Google Maps Route Preview Button
                InkWell(
                  onTap: () => _openCorridorMapModal(context, corridor),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: isDark
                            ? [const Color(0xFF064E3B).withValues(alpha: 0.4), const Color(0xFF065F46).withValues(alpha: 0.4)]
                            : [const Color(0xFFF0FDF4), const Color(0xFFDCFCE7)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isDark ? const Color(0xFF059669) : const Color(0xFF86EFAC)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(
                            color: Color(0xFF16A34A),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.map_rounded, color: Colors.white, size: 14),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Explore ${corridor.name} on Google Maps',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: isDark ? const Color(0xFF86EFAC) : const Color(0xFF15803D),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                'Interactive route, ${corridor.stops.length} stop pins & turn-by-turn overland directions',
                                style: TextStyle(
                                  fontSize: 10.5,
                                  color: isDark ? const Color(0xFF4ADE80) : const Color(0xFF166534),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        Icon(Icons.arrow_forward_ios_rounded, size: 12, color: isDark ? const Color(0xFF86EFAC) : const Color(0xFF15803D)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Actions Row: "Plan with Qube" & "View RVs"
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: ElevatedButton.icon(
                        onPressed: () => _planWithQube(corridor),
                        icon: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: Image.asset(
                            'assets/images/qube_robot.jpg',
                            width: 18,
                            height: 18,
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => const Icon(Icons.auto_awesome, size: 16),
                          ),
                        ),
                        label: const Text(
                          'Plan with Qube',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isDark ? const Color(0xFF2E2C44) : const Color(0xFF1E293B),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 2,
                      child: OutlinedButton.icon(
                        onPressed: _openRvCategory,
                        icon: const Icon(Icons.directions_car_filled_rounded, size: 15),
                        label: const Text(
                          'View RVs',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: const BorderSide(color: AppColors.primary),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  static final Map<String, LatLng> _stopCoordinates = {
    'Delhi': const LatLng(28.6139, 77.2090),
    'Shimla': const LatLng(31.1048, 77.1734),
    'Kufri': const LatLng(31.0979, 77.2678),
    'Manali': const LatLng(32.2432, 77.1892),
    'Dharamshala': const LatLng(32.2190, 76.3234),
    'Dalhousie': const LatLng(32.5387, 75.9710),
    'Amritsar': const LatLng(31.6340, 74.8723),
    'Narkanda': const LatLng(31.2584, 77.4589),
    'Kalpa': const LatLng(31.5369, 78.2562),
    'Nako': const LatLng(31.8797, 78.6272),
    'Tabo': const LatLng(32.0924, 78.3828),
    'Kaza': const LatLng(32.2276, 78.0710),
    'Key': const LatLng(32.2982, 78.0125),
    'Solang Valley': const LatLng(32.3166, 77.1582),
    'Atal Tunnel': const LatLng(32.3600, 77.1600),
    'Sissu': const LatLng(32.4820, 77.1243),
    'Keylong': const LatLng(32.5710, 77.0320),
    'Jispa': const LatLng(32.6410, 77.1870),
    'Leh': const LatLng(34.1526, 77.5771),
    'Jaipur': const LatLng(26.9124, 75.7873),
    'Jodhpur': const LatLng(26.2389, 73.0243),
    'Jaisalmer': const LatLng(26.9157, 70.9083),
    'Udaipur': const LatLng(24.5854, 73.7125),
    'Pushkar': const LatLng(26.4897, 74.5511),
    'Bikaner': const LatLng(28.0229, 73.3119),
    'Rann of Kutch': const LatLng(23.8344, 70.2999),
    'Bhuj': const LatLng(23.2420, 69.6669),
    'Gir': const LatLng(21.1243, 70.8242),
    'Somnath': const LatLng(20.8880, 70.4013),
    'Diu': const LatLng(20.7144, 70.9874),
    'Goa': const LatLng(15.2993, 74.1240),
    'Gokarna': const LatLng(14.5479, 74.3188),
    'Hampi': const LatLng(15.3350, 76.4600),
    'Coorg': const LatLng(12.3375, 75.8069),
    'Chikmagalur': const LatLng(13.3161, 75.7720),
    'Wayanad': const LatLng(11.6854, 76.1320),
    'Munnar': const LatLng(10.0889, 77.0595),
    'Kochi': const LatLng(9.9312, 76.2673),
    'Alleppey': const LatLng(9.4981, 76.3388),
    'Varkala': const LatLng(8.7379, 76.7163),
    'Kanyakumari': const LatLng(8.0883, 77.5385),
    'Guwahati': const LatLng(26.1445, 91.7362),
    'Shillong': const LatLng(25.5788, 91.8933),
    'Cherrapunji': const LatLng(25.2702, 91.7323),
    'Kaziranga': const LatLng(26.5775, 93.1711),
    'Tawang': const LatLng(27.5861, 91.8653),
    'Bomdila': const LatLng(27.2645, 92.4159),
    'Dirang': const LatLng(27.3562, 92.2384),
    'Majuli': const LatLng(26.9535, 94.2037),
    'Kohima': const LatLng(25.6751, 94.1086),
    'Ziro': const LatLng(27.5950, 93.8340),
  };

  void _openCorridorMapModal(BuildContext context, CorridorModel corridor) {
    AppMotion.tapSelection();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final points = <LatLng>[];
    final markers = <Marker>{};

    for (int i = 0; i < corridor.stops.length; i++) {
      final stopName = corridor.stops[i];
      LatLng pos = _stopCoordinates[stopName] ??
          LatLng(20.5937 + (i * 0.4), 78.9629 + (i * 0.4));
      points.add(pos);

      markers.add(
        Marker(
          markerId: MarkerId('stop_$i'),
          position: pos,
          infoWindow: InfoWindow(
            title: '${i + 1}. $stopName',
            snippet: i == 0
                ? 'Starting Point'
                : (i == corridor.stops.length - 1 ? 'Final Destination' : 'Scenic Stop'),
          ),
        ),
      );
    }

    final initialCenter = points.isNotEmpty ? points.first : const LatLng(20.5937, 78.9629);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        GoogleMapController? modalMapController;

        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF161522) : Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 16, 12),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.alt_route_rounded, color: AppColors.primary, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            corridor.name,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              color: isDark ? Colors.white : AppColors.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${corridor.stops.length} Stops • ${corridor.distanceFormatted} • ${corridor.durationFormatted}',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: isDark ? Colors.white60 : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),

              // Interactive Google Map
              Expanded(
                child: Stack(
                  children: [
                    GoogleMap(
                      initialCameraPosition: CameraPosition(
                        target: initialCenter,
                        zoom: 6.8,
                      ),
                      onMapCreated: (c) {
                        modalMapController = c;
                        if (points.length > 1) {
                          double minLat = points.map((p) => p.latitude).reduce((a, b) => a < b ? a : b);
                          double maxLat = points.map((p) => p.latitude).reduce((a, b) => a > b ? a : b);
                          double minLng = points.map((p) => p.longitude).reduce((a, b) => a < b ? a : b);
                          double maxLng = points.map((p) => p.longitude).reduce((a, b) => a > b ? a : b);

                          Future.delayed(const Duration(milliseconds: 350), () {
                            modalMapController?.animateCamera(
                              CameraUpdate.newLatLngBounds(
                                LatLngBounds(
                                  southwest: LatLng(minLat - 0.5, minLng - 0.5),
                                  northeast: LatLng(maxLat + 0.5, maxLng + 0.5),
                                ),
                                50,
                              ),
                            );
                          });
                        }
                      },
                      markers: markers,
                      polylines: {
                        Polyline(
                          polylineId: PolylineId(corridor.id),
                          points: points,
                          color: AppColors.primary,
                          width: 4,
                        ),
                      },
                      zoomControlsEnabled: false,
                      myLocationButtonEnabled: false,
                    ),

                    // Quick stop selector banner
                    Positioned(
                      top: 12,
                      left: 12,
                      right: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.75),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.white24),
                        ),
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: List.generate(corridor.stops.length, (idx) {
                              final stop = corridor.stops[idx];
                              return Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: InkWell(
                                  onTap: () {
                                    if (idx < points.length) {
                                      modalMapController?.animateCamera(
                                        CameraUpdate.newLatLngZoom(points[idx], 12.0),
                                      );
                                    }
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: idx == 0
                                          ? const Color(0xFF10B981)
                                          : (idx == corridor.stops.length - 1
                                              ? const Color(0xFFE05638)
                                              : Colors.white24),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text(
                                      '${idx + 1}. $stop',
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            }),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Bottom Actions
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF161522) : Colors.white,
                  border: Border(
                    top: BorderSide(
                      color: isDark ? Colors.white10 : AppColors.borderLight,
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final query = corridor.stops.map(Uri.encodeComponent).join('/');
                          final url = Uri.parse('https://www.google.com/maps/dir/$query');
                          if (await canLaunchUrl(url)) {
                            await launchUrl(url, mode: LaunchMode.externalApplication);
                          }
                        },
                        icon: const Icon(Icons.navigation_rounded, size: 16),
                        label: const Text('Open in Google Maps App', style: TextStyle(fontWeight: FontWeight.w800)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF15803D),
                          side: const BorderSide(color: Color(0xFF86EFAC)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _planWithQube(corridor);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: const Text('Plan with Qube', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

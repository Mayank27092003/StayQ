import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shimmer/shimmer.dart';
import '../../models/stay_model.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/glass_container.dart';
import '../../widgets/bouncing_widget.dart';
import '../../widgets/animated_calendar_picker.dart';
import '../../widgets/animated_heart.dart';
import '../../widgets/video_player_widget.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../constants/stay_amenities.dart';
import '../booking/checkout_screen.dart';
import '../booking/rv_checkout_screen.dart';
import '../booking/camping_checkout_screen.dart';

class ListingDetailScreen extends StatefulWidget {
  final StayModel stay;

  const ListingDetailScreen({super.key, required this.stay});

  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  int _activePhotoIndex = 0;
  DateTimeRange? _selectedDates;
  List<DateTime> _blockedDates = [];
  bool _isLoadingDates = true;
  bool _isAmenitiesExpanded = false;

  @override
  void initState() {
    super.initState();
    _fetchBlockedDates();
  }

  Future<void> _fetchBlockedDates() async {
    try {
      final snap = await FirebaseFirestore.instance
          .collection('properties')
          .doc(widget.stay.id)
          .collection('availability')
          .where('state', whereIn: ['booked', 'blocked'])
          .get();
      
      final dates = snap.docs.map((doc) => DateTime.parse(doc.id)).toList();
      setState(() {
        _blockedDates = dates;
        _isLoadingDates = false;
      });
    } catch (e) {
      setState(() => _isLoadingDates = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final stay = widget.stay;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              // Parallax Hero Sliver App Bar
              SliverAppBar(
                expandedHeight: 340,
                pinned: true,
                stretch: true,
                elevation: 0,
                backgroundColor: Theme.of(context).scaffoldBackgroundColor,
                leading: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: BouncingWidget(
                    onTap: () {
                      AppMotion.tapLight();
                      Navigator.pop(context);
                    },
                    child: const GlassContainer(
                      borderRadius: 20,
                      blur: 16,
                      child: Center(
                        child: Icon(Icons.arrow_back_rounded, size: 20),
                      ),
                    ),
                  ),
                ),
                 actions: [
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8.0),
                    child: GlassContainer(
                      borderRadius: 20,
                      blur: 16,
                      child: IconButton(
                        icon: const Icon(Icons.share_outlined, size: 18),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Link copied to clipboard: https://stayq.in/stays/${stay.id}'),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0, bottom: 8.0, right: 12.0),
                    child: GlassContainer(
                      borderRadius: 20,
                      blur: 16,
                      child: Center(
                        child: AnimatedHeart(
                          isWishlisted: stay.isWishlisted,
                          onTap: () => provider.toggleWishlist(stay),
                          size: 20,
                        ),
                      ),
                    ),
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  stretchModes: const [StretchMode.zoomBackground, StretchMode.blurBackground],
                  background: Stack(
                    children: [
                      Hero(
                        tag: 'stay_hero_${stay.id}',
                        child: PageView.builder(
                          onPageChanged: (idx) => setState(() => _activePhotoIndex = idx),
                          itemCount: stay.imageUrls.length + stay.videoUrls.length,
                          itemBuilder: (context, index) {
                            if (index < stay.imageUrls.length) {
                              final url = stay.imageUrls[index];
                              if (url.startsWith('http')) {
                                return CachedNetworkImage(
                                  imageUrl: url,
                                  fit: BoxFit.cover,
                                  width: double.infinity,
                                  placeholder: (context, url) => Shimmer.fromColors(
                                    baseColor: Colors.grey.withValues(alpha: 0.2),
                                    highlightColor: Colors.grey.withValues(alpha: 0.1),
                                    child: Container(color: Colors.white),
                                  ),
                                  errorWidget: (context, url, error) => Container(
                                    color: AppColors.surfaceLight,
                                    child: const Icon(Icons.broken_image, size: 50, color: AppColors.textMuted),
                                  ),
                                );
                              }
                              return Image.asset(
                                url,
                                fit: BoxFit.cover,
                                width: double.infinity,
                              );
                            } else {
                              final videoIndex = index - stay.imageUrls.length;
                              final videoUrl = stay.videoUrls[videoIndex];
                              return VideoPlayerWidget(videoUrl: videoUrl);
                            }
                          },
                        ),
                      ),
                      Positioned(
                        bottom: 20,
                        right: 20,
                        child: GlassContainer(
                          borderRadius: 14,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          child: Text(
                            '${_activePhotoIndex + 1} / ${stay.imageUrls.length + stay.videoUrls.length}',
                            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Detailed Content Body
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              stay.category.toUpperCase(),
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          Row(
                            children: [
                              const Icon(Icons.star_rounded, color: AppColors.starYellow, size: 20),
                              const SizedBox(width: 4),
                              Text(
                                '${stay.rating}',
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                ' (${stay.reviewCount} reviews)',
                                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      Text(
                        stay.title,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined, color: AppColors.textSecondary, size: 16),
                          const SizedBox(width: 4),
                          Text(
                            stay.location,
                            style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
                          ),
                        ],
                      ),

                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Divider(color: AppColors.borderLight),
                      ),

                      if (stay.tags.isNotEmpty) ...[
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: stay.tags.map((tag) => Padding(
                              padding: const EdgeInsets.only(right: 8.0),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                                ),
                                child: Text(
                                  tag.replaceAll('_', ' ').split(' ').map((str) => str.isNotEmpty ? str[0].toUpperCase() + str.substring(1).toLowerCase() : '').join(' '),
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                                ),
                              ),
                            )).toList(),
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 20),
                          child: Divider(color: AppColors.borderLight),
                        ),
                      ],

                      // Host Card with Contact Action
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 26,
                                backgroundImage: stay.hostAvatar.isNotEmpty 
                                    ? (stay.hostAvatar.startsWith('http') 
                                        ? NetworkImage(stay.hostAvatar) 
                                        : AssetImage(stay.hostAvatar) as ImageProvider)
                                    : null,
                                child: stay.hostAvatar.isEmpty ? const Icon(Icons.person) : null,
                              ),
                              const SizedBox(width: 14),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Hosted by ${stay.hostName}',
                                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    stay.isStarHost ? 'Starhost • Identity Verified' : 'Verified Stay Q Host',
                                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          OutlinedButton.icon(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Starting chat with ${stay.hostName}...')),
                              );
                            },
                            icon: const Icon(Icons.chat_bubble_outline_rounded, size: 16, color: AppColors.primary),
                            label: const Text('Contact Host', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppColors.primary),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            ),
                          ),
                        ],
                      ),

                      // Staying with Host / Experience Spots Co-Living Card
                      const SizedBox(height: 14),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: stay.isStayingWithHost ? const Color(0xFFEFF6FF) : const Color(0xFFECFDF5),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(
                                    stay.isStayingWithHost ? Icons.people_outline_rounded : Icons.vpn_key_outlined,
                                    color: stay.isStayingWithHost ? const Color(0xFF2563EB) : const Color(0xFF059669),
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        stay.isStayingWithHost ? 'Staying with Host' : 'Entire Space / Private',
                                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        stay.isStayingWithHost 
                                            ? 'You will have a private bedroom. Host resides on property.'
                                            : 'You will have the whole property to yourself with complete privacy.',
                                        style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            if (stay.isExperience) ...[
                              const SizedBox(height: 10),
                              const Divider(color: Color(0xFFE2E8F0)),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: const [
                                      Icon(Icons.event_seat_rounded, size: 16, color: AppColors.primary),
                                      SizedBox(width: 6),
                                      Text('Experience Spots', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFDCFCE7),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      '${stay.availableSpots} of ${stay.maxSpots} spots left',
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),

                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Divider(color: AppColors.borderLight),
                      ),

                      // Amenities Grid
                      const Text(
                        'What this place offers',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 14),
                      AnimatedSize(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                        child: Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: stay.amenities
                              .take(_isAmenitiesExpanded ? stay.amenities.length : 6)
                              .map((amenity) {
                            final icon = StayAmenities.getIcon(amenity);
                            final title = StayAmenities.getCanonicalTitle(amenity);
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: AppColors.surfaceLight,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.borderLight.withValues(alpha: 0.5)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(icon, size: 18, color: AppColors.primary),
                                  const SizedBox(width: 8),
                                  Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                      if (stay.amenities.length > 6)
                        Padding(
                          padding: const EdgeInsets.only(top: 16),
                          child: GestureDetector(
                            onTap: () => setState(() => _isAmenitiesExpanded = !_isAmenitiesExpanded),
                            child: Text(
                              _isAmenitiesExpanded ? 'Show less' : 'Show all ${stay.amenities.length} amenities',
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ),
                        ),

                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Divider(color: AppColors.borderLight),
                      ),

                      // About Description
                      const Text(
                        'About this space',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        stay.description,
                        style: const TextStyle(fontSize: 14, height: 1.6, color: AppColors.textSecondary),
                      ),

                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Divider(color: AppColors.borderLight),
                      ),

                      // Location & Neighborhood (Airbnb-Style Privacy)
                      Row(
                        children: const [
                          Icon(Icons.location_on_rounded, color: AppColors.primary, size: 22),
                          SizedBox(width: 6),
                          Text(
                            'Where you\'ll be',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        stay.location,
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 12),

                      // Approximate Map Bubble Visual Container
                      Container(
                        height: 180,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEEF2F6),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.borderLight),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            const Icon(Icons.map_rounded, size: 48, color: Color(0xFFCBD5E1)),
                            // Translucent Radial Approximate Circle
                            Container(
                              width: 110,
                              height: 110,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.primary.withValues(alpha: 0.15),
                                border: Border.all(color: AppColors.primary, width: 2, strokeAlign: BorderSide.strokeAlignCenter),
                              ),
                              child: Center(
                                child: Container(
                                  width: 16,
                                  height: 16,
                                  decoration: const BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: AppColors.primary,
                                    boxShadow: [
                                      BoxShadow(color: AppColors.primary, blurRadius: 10, spreadRadius: 2),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Privacy Banner
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Icon(Icons.shield_outlined, color: Color(0xFF059669), size: 20),
                            SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Exact location provided after booking is confirmed',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    'To protect host and guest privacy, exact street address and door directions are unlocked in your confirmed trip ticket.',
                                    style: TextStyle(fontSize: 11, color: Color(0xFF64748B), height: 1.3),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),

                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Divider(color: AppColors.borderLight),
                      ),

                      // Availability Calendar
                      const Text(
                        'Select dates',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 14),
                      if (_isLoadingDates) 
                         const Center(child: CircularProgressIndicator())
                      else
                         Container(
                           padding: const EdgeInsets.all(16),
                           decoration: BoxDecoration(
                             color: Colors.white,
                             borderRadius: BorderRadius.circular(20),
                             border: Border.all(color: AppColors.borderLight),
                           ),
                           child: AnimatedCalendarPicker(
                             initialRange: _selectedDates,
                             blockedDates: _blockedDates,
                             onRangeSelected: (range) {
                               setState(() => _selectedDates = range);
                             },
                           ),
                         ),

                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Divider(color: AppColors.borderLight),
                      ),

                      // Reviews Section
                      const Text(
                        'Reviews',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      _PropertyReviewsWidget(propertyId: stay.id),
                      
                      const SizedBox(height: 120),
                    ].animate(interval: 50.ms).fadeIn(duration: 500.ms, curve: Curves.easeOutQuad).slideY(begin: 0.05, duration: 500.ms, curve: Curves.easeOutQuad),
                  ),
                ),
              ),
            ],
          ),

          // Sticky Glassmorphism Reserve Bar
          Positioned(
            left: 20,
            right: 20,
            bottom: 24,
            child: SafeArea(
              top: false,
              child: GlassContainer(
                borderRadius: 24,
                blur: 24,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              '₹${stay.pricePerNight.toInt()}',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                color: Theme.of(context).textTheme.titleLarge?.color,
                              ),
                            ),
                            Text(
                              stay.propertyType == 'RV' ? ' / day' : ' / night',
                              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                           _selectedDates == null 
                               ? 'Select dates to reserve' 
                               : '${_selectedDates!.start.day}/${_selectedDates!.start.month} – ${_selectedDates!.end.day}/${_selectedDates!.end.month}',
                           style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    BouncingWidget(
                      onTap: () {
                        if (_selectedDates == null) return;
                        AppMotion.tapMedium();
                        Widget checkoutScreen;
                        if (stay.propertyType == 'RV') {
                          checkoutScreen = RVCheckoutScreen(stay: stay, selectedDates: _selectedDates!);
                        } else if (stay.propertyType == 'CAMPING_SITE') {
                          checkoutScreen = CampingCheckoutScreen(stay: stay, selectedDates: _selectedDates!);
                        } else {
                          checkoutScreen = CheckoutScreen(stay: stay, selectedDates: _selectedDates!);
                        }
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => checkoutScreen),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
                        decoration: BoxDecoration(
                          color: _selectedDates == null ? AppColors.textMuted.withValues(alpha: 0.5) : AppColors.primary,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: _selectedDates == null ? [] : [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            )
                          ],
                        ),
                        child: Text(
                          stay.propertyType == 'RV' ? 'Rent Now' 
                            : stay.propertyType == 'CAMPING_SITE' ? 'Book Camp'
                            : 'Book Now',
                          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ).animate().slideY(begin: 1.0, duration: 600.ms, curve: Curves.easeOutBack).fadeIn(duration: 600.ms),
          ),
        ],
      ),
    );
  }
}

class _PropertyReviewsWidget extends StatelessWidget {
  final String propertyId;
  const _PropertyReviewsWidget({required this.propertyId});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('reviews')
          .where('propertyId', isEqualTo: propertyId)
          .where('moderationStatus', isEqualTo: 'visible')
          .orderBy('createdAt', descending: true)
          .limit(5)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
          return const Text('No reviews yet. Be the first to review!', style: TextStyle(color: AppColors.textSecondary));
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: snapshot.data!.docs.map((doc) {
            final data = doc.data() as Map<String, dynamic>;
            final rating = (data['rating'] ?? 0).toDouble();
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundImage: data['guestAvatarUrl'] != null && data['guestAvatarUrl'].isNotEmpty 
                            ? NetworkImage(data['guestAvatarUrl']) 
                            : null,
                        child: data['guestAvatarUrl'] == null || data['guestAvatarUrl'].isEmpty 
                            ? const Icon(Icons.person, size: 20) 
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(data['guestName'] ?? 'Guest', style: const TextStyle(fontWeight: FontWeight.bold)),
                            Row(
                              children: [
                                const Icon(Icons.star_rounded, size: 14, color: AppColors.starYellow),
                                const SizedBox(width: 2),
                                Text('$rating', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    data['reviewText'] ?? '',
                    style: const TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
                  ),
                ],
              ),
            );
          }).toList(),
        );
      },
    );
  }
}


import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../models/stay_model.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';
import '../booking/checkout_screen.dart';

class ExperienceDetailScreen extends StatefulWidget {
  final StayModel experience;

  const ExperienceDetailScreen({
    super.key,
    required this.experience,
  });

  @override
  State<ExperienceDetailScreen> createState() => _ExperienceDetailScreenState();
}

class _ExperienceDetailScreenState extends State<ExperienceDetailScreen> {
  int _currentImageIndex = 0;
  final PageController _pageController = PageController();
  int _selectedGuests = 1;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final exp = widget.experience;
    final images = exp.imageUrls.isNotEmpty
        ? exp.imageUrls
        : ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'];
    final provider = context.watch<AppProvider>();
    final isWishlisted = exp.isWishlisted;
    final remainingSpots = exp.remainingSlots;
    final totalSpots = exp.maxSpots > 0 ? exp.maxSpots : 10;
    final spotsProgress = totalSpots > 0 ? ((totalSpots - remainingSpots) / totalSpots).clamp(0.0, 1.0) : 0.2;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // Scrollable Body
          SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 120),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. HERO GALLERY (Photo Carousel)
                Stack(
                  children: [
                    SizedBox(
                      height: 380,
                      width: double.infinity,
                      child: PageView.builder(
                        controller: _pageController,
                        itemCount: images.length,
                        onPageChanged: (index) {
                          setState(() => _currentImageIndex = index);
                        },
                        itemBuilder: (context, index) {
                          final img = images[index];
                          return Image(
                            image: img.startsWith('http')
                                ? NetworkImage(img) as ImageProvider
                                : AssetImage(img),
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              color: AppColors.surfaceLight,
                              child: const Icon(Icons.broken_image, size: 48, color: AppColors.textMuted),
                            ),
                          );
                        },
                      ),
                    ),

                    // Top Gradient Protection
                    Positioned(
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 100,
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withValues(alpha: 0.6),
                              Colors.transparent,
                            ],
                          ),
                        ),
                      ),
                    ),

                    // Photo Counter Pill (Bottom Right of Gallery)
                    Positioned(
                      bottom: 16,
                      right: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.65),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          '${_currentImageIndex + 1} / ${images.length}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),

                    // Top Action Buttons
                    Positioned(
                      top: MediaQuery.of(context).padding.top + 8,
                      left: 16,
                      right: 16,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          CircleAvatar(
                            backgroundColor: Colors.white.withValues(alpha: 0.9),
                            child: IconButton(
                              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Colors.black87),
                              onPressed: () => Navigator.pop(context),
                            ),
                          ),
                          Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: Colors.white.withValues(alpha: 0.9),
                                child: IconButton(
                                  icon: const Icon(Icons.share_outlined, size: 20, color: Colors.black87),
                                  onPressed: () {},
                                ),
                              ),
                              const SizedBox(width: 8),
                              CircleAvatar(
                                backgroundColor: Colors.white.withValues(alpha: 0.9),
                                child: IconButton(
                                  icon: Icon(
                                    isWishlisted ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                                    size: 20,
                                    color: isWishlisted ? AppColors.errorRed : Colors.black87,
                                  ),
                                  onPressed: () => provider.toggleWishlist(exp),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                // 2. MAIN DETAILS CONTENT
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Category & City Row
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              exp.category.replaceAll('_', ' '),
                              style: const TextStyle(
                                color: AppColors.primary,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          if (exp.city.isNotEmpty) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.location_on_rounded, size: 12, color: Color(0xFF64748B)),
                                  const SizedBox(width: 4),
                                  Text(
                                    exp.city,
                                    style: const TextStyle(
                                      color: Color(0xFF475569),
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Title
                      Text(
                        exp.title,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textPrimary,
                          height: 1.25,
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Rating & Location
                      Row(
                        children: [
                          const Icon(Icons.star_rounded, size: 18, color: Color(0xFFF59E0B)),
                          const SizedBox(width: 4),
                          Text(
                            exp.rating.toStringAsFixed(1),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          Text(
                            ' (${exp.reviewCount} reviews) • ',
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                          ),
                          Expanded(
                            child: Text(
                              exp.location,
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 13,
                                decoration: TextDecoration.underline,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      const Divider(color: AppColors.borderLight),
                      const SizedBox(height: 16),

                      // 3. HOST DETAILS CARD
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 26,
                              backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                              backgroundImage: exp.hostAvatar.isNotEmpty && !exp.hostAvatar.contains('assets')
                                  ? NetworkImage(exp.hostAvatar) as ImageProvider
                                  : null,
                              child: exp.hostAvatar.isEmpty
                                  ? Text(
                                      exp.hostName.isNotEmpty ? exp.hostName[0].toUpperCase() : 'H',
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.primary,
                                      ),
                                    )
                                  : null,
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        'Hosted by ${exp.hostName}',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 15,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Icon(Icons.verified_rounded, size: 16, color: Color(0xFF0284C7)),
                                    ],
                                  ),
                                  const SizedBox(height: 3),
                                  const Text(
                                    'StayQ Certified Superhost • Identity & police verified',
                                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // 4. TIMINGS & LOGISTICS CARDS
                      Row(
                        children: [
                          // Timing Badge
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEEF2FF),
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(color: const Color(0xFFC7D2FE)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.schedule_rounded, color: Color(0xFF4F46E5), size: 22),
                                  const SizedBox(height: 8),
                                  const Text(
                                    'Schedule',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                      color: Color(0xFF4338CA),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    exp.scheduleTime ?? exp.timeSlot ?? '12:00 PM - 03:00 PM',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      color: Color(0xFF1E1B4B),
                                    ),
                                  ),
                                  Text(
                                    exp.duration ?? '3 hours total',
                                    style: const TextStyle(fontSize: 11, color: Color(0xFF6366F1)),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),

                          // Logistics & Transport Badge
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: exp.pickupProvided ? const Color(0xFFECFDF5) : const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(18),
                                border: Border.all(
                                  color: exp.pickupProvided ? const Color(0xFFA7F3D0) : const Color(0xFFE2E8F0),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Icon(
                                    exp.pickupProvided
                                        ? Icons.directions_car_filled_rounded
                                        : Icons.directions_walk_rounded,
                                    color: exp.pickupProvided ? const Color(0xFF059669) : const Color(0xFF475569),
                                    size: 22,
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Logistics',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                      color: exp.pickupProvided ? const Color(0xFF047857) : const Color(0xFF334155),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    exp.pickupProvided ? 'Pickup & Drop Included' : 'Self-Arrival',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      color: exp.pickupProvided ? const Color(0xFF065F46) : const Color(0xFF0F172A),
                                    ),
                                  ),
                                  Text(
                                    exp.pickupProvided ? 'From major points' : 'Meet at venue',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: exp.pickupProvided ? const Color(0xFF10B981) : const Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // 5. REAL-TIME LIVE SLOT COUNTER
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                          ),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
                                    const SizedBox(width: 8),
                                    const Text(
                                      'Live Slot Availability',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF059669),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    '$remainingSpots of $totalSpots spots remaining',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: LinearProgressIndicator(
                                value: spotsProgress,
                                minHeight: 6,
                                backgroundColor: Colors.white.withValues(alpha: 0.15),
                                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF38BDF8)),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text(
                              'Instant booking open • Intimate group experience with max $totalSpots guests',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.7),
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // 6. WHAT'S INCLUDED
                      const Text(
                        'What\'s Included',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Food & Equipment badges
                      if (exp.foodIncluded)
                        _buildInclusionTile(
                          icon: Icons.restaurant_rounded,
                          title: 'Food & Refreshments Provided',
                          subtitle: 'Traditional meals, tasting items, snacks or beverages included',
                        ),
                      if (exp.equipmentIncluded)
                        _buildInclusionTile(
                          icon: Icons.build_circle_rounded,
                          title: 'Equipment & Supplies Provided',
                          subtitle: 'All tools, safety gear, materials and ingredients provided by host',
                        ),
                      if (exp.kidsFreeAgeLimit > 0)
                        _buildInclusionTile(
                          icon: Icons.child_friendly_rounded,
                          title: 'Kids Policy',
                          subtitle: 'Children up to ${exp.kidsFreeAgeLimit} years attend completely free',
                        ),

                      // Inclusions list
                      if (exp.amenities.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        ...exp.amenities.map(
                          (item) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.check_circle_rounded, size: 18, color: Color(0xFF059669)),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    item,
                                    style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 24),

                      // 7. WHAT WE'LL DO (DESCRIPTION)
                      const Text(
                        'What we\'ll do',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        exp.description,
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.textSecondary,
                          height: 1.6,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // 8. MEETING LOCATION MAP CARD
                      const Text(
                        'Where you\'ll be',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.map_rounded, color: AppColors.primary, size: 24),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    exp.location,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    exp.city.isNotEmpty ? '${exp.city}, India' : 'India',
                                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 9. BOTTOM FLOATING BAR WITH BOOKING ACTION
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 20,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                top: false,
                child: Row(
                  children: [
                    // Price display
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            Text(
                              '₹${exp.pricePerPerson.toInt()}',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const Text(
                              ' / person',
                              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                        Text(
                          '$remainingSpots spots left',
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF059669),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),

                    // Book Button
                    BouncingWidget(
                      onTap: () {
                        AppMotion.tapSelection();
                        final tomorrow = DateTime.now().add(const Duration(days: 1));
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => CheckoutScreen(
                              stay: exp,
                              selectedDates: DateTimeRange(
                                start: tomorrow,
                                end: tomorrow.add(const Duration(days: 1)),
                              ),
                            ),
                          ),
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.35),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Text(
                          'Book Experience',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInclusionTile({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.primary, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

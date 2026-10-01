import 'package:flutter/material.dart';
import '../../models/stay_model.dart';
import '../../theme/app_colors.dart';
import '../../services/api/api_client.dart';

class PropertyBoostScreen extends StatefulWidget {
  final StayModel property;

  const PropertyBoostScreen({
    super.key,
    required this.property,
  });

  @override
  State<PropertyBoostScreen> createState() => _PropertyBoostScreenState();
}

class _PropertyBoostScreenState extends State<PropertyBoostScreen> {
  int _selectedTierIndex = 1; // Default to Super Boost (₹499)
  bool _isLoading = false;
  bool _isProcessing = false;
  Map<String, dynamic>? _boostStatus;

  final List<Map<String, dynamic>> _tiers = [
    {
      'id': 'BOOST_BASIC',
      'name': 'Boost Basic',
      'badgeText': '⚡ FEATURED',
      'price': 299,
      'durationDays': 7,
      'rankMultiplier': '2x',
      'tagline': '2x Search Visibility + Featured Category Badge',
      'colors': [const Color(0xFFF59E0B), const Color(0xFFD97706)],
      'icon': Icons.bolt_rounded,
      'isPopular': false,
      'features': [
        '2x Higher Search Ranking in City Feeds',
        'Glowing ⚡ Featured Stay Badge on Explore & Map',
        'Targeted recommendations to nearby travelers',
        'Active for 7 full days',
      ],
    },
    {
      'id': 'SUPER_BOOST',
      'name': 'Super Boost',
      'badgeText': '🌟 TRENDING',
      'price': 499,
      'durationDays': 15,
      'rankMultiplier': '5x',
      'tagline': '5x Search Visibility + Top of Category & City',
      'colors': [const Color(0xFF5A31F4), const Color(0xFF9333EA)],
      'icon': Icons.auto_awesome_rounded,
      'isPopular': true,
      'features': [
        '5x Higher Search Ranking in Category & City',
        'Glowing 🌟 Trending Stay Badge on Explore & Map',
        'Featured placement at top of Explore categories',
        'Priority inclusion in weekly traveler digests',
        'Active for 15 full days',
      ],
    },
    {
      'id': 'ULTRA_SPOTLIGHT',
      'name': 'Ultra Spotlight',
      'badgeText': '👑 SPOTLIGHT',
      'price': 999,
      'durationDays': 30,
      'rankMultiplier': '#1 Rank',
      'tagline': '#1 Guaranteed Rank + Explore Hero Carousel',
      'colors': [const Color(0xFFFFB800), const Color(0xFF5A31F4)],
      'icon': Icons.workspace_premium_rounded,
      'isPopular': false,
      'features': [
        '#1 Guaranteed Top Rank in Search & City Feeds',
        'Luxury Glowing 👑 Stay Q Spotlight Badge',
        'Featured in Top Homepage Explorer Carousel',
        'Dedicated Push Notification Promo to 10,000+ Guests',
        'Active for 30 full days',
      ],
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchBoostStatus();
  }

  Future<void> _fetchBoostStatus() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient.instance.get('/properties/${widget.property.id}/boost/status');
      if (res != null && res is Map && res['success'] == true) {
        setState(() {
          _boostStatus = Map<String, dynamic>.from(res);
        });
      }
    } catch (_) {
      // Fallback gracefully
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleBoostPayment() async {
    final selectedTier = _tiers[_selectedTierIndex];
    setState(() => _isProcessing = true);

    try {
      // 1. Create Checkout Order
      final checkoutRes = await ApiClient.instance.post(
        '/properties/${widget.property.id}/boost/checkout',
        body: {'tierId': selectedTier['id']},
      );

      final orderId = (checkoutRes is Map ? checkoutRes['orderId'] : null) ?? 'BOOST_${DateTime.now().millisecondsSinceEpoch}';

      // 2. Activate Boost
      await ApiClient.instance.post(
        '/properties/${widget.property.id}/boost/activate',
        body: {
          'tierId': selectedTier['id'],
          'orderId': orderId,
        },
      );

      if (mounted) {
        _showSuccessDialog(selectedTier);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to activate boost: $e'),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  void _showSuccessDialog(Map<String, dynamic> tier) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
        contentPadding: const EdgeInsets.all(24),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: tier['colors'] as List<Color>,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: (tier['colors'] as List<Color>)[0].withValues(alpha: 0.4),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: const Icon(Icons.check_rounded, color: Colors.white, size: 40),
            ),
            const SizedBox(height: 20),
            Text(
              '${tier['name']} Activated!',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Your property "${widget.property.title}" is now ranked higher in search with the ${tier['badgeText']} badge for ${tier['durationDays']} days.',
              style: const TextStyle(fontSize: 13, color: Color(0xFF64748B), height: 1.4),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(ctx).pop();
                  Navigator.of(context).pop(true);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('View Boosted Property', style: TextStyle(fontWeight: FontWeight.w800, color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final selectedTier = _tiers[_selectedTierIndex];
    final isAlreadyActive = _boostStatus?['isActive'] == true;
    final daysRemaining = _boostStatus?['daysRemaining'] ?? 0;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF1E293B), size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Boost & Promote Property',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
        ),
        centerTitle: true,
        bottom: _isLoading
            ? const PreferredSize(
                preferredSize: Size.fromHeight(2),
                child: LinearProgressIndicator(color: AppColors.primary, minHeight: 2),
              )
            : null,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Property Header Preview Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFE2E8F0)),
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
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: SizedBox(
                      width: 72,
                      height: 72,
                      child: widget.property.imageUrls.isNotEmpty
                          ? (widget.property.imageUrls[0].startsWith('http')
                              ? Image.network(widget.property.imageUrls[0], fit: BoxFit.cover)
                              : Image.asset(widget.property.imageUrls[0], fit: BoxFit.cover))
                          : Container(color: AppColors.surfaceLight),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.property.title,
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '${widget.property.city}, ${widget.property.state}',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 6),
                        // Live Badge Preview
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: selectedTier['colors'] as List<Color>,
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(selectedTier['icon'] as IconData, size: 10, color: Colors.white),
                              const SizedBox(width: 3),
                              Text(
                                selectedTier['badgeText'] as String,
                                style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white),
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

            if (isAlreadyActive) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_rounded, color: Color(0xFF059669), size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Currently Boosted & Trending',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF065F46)),
                          ),
                          Text(
                            '$daysRemaining days remaining on your active boost.',
                            style: const TextStyle(fontSize: 11, color: Color(0xFF047857), fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),
            const Text(
              'Select Promotion Plan',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
            ),
            const SizedBox(height: 4),
            const Text(
              'Boosted properties get up to 5x more clicks and instant bookings.',
              style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
            ),
            const SizedBox(height: 16),

            // Plan Cards
            ...List.generate(_tiers.length, (index) {
              final tier = _tiers[index];
              final isSelected = _selectedTierIndex == index;

              return GestureDetector(
                onTap: () => setState(() => _selectedTierIndex = index),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: isSelected ? (tier['colors'] as List<Color>)[0] : const Color(0xFFE2E8F0),
                      width: isSelected ? 2.5 : 1,
                    ),
                    boxShadow: [
                      if (isSelected)
                        BoxShadow(
                          color: (tier['colors'] as List<Color>)[0].withValues(alpha: 0.15),
                          blurRadius: 16,
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
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: tier['colors'] as List<Color>,
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Icon(tier['icon'] as IconData, color: Colors.white, size: 24),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      tier['name'] as String,
                                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                                    ),
                                    if (tier['isPopular'] == true) ...[
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF5A31F4),
                                          borderRadius: BorderRadius.circular(10),
                                        ),
                                        child: const Text(
                                          'MOST POPULAR',
                                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  tier['tagline'] as String,
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '₹${tier['price']}',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                              ),
                              Text(
                                '${tier['durationDays']} Days',
                                style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8), fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        ],
                      ),
                      if (isSelected) ...[
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          child: Divider(color: Color(0xFFF1F5F9), height: 1),
                        ),
                        ...(tier['features'] as List<String>).map(
                          (f) => Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Row(
                              children: [
                                const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 16),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    f,
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF334155), fontWeight: FontWeight.w600),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            }),

            const SizedBox(height: 20),
            // Checkout Guarantee Banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Row(
                children: [
                  Icon(Icons.verified_user_rounded, color: Color(0xFF475569), size: 20),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Zero hidden fees. Instant search boost activation via Cashfree PG & 100% verified badges.',
                      style: TextStyle(fontSize: 11, color: Color(0xFF475569), fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(top: BorderSide(color: Color(0xFFE2E8F0))),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '₹${selectedTier['price']}',
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                  ),
                  Text(
                    'For ${selectedTier['durationDays']} Days (${selectedTier['rankMultiplier']} Visibility)',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: _isProcessing ? null : _handleBoostPayment,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                  elevation: 4,
                  shadowColor: AppColors.primary.withValues(alpha: 0.4),
                ),
                child: _isProcessing
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                      )
                    : Row(
                        children: [
                          Icon(selectedTier['icon'] as IconData, color: Colors.white, size: 18),
                          const SizedBox(width: 6),
                          const Text(
                            'Boost Now',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.white),
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
}

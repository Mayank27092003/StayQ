import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../../theme/app_colors.dart';
import '../../../../widgets/bouncing_widget.dart';
import 'host_pro_paywall_sheet.dart';

class NeighborhoodPriceRadarWidget extends StatefulWidget {
  final String city;
  final String? locality;
  final String propertyType;
  final int bedrooms;
  final double currentPrice;
  final List<String> amenities;
  final ValueChanged<double>? onApplyRecommendedPrice;

  const NeighborhoodPriceRadarWidget({
    Key? key,
    required this.city,
    this.locality,
    this.propertyType = 'VILLA',
    this.bedrooms = 2,
    required this.currentPrice,
    this.amenities = const [],
    this.onApplyRecommendedPrice,
  }) : super(key: key);

  @override
  State<NeighborhoodPriceRadarWidget> createState() => _NeighborhoodPriceRadarWidgetState();
}

class _NeighborhoodPriceRadarWidgetState extends State<NeighborhoodPriceRadarWidget> {
  bool _isProSubscriber = true;
  bool _isFoundingHost = true;
  int _foundingSlots = 188;
  

  late double _marketAvg;
  late double _minPrice;
  late double _maxPrice;
  late double _recommendedPrice;
  late String _aiRationale;
  late int _occupancyRate;
  late List<Map<String, dynamic>> _competitors;

  @override
  void initState() {
    super.initState();
    _computeLocalBenchmark();
  }

  @override
  void didUpdateWidget(covariant NeighborhoodPriceRadarWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.city != widget.city ||
        oldWidget.propertyType != widget.propertyType ||
        oldWidget.bedrooms != widget.bedrooms ||
        oldWidget.currentPrice != widget.currentPrice) {
      _computeLocalBenchmark();
    }
  }

  void _computeLocalBenchmark() {
    final c = widget.city.toLowerCase();
    final beds = widget.bedrooms > 0 ? widget.bedrooms : 2;

    if (c.contains('goa')) {
      _marketAvg = 4800;
      _minPrice = 3800;
      _maxPrice = 8500;
      _recommendedPrice = 4850;
      _occupancyRate = 85;
      _aiRationale =
          'Goa Candolim & Assagao belt me 2BHK luxury stays ka average rate ₹4,800 hai. Aapki pool aur AC amenities ₹4,850 par 85% occupancy deliver karengi.';
      _competitors = [
        {
          'title': '2BHK Private Pool Villa Candolim',
          'locality': 'Candolim, Goa',
          'price': 4800,
          'rating': 4.94,
          'reviews': 48,
          'image': 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80',
          'tag': 'Similar Size',
        },
        {
          'title': 'Azure Horizon Portuguese Villa',
          'locality': 'Assagao, Goa',
          'price': 5200,
          'rating': 4.98,
          'reviews': 62,
          'image': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
          'tag': 'Top Rated',
        },
        {
          'title': 'Calangute Palms Heritage Stay',
          'locality': 'Calangute, Goa',
          'price': 4200,
          'rating': 4.88,
          'reviews': 31,
          'image': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
          'tag': 'Budget Comp',
        },
      ];
    } else if (c.contains('manali') || c.contains('himachal')) {
      _marketAvg = 4600;
      _minPrice = 3200;
      _maxPrice = 7500;
      _recommendedPrice = 4650;
      _occupancyRate = 82;
      _aiRationale =
          'Old Manali alpine cabins ka average rate ₹4,600 chal raha hai. Snow view aur heating setup ke sath ₹4,650 optimal sweet spot hai.';
      _competitors = [
        {
          'title': 'Cedarwood Pine Alpine Cabin',
          'locality': 'Old Manali',
          'price': 4600,
          'rating': 4.95,
          'reviews': 54,
          'image': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80',
          'tag': 'Direct Comp',
        },
        {
          'title': 'The Highland Himalayan Retreat',
          'locality': 'Solang Valley',
          'price': 5800,
          'rating': 4.97,
          'reviews': 40,
          'image': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
          'tag': 'Luxury Comp',
        },
      ];
    } else {
      final base = beds * 2200.0;
      _marketAvg = base;
      _minPrice = base * 0.75;
      _maxPrice = base * 1.5;
      _recommendedPrice = base * 0.98;
      _occupancyRate = 80;
      _aiRationale =
          'Aas-paas ke ${widget.city.isEmpty ? "nearby" : widget.city} listings ka average rate ₹${_marketAvg.toInt()} hai. ₹${_recommendedPrice.toInt()} par maximum booking conversion milegi.';
      _competitors = [
        {
          'title': '$beds BHK Designer Residency',
          'locality': widget.city.isEmpty ? 'Neighborhood' : widget.city,
          'price': base.toInt(),
          'rating': 4.91,
          'reviews': 29,
          'image': 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80',
          'tag': 'Direct Comp',
        },
        {
          'title': 'Luxury $beds BHK Suite & Terrace',
          'locality': widget.city.isEmpty ? 'Prime Sector' : widget.city,
          'price': (base * 1.15).toInt(),
          'rating': 4.96,
          'reviews': 44,
          'image': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
          'tag': 'Premium Comp',
        },
      ];
    }
  }

  void _openPaywall() {
    HostProPaywallSheet.show(context).then((res) {
      if (res == true) {
        setState(() => _isProSubscriber = true);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final diff = widget.currentPrice - _marketAvg;
    final diffPct = _marketAvg > 0 ? ((diff / _marketAvg) * 100).round() : 0;

    Color badgeColor = const Color(0xFF10B981);
    String badgeText = 'Competitive';
    if (diffPct < -12) {
      badgeColor = const Color(0xFF3B82F6);
      badgeText = 'Below Market';
    } else if (diffPct > 20) {
      badgeColor = const Color(0xFFF59E0B);
      badgeText = 'Premium Tier';
    } else if (diffPct > 5) {
      badgeColor = const Color(0xFF8B5CF6);
      badgeText = 'Slightly Above Avg';
    }

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? [const Color(0xFF1E1630), const Color(0xFF13101E)]
              : [const Color(0xFFFDFBFF), const Color(0xFFF8F5FF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: const Color(0xFF8B5CF6).withValues(alpha: 0.35),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF8B5CF6).withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Ribbon
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
                    ),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.radar_rounded, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Text(
                            'Neighborhood Price Radar',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF8B5CF6).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'AI LIVE',
                              style: TextStyle(color: Color(0xFF8B5CF6), fontSize: 9, fontWeight: FontWeight.w900),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${widget.city.isEmpty ? "Your Locality" : widget.city} Market Intelligence',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: badgeColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: badgeColor.withValues(alpha: 0.4)),
                  ),
                  child: Text(
                    badgeText,
                    style: TextStyle(color: badgeColor, fontSize: 11, fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: Colors.black12),

          // Main Comparison Stats Bar
          Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildMetricCol('Your Rate', '₹${widget.currentPrice.toInt()}', isPrimary: true),
                    Container(width: 1, height: 38, color: Colors.grey.withValues(alpha: 0.2)),
                    _buildMetricCol('Market Avg', '₹${_marketAvg.toInt()}'),
                    Container(width: 1, height: 38, color: Colors.grey.withValues(alpha: 0.2)),
                    _buildMetricCol('Range', '₹${_minPrice.toInt()} - ₹${_maxPrice.toInt()}'),
                  ],
                ),
                const SizedBox(height: 16),

                // Groq AI Smart Recommendation Box
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF8B5CF6).withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: const Color(0xFF8B5CF6).withValues(alpha: 0.25)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.auto_awesome_rounded, color: Color(0xFF8B5CF6), size: 18),
                          const SizedBox(width: 8),
                          const Text(
                            'Groq AI Optimal Price Recommendation',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF8B5CF6),
                              letterSpacing: 0.2,
                            ),
                          ),
                          const Spacer(),
                          Text(
                            '₹${_recommendedPrice.toInt()}/night',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF8B5CF6),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _aiRationale,
                        style: const TextStyle(fontSize: 12, color: AppColors.textPrimary, height: 1.4),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.check_circle_outline_rounded, size: 14, color: Color(0xFF10B981)),
                              const SizedBox(width: 4),
                              Text(
                                'Est. Occupancy: ~$_occupancyRate%',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF10B981)),
                              ),
                            ],
                          ),
                          const Spacer(),
                          if (widget.onApplyRecommendedPrice != null &&
                              (widget.currentPrice.toInt() != _recommendedPrice.toInt()))
                            BouncingWidget(
                              onTap: () => widget.onApplyRecommendedPrice?.call(_recommendedPrice),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
                                  ),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Text(
                                  'Apply AI Price',
                                  style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                                ),
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

          // Competitor Breakdown Section with Pro Paywall Blur
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Founding Host 200 Free Early Access Banner
                if (_isFoundingHost)
                  Container(
                    margin: const EdgeInsets.only(bottom: 14),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF10B981), Color(0xFF059669)],
                      ),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF10B981).withValues(alpha: 0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Row(
                      children: const [
                        Icon(Icons.card_giftcard_rounded, color: Colors.white, size: 18),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            '🎉 Early Host Special: Pro Market Radar is 100% FREE for First 200 Hosts!',
                            style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ],
                    ),
                  ),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Nearby Competitor Snapshot',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                    ),
                    if (!_isProSubscriber)
                      GestureDetector(
                        onTap: _openPaywall,
                        child: Row(
                          children: const [
                            Icon(Icons.lock_outline_rounded, size: 13, color: Color(0xFF8B5CF6)),
                            SizedBox(width: 4),
                            Text(
                              'Unlock All (Pro)',
                              style: TextStyle(color: Color(0xFF8B5CF6), fontSize: 12, fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),

                // Competitor Cards List with Stacked Blur for Free Tier
                Stack(
                  children: [
                    Column(
                      children: _competitors.map((comp) {
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.grey.withValues(alpha: 0.15)),
                          ),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: Image.network(
                                  comp['image'],
                                  width: 60,
                                  height: 60,
                                  fit: BoxFit.cover,
                                  errorBuilder: (ctx, err, stack) => Container(
                                    width: 60,
                                    height: 60,
                                    color: Colors.grey.withValues(alpha: 0.2),
                                    child: const Icon(Icons.home_work_rounded, color: Colors.grey),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      comp['title'],
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                                    ),
                                    const SizedBox(height: 3),
                                    Row(
                                      children: [
                                        const Icon(Icons.star_rounded, size: 14, color: Color(0xFFF59E0B)),
                                        const SizedBox(width: 3),
                                        Text(
                                          '${comp['rating']} (${comp['reviews']}) • ${comp['locality']}',
                                          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '₹${comp['price']}',
                                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                                  ),
                                  const Text('/ night', style: TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                                ],
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    ),

                    // Blur Overlay if not subscribed
                    if (!_isProSubscriber)
                      Positioned.fill(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 5.0, sigmaY: 5.0),
                            child: Container(
                              color: (isDark ? Colors.black : Colors.white).withValues(alpha: 0.55),
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF8B5CF6),
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF8B5CF6).withValues(alpha: 0.4),
                                          blurRadius: 12,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: const Icon(Icons.lock_rounded, color: Colors.white, size: 20),
                                  ),
                                  const SizedBox(height: 8),
                                  const Text(
                                    'Unlock Live Competitor Pricing',
                                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                                  ),
                                  const SizedBox(height: 4),
                                  const Text(
                                    'See exact neighbor properties & demand surge alerts with StayQ Host Pro.',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                  ),
                                  const SizedBox(height: 12),
                                  BouncingWidget(
                                    onTap: _openPaywall,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                      decoration: BoxDecoration(
                                        gradient: const LinearGradient(
                                          colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
                                        ),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Text(
                                        'Unlock for ₹999/mo',
                                        style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCol(String label, String value, {bool isPrimary = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 3),
        Text(
          value,
          style: TextStyle(
            fontSize: isPrimary ? 16 : 14,
            fontWeight: FontWeight.w900,
            color: isPrimary ? const Color(0xFF8B5CF6) : AppColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

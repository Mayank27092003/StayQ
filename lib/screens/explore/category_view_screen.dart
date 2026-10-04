import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/stay_card.dart';
import '../listing/listing_detail_screen.dart';
import '../search/search_filter_modal.dart';

class CategoryViewScreen extends StatefulWidget {
  final String categoryTitle;

  const CategoryViewScreen({super.key, required this.categoryTitle});

  @override
  State<CategoryViewScreen> createState() => _CategoryViewScreenState();
}

class _CategoryViewScreenState extends State<CategoryViewScreen> {
  String _selectedFilter = 'All';

  List<String> _getFilterChipsForCategory(String categoryTitle) {
    final cat = categoryTitle.toLowerCase();
    if (cat == 'rvs' || cat == 'rv' || cat.contains('campervan')) {
      return [
        'All',
        'Self-Drive',
        'With Captain',
        '220V Shore Power',
        'AC & Shower',
        '4x4 / AWD',
        'Pet Friendly',
        'Under ₹10k/day',
      ];
    } else if (cat.contains('zero broker') || cat == 'zero brokerage' || cat.contains('long term')) {
      return [
        'All',
        '0% Brokerage',
        '1-Month Deposit',
        'Furnished',
        'High-Speed WiFi',
        'Pet Friendly',
        'Under ₹35k/mo',
        'Bengaluru',
        'Goa',
      ];
    } else if (cat == 'camping' || cat == 'glamping' || cat.contains('camp')) {
      return [
        'All',
        'Luxury Glamping',
        'Riverside / Lake',
        'Campfire & BBQ',
        'Washroom & Power',
        'Pet Friendly',
        'Rating 4.9+',
      ];
    } else {
      return [
        'All',
        'Private Pool',
        'Entire Place',
        'With Host',
        'Guest Favorite',
        'Starhost',
        'Rating 4.9+',
      ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);

    final filteredList = provider.stays.where((stay) {
      bool matchesCategory = true;
      final cat = widget.categoryTitle.toLowerCase();
      if (widget.categoryTitle == 'Trending') {
        matchesCategory = stay.isGuestFavorite || stay.rating >= 4.9;
      } else if (cat.contains('zero broker') || cat == 'zero brokerage') {
        matchesCategory = stay.isZeroBroker;
      } else if (cat == 'rvs' || cat == 'rv' || cat.contains('campervan')) {
        matchesCategory = stay.propertyType == 'RV' || stay.category.toLowerCase().contains('rv');
      } else if (cat == 'camping' || cat == 'glamping' || cat.contains('camp')) {
        matchesCategory = stay.propertyType == 'CAMPING_SITE' || stay.category.toLowerCase().contains('camp') || stay.category.toLowerCase().contains('glamp');
      } else if (widget.categoryTitle != 'Recommended' && widget.categoryTitle != 'All Stays') {
        matchesCategory = stay.category.toLowerCase() == widget.categoryTitle.toLowerCase();
      }

      if (!matchesCategory) return false;

      switch (_selectedFilter) {
        case 'With Host':
          return stay.isStayingWithHost;
        case 'Entire Place':
          return !stay.isStayingWithHost;
        case 'Guest Favorite':
          return stay.isGuestFavorite;
        case 'Starhost':
        case 'Star Host':
          return stay.isStarHost;
        case 'Rating 4.9+':
          return stay.rating >= 4.9;
        // RV / Campervan Filters
        case 'Self-Drive':
          return stay.amenities.any((a) => a.toLowerCase().contains('self') || a.toLowerCase().contains('drive')) ||
              stay.title.toLowerCase().contains('self-drive') ||
              stay.description.toLowerCase().contains('self-drive') ||
              !stay.isStayingWithHost;
        case 'With Captain':
          return stay.amenities.any((a) => a.toLowerCase().contains('captain') || a.toLowerCase().contains('driver')) ||
              stay.title.toLowerCase().contains('captain') ||
              stay.isStayingWithHost;
        case '220V Shore Power':
          return stay.amenities.any((a) => a.toLowerCase().contains('power') || a.toLowerCase().contains('shore') || a.toLowerCase().contains('220v') || a.toLowerCase().contains('electric'));
        case 'AC & Shower':
          return stay.amenities.any((a) => a.toLowerCase().contains('ac') || a.toLowerCase().contains('air') || a.toLowerCase().contains('shower') || a.toLowerCase().contains('water'));
        case '4x4 / AWD':
          return stay.amenities.any((a) => a.toLowerCase().contains('4x4') || a.toLowerCase().contains('awd')) ||
              stay.title.toLowerCase().contains('4x4') ||
              stay.description.toLowerCase().contains('4x4');
        // Zero Brokerage / Long Term Filters
        case '0% Brokerage':
          return stay.isZeroBroker;
        case '1-Month Deposit':
          return stay.isZeroBroker || stay.description.toLowerCase().contains('deposit');
        case 'Furnished':
          return stay.amenities.any((a) => a.toLowerCase().contains('furnish') || a.toLowerCase().contains('kitchen') || a.toLowerCase().contains('bed')) || stay.isZeroBroker;
        case 'High-Speed WiFi':
          return stay.amenities.any((a) => a.toLowerCase().contains('wifi') || a.toLowerCase().contains('fiber') || a.toLowerCase().contains('internet'));
        case 'Under ₹35k/mo':
          return stay.pricePerNight <= 1800 || (stay.pricePerNight * 30) <= 50000;
        case 'Bengaluru':
          return stay.city.toLowerCase().contains('bangalore') || stay.city.toLowerCase().contains('bengaluru') || stay.location.toLowerCase().contains('bengaluru') || stay.location.toLowerCase().contains('bangalore');
        case 'Goa':
          return stay.city.toLowerCase().contains('goa') || stay.location.toLowerCase().contains('goa');
        // Camping / Glamping Filters
        case 'Luxury Glamping':
          return stay.category.toLowerCase().contains('glamp') || stay.title.toLowerCase().contains('glamp') || stay.description.toLowerCase().contains('glamp');
        case 'Riverside / Lake':
          return stay.amenities.any((a) => a.toLowerCase().contains('river') || a.toLowerCase().contains('lake') || a.toLowerCase().contains('water')) ||
              stay.title.toLowerCase().contains('river') ||
              stay.title.toLowerCase().contains('lake');
        case 'Campfire & BBQ':
          return stay.amenities.any((a) => a.toLowerCase().contains('fire') || a.toLowerCase().contains('bbq') || a.toLowerCase().contains('bonfire'));
        case 'Washroom & Power':
          return stay.amenities.any((a) => a.toLowerCase().contains('washroom') || a.toLowerCase().contains('power') || a.toLowerCase().contains('toilet') || a.toLowerCase().contains('electricity'));
        // Shared Filters
        case 'Pet Friendly':
          return stay.amenities.any((a) => a.toLowerCase().contains('pet')) || stay.tags.any((t) => t.toLowerCase().contains('pet'));
        case 'Under ₹10k/day':
          return stay.pricePerNight <= 10000;
        case 'Private Pool':
          return stay.amenities.any((a) => a.toLowerCase().contains('pool')) || stay.title.toLowerCase().contains('pool');
        case 'All':
        default:
          return true;
      }
    }).toList();

    final dynamicChips = _getFilterChipsForCategory(widget.categoryTitle);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          widget.categoryTitle,
          style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune_rounded),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => const SearchFilterModal(),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: dynamicChips.map((chipLabel) {
                return _FilterChip(
                  label: chipLabel,
                  isSelected: _selectedFilter == chipLabel,
                  onTap: () => setState(() => _selectedFilter = chipLabel),
                );
              }).toList(),
            ),
          ),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${filteredList.length} stays found',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textSecondary,
                  ),
                ),
                const Icon(Icons.grid_view_rounded, size: 20, color: AppColors.textSecondary),
              ],
            ),
          ),

          Expanded(
            child: filteredList.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.search_off_rounded, size: 48, color: AppColors.textMuted),
                        SizedBox(height: 12),
                        Text('No stays available in this category', style: TextStyle(color: AppColors.textSecondary)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    itemCount: filteredList.length,
                    itemBuilder: (context, index) {
                      final stay = filteredList[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 20),
                        child: StayCard(
                          width: double.infinity,
                          stay: stay,
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => ListingDetailScreen(stay: stay),
                              ),
                            );
                          },
                          onFavoriteTap: () => provider.toggleWishlist(stay),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({required this.label, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => onTap(),
        selectedColor: AppColors.primary,
        checkmarkColor: Colors.white,
        labelStyle: TextStyle(
          color: isSelected ? Colors.white : AppColors.textPrimary,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          fontSize: 12,
        ),
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: isSelected ? AppColors.primary : AppColors.borderLight),
        ),
      ),
    );
  }
}

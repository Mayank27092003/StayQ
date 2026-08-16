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

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);

    final filteredList = provider.stays.where((stay) {
      bool matchesCategory = true;
      if (widget.categoryTitle == 'Trending') {
        matchesCategory = stay.isGuestFavorite || stay.rating >= 4.9;
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
        case 'Superhost':
          return stay.isStarHost;
        case 'Rating 4.9+':
          return stay.rating >= 4.9;
        case 'All':
        default:
          return true;
      }
    }).toList();

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
              children: [
                _FilterChip(
                  label: 'All',
                  isSelected: _selectedFilter == 'All',
                  onTap: () => setState(() => _selectedFilter = 'All'),
                ),
                _FilterChip(
                  label: 'With Host',
                  isSelected: _selectedFilter == 'With Host',
                  onTap: () => setState(() => _selectedFilter = 'With Host'),
                ),
                _FilterChip(
                  label: 'Entire Place',
                  isSelected: _selectedFilter == 'Entire Place',
                  onTap: () => setState(() => _selectedFilter = 'Entire Place'),
                ),
                _FilterChip(
                  label: 'Guest Favorite',
                  isSelected: _selectedFilter == 'Guest Favorite',
                  onTap: () => setState(() => _selectedFilter = 'Guest Favorite'),
                ),
                _FilterChip(
                  label: 'Starhost',
                  isSelected: _selectedFilter == 'Starhost',
                  onTap: () => setState(() => _selectedFilter = 'Starhost'),
                ),
                _FilterChip(
                  label: 'Rating 4.9+',
                  isSelected: _selectedFilter == 'Rating 4.9+',
                  onTap: () => setState(() => _selectedFilter = 'Rating 4.9+'),
                ),
              ],
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

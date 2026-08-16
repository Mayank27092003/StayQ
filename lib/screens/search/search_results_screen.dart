import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/stay_card.dart';
import '../../widgets/bouncing_widget.dart';
import '../listing/listing_detail_screen.dart';
import '../search/search_filter_modal.dart';
import '../map/map_discovery_screen.dart';

class SearchResultsScreen extends StatefulWidget {
  const SearchResultsScreen({super.key});

  @override
  State<SearchResultsScreen> createState() => _SearchResultsScreenState();
}

class _SearchResultsScreenState extends State<SearchResultsScreen> {
  String _selectedFilter = 'All';

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final results = provider.filteredStays;
    final destination = provider.searchDestination;

    // Apply sub-filter
    final filteredList = results.where((stay) {
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
        case 'Top Rated':
          return stay.rating >= 4.9;
        case 'All':
        default:
          return true;
      }
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () {
            // Clear the search when going back
            provider.updateSearch(destination: '');
            Navigator.pop(context);
          },
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              destination.isNotEmpty ? destination : 'Search Results',
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 16,
                color: AppColors.textPrimary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            if (provider.selectedDateRange != null)
              Text(
                '${provider.selectedDateRange!.duration.inDays} nights · ${provider.adultsCount + provider.childrenCount} guests',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune_rounded, color: AppColors.textPrimary),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => const SearchFilterModal(),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.map_outlined, color: AppColors.textPrimary),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const MapDiscoveryScreen()),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _buildFilterChip('All'),
                _buildFilterChip('With Host'),
                _buildFilterChip('Entire Place'),
                _buildFilterChip('Guest Favorite'),
                _buildFilterChip('Starhost'),
                _buildFilterChip('Top Rated'),
              ],
            ),
          ),

          // Results count
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${filteredList.length} ${filteredList.length == 1 ? 'stay' : 'stays'} found',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textSecondary,
                  ),
                ),
                if (destination.isNotEmpty)
                  GestureDetector(
                    onTap: () {
                      provider.updateSearch(destination: '');
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            destination.split(',').first,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.close_rounded, size: 14, color: AppColors.primary),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Results list
          Expanded(
            child: filteredList.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceLight,
                            shape: BoxShape.circle,
                          ),
                          child: const Center(
                            child: Text('🔍', style: TextStyle(fontSize: 48)),
                          ),
                        ).animate(onPlay: (c) => c.repeat(reverse: true))
                          .scaleXY(begin: 1.0, end: 1.08, duration: 1200.ms, curve: Curves.easeInOut),
                        const SizedBox(height: 20),
                        const Text(
                          'No stays found',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          destination.isNotEmpty
                              ? 'Try searching for a different destination\nor adjusting your filters'
                              : 'Adjust your filters to find stays',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 24),
                        BouncingWidget(
                          onTap: () {
                            provider.updateSearch(destination: '');
                            // Refresh to show all
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Text(
                              'Clear Filters',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
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
                      ).animate().fadeIn(
                        duration: 400.ms,
                        delay: (index * 80).ms,
                      ).slideY(begin: 0.15, curve: Curves.easeOutCubic);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = _selectedFilter == label;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => setState(() => _selectedFilter = label),
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

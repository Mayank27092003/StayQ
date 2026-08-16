import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/stay_card.dart';
import '../../widgets/empty_state_view.dart';
import '../listing/listing_detail_screen.dart';

class WishlistsScreen extends StatelessWidget {
  const WishlistsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final savedStays = provider.wishlistedStays;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Wishlists', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SafeArea(
        child: savedStays.isEmpty
            ? EmptyStateView(
                title: 'Your Wishlist is empty',
                message: 'As you search, tap the heart icon on any stay to save your favorite escapes here.',
 // Placeholder for Wishlist Lottie
                buttonText: 'Start Exploring',
                onAction: () {
                  Navigator.pushNamedAndRemoveUntil(context, '/main', (route) => false);
                },
              )
            : ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: savedStays.length,
                itemBuilder: (context, index) {
                  final stay = savedStays[index];
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
    );
  }
}

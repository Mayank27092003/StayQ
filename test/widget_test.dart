import 'package:flutter_test/flutter_test.dart';
import 'package:stay_q/providers/app_provider.dart';

void main() {
  group('Stay Q App Unit & Provider Tests', () {
    test('AppProvider initial state has mock stays and user', () {
      final provider = AppProvider();
      expect(provider.stays.length, greaterThan(0));
      expect(provider.userName, 'Alexander Vance');
      expect(provider.isHostMode, false);
    });

    test('Toggle Host Mode updates provider state', () {
      final provider = AppProvider();
      expect(provider.isHostMode, false);
      provider.toggleHostMode();
      expect(provider.isHostMode, true);
    });

    test('Wishlist toggle adds and removes stay from wishlistedStays', () {
      final provider = AppProvider();
      final stay = provider.stays.first;
      final initialCount = provider.wishlistedStays.length;

      provider.toggleWishlist(stay);
      expect(provider.wishlistedStays.length, initialCount + 1);

      provider.toggleWishlist(stay);
      expect(provider.wishlistedStays.length, initialCount);
    });

    test('Search filter updates state', () {
      final provider = AppProvider();
      provider.updateSearch(destination: 'Paris, France', adults: 3);
      expect(provider.searchDestination, 'Paris, France');
      expect(provider.adultsCount, 3);
    });
  });
}

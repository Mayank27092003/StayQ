import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../widgets/bottom_nav_bar.dart';
import '../services/qube_trigger_service.dart';
import 'explore/home_screen.dart';
import 'wishlists/wishlists_screen.dart';
import 'trips/trips_screen.dart';
import 'inbox/inbox_screen.dart';
import 'profile/profile_screen.dart';
import 'map/map_discovery_screen.dart';
import 'host/host_dashboard_screen.dart';
import 'host/manage_listings_screen.dart';
import '../widgets/welcome_feature_popup.dart';

import '../widgets/draggable_qube_mascot.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  bool _hasTriggeredWelcome = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_hasTriggeredWelcome) {
      _hasTriggeredWelcome = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _initQubeWelcome();
        }
      });
    }
  }

  Future<void> _initQubeWelcome() async {
    final provider = Provider.of<AppProvider>(context, listen: false);
    await WelcomeFeaturePopup.showIfFirstTime(context, provider.isHostMode);
    if (!mounted) return;
    await QubeTriggerService.instance.showWelcomeIfFirstTime(context);
  }

  @override
  void dispose() {
    QubeTriggerService.instance.stopBrowsingTimer();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final activeTabIndex = provider.currentTabIndex;

    if (provider.isHostMode) {
      final hostPages = [
        const HostDashboardScreen(),
        const ManageListingsScreen(),
        const InboxScreen(),
        const ProfileScreen(),
      ];

      final safeIndex = activeTabIndex < hostPages.length ? activeTabIndex : 0;

      return PopScope(
        canPop: safeIndex == 0,
        onPopInvokedWithResult: (didPop, result) {
          if (!didPop) {
            provider.setTabIndex(0);
          }
        },
        child: Scaffold(
          extendBody: true,
          body: IndexedStack(
            index: safeIndex,
            children: hostPages,
          ),
          bottomNavigationBar: BottomNavBar(
            currentIndex: safeIndex,
            onTap: (index) {
              if (index < hostPages.length) {
                provider.setTabIndex(index);
              }
            },
          ),
        ),
      );
    }

    final guestPages = [
      HomeScreen(
        onOpenMap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const MapDiscoveryScreen()),
          );
        },
      ),
      const WishlistsScreen(),
      const TripsScreen(),
      const InboxScreen(),
      const ProfileScreen(),
    ];

    final safeGuestIndex = activeTabIndex < guestPages.length ? activeTabIndex : 0;

    return PopScope(
      canPop: safeGuestIndex == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          provider.setTabIndex(0);
        }
      },
      child: Scaffold(
        extendBody: true,
        body: Stack(
          children: [
            IndexedStack(
              index: safeGuestIndex,
              children: guestPages,
            ),
            if (safeGuestIndex == 0)
              const DraggableQubeMascot(),
          ],
        ),
        bottomNavigationBar: BottomNavBar(
          currentIndex: safeGuestIndex,
          onTap: (index) {
            if (index < guestPages.length) {
              provider.setTabIndex(index);
            }
          },
        ),
      ),
    );
  }
}

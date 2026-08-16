import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../widgets/bottom_nav_bar.dart';
import '../widgets/feature_showcase.dart';
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
  int _currentTabIndex = 0;
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
    WelcomeFeaturePopup.show(context, provider.isHostMode);
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

    if (provider.isHostMode) {
      final hostPages = [
        const HostDashboardScreen(),
        const ManageListingsScreen(),
        const InboxScreen(),
        const ProfileScreen(),
      ];

      final safeIndex = _currentTabIndex < hostPages.length ? _currentTabIndex : 0;

      return PopScope(
        canPop: safeIndex == 0,
        onPopInvoked: (didPop) {
          if (!didPop) {
            setState(() {
              _currentTabIndex = 0;
            });
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
                setState(() => _currentTabIndex = index);
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

    return PopScope(
      canPop: _currentTabIndex == 0,
      onPopInvoked: (didPop) {
        if (!didPop) {
          setState(() {
            _currentTabIndex = 0;
          });
        }
      },
      child: Scaffold(
        extendBody: true,
        body: Stack(
          children: [
            IndexedStack(
              index: _currentTabIndex,
              children: guestPages,
            ),
            const DraggableQubeMascot(),
          ],
        ),
        bottomNavigationBar: BottomNavBar(
          currentIndex: _currentTabIndex,
          onTap: (index) {
            setState(() => _currentTabIndex = index);
          },
        ),
      ),
    );
  }
}

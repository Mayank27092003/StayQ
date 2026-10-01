import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/app_provider.dart';
import 'providers/host_onboarding_provider.dart';
import 'providers/host_dashboard_provider.dart';
import 'providers/host_listings_provider.dart';
import 'providers/messaging_provider.dart';
import 'theme/app_colors.dart';
import 'theme/app_theme.dart';
import 'navigation/app_router.dart';

import 'package:firebase_core/firebase_core.dart';
import 'services/push_notification_service.dart';

final GlobalKey<ScaffoldMessengerState> rootScaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

void main() {
  // ─── 1. RESILIENCE: Catch all unhandled async errors in Zone ───
  runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();

    // ─── 2. MEMORY RESILIENCE: Limit image cache size to avoid OOM crashes ───
    PaintingBinding.instance.imageCache.maximumSize = 120;
    PaintingBinding.instance.imageCache.maximumSizeBytes = 80 * 1024 * 1024; // 80 MB limit

    // ─── 3. UI RESILIENCE: Custom ErrorWidget (No Red Screen of Death) ───
    ErrorWidget.builder = (FlutterErrorDetails details) {
      return Material(
        color: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF1E1C2A),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white12),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.refresh_rounded, color: AppColors.primary, size: 28),
              const SizedBox(height: 8),
              const Text(
                'Something took a moment to load',
                style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              const Text(
                'Stay Q auto-recovered this view.',
                style: TextStyle(color: Colors.white60, fontSize: 11),
              ),
            ],
          ),
        ),
      );
    };

    // ─── 4. FRAMEWORK RESILIENCE: Capture Flutter framework layout/render errors ───
    FlutterError.onError = (FlutterErrorDetails details) {
      FlutterError.presentError(details);
      debugPrint('🛡️ [StayQ Resilience] FlutterError caught: ${details.exceptionAsString()}');
    };

    // ─── 5. PLATFORM RESILIENCE: Root isolate error guard ───
    PlatformDispatcher.instance.onError = (error, stack) {
      debugPrint('🛡️ [StayQ Resilience] PlatformDispatcher error caught: $error');
      return true; // Handled, prevents app from terminating
    };

    // ─── 6. SERVICES INITIALIZATION (Safely wrapped) ───
    try {
      await Firebase.initializeApp();
      await PushNotificationService.initialize(messengerKey: rootScaffoldMessengerKey);
    } catch (e) {
      debugPrint('⚠️ Firebase/Push notification init fallback: $e');
    }

    // Lock orientation to portrait for maximum stability
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ]);

    runApp(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => AppProvider()),
          ChangeNotifierProvider(create: (_) => HostOnboardingProvider()),
          ChangeNotifierProvider(create: (_) => HostDashboardProvider()),
          ChangeNotifierProvider(create: (_) => HostListingsProvider()),
          ChangeNotifierProvider(create: (_) => MessagingProvider()..initializeSocket()),
        ],
        child: const StayQApp(),
      ),
    );
  }, (error, stackTrace) {
    debugPrint('🛡️ [StayQ ZoneGuard] Unhandled async exception caught: $error');
  });
}

class StayQApp extends StatelessWidget {
  const StayQApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        return MaterialApp(
          title: 'Stay Q',
          scaffoldMessengerKey: rootScaffoldMessengerKey,
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: provider.themeMode,
          initialRoute: AppRoutes.initial,
          onGenerateRoute: AppRouter.generateRoute,
        );
      },
    );
  }
}

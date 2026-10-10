import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'providers/app_provider.dart';
import 'providers/host_onboarding_provider.dart';
import 'providers/host_dashboard_provider.dart';
import 'providers/host_listings_provider.dart';
import 'providers/messaging_provider.dart';
import 'theme/app_theme.dart';
import 'navigation/app_router.dart';
import 'services/push_notification_service.dart';

final GlobalKey<ScaffoldMessengerState> rootScaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

void main() {
  runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();
    PaintingBinding.instance.imageCache.maximumSize = 120;
    PaintingBinding.instance.imageCache.maximumSizeBytes = 80 * 1024 * 1024;
    ErrorWidget.builder = (FlutterErrorDetails details) {
      if (details.exceptionAsString().contains('overflowed')) {
        return const SizedBox.shrink();
      }
      return const Material(child: Padding(
        padding: EdgeInsets.all(24), child: Text('This view could not load. Reopen it to try again.')));
    };
    FlutterError.onError = (FlutterErrorDetails details) {
      final isOverflow = details.exceptionAsString().contains('overflowed') ||
          details.summary.toString().contains('overflowed') ||
          details.toString().contains('overflowed');
      if (isOverflow) {
        debugPrint('Suppressed layout overflow: ${details.exceptionAsString()}');
        return;
      }
      FlutterError.presentError(details);
    };
    PlatformDispatcher.instance.onError = (error, stack) {
      debugPrint('Unhandled platform error: $error\n$stack');
      return true;
    };
    try {
      await Firebase.initializeApp().timeout(const Duration(seconds: 15));
    } catch (error, stack) {
      debugPrint('Firebase initialization failed: $error\n$stack');
      runApp(const MaterialApp(home: Scaffold(body: Center(child: Padding(
        padding: EdgeInsets.all(24), child: Text('Account services could not start. Check your connection and Firebase configuration, then restart the app.'))))));
      return;
    }
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp, DeviceOrientation.portraitDown,
    ]);
    runApp(ChangeNotifierProvider(create: (_) => AppProvider(), child: const _AccountScope()));
    // Notification permission and network registration must never delay the first frame.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      unawaited(PushNotificationService.initialize(messengerKey: rootScaffoldMessengerKey)
        .timeout(const Duration(seconds: 15)).catchError((Object error) {
          debugPrint('Notification initialization failed: $error');
        }));
    });
  }, (error, stack) { debugPrint('Unhandled application error: $error\n$stack'); });
}

class _AccountScope extends StatelessWidget {
  const _AccountScope();
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProxyProvider<AppProvider, HostOnboardingProvider>(
          create: (_) => HostOnboardingProvider(userId: FirebaseAuth.instance.currentUser?.uid),
          update: (_, app, prev) => (prev ?? HostOnboardingProvider())..updateUserId(app.userId),
        ),
        ChangeNotifierProxyProvider<AppProvider, HostDashboardProvider>(
          create: (_) => HostDashboardProvider(userId: FirebaseAuth.instance.currentUser?.uid),
          update: (_, app, prev) => (prev ?? HostDashboardProvider())..updateUserId(app.userId),
        ),
        ChangeNotifierProxyProvider<AppProvider, HostListingsProvider>(
          create: (_) => HostListingsProvider(userId: FirebaseAuth.instance.currentUser?.uid),
          update: (_, app, prev) => (prev ?? HostListingsProvider())..updateUserId(app.userId),
        ),
        ChangeNotifierProxyProvider<AppProvider, MessagingProvider>(
          create: (_) => MessagingProvider(userId: FirebaseAuth.instance.currentUser?.uid)..initializeSocket(),
          update: (_, app, prev) => (prev ?? MessagingProvider())..updateUserId(app.userId),
        ),
      ],
      child: const StayQApp(),
    );
  }
}

class StayQApp extends StatelessWidget {
  const StayQApp({super.key});
  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(builder: (context, provider, _) => MaterialApp(
      title: 'StayQ', scaffoldMessengerKey: rootScaffoldMessengerKey,
      debugShowCheckedModeBanner: false, theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme, themeMode: provider.themeMode,
      initialRoute: AppRoutes.initial, onGenerateRoute: AppRouter.generateRoute,
    ));
  }
}

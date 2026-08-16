import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/app_provider.dart';
import 'providers/host_onboarding_provider.dart';
import 'providers/host_dashboard_provider.dart';
import 'providers/host_listings_provider.dart';
import 'providers/messaging_provider.dart';
import 'theme/app_theme.dart';
import 'navigation/app_router.dart';

import 'package:firebase_core/firebase_core.dart';

import 'services/push_notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
    await PushNotificationService.initialize();
  } catch (e) {
    debugPrint('Firebase initialization failed: $e');
  }
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
}

class StayQApp extends StatelessWidget {
  const StayQApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, provider, child) {
        return MaterialApp(
          title: 'Stay Q',
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

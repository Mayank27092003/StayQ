import 'package:flutter/material.dart';
import '../screens/auth/auth_gateway_screen.dart';
import '../screens/auth/phone_input_screen.dart';
import '../screens/auth/otp_screen.dart';
import '../screens/auth/complete_profile_screen.dart';
import '../screens/main_shell.dart';
import '../screens/host/manage_listings_screen.dart';
import '../screens/host/host_dashboard_screen.dart';
import '../screens/host/add_listing_wizard.dart';
import '../theme/app_motion.dart';
import '../screens/splash_screen.dart';
import '../screens/walkthrough_screen.dart';
import '../screens/profile/profile_screen.dart';

class AppRoutes {
  static const String initial = '/';
  static const String walkthrough = '/walkthrough';
  static const String mainShell = '/main';
  static const String profile = '/profile';
  static const String login = '/login'; // Points to Auth Gateway now
  static const String phoneInput = '/auth/phone';
  static const String otpVerify = '/auth/otp';
  static const String completeProfile = '/auth/complete-profile';
  static const String hostDashboard = '/host';
  static const String manageListings = '/host/listings';
  static const String addListing = '/host/add-listing';
}

class AppRouter {
  static Route<dynamic>? generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.initial:
        return _buildPageRoute(const SplashScreen(), settings);
      case AppRoutes.walkthrough:
        return _buildPageRoute(const WalkthroughScreen(), settings);
      case AppRoutes.mainShell:
        return _buildPageRoute(const MainShell(), settings);
      case AppRoutes.profile:
        return _buildPageRoute(const ProfileScreen(), settings);
      case AppRoutes.login:
        return _buildPageRoute(const AuthGatewayScreen(), settings);
      case AppRoutes.phoneInput:
        return _buildPageRoute(const PhoneInputScreen(), settings);
      case AppRoutes.otpVerify:
        return _buildPageRoute(const OtpScreen(), settings);
      case AppRoutes.completeProfile:
        return _buildPageRoute(const CompleteProfileScreen(), settings);
      case AppRoutes.hostDashboard:
        return _buildPageRoute(const HostDashboardScreen(), settings);
      case AppRoutes.manageListings:
        return _buildPageRoute(const ManageListingsScreen(), settings);
      case AppRoutes.addListing:
        return _buildSlideUpRoute(const AddListingWizard(), settings);
      default:
        return _buildPageRoute(
          Scaffold(
            body: Center(
              child: Text('No route defined for ${settings.name}'),
            ),
          ),
          settings,
        );
    }
  }

  static PageRouteBuilder _buildPageRoute(Widget page, RouteSettings settings) {
    return PageRouteBuilder(
      settings: settings,
      transitionDuration: AppMotion.standard,
      reverseTransitionDuration: AppMotion.standard,
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        final curveAnimation = CurvedAnimation(
          parent: animation,
          curve: AppMotion.signatureCurve,
          reverseCurve: AppMotion.signatureCurve.flipped,
        );
        return FadeTransition(
          opacity: curveAnimation,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0.05, 0),
              end: Offset.zero,
            ).animate(curveAnimation),
            child: child,
          ),
        );
      },
    );
  }

  static PageRouteBuilder _buildSlideUpRoute(Widget page, RouteSettings settings) {
    return PageRouteBuilder(
      settings: settings,
      transitionDuration: AppMotion.extended,
      reverseTransitionDuration: AppMotion.extended,
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        const begin = Offset(0.0, 1.0);
        const end = Offset.zero;
        const curve = AppMotion.signatureCurve;

        var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
        return SlideTransition(
          position: animation.drive(tween),
          child: child,
        );
      },
    );
  }
}

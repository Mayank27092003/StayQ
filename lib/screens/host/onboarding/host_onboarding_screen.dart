import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../providers/host_onboarding_provider.dart';
import '../../../theme/app_colors.dart';
import '../../../navigation/app_router.dart';
import 'screens/host_welcome_screen.dart';
import 'screens/host_account_setup_screen.dart';
import 'screens/property_type_screen.dart';
import 'screens/property_basic_info_screen.dart';
import 'screens/property_location_screen.dart';
import 'screens/property_photos_screen.dart';
import 'screens/amenities_screen.dart';
import 'screens/room_setup_and_pricing_screen.dart';
import 'screens/availability_setup_screen.dart';
import 'screens/policies_and_rules_screen.dart';
import 'screens/host_verification_screen.dart';
import 'screens/bank_details_screen.dart';
import 'screens/property_review_and_submit_screen.dart';
import 'screens/rv_details_screen.dart';
import 'screens/camping_details_screen.dart';
import 'screens/host_success_passport_screen.dart';

class HostOnboardingScreen extends StatefulWidget {
  final bool isAddingNewProperty;
  const HostOnboardingScreen({Key? key, this.isAddingNewProperty = false}) : super(key: key);

  @override
  State<HostOnboardingScreen> createState() => _HostOnboardingScreenState();
}

class _HostOnboardingScreenState extends State<HostOnboardingScreen> {
  int _currentIndex = 0;

  List<Widget> _getScreens(HostOnboardingProvider provider) {
    List<Widget> base = [];
    
    if (!widget.isAddingNewProperty) {
      base.addAll([
        HostWelcomeScreen(
          onGetStarted: () {
            if (_currentIndex < base.length - 1) {
              setState(() {
                _currentIndex++;
              });
            }
          },
        ),
        const HostAccountSetupScreen(),
      ]);
    }

    base.addAll([
      const PropertyTypeScreen(),
      const PropertyBasicInfoScreen(),
      const PropertyLocationScreen(),
      const PropertyPhotosScreen(),
      const AmenitiesScreen(),
    ]);

    if (provider.propertyType == 'RV') {
      base.add(const RvDetailsScreen());
    } else if (provider.propertyType == 'CAMPING_SITE') {
      base.add(const CampingDetailsScreen());
    }

    base.addAll([
      const RoomSetupAndPricingScreen(),
      const AvailabilitySetupScreen(),
      const PoliciesAndRulesScreen(),
    ]);

    if (!widget.isAddingNewProperty) {
      base.addAll([
        const BankDetailsScreen(),
        const HostVerificationScreen(),
      ]);
    } else {
      base.add(const HostVerificationScreen());
    }

    base.add(const PropertyReviewAndSubmitScreen());

    return base;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final hostProvider = context.read<HostOnboardingProvider>();
      final total = _getScreens(hostProvider).length;
      if (widget.isAddingNewProperty) {
        setState(() {
          _currentIndex = 0;
        });
        hostProvider.resetForNewProperty();
      } else if (hostProvider.currentPage > 0) {
        final safeIdx = hostProvider.currentPage.clamp(0, total > 0 ? total - 1 : 0);
        setState(() {
          _currentIndex = safeIdx;
        });
      }
    });
  }

  @override
  void dispose() {
    super.dispose();
  }

  bool _validateCurrentScreen(HostOnboardingProvider provider, Widget currentScreen) {
    if (currentScreen is HostAccountSetupScreen) {
      return provider.firstName.isNotEmpty && provider.lastName.isNotEmpty && provider.email.isNotEmpty && provider.phone.isNotEmpty;
    }
    if (currentScreen is PropertyBasicInfoScreen) {
      return provider.title.isNotEmpty && provider.description.isNotEmpty;
    }
    if (currentScreen is PropertyLocationScreen) {
      return provider.city.isNotEmpty && provider.state.isNotEmpty;
    }
    if (currentScreen is BankDetailsScreen) {
      return (provider.accountNumber.isNotEmpty && provider.ifscCode.isNotEmpty) || provider.upiId.isNotEmpty;
    }
    return true;
  }

  Future<void> _nextPage(HostOnboardingProvider provider, List<Widget> currentScreens) async {
    if (currentScreens.isEmpty) return;
    final safeIdx = _currentIndex.clamp(0, currentScreens.length - 1);
    
    if (!_validateCurrentScreen(provider, currentScreens[safeIdx])) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill all required fields'),
          backgroundColor: Colors.redAccent,
        )
      );
      return;
    }

    // If on review screen, attempt to submit and finish!
    if (currentScreens[safeIdx] is PropertyReviewAndSubmitScreen) {
      final success = await provider.submitProperty();
      if (!success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Submission failed. Please check network and try again.')),
          );
        }
        return;
      }

      await provider.clearDraftPrefs();
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => HostSuccessPassportScreen(
              propertyTitle: provider.title.isNotEmpty ? provider.title : 'Luxury Boutique Stay',
              city: provider.city.isNotEmpty ? provider.city : 'Goa',
              pricePerNight: provider.pricePerNight > 0 ? provider.pricePerNight : 12500,
            ),
          ),
        );
      }
      return;
    }

    if (safeIdx < currentScreens.length - 1) {
      final nextIdx = safeIdx + 1;
      setState(() {
        _currentIndex = nextIdx;
      });
      provider.setPage(nextIdx);
    }
  }

  void _previousPage(HostOnboardingProvider provider) {
    if (_currentIndex > 0) {
      final prevIdx = _currentIndex - 1;
      setState(() {
        _currentIndex = prevIdx;
      });
      provider.setPage(prevIdx);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Consumer<HostOnboardingProvider>(
      builder: (context, provider, child) {
        final currentScreens = _getScreens(provider);
        if (currentScreens.isEmpty) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }

        final safeIndex = _currentIndex.clamp(0, currentScreens.length - 1);
        bool isNextDisabled = provider.isUploading;
        bool isWelcomeScreen = safeIndex < currentScreens.length && currentScreens[safeIndex] is HostWelcomeScreen;

        return PopScope(
          canPop: safeIndex == 0 || isWelcomeScreen,
          onPopInvokedWithResult: (didPop, result) {
            if (!didPop && safeIndex > 0) {
              _previousPage(provider);
            }
          },
          child: Scaffold(
            backgroundColor: isDark ? const Color(0xFF0F0E17) : Colors.white,
            body: SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.home_work_rounded, color: AppColors.primary, size: 20),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Step ${safeIndex + 1} of ${currentScreens.length}',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.white70 : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      TextButton.icon(
                        onPressed: () async {
                          await provider.saveDraftToPrefs();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Draft saved. You can resume anytime!'),
                                duration: Duration(seconds: 2),
                              ),
                            );
                            Navigator.pushNamedAndRemoveUntil(context, AppRoutes.mainShell, (route) => false);
                          }
                        },
                        icon: const Icon(Icons.bookmark_outline_rounded, size: 18, color: AppColors.primary),
                        label: const Text(
                          'Save & Exit',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                      ),
                    ],
                  ),
                ),
                TweenAnimationBuilder<double>(
                  duration: const Duration(milliseconds: 300),
                  tween: Tween<double>(
                    begin: 0,
                    end: (safeIndex + 1) / currentScreens.length,
                  ),
                  builder: (context, value, child) {
                    return LinearProgressIndicator(
                      value: value,
                      backgroundColor: isDark ? Colors.white12 : Colors.grey[200],
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                      minHeight: 5,
                    );
                  },
                ).animate().fadeIn(duration: 400.ms),
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 300),
                    transitionBuilder: (Widget child, Animation<double> animation) {
                      return FadeTransition(
                        opacity: animation,
                        child: SlideTransition(
                          position: Tween<Offset>(
                            begin: const Offset(0.04, 0),
                            end: Offset.zero,
                          ).animate(animation),
                          child: child,
                        ),
                      );
                    },
                    child: KeyedSubtree(
                      key: ValueKey<int>(safeIndex),
                      child: Material(
                        type: MaterialType.transparency,
                        child: currentScreens[safeIndex],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          bottomNavigationBar: isWelcomeScreen
              ? null
              : SafeArea(
                  child: Container(
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF161424) : Colors.white,
                      border: Border(
                        top: BorderSide(
                          color: isDark ? Colors.white10 : AppColors.borderLight,
                          width: 1,
                        ),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.05),
                          blurRadius: 10,
                          offset: const Offset(0, -5),
                        )
                      ],
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Back Button
                          if (safeIndex > 0 && !isWelcomeScreen)
                            TextButton(
                              onPressed: () => _previousPage(provider),
                              child: Text(
                                'Back',
                                style: TextStyle(
                                  fontSize: 15,
                                  color: isDark ? Colors.white60 : Colors.grey[600],
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            )
                          else
                            const SizedBox(width: 40),
                          
                          const Spacer(),
                          
                          // Next / Submit Button
                          if (!isWelcomeScreen)
                            ElevatedButton(
                              onPressed: isNextDisabled || provider.isUploading ? null : () => _nextPage(provider, currentScreens),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: isNextDisabled || provider.isUploading ? Colors.grey : AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                elevation: 0,
                                minimumSize: const Size(120, 48),
                              ),
                              child: provider.isUploading 
                                ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : Text(
                                    safeIndex == currentScreens.length - 2 
                                        ? 'Submit' 
                                        : safeIndex == currentScreens.length - 1 
                                            ? 'Finish' 
                                            : 'Next', 
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)
                                  ),
                            ),
                        ],
                      ),
                  ),
                ),
              ),
            ),
          );
        }
      );
  }
}

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
import 'screens/rv_specs_screen.dart';
import 'screens/rv_living_comfort_screen.dart';
import 'screens/rv_mobility_pricing_screen.dart';
import 'screens/rv_guidelines_screen.dart';
import 'screens/camping_details_screen.dart';
import 'screens/host_success_passport_screen.dart';

class HostOnboardingScreen extends StatefulWidget {
  final bool isAddingNewProperty;
  final bool startAtBeginning;
  const HostOnboardingScreen({
    Key? key,
    this.isAddingNewProperty = false,
    this.startAtBeginning = true,
  }) : super(key: key);

  @override
  State<HostOnboardingScreen> createState() => _HostOnboardingScreenState();
}

class _HostOnboardingScreenState extends State<HostOnboardingScreen> {
  int _currentIndex = 0;

  List<Widget> _getScreens(HostOnboardingProvider provider) {
    List<Widget> base = [];
    
    if (!widget.isAddingNewProperty) {
      base.add(
        HostWelcomeScreen(
          onGetStarted: () {
            if (_currentIndex < base.length - 1) {
              setState(() {
                _currentIndex++;
              });
            }
          },
        ),
      );
    }

    // Only ask for account details if host profile is completely empty
    final bool hasAccount = provider.firstName.trim().isNotEmpty &&
        (provider.email.trim().isNotEmpty || provider.phone.trim().isNotEmpty);
    if (!hasAccount) {
      base.add(const HostAccountSetupScreen());
    }

    // 1. What are you listing? (Master category & rental mode selector)
    base.add(const PropertyTypeScreen());

    // 2. Tailored accommodation details based on propertyType
    if (provider.propertyType == 'RV') {
      base.addAll([
        const PropertyBasicInfoScreen(), // RV Title, Description, Passenger capacity
        const RvSpecsScreen(), // Page 1: Rig Identity, Make, Model, Year, Fuel, Transmission
        const RvLivingComfortScreen(), // Page 2: Berths, Bed Layouts, Galley, Bathroom, Off-grid Gear
        const RvMobilityPricingScreen(), // Page 3: Mobility mode, Daily Km, Tariffs, Corridors
        const RvGuidelinesScreen(), // Page 4: Driver Eligibility, Speed limiter, Night policy
        const PropertyLocationScreen(), // Pickup location & hub
        const PropertyPhotosScreen(),
        const AvailabilitySetupScreen(), // Calendar & blocked dates
        const PoliciesAndRulesScreen(), // Driving rules & vehicle security deposit
      ]);
    } else if (provider.propertyType == 'CAMPING_SITE') {
      base.addAll([
        const PropertyBasicInfoScreen(), // Campsite Name & Description
        const CampingDetailsScreen(), // Terrain & wilderness facilities
        const RoomSetupAndPricingScreen(), // Campsite units setup (pitches, domes, capacity)
        const PropertyLocationScreen(), // GPS location & access
        const PropertyPhotosScreen(),
        const AvailabilitySetupScreen(), // Calendar & blocked dates
        const PoliciesAndRulesScreen(), // Camp rules & campfire safety
      ]);
    } else {
      // Standard residential stays (Villa, Apartment, Cabin, Homestay, etc.)
      base.addAll([
        const PropertyBasicInfoScreen(),
        const PropertyLocationScreen(),
        const PropertyPhotosScreen(),
        const AmenitiesScreen(),
        const RoomSetupAndPricingScreen(),
        const AvailabilitySetupScreen(),
        const PoliciesAndRulesScreen(),
      ]);
    }

    // Shared KYC, verification, and preview
    base.addAll([
      const BankDetailsScreen(),
      const HostVerificationScreen(),
      const PropertyReviewAndSubmitScreen(),
    ]);

    return base;
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      final provider = context.read<HostOnboardingProvider>();
      await provider.ready;
      if (!mounted) return;
      if (widget.isAddingNewProperty) {
        provider.isAddingSubsequentProperty = true;
        await provider.resetForNewProperty();
      } else {
        await provider.checkHostListingStatus();
      }
      if (!mounted) return;
      final total = _getScreens(provider).length;
      setState(() => _currentIndex = widget.startAtBeginning || widget.isAddingNewProperty
        ? 0 : provider.currentPage.clamp(0, total - 1));
    });
  }

  @override
  void dispose() {
    super.dispose();
  }

  String? _getValidationErrorMessage(HostOnboardingProvider provider, Widget screen) {
    if (screen is HostAccountSetupScreen) {
      if ([provider.firstName, provider.email, provider.phone].any((s) => s.trim().isEmpty)) {
        return 'Please enter your name, email, and phone number';
      }
    }
    if (screen is PropertyBasicInfoScreen) {
      if (provider.title.trim().isEmpty || provider.description.trim().isEmpty) {
        return 'Please provide a listing title and description';
      }
    }
    if (screen is RvSpecsScreen) {
      final make = provider.rvDetails['makeController']?.toString() ?? '';
      final model = provider.rvDetails['modelController']?.toString() ?? '';
      if (make.trim().isEmpty && model.trim().isEmpty) {
        return 'Please select your vehicle make and model';
      }
    }
    if (screen is RvMobilityPricingScreen) {
      if (provider.pricePerNight <= 0) {
        return 'Please specify the daily rental tariff for your RV';
      }
    }
    if (screen is PropertyLocationScreen) {
      if (provider.city.trim().isEmpty && provider.pickupLocation.trim().isEmpty && provider.address.trim().isEmpty) {
        return 'Please enter your location or city';
      }
    }
    if (screen is PropertyPhotosScreen) {
      if (!provider.allRequiredCategoriesFilled) {
        return 'Please upload all required photos';
      }
    }
    if (screen is BankDetailsScreen) {
      final hasPayout = (provider.accountNumber.isNotEmpty && provider.ifscCode.isNotEmpty) || provider.upiId.isNotEmpty || provider.payoutVerified;
      if (!hasPayout) {
        return 'Please enter your bank account or UPI ID for payouts';
      }
      final hasSelfie = provider.selfieFaceProofDocPath.isNotEmpty || provider.selfieFaceProofDocUrl.isNotEmpty || provider.faceVerified;
      if (!hasSelfie) {
        return 'Please upload your selfie photo to continue';
      }
    }
    if (screen is HostVerificationScreen) {
      if (!provider.isLegalDeclarationAccepted) {
        return 'Please accept the host declaration to proceed';
      }
    }
    return null;
  }

  Future<void> _nextPage(HostOnboardingProvider provider, List<Widget> currentScreens) async {
    if (currentScreens.isEmpty) return;
    final safeIdx = _currentIndex.clamp(0, currentScreens.length - 1);
    
    final validationError = _getValidationErrorMessage(provider, currentScreens[safeIdx]);
    if (validationError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(validationError),
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
            SnackBar(content: Text(provider.lastError ?? 'Submission failed. Your draft is preserved.')),
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
              propertyTitle: provider.title,
              city: provider.city,
              pricePerNight: provider.pricePerNight,
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
        if (currentScreens.isEmpty || provider.isRestoring) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }

        final safeIndex = _currentIndex.clamp(0, currentScreens.length - 1);
        final bool isNextDisabled = provider.isUploading;
        final bool isWelcomeScreen = safeIndex < currentScreens.length && currentScreens[safeIndex] is HostWelcomeScreen;
        final bool hasWelcome = currentScreens.isNotEmpty && currentScreens.first is HostWelcomeScreen;
        final int totalFormSteps = hasWelcome ? (currentScreens.length - 1) : currentScreens.length;
        final int currentFormStep = hasWelcome ? safeIndex : (safeIndex + 1);

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
                          IconButton(
                            icon: const Icon(Icons.arrow_back_rounded),
                            tooltip: 'Back',
                            onPressed: () {
                              if (safeIndex > 0) {
                                _previousPage(provider);
                              } else {
                                if (Navigator.canPop(context)) {
                                  Navigator.pop(context);
                                } else {
                                  Navigator.pushReplacementNamed(context, AppRoutes.mainShell);
                                }
                              }
                            },
                          ),
                          const SizedBox(width: 4),
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
                            isWelcomeScreen
                                ? 'Host Onboarding'
                                : 'Step $currentFormStep of $totalFormSteps',
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
                            if (Navigator.canPop(context)) {
                              Navigator.pop(context);
                            } else {
                              Navigator.pushReplacementNamed(context, AppRoutes.mainShell);
                            }
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
                    end: isWelcomeScreen ? 0.0 : (currentFormStep / totalFormSteps).clamp(0.0, 1.0),
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
                                            ? (provider.isAddingSubsequentProperty || widget.isAddingNewProperty
                                                ? 'Submit for Property Application'
                                                : 'Apply for Host Application') 
                                            : 'Next', 
                                    style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.bold),
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

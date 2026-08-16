import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../providers/host_onboarding_provider.dart';
import '../../../theme/app_colors.dart';
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
      ]);
    }

    base.add(const PropertyReviewAndSubmitScreen());

    if (!widget.isAddingNewProperty) {
      base.add(const HostVerificationScreen());
    }

    return base;
  }

  @override
  void initState() {
    super.initState();
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
      return provider.address.isNotEmpty && provider.city.isNotEmpty && provider.state.isNotEmpty;
    }
    if (currentScreen is BankDetailsScreen) {
      return provider.accountHolderName.isNotEmpty && provider.accountNumber.isNotEmpty && provider.ifscCode.isNotEmpty && provider.bankName.isNotEmpty;
    }
    return true;
  }

  Future<void> _nextPage(HostOnboardingProvider provider, List<Widget> currentScreens) async {
    if (_currentIndex < currentScreens.length) {
      if (!_validateCurrentScreen(provider, currentScreens[_currentIndex])) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please fill all required fields'),
            backgroundColor: Colors.redAccent,
          )
        );
        return;
      }
    }

    // If on review screen, attempt to submit before continuing!
    if (currentScreens[_currentIndex] is PropertyReviewAndSubmitScreen) {
      // Show loading snackbar or just rely on the button turning into a spinner
      final success = await provider.submitProperty();
      if (!success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Submission failed. Please try again.')),
          );
        }
        return; // Stop here, do not go to Verification screen
      }
    }

    // If on verification screen and not approved, block them.
    if (_currentIndex < currentScreens.length && currentScreens[_currentIndex] is HostVerificationScreen && !provider.isVerificationApproved) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Verification is pending approval from the admin panel.'),
          backgroundColor: Colors.redAccent,
        )
      );
      return;
    }

    if (_currentIndex < currentScreens.length - 1) {
      setState(() {
        _currentIndex++;
      });
    } else {
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
  }

  void _previousPage() {
    if (_currentIndex > 0) {
      setState(() {
        _currentIndex--;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<HostOnboardingProvider>(
      builder: (context, provider, child) {
        final currentScreens = _getScreens(provider);
        // Check if NEXT is disabled
        bool isNextDisabled = (_currentIndex < currentScreens.length && currentScreens[_currentIndex] is HostVerificationScreen && !provider.isVerificationApproved);

        bool isWelcomeScreen = _currentIndex < currentScreens.length && currentScreens[_currentIndex] is HostWelcomeScreen;

        return Scaffold(
          backgroundColor: Colors.white,
          body: SafeArea(
            child: Column(
              children: [
                TweenAnimationBuilder<double>(
                  duration: const Duration(milliseconds: 300),
                  tween: Tween<double>(
                    begin: 0,
                    end: currentScreens.isEmpty ? 0 : (_currentIndex + 1) / currentScreens.length,
                  ),
                  builder: (context, value, child) {
                    return LinearProgressIndicator(
                      value: value,
                      backgroundColor: Colors.grey[200],
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                      minHeight: 6,
                    );
                  },
                ).animate().fadeIn(duration: 600.ms),
                Expanded(
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 400),
                    transitionBuilder: (Widget child, Animation<double> animation) {
                      return FadeTransition(
                        opacity: animation,
                        child: SlideTransition(
                          position: Tween<Offset>(
                            begin: const Offset(0.05, 0),
                            end: Offset.zero,
                          ).animate(animation),
                          child: child,
                        ),
                      );
                    },
                    child: KeyedSubtree(
                      key: ValueKey<int>(_currentIndex),
                      child: currentScreens.isNotEmpty
                          ? currentScreens[_currentIndex]
                          : const SizedBox.shrink(),
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
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, -5),
                        )
                      ],
                    ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Back Button
                    if (_currentIndex > 0 && !isWelcomeScreen)
                      TextButton(
                        onPressed: _previousPage,
                        child: const Text('Back', style: TextStyle(fontSize: 16, color: Colors.grey, fontWeight: FontWeight.bold)),
                      ),
                    
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
                          minimumSize: const Size(120, 48), // Override global infinite width
                        ),
                        child: provider.isUploading 
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text(
                              _currentIndex == currentScreens.length - 2 
                                  ? 'Submit' 
                                  : _currentIndex == currentScreens.length - 1 
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
        );
      }
    );
  }
}

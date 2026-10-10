import 'package:flutter/material.dart';
import 'onboarding/host_onboarding_screen.dart';

class AddListingWizard extends StatelessWidget {
  const AddListingWizard({super.key});
  @override
  Widget build(BuildContext context) => const HostOnboardingScreen(isAddingNewProperty: true);
}

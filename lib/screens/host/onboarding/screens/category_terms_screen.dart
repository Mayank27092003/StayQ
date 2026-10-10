import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../providers/host_onboarding_provider.dart';

class CategoryTermsScreen extends StatelessWidget {
  const CategoryTermsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final p = context.watch<HostOnboardingProvider>();
    final dorm = p.propertyType == 'HOSTEL' || p.propertyType == 'DORM';
    Widget number(String label, num? initial, void Function(double) change) => TextFormField(
      initialValue: initial?.toString() ?? '', keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: InputDecoration(labelText: label), onChanged: (text) {
        final value = double.tryParse(text); if (value == null || !value.isFinite || value < 0) return;
        change(value); p.notifyListeners();
      });
    return ListView(padding: const EdgeInsets.all(24), children: [
      Text(dorm ? 'Dorm setup' : 'Lease terms', style: Theme.of(context).textTheme.headlineSmall),
      const SizedBox(height: 20),
      if (dorm) ...[
        number('Beds available', p.bedCount, (v) => p.bedCount = v.toInt()),
        DropdownButtonFormField<String>(initialValue: p.dormType, decoration: const InputDecoration(labelText: 'Dorm type'),
          items: ['Mixed', 'Female-only', 'Male-only'].map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
          onChanged: (v) { if (v != null) { p.dormType = v; p.notifyListeners(); } }),
        SwitchListTile(title: const Text('Individual lockers'), value: p.hasLocker,
          onChanged: (v) { p.hasLocker = v; p.notifyListeners(); }),
      ] else ...[
        number('Monthly rent (₹)', p.monthlyRent, (v) => p.monthlyRent = v),
        number('Security deposit (₹)', p.securityDeposit, (v) => p.securityDeposit = v),
        number('Lease duration (months)', p.leaseDurationMonths, (v) => p.leaseDurationMonths = v.toInt()),
      ],
    ]);
  }
}

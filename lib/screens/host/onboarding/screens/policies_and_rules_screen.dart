import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';

class PoliciesAndRulesScreen extends StatefulWidget {
  const PoliciesAndRulesScreen({Key? key}) : super(key: key);

  @override
  State<PoliciesAndRulesScreen> createState() => _PoliciesAndRulesScreenState();
}

class _PoliciesAndRulesScreenState extends State<PoliciesAndRulesScreen> {
  late TextEditingController _rulesController;
  late TextEditingController _quietHoursController;
  late TextEditingController _depositController;

  final List<Map<String, dynamic>> _cancellationTiers = [
    {
      'title': 'Flexible',
      'tag': 'RECOMMENDED',
      'icon': Icons.bolt_rounded,
      'refund': '100% Full Refund',
      'desc': 'Full refund up to 24 hours before check-in. Boosts booking conversion by ~35%.',
    },
    {
      'title': 'Moderate',
      'tag': 'BALANCED',
      'icon': Icons.shield_outlined,
      'refund': '100% Refund (5 Days)',
      'desc': 'Full refund up to 5 days before check-in, 50% refund thereafter minus service fee.',
    },
    {
      'title': 'Strict',
      'tag': 'PROTECTED',
      'icon': Icons.lock_clock_outlined,
      'refund': '50% Refund (7 Days)',
      'desc': '50% refund up to 7 days before check-in. Zero refund within 7 days of arrival.',
    },
    {
      'title': 'Super Strict',
      'tag': 'NON-REFUNDABLE',
      'icon': Icons.gavel_rounded,
      'refund': 'No Refund (14 Days)',
      'desc': 'Non-refundable within 14 days of check-in. Recommended for high-season villas.',
    },
  ];

  final List<String> _quickRulePills = [
    'No outdoor shoes inside 👟',
    'Turn off AC & geyser when leaving 🔌',
    'No loud music after 10 PM 🎵',
    'Keep main gate locked at night 🔒',
    'No smoking inside rooms 🚭',
    'Dispose garbage in bins 🗑️',
    'No food or drinks on bed 🥤',
    'Respect neighborhood serenity 🤫',
  ];

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    _rulesController = TextEditingController(text: provider.houseRules);
    _quietHoursController = TextEditingController(
      text: provider.quietHoursText.isNotEmpty ? provider.quietHoursText : '10:00 PM – 07:00 AM',
    );
    _depositController = TextEditingController(
      text: provider.securityDepositAmount > 0 ? provider.securityDepositAmount.toInt().toString() : '2000',
    );

    _rulesController.addListener(_updateRules);
    _quietHoursController.addListener(_updateQuietHours);
    _depositController.addListener(_updateDeposit);
  }

  void _updateRules() {
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    provider.updatePolicies(rules: _rulesController.text);
  }

  void _updateQuietHours() {
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    provider.updatePolicies(quietHoursText: _quietHoursController.text);
  }

  void _updateDeposit() {
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    final amt = double.tryParse(_depositController.text) ?? 0.0;
    provider.updatePolicies(securityDepositAmount: amt);
  }

  void _addQuickRule(String pill) {
    AppMotion.tapSelection();
    final current = _rulesController.text.trim();
    if (current.contains(pill)) return;

    if (current.isEmpty) {
      _rulesController.text = '• $pill';
    } else {
      _rulesController.text = '$current\n• $pill';
    }
  }

  @override
  void dispose() {
    _rulesController.dispose();
    _quietHoursController.dispose();
    _depositController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<HostOnboardingProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Policies & House Rules',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 6),
          const Text(
            'Configure cancellation flexibility, standard guest expectations, and security deposit.',
            style: TextStyle(fontSize: 13.5, color: AppColors.textSecondary),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 24),

          // ══════════════════════════════════════════════════════════════
          // SECTION 0: GUEST CHECK-IN METHOD
          // ══════════════════════════════════════════════════════════════
          const Text(
            'Guest Check-in Method',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 4),
          const Text(
            'How will guests access the property upon arrival?',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              _buildCheckInCard(
                provider,
                type: 'SELF_CHECKIN',
                icon: Icons.key_rounded,
                title: 'Self Check-in',
                subtitle: 'Smart lock / Lockbox',
                isDark: isDark,
              ),
              const SizedBox(width: 10),
              _buildCheckInCard(
                provider,
                type: 'HOST_GREETING',
                icon: Icons.waving_hand_rounded,
                title: 'Host In-Person',
                subtitle: 'Host / Co-Host greets',
                isDark: isDark,
              ),
              const SizedBox(width: 10),
              _buildCheckInCard(
                provider,
                type: 'CARETAKER',
                icon: Icons.person_pin_rounded,
                title: 'Caretaker',
                subtitle: 'On-site staff manages',
                isDark: isDark,
              ),
            ],
          ),

          const SizedBox(height: 32),

          // ══════════════════════════════════════════════════════════════
          // SECTION 1: CANCELLATION POLICY CARDS
          // ══════════════════════════════════════════════════════════════
          const Text(
            'Cancellation Policy',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 4),
          const Text(
            'Choose terms that align with your hosting style and seasonal demand:',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),

          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _cancellationTiers.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final tier = _cancellationTiers[index];
              final isSelected = provider.cancellationPolicy.toLowerCase() == tier['title'].toString().toLowerCase();

              return BouncingWidget(
                onTap: () {
                  AppMotion.tapSelection();
                  provider.updatePolicies(cancellation: tier['title']);
                },
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? (isDark ? const Color(0xFF261842) : const Color(0xFFFAF5FF))
                        : (isDark ? const Color(0xFF1E1C2A) : Colors.white),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isSelected ? AppColors.primary : (isDark ? Colors.white12 : AppColors.borderLight),
                      width: isSelected ? 2 : 1,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.12),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            )
                          ]
                        : null,
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary
                              : (isDark ? Colors.white10 : AppColors.surfaceLight),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          tier['icon'] as IconData,
                          color: isSelected ? Colors.white : AppColors.textSecondary,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  tier['title'] as String,
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w900,
                                    color: isSelected ? AppColors.primary : AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? AppColors.primary.withValues(alpha: 0.15)
                                        : (isDark ? Colors.white10 : const Color(0xFFF1F5F9)),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    tier['tag'] as String,
                                    style: TextStyle(
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w800,
                                      color: isSelected ? AppColors.primary : AppColors.textSecondary,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              tier['refund'] as String,
                              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              tier['desc'] as String,
                              style: const TextStyle(fontSize: 11.5, color: AppColors.textSecondary, height: 1.3),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        isSelected ? Icons.check_circle_rounded : Icons.radio_button_off_rounded,
                        color: isSelected ? AppColors.primary : AppColors.textSecondary.withValues(alpha: 0.5),
                        size: 22,
                      ),
                    ],
                  ),
                ),
              );
            },
          ).animate().fadeIn(delay: 150.ms),

          const SizedBox(height: 32),

          // ══════════════════════════════════════════════════════════════
          // SECTION 2: 10 INTERACTIVE HOUSE RULE CARDS
          // ══════════════════════════════════════════════════════════════
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '10 House Rule Policies',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Standards',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Guests must agree to these terms before confirming reservations:',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 14),

          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                // 1. Pets Policy
                _buildRuleSwitchRow(
                  icon: '🐾',
                  title: 'Pets & Animals Allowed',
                  subtitle: 'Guests may bring domestic pets to the property.',
                  value: provider.petsAllowed,
                  onChanged: (val) => provider.updatePolicies(pets: val),
                ),
                const Divider(height: 1),

                // 2. Smoking Policy
                _buildRuleSwitchRow(
                  icon: '🚭',
                  title: 'Smoking Allowed Indoors',
                  subtitle: 'Allow smoking inside rooms & common areas.',
                  value: provider.smokingAllowed,
                  onChanged: (val) => provider.updatePolicies(smoking: val),
                ),
                const Divider(height: 1),

                // 3. Parties & Events
                _buildRuleSwitchRow(
                  icon: '🎉',
                  title: 'Parties & Events Allowed',
                  subtitle: 'Permit music gatherings, celebrations or bachelorettes.',
                  value: provider.partiesAllowed,
                  onChanged: (val) => provider.updatePolicies(parties: val),
                ),
                const Divider(height: 1),

                // 4. Quiet Hours
                _buildRuleSwitchRow(
                  icon: '🌙',
                  title: 'Quiet Hours Enforcement',
                  subtitle: provider.quietHoursEnabled
                      ? 'Noise reduction enforced (${_quietHoursController.text})'
                      : 'No strict quiet hours policy set.',
                  value: provider.quietHoursEnabled,
                  onChanged: (val) => provider.updatePolicies(quietHoursEnabled: val),
                  extraWidget: provider.quietHoursEnabled
                      ? Padding(
                          padding: const EdgeInsets.only(top: 8, bottom: 4),
                          child: Row(
                            children: [
                              const Text('Hours: ', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                              Expanded(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isDark ? Colors.black26 : AppColors.surfaceLight,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: AppColors.borderLight),
                                  ),
                                  child: TextField(
                                    controller: _quietHoursController,
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                                    decoration: const InputDecoration(
                                      isDense: true,
                                      border: InputBorder.none,
                                      contentPadding: EdgeInsets.zero,
                                      hintText: 'e.g. 10:00 PM – 07:00 AM',
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )
                      : null,
                ),
                const Divider(height: 1),

                // 5. Mandatory Government ID
                _buildRuleSwitchRow(
                  icon: '🪪',
                  title: 'Government ID Mandatory',
                  subtitle: 'Every adult guest must present physical Govt ID at check-in.',
                  value: provider.govtIdRequired,
                  onChanged: (val) => provider.updatePolicies(govtIdRequired: val),
                ),
                const Divider(height: 1),

                // 6. Unregistered Outside Visitors
                _buildRuleSwitchRow(
                  icon: '👥',
                  title: 'Outside Day Visitors Allowed',
                  subtitle: 'Non-staying outside guests may visit the property.',
                  value: provider.unregisteredGuestsAllowed,
                  onChanged: (val) => provider.updatePolicies(unregisteredGuestsAllowed: val),
                ),
                const Divider(height: 1),

                // 7. Pool Usage & Rules
                _buildRuleSwitchRow(
                  icon: '🏊',
                  title: 'Swimming Pool Access Rules',
                  subtitle: 'Pool access permitted with standard swimwear and timings.',
                  value: provider.poolRulesEnabled,
                  onChanged: (val) => provider.updatePolicies(poolRulesEnabled: val),
                ),
                const Divider(height: 1),

                // 8. Kitchen & Cooking Guidelines
                _buildRuleSwitchRow(
                  icon: '🍳',
                  title: 'Guest Kitchen Access',
                  subtitle: 'Guests may cook meals and use kitchen amenities.',
                  value: provider.kitchenUsageAllowed,
                  onChanged: (val) => provider.updatePolicies(kitchenUsageAllowed: val),
                ),
                const Divider(height: 1),

                // 9. Child & Infant Friendly
                _buildRuleSwitchRow(
                  icon: '👶',
                  title: 'Child & Infant Friendly',
                  subtitle: 'Property is safe and suitable for children & infants.',
                  value: provider.childFriendly,
                  onChanged: (val) => provider.updatePolicies(childFriendly: val),
                ),
                const Divider(height: 1),

                // 10. Commercial Shoots / Filmography
                _buildRuleSwitchRow(
                  icon: '📸',
                  title: 'Commercial Shoots & Videography',
                  subtitle: 'Allow photography productions, vlogs, and pre-wedding shoots.',
                  value: provider.commercialShootsAllowed,
                  onChanged: (val) => provider.updatePolicies(commercialShootsAllowed: val),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 250.ms),

          const SizedBox(height: 28),

          // ══════════════════════════════════════════════════════════════
          // SECTION 3: REFUNDABLE SECURITY DEPOSIT
          // ══════════════════════════════════════════════════════════════
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: provider.securityDepositEnabled
                    ? AppColors.primary.withValues(alpha: 0.4)
                    : (isDark ? Colors.white12 : AppColors.borderLight),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: provider.securityDepositEnabled
                            ? AppColors.primary
                            : (isDark ? Colors.white10 : AppColors.surfaceLight),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.account_balance_wallet_outlined,
                        color: provider.securityDepositEnabled ? Colors.white : AppColors.textSecondary,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'Refundable Security Deposit',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Collected upon check-in and 100% refunded after checkout inspection.',
                            style: TextStyle(fontSize: 11.5, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: provider.securityDepositEnabled,
                      activeColor: AppColors.primary,
                      onChanged: (val) => provider.updatePolicies(securityDepositEnabled: val),
                    ),
                  ],
                ),
                if (provider.securityDepositEnabled) ...[
                  const Divider(height: 24),
                  Row(
                    children: [
                      const Text(
                        'Deposit Amount: ',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                      ),
                      const Spacer(),
                      Container(
                        width: 140,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isDark ? Colors.black26 : AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          children: [
                            const Text('₹', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.primary)),
                            const SizedBox(width: 6),
                            Expanded(
                              child: TextField(
                                controller: _depositController,
                                keyboardType: TextInputType.number,
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                                decoration: const InputDecoration(
                                  isDense: true,
                                  border: InputBorder.none,
                                  contentPadding: EdgeInsets.zero,
                                  hintText: '2000',
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ).animate().fadeIn(delay: 300.ms),

          const SizedBox(height: 28),

          // ══════════════════════════════════════════════════════════════
          // SECTION 4: CUSTOM HOUSE RULES & QUICK PILLS
          // ══════════════════════════════════════════════════════════════
          const Text(
            'Custom Rules & Special Instructions',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 4),
          const Text(
            'Add property-specific instructions or tap quick recommendations below:',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),

          // Quick Pills
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _quickRulePills.map((pill) {
              return InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: () => _addQuickRule(pill),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF261842) : AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.add, size: 14, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Text(
                        pill,
                        style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppColors.primary),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 14),

          // Custom House Rules Text Area
          Container(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
            ),
            child: TextField(
              controller: _rulesController,
              maxLines: 5,
              style: const TextStyle(fontSize: 14, color: AppColors.textPrimary, height: 1.4),
              decoration: const InputDecoration(
                hintText: 'e.g. • Please wash dishes after using the kitchen\n• Switch off AC when going to the beach...',
                hintStyle: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                border: InputBorder.none,
                contentPadding: EdgeInsets.all(16),
              ),
            ),
          ).animate().fadeIn(delay: 350.ms),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildCheckInCard(
    HostOnboardingProvider provider, {
    required String type,
    required IconData icon,
    required String title,
    required String subtitle,
    required bool isDark,
  }) {
    final isSelected = provider.checkInType == type;

    return Expanded(
      child: BouncingWidget(
        onTap: () {
          AppMotion.tapSelection();
          provider.updatePropertyDocuments(checkIn: type);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.primary.withValues(alpha: 0.12)
                : (isDark ? const Color(0xFF1E1C2A) : Colors.white),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? AppColors.primary : (isDark ? Colors.white12 : AppColors.borderLight),
              width: isSelected ? 2 : 1,
            ),
            boxShadow: isSelected
                ? [BoxShadow(color: AppColors.primary.withValues(alpha: 0.15), blurRadius: 10, offset: const Offset(0, 4))]
                : [],
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? AppColors.primary : AppColors.textSecondary, size: 22),
              const SizedBox(height: 6),
              Text(
                title,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                  color: isSelected ? AppColors.primary : AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(fontSize: 9, color: AppColors.textSecondary),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRuleSwitchRow({
    required String icon,
    required String title,
    required String subtitle,
    required bool value,
    required Function(bool) onChanged,
    Widget? extraWidget,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(icon, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 11.5, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              Switch(
                value: value,
                activeColor: AppColors.primary,
                onChanged: (val) {
                  AppMotion.tapLight();
                  onChanged(val);
                },
              ),
            ],
          ),
          if (extraWidget != null) extraWidget,
        ],
      ),
    );
  }
}


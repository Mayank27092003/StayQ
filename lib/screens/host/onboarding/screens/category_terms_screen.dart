import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';

class CategoryTermsScreen extends StatelessWidget {
  const CategoryTermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.watch<HostOnboardingProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dorm = p.propertyType == 'HOSTEL' || p.propertyType == 'DORM';

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF12111A) : Colors.white,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    dorm ? Icons.single_bed_rounded : Icons.real_estate_agent_rounded,
                    color: AppColors.primary,
                    size: 26,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        dorm ? 'Dorm & Bed Setup' : 'Long-Term Lease Terms',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white : AppColors.textPrimary,
                          letterSpacing: -0.4,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        dorm
                            ? 'Configure capacity, gender preferences, and shared locker facilities.'
                            : 'Set monthly rent, security deposit, and lease duration.',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? Colors.white60 : AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            if (dorm) ...[
              // Beds available
              Text(
                'Total Beds Available',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${p.bedCount} ${p.bedCount == 1 ? "Bed" : "Beds"}',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppColors.textPrimary,
                      ),
                    ),
                    Row(
                      children: [
                        IconButton(
                          onPressed: p.bedCount > 1
                              ? () {
                                  p.bedCount--;
                                  p.notifyListeners();
                                }
                              : null,
                          icon: const Icon(Icons.remove_circle_outline_rounded),
                          color: AppColors.primary,
                        ),
                        IconButton(
                          onPressed: () {
                            p.bedCount++;
                            p.notifyListeners();
                          },
                          icon: const Icon(Icons.add_circle_outline_rounded),
                          color: AppColors.primary,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Gender / Dorm Type Selection
              Text(
                'Dorm Gender Policy',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Specify whether this shared space welcomes all genders or is exclusive:',
                style: TextStyle(fontSize: 11.5, color: isDark ? Colors.white60 : AppColors.textSecondary),
              ),
              const SizedBox(height: 12),

              ...[
                {
                  'key': 'Mixed',
                  'title': 'Mixed Dorm (Co-ed)',
                  'subtitle': 'Open to all travelers regardless of gender identity',
                  'icon': Icons.group_rounded,
                  'badge': 'Most Popular',
                  'emoji': '👥',
                },
                {
                  'key': 'Female-only',
                  'title': 'Female-Only Dorm',
                  'subtitle': 'Exclusive safe-haven for solo women travelers',
                  'icon': Icons.female_rounded,
                  'badge': 'High Demand',
                  'emoji': '👩',
                },
                {
                  'key': 'Male-only',
                  'title': 'Male-Only Dorm',
                  'subtitle': 'Dedicated room for male backpackers and groups',
                  'icon': Icons.male_rounded,
                  'badge': 'Standard',
                  'emoji': '👨',
                },
              ].map((opt) {
                final isSelected = p.dormType == opt['key'];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: BouncingWidget(
                    onTap: () {
                      AppMotion.tapSelection();
                      p.dormType = opt['key'] as String;
                      p.notifyListeners();
                    },
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.primary.withValues(alpha: isDark ? 0.2 : 0.08)
                            : (isDark ? const Color(0xFF1E1C2A) : Colors.white),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected ? AppColors.primary : (isDark ? Colors.white12 : AppColors.borderLight),
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: isSelected ? AppColors.primary : Colors.grey.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(opt['emoji'] as String, style: const TextStyle(fontSize: 20)),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      opt['title'] as String,
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? Colors.white : AppColors.textPrimary,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: isSelected
                                            ? AppColors.primary.withValues(alpha: 0.2)
                                            : Colors.grey.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        opt['badge'] as String,
                                        style: TextStyle(
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.bold,
                                          color: isSelected ? AppColors.primary : AppColors.textSecondary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  opt['subtitle'] as String,
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark ? Colors.white60 : AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (isSelected)
                            const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 22)
                          else
                            Icon(Icons.radio_button_off_rounded, color: isDark ? Colors.white24 : Colors.grey.shade400, size: 20),
                        ],
                      ),
                    ),
                  ),
                );
              }),

              const SizedBox(height: 16),

              // Individual Lockers
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
                ),
                child: SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  secondary: const Icon(Icons.lock_outline_rounded, color: AppColors.primary),
                  title: Text(
                    'Individual Guest Lockers',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : AppColors.textPrimary,
                    ),
                  ),
                  subtitle: Text(
                    'Secure personal storage space for backpackers and valuables',
                    style: TextStyle(fontSize: 11, color: isDark ? Colors.white60 : AppColors.textSecondary),
                  ),
                  value: p.hasLocker,
                  activeThumbColor: AppColors.primary,
                  onChanged: (v) {
                    p.hasLocker = v;
                    p.notifyListeners();
                  },
                ),
              ),
            ] else ...[
              // Long term lease setup
              _buildNumberField(
                label: 'Monthly Rent (₹)',
                initial: p.monthlyRent,
                icon: Icons.currency_rupee_rounded,
                isDark: isDark,
                onChanged: (v) => p.monthlyRent = v,
              ),
              const SizedBox(height: 16),
              _buildNumberField(
                label: 'Security Deposit (₹)',
                initial: p.securityDeposit,
                icon: Icons.shield_outlined,
                isDark: isDark,
                onChanged: (v) => p.securityDeposit = v,
              ),
              const SizedBox(height: 16),
              _buildNumberField(
                label: 'Lease Duration (Months)',
                initial: p.leaseDurationMonths.toDouble(),
                icon: Icons.calendar_today_rounded,
                isDark: isDark,
                onChanged: (v) => p.leaseDurationMonths = v.toInt(),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildNumberField({
    required String label,
    required num? initial,
    required IconData icon,
    required bool isDark,
    required void Function(double) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
          ),
          child: TextFormField(
            initialValue: initial?.toString() ?? '',
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : AppColors.textPrimary,
            ),
            decoration: InputDecoration(
              prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
            onChanged: (text) {
              final value = double.tryParse(text);
              if (value != null && value.isFinite && value >= 0) {
                onChanged(value);
              }
            },
          ),
        ),
      ],
    );
  }
}

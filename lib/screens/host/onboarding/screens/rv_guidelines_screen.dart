import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';

class RvGuidelinesScreen extends StatefulWidget {
  const RvGuidelinesScreen({Key? key}) : super(key: key);

  @override
  State<RvGuidelinesScreen> createState() => _RvGuidelinesScreenState();
}

class _RvGuidelinesScreenState extends State<RvGuidelinesScreen> {
  late HostOnboardingProvider _provider;

  int _minDriverAge = 23;
  int _minLicenseTenureYears = 2;
  String _offRoadPolicy = 'Mild Gravel Permitted'; // Paved Only, Mild Gravel Permitted, 4x4 Trails Allowed
  String _nightDrivingPolicy = 'Restricted after 8 PM'; // Permitted, Restricted after 8 PM, Prohibited
  bool _speedLimiterEquipped = true;
  bool _gpsTrackerEquipped = true;
  bool _fullToFullFuel = true;

  final List<String> _terrainOptions = [
    'Paved Highways Only',
    'Mild Gravel Permitted',
    '4x4 Off-Road Trails Allowed',
  ];

  final List<String> _nightOptions = [
    'Night Driving Permitted',
    'Restricted after 8 PM',
    'Daylight Hours Only',
  ];

  @override
  void initState() {
    super.initState();
    _provider = context.read<HostOnboardingProvider>();
    final details = _provider.rvDetails;

    if (details['minDriverAge'] != null) {
      _minDriverAge = int.tryParse(details['minDriverAge'].toString()) ?? _minDriverAge;
    }
    if (details['minLicenseTenureYears'] != null) {
      _minLicenseTenureYears = int.tryParse(details['minLicenseTenureYears'].toString()) ?? _minLicenseTenureYears;
    }
    if (details['offRoadPolicy'] is String && (details['offRoadPolicy'] as String).isNotEmpty) {
      _offRoadPolicy = details['offRoadPolicy'].toString();
    }
    if (details['nightDrivingPolicy'] is String && (details['nightDrivingPolicy'] as String).isNotEmpty) {
      _nightDrivingPolicy = details['nightDrivingPolicy'].toString();
    }
    if (details['speedLimiterEquipped'] != null) {
      _speedLimiterEquipped = details['speedLimiterEquipped'] == true;
    }
    if (details['gpsTrackerEquipped'] != null) {
      _gpsTrackerEquipped = details['gpsTrackerEquipped'] == true;
    }
    if (details['fullToFullFuel'] != null) {
      _fullToFullFuel = details['fullToFullFuel'] == true;
    }
  }

  void _sync() {
    if (!mounted) return;
    _provider.rvDetails = {
      ..._provider.rvDetails,
      'minDriverAge': _minDriverAge,
      'minLicenseTenureYears': _minLicenseTenureYears,
      'offRoadPolicy': _offRoadPolicy,
      'nightDrivingPolicy': _nightDrivingPolicy,
      'speedLimiterEquipped': _speedLimiterEquipped,
      'gpsTrackerEquipped': _gpsTrackerEquipped,
      'fullToFullFuel': _fullToFullFuel,
    };
    _provider.notifyListeners();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step pill badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              'RV SETUP • PAGE 4 OF 4',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: AppColors.primary,
                letterSpacing: 0.8,
              ),
            ),
          ).animate().fadeIn(),
          const SizedBox(height: 8),

          const Text(
            'Driving Rules & Safety Protocols',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn(delay: 50.ms).slideX(),
          const SizedBox(height: 6),
          const Text(
            'Define driver eligibility, speed regulations, and terrain rules for vehicle protection.',
            style: TextStyle(fontSize: 13.5, color: AppColors.textSecondary, height: 1.4),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 24),

          // 1. Driver Eligibility Card
          _buildCard(
            isDark: isDark,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.badge_rounded, color: AppColors.primary, size: 20),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Driver Eligibility Requirements',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Min Driver Age
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Minimum Driver Age', style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700)),
                    Row(
                      children: [
                        _buildStepperBtn(
                          icon: Icons.remove,
                          onTap: _minDriverAge > 20
                              ? () {
                                  setState(() => _minDriverAge--);
                                  _sync();
                                }
                              : null,
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            '$_minDriverAge Years',
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppColors.primary),
                          ),
                        ),
                        _buildStepperBtn(
                          icon: Icons.add,
                          onTap: _minDriverAge < 30
                              ? () {
                                  setState(() => _minDriverAge++);
                                  _sync();
                                }
                              : null,
                        ),
                      ],
                    ),
                  ],
                ),
                const Divider(height: 24),

                // Driving License Tenure
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Min License Tenure', style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700)),
                    Row(
                      children: [
                        _buildStepperBtn(
                          icon: Icons.remove,
                          onTap: _minLicenseTenureYears > 1
                              ? () {
                                  setState(() => _minLicenseTenureYears--);
                                  _sync();
                                }
                              : null,
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            '$_minLicenseTenureYears Yrs DL',
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppColors.primary),
                          ),
                        ),
                        _buildStepperBtn(
                          icon: Icons.add,
                          onTap: _minLicenseTenureYears < 5
                              ? () {
                                  setState(() => _minLicenseTenureYears++);
                                  _sync();
                                }
                              : null,
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 2. Terrain & Off-Road Policy
          const Text(
            'Terrain & Road Policy *',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Column(
            children: _terrainOptions.map((opt) {
              final isSel = _offRoadPolicy == opt;
              return BouncingWidget(
                onTap: () {
                  AppMotion.tapSelection();
                  setState(() => _offRoadPolicy = opt);
                  _sync();
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isSel ? AppColors.primary.withValues(alpha: 0.08) : (isDark ? const Color(0xFF1E1C2A) : Colors.white),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSel ? AppColors.primary : (isDark ? Colors.white12 : AppColors.borderLight),
                      width: isSel ? 1.6 : 1.0,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        isSel ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                        color: isSel ? AppColors.primary : AppColors.textSecondary,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          opt,
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                            color: isSel ? AppColors.primary : AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          // 3. Night Driving Policy
          const Text(
            'Night Driving Policy *',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Column(
            children: _nightOptions.map((opt) {
              final isSel = _nightDrivingPolicy == opt;
              return BouncingWidget(
                onTap: () {
                  AppMotion.tapSelection();
                  setState(() => _nightDrivingPolicy = opt);
                  _sync();
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isSel ? AppColors.primary.withValues(alpha: 0.08) : (isDark ? const Color(0xFF1E1C2A) : Colors.white),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSel ? AppColors.primary : (isDark ? Colors.white12 : AppColors.borderLight),
                      width: isSel ? 1.6 : 1.0,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        isSel ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                        color: isSel ? AppColors.primary : AppColors.textSecondary,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          opt,
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: isSel ? FontWeight.w800 : FontWeight.w600,
                            color: isSel ? AppColors.primary : AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          // 4. Vehicle Safety & Governance Switches
          _buildCard(
            isDark: isDark,
            child: Column(
              children: [
                _buildSwitchTile(
                  title: 'Speed Governor / 80 km/h Limiter',
                  subtitle: 'Mandatory RTO commercial speed limiter equipped',
                  value: _speedLimiterEquipped,
                  onChanged: (v) {
                    setState(() => _speedLimiterEquipped = v);
                    _sync();
                  },
                ),
                const Divider(height: 16),
                _buildSwitchTile(
                  title: 'Live GPS Telematics Tracker',
                  subtitle: 'Real-time rig tracking enabled for guest safety & breakdown assistance',
                  value: _gpsTrackerEquipped,
                  onChanged: (v) {
                    setState(() => _gpsTrackerEquipped = v);
                    _sync();
                  },
                ),
                const Divider(height: 16),
                _buildSwitchTile(
                  title: 'Full-to-Full Fuel Policy',
                  subtitle: 'Vehicle delivered with full tank, returned with full tank',
                  value: _fullToFullFuel,
                  onChanged: (v) {
                    setState(() => _fullToFullFuel = v);
                    _sync();
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildCard({required Widget child, required bool isDark}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
      ),
      child: child,
    );
  }

  Widget _buildStepperBtn({required IconData icon, VoidCallback? onTap}) {
    return BouncingWidget(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: onTap != null ? AppColors.primary.withValues(alpha: 0.12) : Colors.grey.withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 16, color: onTap != null ? AppColors.primary : Colors.grey),
      ),
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
              const SizedBox(height: 2),
              Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            ],
          ),
        ),
        Switch.adaptive(
          value: value,
          activeColor: AppColors.primary,
          onChanged: (v) {
            AppMotion.tapSelection();
            onChanged(v);
          },
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';

class AvailabilitySetupScreen extends StatefulWidget {
  const AvailabilitySetupScreen({Key? key}) : super(key: key);

  @override
  State<AvailabilitySetupScreen> createState() => _AvailabilitySetupScreenState();
}

class _AvailabilitySetupScreenState extends State<AvailabilitySetupScreen> {
  late TextEditingController _checkInController;
  late TextEditingController _checkOutController;
  DateTime _currentMonth = DateTime.now();

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    _checkInController = TextEditingController(text: provider.checkInTime);
    _checkOutController = TextEditingController(text: provider.checkOutTime);

    _checkInController.addListener(_updateProvider);
    _checkOutController.addListener(_updateProvider);
  }

  void _updateProvider() {
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    provider.updateAvailability(
      checkIn: _checkInController.text,
      checkOut: _checkOutController.text,
    );
  }

  @override
  void dispose() {
    _checkInController.dispose();
    _checkOutController.dispose();
    super.dispose();
  }

  Future<void> _selectTime(BuildContext context, TextEditingController controller) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (picked != null && context.mounted) {
      final String formattedTime = '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
      controller.text = formattedTime;
    }
  }

  Widget _buildTimeField(String label, TextEditingController controller) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () => _selectTime(context, controller),
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.surfaceLight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: AbsorbPointer(
                child: TextField(
                  controller: controller,
                  readOnly: true,
                  decoration: const InputDecoration(
                    hintText: 'e.g. 14:00',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStrategyCard({
    required String title,
    required String subtitle,
    required String icon,
    required String presetKey,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withValues(alpha: 0.06) : AppColors.cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.borderLight,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary.withValues(alpha: 0.15) : AppColors.surfaceLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(icon, style: const TextStyle(fontSize: 22)),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? AppColors.primaryDark : AppColors.textPrimary,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isSelected) ...[
                        const SizedBox(width: 8),
                        const Icon(Icons.check_circle, size: 18, color: AppColors.primary),
                      ],
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<HostOnboardingProvider>(context);
    final daysInMonth = DateUtils.getDaysInMonth(_currentMonth.year, _currentMonth.month);
    final firstDayOffset = DateTime(_currentMonth.year, _currentMonth.month, 1).weekday % 7;

    int stayQDaysCount = 0;
    int blockedDaysCount = 0;
    for (int d = 1; d <= daysInMonth; d++) {
      final date = DateTime(_currentMonth.year, _currentMonth.month, d);
      final isBlocked = provider.initialBlockedDates.any(
        (b) => b.year == date.year && b.month == date.month && b.day == date.day,
      );
      if (isBlocked) {
        blockedDaysCount++;
      } else {
        stayQDaysCount++;
      }
    }

    final baseRate = provider.pricePerNight > 0 ? provider.pricePerNight : 3500.0;
    final weekendRate = baseRate * (1 + (provider.weekendSurchargePercent / 100));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Availability & Calendar',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 8),
          const Text(
            'Choose your hosting schedule. You can list all days or pick specific open and blocked dates on Stay Q.',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 24),

          const Text(
            'Hosting Strategy',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),
          _buildStrategyCard(
            title: 'Full-Time on Stay Q (All Days)',
            subtitle: 'Open 30 days/month • Maximize bookings with 0% host fee',
            icon: '⚡',
            presetKey: 'ALL_DAYS',
            isSelected: provider.availabilityScheduleType == 'ALL_DAYS',
            onTap: () => provider.setSchedulePreset('ALL_DAYS'),
          ),
          _buildStrategyCard(
            title: 'Weekends Only on Stay Q',
            subtitle: 'Friday, Saturday & Sunday open • Mon-Thu reserved/blocked',
            icon: '🏖️',
            presetKey: 'WEEKENDS_ONLY',
            isSelected: provider.availabilityScheduleType == 'WEEKENDS_ONLY',
            onTap: () => provider.setSchedulePreset('WEEKENDS_ONLY'),
          ),
          _buildStrategyCard(
            title: 'Custom Schedule Split (e.g. 10 Days)',
            subtitle: 'Pick exact custom dates on Stay Q • Keep other days reserved',
            icon: '🔀',
            presetKey: 'CUSTOM_SPLIT',
            isSelected: provider.availabilityScheduleType == 'CUSTOM_SPLIT',
            onTap: () => provider.setSchedulePreset('CUSTOM_SPLIT'),
          ),

          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: AppColors.cardBg,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.borderLight),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          DateFormat('MMMM yyyy').format(_currentMonth),
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: 2),
                        const Text(
                          'Tap dates to toggle Stay Q Open vs Blocked',
                          style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.chevron_left, size: 22),
                          onPressed: () {
                            setState(() {
                              _currentMonth = DateTime(_currentMonth.year, _currentMonth.month - 1);
                            });
                          },
                        ),
                        IconButton(
                          icon: const Icon(Icons.chevron_right, size: 22),
                          onPressed: () {
                            setState(() {
                              _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + 1);
                            });
                          },
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  alignment: WrapAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.25)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle)),
                          const SizedBox(width: 6),
                          Text('${stayQDaysCount} Days on Stay Q', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF047857))),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEF4444).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.25)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle)),
                          const SizedBox(width: 6),
                          Text('${blockedDaysCount} Days Blocked', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFB91C1C))),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: const ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                      .map((d) => SizedBox(
                            width: 32,
                            child: Text(
                              d,
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ))
                      .toList(),
                ),
                const SizedBox(height: 12),

                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 7,
                    childAspectRatio: 0.9,
                    mainAxisSpacing: 6,
                    crossAxisSpacing: 6,
                  ),
                  itemCount: daysInMonth + firstDayOffset,
                  itemBuilder: (context, index) {
                    if (index < firstDayOffset) return const SizedBox.shrink();

                    final day = index - firstDayOffset + 1;
                    final date = DateTime(_currentMonth.year, _currentMonth.month, day);
                    final isBlocked = provider.initialBlockedDates.any(
                      (b) => b.year == date.year && b.month == date.month && b.day == date.day,
                    );
                    final isWeekend = date.weekday == DateTime.friday || date.weekday == DateTime.saturday;
                    final isPast = date.isBefore(DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day));

                    return GestureDetector(
                      onTap: isPast
                          ? null
                          : () {
                              provider.toggleBlockedDate(date);
                            },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        decoration: BoxDecoration(
                          color: isPast
                              ? Colors.transparent
                              : isBlocked
                                  ? const Color(0xFFFEE2E2)
                                  : isWeekend
                                      ? const Color(0xFFEDE9FE)
                                      : const Color(0xFFD1FAE5),
                          border: Border.all(
                            color: isPast
                                ? AppColors.borderLight.withValues(alpha: 0.3)
                                : isBlocked
                                    ? const Color(0xFFEF4444)
                                    : isWeekend
                                        ? const Color(0xFF8B5CF6)
                                        : const Color(0xFF10B981),
                            width: isBlocked ? 1.5 : 1,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              '$day',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: isPast
                                    ? AppColors.textMuted.withValues(alpha: 0.4)
                                    : isBlocked
                                        ? const Color(0xFFDC2626)
                                        : AppColors.textPrimary,
                                decoration: isBlocked ? TextDecoration.lineThrough : null,
                              ),
                            ),
                            if (!isPast && !isBlocked) ...[
                              const SizedBox(height: 2),
                              Text(
                                isWeekend ? '₹${weekendRate.toInt()}' : '₹${baseRate.toInt()}',
                                style: TextStyle(
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                  color: isWeekend ? const Color(0xFF7C3AED) : const Color(0xFF059669),
                                ),
                              ),
                            ] else if (!isPast && isBlocked) ...[
                              const SizedBox(height: 2),
                              const Text(
                                'Blocked',
                                style: TextStyle(fontSize: 7, fontWeight: FontWeight.bold, color: Color(0xFFDC2626)),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),

          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.cardBg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('Weekend Price Surcharge', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                          SizedBox(height: 3),
                          Text('Extra price for Fri & Sat nights', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '+${provider.weekendSurchargePercent}%',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [0, 10, 15, 20, 25].map((pct) {
                    final isSelected = provider.weekendSurchargePercent == pct;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () => provider.updateWeekendSurcharge(pct),
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 3),
                          padding: const EdgeInsets.symmetric(vertical: 9),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.primary : AppColors.surfaceLight,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: isSelected ? AppColors.primary : AppColors.borderLight),
                          ),
                          child: Text(
                            pct == 0 ? 'None' : '+${pct}%',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.white : AppColors.textPrimary,
                            ),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1, end: 0),

          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.cardBg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text('Instant Book', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                      SizedBox(height: 3),
                      Text('Guests can book instantly without manual host review', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Switch(
                  value: provider.instantBook,
                  activeColor: AppColors.primary,
                  onChanged: (val) {
                    provider.updateAvailability(instant: val);
                  },
                ),
              ],
            ),
          ).animate().fadeIn(delay: 350.ms).slideY(begin: 0.1, end: 0),

          const SizedBox(height: 20),
          Row(
            children: [
              _buildTimeField('Check-in Time', _checkInController),
              const SizedBox(width: 16),
              _buildTimeField('Check-out Time', _checkOutController),
            ],
          ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1, end: 0),

          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.cardBg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Expanded(
                  child: Text(
                    'Minimum Stay (Nights)',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                  ),
                ),
                const SizedBox(width: 8),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      onPressed: () {
                        if (provider.minStay > 1) {
                          provider.updateAvailability(min: provider.minStay - 1);
                        }
                      },
                      icon: const Icon(Icons.remove_circle_outline, color: AppColors.primary),
                    ),
                    Text(
                      '${provider.minStay}',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    IconButton(
                      onPressed: () {
                        provider.updateAvailability(min: provider.minStay + 1);
                      },
                      icon: const Icon(Icons.add_circle_outline, color: AppColors.primary),
                    ),
                  ],
                ),
              ],
            ),
          ).animate().fadeIn(delay: 450.ms).slideY(begin: 0.1, end: 0),
        ],
      ),
    );
  }
}

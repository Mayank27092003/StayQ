import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';
import '../../widgets/custom_toast.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';

class HostAvailabilityScreen extends StatefulWidget {
  const HostAvailabilityScreen({super.key});

  @override
  State<HostAvailabilityScreen> createState() => _HostAvailabilityScreenState();
}

class _HostAvailabilityScreenState extends State<HostAvailabilityScreen> {
  DateTime _currentMonth = DateTime.now();
  final Set<DateTime> _blockedDates = {};
  String _activePreset = 'CUSTOM_SPLIT';
  int _weekendSurcharge = 15;

  @override
  void initState() {
    super.initState();
    // Pre-populate with mock or provider blocked dates
    final now = DateTime.now();
    for (int i = 10; i < 25; i++) {
      _blockedDates.add(DateTime(now.year, now.month, i));
    }
  }

  void _toggleDate(DateTime date) {
    AppMotion.tapSelection();
    final clean = DateTime(date.year, date.month, date.day);
    setState(() {
      if (_blockedDates.any((d) => d.year == clean.year && d.month == clean.month && d.day == clean.day)) {
        _blockedDates.removeWhere((d) => d.year == clean.year && d.month == clean.month && d.day == clean.day);
      } else {
        _blockedDates.add(clean);
      }
    });
  }

  void _applyPreset(String preset) {
    AppMotion.tapSelection();
    setState(() {
      _activePreset = preset;
      final now = DateTime.now();
      _blockedDates.clear();

      if (preset == 'WEEKENDS_ONLY') {
        for (int i = 0; i < 60; i++) {
          final d = now.add(Duration(days: i));
          if (d.weekday != DateTime.friday && d.weekday != DateTime.saturday && d.weekday != DateTime.sunday) {
            _blockedDates.add(DateTime(d.year, d.month, d.day));
          }
        }
      } else if (preset == 'CUSTOM_SPLIT') {
        // 10 days Open, 20 days Reserved/Blocked
        for (int i = 10; i < 30; i++) {
          final d = now.add(Duration(days: i));
          _blockedDates.add(DateTime(d.year, d.month, d.day));
        }
      }
    });
  }

  Widget _buildPresetChip(String title, String icon, String key) {
    final isSelected = _activePreset == key;
    return GestureDetector(
      onTap: () => _applyPreset(key),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.borderLight,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.25),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(icon, style: const TextStyle(fontSize: 14)),
            const SizedBox(width: 6),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.white : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final daysInMonth = DateUtils.getDaysInMonth(_currentMonth.year, _currentMonth.month);
    final firstDayOffset = DateTime(_currentMonth.year, _currentMonth.month, 1).weekday % 7;

    int stayQDaysCount = 0;
    int blockedDaysCount = 0;
    for (int d = 1; d <= daysInMonth; d++) {
      final date = DateTime(_currentMonth.year, _currentMonth.month, d);
      final isBlocked = _blockedDates.any(
        (b) => b.year == date.year && b.month == date.month && b.day == date.day,
      );
      if (isBlocked) {
        blockedDaysCount++;
      } else {
        stayQDaysCount++;
      }
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Availability & Pricing Calendar', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Strategy / Preset Chips
            const Text(
              'Quick Multi-Platform Presets',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 10),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildPresetChip('Full-Time (30 Days)', '⚡', 'ALL_DAYS'),
                  const SizedBox(width: 8),
                  _buildPresetChip('Weekends Only', '🏖️', 'WEEKENDS_ONLY'),
                  const SizedBox(width: 8),
                  _buildPresetChip('10 Days Open / 20 Days Blocked', '🔀', 'CUSTOM_SPLIT'),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Calendar Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
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
                  // Calendar Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.chevron_left_rounded),
                        onPressed: () {
                          setState(() {
                            _currentMonth = DateTime(_currentMonth.year, _currentMonth.month - 1);
                          });
                        },
                      ),
                      Text(
                        DateFormat('MMMM yyyy').format(_currentMonth),
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      IconButton(
                        icon: const Icon(Icons.chevron_right_rounded),
                        onPressed: () {
                          setState(() {
                            _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + 1);
                          });
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Counts Summary Pills
                  Row(
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
                            Text('$stayQDaysCount Days Stay Q', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF047857))),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
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
                            Text('$blockedDaysCount Days Blocked', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFB91C1C))),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Weekdays
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

                  // Days Grid
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
                      final isBlocked = _blockedDates.any(
                        (b) => b.year == date.year && b.month == date.month && b.day == date.day,
                      );
                      final isWeekend = date.weekday == DateTime.friday || date.weekday == DateTime.saturday;
                      final isPast = date.isBefore(DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day));

                      return GestureDetector(
                        onTap: isPast ? null : () => _toggleDate(date),
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
                                  isWeekend ? 'Wknd' : 'Open',
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
            ),

            const SizedBox(height: 20),

            // Weekend Surcharge Selector
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('Weekend Pricing Surcharge', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                          SizedBox(height: 2),
                          Text('Applied on Friday & Saturday nights', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '+$_weekendSurcharge%',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [0, 10, 15, 20, 25].map((pct) {
                      final isSelected = _weekendSurcharge == pct;
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _weekendSurcharge = pct;
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.primary : AppColors.surfaceLight,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: isSelected ? AppColors.primary : AppColors.borderLight),
                          ),
                          child: Text(
                            pct == 0 ? 'None' : '+$pct%',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.white : AppColors.textPrimary,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // Save Button
            BouncingWidget(
              onTap: () {
                AppMotion.tapSelection();
                context.read<AppProvider>().updateHostAvailability(_blockedDates.toList());
                CustomToast.show(context: context, message: 'Availability schedule saved & synced!', isError: false);
                Navigator.pop(context);
              },
              child: Container(
                width: double.infinity,
                height: 54,
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Center(
                  child: Text(
                    'Save & Sync Calendar',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}


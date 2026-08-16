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

  void _toggleDate(DateTime date) {
    AppMotion.tapSelection();
    setState(() {
      if (_blockedDates.contains(date)) {
        _blockedDates.remove(date);
      } else {
        _blockedDates.add(date);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final daysInMonth = DateUtils.getDaysInMonth(_currentMonth.year, _currentMonth.month);
    final firstDayOffset = DateTime(_currentMonth.year, _currentMonth.month, 1).weekday % 7;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Availability', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Block Dates',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            const Text(
              'Tap on dates to block or unblock them for guests.',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),

            // Calendar Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  DateFormat('MMMM yyyy').format(_currentMonth),
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Row(
                  children: [
                    IconButton(icon: const Icon(Icons.chevron_left), onPressed: () {
                      setState(() {
                        _currentMonth = DateTime(_currentMonth.year, _currentMonth.month - 1);
                      });
                    }),
                    IconButton(icon: const Icon(Icons.chevron_right), onPressed: () {
                      setState(() {
                        _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + 1);
                      });
                    }),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Weekdays
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: const ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                  .map((d) => Text(d, style: TextStyle(color: AppColors.textMuted, fontWeight: FontWeight.bold)))
                  .toList(),
            ),
            const SizedBox(height: 16),

            // Days Grid
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 7,
                childAspectRatio: 1,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
              ),
              itemCount: daysInMonth + firstDayOffset,
              itemBuilder: (context, index) {
                if (index < firstDayOffset) return const SizedBox.shrink();
                
                final day = index - firstDayOffset + 1;
                final date = DateTime(_currentMonth.year, _currentMonth.month, day);
                final isBlocked = _blockedDates.contains(date);
                final isPast = date.isBefore(DateTime.now().subtract(const Duration(days: 1)));

                return GestureDetector(
                  onTap: isPast ? null : () => _toggleDate(date),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    decoration: BoxDecoration(
                      color: isBlocked 
                          ? AppColors.errorRed.withValues(alpha: 0.1) 
                          : isPast ? Colors.transparent : Colors.white,
                      border: Border.all(
                        color: isBlocked 
                            ? AppColors.errorRed 
                            : isPast ? Colors.transparent : AppColors.borderLight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(
                        '$day',
                        style: TextStyle(
                          color: isPast 
                              ? AppColors.textMuted.withValues(alpha: 0.3) 
                              : isBlocked ? AppColors.errorRed : AppColors.textPrimary,
                          fontWeight: isBlocked ? FontWeight.bold : FontWeight.normal,
                          decoration: isBlocked ? TextDecoration.lineThrough : null,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),

            const SizedBox(height: 32),
            BouncingWidget(
              onTap: () {
                AppMotion.tapSelection();
                context.read<AppProvider>().updateHostAvailability(_blockedDates.toList());
                CustomToast.show(context: context, message: 'Calendar updated successfully', isError: false);
                Navigator.pop(context);
              },
              child: Container(
                width: double.infinity,
                height: 56,
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(child: Text('Save Availability', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

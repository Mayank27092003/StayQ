import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_motion.dart';

class AnimatedCalendarPicker extends StatefulWidget {
  final DateTimeRange? initialRange;
  final ValueChanged<DateTimeRange> onRangeSelected;
  final List<DateTime> blockedDates;

  const AnimatedCalendarPicker({
    super.key,
    this.initialRange,
    required this.onRangeSelected,
    this.blockedDates = const [],
  });

  @override
  State<AnimatedCalendarPicker> createState() => _AnimatedCalendarPickerState();
}

class _AnimatedCalendarPickerState extends State<AnimatedCalendarPicker> with SingleTickerProviderStateMixin {
  late DateTime _displayedMonth;
  DateTime? _startDate;
  DateTime? _endDate;
  late AnimationController _sweepController;
  late Animation<double> _sweepAnimation;

  @override
  void initState() {
    super.initState();
    _displayedMonth = DateTime.now();
    _startDate = widget.initialRange?.start ?? DateTime.now().add(const Duration(days: 3));
    _endDate = widget.initialRange?.end ?? DateTime.now().add(const Duration(days: 8));

    _sweepController = AnimationController(
      vsync: this,
      duration: AppMotion.standard,
    );
    _sweepAnimation = CurvedAnimation(
      parent: _sweepController,
      curve: AppMotion.signatureCurve,
    );

    if (_startDate != null && _endDate != null) {
      _sweepController.forward(from: 1.0);
    }
  }

  @override
  void dispose() {
    _sweepController.dispose();
    super.dispose();
  }

  void _onDayTapped(DateTime day) {
    if (widget.blockedDates.any((d) => DateUtils.isSameDay(d, day))) {
      return; // Ignore taps on blocked dates
    }
    
    AppMotion.tapSelection();
    setState(() {
      if (_startDate == null || (_startDate != null && _endDate != null)) {
        _startDate = day;
        _endDate = null;
        _sweepController.reset();
      } else if (_startDate != null && day.isBefore(_startDate!)) {
        _startDate = day;
      } else {
        // Ensure no blocked dates are between start and end
        bool hasBlockedDate = false;
        for (DateTime d = _startDate!; d.isBefore(day); d = d.add(const Duration(days: 1))) {
          if (widget.blockedDates.any((blocked) => DateUtils.isSameDay(blocked, d))) {
            hasBlockedDate = true;
            break;
          }
        }
        
        if (hasBlockedDate) {
           // Invalid range, start over
          _startDate = day;
          return;
        }

        _endDate = day;
        _sweepController.forward(from: 0.0);
        widget.onRangeSelected(DateTimeRange(start: _startDate!, end: _endDate!));
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final daysInMonth = DateUtils.getDaysInMonth(_displayedMonth.year, _displayedMonth.month);
    final firstDayOffset = DateTime(_displayedMonth.year, _displayedMonth.month, 1).weekday - 1;

    return Column(
      children: [
        // Month Navigation Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '${_getMonthName(_displayedMonth.month)} ${_displayedMonth.year}',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left_rounded),
                  onPressed: () {
                    setState(() {
                      _displayedMonth = DateTime(_displayedMonth.year, _displayedMonth.month - 1);
                    });
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right_rounded),
                  onPressed: () {
                    setState(() {
                      _displayedMonth = DateTime(_displayedMonth.year, _displayedMonth.month + 1);
                    });
                  },
                ),
              ],
            ),
          ],
        ),

        const SizedBox(height: 12),

        // Weekday Headers
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: const [
            _WeekdayLabel('M'),
            _WeekdayLabel('T'),
            _WeekdayLabel('W'),
            _WeekdayLabel('T'),
            _WeekdayLabel('F'),
            _WeekdayLabel('S'),
            _WeekdayLabel('S'),
          ],
        ),

        const SizedBox(height: 8),

        // Calendar Days Grid with Animated Range Ribbon
        AnimatedBuilder(
          animation: _sweepAnimation,
          builder: (context, child) {
            return GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: firstDayOffset + daysInMonth,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 7,
                mainAxisSpacing: 6,
                crossAxisSpacing: 0,
              ),
              itemBuilder: (context, index) {
                if (index < firstDayOffset) {
                  return const SizedBox();
                }

                final dayNumber = index - firstDayOffset + 1;
                final dayDate = DateTime(_displayedMonth.year, _displayedMonth.month, dayNumber);

                final isStart = _startDate != null && DateUtils.isSameDay(_startDate, dayDate);
                final isEnd = _endDate != null && DateUtils.isSameDay(_endDate, dayDate);
                final isInRange = _startDate != null &&
                    _endDate != null &&
                    dayDate.isAfter(_startDate!) &&
                    dayDate.isBefore(_endDate!);

                final isBlocked = widget.blockedDates.any((d) => DateUtils.isSameDay(d, dayDate));

                Color bgColor = Colors.transparent;
                BorderRadius radius = BorderRadius.circular(20);

                if (isStart) {
                  bgColor = AppColors.primary;
                  radius = const BorderRadius.horizontal(left: Radius.circular(20));
                } else if (isEnd) {
                  bgColor = AppColors.primary;
                  radius = const BorderRadius.horizontal(right: Radius.circular(20));
                } else if (isInRange) {
                  bgColor = AppColors.primary.withValues(alpha: 0.15 * _sweepAnimation.value);
                  radius = BorderRadius.zero;
                }

                return GestureDetector(
                  onTap: () => _onDayTapped(dayDate),
                  child: Container(
                    decoration: BoxDecoration(
                      color: bgColor,
                      borderRadius: radius,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '$dayNumber',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: (isStart || isEnd || isInRange) ? FontWeight.bold : FontWeight.w500,
                        color: isBlocked 
                            ? AppColors.borderLight // Grey out blocked dates
                            : (isStart || isEnd)
                                ? Colors.white
                                : (isInRange ? AppColors.primary : AppColors.textPrimary),
                        decoration: isBlocked ? TextDecoration.lineThrough : null,
                      ),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ],
    );
  }

  String _getMonthName(int month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  }
}

class _WeekdayLabel extends StatelessWidget {
  final String text;

  const _WeekdayLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 32,
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textMuted),
      ),
    );
  }
}

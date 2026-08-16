import 'package:flutter/material.dart';
import '../theme/app_motion.dart';

enum StaggerDirection { bottomToTop, leftToRight }

class StaggeredFadeSlide extends StatefulWidget {
  final List<Widget> children;
  final Duration staggerDelay;
  final Duration itemDuration;
  final StaggerDirection direction;

  const StaggeredFadeSlide({
    Key? key,
    required this.children,
    this.staggerDelay = const Duration(milliseconds: 80),
    this.itemDuration = const Duration(milliseconds: 400),
    this.direction = StaggerDirection.bottomToTop,
  }) : super(key: key);

  @override
  State<StaggeredFadeSlide> createState() => _StaggeredFadeSlideState();
}

class _StaggeredFadeSlideState extends State<StaggeredFadeSlide>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    final totalDuration = widget.itemDuration +
        (widget.staggerDelay *
            (widget.children.isEmpty ? 0 : widget.children.length - 1));

    _controller = AnimationController(
      vsync: this,
      duration: totalDuration,
    );

    _controller.forward();
  }

  @override
  void didUpdateWidget(StaggeredFadeSlide oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.children.length != widget.children.length ||
        oldWidget.itemDuration != widget.itemDuration ||
        oldWidget.staggerDelay != widget.staggerDelay) {
      final totalDuration = widget.itemDuration +
          (widget.staggerDelay *
              (widget.children.isEmpty ? 0 : widget.children.length - 1));
      _controller.duration = totalDuration;
      if (!_controller.isAnimating && _controller.value < 1.0) {
        _controller.forward();
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.children.isEmpty) {
      return const SizedBox.shrink();
    }

    final int totalItems = widget.children.length;
    final int itemDurationMs = widget.itemDuration.inMilliseconds;
    final int staggerDelayMs = widget.staggerDelay.inMilliseconds;
    final int totalDurationMs = _controller.duration!.inMilliseconds;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: List.generate(totalItems, (index) {
        final double start = totalDurationMs > 0
            ? (index * staggerDelayMs) / totalDurationMs
            : 0.0;
        final double end = totalDurationMs > 0
            ? ((index * staggerDelayMs) + itemDurationMs) / totalDurationMs
            : 1.0;

        final Animation<double> animation = CurvedAnimation(
          parent: _controller,
          curve: Interval(
            start.clamp(0.0, 1.0),
            end.clamp(0.0, 1.0),
            curve: AppMotion.signatureCurve,
          ),
        );

        final Animation<double> fadeAnimation = Tween<double>(
          begin: 0.0,
          end: 1.0,
        ).animate(animation);

        final Animation<Offset> slideAnimation = Tween<Offset>(
          begin: widget.direction == StaggerDirection.bottomToTop
              ? const Offset(0, 24)
              : const Offset(24, 0),
          end: Offset.zero,
        ).animate(animation);

        return AnimatedBuilder(
          animation: animation,
          builder: (context, child) {
            return Opacity(
              opacity: fadeAnimation.value,
              child: Transform.translate(
                offset: slideAnimation.value,
                child: child,
              ),
            );
          },
          child: widget.children[index],
        );
      }),
    );
  }
}

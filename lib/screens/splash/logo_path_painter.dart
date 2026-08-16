import 'dart:ui';
import 'package:flutter/material.dart';

class LogoPathPainter extends CustomPainter {
  final double progress;
  final double shimmerOffset;

  LogoPathPainter({required this.progress, this.shimmerOffset = 0.0});

  static Path? _cachedPath;

  Path _getLogoPath(double cx, double cy) {
    if (_cachedPath != null) {
      // Re-center just in case
      final bounds = _cachedPath!.getBounds();
      return _cachedPath!.shift(Offset(cx - bounds.center.dx, cy - bounds.center.dy));
    }

    const pathData = "M286,367 L286,386 L306,386 L305,366 Z M259,367 L259,386 L279,386 L278,366 Z M286,339 L286,358 L306,358 L305,338 Z M259,339 L259,358 L279,358 L278,338 Z M143,62 L128,83 L112,123 L110,164 L118,193 L131,216 L155,241 L189,265 L250,301 L151,389 L129,370 L101,329 L96,328 L104,364 L124,419 L174,436 L215,446 L252,451 L301,451 L356,439 L403,416 L425,440 L448,457 L469,467 L489,472 L530,469 L568,451 L570,448 L534,451 L502,442 L474,426 L437,392 L474,348 L493,313 L507,270 L512,232 L509,181 L493,126 L471,87 L439,52 L411,32 L371,13 L334,3 L284,0 L251,4 L205,18 L172,36 Z M395,391 L387,399 L369,412 L366,413 L364,415 L346,424 L344,424 L341,426 L339,426 L336,428 L315,434 L293,437 L271,437 L260,436 L231,430 L216,425 L208,421 L206,421 L199,417 L197,417 L185,411 L183,409 L176,406 L174,404 L168,401 L166,396 L196,370 L224,344 L232,338 L240,330 L247,325 L254,318 L282,295 L284,295 L306,313 L387,383 Z M218,32 L238,23 L272,15 L307,15 L342,23 L365,34 L392,53 L412,73 L432,101 L447,132 L459,170 L465,208 L465,241 L460,275 L450,308 L437,336 L414,368 L384,337 L395,311 L399,288 L397,268 L385,243 L371,228 L350,213 L267,170 L254,158 L247,145 L247,129 L257,113 L277,104 L294,104 L315,111 L332,122 L347,137 L362,165 L365,165 L365,116 L353,115 L309,97 L277,95 L262,98 L243,107 L229,120 L221,136 L219,156 L226,176 L242,194 L264,208 L332,242 L360,266 L373,294 L373,315 L369,321 L345,298 L322,281 L209,211 L181,185 L165,158 L159,133 L163,97 L172,76 L186,57 Z";

    final path = Path();
    path.fillType = PathFillType.evenOdd;
    
    final commands = pathData.split(' ');
    for (final cmd in commands) {
      if (cmd.isEmpty) continue;
      
      final type = cmd[0];
      if (type == 'Z') {
        path.close();
      } else {
        final coords = cmd.substring(1).split(',');
        if (coords.length == 2) {
          final x = double.parse(coords[0]);
          final y = double.parse(coords[1]);
          if (type == 'M') {
            path.moveTo(x, y);
          } else if (type == 'L') {
            path.lineTo(x, y);
          }
        }
      }
    }

    // Scale down to fit 160x160 area
    final bounds = path.getBounds();
    final scale = 160.0 / bounds.width;
    
    final matrix = Matrix4.identity()
      ..scale(scale, scale)
      ..translate(-bounds.left, -bounds.top);
      
    _cachedPath = path.transform(matrix.storage);
    
    // Center it exactly
    final finalBounds = _cachedPath!.getBounds();
    _cachedPath = _cachedPath!.shift(Offset(cx - finalBounds.center.dx, cy - finalBounds.center.dy));

    return _cachedPath!;
  }

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;

    final logoPath = _getLogoPath(cx, cy);

    // Glowing style
    final strokePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    if (progress > 0) {
      final gradient = SweepGradient(
        colors: const [
          Color(0xFFB388FF), 
          Colors.white,
          Color(0xFFB388FF),
        ],
        stops: const [0.0, 0.5, 1.0],
        transform: GradientRotation(progress * 6.28),
      ).createShader(Rect.fromCircle(center: Offset(cx, cy), radius: 100));
      
      strokePaint.shader = gradient;
    }

    // Animate the stroke drawing
    final metrics = logoPath.computeMetrics().toList();
    for (var metric in metrics) {
      final extracted = metric.extractPath(0.0, metric.length * progress);
      canvas.drawPath(extracted, strokePaint);
    }

    // Smoothly fade in the fill at the end so it looks 'built' naturally
    if (progress > 0.7) {
      final fillOpacity = ((progress - 0.7) / 0.3).clamp(0.0, 1.0);
      final fillPaint = Paint()
        ..color = Colors.white.withOpacity(fillOpacity)
        ..style = PaintingStyle.fill;
        
      if (progress > 0) {
        final gradient = SweepGradient(
          colors: [
            const Color(0xFFB388FF).withOpacity(fillOpacity), 
            Colors.white.withOpacity(fillOpacity),
            const Color(0xFFB388FF).withOpacity(fillOpacity),
          ],
          stops: const [0.0, 0.5, 1.0],
          transform: GradientRotation(progress * 6.28),
        ).createShader(Rect.fromCircle(center: Offset(cx, cy), radius: 100));
        fillPaint.shader = gradient;
      }
      
      canvas.drawPath(logoPath, fillPaint);
    }
  }

  @override
  bool shouldRepaint(covariant LogoPathPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.shimmerOffset != shimmerOffset;
  }
}

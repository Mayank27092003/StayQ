import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../models/corridor_model.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../qube/qube_planner_screen.dart';

class CorridorDetailScreen extends StatefulWidget {
  final CorridorModel corridor;

  const CorridorDetailScreen({super.key, required this.corridor});

  @override
  State<CorridorDetailScreen> createState() => _CorridorDetailScreenState();
}

class _CorridorDetailScreenState extends State<CorridorDetailScreen> {
  GoogleMapController? _mapController;
  int _activeStopIndex = 0;
  bool _isMapExpanded = false;

  static const Map<String, LatLng> _stopCoordinates = {
    'Delhi': LatLng(28.6139, 77.2090),
    'Shimla': LatLng(31.1048, 77.1734),
    'Kufri': LatLng(31.0979, 77.2678),
    'Manali': LatLng(32.2432, 77.1892),
    'Dharamshala': LatLng(32.2190, 76.3234),
    'Dalhousie': LatLng(32.5387, 75.9710),
    'Amritsar': LatLng(31.6340, 74.8723),
    'Narkanda': LatLng(31.2584, 77.4589),
    'Kalpa': LatLng(31.5369, 78.2562),
    'Nako': LatLng(31.8797, 78.6272),
    'Tabo': LatLng(32.0924, 78.3828),
    'Kaza': LatLng(32.2276, 78.0710),
    'Key': LatLng(32.2982, 78.0125),
    'Solang Valley': LatLng(32.3166, 77.1582),
    'Atal Tunnel': LatLng(32.3600, 77.1600),
    'Sissu': LatLng(32.4820, 77.1243),
    'Keylong': LatLng(32.5710, 77.0320),
    'Jispa': LatLng(32.6410, 77.1870),
    'Leh': LatLng(34.1526, 77.5771),
    'Haridwar': LatLng(29.9457, 78.1642),
    'Rishikesh': LatLng(30.0869, 78.2676),
    'Devprayag': LatLng(30.1459, 78.5986),
    'Tehri': LatLng(30.3926, 78.4802),
    'Haldwani': LatLng(29.2183, 79.5130),
    'Nainital': LatLng(29.3919, 79.4542),
    'Bhimtal': LatLng(29.3500, 79.5500),
    'Sattal': LatLng(29.3667, 79.5333),
    'Mukteshwar': LatLng(29.4722, 79.6472),
    'Jaipur': LatLng(26.9124, 75.7873),
    'Jodhpur': LatLng(26.2389, 73.0243),
    'Jaisalmer': LatLng(26.9157, 70.9083),
    'Udaipur': LatLng(24.5854, 73.7125),
    'Pushkar': LatLng(26.4897, 74.5511),
    'Bikaner': LatLng(28.0229, 73.3119),
    'Mount Abu': LatLng(24.5926, 72.7156),
    'Kumbhalgarh': LatLng(25.1479, 73.5873),
    'Rann of Kutch': LatLng(23.8344, 70.2999),
    'Bhuj': LatLng(23.2420, 69.6669),
    'Gir': LatLng(21.1243, 70.8242),
    'Somnath': LatLng(20.8880, 70.4013),
    'Diu': LatLng(20.7144, 70.9874),
    'Goa': LatLng(15.2993, 74.1240),
    'Gokarna': LatLng(14.5479, 74.3188),
    'Hampi': LatLng(15.3350, 76.4600),
    'Coorg': LatLng(12.3375, 75.8069),
    'Chikmagalur': LatLng(13.3161, 75.7720),
    'Wayanad': LatLng(11.6854, 76.1320),
    'Munnar': LatLng(10.0889, 77.0595),
    'Kochi': LatLng(9.9312, 76.2673),
    'Alleppey': LatLng(9.4981, 76.3388),
    'Varkala': LatLng(8.7379, 76.7163),
    'Kanyakumari': LatLng(8.0883, 77.5385),
    'Guwahati': LatLng(26.1445, 91.7362),
    'Shillong': LatLng(25.5788, 91.8933),
    'Cherrapunji': LatLng(25.2702, 91.7323),
    'Kaziranga': LatLng(26.5775, 93.1711),
    'Tawang': LatLng(27.5861, 91.8653),
    'Bomdila': LatLng(27.2645, 92.4159),
    'Dirang': LatLng(27.3562, 92.2384),
    'Majuli': LatLng(26.9535, 94.2037),
    'Kohima': LatLng(25.6751, 94.1086),
    'Ziro': LatLng(27.5950, 93.8340),
  };

  LatLng _getCoordinates(String stop, int index) {
    if (_stopCoordinates.containsKey(stop)) {
      return _stopCoordinates[stop]!;
    }
    // Deterministic offset fallback based on index
    return LatLng(22.0 + (index * 0.7), 76.0 + (index * 0.7));
  }

  List<LatLng> get _routePoints {
    return List.generate(
      widget.corridor.stops.length,
      (i) => _getCoordinates(widget.corridor.stops[i], i),
    );
  }

  Set<Marker> get _mapMarkers {
    final markers = <Marker>{};
    for (int i = 0; i < widget.corridor.stops.length; i++) {
      final stopName = widget.corridor.stops[i];
      final pos = _getCoordinates(stopName, i);
      final isSelected = i == _activeStopIndex;

      markers.add(
        Marker(
          markerId: MarkerId('corridor_stop_$i'),
          position: pos,
          zIndexInt: isSelected ? 3 : 1,
          icon: BitmapDescriptor.defaultMarkerWithHue(
            i == 0
                ? BitmapDescriptor.hueGreen
                : (i == widget.corridor.stops.length - 1
                    ? BitmapDescriptor.hueRed
                    : (isSelected ? BitmapDescriptor.hueOrange : BitmapDescriptor.hueAzure)),
          ),
          infoWindow: InfoWindow(
            title: '${i + 1}. $stopName',
            snippet: i == 0
                ? 'Starting Point'
                : (i == widget.corridor.stops.length - 1 ? 'Destination' : 'Highway Pitstop'),
            onTap: () => _openPitstopModal(context, stopName, i, pos),
          ),
          onTap: () {
            setState(() => _activeStopIndex = i);
            _mapController?.animateCamera(
              CameraUpdate.newLatLngZoom(pos, 11.5),
            );
          },
        ),
      );
    }
    return markers;
  }

  void _openPitstopModal(BuildContext context, String stopName, int index, LatLng pos) {
    AppMotion.tapSelection();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isStart = index == 0;
    final isEnd = index == widget.corridor.stops.length - 1;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
          decoration: BoxDecoration(
            color: AppColors.card(context),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border.all(color: AppColors.border(context)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.textSub(context).withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: isStart
                          ? const Color(0xFF10B981).withValues(alpha: 0.15)
                          : (isEnd
                              ? const Color(0xFFEF4444).withValues(alpha: 0.15)
                              : AppColors.primary.withValues(alpha: 0.15)),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isStart
                          ? Icons.play_arrow_rounded
                          : (isEnd ? Icons.flag_rounded : Icons.local_gas_station_rounded),
                      color: isStart
                          ? const Color(0xFF10B981)
                          : (isEnd ? const Color(0xFFEF4444) : AppColors.primary),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Stop #${index + 1}: $stopName',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: AppColors.text(context),
                            letterSpacing: -0.3,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          isStart
                              ? 'Official Corridor Departure Hub'
                              : (isEnd ? 'Final Destination & Overland Terminus' : 'Verified RV & Overland Pitstop Dock'),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSub(context),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    color: AppColors.icon(context),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // GPS Coordinates Card
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF222228) : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border(context)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.gps_fixed_rounded, size: 16, color: AppColors.primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'GPS COORDINATES',
                            style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, letterSpacing: 0.5, color: AppColors.primary),
                          ),
                          Text(
                            '${pos.latitude.toStringAsFixed(4)}° N, ${pos.longitude.toStringAsFixed(4)}° E',
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w700,
                              color: AppColors.text(context),
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextButton.icon(
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: '${pos.latitude}, ${pos.longitude}'));
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Coordinates for $stopName copied!'),
                            duration: const Duration(seconds: 2),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      },
                      icon: const Icon(Icons.copy_rounded, size: 14),
                      label: const Text('Copy', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      style: TextButton.styleFrom(foregroundColor: AppColors.primary),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),
              Text(
                'Pitstop Facilities & Services',
                style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: AppColors.text(context)),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _facilityPill(Icons.electric_bolt_rounded, '220V Power Dock', isDark),
                  _facilityPill(Icons.water_drop_rounded, 'Potable Water Refill', isDark),
                  _facilityPill(Icons.security_rounded, 'Guarded Overnight Dock', isDark),
                  _facilityPill(Icons.cleaning_services_rounded, 'Grey/Black Waste Dump', isDark),
                  _facilityPill(Icons.wifi_rounded, '4G / Wi-Fi Coverage', isDark),
                  _facilityPill(Icons.restaurant_rounded, 'Local Food & Supplies', isDark),
                ],
              ),

              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final url = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=${pos.latitude},${pos.longitude}');
                        if (await canLaunchUrl(url)) {
                          await launchUrl(url, mode: LaunchMode.externalApplication);
                        }
                      },
                      icon: const Icon(Icons.navigation_rounded, size: 16),
                      label: const Text('Navigate Here', style: TextStyle(fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.primary),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(ctx);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => QubePlannerScreen(
                              initialPrompt: 'Help me plan a campervan overnight stop in $stopName along the ${widget.corridor.name}. What are the best camping sites and things to see?',
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.auto_awesome, size: 16),
                      label: const Text('Qube Guide', style: TextStyle(fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _facilityPill(IconData icon, String text, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF222228) : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border(context)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.primary),
          const SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.text(context),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final corridor = widget.corridor;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final points = _routePoints;
    final initialCenter = points.isNotEmpty ? points.first : const LatLng(28.6139, 77.2090);

    return Scaffold(
      backgroundColor: AppColors.bg(context),
      appBar: AppBar(
        backgroundColor: AppColors.bg(context),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: AppColors.icon(context)),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              corridor.name,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 16,
                color: AppColors.text(context),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              '${corridor.region.displayName} • #${corridor.sortOrder}',
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w500,
                color: AppColors.textSub(context),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.share_outlined, color: AppColors.icon(context)),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: 'Explore ${corridor.name} with StayQ Campervans: ${corridor.route}'));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Corridor itinerary copied to clipboard!'),
                  duration: Duration(seconds: 2),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Interactive Map Widget
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              height: _isMapExpanded ? 420 : 250,
              width: double.infinity,
              margin: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.border(context)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: Stack(
                children: [
                  GoogleMap(
                    initialCameraPosition: CameraPosition(
                      target: initialCenter,
                      zoom: 6.8,
                    ),
                    onMapCreated: (c) {
                      _mapController = c;
                      if (points.length > 1) {
                        final minLat = points.map((p) => p.latitude).reduce((a, b) => a < b ? a : b);
                        final maxLat = points.map((p) => p.latitude).reduce((a, b) => a > b ? a : b);
                        final minLng = points.map((p) => p.longitude).reduce((a, b) => a < b ? a : b);
                        final maxLng = points.map((p) => p.longitude).reduce((a, b) => a > b ? a : b);

                        Future.delayed(const Duration(milliseconds: 400), () {
                          _mapController?.animateCamera(
                            CameraUpdate.newLatLngBounds(
                              LatLngBounds(
                                southwest: LatLng(minLat - 0.5, minLng - 0.5),
                                northeast: LatLng(maxLat + 0.5, maxLng + 0.5),
                              ),
                              40,
                            ),
                          );
                        });
                      }
                    },
                    markers: _mapMarkers,
                    polylines: {
                      Polyline(
                        polylineId: PolylineId(corridor.id),
                        points: points,
                        color: AppColors.primary,
                        width: 4,
                      ),
                    },
                    zoomControlsEnabled: false,
                    myLocationButtonEnabled: false,
                  ),

                  // Map expand toggle
                  Positioned(
                    top: 12,
                    right: 12,
                    child: InkWell(
                      onTap: () => setState(() => _isMapExpanded = !_isMapExpanded),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.card(context).withValues(alpha: 0.9),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border(context)),
                        ),
                        child: Icon(
                          _isMapExpanded ? Icons.fullscreen_exit_rounded : Icons.fullscreen_rounded,
                          size: 20,
                          color: AppColors.icon(context),
                        ),
                      ),
                    ),
                  ),

                  // Stop chips slider on top of map
                  Positioned(
                    bottom: 12,
                    left: 12,
                    right: 12,
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: List.generate(corridor.stops.length, (idx) {
                          final stop = corridor.stops[idx];
                          final isSelected = idx == _activeStopIndex;
                          return Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: InkWell(
                              onTap: () {
                                setState(() => _activeStopIndex = idx);
                                if (idx < points.length) {
                                  _mapController?.animateCamera(
                                    CameraUpdate.newLatLngZoom(points[idx], 11.5),
                                  );
                                }
                              },
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppColors.primary
                                      : (isDark ? const Color(0xFF1E1E24).withValues(alpha: 0.9) : Colors.white.withValues(alpha: 0.9)),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: isSelected ? AppColors.primary : AppColors.border(context),
                                  ),
                                ),
                                child: Text(
                                  '${idx + 1}. $stop',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                                    color: isSelected ? Colors.white : AppColors.text(context),
                                  ),
                                ),
                              ),
                            ),
                          );
                        }),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // 2. Metrics & Highlights Row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _metricBox(Icons.schedule_rounded, corridor.durationFormatted, 'Duration', isDark),
                  const SizedBox(width: 8),
                  _metricBox(Icons.straighten_rounded, corridor.distanceFormatted, 'Distance', isDark),
                  const SizedBox(width: 8),
                  _metricBox(Icons.pin_drop_rounded, '${corridor.stops.length} Stops', 'Pitstops', isDark),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 3. Corridor Overview
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.card(context),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border(context)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.stars_rounded, color: Color(0xFFE05638), size: 18),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            corridor.theme,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFFE05638),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      corridor.description,
                      style: TextStyle(
                        fontSize: 13.5,
                        color: AppColors.text(context),
                        height: 1.5,
                      ),
                    ),
                    if (corridor.highlights.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: corridor.highlights.map((hl) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF222228) : AppColors.surfaceLight,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.border(context)),
                            ),
                            child: Text(
                              hl,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textSub(context),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // 4. Highway Stops & Pitstops Timeline
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Corridor Stops & Pitstops',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      color: AppColors.text(context),
                      letterSpacing: -0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Tap any pitstop to inspect verified GPS coordinates, 220V power docks, and services.',
                    style: TextStyle(fontSize: 12, color: AppColors.textSub(context)),
                  ),
                  const SizedBox(height: 14),

                  ...List.generate(corridor.stops.length, (idx) {
                    final stop = corridor.stops[idx];
                    final pos = _getCoordinates(stop, idx);
                    final isStart = idx == 0;
                    final isEnd = idx == corridor.stops.length - 1;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: AppColors.card(context),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: idx == _activeStopIndex ? AppColors.primary : AppColors.border(context),
                          width: idx == _activeStopIndex ? 1.5 : 1.0,
                        ),
                      ),
                      child: ListTile(
                        onTap: () {
                          setState(() => _activeStopIndex = idx);
                          _openPitstopModal(context, stop, idx, pos);
                        },
                        leading: Container(
                          width: 38,
                          height: 38,
                          decoration: BoxDecoration(
                            color: isStart
                                ? const Color(0xFF10B981)
                                : (isEnd ? const Color(0xFFEF4444) : AppColors.primary),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              '${idx + 1}',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14),
                            ),
                          ),
                        ),
                        title: Text(
                          stop,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: AppColors.text(context),
                          ),
                        ),
                        subtitle: Text(
                          '${pos.latitude.toStringAsFixed(3)}°N, ${pos.longitude.toStringAsFixed(3)}°E • Tap for pitstop info',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: AppColors.textSub(context),
                          ),
                        ),
                        trailing: Icon(
                          Icons.chevron_right_rounded,
                          color: AppColors.icon(context),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),

            if (corridor.advisoryNotes != null || corridor.permits.isNotEmpty) ...[
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF2C2411) : const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.info_outline_rounded, size: 16, color: Color(0xFFD97706)),
                          const SizedBox(width: 6),
                          Text(
                            'OVERLAND ADVISORY & PERMITS',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              color: isDark ? const Color(0xFFFDE68A) : const Color(0xFF92400E),
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      if (corridor.advisoryNotes != null) ...[
                        const SizedBox(height: 6),
                        Text(
                          corridor.advisoryNotes!,
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? Colors.white70 : const Color(0xFF78350F),
                            height: 1.4,
                          ),
                        ),
                      ],
                      if (corridor.permits.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Permits: ${corridor.permits.join(', ')}',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isDark ? const Color(0xFFFBBF24) : const Color(0xFF92400E),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: 100),
          ],
        ),
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        decoration: BoxDecoration(
          color: AppColors.card(context),
          border: Border(top: BorderSide(color: AppColors.border(context))),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.06),
              blurRadius: 10,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              flex: 3,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => QubePlannerScreen(
                        initialPrompt: 'Plan an overland roadtrip on the ${corridor.name} (${corridor.route}) for ${corridor.durationFormatted}. Suggest day-by-day stops and campervan overnight docking recommendations.',
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.auto_awesome, size: 16),
                label: const Text('Plan with Qube', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              flex: 2,
              child: OutlinedButton.icon(
                onPressed: () async {
                  final query = corridor.stops.map(Uri.encodeComponent).join('/');
                  final url = Uri.parse('https://www.google.com/maps/dir/$query');
                  if (await canLaunchUrl(url)) {
                    await launchUrl(url, mode: LaunchMode.externalApplication);
                  }
                },
                icon: const Icon(Icons.map_rounded, size: 16),
                label: const Text('Full Route', style: TextStyle(fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF15803D),
                  side: const BorderSide(color: Color(0xFF86EFAC)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _metricBox(IconData icon, String value, String label, bool isDark) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: AppColors.card(context),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border(context)),
        ),
        child: Column(
          children: [
            Icon(icon, size: 18, color: AppColors.primary),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: AppColors.text(context),
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 10.5,
                color: AppColors.textSub(context),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

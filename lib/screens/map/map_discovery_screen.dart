import 'dart:async';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../models/stay_model.dart';
import '../listing/listing_detail_screen.dart';
import '../search/search_filter_modal.dart';
import '../../config/app_config.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class MapDiscoveryScreen extends StatefulWidget {
  const MapDiscoveryScreen({super.key});

  @override
  State<MapDiscoveryScreen> createState() => _MapDiscoveryScreenState();
}

class _MapDiscoveryScreenState extends State<MapDiscoveryScreen> {
  int _selectedStayIndex = 0;
  String? _selectedStayId;
  final PageController _cardPageController = PageController(viewportFraction: 0.85);
  GoogleMapController? _mapController;
  Set<Marker> _markers = {};
  AppProvider? _provider;
  Timer? _cameraDebounce;
  int _markerRequest = 0;
  int _cameraRequest = 0;
  String _lastSignature = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _provider = context.read<AppProvider>();
      _provider!.addListener(_onProviderChanged);
      _onProviderChanged();
    });
  }

  void _onProviderChanged() {
    if (!mounted || _provider == null) return;
    final p = _provider!;
    final stays = p.filteredStays;
    final signature = '${p.searchDestination}|${p.searchLatitude}|${p.searchLongitude}|${stays.map((s) => '${s.id}:${s.lat}:${s.lng}:${s.pricePerNight}').join('|')}';
    if (signature == _lastSignature) return;
    _lastSignature = signature;
    final previousIndex = stays.indexWhere((s) => s.id == _selectedStayId);
    _selectedStayIndex = previousIndex >= 0
        ? previousIndex
        : _selectedStayIndex.clamp(0, stays.isEmpty ? 0 : stays.length - 1).toInt();
    _selectedStayId = stays.isEmpty ? null : stays[_selectedStayIndex].id;
    _buildMarkers();
    if (_cardPageController.hasClients) _cardPageController.jumpToPage(_selectedStayIndex);
    _cameraDebounce?.cancel();
    _cameraRequest++;
    _cameraDebounce = Timer(const Duration(milliseconds: 350), () {
      if (!mounted) return;
      if (p.searchLatitude != null && p.searchLongitude != null) {
        _mapController?.animateCamera(
          CameraUpdate.newCameraPosition(
            CameraPosition(
              target: LatLng(p.searchLatitude!, p.searchLongitude!),
              zoom: 13.5,
              tilt: 25.0,
            ),
          ),
        );
      } else if (p.searchDestination.isNotEmpty && !['Where', 'Anywhere'].contains(p.searchDestination)) {
        _geocodeAndMove(p.searchDestination);
      } else if (stays.isNotEmpty && (stays.first.lat != 0 || stays.first.lng != 0)) {
        _mapController?.animateCamera(
          CameraUpdate.newCameraPosition(
            CameraPosition(
              target: LatLng(stays.first.lat, stays.first.lng),
              zoom: 13.5,
              tilt: 25.0,
            ),
          ),
        );
      }
    });
  }

  Future<void> _geocodeAndMove(String destination) async {
    final request = ++_cameraRequest;
    try {
      final destLower = destination.trim().toLowerCase();
      // 1. First check if any available stay directly matches the searched destination
      final matches = _provider?.filteredStays.where(
        (s) => s.lat != 0 && s.lng != 0 &&
               (s.city.toLowerCase().contains(destLower) ||
                destLower.contains(s.city.toLowerCase()) ||
                s.title.toLowerCase().contains(destLower)),
      );
      final matchingStay = (matches != null && matches.isNotEmpty) ? matches.first : null;
      if (matchingStay != null && matchingStay.lat != 0) {
        if (!mounted || request != _cameraRequest) return;
        _mapController?.animateCamera(
          CameraUpdate.newCameraPosition(
            CameraPosition(
              target: LatLng(matchingStay.lat, matchingStay.lng),
              zoom: 13.5,
              tilt: 28.0,
            ),
          ),
        );
        return;
      }

      // 2. Geocode using Google Geocoding API if key is available
      final apiKey = AppConfig.googlePlacesApiKey;
      if (apiKey.isNotEmpty) {
        final gUrl = Uri.parse('https://maps.googleapis.com/maps/api/geocode/json?address=${Uri.encodeComponent(destination)}&key=$apiKey');
        final gRes = await http.get(gUrl).timeout(const Duration(seconds: 8));
        if (gRes.statusCode == 200) {
          final gData = jsonDecode(gRes.body);
          if (gData['status'] == 'OK' && (gData['results'] as List).isNotEmpty) {
            final loc = gData['results'][0]['geometry']['location'];
            final lat = double.tryParse(loc['lat'].toString());
            final lng = double.tryParse(loc['lng'].toString());
            if (lat != null && lng != null && mounted && request == _cameraRequest) {
              _mapController?.animateCamera(
                CameraUpdate.newCameraPosition(
                  CameraPosition(
                    target: LatLng(lat, lng),
                    zoom: 13.5,
                    tilt: 28.0,
                  ),
                ),
              );
              return;
            }
          }
        }
      }

      // 3. Fallback to OpenStreetMap Nominatim
      final url = Uri.parse('https://nominatim.openstreetmap.org/search?q=${Uri.encodeComponent(destination)}&format=json&limit=1');
      final response = await http.get(url, headers: {'User-Agent': 'StayQ_App'}).timeout(const Duration(seconds: 10));
      if (!mounted || request != _cameraRequest || response.statusCode != 200) return;
      final data = jsonDecode(response.body);
      if (data is! List || data.isEmpty) return;
      final lat = double.tryParse(data.first['lat'].toString());
      final lng = double.tryParse(data.first['lon'].toString());
      if (lat != null && lng != null) {
        _mapController?.animateCamera(
          CameraUpdate.newCameraPosition(
            CameraPosition(
              target: LatLng(lat, lng),
              zoom: 13.5,
              tilt: 28.0,
            ),
          ),
        );
      }
    } catch (e) {
      debugPrint('Geocoding failed: $e');
    }
  }

  @override
  void dispose() {
    _provider?.removeListener(_onProviderChanged);
    _cameraDebounce?.cancel();
    _markerRequest++;
    _cameraRequest++;
    _mapController?.dispose();
    _cardPageController.dispose();
    super.dispose();
  }

  Future<void> _buildMarkers() async {
    if (!mounted || _provider == null) return;
    final request = ++_markerRequest;
    final stays = _provider!.filteredStays;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    Set<Marker> newMarkers = {};

    for (int i = 0; i < stays.length; i++) {
      final stay = stays[i];
      final isSelected = i == _selectedStayIndex;
      if (stay.lat == 0 && stay.lng == 0) continue;
      BitmapDescriptor icon;
      try {
        icon = await _getCustomMarker('₹${stay.pricePerNight.toInt()}', isSelected: isSelected, isDark: isDark);
      } catch (_) {
        icon = BitmapDescriptor.defaultMarker;
      }
      if (!mounted || request != _markerRequest) return;

      newMarkers.add(
        Marker(
          markerId: MarkerId(stay.id),
          position: LatLng(stay.lat, stay.lng),
          icon: icon,
          zIndexInt: isSelected ? 3 : 1,
          onTap: () {
            if (!mounted) return;
            setState(() {
              _selectedStayIndex = i;
              _selectedStayId = stay.id;
            });
            _buildMarkers(); // Rebuild to update colors
            _cardPageController.animateToPage(
              i,
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeOutCubic,
            );
          },
        ),
      );
    }

    if (mounted && request == _markerRequest) {
      setState(() {
        _markers = newMarkers;
      });
    }
  }

  Future<BitmapDescriptor> _getCustomMarker(String price, {bool isSelected = false, bool isDark = false}) async {
    final ui.PictureRecorder pictureRecorder = ui.PictureRecorder();
    final Canvas canvas = Canvas(pictureRecorder);
    const double width = 160;
    const double height = 80;

    final Paint paint = Paint()
      ..color = isSelected
          ? AppColors.primary
          : (isDark ? const Color(0xFF222228) : Colors.white)
      ..style = PaintingStyle.fill;

    final Paint shadowPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.25)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8.0);

    final RRect rRect = RRect.fromRectAndRadius(
      const Rect.fromLTWH(0.0, 0.0, width, height - 20),
      const Radius.circular(20.0),
    );

    // Draw shadow
    canvas.drawRRect(rRect.shift(const Offset(0, 4)), shadowPaint);

    // Draw bubble
    canvas.drawRRect(rRect, paint);

    // Draw triangle pointer
    final Path trianglePath = Path()
      ..moveTo(width / 2 - 12, height - 20)
      ..lineTo(width / 2, height - 4)
      ..lineTo(width / 2 + 12, height - 20)
      ..close();

    canvas.drawPath(trianglePath.shift(const Offset(0, 4)), shadowPaint);
    canvas.drawPath(trianglePath, paint);

    TextPainter painter = TextPainter(textDirection: TextDirection.ltr);
    painter.text = TextSpan(
      text: price,
      style: TextStyle(
        fontSize: 24.0,
        color: isSelected ? Colors.white : (isDark ? Colors.white : AppColors.textPrimary),
        fontWeight: FontWeight.w800,
      ),
    );
    painter.layout();
    painter.paint(
      canvas,
      Offset((width - painter.width) / 2, (height - 20 - painter.height) / 2),
    );

    final picture = pictureRecorder.endRecording();
    ui.Image? image;
    try {
      image = await picture.toImage(width.toInt(), height.toInt());
      final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
      return bytes == null
          ? BitmapDescriptor.defaultMarker
          : BitmapDescriptor.bytes(bytes.buffer.asUint8List());
    } finally {
      image?.dispose();
      picture.dispose();
      painter.dispose();
    }
  }

  void _openClusterBottomSheet(BuildContext context, List<StayModel> stays) {
    AppMotion.tapSelection();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.75,
          decoration: BoxDecoration(
            color: AppColors.card(context),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
            border: Border.all(color: AppColors.border(context)),
          ),
          child: Column(
            children: [
              const SizedBox(height: 12),
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
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Properties in this Area',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppColors.text(context),
                            letterSpacing: -0.3,
                          ),
                        ),
                        Text(
                          '${stays.length} ${stays.length == 1 ? 'property' : 'properties'} found',
                          style: TextStyle(
                            fontSize: 12.5,
                            color: AppColors.textSub(context),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      color: AppColors.icon(context),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              Divider(height: 1, color: AppColors.border(context)),
              Expanded(
                child: ListView.separated(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  itemCount: stays.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, idx) {
                    final stay = stays[idx];
                    return InkWell(
                      onTap: () {
                        Navigator.pop(ctx);
                        setState(() {
                          _selectedStayIndex = idx;
                          _selectedStayId = stay.id;
                        });
                        _buildMarkers();
                        if (_cardPageController.hasClients) {
                          _cardPageController.animateToPage(
                            idx,
                            duration: const Duration(milliseconds: 400),
                            curve: Curves.easeOutCubic,
                          );
                        }
                        if (stay.lat != 0 && stay.lng != 0) {
                          _mapController?.animateCamera(
                            CameraUpdate.newCameraPosition(
                              CameraPosition(
                                target: LatLng(stay.lat, stay.lng),
                                zoom: 14.5,
                              ),
                            ),
                          );
                        }
                      },
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF222228) : AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: stay.id == _selectedStayId
                                ? AppColors.primary
                                : AppColors.border(context),
                            width: stay.id == _selectedStayId ? 1.5 : 1.0,
                          ),
                        ),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: SizedBox(
                                width: 72,
                                height: 72,
                                child: (stay.imageUrls.isNotEmpty && stay.firstImage.startsWith('http'))
                                    ? Image.network(
                                        stay.firstImage,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, _, _) => Container(color: AppColors.border(context)),
                                      )
                                    : Image.asset(
                                        stay.firstImage,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, _, _) => Container(color: AppColors.border(context)),
                                      ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          stay.title,
                                          style: TextStyle(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w800,
                                            color: AppColors.text(context),
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Icon(Icons.star_rounded, size: 14, color: AppColors.starYellow),
                                      const SizedBox(width: 2),
                                      Text(
                                        stay.rating.toStringAsFixed(1),
                                        style: TextStyle(
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.text(context),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    stay.location.isNotEmpty ? stay.location : (stay.city.isNotEmpty ? stay.city : 'India'),
                                    style: TextStyle(
                                      fontSize: 11.5,
                                      color: AppColors.textSub(context),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 6),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        '₹${stay.pricePerNight.toInt()} / night',
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w900,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.arrow_forward_ios_rounded, size: 12),
                                        color: AppColors.primary,
                                        padding: EdgeInsets.zero,
                                        constraints: const BoxConstraints(),
                                        onPressed: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => ListingDetailScreen(stay: stay),
                                            ),
                                          );
                                        },
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  final String _lightMapStyle = '''
  [
    {
      "elementType": "geometry",
      "stylers": [{"color": "#f5f6f8"}]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#334155"}]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{"color": "#ffffff"}, {"weight": 3}]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry.stroke",
      "stylers": [{"color": "#cbd5e1"}]
    },
    {
      "featureType": "administrative.land_parcel",
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#94a3b8"}]
    },
    {
      "featureType": "landscape.natural",
      "elementType": "geometry",
      "stylers": [{"color": "#edf2f0"}]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [{"color": "#e2e8f0"}]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#64748b"}]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry.fill",
      "stylers": [{"color": "#dcfce7"}]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#16a34a"}]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{"color": "#ffffff"}]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#475569"}]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [{"color": "#fed7aa"}]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#c2410c"}]
    },
    {
      "featureType": "transit.line",
      "elementType": "geometry",
      "stylers": [{"color": "#e2e8f0"}]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{"color": "#c7d2fe"}]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [{"color": "#476a8a"}]
    }
  ]
  ''';

  final String _darkMapStyle = '''
  [
    {"elementType": "geometry", "stylers": [{"color": "#1d2c4d"}]},
    {"elementType": "labels.text.fill", "stylers": [{"color": "#8ec3b9"}]},
    {"elementType": "labels.text.stroke", "stylers": [{"color": "#1a3646"}]},
    {"featureType": "administrative.country", "elementType": "geometry.stroke", "stylers": [{"color": "#4b6878"}]},
    {"featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{"color": "#64779e"}]},
    {"featureType": "administrative.province", "elementType": "geometry.stroke", "stylers": [{"color": "#4b6878"}]},
    {"featureType": "landscape.man_made", "elementType": "geometry.stroke", "stylers": [{"color": "#334e87"}]},
    {"featureType": "landscape.natural", "elementType": "geometry", "stylers": [{"color": "#023e58"}]},
    {"featureType": "poi", "elementType": "geometry", "stylers": [{"color": "#283d6a"}]},
    {"featureType": "poi", "elementType": "labels.text.fill", "stylers": [{"color": "#6f9ba5"}]},
    {"featureType": "poi", "elementType": "labels.text.stroke", "stylers": [{"color": "#1d2c4d"}]},
    {"featureType": "road", "elementType": "geometry", "stylers": [{"color": "#304a7d"}]},
    {"featureType": "road", "elementType": "labels.text.fill", "stylers": [{"color": "#98a5be"}]},
    {"featureType": "road", "elementType": "labels.text.stroke", "stylers": [{"color": "#1d2c4d"}]},
    {"featureType": "road.highway", "elementType": "geometry", "stylers": [{"color": "#2c6675"}]},
    {"featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{"color": "#255463"}]},
    {"featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{"color": "#b0d5ce"}]},
    {"featureType": "road.highway", "elementType": "labels.text.stroke", "stylers": [{"color": "#023e58"}]},
    {"featureType": "transit", "elementType": "labels.text.fill", "stylers": [{"color": "#98a5be"}]},
    {"featureType": "transit", "elementType": "labels.text.stroke", "stylers": [{"color": "#1d2c4d"}]},
    {"featureType": "water", "elementType": "geometry", "stylers": [{"color": "#0e1626"}]},
    {"featureType": "water", "elementType": "labels.text.fill", "stylers": [{"color": "#4e6d70"}]}
  ]
  ''';

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final stays = provider.filteredStays;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          // 1. Interactive Map
          Positioned.fill(
            child: GoogleMap(
              initialCameraPosition: CameraPosition(
                target: (stays.isNotEmpty && stays[0].lat != 0.0 && stays[0].lng != 0.0)
                    ? LatLng(stays[0].lat, stays[0].lng)
                    : const LatLng(28.6139, 77.2090), // Default to New Delhi
                zoom: 13,
              ),
              style: isDark ? _darkMapStyle : _lightMapStyle,
              onMapCreated: (controller) {
                _mapController = controller;
              },
              markers: _markers,
              zoomControlsEnabled: false,
              mapToolbarEnabled: false,
              myLocationButtonEnabled: false,
              compassEnabled: false,
            ),
          ).animate().fadeIn(duration: 800.ms),

          // 2. Top Floating UI (Search & Filters)
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(30),
                    child: BackdropFilter(
                      filter: ui.ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF1E1E24).withValues(alpha: 0.92)
                              : Colors.white.withValues(alpha: 0.88),
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(
                            color: isDark ? Colors.white.withValues(alpha: 0.12) : Colors.white.withValues(alpha: 0.6),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.1),
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            GestureDetector(
                              onTap: () => Navigator.pop(context),
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? Colors.white.withValues(alpha: 0.08)
                                      : Colors.black.withValues(alpha: 0.05),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(Icons.arrow_back_rounded, size: 20, color: AppColors.icon(context)),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: GestureDetector(
                                behavior: HitTestBehavior.opaque,
                                onTap: () {
                                  showModalBottomSheet(
                                    context: context,
                                    isScrollControlled: true,
                                    backgroundColor: Colors.transparent,
                                    builder: (_) => const SearchFilterModal(isFromMap: true),
                                  );
                                },
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'Where',
                                      style: TextStyle(fontSize: 12, color: AppColors.textSub(context), fontWeight: FontWeight.w500),
                                    ),
                                    Text(
                                      '${provider.searchDestination.isNotEmpty ? provider.searchDestination : "Anywhere"} • ${provider.selectedDateRange != null ? "Selected dates" : "Any week"}',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.text(context),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap: () {
                                showModalBottomSheet(
                                  context: context,
                                  isScrollControlled: true,
                                  backgroundColor: Colors.transparent,
                                  builder: (_) => const SearchFilterModal(isFromMap: true),
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.all(10),
                                decoration: const BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.tune_rounded, color: Colors.white, size: 20),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ).animate().slideY(begin: -1, duration: 600.ms, curve: Curves.easeOutCubic),

                // Floating Map Filter Pills
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      _MapFilterPill(title: 'All Stays', icon: Icons.border_all_rounded, isSelected: provider.selectedCategory == 'All Stays', onTap: () => provider.setCategory('All Stays')),
                      _MapFilterPill(title: 'Campervans', icon: Icons.directions_car_filled_rounded, isSelected: provider.selectedCategory == 'Campervans' || provider.selectedCategory == 'RV', onTap: () => provider.setCategory('Campervans')),
                      _MapFilterPill(title: 'Amazing Pools', icon: Icons.pool_rounded, isSelected: provider.selectedCategory == 'Amazing Pools', onTap: () => provider.setCategory('Amazing Pools')),
                      _MapFilterPill(title: 'Beachfront', icon: Icons.beach_access_rounded, isSelected: provider.selectedCategory == 'Beachfront', onTap: () => provider.setCategory('Beachfront')),
                      _MapFilterPill(title: 'Cabins', icon: Icons.cabin_rounded, isSelected: provider.selectedCategory == 'Cabins', onTap: () => provider.setCategory('Cabins')),
                    ],
                  ),
                ).animate().slideX(begin: 1, duration: 500.ms, curve: Curves.easeOutCubic).fadeIn(),
              ],
            ),
          ),

          // Floating Cluster List Button
          if (stays.isNotEmpty)
            Positioned(
              bottom: 220,
              right: 16,
              child: GestureDetector(
                onTap: () => _openClusterBottomSheet(context, stays),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.4),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.format_list_bulleted_rounded, color: Colors.white, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        'List (${stays.length})',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ).animate().fadeIn(duration: 400.ms).scale(begin: const Offset(0.8, 0.8)),
            ),

          // 3. Bottom Carousel with Glassmorphism
          Positioned(
            left: 0,
            right: 0,
            bottom: 30,
            child: SafeArea(
              child: SizedBox(
                height: 180,
                child: stays.isEmpty
                    ? Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          decoration: BoxDecoration(
                            color: AppColors.card(context),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.border(context)),
                          ),
                          child: Text(
                            'No stays match your filters in this area',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: AppColors.text(context),
                            ),
                          ),
                        ),
                      )
                    : PageView.builder(
                        controller: _cardPageController,
                        physics: const BouncingScrollPhysics(),
                        onPageChanged: (idx) {
                          if (!mounted || idx >= stays.length) return;
                          setState(() {
                            _selectedStayIndex = idx;
                            _selectedStayId = stays[idx].id;
                          });
                          _buildMarkers(); // Update marker colors
                          final stay = stays[idx];
                          _mapController?.animateCamera(
                            CameraUpdate.newCameraPosition(
                              CameraPosition(
                                target: LatLng(stay.lat, stay.lng),
                                zoom: 14,
                              ),
                            ),
                          );
                        },
                        itemCount: stays.length,
                        itemBuilder: (context, index) {
                          final stay = stays[index];
                          final isSelected = index == _selectedStayIndex;
                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            margin: EdgeInsets.only(
                              left: 8,
                              right: 8,
                              top: isSelected ? 0 : 20,
                              bottom: isSelected ? 0 : 20,
                            ),
                            child: _MapCardGlassmorphic(
                              stay: stay,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ListingDetailScreen(stay: stay),
                                  ),
                                );
                              },
                            ),
                          );
                        },
                      ).animate().slideY(begin: 1, duration: 600.ms, curve: Curves.easeOutCubic).fadeIn(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MapFilterPill extends StatelessWidget {
  final String title;
  final IconData icon;
  final bool isSelected;
  final VoidCallback? onTap;

  const _MapFilterPill({required this.title, required this.icon, required this.isSelected, this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.primary
                  : (isDark ? const Color(0xFF222228).withValues(alpha: 0.9) : Colors.white.withValues(alpha: 0.85)),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: isSelected
                    ? AppColors.primary
                    : (isDark ? Colors.white.withValues(alpha: 0.12) : Colors.white.withValues(alpha: 0.6)),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 18, color: isSelected ? Colors.white : AppColors.text(context)),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isSelected ? Colors.white : AppColors.text(context),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MapCardGlassmorphic extends StatelessWidget {
  final StayModel stay;
  final VoidCallback onTap;

  const _MapCardGlassmorphic({required this.stay, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ui.ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: Container(
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xFF1E1E24).withValues(alpha: 0.9)
                  : Colors.white.withValues(alpha: 0.85),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(
                color: isDark ? Colors.white.withValues(alpha: 0.12) : Colors.white.withValues(alpha: 0.8),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.1),
                  blurRadius: 30,
                  offset: const Offset(0, 15),
                ),
              ],
            ),
            child: Row(
              children: [
                // Left Image
                Padding(
                  padding: const EdgeInsets.all(12.0),
                  child: Hero(
                    tag: 'map_img_${stay.id}',
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: SizedBox(
                        width: 120,
                        height: double.infinity,
                        child: (stay.imageUrls.isNotEmpty && stay.firstImage.startsWith('http'))
                            ? Image.network(
                                stay.firstImage,
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) => Container(color: AppColors.surfaceLight),
                              )
                            : stay.imageUrls.isNotEmpty
                                ? Image.asset(
                                    stay.firstImage,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, _, _) => Container(color: AppColors.surfaceLight),
                                  )
                                : Container(color: AppColors.surfaceLight),
                      ),
                    ),
                  ),
                ),
                // Right Content
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 14, bottom: 14, right: 14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: isDark ? Colors.white12 : Colors.white.withValues(alpha: 0.9),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.star_rounded, color: AppColors.starYellow, size: 14),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${stay.rating}',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                      color: AppColors.text(context),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                              decoration: BoxDecoration(
                                color: stay.isStayingWithHost
                                    ? const Color(0xFF2563EB).withValues(alpha: 0.15)
                                    : const Color(0xFF059669).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                stay.isStayingWithHost ? 'With Host' : 'Entire Place',
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: stay.isStayingWithHost ? const Color(0xFF2563EB) : const Color(0xFF059669),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          stay.title,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: AppColors.text(context),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          stay.location,
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textSub(context),
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const Spacer(),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '₹${stay.pricePerNight.toInt()}',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.primary),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              stay.isExperience ? '/ person' : '/ night',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.textSub(context),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

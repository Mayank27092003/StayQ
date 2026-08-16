import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';

class LocationSearchResult {
  final String displayName;
  final String title;
  final String subtitle;
  final double lat;
  final double lng;
  final String city;
  final String state;

  LocationSearchResult({
    required this.displayName,
    required this.title,
    required this.subtitle,
    required this.lat,
    required this.lng,
    required this.city,
    required this.state,
  });
}

class LocationSearchBottomSheet extends StatefulWidget {
  final Function(LocationSearchResult result) onLocationSelected;

  const LocationSearchBottomSheet({
    Key? key,
    required this.onLocationSelected,
  }) : super(key: key);

  static Future<void> show(
    BuildContext context, {
    required Function(LocationSearchResult result) onLocationSelected,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => LocationSearchBottomSheet(
        onLocationSelected: onLocationSelected,
      ),
    );
  }

  @override
  State<LocationSearchBottomSheet> createState() => _LocationSearchBottomSheetState();
}

class _LocationSearchBottomSheetState extends State<LocationSearchBottomSheet> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounce;
  bool _isLoading = false;
  bool _isGettingGps = false;
  List<LocationSearchResult> _results = [];
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final query = _searchController.text.trim();
    if (query.length < 3) {
      setState(() {
        _results = [];
        _isLoading = false;
        _errorMessage = '';
      });
      return;
    }

    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final encoded = Uri.encodeComponent(query);
      final url = Uri.parse(
        'https://nominatim.openstreetmap.org/search?q=$encoded&format=json&addressdetails=1&limit=6&countrycodes=in',
      );

      final response = await http.get(
        url,
        headers: {'User-Agent': 'StayQ-App-Host-Onboarding/1.0'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final List<LocationSearchResult> parsed = [];

        for (var item in data) {
          final address = item['address'] ?? {};
          final name = item['name'] ?? item['display_name'].split(',')[0];
          final city = address['city'] ??
              address['town'] ??
              address['village'] ??
              address['county'] ??
              address['state_district'] ??
              '';
          final state = address['state'] ?? '';

          parsed.add(
            LocationSearchResult(
              displayName: item['display_name'] ?? '',
              title: name.toString().trim(),
              subtitle: '${city.isNotEmpty ? '$city, ' : ''}$state'.trim(),
              lat: double.tryParse(item['lat']?.toString() ?? '') ?? 0.0,
              lng: double.tryParse(item['lon']?.toString() ?? '') ?? 0.0,
              city: city.toString().trim(),
              state: state.toString().trim(),
            ),
          );
        }

        if (mounted) {
          setState(() {
            _results = parsed;
            _isLoading = false;
            if (parsed.isEmpty) {
              _errorMessage = 'No locations found. Try entering a city or landmark.';
            }
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _isLoading = false;
            _errorMessage = 'Search service busy. Try again.';
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Unable to connect to location search.';
        });
      }
    }
  }

  Future<void> _useCurrentLocation() async {
    setState(() => _isGettingGps = true);
    AppMotion.tapSelection();

    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() => _isGettingGps = false);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() => _isGettingGps = false);
        return;
      }

      final Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      // Reverse geocode
      final url = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?lat=${position.latitude}&lon=${position.longitude}&format=json&addressdetails=1',
      );

      final response = await http.get(
        url,
        headers: {'User-Agent': 'StayQ-App-Host-Onboarding/1.0'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final address = data['address'] ?? {};
        final city = address['city'] ?? address['town'] ?? address['village'] ?? address['county'] ?? '';
        final state = address['state'] ?? '';
        final road = address['road'] ?? address['suburb'] ?? address['neighbourhood'] ?? 'Current Location';

        final result = LocationSearchResult(
          displayName: data['display_name'] ?? 'Current Location',
          title: road.toString(),
          subtitle: '${city.isNotEmpty ? '$city, ' : ''}$state',
          lat: position.latitude,
          lng: position.longitude,
          city: city.toString(),
          state: state.toString(),
        );

        if (mounted) {
          AppMotion.tapSelection();
          widget.onLocationSelected(result);
          Navigator.pop(context);
        }
      }
    } catch (e) {
      // Fallback
    } finally {
      if (mounted) setState(() => _isGettingGps = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.only(bottom: keyboardHeight),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF161522) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 30,
            offset: const Offset(0, -10),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle Bar
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: isDark ? Colors.white24 : Colors.black12,
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Search Location / Area',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 22),
                    onPressed: () => Navigator.pop(context),
                    style: IconButton.styleFrom(
                      backgroundColor: isDark ? Colors.white12 : AppColors.surfaceLight,
                      shape: const CircleBorder(),
                    ),
                  ),
                ],
              ),
            ),

            // Search Bar Input
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
              child: Container(
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF222033) : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 1.5),
                ),
                child: TextField(
                  controller: _searchController,
                  autofocus: true,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'e.g. Candolim, Goa or Connaught Place...',
                    hintStyle: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
                    prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
                    suffixIcon: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: Padding(
                              padding: EdgeInsets.all(12.0),
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                            ),
                          )
                        : (_searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear_rounded, size: 18),
                                onPressed: () => _searchController.clear(),
                              )
                            : null),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ),
            ),

            // 1-Tap GPS Location Button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: BouncingWidget(
                onTap: _isGettingGps ? null : _useCurrentLocation,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      _isGettingGps
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                            )
                          : const Icon(Icons.my_location_rounded, color: AppColors.primary, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _isGettingGps ? 'Detecting current GPS location...' : 'Use Current GPS Location',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                      const Icon(Icons.chevron_right_rounded, color: AppColors.primary, size: 20),
                    ],
                  ),
                ),
              ),
            ),

            const Divider(height: 16),

            // Autocomplete Results List
            if (_errorMessage.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Center(
                  child: Text(
                    _errorMessage,
                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                    textAlign: TextAlign.center,
                  ),
                ),
              )
            else if (_results.isNotEmpty)
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 280),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: _results.length,
                  separatorBuilder: (_, __) => const Divider(height: 1, indent: 56),
                  itemBuilder: (context, index) {
                    final item = _results[index];
                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      leading: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 20),
                      ),
                      title: Text(
                        item.title,
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      subtitle: Text(
                        item.subtitle.isNotEmpty ? item.subtitle : item.displayName,
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      onTap: () {
                        AppMotion.tapSelection();
                        widget.onLocationSelected(item);
                        Navigator.pop(context);
                      },
                    );
                  },
                ),
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Row(
                  children: const [
                    Icon(Icons.info_outline_rounded, size: 18, color: AppColors.textSecondary),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Type at least 3 letters to search towns, cities & landmarks across India.',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

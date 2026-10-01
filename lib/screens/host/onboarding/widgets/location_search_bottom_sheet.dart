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
  final String country;
  final String pincode;
  final String landmark;
  final String streetAddress;

  LocationSearchResult({
    required this.displayName,
    required this.title,
    required this.subtitle,
    required this.lat,
    required this.lng,
    required this.city,
    required this.state,
    this.country = 'India',
    this.pincode = '',
    this.landmark = '',
    this.streetAddress = '',
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
  static const String _gmapsApiKey = 'AIzaSyDcAw5j9JR1kWYLosJMwi8dqMPLF0x3OBc';

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
    _debounce = Timer(const Duration(milliseconds: 350), () {
      _performSearch(query);
    });
  }

  Future<void> _performSearch(String query) async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      // 1. Try Google Places Autocomplete API first
      final gUrl = Uri.parse(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${Uri.encodeComponent(query)}&components=country:in&key=$_gmapsApiKey',
      );
      final gResponse = await http.get(gUrl);

      if (gResponse.statusCode == 200) {
        final gData = json.decode(gResponse.body);
        if (gData['status'] == 'OK' && gData['predictions'] != null) {
          final List predictions = gData['predictions'];
          final List<LocationSearchResult> parsed = [];

          for (var p in predictions.take(8)) {
            final structured = p['structured_formatting'] ?? {};
            final mainText = structured['main_text'] ?? p['description']?.split(',')[0] ?? '';
            final secondaryText = structured['secondary_text'] ?? '';
            final placeId = p['place_id'] ?? '';

            parsed.add(
              LocationSearchResult(
                displayName: p['description'] ?? mainText,
                title: mainText.toString(),
                subtitle: secondaryText.toString(),
                lat: 0.0, // will be resolved on tap via Place Details or Geocoding
                lng: 0.0,
                city: '',
                state: '',
                country: 'India',
                pincode: '',
                landmark: mainText.toString(),
                streetAddress: placeId, // temporary storage for place_id
              ),
            );
          }

          if (mounted && parsed.isNotEmpty) {
            setState(() {
              _results = parsed;
              _isLoading = false;
            });
            return;
          }
        }
      }
    } catch (_) {
      // Fallback to OSM
    }

    // 2. Fallback to OpenStreetMap Nominatim
    try {
      final encoded = Uri.encodeComponent(query);
      final url = Uri.parse(
        'https://nominatim.openstreetmap.org/search?q=$encoded&format=json&addressdetails=1&limit=8&countrycodes=in',
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
          final country = address['country'] ?? 'India';
          final pincode = address['postcode'] ?? '';
          final landmark = address['suburb'] ?? address['neighbourhood'] ?? address['residential'] ?? '';
          final street = address['road'] ?? address['pedestrian'] ?? name;

          parsed.add(
            LocationSearchResult(
              displayName: item['display_name'] ?? '',
              title: name.toString().trim(),
              subtitle: '${city.isNotEmpty ? '$city, ' : ''}$state'.trim(),
              lat: double.tryParse(item['lat']?.toString() ?? '') ?? 0.0,
              lng: double.tryParse(item['lon']?.toString() ?? '') ?? 0.0,
              city: city.toString().trim(),
              state: state.toString().trim(),
              country: country.toString().trim(),
              pincode: pincode.toString().trim(),
              landmark: landmark.toString().trim(),
              streetAddress: street.toString().trim(),
            ),
          );
        }

        if (mounted) {
          setState(() {
            _results = parsed;
            _isLoading = false;
            if (parsed.isEmpty) {
              _errorMessage = 'No locations found. Try entering a city, landmark or pincode.';
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

  Future<void> _onSelectResult(LocationSearchResult item) async {
    AppMotion.tapSelection();

    // If item has place_id stored in streetAddress, resolve coordinates and address components
    if (item.lat == 0.0 && item.streetAddress.isNotEmpty) {
      setState(() => _isLoading = true);
      try {
        final detailsUrl = Uri.parse(
          'https://maps.googleapis.com/maps/api/place/details/json?place_id=${item.streetAddress}&fields=geometry,address_components,name,formatted_address&key=$_gmapsApiKey',
        );
        final res = await http.get(detailsUrl);
        if (res.statusCode == 200) {
          final data = json.decode(res.body);
          if (data['status'] == 'OK' && data['result'] != null) {
            final result = data['result'];
            final location = result['geometry']?['location'] ?? {};
            final lat = (location['lat'] as num?)?.toDouble() ?? 0.0;
            final lng = (location['lng'] as num?)?.toDouble() ?? 0.0;
            final components = result['address_components'] as List? ?? [];

            String country = 'India';
            String pincode = '';
            String state = '';
            String city = '';
            String landmark = item.title;
            String street = result['name'] ?? item.title;

            for (var c in components) {
              final types = c['types'] as List? ?? [];
              if (types.contains('country')) country = c['long_name'] ?? 'India';
              if (types.contains('postal_code')) pincode = c['long_name'] ?? '';
              if (types.contains('administrative_area_level_1')) state = c['long_name'] ?? '';
              if (types.contains('locality') || types.contains('administrative_area_level_2')) {
                if (city.isEmpty) city = c['long_name'] ?? '';
              }
              if (types.contains('sublocality') || types.contains('neighborhood')) {
                landmark = c['long_name'] ?? landmark;
              }
            }

            final resolvedResult = LocationSearchResult(
              displayName: result['formatted_address'] ?? item.displayName,
              title: item.title,
              subtitle: item.subtitle,
              lat: lat,
              lng: lng,
              city: city,
              state: state,
              country: country,
              pincode: pincode,
              landmark: landmark,
              streetAddress: street,
            );

            if (mounted) {
              widget.onLocationSelected(resolvedResult);
              Navigator.pop(context);
            }
            return;
          }
        }
      } catch (_) {
        // Continue with basic selection
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    }

    widget.onLocationSelected(item);
    Navigator.pop(context);
  }

  Future<void> _useCurrentLocation() async {
    setState(() => _isGettingGps = true);
    AppMotion.tapSelection();

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please enable GPS / Location Services on your device.')),
          );
        }
        setState(() => _isGettingGps = false);
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Location permission was denied.')),
            );
          }
          setState(() => _isGettingGps = false);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Location permissions are permanently denied. Please enable in Settings.'),
              action: SnackBarAction(
                label: 'Settings',
                onPressed: () => Geolocator.openAppSettings(),
              ),
            ),
          );
        }
        setState(() => _isGettingGps = false);
        return;
      }

      Position? position;
      try {
        position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 8),
        );
      } catch (_) {
        position = await Geolocator.getLastKnownPosition();
      }

      if (position == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Unable to acquire GPS fix. Please try again.')),
          );
        }
        setState(() => _isGettingGps = false);
        return;
      }

      // 1. Try Google Reverse Geocoding API
      try {
        final gUrl = Uri.parse(
          'https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.latitude},${position.longitude}&key=$_gmapsApiKey',
        );
        final gRes = await http.get(gUrl);
        if (gRes.statusCode == 200) {
          final gData = json.decode(gRes.body);
          if (gData['status'] == 'OK' && (gData['results'] as List).isNotEmpty) {
            final first = gData['results'][0];
            final components = first['address_components'] as List? ?? [];

            String country = 'India';
            String pincode = '';
            String state = '';
            String city = '';
            String landmark = '';
            String street = first['formatted_address']?.split(',')[0] ?? 'Current GPS Location';

            for (var c in components) {
              final types = c['types'] as List? ?? [];
              if (types.contains('country')) country = c['long_name'] ?? 'India';
              if (types.contains('postal_code')) pincode = c['long_name'] ?? '';
              if (types.contains('administrative_area_level_1')) state = c['long_name'] ?? '';
              if (types.contains('locality') || types.contains('administrative_area_level_2')) {
                if (city.isEmpty) city = c['long_name'] ?? '';
              }
              if (types.contains('sublocality') || types.contains('neighborhood')) {
                landmark = c['long_name'] ?? landmark;
              }
            }

            final result = LocationSearchResult(
              displayName: first['formatted_address'] ?? 'Current GPS Location',
              title: street,
              subtitle: '${city.isNotEmpty ? '$city, ' : ''}$state',
              lat: position.latitude,
              lng: position.longitude,
              city: city,
              state: state,
              country: country,
              pincode: pincode,
              landmark: landmark,
              streetAddress: street,
            );

            if (mounted) {
              AppMotion.tapSelection();
              widget.onLocationSelected(result);
              Navigator.pop(context);
            }
            return;
          }
        }
      } catch (_) {
        // Fallback to OSM
      }

      // 2. Fallback to OpenStreetMap Nominatim
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
        final city = address['city'] ?? address['town'] ?? address['village'] ?? address['county'] ?? address['state_district'] ?? '';
        final state = address['state'] ?? '';
        final country = address['country'] ?? 'India';
        final pincode = address['postcode'] ?? '';
        final landmark = address['suburb'] ?? address['neighbourhood'] ?? address['residential'] ?? '';
        final road = address['road'] ?? address['pedestrian'] ?? address['suburb'] ?? 'Current Location';

        final result = LocationSearchResult(
          displayName: data['display_name'] ?? 'Current GPS Location',
          title: road.toString(),
          subtitle: '${city.isNotEmpty ? '$city, ' : ''}$state',
          lat: position.latitude,
          lng: position.longitude,
          city: city.toString(),
          state: state.toString(),
          country: country.toString(),
          pincode: pincode.toString(),
          landmark: landmark.toString(),
          streetAddress: road.toString(),
        );

        if (mounted) {
          AppMotion.tapSelection();
          widget.onLocationSelected(result);
          Navigator.pop(context);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('GPS Detection failed: $e')),
        );
      }
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
                      onTap: () => _onSelectResult(item),
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

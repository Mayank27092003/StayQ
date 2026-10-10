import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:http/http.dart' as http;
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';
import '../widgets/location_search_bottom_sheet.dart';

class PropertyLocationScreen extends StatefulWidget {
  const PropertyLocationScreen({Key? key}) : super(key: key);

  @override
  State<PropertyLocationScreen> createState() => _PropertyLocationScreenState();
}

class _PropertyLocationScreenState extends State<PropertyLocationScreen> {
  // Structured Address Controllers
  late TextEditingController _houseNoController;
  late TextEditingController _buildingController;
  late TextEditingController _floorController;
  late TextEditingController _towerController;
  late TextEditingController _streetAddressController;
  late TextEditingController _areaLocalityController;
  late TextEditingController _landmarkController;
  late TextEditingController _pincodeController;
  late TextEditingController _cityController;
  late TextEditingController _stateController;
  late TextEditingController _countryController;
  late TextEditingController _pickupLocationController;

  GoogleMapController? _mapController;
  bool _isGettingGps = false;
  bool _isLoadingPincode = false;
  String? _detectedPincodeInfo;

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);

    _houseNoController = TextEditingController(text: provider.houseNumber);
    _buildingController = TextEditingController(text: provider.buildingName);
    _floorController = TextEditingController(text: provider.floor);
    _towerController = TextEditingController(text: provider.tower);
    _streetAddressController = TextEditingController(
      text: provider.streetAddress.isNotEmpty ? provider.streetAddress : provider.address,
    );
    _areaLocalityController = TextEditingController(text: provider.areaLocality);
    _landmarkController = TextEditingController(text: provider.landmark);
    _pincodeController = TextEditingController(text: provider.pincode);
    _cityController = TextEditingController(text: provider.city);
    _stateController = TextEditingController(text: provider.state);
    _countryController = TextEditingController(
      text: provider.country.isNotEmpty ? provider.country : 'India',
    );
    final initialPickup = provider.pickupLocation.isNotEmpty
        ? provider.pickupLocation
        : (provider.address.isNotEmpty ? provider.address : provider.streetAddress);
    _pickupLocationController = TextEditingController(text: initialPickup);

    // Ensure map coordinates are non-null and valid
    if (provider.latitude == null || provider.longitude == null || provider.latitude == 0.0 || provider.longitude == 0.0) {
      provider.updateLocation(
        lat: 28.6139,
        lng: 77.2090,
      );
    }

    _houseNoController.addListener(_updateProvider);
    _buildingController.addListener(_updateProvider);
    _floorController.addListener(_updateProvider);
    _towerController.addListener(_updateProvider);
    _streetAddressController.addListener(_updateProvider);
    _areaLocalityController.addListener(_updateProvider);
    _landmarkController.addListener(_updateProvider);
    _pincodeController.addListener(_onPincodeChanged);
    _cityController.addListener(_updateProvider);
    _stateController.addListener(_updateProvider);
    _countryController.addListener(_updateProvider);
    _pickupLocationController.addListener(_updateProvider);
  }

  String _computeFullAddress() {
    final parts = <String>[];

    // House No & Building
    final unitParts = <String>[];
    if (_houseNoController.text.trim().isNotEmpty) unitParts.add(_houseNoController.text.trim());
    if (_floorController.text.trim().isNotEmpty) unitParts.add(_floorController.text.trim());
    if (_towerController.text.trim().isNotEmpty) unitParts.add(_towerController.text.trim());
    if (_buildingController.text.trim().isNotEmpty) unitParts.add(_buildingController.text.trim());
    if (unitParts.isNotEmpty) parts.add(unitParts.join(', '));

    // Street & Locality
    if (_streetAddressController.text.trim().isNotEmpty) parts.add(_streetAddressController.text.trim());
    if (_areaLocalityController.text.trim().isNotEmpty) parts.add(_areaLocalityController.text.trim());
    if (_landmarkController.text.trim().isNotEmpty) parts.add('Near ${_landmarkController.text.trim()}');

    // City, State, Pincode, Country
    if (_cityController.text.trim().isNotEmpty) parts.add(_cityController.text.trim());
    if (_stateController.text.trim().isNotEmpty) {
      if (_pincodeController.text.trim().isNotEmpty) {
        parts.add('${_stateController.text.trim()} - ${_pincodeController.text.trim()}');
      } else {
        parts.add(_stateController.text.trim());
      }
    } else if (_pincodeController.text.trim().isNotEmpty) {
      parts.add(_pincodeController.text.trim());
    }

    if (_countryController.text.trim().isNotEmpty) parts.add(_countryController.text.trim());

    return parts.join(', ');
  }

  void _updateProvider() {
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    final fullAddr = _computeFullAddress();
    final effectivePickup = _pickupLocationController.text.trim().isNotEmpty
        ? _pickupLocationController.text.trim()
        : fullAddr;

    provider.updateLocation(
      address: fullAddr.isNotEmpty ? fullAddr : _streetAddressController.text,
      city: _cityController.text.trim(),
      state: _stateController.text.trim(),
      country: _countryController.text.trim(),
      pincode: _pincodeController.text.trim(),
      landmark: _landmarkController.text.trim(),
      streetAddress: _streetAddressController.text.trim(),
      houseNumber: _houseNoController.text.trim(),
      buildingName: _buildingController.text.trim(),
      floor: _floorController.text.trim(),
      tower: _towerController.text.trim(),
      areaLocality: _areaLocalityController.text.trim(),
      pickupLocation: effectivePickup,
      lat: provider.latitude ?? 28.6139,
      lng: provider.longitude ?? 77.2090,
    );
    if (mounted) setState(() {});
  }

  Future<void> _fetchAndApplyPincode(String pin, {bool forceOverride = false}) async {
    if (pin.length != 6 || int.tryParse(pin) == null) return;
    if (_isLoadingPincode) return;

    setState(() => _isLoadingPincode = true);
    try {
      final url = Uri.parse('https://api.postalpincode.in/pincode/$pin');
      final response = await http.get(url).timeout(const Duration(seconds: 10));
      if (!mounted || _pincodeController.text.trim() != pin) return;
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data is List && data.isNotEmpty && data[0]['Status'] == 'Success') {
          final postOffices = data[0]['PostOffice'] as List?;
          if (postOffices != null && postOffices.isNotEmpty) {
            final po = postOffices[0];
            final detectedDistrict = po['District']?.toString() ?? '';
            final detectedState = po['State']?.toString() ?? '';
            final detectedName = po['Name']?.toString() ?? '';

            if (detectedDistrict.isNotEmpty && (forceOverride || _cityController.text.isEmpty)) {
              _cityController.text = detectedDistrict;
            }
            if (detectedState.isNotEmpty && (forceOverride || _stateController.text.isEmpty)) {
              _stateController.text = detectedState;
            }
            if (detectedName.isNotEmpty && (forceOverride || _areaLocalityController.text.isEmpty)) {
              _areaLocalityController.text = detectedName;
            }

            setState(() {
              _detectedPincodeInfo = '$detectedName, $detectedDistrict, $detectedState';
            });
            _updateProvider();
          }
        } else {
          setState(() => _detectedPincodeInfo = null);
        }
      }
    } catch (_) {
      // Graceful fallback
    } finally {
      if (mounted) setState(() => _isLoadingPincode = false);
    }
  }

  Future<void> _onPincodeChanged() async {
    _updateProvider();
    final pin = _pincodeController.text.trim();
    if (pin.length == 6 && int.tryParse(pin) != null) {
      await _fetchAndApplyPincode(pin, forceOverride: true);
    } else {
      if (_detectedPincodeInfo != null) {
        setState(() => _detectedPincodeInfo = null);
      }
    }
  }

  Future<void> _reverseGeocodeCoordinate(LatLng pos) async {
    try {
      final url = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?lat=${pos.latitude}&lon=${pos.longitude}&format=json&addressdetails=1',
      );
      final response = await http.get(
        url,
        headers: {'User-Agent': 'StayQ-App-Host-Onboarding/1.0'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final address = data['address'] ?? {};
        final city = address['city'] ?? address['town'] ?? address['village'] ?? address['municipality'] ?? address['city_district'] ?? address['district'] ?? address['state_district'] ?? address['county'] ?? '';
        final state = address['state'] ?? '';
        final country = address['country'] ?? 'India';
        final rawPincode = (address['postcode']?.toString() ?? '').replaceAll(RegExp(r'[^0-9]'), '');
        final pincode = rawPincode.length >= 6 ? rawPincode.substring(0, 6) : rawPincode;
        final suburb = address['suburb'] ?? address['neighbourhood'] ?? address['residential'] ?? address['subdistrict'] ?? '';
        final road = address['road'] ?? address['pedestrian'] ?? address['street'] ?? '';
        final houseNum = address['house_number'] ?? '';
        final building = address['building'] ?? address['amenity'] ?? address['name'] ?? '';

        _countryController.text = country;
        if (pincode.isNotEmpty) {
          _pincodeController.text = pincode;
          await _fetchAndApplyPincode(pincode, forceOverride: true);
        }
        if (state.isNotEmpty && _stateController.text.isEmpty) _stateController.text = state;
        if (city.isNotEmpty && _cityController.text.isEmpty) _cityController.text = city;
        if (suburb.isNotEmpty && _areaLocalityController.text.isEmpty) _areaLocalityController.text = suburb;
        if (road.isNotEmpty && _streetAddressController.text.isEmpty) _streetAddressController.text = road;
        if (houseNum.isNotEmpty && _houseNoController.text.isEmpty) _houseNoController.text = houseNum;
        if (building.isNotEmpty && _buildingController.text.isEmpty) _buildingController.text = building;

        _updateProvider();
      }
    } catch (_) {}
  }

  Future<void> _useCurrentGpsLocation() async {
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
        final city = address['city'] ?? address['town'] ?? address['village'] ?? address['municipality'] ?? address['city_district'] ?? address['district'] ?? address['state_district'] ?? address['county'] ?? '';
        final state = address['state'] ?? '';
        final country = address['country'] ?? 'India';
        final rawPincode = (address['postcode']?.toString() ?? '').replaceAll(RegExp(r'[^0-9]'), '');
        final pincode = rawPincode.length >= 6 ? rawPincode.substring(0, 6) : rawPincode;
        final suburb = address['suburb'] ?? address['neighbourhood'] ?? address['residential'] ?? address['subdistrict'] ?? '';
        final road = address['road'] ?? address['pedestrian'] ?? address['street'] ?? '';
        final houseNum = address['house_number'] ?? '';
        final building = address['building'] ?? address['amenity'] ?? address['name'] ?? '';

        _countryController.text = country;
        if (pincode.isNotEmpty) {
          _pincodeController.text = pincode;
          await _fetchAndApplyPincode(pincode, forceOverride: true);
        }
        if (state.isNotEmpty && _stateController.text.isEmpty) _stateController.text = state;
        if (city.isNotEmpty && _cityController.text.isEmpty) _cityController.text = city;
        if (suburb.isNotEmpty) _areaLocalityController.text = suburb;
        if (road.isNotEmpty) _streetAddressController.text = road;
        if (houseNum.isNotEmpty && _houseNoController.text.isEmpty) _houseNoController.text = houseNum;
        if (building.isNotEmpty && _buildingController.text.isEmpty) _buildingController.text = building;

        _updateProvider();

        final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
        provider.updateLocation(
          lat: position.latitude,
          lng: position.longitude,
        );

        _mapController?.animateCamera(
          CameraUpdate.newLatLngZoom(LatLng(position.latitude, position.longitude), 16.5),
        );

        if (mounted) {
          final displayCity = _cityController.text.isNotEmpty ? _cityController.text : city;
          final displayState = _stateController.text.isNotEmpty ? _stateController.text : state;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '📍 GPS Auto-Filled: $displayCity, $displayState (${_pincodeController.text})',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              backgroundColor: const Color(0xFF10B981),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('GPS Detection error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isGettingGps = false);
    }
  }

  void _openLocationSearchSheet() {
    AppMotion.tapSelection();
    LocationSearchBottomSheet.show(
      context,
      onLocationSelected: (result) {
        final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
        if (result.country.isNotEmpty) _countryController.text = result.country;
        if (result.pincode.isNotEmpty) _pincodeController.text = result.pincode;
        if (result.state.isNotEmpty) _stateController.text = result.state;
        if (result.city.isNotEmpty) _cityController.text = result.city;
        if (result.landmark.isNotEmpty) _landmarkController.text = result.landmark;
        if (result.streetAddress.isNotEmpty) {
          _streetAddressController.text = result.streetAddress;
        } else {
          _streetAddressController.text = result.title;
        }

        if (provider.propertyType == 'RV' && _pickupLocationController.text.trim().isEmpty) {
          _pickupLocationController.text = result.title.isNotEmpty ? result.title : result.streetAddress;
        }

        _updateProvider();

        if (result.lat != 0.0 && result.lng != 0.0) {
          provider.updateLocation(
            lat: result.lat,
            lng: result.lng,
          );
          _mapController?.animateCamera(
            CameraUpdate.newLatLngZoom(LatLng(result.lat, result.lng), 16.0),
          );
        }
      },
    );
  }

  @override
  void dispose() {
    _houseNoController.dispose();
    _buildingController.dispose();
    _floorController.dispose();
    _towerController.dispose();
    _streetAddressController.dispose();
    _areaLocalityController.dispose();
    _landmarkController.dispose();
    _pincodeController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _countryController.dispose();
    _pickupLocationController.dispose();
    super.dispose();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UI WIDGETS
  // ══════════════════════════════════════════════════════════════════════════

  // ══════════════════════════════════════════════════════════════════════════
  // UI WIDGETS
  // ══════════════════════════════════════════════════════════════════════════

  Widget _buildCardContainer({
    required String title,
    required String subtitle,
    required IconData icon,
    required List<Widget> children,
    required bool isDark,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? Colors.white.withValues(alpha: 0.1) : AppColors.borderLight,
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.03),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : AppColors.textPrimary,
                        letterSpacing: -0.2,
                        decoration: TextDecoration.none,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 11.5,
                        color: isDark ? Colors.white60 : AppColors.textSecondary,
                        decoration: TextDecoration.none,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Divider(height: 1, thickness: 1, color: isDark ? Colors.white10 : AppColors.borderLight),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildModernInputField({
    required String label,
    required TextEditingController controller,
    String hint = '',
    TextInputType keyboardType = TextInputType.text,
    List<TextInputFormatter>? inputFormatters,
    Widget? suffix,
    Widget? prefixIcon,
    bool isRequired = false,
    bool isDark = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : AppColors.textPrimary,
                  decoration: TextDecoration.none,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (isRequired)
              const Text(
                ' *',
                style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 13, decoration: TextDecoration.none),
              ),
          ],
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF14121F) : AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? Colors.white12 : AppColors.borderLight,
              width: 1.1,
            ),
          ),
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            inputFormatters: inputFormatters,
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white : AppColors.textPrimary,
              decoration: TextDecoration.none,
            ),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(
                color: isDark ? Colors.white38 : AppColors.textSecondary,
                fontSize: 12.5,
                fontWeight: FontWeight.normal,
              ),
              prefixIcon: prefixIcon,
              suffixIcon: suffix,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              isDense: true,
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<HostOnboardingProvider>(context);
    final isRv = provider.propertyType == 'RV';
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final fullGeneratedAddress = _computeFullAddress();

    return Material(
      type: MaterialType.transparency,
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ─── Header ───
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF6366F1).withValues(alpha: 0.35),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(isRv ? Icons.rv_hookup_rounded : Icons.location_on_rounded, color: Colors.white, size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isRv ? 'RV Depot & Pickup Location Map' : 'Location & Entrance Map',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white : AppColors.textPrimary,
                          letterSpacing: -0.5,
                          decoration: TextDecoration.none,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        isRv
                            ? 'Pinpoint base station, depot, or pickup point for vehicle handovers.'
                            : 'Pinpoint exact gate & structured address for guest check-ins.',
                        style: TextStyle(
                          fontSize: 12, 
                          color: isDark ? Colors.white60 : AppColors.textSecondary, 
                          height: 1.3,
                          decoration: TextDecoration.none,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ).animate().fadeIn().slideX(),

            const SizedBox(height: 18),

            // ─── Quick Actions Bar (GPS & Search Place) ───
            Row(
              children: [
                Expanded(
                  child: BouncingWidget(
                    onTap: _isGettingGps ? null : _useCurrentGpsLocation,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF10B981), Color(0xFF059669)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF10B981).withValues(alpha: 0.28),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _isGettingGps
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.my_location_rounded, color: Colors.white, size: 18),
                          const SizedBox(width: 8),
                          Text(
                            _isGettingGps ? 'Locating...' : 'Auto-Detect GPS',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white, decoration: TextDecoration.none),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: BouncingWidget(
                    onTap: _openLocationSearchSheet,
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF261842) : AppColors.primary.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.primary.withValues(alpha: 0.35), width: 1.2),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.search_rounded, color: AppColors.primary, size: 18),
                          SizedBox(width: 8),
                          Text(
                            'Search Landmark',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.primary, decoration: TextDecoration.none),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ).animate().fadeIn(duration: 350.ms),

            const SizedBox(height: 18),

            // ─── TOP SECTION: Interactive Pinpoint Map & Security Gate ───
            Consumer<HostOnboardingProvider>(
              builder: (context, provider, child) {
                final double lat = (provider.latitude != null && provider.latitude != 0.0) ? provider.latitude! : 28.6139;
                final double lng = (provider.longitude != null && provider.longitude != 0.0) ? provider.longitude! : 77.2090;

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Interactive Gate & Pinpoint Map',
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : AppColors.textPrimary,
                            letterSpacing: -0.2,
                            decoration: TextDecoration.none,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${lat.toStringAsFixed(4)}°, ${lng.toStringAsFixed(4)}°',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary, decoration: TextDecoration.none),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Drag the pin or tap anywhere to set the exact gate for arriving guests.',
                      style: TextStyle(
                        fontSize: 11.5, 
                        color: isDark ? Colors.white60 : AppColors.textSecondary,
                        decoration: TextDecoration.none,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      height: 220,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF14121F) : AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isDark ? Colors.white.withValues(alpha: 0.12) : AppColors.borderLight,
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.06),
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
                              target: LatLng(lat, lng),
                              zoom: 16.0,
                            ),
                            onMapCreated: (controller) => _mapController = controller,
                            markers: {
                              Marker(
                                markerId: const MarkerId('propertyLocation'),
                                position: LatLng(lat, lng),
                                draggable: true,
                                infoWindow: InfoWindow(
                                  title: provider.title.isNotEmpty ? provider.title : 'Property Entrance',
                                  snippet: fullGeneratedAddress.isNotEmpty ? fullGeneratedAddress : '${provider.city}, ${provider.state}',
                                ),
                                onDragEnd: (newPosition) {
                                  provider.updateLocation(
                                    lat: newPosition.latitude,
                                    lng: newPosition.longitude,
                                  );
                                  _reverseGeocodeCoordinate(newPosition);
                                },
                              ),
                            },
                            circles: {
                              Circle(
                                circleId: const CircleId('propertyRadius'),
                                center: LatLng(lat, lng),
                                radius: 200,
                                fillColor: AppColors.primary.withValues(alpha: 0.15),
                                strokeColor: AppColors.primary,
                                strokeWidth: 2,
                              ),
                            },
                            onTap: (newPosition) {
                              provider.updateLocation(
                                lat: newPosition.latitude,
                                lng: newPosition.longitude,
                              );
                              _reverseGeocodeCoordinate(newPosition);
                              _mapController?.animateCamera(CameraUpdate.newLatLng(newPosition));
                            },
                            gestureRecognizers: <Factory<OneSequenceGestureRecognizer>>{
                              Factory<OneSequenceGestureRecognizer>(
                                () => EagerGestureRecognizer(),
                              ),
                            },
                            zoomControlsEnabled: false,
                            myLocationButtonEnabled: false,
                          ),

                          // Floating Recenter Button
                          Positioned(
                            bottom: 12,
                            right: 12,
                            child: FloatingActionButton.small(
                              heroTag: 'recenter_map',
                              onPressed: () {
                                _mapController?.animateCamera(
                                  CameraUpdate.newLatLngZoom(LatLng(lat, lng), 16.5),
                                );
                              },
                              backgroundColor: isDark ? const Color(0xFF1E1C2A) : Colors.white,
                              foregroundColor: AppColors.primary,
                              elevation: 4,
                              child: const Icon(Icons.gps_fixed_rounded, size: 20),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ).animate().fadeIn(duration: 400.ms),

            const SizedBox(height: 20),

            // ─── RV SPECIFIC CARD: Pickup Location & Depot Hub ───
            if (isRv) ...[
              _buildCardContainer(
                title: 'RV Pickup Location & Depot Hub',
                subtitle: 'The primary base station or depot where guests collect or return the RV.',
                icon: Icons.rv_hookup_rounded,
                isDark: isDark,
                children: [
                  _buildModernInputField(
                    label: 'RV Pickup Hub / Depot Address',
                    controller: _pickupLocationController,
                    hint: 'e.g. North Goa Airport Depot, Bay 4 / Central RV Station',
                    isRequired: true,
                    isDark: isDark,
                    prefixIcon: const Icon(Icons.rv_hookup_rounded, color: AppColors.primary, size: 18),
                  ),
                ],
              ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.05),
            ],

            // ─── CARD 1: Unit & Building Details ───
            _buildCardContainer(
              title: isRv ? '1. RV Parking Hub / Base Depot Details' : '1. Unit & Building Details',
              subtitle: isRv ? 'Depot bay, garage plot, or parking complex details.' : 'House, flat, villa number and society complex name.',
              icon: isRv ? Icons.garage_rounded : Icons.apartment_rounded,
              isDark: isDark,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 1,
                      child: _buildModernInputField(
                        label: isRv ? 'Bay / Plot / Garage No.' : 'House / Flat / Villa No.',
                        controller: _houseNoController,
                        hint: isRv ? 'e.g. Bay 4, Plot 12' : 'e.g. Villa 4B, Flat 302',
                        isRequired: true,
                        isDark: isDark,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      flex: 1,
                      child: _buildModernInputField(
                        label: isRv ? 'Section (Optional)' : 'Floor (Optional)',
                        controller: _floorController,
                        hint: isRv ? 'e.g. Section B' : 'e.g. 3rd Floor, Ground',
                        isDark: isDark,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _buildModernInputField(
                  label: isRv ? 'Zone / Bay (Optional)' : 'Tower / Wing (Optional)',
                  controller: _towerController,
                  hint: isRv ? 'e.g. Zone East, Bay A' : 'e.g. Tower 2, Wing A',
                  isDark: isDark,
                ),
                const SizedBox(height: 14),
                _buildModernInputField(
                  label: isRv ? 'Base Station / Depot / Facility Name' : 'Society / Building / Project Name',
                  controller: _buildingController,
                  hint: isRv ? 'e.g. Aero RV Hub, Horizon Camper Base' : 'e.g. Sun & Sand Enclave, Palm Heights',
                  isRequired: true,
                  isDark: isDark,
                ),
              ],
            ).animate().fadeIn(delay: 150.ms).slideY(begin: 0.05),

            // ─── CARD 2: Street, Sector & Landmark ───
            _buildCardContainer(
              title: '2. Street, Sector & Landmark',
              subtitle: 'Road name, sector, and nearby prominent attraction.',
              icon: Icons.signpost_rounded,
              isDark: isDark,
              children: [
                _buildModernInputField(
                  label: 'Street / Road / Lane Name',
                  controller: _streetAddressController,
                  hint: 'e.g. Main Calangute Beach Road, 4th Cross Lane',
                  isRequired: true,
                  isDark: isDark,
                ),
                const SizedBox(height: 14),
                _buildModernInputField(
                  label: 'Locality / Sector / Neighborhood',
                  controller: _areaLocalityController,
                  hint: 'e.g. Calangute Beach Area / Sector 45 / Koramangala',
                  isRequired: true,
                  isDark: isDark,
                ),
                const SizedBox(height: 14),
                _buildModernInputField(
                  label: 'Nearby Landmark / Famous Attraction',
                  controller: _landmarkController,
                  hint: 'e.g. Behind St. Anthony Chapel / Opp. Vivanta Resort',
                  isRequired: true,
                  isDark: isDark,
                  prefixIcon: const Icon(Icons.pin_drop_rounded, color: AppColors.primary, size: 18),
                ),
              ],
            ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.05),

            // ─── CARD 3: Pincode, City & State ───
            _buildCardContainer(
              title: '3. Postal Code, City & State',
              subtitle: 'Enter 6-digit pincode for instant region auto-fill.',
              icon: Icons.location_city_rounded,
              isDark: isDark,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 5,
                      child: _buildModernInputField(
                        label: '6-Digit Pincode',
                        controller: _pincodeController,
                        hint: 'e.g. 403516',
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(6),
                        ],
                        isRequired: true,
                        isDark: isDark,
                        suffix: _isLoadingPincode
                            ? const Padding(
                                padding: EdgeInsets.all(12),
                                child: SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 5,
                      child: _buildModernInputField(
                        label: 'City / District',
                        controller: _cityController,
                        hint: 'e.g. North Goa',
                        isRequired: true,
                        isDark: isDark,
                      ),
                    ),
                  ],
                ),

                if (_detectedPincodeInfo != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.verified_rounded, color: Color(0xFF10B981), size: 14),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Verified Post Office: $_detectedPincodeInfo',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF059669), decoration: TextDecoration.none),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 14),

                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 5,
                      child: _buildModernInputField(
                        label: 'State / Union Territory',
                        controller: _stateController,
                        hint: 'e.g. Goa',
                        isRequired: true,
                        isDark: isDark,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 5,
                      child: _buildModernInputField(
                        label: 'Country',
                        controller: _countryController,
                        hint: 'e.g. India',
                        isRequired: true,
                        isDark: isDark,
                      ),
                    ),
                  ],
                ),
              ],
            ).animate().fadeIn(delay: 250.ms).slideY(begin: 0.05),

            // ─── CARD 4: Live Formatted Address Preview ───
            if (fullGeneratedAddress.isNotEmpty) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 20),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: isDark
                        ? [const Color(0xFF1E1C2A), const Color(0xFF261842)]
                        : [const Color(0xFFF5F3FF), const Color(0xFFEDE9FE)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.35), width: 1.2),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.directions_car_filled_rounded, color: AppColors.primary, size: 18),
                            SizedBox(width: 8),
                            Text(
                              'Formatted Guest Address Preview',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w800,
                                color: AppColors.primary,
                                decoration: TextDecoration.none,
                              ),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.copy_rounded, size: 16, color: AppColors.primary),
                          tooltip: 'Copy Full Address',
                          onPressed: () {
                            Clipboard.setData(ClipboardData(text: fullGeneratedAddress));
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Address copied to clipboard!')),
                            );
                          },
                          constraints: const BoxConstraints(),
                          padding: EdgeInsets.zero,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      fullGeneratedAddress,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : AppColors.textPrimary,
                        height: 1.45,
                        decoration: TextDecoration.none,
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 300.ms),
            ],

            const SizedBox(height: 36),
          ],
        ),
      ),
    );
  }
}

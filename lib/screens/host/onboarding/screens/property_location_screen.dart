import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:http/http.dart' as http;
import 'package:google_maps_flutter/google_maps_flutter.dart';
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
  late TextEditingController _addressController;
  late TextEditingController _cityController;
  late TextEditingController _stateController;
  GoogleMapController? _mapController;

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    _addressController = TextEditingController(text: provider.address);
    _cityController = TextEditingController(text: provider.city);
    _stateController = TextEditingController(text: provider.state);

    _addressController.addListener(_updateProvider);
    _cityController.addListener(_updateProvider);
    _stateController.addListener(_updateProvider);
  }

  void _updateProvider() async {
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    
    double lat = provider.latitude ?? 28.6139;
    double lng = provider.longitude ?? 77.2090;

    provider.updateLocation(
      _addressController.text,
      _cityController.text,
      _stateController.text,
      lat,
      lng,
    );

    if (_cityController.text.isNotEmpty && _stateController.text.isNotEmpty && _addressController.text.isNotEmpty) {
      try {
        final url = Uri.parse('https://nominatim.openstreetmap.org/search?q=${Uri.encodeComponent(_cityController.text)},${Uri.encodeComponent(_stateController.text)}&format=json&limit=1');
        final response = await http.get(url, headers: {'User-Agent': 'StayQ-App/1.0'});
        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          if (data.isNotEmpty) {
            lat = double.parse(data[0]['lat']);
            lng = double.parse(data[0]['lon']);
            provider.updateLocation(
              _addressController.text,
              _cityController.text,
              _stateController.text,
              lat,
              lng,
            );
            _mapController?.animateCamera(CameraUpdate.newLatLngZoom(LatLng(lat, lng), 15));
          }
        }
      } catch (e) {
        // Ignore error and keep default lat/long
      }
    }
  }

  void _openLocationSearchSheet() {
    AppMotion.tapSelection();
    LocationSearchBottomSheet.show(
      context,
      onLocationSelected: (result) {
        final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
        _addressController.text = result.title;
        if (result.city.isNotEmpty) _cityController.text = result.city;
        if (result.state.isNotEmpty) _stateController.text = result.state;

        provider.updateLocation(
          result.title,
          result.city.isNotEmpty ? result.city : provider.city,
          result.state.isNotEmpty ? result.state : provider.state,
          result.lat != 0.0 ? result.lat : 28.6139,
          result.lng != 0.0 ? result.lng : 77.2090,
        );

        if (result.lat != 0.0 && result.lng != 0.0) {
          _mapController?.animateCamera(
            CameraUpdate.newLatLngZoom(LatLng(result.lat, result.lng), 15.5),
          );
        }
      },
    );
  }

  @override
  void dispose() {
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    super.dispose();
  }

  Widget _buildTextField(String label, TextEditingController controller, {String hint = ''}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: TextField(
              controller: controller,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
          ),
        ],
      ),
    ).animate().fade(duration: 400.ms).slideY(begin: 0.1, end: 0);
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Location & Pinpoint',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 6),
          const Text(
            'Where is your property located in India?',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 20),

          // Google Maps Autocomplete Search Trigger Card
          BouncingWidget(
            onTap: _openLocationSearchSheet,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF5A31F4), Color(0xFF7C3AED)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF5A31F4).withValues(alpha: 0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.search_rounded, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Search with Google Autocomplete',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Type town, landmark or use GPS location',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white, size: 16),
                ],
              ),
            ),
          ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),

          const SizedBox(height: 24),

          _buildTextField('Street / Area / Landmark', _addressController, hint: 'e.g. Near Calangute Beach Road'),
          Row(
            children: [
              Expanded(child: _buildTextField('City / Town', _cityController, hint: 'e.g. North Goa')),
              const SizedBox(width: 14),
              Expanded(child: _buildTextField('State', _stateController, hint: 'e.g. Goa')),
            ],
          ),
          
          const SizedBox(height: 8),

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
                      const Text(
                        'Interactive Map Pinpoint',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      TextButton.icon(
                        onPressed: _openLocationSearchSheet,
                        icon: const Icon(Icons.my_location_rounded, size: 16, color: AppColors.primary),
                        label: const Text('Change Location', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Container(
                    height: 240,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.borderLight, width: 1.5),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        )
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: GoogleMap(
                      initialCameraPosition: CameraPosition(
                        target: LatLng(lat, lng),
                        zoom: 14.5,
                      ),
                      onMapCreated: (controller) => _mapController = controller,
                      markers: {
                        Marker(
                          markerId: const MarkerId('propertyLocation'),
                          position: LatLng(lat, lng),
                          draggable: true,
                          infoWindow: InfoWindow(
                            title: provider.title.isNotEmpty ? provider.title : 'Your Property',
                            snippet: '${provider.address}, ${provider.city}',
                          ),
                          onDragEnd: (newPosition) {
                            provider.updateLocation(
                              provider.address,
                              provider.city,
                              provider.state,
                              newPosition.latitude,
                              newPosition.longitude,
                            );
                          },
                        ),
                      },
                      circles: {
                        Circle(
                          circleId: const CircleId('propertyRadius'),
                          center: LatLng(lat, lng),
                          radius: 350,
                          fillColor: AppColors.primary.withValues(alpha: 0.15),
                          strokeColor: AppColors.primary,
                          strokeWidth: 2,
                        ),
                      },
                      onTap: (newPosition) {
                        provider.updateLocation(
                          provider.address,
                          provider.city,
                          provider.state,
                          newPosition.latitude,
                          newPosition.longitude,
                        );
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
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: const [
                      Icon(Icons.touch_app_rounded, size: 16, color: AppColors.textSecondary),
                      SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Tap anywhere on map or drag the pin to set the exact property gate.',
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ),
                    ],
                  ),
                ],
              );
            },
          ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),

          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

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

class PropertyLocationScreen extends StatefulWidget {
  const PropertyLocationScreen({Key? key}) : super(key: key);

  @override
  State<PropertyLocationScreen> createState() => _PropertyLocationScreenState();
}

class _PropertyLocationScreenState extends State<PropertyLocationScreen> {
  late TextEditingController _addressController;
  late TextEditingController _cityController;
  late TextEditingController _stateController;

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
    
    double lat = provider.latitude ?? 0.0;
    double lng = provider.longitude ?? 0.0;

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
        final response = await http.get(url);
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
          }
        }
      } catch (e) {
        // Ignore error and keep default lat/long
      }
    }
  }

  @override
  void dispose() {
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    super.dispose();
  }

  Widget _buildTextField(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: TextField(
              controller: controller,
              decoration: const InputDecoration(
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Location',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 8),
          const Text(
            'Where is your property located?',
            style: TextStyle(
              fontSize: 16,
              color: AppColors.textSecondary,
            ),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 32),
          
          Consumer<HostOnboardingProvider>(
            builder: (context, provider, child) {
              final lat = provider.latitude ?? 0.0;
              final lng = provider.longitude ?? 0.0;
              final showMap = lat != 0.0 && lng != 0.0;

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Pinpoint exactly on map',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    height: 250,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.borderLight, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withOpacity(0.05),
                          blurRadius: 10,
                          spreadRadius: 2,
                        )
                      ]
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: showMap
                        ? GoogleMap(
                            initialCameraPosition: CameraPosition(
                              target: LatLng(lat, lng),
                              zoom: 15,
                            ),
                            markers: {
                              Marker(
                                markerId: const MarkerId('propertyLocation'),
                                position: LatLng(lat, lng),
                                draggable: true,
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
                            onTap: (newPosition) {
                               provider.updateLocation(
                                provider.address,
                                provider.city,
                                provider.state,
                                newPosition.latitude,
                                newPosition.longitude,
                              );
                            },
                            myLocationEnabled: false,
                            myLocationButtonEnabled: false,
                            mapToolbarEnabled: false,
                            zoomControlsEnabled: false,
                            gestureRecognizers: {
                              Factory<OneSequenceGestureRecognizer>(
                                () => EagerGestureRecognizer(),
                              ),
                            },
                          )
                        : InkWell(
                            onTap: () {
                              // Default to a central location when tapped to start pinning
                              provider.updateLocation(provider.address, provider.city, provider.state, 28.6139, 77.2090);
                            },
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.location_on, size: 48, color: AppColors.primary)
                                      .animate(onPlay: (controller) => controller.repeat())
                                      .shimmer(duration: 1200.ms, color: AppColors.primaryLight)
                                      .moveY(begin: -5, end: 5, duration: 1000.ms, curve: Curves.easeInOut)
                                      .then()
                                      .moveY(begin: 5, end: -5, duration: 1000.ms, curve: Curves.easeInOut),
                                  const SizedBox(height: 16),
                                  const Text(
                                    'Tap to Pin Location',
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                  ),

                  if (showMap) ...[
                    const SizedBox(height: 32),
                    const Text(
                      'Confirm Address Details',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ).animate().fadeIn().slideX(),
                    const SizedBox(height: 16),
                    _buildTextField('Street Address', _addressController),
                    _buildTextField('City', _cityController),
                    _buildTextField('State / Province', _stateController),
                  ],
                ],
              ).animate().fadeIn().slideY(begin: 0.1, end: 0);
            },
          ),
          
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primaryLight.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.primaryLight.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: AppColors.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Your exact location will only be shared with guests after their booking is confirmed.',
                    style: TextStyle(fontSize: 13, color: AppColors.primaryDark),
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 300.ms),
        ],
      ),
    );
  }
}

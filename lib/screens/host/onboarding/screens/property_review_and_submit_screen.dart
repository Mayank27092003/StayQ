import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../../../providers/host_onboarding_provider.dart';

class PropertyReviewAndSubmitScreen extends StatelessWidget {
  const PropertyReviewAndSubmitScreen({Key? key}) : super(key: key);

  String _maskAccount(String account) {
    if (account.length <= 4) return '****';
    return '*' * (account.length - 4) + account.substring(account.length - 4);
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<HostOnboardingProvider>(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Review & Submit',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.black87),
          ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.1, end: 0),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, spreadRadius: 5)
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Title: ${provider.title}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text('Property Type: ${provider.propertyType}', style: const TextStyle(fontSize: 14)),
                const SizedBox(height: 4),
                Text(
                  'Stay Type: ${provider.isStayingWithHost ? "Staying with Host (Homestay / Co-Living)" : "Entire Place (100% Private)"}',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF2563EB)),
                ),
                const SizedBox(height: 4),
                Text('Location: ${provider.city}, ${provider.state}', style: const TextStyle(fontSize: 14)),
                const SizedBox(height: 4),
                Text('Price per night: ₹${provider.pricePerNight}', style: const TextStyle(fontSize: 14)),
                const SizedBox(height: 4),
                Text('Max Guests: ${provider.maxGuests}', style: const TextStyle(fontSize: 14)),
                const SizedBox(height: 12),
                
                if (provider.amenities.isNotEmpty) ...[
                  const Text('Amenities:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  Text(provider.amenities.join(', '), style: const TextStyle(fontSize: 14)),
                  const SizedBox(height: 8),
                ],
                
                if (provider.tags.isNotEmpty) ...[
                  const Text('Tags:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  Text(provider.tags.join(', '), style: const TextStyle(fontSize: 14)),
                  const SizedBox(height: 8),
                ],
                
                Text('Photos: ${provider.localPhotoPaths.length}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                if (provider.localPhotoPaths.isNotEmpty)
                  SizedBox(
                    height: 60,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: provider.localPhotoPaths.length,
                      itemBuilder: (context, i) => Padding(
                        padding: const EdgeInsets.only(right: 8, top: 8),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.file(File(provider.localPhotoPaths[i]), width: 60, height: 60, fit: BoxFit.cover),
                        ),
                      ),
                    ),
                  ),
                const SizedBox(height: 12),
                
                const Text('Policies:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                Text('Cancellation: ${provider.cancellationPolicy}', style: const TextStyle(fontSize: 14)),
                Text('Pets Allowed: ${provider.petsAllowed ? "Yes" : "No"}', style: const TextStyle(fontSize: 14)),
                const SizedBox(height: 12),

                const Text('Bank Details:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                Text('A/C No: ${_maskAccount(provider.accountNumber)}', style: const TextStyle(fontSize: 14)),

                const SizedBox(height: 12),
              ],
            ),
          ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),
        ],
      ),
    );
  }
}

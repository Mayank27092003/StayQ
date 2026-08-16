import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import '../models/stay_model.dart';

class HostListingsProvider extends ChangeNotifier {
  bool _isLoading = false;
  String? _error;
  List<StayModel> _listings = [];

  bool get isLoading => _isLoading;
  String? get error => _error;
  List<StayModel> get listings => _listings;

  Future<void> fetchHostListings(String hostId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      const String apiUrl = 'https://stayq-api-608570851336.asia-south1.run.app';
      final token = await FirebaseAuth.instance.currentUser?.getIdToken();
      final headers = token != null ? {'Authorization': 'Bearer $token'} : <String, String>{};

      final response = await http.get(Uri.parse('$apiUrl/api/v1/properties/host/$hostId'), headers: headers);
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as List;
        _listings = data.map((json) => StayModel.fromJson(json)).toList();
      } else {
        _error = 'Failed to load properties. Status: ${response.statusCode}';
      }
    } catch (e) {
      _error = 'Failed to connect to the server.';
      _listings = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> toggleListingStatus(String propertyId, String currentStatus, String hostId) async {
    final newStatus = currentStatus == 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    
    // Optimistic UI update
    final index = _listings.indexWhere((l) => l.id == propertyId);
    if (index != -1) {
      try {
        const String apiUrl = 'https://stayq-api-608570851336.asia-south1.run.app';
        final token = await FirebaseAuth.instance.currentUser?.getIdToken();
        final headers = token != null ? {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'} : <String, String>{'Content-Type': 'application/json'};
        
        await http.patch(
          Uri.parse('$apiUrl/api/v1/properties/$propertyId'),
          headers: headers,
          body: jsonEncode({'status': newStatus}),
        );
        
        await fetchHostListings(hostId);
      } catch (e) {
        _error = 'Failed to update status';
        notifyListeners();
      }
    }
  }
  Future<void> deleteListing(String propertyId, String hostId) async {
    final index = _listings.indexWhere((l) => l.id == propertyId);
    if (index != -1) {
      _listings.removeAt(index);
      notifyListeners();
      
      // Attempt API deletion
      try {
        const String apiUrl = 'https://stayq-api-608570851336.asia-south1.run.app';
        final token = await FirebaseAuth.instance.currentUser?.getIdToken();
        final headers = token != null ? {'Authorization': 'Bearer $token'} : <String, String>{};
        await http.delete(Uri.parse('$apiUrl/api/v1/properties/$propertyId'), headers: headers);
      } catch (e) {
        _error = 'Failed to delete from server';
      }
    }
  }
}

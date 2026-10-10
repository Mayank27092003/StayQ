import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/stay_model.dart';
import '../models/json_values.dart';
import '../services/api/api_client.dart';

class HostListingsProvider extends ChangeNotifier {
  String? _ownerId;
  bool _disposed = false;
  int _generation = 0;
  HostListingsProvider({String? userId}) : _ownerId = userId;
  bool _isLoading = false;
  String? _error;
  List<StayModel> _listings = [];
  bool get _owned => !_disposed && _ownerId != null && FirebaseAuth.instance.currentUser?.uid == _ownerId;
  void updateUserId(String? userId) {
    if (_ownerId == userId) return;
    _ownerId = userId;
    if (userId != null) {
      fetchHostListings(userId);
    } else {
      _listings = [];
      notifyListeners();
    }
  }
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<StayModel> get listings => List.unmodifiable(_listings);
  @override
  void notifyListeners() { if (!_disposed) super.notifyListeners(); }
  @override
  void dispose() { _disposed = true; super.dispose(); }
  void _requireOwner(String hostId) {
    if (!_owned || hostId != _ownerId) throw ApiException(401, 'Sign in to manage your listings.');
  }
  Future<void> fetchHostListings(String hostId) async {
    if (!_owned || hostId != _ownerId) return;
    final request = ++_generation;
    _isLoading = true; _error = null; notifyListeners();
    try {
      final response = await ApiClient.instance.get('/properties/host/${Uri.encodeComponent(hostId)}');
      if (!_owned || request != _generation) return;
      final records = response is List ? response : jsonMap(response)['properties'];
      if (records is! List) throw const FormatException('Invalid listings response.');
      final parsed = <StayModel>[];
      for (final record in records) {
        try { parsed.add(StayModel.fromJson(jsonMap(record))); }
        catch (e) { debugPrint('Invalid listing: $e'); }
      }
      _listings = parsed;
    } catch (e) { if (_owned && request == _generation) _error = e.toString(); }
    finally { if (_owned && request == _generation) { _isLoading = false; notifyListeners(); } }
  }
  Future<void> toggleListingStatus(String propertyId, String currentStatus, String hostId) async {
    _requireOwner(hostId);
    await ApiClient.instance.patch('/properties/${Uri.encodeComponent(propertyId)}', body: {
      'status': currentStatus.toUpperCase() == 'ACTIVE' ? 'PAUSED' : 'ACTIVE',
    });
    if (_owned) await fetchHostListings(hostId);
  }
  Future<void> deleteListing(String propertyId, String hostId) async {
    _requireOwner(hostId);
    await ApiClient.instance.delete('/properties/${Uri.encodeComponent(propertyId)}');
    if (_owned) { _listings.removeWhere((l) => l.id == propertyId); notifyListeners(); }
  }
}

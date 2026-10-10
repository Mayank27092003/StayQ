import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/json_values.dart';
import '../services/api/api_client.dart';
import '../services/api/bookings_api.dart';
import '../models/booking_model.dart';

class HostDashboardProvider extends ChangeNotifier {
  String? _ownerId;
  bool _disposed = false;
  int _generation = 0;
  HostDashboardProvider({String? userId}) : _ownerId = userId;
  bool get _owned => !_disposed && _ownerId != null && FirebaseAuth.instance.currentUser?.uid == _ownerId;
  void updateUserId(String? userId) {
    if (_ownerId == userId) return;
    _ownerId = userId;
    if (userId != null) {
      fetchDashboardData(userId);
    }
  }
  @override
  void notifyListeners() { if (!_disposed) super.notifyListeners(); }
  @override
  void dispose() { _disposed = true; super.dispose(); }

  bool _isLoading = false;
  String? _error;

  String _hostName = '';
  String _hostAvatar = '';
  bool _isStarHost = false;
  bool _isPayoutVerified = false;
  bool _isHostVerified = false;
  bool _isApproved = false;
  String _hostStatus = 'PENDING';
  int _activeListings = 0;
  int _totalListings = 0;
  int _totalRooms = 0;
  double _occupancyRate = 0.0;
  double _rating = 0.0;
  int _reviewCount = 0;
  double _earningsThisMonth = 0;
  double _totalEarningsAllTime = 0;
  List<BookingModel> _upcomingGuests = [];
  List<BookingModel> _recentRequests = [];
  List<Map<String, dynamic>> _earningsData = [];
  List<Map<String, dynamic>> _bookingsData = [];
  List<Map<String, dynamic>> _viewsData = [];
  String _selectedChartType = 'Earnings';

  bool get isLoading => _isLoading;
  String? get error => _error;
  String get hostName => _hostName;
  String get hostAvatar => _hostAvatar;
  bool get isStarHost => _isStarHost;
  bool get isPayoutVerified => _isPayoutVerified;
  bool get isHostVerified => _isHostVerified;
  bool get isApproved => _isApproved;
  String get hostStatus => _hostStatus;
  int get activeListings => _activeListings;
  int get totalListings => _totalListings;
  int get totalRooms => _totalRooms;
  double get occupancyRate => _occupancyRate;
  double get rating => _rating;
  int get reviewCount => _reviewCount;
  double get earningsThisMonth => _earningsThisMonth;
  double get totalEarningsAllTime => _totalEarningsAllTime;
  List<BookingModel> get upcomingGuests => _upcomingGuests;
  List<BookingModel> get recentRequests => _recentRequests;
  
  String get selectedChartType => _selectedChartType;
  
  List<Map<String, dynamic>> get chartData {
    switch (_selectedChartType) {
      case 'Bookings':
        return _bookingsData;
      case 'Views':
        return _viewsData;
      case 'Earnings':
      default:
        return _earningsData;
    }
  }

  void setChartType(String type) {
    if (['Earnings', 'Bookings', 'Views'].contains(type)) {
      _selectedChartType = type;
      notifyListeners();
    }
  }

  Future<void> fetchDashboardData(String hostId) async {
    if (!_owned || hostId != _ownerId) return;
    final request = ++_generation;
    _isLoading = true; _error = null; notifyListeners();
    try {
      final data = jsonMap(await ApiClient.instance.get('/host-dashboard/${Uri.encodeComponent(hostId)}'));
      if (!_owned || request != _generation) return;
      _hostName = data['hostName']?.toString() ?? ''; _hostAvatar = data['hostAvatar']?.toString() ?? '';
      _isStarHost = data['isStarHost'] == true || data['isSuperhost'] == true;
      _isPayoutVerified = data['isPayoutVerified'] == true; _isApproved = data['isApproved'] == true;
      _isHostVerified = data['isHostVerified'] == true; _hostStatus = data['hostStatus']?.toString() ?? 'PENDING';
      _activeListings = jsonInt(data['activeListings']); _totalListings = jsonInt(data['totalListings']);
      _totalRooms = jsonInt(data['totalRooms']); _occupancyRate = jsonDouble(data['occupancyRate']);
      _rating = jsonDouble(data['rating']); _reviewCount = jsonInt(data['reviewCount']);
      _earningsThisMonth = jsonDouble(data['earningsThisMonth']); _totalEarningsAllTime = jsonDouble(data['totalEarningsAllTime']);
      List<BookingModel> bookings(dynamic items) {
        final values = <BookingModel>[];
        for (final item in items is List ? items : []) {
          try { values.add(BookingModel.fromJson(jsonMap(item))); } catch (e) { debugPrint('Invalid host booking: $e'); }
        }
        return values;
      }
      _upcomingGuests = bookings(data['upcomingGuests']); _recentRequests = bookings(data['recentRequests']);
      final charts = jsonMap(data['chartData']);
      List<Map<String, dynamic>> rows(dynamic items) => items is List ? items.map(jsonMap).toList() : [];
      _earningsData = rows(charts['earnings']); _bookingsData = rows(charts['bookings']); _viewsData = rows(charts['views']);
    } catch (e) { if (_owned && request == _generation) _error = e.toString(); }
    finally { if (_owned && request == _generation) { _isLoading = false; notifyListeners(); } }
  }

  Future<void> updateBookingStatus(String bookingId, String newStatus) async {
    if (!_owned) throw ApiException(401, 'Sign in to manage bookings.');
    await BookingsApi(ApiClient.instance).updateBookingStatus(bookingId, newStatus.toLowerCase());
    if (_owned) await fetchDashboardData(_ownerId!);
  }
}

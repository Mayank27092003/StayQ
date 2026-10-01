import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import '../models/stay_model.dart';
import '../models/booking_model.dart';

class HostDashboardProvider extends ChangeNotifier {
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
  bool get isApproved => _isApproved || _isHostVerified || _activeListings > 0;
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
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      const String apiUrl = 'https://stayq-api-608570851336.asia-south1.run.app';
      final token = await FirebaseAuth.instance.currentUser?.getIdToken();
      final headers = token != null ? {'Authorization': 'Bearer $token'} : <String, String>{};

      final response = await http.get(Uri.parse('$apiUrl/api/v1/host-dashboard/$hostId'), headers: headers);
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        _hostName = data['hostName'] ?? '';
        _hostAvatar = data['hostAvatar'] ?? '';
        _isStarHost = data['isStarHost'] == true || data['isSuperhost'] == true;
        _isPayoutVerified = data['isPayoutVerified'] == true;
        _isApproved = data['isApproved'] == true;
        _isHostVerified = data['isHostVerified'] == true;
        _hostStatus = data['hostStatus'] ?? (_isApproved ? 'APPROVED' : 'PENDING');
        _activeListings = (data['activeListings'] as num?)?.toInt() ?? 0;
        _totalListings = (data['totalListings'] as num?)?.toInt() ?? 0;
        _totalRooms = (data['totalRooms'] as num?)?.toInt() ?? 0;
        _occupancyRate = (data['occupancyRate'] as num?)?.toDouble() ?? 0.0;
        _rating = (data['rating'] as num?)?.toDouble() ?? 0.0;
        _reviewCount = (data['reviewCount'] as num?)?.toInt() ?? 0;
        _earningsThisMonth = (data['earningsThisMonth'] as num?)?.toDouble() ?? 0.0;
        _totalEarningsAllTime = (data['totalEarningsAllTime'] as num?)?.toDouble() ?? _earningsThisMonth;
        
        if (data['upcomingGuests'] != null) {
          _upcomingGuests = (data['upcomingGuests'] as List)
              .map((json) => BookingModel.fromJson(json))
              .toList();
        }
        
        if (data['recentRequests'] != null) {
          _recentRequests = (data['recentRequests'] as List)
              .map((json) => BookingModel.fromJson(json))
              .toList();
        }
        
        if (data['chartData'] != null) {
          final charts = data['chartData'];
          if (charts['earnings'] != null) {
            _earningsData = List<Map<String, dynamic>>.from(charts['earnings']);
          }
          if (charts['bookings'] != null) {
            _bookingsData = List<Map<String, dynamic>>.from(charts['bookings']);
          }
          if (charts['views'] != null) {
            _viewsData = List<Map<String, dynamic>>.from(charts['views']);
          }
        }
      } else {
        _error = 'Failed to load dashboard data. Status: ${response.statusCode}';
      }
    } catch (e) {
      _error = 'Failed to connect to the server. $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateBookingStatus(String bookingId, String newStatus) async {
    // Optimistic UI update
    final index = _recentRequests.indexWhere((b) => b.id == bookingId);
    if (index != -1) {
      BookingStatus mappedStatus = (newStatus == 'confirmed') ? BookingStatus.confirmed : BookingStatus.cancelled;
      _recentRequests[index].status = mappedStatus;
      notifyListeners();
    }

    try {
      final user = FirebaseAuth.instance.currentUser;
      final token = await user?.getIdToken();
      final url = Uri.parse('https://stayq-api-608570851336.asia-south1.run.app/api/v1/bookings/$bookingId/status');
      await http.patch(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'status': newStatus.toUpperCase()}),
      );
    } catch (e) {
      debugPrint('Error updating booking status on server: $e');
    }
  }
}

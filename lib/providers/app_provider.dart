import 'dart:math' as math;
import 'dart:async';
import '../services/session_store.dart';
import '../services/api/api_client.dart';
import '../services/api/bookings_api.dart';
import '../models/json_values.dart';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:http/http.dart' as http;
import '../models/stay_model.dart';
import '../models/booking_model.dart';
import '../models/booking_party.dart';
import '../services/push_notification_service.dart';




class AppProvider extends ChangeNotifier {
  FirebaseAuth? _auth;
  StreamSubscription<User?>? _authSubscription;
  bool _disposed = false;
  String? _autoVerifiedPhone;
  String? _pendingPhone;
  int _phoneRequest = 0;
  String? _sessionError;
  String? get sessionError => _sessionError;
  bool _sameUser(String? uid) => !_disposed && uid != null && uid == _userId && uid == _auth?.currentUser?.uid;
  @override
  void notifyListeners() { if (!_disposed) super.notifyListeners(); }
  @override
  void dispose() { _disposed = true; _authSubscription?.cancel(); super.dispose(); }


  // User & Auth State
  bool _isLoggedIn = false;
  bool _isHostMode = false;
  int _currentTabIndex = 0;
  bool _hasSeenWalkthrough = false;

  int get currentTabIndex => _currentTabIndex;

  void setTabIndex(int index) {
    if (_currentTabIndex != index) {
      _currentTabIndex = index;
      notifyListeners();
    }
  }
  String _userName = '';
  String _userEmail = '';
  String _userPhone = '';
  String _userAvatar = '';
  String _userBio = '';
  String _userLocation = '';
  String _userGender = '';
  String _userDob = '';
  bool _isEmailVerified = false;
  String? _userId;

  // Verified Identity & KYC Credentials State
  bool _isGovIdVerified = false;
  String _verifiedGovIdType = '';
  String _verifiedGovIdNumber = '';
  String _verifiedFullName = '';
  String _verifiedAddress = '';
  String _verifiedDob = '';
  bool _isAadhaarVerified = false;
  bool _isPanVerified = false;
  String _verifiedAadhaarNumber = '';
  String _verifiedPanNumber = '';
  bool _isBankVerified = false;
  String _verifiedBankName = '';
  String _verifiedAccountNumber = '';
  bool _isUpiVerified = false;
  String _verifiedUpiId = '';

  // Host Verification & Roles State
  bool _isHostVerified = false;
  List<String> _userRoles = [];
  String _hostStatus = '';

  bool get isHostVerified => _isHostVerified;
  List<String> get userRoles => _userRoles;
  String get hostStatus => _hostStatus;
  bool get isHost =>
      _userRoles.contains('HOST') ||
      _isHostVerified ||
      _hostStatus == 'APPROVED' ||
      _isHostMode ||
      hostListings.isNotEmpty;

  bool get isGovIdVerified => _isGovIdVerified || _isAadhaarVerified || _isPanVerified;
  bool get isAadhaarVerified => _isAadhaarVerified || (_isGovIdVerified && _verifiedGovIdType == 'AADHAAR');
  bool get isPanVerified => _isPanVerified || (_isGovIdVerified && _verifiedGovIdType == 'PAN');
  String get verifiedGovIdType => _verifiedGovIdType.isNotEmpty ? _verifiedGovIdType : (_isAadhaarVerified ? 'AADHAAR' : (_isPanVerified ? 'PAN' : ''));
  String get verifiedGovIdNumber => _verifiedGovIdNumber.isNotEmpty ? _verifiedGovIdNumber : (_isAadhaarVerified ? _verifiedAadhaarNumber : _verifiedPanNumber);
  String get verifiedAadhaarNumber => _verifiedAadhaarNumber.isNotEmpty ? _verifiedAadhaarNumber : (_verifiedGovIdType == 'AADHAAR' ? _verifiedGovIdNumber : '');
  String get verifiedPanNumber => _verifiedPanNumber.isNotEmpty ? _verifiedPanNumber : (_verifiedGovIdType == 'PAN' ? _verifiedGovIdNumber : '');
  String get verifiedFullName => _verifiedFullName;
  String get verifiedAddress => _verifiedAddress;
  String get verifiedDob => _verifiedDob;
  bool get isBankVerified => _isBankVerified;
  String get verifiedBankName => _verifiedBankName;
  String get verifiedAccountNumber => _verifiedAccountNumber;
  bool get isUpiVerified => _isUpiVerified;
  String get verifiedUpiId => _verifiedUpiId;
  
  // Phone Auth State
  String? _verificationId;
  bool _isLoadingAuth = false;

  bool get hasSeenWalkthrough => _hasSeenWalkthrough;

  // ─── StayQ Rewards & Loyalty State ───
  int _loyaltyTotalPoints = 0;
  int _loyaltyAvailablePoints = 0;
  int _loyaltyRedeemedPoints = 0;
  String _loyaltyTier = 'Q_STARTER';
  String _loyaltyTierTitle = 'Q Starter';
  double _loyaltyPointsMultiplier = 1.0;
  DateTime? _loyaltyTierExpiresAt;
  double _loyaltyCreditEquivalent = 0;
  List<Map<String, dynamic>> _loyaltyTransactions = [];
  bool _isLoadingLoyalty = false;

  // ─── StayQ Host Pro State ───
  bool _isHostPro = false;
  String _hostProPlan = '';
  DateTime? _hostProExpiresAt;

  int get loyaltyTotalPoints => _loyaltyTotalPoints;
  int get loyaltyAvailablePoints => _loyaltyAvailablePoints;
  int get loyaltyRedeemedPoints => _loyaltyRedeemedPoints;
  String get loyaltyTier => _loyaltyTier;
  String get loyaltyTierTitle => _loyaltyTierTitle;
  double get loyaltyPointsMultiplier => _loyaltyPointsMultiplier;
  DateTime? get loyaltyTierExpiresAt => _loyaltyTierExpiresAt;
  double get loyaltyCreditEquivalent => _loyaltyCreditEquivalent;
  List<Map<String, dynamic>> get loyaltyTransactions => _loyaltyTransactions;
  bool get isLoadingLoyalty => _isLoadingLoyalty;

  bool get isHostPro => _isHostPro;
  String get hostProPlan => _hostProPlan;
  DateTime? get hostProExpiresAt => _hostProExpiresAt;

  // Stays & Wishlist
  List<StayModel> _stays = [];
  List<StayModel> _experiences = [];
  List<BookingModel> _bookings = []; // Guest bookings
  List<BookingModel> _hostBookings = [];
  bool _loadingHostBookings = false;
  String? _hostBookingsError;
  bool get loadingHostBookings => _loadingHostBookings;
  String? get hostBookingsError => _hostBookingsError;
  
  // Search & Filter State
  String _searchDestination = '';
  double? _searchLatitude;
  double? _searchLongitude;
  double? get searchLatitude => _searchLatitude;
  double? get searchLongitude => _searchLongitude;
  void searchNearby(double latitude, double longitude) {
    if (!latitude.isFinite || !longitude.isFinite || latitude.abs() > 90 || longitude.abs() > 180) return;
    _searchLatitude = latitude; _searchLongitude = longitude; _searchDestination = 'Nearby'; notifyListeners();
  }
  double _distanceKm(double lat, double lng) {
    final a = _searchLatitude! * math.pi / 180, b = lat * math.pi / 180;
    final dLat = b - a, dLng = (lng - _searchLongitude!) * math.pi / 180;
    final h = math.pow(math.sin(dLat / 2), 2) + math.cos(a) * math.cos(b) * math.pow(math.sin(dLng / 2), 2);
    return 6371 * 2 * math.asin(math.sqrt(h.clamp(0, 1)));
  }
  DateTimeRange? _selectedDateRange = DateTimeRange(
    start: DateTime.now().add(const Duration(days: 3)),
    end: DateTime.now().add(const Duration(days: 8)),
  );
  int _adultsCount = 2;
  int _childrenCount = 0;
  int _infantsCount = 0;
  int _petsCount = 0;
  String _selectedCategory = 'All Stays';
  double _minPrice = 500;
  double _maxPrice = 50000;
  bool _searchExperiencesOnly = false;
  bool? _stayingWithHostFilter;

  bool? get stayingWithHostFilter => _stayingWithHostFilter;
  ThemeMode _themeMode = ThemeMode.light;

  AppProvider() {
    try { _auth = FirebaseAuth.instance; } catch (_) {}
    unawaited(_initialize());
  }


  Future<void> _initialize() async {
    await SessionStore.clearLegacy();
    await _initPrefs();
    if (_disposed) return;
    _initAuth();
    await fetchStays();
  }

  void _resetUserState() {
    _isLoggedIn = false; _userId = null; _isHostMode = false; _currentTabIndex = 0;
    _userName = ''; _userEmail = ''; _userPhone = ''; _userAvatar = '';
    _userBio = ''; _userLocation = ''; _userGender = ''; _userDob = '';
    _isEmailVerified = false; _isGovIdVerified = false; _isAadhaarVerified = false;
    _isPanVerified = false; _isBankVerified = false; _isUpiVerified = false;
    _verifiedGovIdType = ''; _verifiedGovIdNumber = ''; _verifiedFullName = '';
    _verifiedAddress = ''; _verifiedDob = ''; _verifiedAadhaarNumber = '';
    _verifiedPanNumber = ''; _verifiedBankName = ''; _verifiedAccountNumber = ''; _verifiedUpiId = '';
    _loyaltyTotalPoints = 0; _loyaltyAvailablePoints = 0; _loyaltyRedeemedPoints = 0;
    _loyaltyTier = 'Q_STARTER'; _loyaltyTierTitle = 'Q Starter'; _loyaltyPointsMultiplier = 1;
    _loyaltyTierExpiresAt = null; _loyaltyCreditEquivalent = 0; _loyaltyTransactions = [];
    _isLoadingLoyalty = false; _isHostPro = false; _hostProPlan = ''; _hostProExpiresAt = null;
    _referralBalance = 0; _userReferralCode = ''; _bookings = []; _hostBookings = [];
    _loadingHostBookings = false; _hostBookingsError = null;
    _redeemingPoints = false; _redemptionKey = null; _redemptionPoints = null;
    _sessionError = null;
    for (final stay in _stays) { stay.isWishlisted = false; }
  }

  Future<void> _applyAuthUser(User? user) async {
    if (_disposed) return;
    final bool preserveHostMode = _isHostMode;
    if (user?.uid != _userId) {
      _resetUserState();
      if (preserveHostMode) _isHostMode = true;
    }
    if (user == null) { notifyListeners(); return; }
    final uid = user.uid;
    _isLoggedIn = true; _userId = uid;
    _userName = user.displayName ?? ''; _userEmail = user.email ?? '';
    _userPhone = user.phoneNumber ?? ''; _userAvatar = user.photoURL ?? '';
    _isEmailVerified = user.emailVerified;
    notifyListeners();
    final prefs = await SessionStore.preferences(uid);
    if (!_sameUser(uid)) return;
    _userName = prefs.getString('userName') ?? _userName;
    _userBio = prefs.getString('userBio') ?? '';
    _userLocation = prefs.getString('userLocation') ?? '';
    _userGender = prefs.getString('userGender') ?? '';
    _userDob = prefs.getString('userDob') ?? '';
    _isEmailVerified = prefs.getBool('isEmailVerified') ?? _isEmailVerified;
    if (preserveHostMode) {
      _isHostMode = true;
      await prefs.setBool('isHostMode', true);
    } else {
      _isHostMode = prefs.getBool('isHostMode') ?? false;
    }
    notifyListeners();
    await Future.wait([fetchProfile(), fetchBookings(), fetchHostBookings(),
      fetchWishlist(), fetchVerificationStatus(), fetchLoyaltyProfile()]);
    if (_sameUser(uid)) unawaited(PushNotificationService.syncTokenWithBackend());
  }

  Future<void> fetchProfile() async {
    final uid = _userId;
    if (!_sameUser(uid)) return;
    try {
      final data = jsonMap(await ApiClient.instance.get('/users/profile'));
      if (!_sameUser(uid)) return;
      _userName = data['displayName']?.toString() ?? _userName;
      _userEmail = data['email']?.toString() ?? _userEmail;
      _userPhone = data['phone']?.toString() ?? _userPhone;
      _userAvatar = data['photoUrl']?.toString() ?? _userAvatar;
      _userBio = data['bio']?.toString() ?? '';
      _userLocation = data['location']?.toString() ?? '';
      _userGender = data['gender']?.toString() ?? '';
      _userDob = data['dob']?.toString() ?? '';
      final serverVerified = data['isEmailVerified'] == true ||
          (data['email'] != null && data['email'].toString().trim().isNotEmpty);
      final prefs = await SessionStore.preferences(uid);
      final cachedVerified = prefs.getBool('isEmailVerified') ?? false;
      _isEmailVerified = serverVerified || cachedVerified ||
          (_auth?.currentUser?.emailVerified == true && _auth?.currentUser?.email == _userEmail);
      if (_isEmailVerified && _userEmail.isNotEmpty) {
        await prefs.setBool('isEmailVerified', true);
        await prefs.setString('userEmail', _userEmail);
      }
      final sub = jsonMap(data['hostProSubscription'] ?? data['subscription']);
      _isHostPro = data['isHostPro'] == true || sub['status'] == 'ACTIVE';
      _hostProPlan = sub['planId']?.toString() ?? '';
      _hostProExpiresAt = DateTime.tryParse(sub['expiresAt']?.toString() ?? '');
      if (_hostProExpiresAt?.isBefore(DateTime.now()) == true) _isHostPro = false;
      final roles = data['roles'];
      if (roles is List) {
        _userRoles = roles.map((r) => r.toString()).toList();
      }
      _isHostVerified = data['isHostVerified'] == true;
      _hostStatus = data['hostStatus']?.toString() ?? '';
      if (_userRoles.contains('HOST') || _isHostVerified || _hostStatus == 'APPROVED') {
        await prefs.setBool('isHostUser', true);
        if (prefs.getBool('isHostMode') == null) {
          _isHostMode = true;
          await prefs.setBool('isHostMode', true);
        }
      }
      _sessionError = null; notifyListeners();
    } catch (e) { if (_sameUser(uid)) { _sessionError = e.toString(); notifyListeners(); } }
  }

  Future<void> _initPrefs() async {
    final prefs = await SessionStore.preferences(null);
    _hasSeenWalkthrough = prefs.getBool('hasSeenWalkthrough') ?? false;
    if (prefs.getBool('isHostUser') == true) {
      _isHostVerified = true;
    }
    notifyListeners();
  }

  Future<void> fetchVerificationStatus() async {
    final uid = _userId; if (!_sameUser(uid)) return;
    try {
      final data = jsonMap(await ApiClient.instance.get('/verification/status'));
      if (_sameUser(uid)) await syncVerificationFromBackend(data);
    } catch (e) { if (_sameUser(uid)) { _sessionError = e.toString(); notifyListeners(); } }
  }

  Future<void> syncVerificationFromBackend(Map<String, dynamic> status) async {
    _isBankVerified = status['isBankVerified'] == true || status['bankAccountVerified'] == true;
    _isAadhaarVerified = status['isAadhaarVerified'] == true || status['aadhaarVerified'] == true;
    _isPanVerified = status['isPanVerified'] == true || status['panVerified'] == true;
    _isUpiVerified = status['isUpiVerified'] == true || status['upiVerified'] == true;
    _isGovIdVerified = _isAadhaarVerified || _isPanVerified;
    _verifiedGovIdType = _isAadhaarVerified ? 'AADHAAR' : _isPanVerified ? 'PAN' : '';
    final bank = jsonMap(status['bankDetails']);
    _verifiedBankName = _isBankVerified ? bank['bankName']?.toString() ?? '' : '';
    _verifiedAccountNumber = _isBankVerified ? _masked(bank['accountNumberMasked']?.toString() ?? '') : '';
    _verifiedAadhaarNumber = _isAadhaarVerified ? _masked(status['aadhaarNumberMasked']?.toString() ?? '') : '';
    _verifiedPanNumber = _isPanVerified ? _masked(status['panNumberMasked']?.toString() ?? '') : '';
    _verifiedGovIdNumber = _isAadhaarVerified ? _verifiedAadhaarNumber : _verifiedPanNumber;
    _verifiedUpiId = _isUpiVerified ? status['upiId']?.toString() ?? '' : '';
    _verifiedFullName = status['accountHolderName']?.toString() ?? '';
    if (!_isGovIdVerified) { _verifiedAddress = ''; _verifiedDob = ''; }
    notifyListeners();
  }


  void invalidateVerification(String type) {
    if (type == 'bank') { _isBankVerified = false; _verifiedAccountNumber = ''; _verifiedBankName = ''; }
    if (type == 'upi') { _isUpiVerified = false; _verifiedUpiId = ''; }
    if (type == 'aadhaar') { _isAadhaarVerified = false; _verifiedAadhaarNumber = ''; }
    if (type == 'pan') { _isPanVerified = false; _verifiedPanNumber = ''; }
    if (type == 'aadhaar' || type == 'pan') {
      _isGovIdVerified = _isAadhaarVerified || _isPanVerified;
      _verifiedGovIdType = _isAadhaarVerified ? 'AADHAAR' : _isPanVerified ? 'PAN' : '';
      _verifiedGovIdNumber = _isAadhaarVerified ? _verifiedAadhaarNumber : _verifiedPanNumber;
    }
    notifyListeners();
  }

  String _masked(String value) => value.isEmpty ? '' : '••••${value.length > 4 ? value.substring(value.length - 4) : value}';

  Future<void> setAadhaarVerified({required String name, required String aadhaarNumber,
      required String address, String? dob}) async {
    _isAadhaarVerified = true; _isGovIdVerified = true; _verifiedGovIdType = 'AADHAAR';
    _verifiedAadhaarNumber = _masked(aadhaarNumber); _verifiedGovIdNumber = _verifiedAadhaarNumber;
    _verifiedFullName = name; _verifiedAddress = address; _verifiedDob = dob ?? '';
    notifyListeners();
  }

  Future<void> setPanVerified({required String name, required String panNumber}) async {
    _isPanVerified = true; _isGovIdVerified = true; _verifiedGovIdType = 'PAN';
    _verifiedPanNumber = _masked(panNumber); _verifiedGovIdNumber = _verifiedPanNumber;
    _verifiedFullName = name; notifyListeners();
  }

  Future<void> setBankVerified({required String bankName, required String accountNumber,
      required String ifsc, String? accountHolderName}) async {
    _isBankVerified = true; _verifiedBankName = bankName; _verifiedAccountNumber = _masked(accountNumber);
    if (accountHolderName != null) _verifiedFullName = accountHolderName;
    notifyListeners();
  }

  Future<void> setUpiVerified({required String upiId, String? name}) async {
    _isUpiVerified = true; _verifiedUpiId = upiId;
    if (name != null) _verifiedFullName = name; notifyListeners();
  }

  Future<void> completeWalkthrough() async {
    _hasSeenWalkthrough = true;
    final prefs = await SessionStore.preferences(_userId);
    await prefs.setBool('hasSeenWalkthrough', true);
    notifyListeners();
  }

  Future<void> updateUserAvatar(String imagePath) async {
    if (!_isLoggedIn) throw ApiException(401, 'Please sign in.');
    if (imagePath.startsWith('https://')) {
      await ApiClient.instance.put('/users/profile', body: {'photoUrl': imagePath});
      await _auth!.currentUser!.updatePhotoURL(imagePath);
      _userAvatar = imagePath; notifyListeners();
    } else { await saveProfileDetails(profileImage: File(imagePath)); }
  }

  void _initAuth() {
    _authSubscription = _auth?.authStateChanges().listen((user) {
      unawaited(_applyAuthUser(user));
    });
  }

  Future<void> fetchStays() async {
    try {
      final data = await ApiClient.instance.get('/properties', authenticated: false);
      final records = data is List ? data : jsonMap(data)['properties'];
      if (records is! List) throw const FormatException('Invalid properties response.');
      final stays = <StayModel>[];
      for (final record in records) {
        try { final stay = StayModel.fromJson(jsonMap(record)); if (stay.id.isNotEmpty) stays.add(stay); }
        catch (e, stack) { debugPrint('Invalid property record: $e\n$stack'); }
      }
      if (_disposed) return;
      _stays = stays; notifyListeners();
      if (_isLoggedIn) await fetchWishlist();
    } catch (e, stack) { debugPrint('Property loading failed: $e\n$stack'); }
    await fetchExperiences();
  }

  Future<void> fetchExperiences({String? city}) async {
    try {
      final queryCity = city ??
          (_searchDestination.isNotEmpty &&
                  _searchDestination != 'Where' &&
                  _searchDestination != 'Anywhere'
              ? _searchDestination.split(',').first.trim()
              : null);
      final path = (queryCity != null && queryCity.isNotEmpty)
          ? '/experiences?city=${Uri.encodeComponent(queryCity)}'
          : '/experiences';
      final data = await ApiClient.instance.get(path, authenticated: false);
      final records = data is List
          ? data
          : (data is Map ? (data['data'] ?? data['experiences']) : null);
      if (records is List) {
        final exps = <StayModel>[];
        for (final record in records) {
          try {
            final exp = StayModel.fromJson(jsonMap(record));
            if (exp.id.isNotEmpty) exps.add(exp);
          } catch (e, stack) {
            debugPrint('Invalid experience record: $e\n$stack');
          }
        }
        if (_disposed) return;
        _experiences = exps;
        notifyListeners();
      }
    } catch (e, stack) {
      debugPrint('Experience loading failed: $e\n$stack');
    }
  }

  Future<String?> _getToken() async {
    if (_auth?.currentUser != null) {
      return await _auth!.currentUser!.getIdToken();
    }
    return null;
  }

  Future<void> fetchWishlist() async {
    final uid = _userId; if (!_sameUser(uid)) return;
    try {
      final data = await ApiClient.instance.get('/wishlist');
      if (!_sameUser(uid) || data is! List) return;
      final ids = data.map((w) => jsonMap(w)['propertyId']?.toString()).whereType<String>().toSet();
      for (final stay in _stays) { stay.isWishlisted = ids.contains(stay.id); }
      notifyListeners();
    } catch (e) { if (_sameUser(uid)) _sessionError = e.toString(); }
  }

  Future<void> fetchBookings() async {
    final uid = _userId; if (!_sameUser(uid)) return;
    try {
      final data = await BookingsApi(ApiClient.instance).getUserBookings();
      if (!_sameUser(uid)) return;
      _bookings = _parseBookings(data); notifyListeners();
    } catch (e) { if (_sameUser(uid)) { _sessionError = e.toString(); notifyListeners(); } }
  }

  List<BookingModel> _parseBookings(List<dynamic> data) {
    final result = <BookingModel>[];
    for (final item in data) {
      try { result.add(BookingModel.fromJson(jsonMap(item))); }
      catch (e, stack) { debugPrint('Invalid booking record: $e\n$stack'); }
    }
    result.sort((a, b) => a.checkIn.compareTo(b.checkIn)); return result;
  }
  Future<void> fetchHostBookings() async {
    final uid = _userId;
    if (!_sameUser(uid) || _loadingHostBookings) return;
    _loadingHostBookings = true; _hostBookingsError = null; notifyListeners();
    try {
      final data = await BookingsApi(ApiClient.instance).getHostBookings();
      if (_sameUser(uid)) _hostBookings = _parseBookings(data);
    } catch (e) {
      if (_sameUser(uid)) _hostBookingsError = e.toString();
    } finally {
      if (_sameUser(uid)) { _loadingHostBookings = false; notifyListeners(); }
    }
  }

  // Server-owned referral state
  bool _redeemingPoints = false;
  String? _redemptionKey;
  int? _redemptionPoints;
  double _referralBalance = 0;
  String _userReferralCode = '';

  double get referralBalance => _referralBalance;
  String get userReferralCode => _userReferralCode;

  Future<void> deductReferralBalance(double amount) async {
    // A local action cannot debit a financial balance.
    await fetchLoyaltyProfile();
  }

  Future<void> setReferralBalance(double amount) async {
    // Only the authenticated server response sets this balance.
    await fetchLoyaltyProfile();
  }

  // Getters
  ThemeMode get themeMode => _themeMode;
  bool get isDarkMode => _themeMode == ThemeMode.dark;
  bool get isLoggedIn => _isLoggedIn;
  bool get isLoadingAuth => _isLoadingAuth;
  bool get isHostMode => _isHostMode;
  String? get userId => _userId;
  String get userName => _userName;
  String get userEmail => _userEmail;
  String get userPhone => _userPhone.isNotEmpty ? _userPhone : (_auth?.currentUser?.phoneNumber ?? '');
  bool get isEmailVerified => _isEmailVerified;
  String get userAvatar => _userAvatar;
  String get userBio => _userBio;
  String get userLocation => _userLocation;
  String get userGender => _userGender;
  String get userDob => _userDob;
  List<StayModel> get stays => _stays;
  List<BookingModel> get bookings => _bookings;
  List<BookingModel> get hostBookings => _hostBookings;
  List<StayModel> get wishlistedStays => _stays.where((s) => s.isWishlisted).toList();
  
  String get searchDestination => _searchDestination;
  DateTimeRange? get selectedDateRange => _selectedDateRange;
  int get adultsCount => _adultsCount;
  int get childrenCount => _childrenCount;
  int get infantsCount => _infantsCount;
  int get petsCount => _petsCount;
  String get selectedCategory => _selectedCategory;
  double get minPrice => _minPrice;
  double get maxPrice => _maxPrice;
  bool get searchExperiencesOnly => _searchExperiencesOnly;

  // Filtered Stays computed
  List<StayModel> get filteredStays {
    return _stays.where((stay) {
      if (canonicalCategory(_selectedCategory) != 'ALL') {
        final sel = canonicalCategory(_selectedCategory);
        final stayCat = canonicalCategory(stay.category);
        final isRv = stay.propertyType == 'RV' || stayCat == 'RV' || stay.isRv;
        final isCamp = stay.propertyType == 'CAMPING_SITE' || stayCat == 'CAMPING';

        if (sel == 'RV' || sel == 'RVS') {
          if (!isRv) return false;
        } else if (sel == 'CAMPING' || sel == 'CAMPSITES') {
          if (!isCamp && !isRv) return false;
        } else if (stayCat != sel && canonicalCategory(stay.propertyType) != sel) {
          return false;
        }
      }
      if (stay.pricePerNight < _minPrice || stay.pricePerNight > _maxPrice) {
        return false;
      }
      if (stay.maxGuests > 0 && _adultsCount + _childrenCount > stay.maxGuests) return false;
      if (_selectedDateRange != null && stay.blockedDates.any((date) => !DateUtils.dateOnly(date).isBefore(DateUtils.dateOnly(_selectedDateRange!.start)) && DateUtils.dateOnly(date).isBefore(DateUtils.dateOnly(_selectedDateRange!.end)))) return false;
      if (_searchExperiencesOnly && !stay.isExperience) {
        return false;
      }
      if (_stayingWithHostFilter != null && stay.isStayingWithHost != _stayingWithHostFilter) {
        return false;
      }
      if (_searchLatitude != null && _searchLongitude != null) {
        if ((stay.lat == 0 && stay.lng == 0) || _distanceKm(stay.lat, stay.lng) > 50) return false;
      }
      if (_searchLatitude == null && _searchDestination.isNotEmpty && _searchDestination != 'Where' && _searchDestination != 'Anywhere') {
        final dest = _searchDestination.toLowerCase().split(',').first.trim();
        if (!stay.location.toLowerCase().contains(dest) && 
            !stay.city.toLowerCase().contains(dest) &&
            !stay.state.toLowerCase().contains(dest) &&
            !stay.title.toLowerCase().contains(dest)) {
          return false;
        }
      }
      return true;
    }).toList();
  }

  List<StayModel> get experiences => _experiences;

  List<StayModel> get filteredExperiences {
    return _experiences.where((exp) {
      if (_searchDestination.isNotEmpty &&
          _searchDestination != 'Where' &&
          _searchDestination != 'Anywhere') {
        final dest = _searchDestination.toLowerCase().split(',').first.trim();
        final cityMatch = exp.city.toLowerCase().contains(dest);
        final locMatch = exp.location.toLowerCase().contains(dest);
        final titleMatch = exp.title.toLowerCase().contains(dest);
        if (!cityMatch && !locMatch && !titleMatch) return false;
      }
      if (exp.pricePerNight < _minPrice || exp.pricePerNight > _maxPrice) {
        return false;
      }
      final guests = _adultsCount + _childrenCount;
      if (guests > 0 && exp.maxSpots > 0 && guests > exp.maxSpots) {
        return false;
      }
      return true;
    }).toList();
  }

  // Host Listings
  List<StayModel> get hostListings {
    if (_userId == null) return [];
    // Ideally this would be a separate query, but for now we filter locally
    return _stays.where((s) => s.hostId == _userId).toList(); 
  }

  double get totalHostEarnings {
    // Sum confirmed host booking amounts
    return _hostBookings
        .where((b) => b.isPaid && b.isConfirmed)
        .fold(0.0, (sum, b) => sum + b.totalAmount);
  }

  // --- Theme Mode ---
  void toggleTheme() {
    _themeMode = _themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
  }

  Future<StayModel> addExperience(StayModel experience, {String? idempotencyKey}) async {
    final uid = _userId;
    if (!_sameUser(uid)) throw ApiException(401, 'Please sign in.');
    if (experience.title.trim().isEmpty ||
        experience.location.trim().isEmpty ||
        experience.pricePerNight <= 0 ||
        !experience.pricePerNight.isFinite ||
        experience.imageUrls.isEmpty) {
      throw ApiException(400, 'Provide a title, location, positive price and cover photo.');
    }

    final payload = {
      'title': experience.title.trim(),
      'description': experience.description.trim(),
      'location': experience.location.trim(),
      'city': experience.city.isNotEmpty
          ? experience.city.trim()
          : experience.location.split(',').first.trim(),
      'category': 'ADVENTURE',
      'durationMinutes': (double.tryParse(experience.duration?.replaceAll(RegExp(r'[^0-9.]'), '') ?? '') ?? 3.0).toInt() * 60,
      'maxGroupSize': experience.maxSpots > 0 ? experience.maxSpots : 10,
      'pricePerPerson': experience.pricePerNight,
      'transportOption': experience.transportOption,
      'foodIncluded': experience.foodIncluded,
      'equipmentIncluded': experience.equipmentIncluded,
      'kidsFreeAgeLimit': experience.kidsFreeAgeLimit,
      'scheduleTime': experience.scheduleTime ?? experience.timeSlot ?? '10:00 AM - 1:00 PM',
      'includes': experience.amenities,
      'imageUrls': experience.imageUrls,
    };

    final response = await ApiClient.instance.post(
      '/experiences',
      body: payload,
      idempotencyKey: idempotencyKey,
    );
    final created = StayModel.fromJson(jsonMap(response));
    await fetchExperiences();
    return created;
  }

  Future<void> updateBookingStatus(String bookingId, BookingStatus newStatus) async {
    final uid = _userId;
    final records = _hostBookings.where((b) => b.id == bookingId);
    if (newStatus == BookingStatus.confirmed && records.isNotEmpty && !records.first.isPaid) {
      throw ApiException(409, 'Payment must be verified before accepting this booking.');
    }
    final status = newStatus == BookingStatus.confirmed ? 'confirmed' :
        newStatus == BookingStatus.cancelled ? 'cancelled' :
        newStatus == BookingStatus.completed ? 'completed' : 'pending';
    await BookingsApi(ApiClient.instance).updateBookingStatus(bookingId, status);
    if (_sameUser(uid)) await fetchHostBookings();
  }

  // Actions
  void toggleThemeMode() {
    _themeMode = _themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
  }

  void toggleHostMode() async {
    _isHostMode = !_isHostMode;
    notifyListeners();
    try {
      final prefs = await SessionStore.preferences(_userId);
      await prefs.setBool('isHostMode', _isHostMode);
    } catch (e) {
      debugPrint('Error saving isHostMode: $e');
    }
  }

  void setHostMode(bool isHost) async {
    _isHostMode = isHost;
    notifyListeners();
    try {
      final prefs = await SessionStore.preferences(_userId);
      await prefs.setBool('isHostMode', _isHostMode);
    } catch (e) {
      debugPrint('Error saving isHostMode: $e');
    }
  }

  Future<bool> signInWithGoogle() async {
    if (_auth == null) return false;
    _isLoadingAuth = true; notifyListeners();
    try {
      await GoogleSignIn.instance.initialize();
      final user = await GoogleSignIn.instance.authenticate();
      await _auth!.signInWithCredential(GoogleAuthProvider.credential(idToken: user.authentication.idToken));
      await _syncAuthenticatedProfile(); return true;
    } catch (e) { _sessionError = e.toString(); return false; }
    finally { _isLoadingAuth = false; notifyListeners(); }
  }

  Future<bool> checkProfileComplete() async {
    if (!_isLoggedIn) return false;
    try {
      final data = jsonMap(await ApiClient.instance.get('/users/profile'));
      return ['email', 'phone', 'displayName'].every((k) => data[k]?.toString().trim().isNotEmpty == true);
    } catch (_) { return false; }
  }

  Future<void> saveProfileDetails({String? email, String? phone, String? name, String? bio,
      String? location, String? gender, String? dob, File? profileImage, bool? isEmailVerified}) async {
    final uid = _userId;
    if (!_sameUser(uid)) throw ApiException(401, 'Please sign in.');
    _isLoadingAuth = true; notifyListeners();
    try {
      String? photo;
      if (profileImage != null) {
        final ref = FirebaseStorage.instance.ref('users/$uid/avatar_${DateTime.now().microsecondsSinceEpoch}.jpg');
        await ref.putFile(profileImage).timeout(const Duration(seconds: 30));
        photo = await ref.getDownloadURL();
      }
      final cleanName = name?.trim();
      final updates = <String, dynamic>{
        if (email != null && email.trim().isNotEmpty) 'email': email.trim(),
        if (phone != null && phone.trim().isNotEmpty) 'phone': phone.trim(),
        if (cleanName != null && cleanName.isNotEmpty) 'displayName': cleanName,
        if (bio != null) 'bio': bio.trim(),
        if (location != null) 'location': location.trim(),
        if (gender != null) 'gender': gender.trim(),
        if (dob != null && dob.trim().isNotEmpty) 'dob': dob.trim(),
        if (photo != null) 'photoUrl': photo,
      };
      await ApiClient.instance.put('/users/profile', body: updates);
      if (!_sameUser(uid)) throw ApiException(409, 'Your account changed.');
      if (cleanName != null && cleanName.isNotEmpty) {
        try {
          await _auth?.currentUser?.updateDisplayName(cleanName);
        } catch (e) {
          debugPrint('Non-fatal updateDisplayName error: $e');
        }
      }
      if (photo != null) {
        try {
          await _auth?.currentUser?.updatePhotoURL(photo);
        } catch (e) {
          debugPrint('Non-fatal updatePhotoURL error: $e');
        }
      }
      if (!_sameUser(uid)) return;
      if (cleanName != null && cleanName.isNotEmpty) _userName = cleanName; if (email != null) _userEmail = email.trim();
      if (phone != null) _userPhone = phone.trim(); if (bio != null) _userBio = bio.trim();
      if (location != null) _userLocation = location.trim(); if (gender != null) _userGender = gender.trim();
      if (dob != null) _userDob = dob.trim(); if (photo != null) _userAvatar = photo;
      // Never submit an ownership-verification flag as an editable profile field.
      final prefs = await SessionStore.preferences(uid);
      if (!_sameUser(uid)) return;
      await prefs.setString('userName', _userName); await prefs.setString('userBio', _userBio);
      await prefs.setString('userLocation', _userLocation); await prefs.setString('userGender', _userGender);
      await prefs.setString('userDob', _userDob);
      if (isEmailVerified == true) {
        _isEmailVerified = true;
        await prefs.setBool('isEmailVerified', true);
      }
      await fetchProfile();
    } finally { if (_sameUser(uid)) { _isLoadingAuth = false; notifyListeners(); } }
  }

  Future<void> setEmailVerified(bool verified, {String? email}) async {
    if (email != null && email.trim() != _userEmail) _isEmailVerified = false;
    if (verified && email != null) {
      _userEmail = email.trim();
      _isEmailVerified = true;
      if (_userId != null) {
        final prefs = await SessionStore.preferences(_userId!);
        await prefs.setBool('isEmailVerified', true);
        await prefs.setString('userEmail', _userEmail);
      }
    } else {
      _isEmailVerified = false;
      if (_userId != null) {
        final prefs = await SessionStore.preferences(_userId!);
        await prefs.setBool('isEmailVerified', false);
      }
    }
    notifyListeners();
  }

  Future<void> verifyPhoneNumber(String phoneNumber, {required Function() onCodeSent,
      required Function(String) onError, Function()? onVerified}) async {
    if (_auth == null) { onError('Authentication is unavailable.'); return; }
    final request = ++_phoneRequest;
    _pendingPhone = phoneNumber; _autoVerifiedPhone = null; _verificationId = null;
    _isLoadingAuth = true; notifyListeners();
    try {
      await _auth!.verifyPhoneNumber(phoneNumber: phoneNumber,
        verificationCompleted: (credential) async {
          if (_disposed || request != _phoneRequest) return;
          try {
            await _authenticatePhone(credential);
            await _syncAuthenticatedProfile();
            _autoVerifiedPhone = phoneNumber; _isLoadingAuth = false; notifyListeners();
            onVerified?.call();
          } catch (e) { _isLoadingAuth = false; notifyListeners(); onError(e.toString()); }
        },
        verificationFailed: (e) { if (_disposed || request != _phoneRequest) return; _isLoadingAuth = false; notifyListeners(); onError(e.message ?? 'Verification failed.'); },
        codeSent: (id, token) { if (_disposed || request != _phoneRequest) return; _verificationId = id; _isLoadingAuth = false; notifyListeners(); onCodeSent(); },
        codeAutoRetrievalTimeout: (id) { if (!_disposed && request == _phoneRequest) _verificationId = id; });
    } catch (e) { _isLoadingAuth = false; notifyListeners(); onError(e.toString()); }
  }

  Future<bool> verifyOTP(String smsCode) async {
    if (_auth == null) throw ApiException(503, 'Authentication is unavailable.');
    if (_autoVerifiedPhone == _pendingPhone && _pendingPhone != null &&
        _auth!.currentUser?.phoneNumber == _pendingPhone) return true;
    if (_verificationId == null) throw ApiException(400, 'Request a new verification code.');
    _isLoadingAuth = true; notifyListeners();
    try {
      await _authenticatePhone(PhoneAuthProvider.credential(verificationId: _verificationId!, smsCode: smsCode.trim()));
      try {
        await _syncAuthenticatedProfile();
      } catch (e) {
        debugPrint('Non-fatal profile sync error during OTP verification: $e');
      }
      return true;
    } finally { _isLoadingAuth = false; notifyListeners(); }
  }

  Future<void> _authenticatePhone(PhoneAuthCredential credential) async {
    final current = _auth!.currentUser;
    if (current == null) await _auth!.signInWithCredential(credential);
    else if (current.phoneNumber == null) await current.linkWithCredential(credential);
    else if (current.phoneNumber == _pendingPhone) await current.reauthenticateWithCredential(credential);
    else await current.updatePhoneNumber(credential);
  }
  Future<void> _syncAuthenticatedProfile() async {
    final user = _auth?.currentUser;
    if (user == null) throw ApiException(401, 'Please sign in.');
    final userDisplayName = (user.displayName != null && user.displayName!.trim().isNotEmpty)
        ? user.displayName!.trim()
        : 'Stay Q Traveler';
    final userEmail = user.email?.trim();
    final userPhone = user.phoneNumber?.trim();
    final userPhoto = user.photoURL?.trim();
    try {
      await ApiClient.instance.put('/auth/sync-profile', body: {
        if (userEmail != null && userEmail.isNotEmpty) 'email': userEmail,
        if (userPhone != null && userPhone.isNotEmpty) 'phone': userPhone,
        'displayName': userDisplayName,
        if (userPhoto != null && userPhoto.isNotEmpty) 'photoUrl': userPhoto,
      });
    } catch (e) {
      debugPrint('Non-fatal /auth/sync-profile error: $e');
    }
    await _applyAuthUser(user);
  }

  Future<void> login(String email, String password) async {
    if (_auth == null) throw ApiException(503, 'Authentication is unavailable.');
    _isLoadingAuth = true; notifyListeners();
    try { await _auth!.signInWithEmailAndPassword(email: email.trim(), password: password); await _syncAuthenticatedProfile(); }
    finally { _isLoadingAuth = false; notifyListeners(); }
  }

  Future<void> signUp(String name, String email, String password) async {
    if (_auth == null) throw ApiException(503, 'Authentication is unavailable.');
    _isLoadingAuth = true; notifyListeners();
    try {
      final result = await _auth!.createUserWithEmailAndPassword(email: email.trim(), password: password);
      final cleanName = name.trim();
      if (cleanName.isNotEmpty) {
        try {
          await result.user!.updateDisplayName(cleanName);
        } catch (e) {
          debugPrint('Non-fatal updateDisplayName error: $e');
        }
      }
      await _syncAuthenticatedProfile();
    } finally { _isLoadingAuth = false; notifyListeners(); }
  }

  Future<void> logout() async {
    _phoneRequest++; _pendingPhone = null; _autoVerifiedPhone = null; _verificationId = null;
    final uid = _userId;
    _resetUserState(); notifyListeners();
    try { await PushNotificationService.removeTokenFromBackend().timeout(const Duration(seconds: 5)); } catch (_) {}
    await _auth?.signOut();
    try { await GoogleSignIn.instance.signOut(); } catch (_) {}
    if (uid != null) await SessionStore.clearUser(uid);
  }

  Future<bool> deleteAccount() async {
    final user = _auth?.currentUser;
    if (user == null) return false;
    final lastLogin = user.metadata.lastSignInTime;
    if (lastLogin == null || DateTime.now().difference(lastLogin) > const Duration(minutes: 5)) {
      _sessionError = 'Sign out and sign in again before deleting your account.'; notifyListeners(); return false;
    }
    try {
      await ApiClient.instance.delete('/users/me');
      try { await user.delete(); } on FirebaseAuthException catch (e) {
        if (e.code != 'user-not-found') rethrow;
      }
      await logout(); return true;
    } catch (e) { _sessionError = 'Deletion was not completed: $e'; notifyListeners(); return false; }
  }

  Future<void> toggleWishlist(StayModel stay) async {
    if (!_isLoggedIn) return;
    final uid = _userId;
    try {
      if (stay.isWishlisted) await ApiClient.instance.delete('/wishlist/${stay.id}');
      else await ApiClient.instance.post('/wishlist', body: {'propertyId': stay.id});
      if (_sameUser(uid)) await fetchWishlist();
    } catch (e) { if (_sameUser(uid)) { _sessionError = e.toString(); notifyListeners(); } }
  }

  void updateSearch({
    String? destination,
    DateTimeRange? dateRange,
    int? adults,
    int? children,
    int? infants,
    int? pets,
    double? minPrice,
    double? maxPrice,
    bool? isStayingWithHost,
  }) {
    if (destination != null) { _searchDestination = destination; _searchLatitude = null; _searchLongitude = null; }
    if (dateRange != null) _selectedDateRange = dateRange;
    if (adults != null) _adultsCount = adults;
    if (children != null) _childrenCount = children;
    if (infants != null) _infantsCount = infants;
    if (pets != null) _petsCount = pets;
    if (minPrice != null) _minPrice = minPrice;
    if (maxPrice != null) _maxPrice = maxPrice;
    _stayingWithHostFilter = isStayingWithHost;
    notifyListeners();
    fetchExperiences();
  }

  void resetSearchFilters() {
    _searchDestination = ''; _searchLatitude = null; _searchLongitude = null;
    _selectedDateRange = null;
    _adultsCount = 2;
    _childrenCount = 0;
    _infantsCount = 0;
    _petsCount = 0;
    _minPrice = 500;
    _maxPrice = 50000;
    _stayingWithHostFilter = null;
    _searchExperiencesOnly = false;
    _selectedCategory = 'All Stays';
    notifyListeners();
    fetchExperiences();
  }

  void setCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void setPriceRange(double min, double max) {
    _minPrice = min;
    _maxPrice = max;
    notifyListeners();
  }

  void toggleSearchExperiencesOnly(bool value) {
    _searchExperiencesOnly = value;
    notifyListeners();
  }

  Future<BookingModel> addBooking(StayModel stay, DateTime start, DateTime end, int adultsCount,
      {double? totalAmount, Map<String, dynamic> options = const {}, String? idempotencyKey}) async {
    final today = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
    if (start.isBefore(today) || !end.isAfter(start) || adultsCount < 1 ||
        (stay.maxGuests > 0 && adultsCount > stay.maxGuests)) throw ApiException(400, 'Choose valid dates and guest count.');
    final uid = _userId;
    final party = BookingParty.fromTotal(adultsCount, options);
    final response = jsonMap(await ApiClient.instance.post('/bookings', body: {
      'propertyId': stay.id, 'checkIn': start.toIso8601String(), 'checkOut': end.toIso8601String(),
      ...party.toJson(), 'options': options,
      // This is an estimate only; the server must return its authoritative amount.
      if (totalAmount != null) 'estimatedTotalAmount': totalAmount,
    }, idempotencyKey: idempotencyKey));
    if (!_sameUser(uid)) throw ApiException(409, 'Your account changed.');
    final data = jsonMap(response['booking'] ?? response);
    if ((data['id'] ?? data['_id'])?.toString().isNotEmpty != true || data['totalAmount'] == null) {
      throw ApiException(502, 'The server did not return a booking and confirmed price.');
    }
    final booking = BookingModel.fromJson({...data, 'property': {...stay.toMap(), 'id': stay.id, ...jsonMap(data['property'])}});
    if (booking.totalAmount <= 0) throw ApiException(502, 'The server returned an invalid booking price.');
    _bookings.removeWhere((b) => b.id == booking.id); _bookings.add(booking); notifyListeners();
    return booking;
  }

  Future<BookingModel> refreshBooking(String id) async {
    final uid = _userId;
    final response = jsonMap(await BookingsApi(ApiClient.instance).getBooking(id));
    if (!_sameUser(uid)) throw ApiException(409, 'Your account changed.');
    final data = jsonMap(response['booking'] ?? response);
    final previousRecords = _bookings.where((b) => b.id == id).toList();
    final previous = previousRecords.isEmpty ? null : previousRecords.first;
    final booking = BookingModel.fromJson({...data,
      if (previous != null) 'property': {...previous.stay.toMap(), 'id': previous.stay.id, ...jsonMap(data['property'])}});
    _bookings.removeWhere((b) => b.id == id); _bookings.add(booking); notifyListeners(); return booking;
  }

  Future<StayModel> addNewListing(StayModel newStay, {String? idempotencyKey}) async {
    final uid = _userId;
    if (!_sameUser(uid)) throw ApiException(401, 'Please sign in.');
    if (newStay.title.trim().isEmpty || newStay.location.trim().isEmpty ||
        newStay.pricePerNight <= 0 || !newStay.pricePerNight.isFinite || newStay.imageUrls.isEmpty) {
      throw ApiException(400, 'Provide a title, location, positive price and cover photo.');
    }
    final urls = <String>[];
    for (final image in newStay.imageUrls) {
      if (!_sameUser(uid)) throw ApiException(409, 'Your account changed.');
      if (image.startsWith('https://')) { urls.add(image); continue; }
      if (!File(image).existsSync()) throw ApiException(400, 'A selected photo is missing.');
      final ref = FirebaseStorage.instance.ref('users/$uid/properties/${DateTime.now().microsecondsSinceEpoch}.jpg');
      await ref.putFile(File(image)).timeout(const Duration(seconds: 30));
      urls.add(await ref.getDownloadURL().timeout(const Duration(seconds: 15)));
    }
    final payload = {...newStay.toMap(), 'images': urls, 'imageUrls': urls, 'status': 'DRAFT'};
    for (final key in ['hostId', 'rating', 'reviewCount', 'badges', 'isSponsored',
        'sponsoredTier', 'sponsoredUntil', 'searchRankBoost']) { payload.remove(key); }
    final response = jsonMap(await ApiClient.instance.post('/properties',
      body: payload, idempotencyKey: idempotencyKey));
    if (!_sameUser(uid)) throw ApiException(409, 'Your account changed.');
    final data = jsonMap(response['property'] ?? response['data'] ?? response);
    if ((data['id'] ?? data['_id'])?.toString().isNotEmpty != true) {
      throw ApiException(502, 'The server did not return a saved property. Check your listings before retrying.');
    }
    final created = StayModel.fromJson({...newStay.toMap(), ...data});
    await fetchStays(); return created;
  }
  Future<void> updateHostAvailability(List<DateTime> blockedDates,
      {required String propertyId, int weekendSurcharge = 0, String scheduleType = 'CUSTOM'}) async {
    await ApiClient.instance.post('/host/availability', body: {
      'propertyId': propertyId, 'blockedDates': blockedDates.map((d) => d.toIso8601String()).toList(),
      'weekendSurchargePercent': weekendSurcharge, 'availabilityScheduleType': scheduleType,
    });
    await fetchStays();
  }

  // ─── StayQ Rewards & Loyalty Operations ───

  Future<void> _saveLoyaltyToPrefs() async {
    // Spendable balances and approvals are reloaded from the server each session.
  }

  Future<void> activateHostPro(String planId, {Map<String, dynamic>? verifiedSubscription}) async {
    final data = verifiedSubscription ?? const <String, dynamic>{};
    final sub = jsonMap(data['subscription']);
    if (data['isActive'] != true && sub['status'] != 'ACTIVE') {
      throw ApiException(409, 'Subscription activation is awaiting server confirmation.');
    }
    _isHostPro = true; _hostProPlan = sub['planId']?.toString() ?? planId;
    _hostProExpiresAt = DateTime.tryParse(sub['expiresAt']?.toString() ?? '');
    notifyListeners();
  }

  Future<void> addBonusPoints(int points, String reason) async {
    // Local UI events cannot mint spendable reward points.
    await fetchLoyaltyProfile();
  }

  Future<void> fetchLoyaltyProfile() async {
    final uid = _userId; if (!_sameUser(uid)) return;
    _isLoadingLoyalty = true; notifyListeners();
    try {
      final data = jsonMap(await ApiClient.instance.get('/loyalty/profile'));
      if (!_sameUser(uid)) return;
      final profile = jsonMap(data['profile']);
      if (profile.isEmpty) throw ApiException(502, 'Rewards data is unavailable.');
      _loyaltyTotalPoints = jsonInt(profile['totalPoints']);
      _loyaltyAvailablePoints = jsonInt(profile['availablePoints']);
      _loyaltyRedeemedPoints = jsonInt(profile['redeemedPoints']);
      _loyaltyTier = profile['tier']?.toString() ?? 'Q_STARTER';
      _loyaltyTierTitle = jsonMap(profile['tierDetails'])['title']?.toString() ?? 'Q Starter';
      _loyaltyPointsMultiplier = jsonDouble(profile['pointsMultiplier'], 1);
      _loyaltyCreditEquivalent = jsonDouble(profile['creditEquivalent']);
      _loyaltyTierExpiresAt = DateTime.tryParse(profile['tierExpiresAt']?.toString() ?? '');
      _loyaltyTransactions = (profile['transactions'] is List ? profile['transactions'] as List : const []).map(jsonMap).toList();
      _referralBalance = jsonDouble(profile['referralBalance']);
      _userReferralCode = profile['referralCode']?.toString() ?? '';
    } catch (e) { if (_sameUser(uid)) _sessionError = e.toString(); }
    finally { if (_sameUser(uid)) { _isLoadingLoyalty = false; notifyListeners(); } }
  }

  Future<bool> redeemLoyaltyPoints(int points) async {
    final uid = _userId;
    if (!_sameUser(uid) || _redeemingPoints || points < 100 || points > _loyaltyAvailablePoints) return false;
    _redeemingPoints = true;
    if (_redemptionKey == null || _redemptionPoints != points) {
      _redemptionPoints = points;
      _redemptionKey = 'redeem:$uid:${DateTime.now().microsecondsSinceEpoch}:${math.Random.secure().nextInt(1 << 32)}';
    }
    try {
      final data = jsonMap(await ApiClient.instance.post('/loyalty/redeem', body: {'points': points},
        idempotencyKey: _redemptionKey));
      if (!_sameUser(uid) || data['success'] != true) return false;
      _redemptionKey = null; _redemptionPoints = null;
      await fetchLoyaltyProfile(); return _sameUser(uid);
    } catch (e) { if (_sameUser(uid)) { _sessionError = e.toString(); notifyListeners(); } return false; }
    finally { if (_sameUser(uid)) _redeemingPoints = false; }
  }

  Future<bool> upgradeLoyaltyTier(String tier, {String? orderId}) async {
    final uid = _userId;
    if (!_sameUser(uid) || orderId == null || orderId.isEmpty) return false;
    try {
      final data = jsonMap(await ApiClient.instance.post('/loyalty/upgrade-tier', body: {'tier': tier, 'orderId': orderId},
        idempotencyKey: 'membership:$orderId'));
      if (!_sameUser(uid) || data['success'] != true) return false;
      await fetchLoyaltyProfile(); return _sameUser(uid) && _loyaltyTier == tier;
    } catch (e) { if (_sameUser(uid)) { _sessionError = e.toString(); notifyListeners(); } return false; }
  }

  Future<bool> claimProfileCompletionBonus() async {
    final uid = _userId;
    if (!_sameUser(uid)) return false;
    try {
      final data = jsonMap(await ApiClient.instance.post('/loyalty/claim-profile-bonus',
        idempotencyKey: 'profile-bonus:$uid'));
      if (!_sameUser(uid) || data['success'] != true) return false;
      await fetchLoyaltyProfile(); return _sameUser(uid);
    } catch (e) { if (_sameUser(uid)) { _sessionError = e.toString(); notifyListeners(); } return false; }
  }
}

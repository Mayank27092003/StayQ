import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:http/http.dart' as http;
import '../models/stay_model.dart';
import '../models/booking_model.dart';
import '../services/push_notification_service.dart';

import 'package:shared_preferences/shared_preferences.dart';

const String _apiUrl = 'https://stayq-api-608570851336.asia-south1.run.app';

class AppProvider extends ChangeNotifier {
  FirebaseAuth? _auth;

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
  bool _isBankVerified = false;
  String _verifiedBankName = '';
  String _verifiedAccountNumber = '';
  bool _isUpiVerified = false;
  String _verifiedUpiId = '';

  bool get isGovIdVerified => _isGovIdVerified;
  String get verifiedGovIdType => _verifiedGovIdType;
  String get verifiedGovIdNumber => _verifiedGovIdNumber;
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

  // ─── Stay Q Rewards & Loyalty State ───
  int _loyaltyTotalPoints = 50;
  int _loyaltyAvailablePoints = 50;
  int _loyaltyRedeemedPoints = 0;
  String _loyaltyTier = 'Q_STARTER';
  String _loyaltyTierTitle = 'Q Starter';
  double _loyaltyPointsMultiplier = 1.0;
  DateTime? _loyaltyTierExpiresAt;
  double _loyaltyCreditEquivalent = 25.0;
  List<Map<String, dynamic>> _loyaltyTransactions = [];
  bool _isLoadingLoyalty = false;

  // ─── Stay Q Host Pro State ───
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
  List<BookingModel> _bookings = []; // Guest bookings
  List<BookingModel> _hostBookings = []; // Bookings for host's properties
  
  // Search & Filter State
  String _searchDestination = '';
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
    _initPrefs();
    try {
      // These will throw if Firebase isn't configured with google-services.json
      _auth = FirebaseAuth.instance;
      _initAuth();
      fetchStays();
    } catch (e) {
      debugPrint('Firebase not initialized. Error: $e');
    }
  }

  Future<void> _initPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    _isLoggedIn = _auth?.currentUser != null;
    _isHostMode = prefs.getBool('isHostMode') ?? false;
    _hasSeenWalkthrough = prefs.getBool('hasSeenWalkthrough') ?? false;
    _userId = _auth?.currentUser?.uid ?? prefs.getString('userId');
    _userName = _auth?.currentUser?.displayName ?? prefs.getString('userName') ?? '';
    _userEmail = _auth?.currentUser?.email ?? prefs.getString('userEmail') ?? '';
    _userAvatar = prefs.getString('userAvatar') ?? _auth?.currentUser?.photoURL ?? '';
    _userPhone = prefs.getString('userPhone') ?? _auth?.currentUser?.phoneNumber ?? '';
    _userBio = prefs.getString('userBio') ?? '';
    _userLocation = prefs.getString('userLocation') ?? '';
    _userGender = prefs.getString('userGender') ?? '';
    _userDob = prefs.getString('userDob') ?? '';
    _isEmailVerified = prefs.getBool('isEmailVerified') ?? false;

    // Load persistent verified credentials
    _isGovIdVerified = prefs.getBool('isGovIdVerified') ?? false;
    _verifiedGovIdType = prefs.getString('verifiedGovIdType') ?? '';
    _verifiedGovIdNumber = prefs.getString('verifiedGovIdNumber') ?? '';
    _verifiedFullName = prefs.getString('verifiedFullName') ?? '';
    _verifiedAddress = prefs.getString('verifiedAddress') ?? '';
    _verifiedDob = prefs.getString('verifiedDob') ?? '';
    _isBankVerified = prefs.getBool('isBankVerified') ?? false;
    _verifiedBankName = prefs.getString('verifiedBankName') ?? '';
    _verifiedAccountNumber = prefs.getString('verifiedAccountNumber') ?? '';
    _isUpiVerified = prefs.getBool('isUpiVerified') ?? false;
    _verifiedUpiId = prefs.getString('verifiedUpiId') ?? '';

    // Load persistent loyalty points & tier (Default 50 real points for new members)
    _loyaltyTotalPoints = prefs.getInt('loyaltyTotalPoints') ?? 50;
    _loyaltyAvailablePoints = prefs.getInt('loyaltyAvailablePoints') ?? 50;
    _loyaltyRedeemedPoints = prefs.getInt('loyaltyRedeemedPoints') ?? 0;
    _loyaltyTier = prefs.getString('loyaltyTier') ?? 'Q_STARTER';
    _loyaltyTierTitle = prefs.getString('loyaltyTierTitle') ?? 'Q Starter';
    _loyaltyPointsMultiplier = prefs.getDouble('loyaltyPointsMultiplier') ?? 1.0;
    _loyaltyCreditEquivalent = prefs.getDouble('loyaltyCreditEquivalent') ?? (_loyaltyAvailablePoints * 0.5);
    final expMs = prefs.getInt('loyaltyTierExpiresAt');
    if (expMs != null) {
      _loyaltyTierExpiresAt = DateTime.fromMillisecondsSinceEpoch(expMs);
    }

    // Load Host Pro subscription state
    _isHostPro = prefs.getBool('isHostPro') ?? false;
    _hostProPlan = prefs.getString('hostProPlan') ?? '';
    final proExpMs = prefs.getInt('hostProExpiresAt');
    if (proExpMs != null) {
      _hostProExpiresAt = DateTime.fromMillisecondsSinceEpoch(proExpMs);
      if (_hostProExpiresAt!.isBefore(DateTime.now())) {
        _isHostPro = false;
      }
    }

    notifyListeners();
  }

  Future<void> setAadhaarVerified({
    required String name,
    required String aadhaarNumber,
    required String address,
    String? dob,
  }) async {
    _isGovIdVerified = true;
    _verifiedGovIdType = 'AADHAAR';
    _verifiedGovIdNumber = '••••••••' + (aadhaarNumber.length >= 4 ? aadhaarNumber.substring(aadhaarNumber.length - 4) : aadhaarNumber);
    _verifiedFullName = name;
    _verifiedAddress = address;
    if (dob != null) _verifiedDob = dob;
    if (_userName.isEmpty || _userName == 'Guest') {
      _userName = name;
    }
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isGovIdVerified', true);
    await prefs.setString('verifiedGovIdType', 'AADHAAR');
    await prefs.setString('verifiedGovIdNumber', _verifiedGovIdNumber);
    await prefs.setString('verifiedFullName', _verifiedFullName);
    await prefs.setString('verifiedAddress', _verifiedAddress);
    if (dob != null) await prefs.setString('verifiedDob', _verifiedDob);
    await prefs.setString('userName', _userName);
  }

  Future<void> setPanVerified({
    required String name,
    required String panNumber,
  }) async {
    _isGovIdVerified = true;
    _verifiedGovIdType = 'PAN';
    _verifiedGovIdNumber = panNumber;
    _verifiedFullName = name;
    if (_userName.isEmpty || _userName == 'Guest') {
      _userName = name;
    }
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isGovIdVerified', true);
    await prefs.setString('verifiedGovIdType', 'PAN');
    await prefs.setString('verifiedGovIdNumber', _verifiedGovIdNumber);
    await prefs.setString('verifiedFullName', _verifiedFullName);
    await prefs.setString('userName', _userName);
  }

  Future<void> setBankVerified({
    required String bankName,
    required String accountNumber,
    required String ifsc,
    String? accountHolderName,
  }) async {
    _isBankVerified = true;
    _verifiedBankName = bankName;
    _verifiedAccountNumber = '••••' + (accountNumber.length >= 4 ? accountNumber.substring(accountNumber.length - 4) : accountNumber);
    if (accountHolderName != null && accountHolderName.isNotEmpty) {
      _verifiedFullName = accountHolderName;
    }
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isBankVerified', true);
    await prefs.setString('verifiedBankName', _verifiedBankName);
    await prefs.setString('verifiedAccountNumber', _verifiedAccountNumber);
    if (accountHolderName != null) {
      await prefs.setString('verifiedFullName', _verifiedFullName);
    }
  }

  Future<void> setUpiVerified({
    required String upiId,
    String? name,
  }) async {
    _isUpiVerified = true;
    _verifiedUpiId = upiId;
    if (name != null && name.isNotEmpty) {
      _verifiedFullName = name;
    }
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isUpiVerified', true);
    await prefs.setString('verifiedUpiId', _verifiedUpiId);
    if (name != null) {
      await prefs.setString('verifiedFullName', _verifiedFullName);
    }
  }

  Future<void> completeWalkthrough() async {
    _hasSeenWalkthrough = true;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('hasSeenWalkthrough', true);
    notifyListeners();
  }

  Future<void> updateUserAvatar(String imagePath) async {
    try {
      _userAvatar = imagePath;
      notifyListeners();

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('userAvatar', imagePath);

      if (!imagePath.startsWith('http')) {
        final file = File(imagePath);
        if (await file.exists()) {
          final uid = _userId ?? _auth?.currentUser?.uid ?? 'user_${DateTime.now().millisecondsSinceEpoch}';
          final destination = 'users/$uid/avatar_${DateTime.now().millisecondsSinceEpoch}.jpg';
          final ref = FirebaseStorage.instance.ref().child(destination);
          final uploadTask = await ref.putFile(file);
          final downloadUrl = await uploadTask.ref.getDownloadURL();

          _userAvatar = downloadUrl;
          await prefs.setString('userAvatar', downloadUrl);
          if (_auth?.currentUser != null) {
            await _auth!.currentUser!.updatePhotoURL(downloadUrl);
          }
          notifyListeners();
        }
      } else {
        if (_auth?.currentUser != null) {
          await _auth!.currentUser!.updatePhotoURL(imagePath);
        }
      }
    } catch (e) {
      debugPrint('Error updating user avatar: $e');
    }
  }

  void _initAuth() {
    if (_auth == null) return;
    _auth!.authStateChanges().listen((user) async {
      final prefs = await SharedPreferences.getInstance();
      if (user != null) {
        _isLoggedIn = true;
        _userId = user.uid;
        _userName = user.displayName ?? prefs.getString('userName') ?? 'Guest';
        _userEmail = user.email ?? prefs.getString('userEmail') ?? '';
        _userAvatar = prefs.getString('userAvatar') ?? user.photoURL ?? '';
        
        await prefs.setBool('isLoggedIn', true);
        await prefs.setString('userId', _userId!);
        await prefs.setString('userName', _userName);
        
        fetchBookings();
        fetchWishlist();
        fetchLoyaltyProfile();
        PushNotificationService.syncTokenWithBackend();
      } else {
        _isLoggedIn = false;
        _userId = null;
        _userName = '';
        _userEmail = '';
        _userAvatar = '';
        _bookings.clear();
        for (var stay in _stays) {
          stay.isWishlisted = false;
        }
        
        await prefs.setBool('isLoggedIn', false);
        await prefs.remove('userId');
        await prefs.remove('userName');
      }
      notifyListeners();
    });
  }

  Future<void> fetchStays() async {
    try {
      final response = await http.get(Uri.parse('$_apiUrl/api/v1/properties'));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        _stays = data.map((json) => StayModel.fromJson(json)).toList();
        
        if (_isLoggedIn) {
          await fetchWishlist();
        } else {
          notifyListeners();
        }
      } else {
        debugPrint('Failed to load stays from API: ${response.statusCode}');
        _stays = [];
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching stays from API: $e');
      _stays = [];
      notifyListeners();
    }
  }

  Future<String?> _getToken() async {
    if (_auth?.currentUser != null) {
      return await _auth!.currentUser!.getIdToken();
    }
    return null;
  }

  Future<void> fetchWishlist() async {
    if (_userId == null) return;
    try {
      final token = await _getToken();
      if (token == null) return;

      final response = await http.get(
        Uri.parse('$_apiUrl/api/v1/wishlist'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final List<dynamic> wishlistData = json.decode(response.body);
        
        // Extract property IDs from the response
        final Set<String> wishlistedPropertyIds = wishlistData
            .map((w) => w['propertyId']?.toString() ?? '')
            .where((id) => id.isNotEmpty)
            .toSet();

        // Update local stays
        for (var stay in _stays) {
          stay.isWishlisted = wishlistedPropertyIds.contains(stay.id);
        }
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error fetching wishlist: $e');
    }
  }

  Future<void> fetchBookings() async {
    if (_userId == null) return;
    try {
      final token = await _getToken();
      final response = await http.get(
        Uri.parse('$_apiUrl/api/v1/bookings'),
        headers: token != null ? {'Authorization': 'Bearer $token'} : {},
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        // Assuming BookingModel has a fromJson method matching API
        // If it only has fromFirestore, we may need to adjust it later.
        _bookings = data.map((json) => BookingModel.fromJson(json)).toList();
        _bookings.sort((a, b) => a.checkIn.compareTo(b.checkIn));
        notifyListeners();
      } else {
        debugPrint('Failed to load bookings: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error fetching bookings: $e');
    }
  }

  // Referral & Wallet State (Ultra-real with 10% max checkout cap)
  double _referralBalance = 500.0;
  String _userReferralCode = 'SQ-GOA';

  double get referralBalance => _referralBalance;
  String get userReferralCode => _userReferralCode;

  void deductReferralBalance(double amount) {
    if (amount > 0) {
      _referralBalance = (_referralBalance - amount).clamp(0.0, double.infinity);
      notifyListeners();
    }
  }

  void setReferralBalance(double amount) {
    _referralBalance = amount;
    notifyListeners();
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
      if (_selectedCategory != 'All Stays' && stay.category != _selectedCategory) {
        return false;
      }
      if (stay.pricePerNight < _minPrice || stay.pricePerNight > _maxPrice) {
        return false;
      }
      if (_searchExperiencesOnly && !stay.isExperience) {
        return false;
      }
      if (_stayingWithHostFilter != null && stay.isStayingWithHost != _stayingWithHostFilter) {
        return false;
      }
      if (_searchDestination.isNotEmpty && _searchDestination != 'Where' && _searchDestination != 'Anywhere') {
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

  // Host Listings
  List<StayModel> get hostListings {
    if (_userId == null) return [];
    // Ideally this would be a separate query, but for now we filter locally
    return _stays.where((s) => s.hostName == _userName).toList(); 
  }

  double get totalHostEarnings {
    // Sum confirmed host booking amounts
    return _hostBookings
        .where((b) => b.status == BookingStatus.confirmed)
        .fold(0.0, (sum, b) => sum + b.totalAmount);
  }

  // --- Theme Mode ---
  void toggleTheme() {
    _themeMode = _themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
  }

  Future<void> addExperience(StayModel experience) async {
    try {
      final token = await _getToken();
      if (token == null) return;

      final response = await http.post(
        Uri.parse('$_apiUrl/api/v1/properties'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(experience.toMap()..addAll({
          'category': 'EXPERIENCES',
          'hostId': _userId,
        })),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        final newExp = StayModel.fromJson(data);
        _stays.add(newExp);
        notifyListeners();
      } else {
        debugPrint('Failed to add experience: ${response.statusCode}');
        throw Exception('Failed to add experience: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error adding experience: $e');
      rethrow;
    }
  }

  Future<void> updateBookingStatus(String bookingId, BookingStatus newStatus) async {
    final index = _hostBookings.indexWhere((b) => b.id == bookingId);
    if (index == -1) return;

    // Update locally first for instant UI feedback
    final old = _hostBookings[index];
    _hostBookings[index] = BookingModel(
      id: old.id,
      stay: old.stay,
      checkIn: old.checkIn,
      checkOut: old.checkOut,
      adults: old.adults,
      children: old.children,
      totalAmount: old.totalAmount,
      confirmationCode: old.confirmationCode,
      status: newStatus,
      guestName: old.guestName,
      guestAvatar: old.guestAvatar,
    );
    notifyListeners();

    // Send to backend
    try {
      final token = await _getToken();
      if (token == null) return;
      final statusStr = newStatus == BookingStatus.confirmed ? 'confirmed'
          : newStatus == BookingStatus.cancelled ? 'cancelled'
          : newStatus == BookingStatus.completed ? 'completed'
          : 'pending';
      await http.patch(
        Uri.parse('$_apiUrl/api/v1/bookings/$bookingId/status'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'status': statusStr}),
      );
    } catch (e) {
      debugPrint('Error updating booking status: $e');
    }
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
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('isHostMode', _isHostMode);
    } catch (e) {
      debugPrint('Error saving isHostMode: $e');
    }
  }

  void setHostMode(bool isHost) async {
    _isHostMode = isHost;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('isHostMode', _isHostMode);
    } catch (e) {
      debugPrint('Error saving isHostMode: $e');
    }
  }

  Future<bool> signInWithGoogle() async {
    if (_auth == null) return false;
    try {
      _isLoadingAuth = true;
      notifyListeners();
      
      await GoogleSignIn.instance.initialize();
      final GoogleSignInAccount? googleUser = await GoogleSignIn.instance.authenticate();
      if (googleUser == null) {
        _isLoadingAuth = false;
        notifyListeners();
        return false;
      }
      
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final AuthCredential credential = GoogleAuthProvider.credential(
        idToken: googleAuth.idToken,
      );
      
      await _auth!.signInWithCredential(credential);
      
      // Upsert User to PostgreSQL via API
      if (_auth!.currentUser != null) {
        final token = await _getToken();
        if (token != null) {
          final response = await http.put(
            Uri.parse('$_apiUrl/api/v1/auth/sync-profile'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: json.encode({
              'email': googleUser.email,
              'displayName': googleUser.displayName,
              'photoUrl': googleUser.photoUrl,
            }),
          );
          if (response.statusCode != 200 && response.statusCode != 201) {
             debugPrint('Failed to sync profile: ${response.statusCode}');
          }
          await fetchLoyaltyProfile();
        }
      }
      
      _isLoadingAuth = false;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Google Login Error: $e');
      _isLoadingAuth = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> checkProfileComplete() async {
    if (_auth?.currentUser == null) return true;
    try {
      final token = await _getToken();
      if (token == null) return false;

      final response = await http.get(
        Uri.parse('$_apiUrl/api/v1/users/profile'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final hasEmail = data['email'] != null && data['email'].toString().trim().isNotEmpty;
        final hasPhone = data['phone'] != null && data['phone'].toString().trim().isNotEmpty;
        final hasName = data['displayName'] != null && data['displayName'].toString().trim().isNotEmpty;
        return hasEmail && hasPhone && hasName;
      }
      return false;
    } catch (e) {
      return true; // Fail safe to true if error
    }
  }

  Future<void> saveProfileDetails({
    String? email,
    String? phone,
    String? name,
    String? bio,
    String? location,
    String? gender,
    String? dob,
    File? profileImage,
    bool? isEmailVerified,
  }) async {
    _isLoadingAuth = true;
    notifyListeners();

    try {
      // 1. Immediately update in-memory state so UI updates instantly
      if (name != null && name.trim().isNotEmpty) _userName = name.trim();
      if (email != null && email.trim().isNotEmpty) _userEmail = email.trim();
      if (phone != null && phone.trim().isNotEmpty) _userPhone = phone.trim();
      if (bio != null) _userBio = bio.trim();
      if (location != null) _userLocation = location.trim();
      if (gender != null) _userGender = gender.trim();
      if (dob != null) _userDob = dob.trim();
      if (isEmailVerified != null) _isEmailVerified = isEmailVerified;

      // 2. Persist locally to SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      if (name != null && name.trim().isNotEmpty) await prefs.setString('userName', _userName);
      if (email != null && email.trim().isNotEmpty) await prefs.setString('userEmail', _userEmail);
      if (phone != null && phone.trim().isNotEmpty) await prefs.setString('userPhone', _userPhone);
      if (bio != null) await prefs.setString('userBio', _userBio);
      if (location != null) await prefs.setString('userLocation', _userLocation);
      if (gender != null) await prefs.setString('userGender', _userGender);
      if (dob != null) await prefs.setString('userDob', _userDob);
      if (isEmailVerified != null) await prefs.setBool('isEmailVerified', _isEmailVerified);

      // 3. Upload avatar image if provided
      if (profileImage != null) {
        try {
          final uid = _userId ?? _auth?.currentUser?.uid ?? 'guest_user';
          final ref = FirebaseStorage.instance.ref().child('avatars').child(uid);
          await ref.putFile(profileImage);
          final photoUrl = await ref.getDownloadURL();
          _userAvatar = photoUrl;
          await prefs.setString('userAvatar', photoUrl);
          if (_auth?.currentUser != null) {
            await _auth!.currentUser!.updatePhotoURL(photoUrl);
          }
        } catch (e) {
          debugPrint('Error uploading avatar: $e');
        }
      }

      // 4. Sync with Backend API if token is present
      final token = await _getToken();
      if (token != null) {
        final updates = <String, dynamic>{};
        if (email != null && email.isNotEmpty) updates['email'] = email;
        if (phone != null && phone.isNotEmpty) updates['phone'] = phone;
        if (name != null && name.isNotEmpty) updates['displayName'] = name;
        if (bio != null) updates['bio'] = bio;
        if (location != null) updates['location'] = location;
        if (gender != null) updates['gender'] = gender;
        if (dob != null) updates['dob'] = dob;
        if (_userAvatar.isNotEmpty) updates['photoUrl'] = _userAvatar;

        try {
          await http.put(
            Uri.parse('$_apiUrl/api/v1/users/profile'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: json.encode(updates),
          ).timeout(const Duration(seconds: 8));
        } catch (e) {
          debugPrint('Backend profile sync failed (saved locally): $e');
        }
      }
    } catch (e) {
      debugPrint('Error saving profile: $e');
    } finally {
      _isLoadingAuth = false;
      notifyListeners();
    }
  }

  Future<void> setEmailVerified(bool verified, {String? email}) async {
    _isEmailVerified = verified;
    if (email != null && email.trim().isNotEmpty) {
      _userEmail = email.trim();
    }
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isEmailVerified', verified);
    if (email != null && email.trim().isNotEmpty) {
      await prefs.setString('userEmail', _userEmail);
    }
    notifyListeners();
  }

  Future<void> verifyPhoneNumber(String phoneNumber, {required Function() onCodeSent, required Function(String) onError}) async {
    _isLoadingAuth = true;
    notifyListeners();
    
    _userPhone = phoneNumber;

    try {
      await _auth!.verifyPhoneNumber(
        phoneNumber: phoneNumber,
        timeout: const Duration(seconds: 120),
        verificationCompleted: (PhoneAuthCredential credential) async {
          try {
            await _auth!.signInWithCredential(credential);
            _isLoadingAuth = false;
            notifyListeners();
          } catch (e) {
            debugPrint('Auto-verification failed: $e');
          }
        },
        verificationFailed: (FirebaseAuthException e) {
          _isLoadingAuth = false;
          notifyListeners();
          onError(e.message ?? 'Verification failed. Try again.');
        },
        codeSent: (String verificationId, int? resendToken) {
          _verificationId = verificationId;
          _isLoadingAuth = false;
          notifyListeners();
          onCodeSent();
        },
        codeAutoRetrievalTimeout: (String verificationId) {
          _verificationId = verificationId;
        },
      );
    } catch (e) {
      _isLoadingAuth = false;
      notifyListeners();
      onError('Network error. Please try again.');
    }
  }

  Future<bool> verifyOTP(String smsCode) async {
    _isLoadingAuth = true;
    notifyListeners();

    try {
      // If user is already authenticated (e.g., via Android SMS auto-retrieval):
      if (_auth != null && _auth!.currentUser != null) {
        debugPrint('User is already verified and authenticated!');
        _isLoadingAuth = false;
        notifyListeners();
        return true;
      }

      if (_verificationId == null) throw Exception('No verification ID found. Please go back and request OTP again.');

      PhoneAuthCredential credential = PhoneAuthProvider.credential(
        verificationId: _verificationId!,
        smsCode: smsCode,
      );

      await _auth!.signInWithCredential(credential);
      // PostgreSQL Backend Sync via NestJS API — non-blocking
      if (_auth!.currentUser != null) {
        try {
          // Force-refresh the token to avoid stale/unverified token issues
          final token = await _auth!.currentUser!.getIdToken(true);
          if (token != null) {
            final response = await http.put(
              Uri.parse('$_apiUrl/api/v1/auth/sync-profile'),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer $token',
              },
              body: json.encode({
                'phone': _auth!.currentUser!.phoneNumber,
              }),
            );

            if (response.statusCode != 200 && response.statusCode != 201) {
              debugPrint('Backend sync returned ${response.statusCode}: ${response.body}');
            }
            await fetchLoyaltyProfile();
          }
        } catch (syncError) {
          // Log but don't fail auth — the user is already authenticated with Firebase
          debugPrint('Backend sync error (non-fatal): $syncError');
        }
      }
      
      _isLoadingAuth = false;
      notifyListeners();
      return true;
    } on FirebaseAuthException catch (e) {
      debugPrint('Firebase Auth Error: ${e.code}');
      _isLoadingAuth = false;
      notifyListeners();
      // If user is already authenticated despite error:
      if (_auth != null && _auth!.currentUser != null) {
        return true;
      }
      if (e.code == 'session-expired') {
        throw 'The code has expired. Please request a new code.';
      } else if (e.code == 'invalid-verification-code') {
        throw 'Invalid verification code. Please check and try again.';
      }
      throw e.message ?? 'Authentication failed';
    } catch (e) {
      debugPrint('OTP Error: $e');
      _isLoadingAuth = false;
      notifyListeners();
      if (_auth != null && _auth!.currentUser != null) {
        return true;
      }
      throw e.toString();
    }
  }

  Future<void> login(String email, String password) async {
    if (_auth == null) {
      throw Exception('Authentication service unavailable. Please check your network connection.');
    }
    try {
      await _auth!.signInWithEmailAndPassword(email: email, password: password);
    } catch (e) {
      debugPrint('Login Error: $e');
      rethrow;
    }
  }

  Future<void> signUp(String name, String email, String password) async {
    if (_auth == null) return;
    try {
      UserCredential cred = await _auth!.createUserWithEmailAndPassword(email: email, password: password);
      await cred.user?.updateDisplayName(name);
      
      // Upsert User to PostgreSQL via API
      final token = await _getToken();
      if (token != null) {
        final response = await http.put(
          Uri.parse('$_apiUrl/api/v1/auth/sync-profile'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: json.encode({
            'displayName': name,
            'email': email,
          }),
        );
        if (response.statusCode != 200 && response.statusCode != 201) {
          debugPrint('Failed to sync profile: ${response.statusCode}');
        }
      }
    } catch (e) {
      debugPrint('SignUp Error: $e');
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await PushNotificationService.removeTokenFromBackend();
    } catch (_) {}

    if (_auth != null) {
      await _auth!.signOut();
      await GoogleSignIn.instance.signOut();
    }
    
    _isLoggedIn = false;
    _userId = null;
    _userName = '';
    _userEmail = '';
    _userAvatar = '';
    _isHostMode = false;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isLoggedIn', false);
    await prefs.remove('userId');
    await prefs.remove('userName');
    await prefs.remove('userEmail');
    await prefs.remove('isHostMode');
    await prefs.remove('host_onboarding_in_progress');
    await prefs.remove('host_onboarding_step');
    await prefs.remove('host_onboarding_draft');
    
    notifyListeners();
  }

  void toggleWishlist(StayModel stay) async {
    if (_userId == null) return;
    stay.isWishlisted = !stay.isWishlisted;
    notifyListeners();
    
    try {
      final token = await _getToken();
      if (token == null) return;

      if (stay.isWishlisted) {
        await http.post(
          Uri.parse('$_apiUrl/api/v1/wishlist/${stay.id}'),
          headers: {'Authorization': 'Bearer $token'},
        );
      } else {
        await http.delete(
          Uri.parse('$_apiUrl/api/v1/wishlist/${stay.id}'),
          headers: {'Authorization': 'Bearer $token'},
        );
      }
    } catch (e) {
      debugPrint('Error toggling wishlist: $e');
      // Revert on error
      stay.isWishlisted = !stay.isWishlisted;
      notifyListeners();
    }
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
    if (destination != null) _searchDestination = destination;
    if (dateRange != null) _selectedDateRange = dateRange;
    if (adults != null) _adultsCount = adults;
    if (children != null) _childrenCount = children;
    if (infants != null) _infantsCount = infants;
    if (pets != null) _petsCount = pets;
    if (minPrice != null) _minPrice = minPrice;
    if (maxPrice != null) _maxPrice = maxPrice;
    _stayingWithHostFilter = isStayingWithHost;
    notifyListeners();
  }

  void resetSearchFilters() {
    _searchDestination = '';
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

  Future<void> addBooking(StayModel stay, DateTime start, DateTime end, int adultsCount) async {
    final newBooking = BookingModel(
      id: 'BK-${DateTime.now().millisecondsSinceEpoch}',
      stay: stay,
      checkIn: start,
      checkOut: end,
      adults: adultsCount,
      totalAmount: stay.pricePerNight * end.difference(start).inDays,
      confirmationCode: 'SQ-${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}',
      status: BookingStatus.pending,
      guestName: _userName.isNotEmpty ? _userName : 'Guest User',
      guestAvatar: _userAvatar,
    );

    // Add locally for instant UI
    _bookings.add(newBooking);
    notifyListeners();

    // Submit to backend
    try {
      final token = await _getToken();
      if (token == null) return;
      final response = await http.post(
        Uri.parse('$_apiUrl/api/v1/bookings'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'propertyId': stay.id,
          'checkIn': start.toIso8601String(),
          'checkOut': end.toIso8601String(),
          'guests': adultsCount,
          'totalAmount': newBooking.totalAmount,
          'guestId': _userId,
        }),
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint('Booking submitted successfully');
      } else {
        debugPrint('Failed to submit booking: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error submitting booking: $e');
    }
  }

  Future<void> addNewListing(StayModel newStay) async {
    if (_userId == null) return;
    
    try {
      final token = await _getToken();
      if (token == null) return;

      final response = await http.post(
        Uri.parse('$_apiUrl/api/v1/properties'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(newStay.toMap()..addAll({
          'hostId': _userId,
        })),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        newStay = StayModel.fromJson(data);
        _stays.insert(0, newStay);
        notifyListeners();
      } else {
        debugPrint('Failed to add listing: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error adding listing: $e');
    }
  }
  Future<void> updateHostAvailability(List<DateTime> blockedDates) async {
    try {
      final token = await _getToken();
      if (token == null) return;
      await http.post(
        Uri.parse('$_apiUrl/api/v1/host/availability'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'hostId': _userId,
          'blockedDates': blockedDates.map((d) => d.toIso8601String()).toList(),
        }),
      );
      notifyListeners();
    } catch (e) {
      debugPrint('Error updating availability: $e');
      notifyListeners();
    }
  }

  // ─── Stay Q Rewards & Loyalty Operations ───

  Future<void> _saveLoyaltyToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('loyaltyTotalPoints', _loyaltyTotalPoints);
      await prefs.setInt('loyaltyAvailablePoints', _loyaltyAvailablePoints);
      await prefs.setInt('loyaltyRedeemedPoints', _loyaltyRedeemedPoints);
      await prefs.setString('loyaltyTier', _loyaltyTier);
      await prefs.setString('loyaltyTierTitle', _loyaltyTierTitle);
      await prefs.setDouble('loyaltyPointsMultiplier', _loyaltyPointsMultiplier);
      await prefs.setDouble('loyaltyCreditEquivalent', _loyaltyCreditEquivalent);
      if (_loyaltyTierExpiresAt != null) {
        await prefs.setInt('loyaltyTierExpiresAt', _loyaltyTierExpiresAt!.millisecondsSinceEpoch);
      }
    } catch (e) {
      debugPrint('Error saving loyalty to prefs: $e');
    }
  }

  Future<void> activateHostPro(String planId) async {
    _isHostPro = true;
    _hostProPlan = planId;
    final now = DateTime.now();
    _hostProExpiresAt = planId == 'HOST_PRO_ANNUAL'
        ? now.add(const Duration(days: 365))
        : now.add(const Duration(days: 30));

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isHostPro', true);
    await prefs.setString('hostProPlan', planId);
    await prefs.setInt('hostProExpiresAt', _hostProExpiresAt!.millisecondsSinceEpoch);
    notifyListeners();
  }

  Future<void> addBonusPoints(int points, String reason) async {
    _loyaltyTotalPoints += points;
    _loyaltyAvailablePoints += points;
    _loyaltyCreditEquivalent = _loyaltyAvailablePoints * 0.5;
    _loyaltyTransactions.insert(0, {
      'points': points,
      'reason': reason,
      'createdAt': DateTime.now().toIso8601String(),
    });
    await _saveLoyaltyToPrefs();
    notifyListeners();
  }

  Future<void> fetchLoyaltyProfile() async {
    if (!_isLoggedIn) return;
    _isLoadingLoyalty = true;
    notifyListeners();

    try {
      final token = await _getToken();
      if (token == null) {
        _isLoadingLoyalty = false;
        notifyListeners();
        return;
      }

      final response = await http.get(
        Uri.parse('$_apiUrl/api/v1/loyalty/profile'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['profile'] != null) {
          final p = data['profile'];
          _loyaltyTotalPoints = p['totalPoints'] ?? _loyaltyTotalPoints;
          _loyaltyAvailablePoints = p['availablePoints'] ?? _loyaltyAvailablePoints;
          _loyaltyRedeemedPoints = p['redeemedPoints'] ?? _loyaltyRedeemedPoints;
          _loyaltyTier = p['tier'] ?? _loyaltyTier;
          _loyaltyTierTitle = p['tierDetails']?['title'] ?? _loyaltyTierTitle;
          _loyaltyPointsMultiplier = (p['pointsMultiplier'] as num?)?.toDouble() ?? _loyaltyPointsMultiplier;
          _loyaltyCreditEquivalent = (p['creditEquivalent'] as num?)?.toDouble() ?? (_loyaltyAvailablePoints * 0.5);
          if (p['tierExpiresAt'] != null) {
            _loyaltyTierExpiresAt = DateTime.tryParse(p['tierExpiresAt']);
          }

          if (p['transactions'] != null) {
            _loyaltyTransactions = List<Map<String, dynamic>>.from(p['transactions']);
          }

          await _saveLoyaltyToPrefs();
        }
      }
    } catch (e) {
      debugPrint('Error fetching loyalty profile: $e');
    } finally {
      _isLoadingLoyalty = false;
      notifyListeners();
    }
  }

  Future<bool> redeemLoyaltyPoints(int points) async {
    if (points < 100 || points > _loyaltyAvailablePoints) return false;

    try {
      final token = await _getToken();
      if (token == null) {
        // Local offline / simulated fallback
        _loyaltyAvailablePoints = (_loyaltyAvailablePoints - points).clamp(0, 999999);
        _loyaltyRedeemedPoints += points;
        _loyaltyCreditEquivalent = _loyaltyAvailablePoints * 0.5;
        _referralBalance += (points * 0.5);
        await _saveLoyaltyToPrefs();
        notifyListeners();
        return true;
      }

      final response = await http.post(
        Uri.parse('$_apiUrl/api/v1/loyalty/redeem'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'points': points}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          _loyaltyAvailablePoints = data['remainingPoints'] ?? (_loyaltyAvailablePoints - points);
          _loyaltyRedeemedPoints += points;
          _loyaltyCreditEquivalent = _loyaltyAvailablePoints * 0.5;
          _referralBalance += (data['creditEarned'] as num?)?.toDouble() ?? (points * 0.5);
          await _saveLoyaltyToPrefs();
          await fetchLoyaltyProfile();
          notifyListeners();
          return true;
        }
      } else {
        // Update locally and persist
        _loyaltyAvailablePoints = (_loyaltyAvailablePoints - points).clamp(0, 999999);
        _loyaltyRedeemedPoints += points;
        _loyaltyCreditEquivalent = _loyaltyAvailablePoints * 0.5;
        _referralBalance += (points * 0.5);
        await _saveLoyaltyToPrefs();
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('Error redeeming loyalty points: $e');
      // Offline fallback
      _loyaltyAvailablePoints = (_loyaltyAvailablePoints - points).clamp(0, 999999);
      _loyaltyRedeemedPoints += points;
      _loyaltyCreditEquivalent = _loyaltyAvailablePoints * 0.5;
      _referralBalance += (points * 0.5);
      await _saveLoyaltyToPrefs();
      notifyListeners();
      return true;
    }
    return false;
  }

  Future<bool> upgradeLoyaltyTier(String tier) async {
    try {
      final token = await _getToken();
      final bonusPoints = tier == 'Q_PREMIUM' ? 100 : 50;

      if (token == null) {
        _loyaltyTier = tier;
        _loyaltyTierTitle = tier == 'Q_PREMIUM' ? 'Q Premium' : 'Q Plus';
        _loyaltyPointsMultiplier = tier == 'Q_PREMIUM' ? 2.0 : 1.5;
        _loyaltyTotalPoints += bonusPoints;
        _loyaltyAvailablePoints += bonusPoints;
        _loyaltyCreditEquivalent = _loyaltyAvailablePoints * 0.5;
        await _saveLoyaltyToPrefs();
        notifyListeners();
        return true;
      }

      final response = await http.post(
        Uri.parse('$_apiUrl/api/v1/loyalty/upgrade-tier'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'tier': tier}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          _loyaltyTier = data['tier'] ?? tier;
          _loyaltyTierTitle = data['tierTitle'] ?? (tier == 'Q_PREMIUM' ? 'Q Premium' : 'Q Plus');
          _loyaltyPointsMultiplier = (data['multiplier'] as num?)?.toDouble() ?? (tier == 'Q_PREMIUM' ? 2.0 : 1.5);
          _loyaltyAvailablePoints = data['availablePoints'] ?? (_loyaltyAvailablePoints + bonusPoints);
          _loyaltyCreditEquivalent = _loyaltyAvailablePoints * 0.5;
          await _saveLoyaltyToPrefs();
          await fetchLoyaltyProfile();
          notifyListeners();
          return true;
        }
      } else {
        _loyaltyTier = tier;
        _loyaltyTierTitle = tier == 'Q_PREMIUM' ? 'Q Premium' : 'Q Plus';
        _loyaltyPointsMultiplier = tier == 'Q_PREMIUM' ? 2.0 : 1.5;
        _loyaltyTotalPoints += bonusPoints;
        _loyaltyAvailablePoints += bonusPoints;
        _loyaltyCreditEquivalent = _loyaltyAvailablePoints * 0.5;
        await _saveLoyaltyToPrefs();
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('Error upgrading loyalty tier: $e');
    }
    return false;
  }

  Future<bool> claimProfileCompletionBonus() async {
    try {
      final token = await _getToken();
      if (token == null) {
        await addBonusPoints(15, 'Profile & KYC Completion Bonus');
        return true;
      }

      final response = await http.post(
        Uri.parse('$_apiUrl/api/v1/loyalty/claim-profile-bonus'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        await fetchLoyaltyProfile();
        return true;
      } else {
        await addBonusPoints(15, 'Profile & KYC Completion Bonus');
        return true;
      }
    } catch (e) {
      debugPrint('Error claiming profile bonus: $e');
      await addBonusPoints(15, 'Profile & KYC Completion Bonus');
      return true;
    }
  }
}

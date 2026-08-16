import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:http/http.dart' as http;
import '../models/stay_model.dart';
import '../models/booking_model.dart';

import 'package:shared_preferences/shared_preferences.dart';

const String _apiUrl = 'https://stayq-api-608570851336.asia-south1.run.app';

class AppProvider extends ChangeNotifier {
  FirebaseAuth? _auth;

  // User & Auth State
  bool _isLoggedIn = false;
  bool _isHostMode = false;
  bool _hasSeenWalkthrough = false;
  String _userName = '';
  String _userEmail = '';
  String _userAvatar = '';
  String _userBio = '';
  String _userLocation = '';
  String _userGender = '';
  String _userDob = '';
  String? _userId;
  
  // Phone Auth State
  String? _verificationId;
  bool _isLoadingAuth = false;

  bool get hasSeenWalkthrough => _hasSeenWalkthrough;

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
    notifyListeners();
  }

  Future<void> completeWalkthrough() async {
    _hasSeenWalkthrough = true;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('hasSeenWalkthrough', true);
    notifyListeners();
  }

  void _initAuth() {
    if (_auth == null) return;
    _auth!.authStateChanges().listen((user) async {
      final prefs = await SharedPreferences.getInstance();
      if (user != null) {
        _isLoggedIn = true;
        _userId = user.uid;
        _userName = user.displayName ?? 'Guest';
        _userEmail = user.email ?? '';
        _userAvatar = user.photoURL ?? '';
        
        await prefs.setBool('isLoggedIn', true);
        await prefs.setString('userId', _userId!);
        await prefs.setString('userName', _userName);
        
        fetchBookings();
        fetchWishlist();
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

  // Getters
  ThemeMode get themeMode => _themeMode;
  bool get isDarkMode => _themeMode == ThemeMode.dark;
  bool get isLoggedIn => _isLoggedIn;
  bool get isLoadingAuth => _isLoadingAuth;
  bool get isHostMode => _isHostMode;
  String? get userId => _userId;
  String get userName => _userName;
  String get userEmail => _userEmail;
  String get userPhone => _auth?.currentUser?.phoneNumber ?? '';
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

  Future<void> saveProfileDetails({String? email, String? phone, String? name, String? bio, String? location, String? gender, String? dob, File? profileImage}) async {
    if (_auth?.currentUser == null) return;
    
    _isLoadingAuth = true;
    notifyListeners();
    
    try {
      final token = await _getToken();
      if (token == null) return;

      final updates = <String, dynamic>{};
      if (email != null && email.isNotEmpty) updates['email'] = email;
      if (phone != null && phone.isNotEmpty) updates['phone'] = phone;
      if (name != null && name.isNotEmpty) updates['displayName'] = name;
      if (bio != null && bio.isNotEmpty) updates['bio'] = bio;
      if (location != null && location.isNotEmpty) updates['location'] = location;
      if (gender != null && gender.isNotEmpty) updates['gender'] = gender;
      if (dob != null && dob.isNotEmpty) updates['dob'] = dob;
      
      if (profileImage != null) {
        try {
          final ref = FirebaseStorage.instance.ref().child('avatars').child(_auth!.currentUser!.uid);
          await ref.putFile(profileImage);
          final photoUrl = await ref.getDownloadURL();
          updates['photoUrl'] = photoUrl;
          _userAvatar = photoUrl; // Update local mock variable
        } catch (e) {
          debugPrint('Error uploading avatar: $e');
        }
      }
      
      if (updates.isNotEmpty) {
        final response = await http.put(
          Uri.parse('$_apiUrl/api/v1/users/profile'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: json.encode(updates),
        );

        if (response.statusCode == 200) {
          // Update local state
          if (name != null) _userName = name;
          if (email != null) _userEmail = email;
          if (bio != null) _userBio = bio;
          if (location != null) _userLocation = location;
          if (gender != null) _userGender = gender;
          if (dob != null) _userDob = dob;
        } else {
          debugPrint('Failed to save profile: ${response.statusCode}');
        }
      }
    } catch (e) {
      debugPrint('Error saving profile: $e');
    } finally {
      _isLoadingAuth = false;
      notifyListeners();
    }
  }

  String _lastPhone = '';

  Future<void> verifyPhoneNumber(String phoneNumber, {required Function() onCodeSent, required Function(String) onError}) async {
    _isLoadingAuth = true;
    notifyListeners();
    
    _lastPhone = phoneNumber;

    try {
      await _auth!.verifyPhoneNumber(
        phoneNumber: phoneNumber,
        verificationCompleted: (PhoneAuthCredential credential) async {
          try {
            await _auth!.signInWithCredential(credential);
            // After successful sign in, the authStateChanges stream will handle the rest
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
      if (_verificationId == null) throw Exception('No verification ID found');

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
              // Don't block login — sync will happen on next app launch
            }
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
      throw e.message ?? 'Authentication failed';
    } catch (e) {
      debugPrint('OTP Error: $e');
      _isLoadingAuth = false;
      notifyListeners();
      // Throw the exact error so the UI can display it
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
}

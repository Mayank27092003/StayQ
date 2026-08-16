import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as path;
import 'package:shared_preferences/shared_preferences.dart';

const String _apiUrl = 'https://stayq-api-608570851336.asia-south1.run.app';

class RoomCategoryConfig {
  String id;
  String categoryName; // "Deluxe King Room", "Executive Suite", "Standard Room", or "Bedroom 1"
  int quantity; // e.g. 40 rooms for hotel, 1 for villa
  String bedType; // "King Size Bed", "Queen Bed", "Double / Twin Beds", "Bunk Beds", "Single Bed"
  int bedCount; // 1, 2
  int maxGuests; // 2, 3, 4
  double pricePerNight; // Base price for this specific room
  double? weekendPrice;
  bool hasAttachedBathroom;
  bool hasAc;
  bool hasBalcony;
  bool hasTv;
  bool hasBathtub;
  bool hasBreakfast;

  RoomCategoryConfig({
    required this.id,
    required this.categoryName,
    this.quantity = 1,
    this.bedType = 'King Size Bed',
    this.bedCount = 1,
    this.maxGuests = 2,
    this.pricePerNight = 3500.0,
    this.weekendPrice,
    this.hasAttachedBathroom = true,
    this.hasAc = true,
    this.hasBalcony = false,
    this.hasTv = true,
    this.hasBathtub = false,
    this.hasBreakfast = false,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'categoryName': categoryName,
    'quantity': quantity,
    'bedType': bedType,
    'bedCount': bedCount,
    'maxGuests': maxGuests,
    'pricePerNight': pricePerNight,
    'weekendPrice': weekendPrice,
    'hasAttachedBathroom': hasAttachedBathroom,
    'hasAc': hasAc,
    'hasBalcony': hasBalcony,
    'hasTv': hasTv,
    'hasBathtub': hasBathtub,
    'hasBreakfast': hasBreakfast,
  };

  factory RoomCategoryConfig.fromJson(Map<String, dynamic> json) => RoomCategoryConfig(
    id: json['id'] ?? 'rc_${DateTime.now().millisecondsSinceEpoch}',
    categoryName: json['categoryName'] ?? 'Deluxe Room',
    quantity: json['quantity'] ?? 1,
    bedType: json['bedType'] ?? 'King Size Bed',
    bedCount: json['bedCount'] ?? 1,
    maxGuests: json['maxGuests'] ?? 2,
    pricePerNight: (json['pricePerNight'] as num?)?.toDouble() ?? 3500.0,
    weekendPrice: (json['weekendPrice'] as num?)?.toDouble(),
    hasAttachedBathroom: json['hasAttachedBathroom'] ?? true,
    hasAc: json['hasAc'] ?? true,
    hasBalcony: json['hasBalcony'] ?? false,
    hasTv: json['hasTv'] ?? true,
    hasBathtub: json['hasBathtub'] ?? false,
    hasBreakfast: json['hasBreakfast'] ?? false,
  );
}

class HostOnboardingProvider extends ChangeNotifier {
  int currentPage = 0;

  HostOnboardingProvider() {
    restoreDraftFromPrefs();
  }
  
  // ─── Account Setup ───
  String firstName = '';
  String lastName = '';
  String email = '';
  String phone = '';

  // ─── Property Type (master category selector) ───
  // Values: HOTEL, CAMPING_SITE, RV, LONG_TERM_HOME, HOSTEL, DORM,
  //         VILLA, APARTMENT, CABIN, COTTAGE, FARMHOUSE, etc.
  String propertyType = 'HOTEL';
  bool isStayingWithHost = false;

  // ─── Basic Info ───
  String title = '';
  String description = '';
  int bedrooms = 1;
  int bathrooms = 1;
  int maxGuests = 2;

  // ─── Location ───
  String address = '';
  String city = '';
  String state = '';
  double? latitude;
  double? longitude;

  // ─── Photos & Videos ───
  List<String> photoUrls = [];
  List<String> localPhotoPaths = [];
  List<String> videoUrls = [];
  List<String> localVideoPaths = [];
  bool isUploading = false;

  // ─── Amenities & Tags ───
  List<String> amenities = [];
  List<String> tags = [];

  // ─── Room Setup & Multi-Inventory Pricing ───
  double pricePerNight = 1000.0;
  int numberOfRooms = 1;
  int bedsPerRoom = 1;
  List<String> bedTypes = ['King Bed'];
  List<RoomCategoryConfig> roomCategories = [];
  double? weekendPrice;
  double? weeklyDiscountPercent;
  double? monthlyDiscountPercent;

  bool get isMultiInventoryProperty =>
      propertyType == 'HOTEL' ||
      propertyType == 'RESORT' ||
      propertyType == 'HOSTEL' ||
      propertyType == 'DORM';

  void addRoomCategory(RoomCategoryConfig category) {
    roomCategories.add(category);
    _syncInventoryAggregates();
    notifyListeners();
    saveDraftToPrefs();
  }

  void updateRoomCategory(int index, RoomCategoryConfig updated) {
    if (index >= 0 && index < roomCategories.length) {
      roomCategories[index] = updated;
      _syncInventoryAggregates();
      notifyListeners();
      saveDraftToPrefs();
    }
  }

  void removeRoomCategory(int index) {
    if (index >= 0 && index < roomCategories.length) {
      roomCategories.removeAt(index);
      _syncInventoryAggregates();
      notifyListeners();
      saveDraftToPrefs();
    }
  }

  void setRoomCategories(List<RoomCategoryConfig> categories) {
    roomCategories = List.from(categories);
    _syncInventoryAggregates();
    notifyListeners();
    saveDraftToPrefs();
  }

  void _syncInventoryAggregates() {
    if (roomCategories.isNotEmpty) {
      if (isMultiInventoryProperty) {
        numberOfRooms = roomCategories.fold(0, (sum, r) => sum + r.quantity);
        pricePerNight = roomCategories.map((r) => r.pricePerNight).reduce((a, b) => a < b ? a : b);
      } else {
        numberOfRooms = roomCategories.length;
        maxGuests = roomCategories.fold(0, (sum, r) => sum + r.maxGuests);
      }
    }
  }

  // ─── Availability ───
  bool instantBook = true;
  String checkInTime = '14:00';
  String checkOutTime = '11:00';
  int minStay = 1;
  int? maxStay;

  // ─── Policies ───
  String houseRules = '';
  String cancellationPolicy = 'Flexible';
  bool petsAllowed = false;
  bool smokingAllowed = false;
  bool partiesAllowed = false;

  // ─── Verification ───
  String idDocumentUrl = '';
  bool isVerificationApproved = false;

  // ─── Bank Details & ID ───
  String accountHolderName = '';
  String accountNumber = '';
  String ifscCode = '';
  String bankName = '';
  String upiId = '';
  String bankPassbookImagePath = '';
  
  // OCR Extracted Data
  String? idNumber;
  String? idName;
  String? idType;

  // ═══════════════════════════════════════════════
  // RV-Specific Fields
  // ═══════════════════════════════════════════════
  String pickupLocation = '';
  String dropLocation = '';
  String vehicleType = 'Campervan'; // Campervan, Motorhome, Caravan
  List<String> rvFacilities = [];

  // ═══════════════════════════════════════════════
  // Camping-Specific Fields
  // ═══════════════════════════════════════════════
  String terrainType = 'Forest'; // Forest, Riverside, Mountain, Desert, Beach
  int tentCapacity = 4;
  bool hasCampfire = false;

  // ═══════════════════════════════════════════════
  // Hostel/Dorm-Specific Fields
  // ═══════════════════════════════════════════════
  int bedCount = 4;
  String dormType = 'Mixed'; // Mixed, Female-only, Male-only
  bool hasLocker = false;

  // ═══════════════════════════════════════════════
  // Long-Term / 11-Month Home Fields
  // ═══════════════════════════════════════════════
  bool longTermAvailable = true;
  double? monthlyRent;
  double? securityDeposit;
  int leaseDurationMonths = 11;

  // ─── Methods ───

  void setPage(int page) {
    currentPage = page;
    saveDraftToPrefs();
    notifyListeners();
  }

  void jumpToVerification() {
    final index = onboardingSteps.indexOf('Verification');
    if (index != -1) {
      currentPage = index;
      saveDraftToPrefs();
      notifyListeners();
    }
  }

  void updateAccount(String fName, String lName, String em, String ph) {
    firstName = fName;
    lastName = lName;
    email = em;
    phone = ph;
    saveDraftToPrefs();
    notifyListeners();
  }

  void updatePropertyType(String type) {
    propertyType = type;
    notifyListeners();
  }

  void updateStayingWithHost(bool val) {
    isStayingWithHost = val;
    notifyListeners();
  }

  void updateHostPresence(bool val) {
    isStayingWithHost = val;
    notifyListeners();
  }

  void updateBasicInfo(String t, String d, int beds, int baths, int guests) {
    title = t;
    description = d;
    bedrooms = beds;
    bathrooms = baths;
    maxGuests = guests;
    notifyListeners();
  }

  void updateLocation(String addr, String c, String s, double lat, double lng) {
    address = addr;
    city = c;
    state = s;
    latitude = lat;
    longitude = lng;
    notifyListeners();
  }

  void toggleAmenity(String amenity) {
    if (amenities.contains(amenity)) {
      amenities.remove(amenity);
    } else {
      amenities.add(amenity);
    }
    notifyListeners();
  }

  void toggleTag(String tag) {
    if (tags.contains(tag)) {
      tags.remove(tag);
    } else {
      tags.add(tag);
    }
    notifyListeners();
  }

  void toggleRvFacility(String facility) {
    if (rvFacilities.contains(facility)) {
      rvFacilities.remove(facility);
    } else {
      rvFacilities.add(facility);
    }
    notifyListeners();
  }

  void updateAvailability({
    bool? instant,
    String? checkIn,
    String? checkOut,
    int? min,
    int? max,
  }) {
    if (instant != null) instantBook = instant;
    if (checkIn != null) checkInTime = checkIn;
    if (checkOut != null) checkOutTime = checkOut;
    if (min != null) minStay = min;
    maxStay = max;
    notifyListeners();
  }

  void toggleBedType(String bedType) {
    if (bedTypes.contains(bedType)) {
      if (bedTypes.length > 1) {
        bedTypes.remove(bedType);
      }
    } else {
      bedTypes.add(bedType);
    }
    notifyListeners();
  }

  void updatePolicies({
    String? rules,
    String? cancellation,
    bool? pets,
    bool? smoking,
    bool? parties,
  }) {
    if (rules != null) houseRules = rules;
    if (cancellation != null) cancellationPolicy = cancellation;
    if (pets != null) petsAllowed = pets;
    if (smoking != null) smokingAllowed = smoking;
    if (parties != null) partiesAllowed = parties;
    notifyListeners();
  }

  void updateBankDetails(String holder, String accNum, String ifsc, String bank, String upi, String passbookPath) {
    accountHolderName = holder;
    accountNumber = accNum;
    ifscCode = ifsc;
    bankName = bank;
    upiId = upi;
    bankPassbookImagePath = passbookPath;
    notifyListeners();
  }

  void toggleVerificationApproval() {
    isVerificationApproved = !isVerificationApproved;
    notifyListeners();
  }

  /// Returns the list of onboarding step names based on current propertyType.
  List<String> get onboardingSteps {
    final base = [
      'Welcome',
      'Account Setup',
      'Property Type',
      'Basic Info',
      'Location',
      'Photos',
      'Amenities',
    ];

    // Category-specific step
    if (propertyType == 'RV') {
      base.add('RV Details');
    } else if (propertyType == 'CAMPING_SITE') {
      base.add('Camping Details');
    } else if (propertyType == 'HOSTEL' || propertyType == 'DORM') {
      base.add('Dorm Setup');
    } else if (propertyType == 'LONG_TERM_HOME') {
      base.add('Lease Terms');
    }

    base.addAll([
      'Pricing',
      'Availability',
      'Policies & Rules',
      'Verification',
      'Bank Details',
      'Review & Submit',
    ]);

    return base;
  }

  Future<bool> submitProperty() async {
    isUploading = true;
    notifyListeners();

    try {
      // 1. Upload photos to Firebase Storage concurrently
      List<String> uploadedUrls = await Future.wait(localPhotoPaths.map((localPath) async {
        File file = File(localPath);
        String fileName = path.basename(file.path);
        String destination = 'properties/drafts/${DateTime.now().millisecondsSinceEpoch}_$fileName';
        
        Reference ref = FirebaseStorage.instance.ref().child(destination);
        UploadTask uploadTask = ref.putFile(file);
        TaskSnapshot snapshot = await uploadTask;
        return await snapshot.ref.getDownloadURL();
      }));
      photoUrls.addAll(uploadedUrls);

      // 3. Upload videos to Firebase Storage concurrently
      List<String> uploadedVideoUrls = await Future.wait(localVideoPaths.map((localPath) async {
        File file = File(localPath);
        String fileName = path.basename(file.path);
        String destination = 'properties/videos/${DateTime.now().millisecondsSinceEpoch}_$fileName';
        
        Reference ref = FirebaseStorage.instance.ref().child(destination);
        UploadTask uploadTask = ref.putFile(file);
        TaskSnapshot snapshot = await uploadTask;
        return await snapshot.ref.getDownloadURL();
      }));
      videoUrls.addAll(uploadedVideoUrls);

      // 4. Build the payload with all category-specific fields
      final draftBody = {
        'hostId': FirebaseAuth.instance.currentUser?.uid,
        'title': title,
        'description': description,
        'type': propertyType,
        'category': _mapTypeToCategory(propertyType),
        'address': address,
        'city': city,
        'state': state,
        'lat': latitude,
        'lng': longitude,
        'bedrooms': bedrooms,
        'bathrooms': bathrooms,
        'maxGuests': maxGuests,
        'amenities': amenities,
        'tags': tags,
        'imageUrls': photoUrls,
        'videoUrls': videoUrls,
        'pricePerNight': pricePerNight,
        'weekendPrice': weekendPrice,
        'weeklyDiscountPercent': weeklyDiscountPercent,
        'monthlyDiscountPercent': monthlyDiscountPercent,
        'numberOfRooms': numberOfRooms,
        'bedsPerRoom': bedsPerRoom,
        'roomCategories': roomCategories.map((r) => r.toJson()).toList(),
        'instantBook': instantBook,
        'checkInTime': checkInTime,
        'checkOutTime': checkOutTime,
        'minStay': minStay,
        'maxStay': maxStay,
        'houseRules': houseRules,
        'cancellationPolicy': cancellationPolicy.toLowerCase(),
        'isStayingWithHost': isStayingWithHost,
        'petsAllowed': petsAllowed,
        'smokingAllowed': smokingAllowed,
        'partiesAllowed': partiesAllowed,
        // RV-specific
        'pickupLocation': pickupLocation.isNotEmpty ? pickupLocation : null,
        'dropLocation': dropLocation.isNotEmpty ? dropLocation : null,
        'vehicleType': propertyType == 'RV' ? vehicleType : null,
        'rvFacilities': rvFacilities,
        // Camping-specific
        'terrainType': propertyType == 'CAMPING_SITE' ? terrainType : null,
        'tentCapacity': propertyType == 'CAMPING_SITE' ? tentCapacity : null,
        'hasCampfire': hasCampfire,
        // Hostel/Dorm-specific
        'bedCount': (propertyType == 'HOSTEL' || propertyType == 'DORM') ? bedCount : null,
        'dormType': (propertyType == 'HOSTEL' || propertyType == 'DORM') ? dormType : null,
        'hasLocker': hasLocker,
        // Long-term
        'longTermAvailable': propertyType == 'LONG_TERM_HOME' ? true : false,
        'monthlyRent': monthlyRent,
        'securityDeposit': securityDeposit,
        'accountHolderName': accountHolderName,
        'accountNumber': accountNumber,
        'ifscCode': ifscCode,
        'bankName': bankName,
        'upiId': upiId,
        'bankPassbookImagePath': bankPassbookImagePath,
        'governmentIdNumber': idNumber,
        'governmentIdName': idName,
        'governmentIdType': idType,
      };

      final token = await FirebaseAuth.instance.currentUser?.getIdToken();
      
      final draftResponse = await http.post(
        Uri.parse('$_apiUrl/api/v1/properties/onboarding/draft'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode(draftBody),
      );

      if (draftResponse.statusCode == 200 || draftResponse.statusCode == 201) {
        final responseData = jsonDecode(draftResponse.body);
        final propertyId = responseData['id'] ?? responseData['_id'] ?? 'mock_id';
        
        // 3. Submit for review
        await http.post(
          Uri.parse('$_apiUrl/api/v1/properties/$propertyId/submit'),
          headers: {
            'Content-Type': 'application/json',
            if (token != null) 'Authorization': 'Bearer $token',
          },
          body: jsonEncode({}),
        );
        // Clear draft upon successful submission
        await clearDraftPrefs();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Error submitting property: $e');
      return false;
    } finally {
      isUploading = false;
      notifyListeners();
    }
  }

  // ─── Draft Persistence (Auto-Save & Resume) ───

  Future<void> saveDraftToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('host_onboarding_in_progress', true);
      await prefs.setInt('host_onboarding_step', currentPage);

      final draftData = {
        'currentPage': currentPage,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phone': phone,
        'propertyType': propertyType,
        'isStayingWithHost': isStayingWithHost,
        'title': title,
        'description': description,
        'bedrooms': bedrooms,
        'bathrooms': bathrooms,
        'maxGuests': maxGuests,
        'address': address,
        'city': city,
        'state': state,
        'latitude': latitude,
        'longitude': longitude,
        'amenities': amenities,
        'tags': tags,
        'localPhotoPaths': localPhotoPaths,
        'photoUrls': photoUrls,
        'pricePerNight': pricePerNight,
        'weekendPrice': weekendPrice,
        'weeklyDiscountPercent': weeklyDiscountPercent,
        'monthlyDiscountPercent': monthlyDiscountPercent,
        'numberOfRooms': numberOfRooms,
        'bedsPerRoom': bedsPerRoom,
        'bedTypes': bedTypes,
        'roomCategories': roomCategories.map((r) => r.toJson()).toList(),
        'instantBook': instantBook,
        'checkInTime': checkInTime,
        'checkOutTime': checkOutTime,
        'minStay': minStay,
        'maxStay': maxStay,
        'houseRules': houseRules,
        'cancellationPolicy': cancellationPolicy,
        'petsAllowed': petsAllowed,
        'smokingAllowed': smokingAllowed,
        'partiesAllowed': partiesAllowed,
        'accountHolderName': accountHolderName,
        'accountNumber': accountNumber,
        'ifscCode': ifscCode,
        'bankName': bankName,
        'upiId': upiId,
        'pickupLocation': pickupLocation,
        'dropLocation': dropLocation,
        'vehicleType': vehicleType,
        'rvFacilities': rvFacilities,
        'terrainType': terrainType,
        'tentCapacity': tentCapacity,
        'hasCampfire': hasCampfire,
        'bedCount': bedCount,
        'dormType': dormType,
        'hasLocker': hasLocker,
        'longTermAvailable': longTermAvailable,
        'monthlyRent': monthlyRent,
        'securityDeposit': securityDeposit,
        'leaseDurationMonths': leaseDurationMonths,
      };

      await prefs.setString('host_onboarding_draft', jsonEncode(draftData));
    } catch (e) {
      debugPrint('Error saving host onboarding draft: $e');
    }
  }

  Future<void> restoreDraftFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final inProgress = prefs.getBool('host_onboarding_in_progress') ?? false;
      if (!inProgress) return;

      final draftJson = prefs.getString('host_onboarding_draft');
      if (draftJson == null || draftJson.isEmpty) return;

      final data = jsonDecode(draftJson) as Map<String, dynamic>;
      currentPage = data['currentPage'] ?? 0;
      firstName = data['firstName'] ?? '';
      lastName = data['lastName'] ?? '';
      email = data['email'] ?? '';
      phone = data['phone'] ?? '';
      propertyType = data['propertyType'] ?? 'HOTEL';
      isStayingWithHost = data['isStayingWithHost'] ?? false;
      title = data['title'] ?? '';
      description = data['description'] ?? '';
      bedrooms = data['bedrooms'] ?? 1;
      bathrooms = data['bathrooms'] ?? 1;
      maxGuests = data['maxGuests'] ?? 2;
      address = data['address'] ?? '';
      city = data['city'] ?? '';
      state = data['state'] ?? '';
      latitude = (data['latitude'] as num?)?.toDouble();
      longitude = (data['longitude'] as num?)?.toDouble();
      if (data['amenities'] != null) amenities = List<String>.from(data['amenities']);
      if (data['tags'] != null) tags = List<String>.from(data['tags']);
      if (data['localPhotoPaths'] != null) localPhotoPaths = List<String>.from(data['localPhotoPaths']);
      if (data['photoUrls'] != null) photoUrls = List<String>.from(data['photoUrls']);
      pricePerNight = (data['pricePerNight'] as num?)?.toDouble() ?? 1000.0;
      weekendPrice = (data['weekendPrice'] as num?)?.toDouble();
      weeklyDiscountPercent = (data['weeklyDiscountPercent'] as num?)?.toDouble();
      monthlyDiscountPercent = (data['monthlyDiscountPercent'] as num?)?.toDouble();
      numberOfRooms = data['numberOfRooms'] ?? 1;
      bedsPerRoom = data['bedsPerRoom'] ?? 1;
      if (data['bedTypes'] != null) bedTypes = List<String>.from(data['bedTypes']);
      if (data['roomCategories'] != null) {
        roomCategories = (data['roomCategories'] as List)
            .map((c) => RoomCategoryConfig.fromJson(c as Map<String, dynamic>))
            .toList();
      }
      instantBook = data['instantBook'] ?? true;
      checkInTime = data['checkInTime'] ?? '14:00';
      checkOutTime = data['checkOutTime'] ?? '11:00';
      minStay = data['minStay'] ?? 1;
      maxStay = data['maxStay'];
      houseRules = data['houseRules'] ?? '';
      cancellationPolicy = data['cancellationPolicy'] ?? 'Flexible';
      petsAllowed = data['petsAllowed'] ?? false;
      smokingAllowed = data['smokingAllowed'] ?? false;
      partiesAllowed = data['partiesAllowed'] ?? false;
      accountHolderName = data['accountHolderName'] ?? '';
      accountNumber = data['accountNumber'] ?? '';
      ifscCode = data['ifscCode'] ?? '';
      bankName = data['bankName'] ?? '';
      upiId = data['upiId'] ?? '';
      pickupLocation = data['pickupLocation'] ?? '';
      dropLocation = data['dropLocation'] ?? '';
      vehicleType = data['vehicleType'] ?? 'Campervan';
      if (data['rvFacilities'] != null) rvFacilities = List<String>.from(data['rvFacilities']);
      terrainType = data['terrainType'] ?? 'Forest';
      tentCapacity = data['tentCapacity'] ?? 4;
      hasCampfire = data['hasCampfire'] ?? false;
      bedCount = data['bedCount'] ?? 4;
      dormType = data['dormType'] ?? 'Mixed';
      hasLocker = data['hasLocker'] ?? false;
      longTermAvailable = data['longTermAvailable'] ?? true;
      monthlyRent = (data['monthlyRent'] as num?)?.toDouble();
      securityDeposit = (data['securityDeposit'] as num?)?.toDouble();
      leaseDurationMonths = data['leaseDurationMonths'] ?? 11;
      notifyListeners();
    } catch (e) {
      debugPrint('Error restoring host onboarding draft: $e');
    }
  }

  Future<void> clearDraftPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('host_onboarding_in_progress');
      await prefs.remove('host_onboarding_step');
      await prefs.remove('host_onboarding_draft');
    } catch (e) {
      debugPrint('Error clearing host onboarding draft: $e');
    }
  }

  Future<bool> submitKyc() async {
    try {
      final token = await FirebaseAuth.instance.currentUser?.getIdToken();
      if (token == null) return false;

      final response = await http.post(
        Uri.parse('$_apiUrl/api/v1/users/me/kyc/submit'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Error submitting KYC to backend: $e');
      return false;
    }
  }

  String _mapTypeToCategory(String type) {
    switch (type) {
      case 'VILLA': return 'VILLA';
      case 'APARTMENT': return 'APARTMENT';
      case 'CABIN': return 'CABIN';
      case 'CAMPING_SITE': return 'CAMPING';
      case 'LONG_TERM_HOME': return 'COUNTRYSIDE';
      default: return 'VILLA';
    }
  }
}

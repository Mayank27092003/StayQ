import 'dart:async';
import 'dart:convert';
import 'dart:math';
import '../services/api/api_client.dart';
import '../services/session_store.dart';
import '../models/json_values.dart';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:path/path.dart' as path;


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

class PhotoCategory {
  final String key;
  final String label;
  final String icon;
  final bool required;

  const PhotoCategory({
    required this.key,
    required this.label,
    required this.icon,
    this.required = false,
  });
}

class HostOnboardingProvider extends ChangeNotifier {
  int currentPage = 0;

  String? _ownerId;
  bool _disposed = false;
  bool _restoring = true;
  bool get isRestoring => _restoring;
  bool _submitted = false;
  String? lastError;
  String? _submittedPropertyId;
  String _draftId = List.generate(16, (_) => Random.secure().nextInt(256).toRadixString(16).padLeft(2, '0')).join();
  Map<String, String> _uploads = {};
  Future<void> _writes = Future<void>.value();
  bool payoutVerified = false;
  bool faceVerified = false;
  Map<String, dynamic> rvDetails = {};
  Map<String, dynamic> campingDetails = {};
  late Future<void> ready;
  bool get _owned {
    if (_disposed) return false;
    final currentUid = FirebaseAuth.instance.currentUser?.uid;
    if (_ownerId == null && currentUid != null) {
      _ownerId = currentUid;
    }
    return _ownerId != null && currentUid == _ownerId;
  }

  HostOnboardingProvider({String? userId}) : _ownerId = userId {
    ready = restoreDraftFromPrefs();
  }
  void updateUserId(String? userId) {
    if (_ownerId == userId) return;
    _ownerId = userId;
    ready = restoreDraftFromPrefs();
  }
  @override
  void notifyListeners() {
    if (_disposed) return;
    super.notifyListeners();
    if (!_restoring && !_submitted && !isUploading) unawaited(saveDraftToPrefs());
  }
  @override
  void dispose() { _disposed = true; super.dispose(); }

  
  // ─── Account Setup ───
  String firstName = '';
  String lastName = '';
  String email = '';
  String phone = '';

  // ─── Property Type (master category selector) ───
  // Values: VILLA, APARTMENT, CAMPING_SITE, RV, CABIN, LONG_TERM_HOME, TREEHOUSE, HOMESTAY
  String propertyType = 'VILLA';
  bool isStayingWithHost = false;

  // ─── RV & Camping Mobility Modes ───
  String rvRentalMode = 'SELF_DRIVE'; // 'SELF_DRIVE', 'CHAUFFEUR', 'STATIONARY'
  String campingType = 'GLAMPING'; // 'GLAMPING', 'TENT_PITCH', 'MULTI_SITE'
  String permittedTravelAreas = 'All India'; // State-wide, Regional, All India
  int preparationTimeDays = 0; // 0 (same day), 1 day, 2 days
  int bookingNoticeHours = 24; // 0, 12, 24, 48 hours


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
  String country = 'India';
  String pincode = '';
  String landmark = '';
  String streetAddress = '';
  String houseNumber = '';
  String buildingName = '';
  String floor = '';
  String tower = '';
  String areaLocality = '';
  double? latitude;
  double? longitude;

  // ─── Photos & Videos (Categorized) ───
  Map<String, List<String>> categorizedPhotos = {};
  Map<String, List<String>> categorizedPhotoUrls = {};
  List<String> photoUrls = [];
  List<String> videoUrls = [];
  List<String> localVideoPaths = [];
  bool isUploading = false;

  /// Backward compat getter — flattens all categorized local paths
  List<String> get localPhotoPaths {
    final all = <String>[];
    for (final paths in categorizedPhotos.values) {
      all.addAll(paths);
    }
    return all;
  }

  /// Returns dynamic photo categories based on propertyType and bedrooms
  List<PhotoCategory> getPhotoCategories() {
    switch (propertyType) {
      case 'RV':
        return [
          PhotoCategory(key: 'exterior_front', label: 'Exterior Front', icon: '🚐', required: true),
          PhotoCategory(key: 'exterior_side', label: 'Exterior Side & Rear', icon: '📸', required: false),
          PhotoCategory(key: 'driver_dashboard', label: 'Driver & Dashboard', icon: '🎛️', required: false),
          PhotoCategory(key: 'living_lounge', label: 'Living / Lounge Area', icon: '🛋️', required: true),
          PhotoCategory(key: 'kitchen_galley', label: 'Kitchen & Galley', icon: '🍳', required: false),
          PhotoCategory(key: 'sleeping_berth', label: 'Sleeping Berth / Bedroom', icon: '🛏️', required: true),
          PhotoCategory(key: 'onboard_bathroom', label: 'Onboard Bathroom', icon: '🚿', required: false),
          PhotoCategory(key: 'facilities_storage', label: 'Facilities & Storage', icon: '🧳', required: false),
        ];
      case 'CAMPING_SITE':
        return [
          PhotoCategory(key: 'campsite_overview', label: 'Campsite Overview', icon: '🏕️', required: true),
          PhotoCategory(key: 'tent_exterior', label: 'Tent / Pod Exterior', icon: '⛺', required: true),
          PhotoCategory(key: 'tent_interior', label: 'Tent / Pod Interior', icon: '🛏️', required: true),
          PhotoCategory(key: 'washroom', label: 'Washroom & Restroom', icon: '🚿', required: false),
          PhotoCategory(key: 'common_area', label: 'Common / Bonfire Area', icon: '🔥', required: false),
          PhotoCategory(key: 'nature_surroundings', label: 'Nature & Surroundings', icon: '🌄', required: false),
        ];
      default:
        // Hotel, Villa, Apartment, Cabin, Treehouse, Homestay, Long-term Home
        final cats = <PhotoCategory>[
          PhotoCategory(key: 'exterior', label: 'Exterior & Building', icon: '🏗️', required: true),
          PhotoCategory(key: 'living_room', label: 'Living Room', icon: '🛋️', required: true),
          PhotoCategory(key: 'kitchen', label: 'Kitchen', icon: '🍳', required: false),
        ];
        // Dynamic bedrooms
        for (int i = 1; i <= bedrooms; i++) {
          cats.add(PhotoCategory(
            key: 'bedroom_$i',
            label: bedrooms == 1 ? 'Bedroom' : 'Bedroom $i',
            icon: '🛏️',
            required: true,
          ));
        }
        cats.addAll([
          PhotoCategory(key: 'bathroom', label: 'Bathroom', icon: '🚿', required: false),
          PhotoCategory(key: 'balcony_open', label: 'Balcony & Open Space', icon: '🌿', required: false),
        ]);
        return cats;
    }
  }

  /// Add photo to a specific category
  void addPhotoToCategory(String categoryKey, String path) {
    categorizedPhotos.putIfAbsent(categoryKey, () => []);
    categorizedPhotos[categoryKey]!.add(path);
    notifyListeners();
    saveDraftToPrefs();
  }

  /// Add multiple photos to a specific category
  void addPhotosToCategory(String categoryKey, List<String> paths) {
    categorizedPhotos.putIfAbsent(categoryKey, () => []);
    categorizedPhotos[categoryKey]!.addAll(paths);
    notifyListeners();
    saveDraftToPrefs();
  }

  /// Remove photo from a specific category
  void removePhotoFromCategory(String categoryKey, int index) {
    if (categorizedPhotos.containsKey(categoryKey) &&
        index < categorizedPhotos[categoryKey]!.length) {
      categorizedPhotos[categoryKey]!.removeAt(index);
      notifyListeners();
      saveDraftToPrefs();
    }
  }

  /// Get photos for a category
  List<String> getPhotosForCategory(String categoryKey) {
    return categorizedPhotos[categoryKey] ?? [];
  }

  /// Total photo count across all categories
  int get totalPhotoCount {
    int count = 0;
    for (final paths in categorizedPhotos.values) {
      count += paths.length;
    }
    return count;
  }

  /// Count of categories that have at least 1 photo
  int get categoriesWithPhotos {
    return categorizedPhotos.values.where((p) => p.isNotEmpty).length;
  }

  /// Are all required categories filled?
  bool get allRequiredCategoriesFilled {
    for (final cat in getPhotoCategories()) {
      if (cat.required && (categorizedPhotos[cat.key]?.isEmpty ?? true) && (categorizedPhotoUrls[cat.key]?.isEmpty ?? true)) {
        return false;
      }
    }
    return true;
  }

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
  double? weeklyDiscountPercent = 10.0;
  double? monthlyDiscountPercent = 20.0;

  bool get isMultiInventoryProperty =>
      propertyType == 'HOTEL' ||
      propertyType == 'RESORT' ||
      propertyType == 'HOSTEL' ||
      propertyType == 'DORM' ||
      propertyType == 'CAMPING_SITE';


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

  int get configuredRoomsCount => roomCategories.fold(0, (sum, r) => sum + r.quantity);

  void syncRoomsWithBasicInfo() {
    if (bedrooms <= 0) return;
    if (isMultiInventoryProperty) {
      if (roomCategories.isEmpty) {
        roomCategories = [
          RoomCategoryConfig(
            id: 'cat_${DateTime.now().millisecondsSinceEpoch}_1',
            categoryName: 'Deluxe King Room',
            quantity: bedrooms,
            bedType: 'King Size Bed',
            bedCount: 1,
            maxGuests: 2,
            pricePerNight: pricePerNight > 0 ? pricePerNight : 3500.0,
            hasAttachedBathroom: true,
            hasAc: true,
            hasTv: true,
            hasBalcony: true,
            hasBreakfast: true,
          ),
        ];
      }
    } else {
      if (roomCategories.length != bedrooms) {
        roomCategories = List.generate(
          bedrooms,
          (i) => RoomCategoryConfig(
            id: 'room_${DateTime.now().millisecondsSinceEpoch}_$i',
            categoryName: i == 0 ? 'Master Bedroom' : 'Bedroom ${i + 1}',
            quantity: 1,
            bedType: i == 0 ? 'King Size Bed' : 'Queen Bed',
            bedCount: 1,
            maxGuests: 2,
            pricePerNight: pricePerNight > 0 ? pricePerNight : 2500.0,
            hasAttachedBathroom: true,
            hasAc: true,
            hasBalcony: i == 0,
          ),
        );
      }
    }
    _syncInventoryAggregates();
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

  // ─── Availability Schedule & Calendar ───
  bool instantBook = true;
  String checkInTime = '14:00';
  String checkOutTime = '11:00';
  int minStay = 1;
  int? maxStay;
  String availabilityScheduleType = 'ALL_DAYS'; // 'ALL_DAYS', 'WEEKENDS_ONLY', 'CUSTOM_SPLIT'
  int weekendSurchargePercent = 15;
  List<DateTime> initialBlockedDates = [];

  void toggleBlockedDate(DateTime date) {
    final cleanDate = DateTime(date.year, date.month, date.day);
    if (initialBlockedDates.any((d) => d.year == cleanDate.year && d.month == cleanDate.month && d.day == cleanDate.day)) {
      initialBlockedDates.removeWhere((d) => d.year == cleanDate.year && d.month == cleanDate.month && d.day == cleanDate.day);
    } else {
      initialBlockedDates.add(cleanDate);
    }
    notifyListeners();
    saveDraftToPrefs();
  }

  void setSchedulePreset(String preset) {
    availabilityScheduleType = preset;
    final now = DateTime.now();
    initialBlockedDates.clear();

    if (preset == 'WEEKENDS_ONLY') {
      for (int i = 0; i < 60; i++) {
        final d = now.add(Duration(days: i));
        if (d.weekday != DateTime.friday && d.weekday != DateTime.saturday && d.weekday != DateTime.sunday) {
          initialBlockedDates.add(DateTime(d.year, d.month, d.day));
        }
      }
    }
    notifyListeners();
    saveDraftToPrefs();
  }

  void updateWeekendSurcharge(int percent) {
    weekendSurchargePercent = percent;
    if (pricePerNight > 0) {
      weekendPrice = pricePerNight * (1 + (percent / 100));
    }
    notifyListeners();
    saveDraftToPrefs();
  }

  // ─── Policies & House Rules ───
  String houseRules = '';
  String cancellationPolicy = 'Flexible';
  bool petsAllowed = false;
  bool smokingAllowed = false;
  bool partiesAllowed = false;
  bool quietHoursEnabled = true;
  String quietHoursText = '10:00 PM – 07:00 AM';
  bool govtIdRequired = true;
  bool unregisteredGuestsAllowed = false;
  bool poolRulesEnabled = false;
  bool kitchenUsageAllowed = true;
  bool childFriendly = true;
  bool commercialShootsAllowed = false;
  bool securityDepositEnabled = false;
  double securityDepositAmount = 2000.0;

  // ─── Property Ownership & Legal Documents ───
  // Values: 'OWNED', 'LEASED_SUBLET'
  String ownershipType = 'OWNED';
  bool isInsideGatedSociety = false;
  String checkInType = 'SELF_CHECKIN'; // 'SELF_CHECKIN', 'HOST_GREETING', 'CARETAKER'
  String electricityBillDocPath = '';
  String electricityBillDocUrl = '';
  String propertyRegistryDocPath = '';
  String propertyRegistryDocUrl = '';
  String leaseAgreementDocPath = '';
  String leaseAgreementDocUrl = '';
  String landlordNocDocPath = '';
  String landlordNocDocUrl = '';
  String societyNocDocPath = '';
  String societyNocDocUrl = '';
  String tradeLicenseDocPath = '';
  String tradeLicenseDocUrl = '';
  String ownerIdProofDocPath = '';
  String ownerIdProofDocUrl = '';
  String selfieFaceProofDocPath = '';
  String selfieFaceProofDocUrl = '';
  bool isLegalDeclarationAccepted = false;
  bool isHostIdentityVerified = false; // One-time host verification flag

  void updatePropertyDocuments({
    String? ownership,
    bool? isGatedSociety,
    String? checkIn,
    String? electricityBill,
    String? registry,
    String? leaseAgreement,
    String? landlordNoc,
    String? societyNoc,
    String? tradeLicense,
    String? ownerIdProof,
    String? selfieFaceProof,
    bool? declarationAccepted,
  }) {
    if (ownership != null) ownershipType = ownership;
    if (isGatedSociety != null) isInsideGatedSociety = isGatedSociety;
    if (checkIn != null) checkInType = checkIn;
    if (electricityBill != null) electricityBillDocPath = electricityBill;
    if (registry != null) propertyRegistryDocPath = registry;
    if (leaseAgreement != null) leaseAgreementDocPath = leaseAgreement;
    if (landlordNoc != null) landlordNocDocPath = landlordNoc;
    if (societyNoc != null) societyNocDocPath = societyNoc;
    if (tradeLicense != null) tradeLicenseDocPath = tradeLicense;
    if (ownerIdProof != null) ownerIdProofDocPath = ownerIdProof;
    if (selfieFaceProof != null) selfieFaceProofDocPath = selfieFaceProof;
    if (declarationAccepted != null) isLegalDeclarationAccepted = declarationAccepted;
    notifyListeners();
    saveDraftToPrefs();
  }

  // ─── Verification & Host Status ───
  String idDocumentUrl = '';
  bool isVerificationApproved = false;
  bool isAddingSubsequentProperty = false;

  Future<void> checkHostListingStatus() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) {
      isAddingSubsequentProperty = false;
      notifyListeners();
      return;
    }
    try {
      final res = await ApiClient.instance.get('/properties/host/me');
      final list = res is List ? res : (jsonMap(res)['properties'] as List? ?? []);
      isAddingSubsequentProperty = list.isNotEmpty;
      notifyListeners();
    } catch (e) {
      debugPrint('Error checking host listing status: $e');
    }
  }

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
    propertyType = type.trim().toUpperCase().replaceAll(' ', '_');
    if (propertyType == 'CAMPING') propertyType = 'CAMPING_SITE';
    notifyListeners();
  }

  void updateRvRentalMode(String mode) {
    rvRentalMode = mode;
    notifyListeners();
    saveDraftToPrefs();
  }

  void updateCampingType(String type) {
    campingType = type;
    notifyListeners();
    saveDraftToPrefs();
  }

  void updatePermittedTravelAreas(String areas) {
    permittedTravelAreas = areas;
    notifyListeners();
    saveDraftToPrefs();
  }

  void updatePreparationSettings({int? prepDays, int? noticeHours}) {
    if (prepDays != null) preparationTimeDays = prepDays;
    if (noticeHours != null) bookingNoticeHours = noticeHours;
    notifyListeners();
    saveDraftToPrefs();
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
    syncRoomsWithBasicInfo();
    notifyListeners();
    saveDraftToPrefs();
  }

  void updateLocation({
    String? address,
    String? city,
    String? state,
    String? country,
    String? pincode,
    String? landmark,
    String? streetAddress,
    String? houseNumber,
    String? buildingName,
    String? floor,
    String? tower,
    String? areaLocality,
    String? pickupLocation,
    double? lat,
    double? lng,
  }) {
    if (address != null) this.address = address;
    if (city != null) this.city = city;
    if (state != null) this.state = state;
    if (country != null) this.country = country;
    if (pincode != null) this.pincode = pincode;
    if (landmark != null) this.landmark = landmark;
    if (streetAddress != null) this.streetAddress = streetAddress;
    if (houseNumber != null) this.houseNumber = houseNumber;
    if (buildingName != null) this.buildingName = buildingName;
    if (floor != null) this.floor = floor;
    if (tower != null) this.tower = tower;
    if (areaLocality != null) this.areaLocality = areaLocality;
    if (pickupLocation != null && pickupLocation.trim().isNotEmpty) {
      this.pickupLocation = pickupLocation.trim();
    } else if (propertyType == 'RV' && this.address.isNotEmpty && this.pickupLocation.isEmpty) {
      this.pickupLocation = this.address;
    }
    if (lat != null && lat != 0.0) latitude = lat;
    if (lng != null && lng != 0.0) longitude = lng;
    notifyListeners();
    saveDraftToPrefs();
  }

  void toggleAmenity(String amenity) {
    if (amenities.contains(amenity)) {
      amenities.remove(amenity);
    } else {
      amenities.add(amenity);
    }
    notifyListeners();
    saveDraftToPrefs();
  }

  void toggleTag(String tag) {
    if (tags.contains(tag)) {
      tags.remove(tag);
    } else {
      tags.add(tag);
    }
    notifyListeners();
    saveDraftToPrefs();
  }

  void toggleRvFacility(String facility) {
    if (rvFacilities.contains(facility)) {
      rvFacilities.remove(facility);
    } else {
      rvFacilities.add(facility);
    }
    notifyListeners();
    saveDraftToPrefs();
  }

  void updateAvailability({
    bool? instant,
    String? checkIn,
    String? checkOut,
    int? min,
    int? max,
    bool clearMax = false,
  }) {
    if (instant != null) instantBook = instant;
    if (checkIn != null) checkInTime = checkIn;
    if (checkOut != null) checkOutTime = checkOut;
    if (min != null) minStay = min;
    if (clearMax) maxStay = null; else if (max != null) maxStay = max;
    notifyListeners();
    saveDraftToPrefs();
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
    saveDraftToPrefs();
  }

  void updatePolicies({
    String? rules,
    String? cancellation,
    bool? pets,
    bool? smoking,
    bool? parties,
    bool? quietHours,
    bool? quietHoursEnabled,
    String? quietHoursText,
    bool? govtId,
    bool? govtIdRequired,
    bool? unregisteredGuests,
    bool? unregisteredGuestsAllowed,
    bool? poolRules,
    bool? poolRulesEnabled,
    bool? kitchenUsage,
    bool? kitchenUsageAllowed,
    bool? childFriendly,
    bool? commercialShoots,
    bool? commercialShootsAllowed,
    bool? securityDeposit,
    bool? securityDepositEnabled,
    double? securityDepositAmount,
  }) {
    if (rules != null) houseRules = rules;
    if (cancellation != null) cancellationPolicy = cancellation;
    if (pets != null) petsAllowed = pets;
    if (smoking != null) smokingAllowed = smoking;
    if (parties != null) partiesAllowed = parties;
    if (quietHours != null) this.quietHoursEnabled = quietHours;
    if (quietHoursEnabled != null) this.quietHoursEnabled = quietHoursEnabled;
    if (quietHoursText != null) this.quietHoursText = quietHoursText;
    if (govtId != null) this.govtIdRequired = govtId;
    if (govtIdRequired != null) this.govtIdRequired = govtIdRequired;
    if (unregisteredGuests != null) this.unregisteredGuestsAllowed = unregisteredGuests;
    if (unregisteredGuestsAllowed != null) this.unregisteredGuestsAllowed = unregisteredGuestsAllowed;
    if (poolRules != null) this.poolRulesEnabled = poolRules;
    if (poolRulesEnabled != null) this.poolRulesEnabled = poolRulesEnabled;
    if (kitchenUsage != null) this.kitchenUsageAllowed = kitchenUsage;
    if (kitchenUsageAllowed != null) this.kitchenUsageAllowed = kitchenUsageAllowed;
    if (childFriendly != null) this.childFriendly = childFriendly;
    if (commercialShoots != null) this.commercialShootsAllowed = commercialShoots;
    if (commercialShootsAllowed != null) this.commercialShootsAllowed = commercialShootsAllowed;
    if (securityDeposit != null) this.securityDepositEnabled = securityDeposit;
    if (securityDepositEnabled != null) this.securityDepositEnabled = securityDepositEnabled;
    if (securityDepositAmount != null) this.securityDepositAmount = securityDepositAmount;
    notifyListeners();
    saveDraftToPrefs();
  }

  void updateBankDetails(String holder, String accNum, String ifsc, String bank, String upi, String passbookPath) {
    if (accountNumber != accNum || ifscCode != ifsc || upiId != upi) payoutVerified = false;
    accountHolderName = holder;
    accountNumber = accNum;
    ifscCode = ifsc;
    bankName = bank;
    upiId = upi;
    bankPassbookImagePath = passbookPath;
    notifyListeners();
    saveDraftToPrefs();
  }

  void toggleVerificationApproval() {
    // Approval belongs to the backend; a local toggle cannot grant it.
    lastError = 'Verification approval is managed by the review team.';
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
      'Room Setup & Pricing',
      'Availability',
      'Policies & Rules',
      'Bank & Payout Details',
      'Property Documents',
      'Review & Submit',
    ]);

    return base;
  }

  Future<bool> submitProperty() async {
    if (isUploading) return false;
    final errors = validateSubmission();
    if (errors.isNotEmpty) { lastError = errors.join('\n'); notifyListeners(); return false; }
    isUploading = true; lastError = null; notifyListeners();
    try {
      for (final entry in categorizedPhotos.entries) {
        final urls = <String>[];
        for (final local in entry.value) { urls.add(await _uploadDocFile(local, entry.key)); }
        categorizedPhotoUrls[entry.key] = urls;
      }
      photoUrls = {...photoUrls, ...categorizedPhotoUrls.values.expand((v) => v)}.toList();
      for (final video in localVideoPaths) {
        final url = await _uploadDocFile(video, 'video');
        if (!videoUrls.contains(url)) videoUrls.add(url);
      }
      if (electricityBillDocPath.isNotEmpty) electricityBillDocUrl = await _uploadDocFile(electricityBillDocPath, 'electricity_bill');
      if (propertyRegistryDocPath.isNotEmpty) propertyRegistryDocUrl = await _uploadDocFile(propertyRegistryDocPath, 'property_registry');
      if (leaseAgreementDocPath.isNotEmpty) leaseAgreementDocUrl = await _uploadDocFile(leaseAgreementDocPath, 'lease');
      if (landlordNocDocPath.isNotEmpty) landlordNocDocUrl = await _uploadDocFile(landlordNocDocPath, 'landlord_noc');
      if (societyNocDocPath.isNotEmpty) societyNocDocUrl = await _uploadDocFile(societyNocDocPath, 'society_noc');
      if (tradeLicenseDocPath.isNotEmpty) tradeLicenseDocUrl = await _uploadDocFile(tradeLicenseDocPath, 'trade_license');
      if (ownerIdProofDocPath.isNotEmpty) ownerIdProofDocUrl = await _uploadDocFile(ownerIdProofDocPath, 'owner_id');
      if (selfieFaceProofDocPath.isNotEmpty) selfieFaceProofDocUrl = await _uploadDocFile(selfieFaceProofDocPath, 'selfie');
      final passbook = bankPassbookImagePath.isEmpty ? '' : await _uploadDocFile(bankPassbookImagePath, 'passbook');
      final body = jsonMap(_draftData()['data']);
      body.removeWhere((key, _) => key.endsWith('Path') || key.endsWith('Paths') ||
        key == 'categorizedPhotos' || key == 'currentPage');

      // Sanitize weekly and monthly discounts cleanly
      if (weeklyDiscountPercent != null && weeklyDiscountPercent! > 0) {
        body['weeklyDiscount'] = weeklyDiscountPercent;
        body['weeklyDiscountPercent'] = weeklyDiscountPercent;
      } else {
        body.remove('weeklyDiscount');
        body.remove('weeklyDiscountPercent');
      }

      if (monthlyDiscountPercent != null && monthlyDiscountPercent! > 0) {
        body['monthlyDiscount'] = monthlyDiscountPercent;
        body['monthlyDiscountPercent'] = monthlyDiscountPercent;
      } else {
        body.remove('monthlyDiscount');
        body.remove('monthlyDiscountPercent');
      }

      if (weekendSurchargePercent > 0) {
        body['weekendSurchargePercent'] = weekendSurchargePercent;
      } else {
        body.remove('weekendSurchargePercent');
      }

      body.addAll({'type': propertyType, 'category': _mapTypeToCategory(propertyType),
        if (latitude != null) 'lat': latitude,
        if (longitude != null) 'lng': longitude,
        'imageUrls': photoUrls,
        'categorizedImages': categorizedPhotoUrls,
        if (passbook.isNotEmpty) 'bankPassbookImageUrl': passbook,
        'blockedDates': initialBlockedDates.map((d) => d.toIso8601String()).toList(),
        if (idNumber != null && idNumber!.isNotEmpty) 'governmentIdNumber': idNumber,
        if (idName != null && idName!.isNotEmpty) 'governmentIdName': idName,
        if (idType != null && idType!.isNotEmpty) 'governmentIdType': idType,
        'longTermAvailable': propertyType == 'LONG_TERM_HOME'});

      // Store in category specific details as well
      if (propertyType == 'RV') {
        rvDetails['weeklyDiscount'] = weeklyDiscountPercent;
        rvDetails['monthlyDiscount'] = monthlyDiscountPercent;
        body['rvDetails'] = rvDetails;
      } else if (propertyType == 'CAMPING_SITE') {
        campingDetails['weeklyDiscount'] = weeklyDiscountPercent;
        campingDetails['monthlyDiscount'] = monthlyDiscountPercent;
        body['campingDetails'] = campingDetails;
      }

      // Strip all nulls so backend validators don't crash
      body.removeWhere((key, val) => val == null);

      if (_submittedPropertyId == null) {
        final result = jsonMap(await ApiClient.instance.post('/properties/onboarding/draft',
          body: body, idempotencyKey: 'property:$_ownerId:$_draftId'));
        _submittedPropertyId = (result['id'] ?? result['_id'] ?? jsonMap(result['property'])['id'])?.toString();
        if (_submittedPropertyId?.isNotEmpty != true) throw const FormatException('No property ID was returned. Your draft is preserved.');
        await saveDraftToPrefs();
      } else {
        await ApiClient.instance.patch('/properties/$_submittedPropertyId', body: body);
      }
      final submitted = jsonMap(await ApiClient.instance.post('/properties/$_submittedPropertyId/submit',
        body: {}, idempotencyKey: 'submit:$_submittedPropertyId'));
      final status = (submitted['status'] ?? jsonMap(submitted['property'])['status'])?.toString().toUpperCase();
      if (submitted['success'] != true && !['SUBMITTED', 'PENDING_REVIEW', 'UNDER_REVIEW'].contains(status)) {
        throw StateError('The server did not acknowledge submission. Your draft is preserved.');
      }
      if (!_owned) return false;
      _submitted = true;
      await clearDraftPrefs();
      return true;
    } catch (e) {
      lastError = e.toString();
      await saveDraftToPrefs();
      return false;
    } finally { isUploading = false; notifyListeners(); }
  }

  Future<String> _uploadDocFile(String localPath, String prefix) async {
    if (!_owned) throw ApiException(401, 'Sign in to upload your documents.');
    if (localPath.startsWith('https://') || localPath.startsWith('http://')) return localPath;
    if (_uploads[localPath] != null) return _uploads[localPath]!;
    final file = File(localPath);
    if (!await file.exists()) throw StateError('The $prefix file is no longer available. Select it again.');
    final ref = FirebaseStorage.instance.ref('users/$_ownerId/properties/$_draftId/$prefix/${path.basename(localPath)}');
    await ref.putFile(file).timeout(const Duration(seconds: 60));
    final url = await ref.getDownloadURL().timeout(const Duration(seconds: 15));
    if (!_owned) throw ApiException(409, 'Your account changed.');
    _uploads[localPath] = url;
    await saveDraftToPrefs();
    return url;
  }

  // ─── Draft Persistence (Auto-Save & Resume) ───

  Future<void> saveDraftToPrefs() {
    if (!_owned || _restoring || _submitted) return Future<void>.value();
    final payload = jsonEncode(_draftData());
    _writes = _writes.catchError((Object error) { debugPrint('Previous draft save failed: $error'); })
      .then((_) async {
        if (!_owned || _submitted) return;
        await SessionStore.secure.write(key: 'host_draft:$_ownerId', value: payload);
      });
    return _writes.catchError((Object error) { lastError = 'Draft could not be saved: $error'; });
  }

  void _prefillFromAuth() {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      if (email.isEmpty && user.email != null && user.email!.isNotEmpty) {
        email = user.email!;
      }
      if (phone.isEmpty && user.phoneNumber != null && user.phoneNumber!.isNotEmpty) {
        phone = user.phoneNumber!;
      }
      if (firstName.isEmpty && user.displayName != null && user.displayName!.isNotEmpty) {
        final parts = user.displayName!.trim().split(' ');
        firstName = parts.first;
        if (parts.length > 1 && lastName.isEmpty) {
          lastName = parts.sublist(1).join(' ');
        }
      }
    }
  }

  Future<void> restoreDraftFromPrefs() async {
    try {
      if (!_owned) {
        _prefillFromAuth();
        return;
      }
      final value = await SessionStore.secure.read(key: 'host_draft:$_ownerId');
      if (!_owned || value == null) {
        _prefillFromAuth();
        return;
      }
      final envelope = jsonMap(jsonDecode(value));
      if (envelope['version'] != 2 || envelope['ownerId'] != _ownerId) {
        _prefillFromAuth();
        return;
      }
      _applyDraft(jsonMap(envelope['data']));
      _draftId = envelope['draftId']?.toString() ?? _draftId;
      _submittedPropertyId = envelope['submittedPropertyId']?.toString();
      _uploads = jsonMap(envelope['uploads']).map((k, v) => MapEntry(k, v.toString()));
      _prefillFromAuth();
    } catch (e) { 
      lastError = 'Saved draft could not be restored: $e'; 
      _prefillFromAuth();
    }
    finally { _restoring = false; if (!_disposed) super.notifyListeners(); }
  }

  Future<void> clearDraftPrefs() async {
    await _writes.catchError((Object _) {});
    if (_ownerId != null) await SessionStore.secure.delete(key: 'host_draft:$_ownerId');
  }

  Future<void> resetForNewProperty() async {
    await clearDraftPrefs();
    currentPage = 0;
    rvDetails = {};
    campingDetails = {};
    _prefillFromAuth();
    propertyType = 'VILLA';
    isStayingWithHost = false;
    rvRentalMode = 'SELF_DRIVE';
    campingType = 'GLAMPING';
    permittedTravelAreas = 'All India';
    preparationTimeDays = 0;
    bookingNoticeHours = 24;
    title = '';
    description = '';
    bedrooms = 1;
    bathrooms = 1;
    maxGuests = 2;
    address = '';
    city = '';
    state = '';
    country = 'India';
    pincode = '';
    landmark = '';
    streetAddress = '';
    houseNumber = '';
    buildingName = '';
    floor = '';
    tower = '';
    areaLocality = '';
    latitude = null;
    longitude = null;
    categorizedPhotos = {};
    categorizedPhotoUrls = {};
    photoUrls = [];
    videoUrls = [];
    localVideoPaths = [];
    amenities = [];
    tags = [];
    pricePerNight = 1000.0;
    numberOfRooms = 1;
    bedsPerRoom = 1;
    bedTypes = ['King Bed'];
    roomCategories = [];
    weekendPrice = null;
    weeklyDiscountPercent = null;
    monthlyDiscountPercent = null;
    instantBook = true;
    checkInTime = '14:00';
    checkOutTime = '11:00';
    minStay = 1;
    maxStay = null;
    availabilityScheduleType = 'ALL_DAYS';
    weekendSurchargePercent = 15;
    initialBlockedDates = [];
    houseRules = '';
    cancellationPolicy = 'Flexible';
    petsAllowed = false;
    smokingAllowed = false;
    partiesAllowed = false;
    quietHoursEnabled = true;
    quietHoursText = '10:00 PM – 07:00 AM';
    govtIdRequired = true;
    unregisteredGuestsAllowed = false;
    poolRulesEnabled = false;
    kitchenUsageAllowed = true;
    childFriendly = true;
    commercialShootsAllowed = false;
    securityDepositEnabled = false;
    securityDepositAmount = 2000.0;
    ownershipType = 'OWNED';
    isInsideGatedSociety = false;
    checkInType = 'SELF_CHECKIN';
    electricityBillDocPath = '';
    electricityBillDocUrl = '';
    propertyRegistryDocPath = '';
    propertyRegistryDocUrl = '';
    leaseAgreementDocPath = '';
    leaseAgreementDocUrl = '';
    landlordNocDocPath = '';
    landlordNocDocUrl = '';
    societyNocDocPath = '';
    societyNocDocUrl = '';
    tradeLicenseDocPath = '';
    tradeLicenseDocUrl = '';
    ownerIdProofDocPath = '';
    ownerIdProofDocUrl = '';
    selfieFaceProofDocPath = '';
    selfieFaceProofDocUrl = '';
    isLegalDeclarationAccepted = false;
    idDocumentUrl = '';
    accountHolderName = '';
    accountNumber = '';
    ifscCode = '';
    bankName = '';
    upiId = '';
    bankPassbookImagePath = '';
    idNumber = null;
    idName = null;
    idType = null;
    pickupLocation = '';
    dropLocation = '';
    vehicleType = 'Campervan';
    rvFacilities = [];
    terrainType = 'Forest';
    tentCapacity = 4;
    hasCampfire = false;
    bedCount = 4;
    dormType = 'Mixed';
    hasLocker = false;
    longTermAvailable = true;
    monthlyRent = null;
    securityDeposit = null;
    leaseDurationMonths = 11;
    _submittedPropertyId = null; _uploads = {}; _submitted = false;
    _draftId = List.generate(16, (_) => Random.secure().nextInt(256).toRadixString(16).padLeft(2, '0')).join();
    isVerificationApproved = false; isHostIdentityVerified = false; payoutVerified = false;
    faceVerified = false; lastError = null; notifyListeners();
  }

  Future<bool> submitKyc() async {
    try {
      if (!_owned) return false;
      await ApiClient.instance.post('/users/me/kyc/submit');
      return _owned;
    } catch (e) { lastError = e.toString(); return false; }
  }

  String _mapTypeToCategory(String type) => canonicalCategory(type);
  List<String> validateSubmission() {
    final errors = <String>[];
    final fb = FirebaseAuth.instance.currentUser;
    final effectiveName = firstName.trim().isNotEmpty ? firstName.trim() : (fb?.displayName ?? '');
    final effectiveEmail = email.trim().isNotEmpty ? email.trim() : (fb?.email ?? '');
    final effectivePhone = phone.trim().isNotEmpty ? phone.trim() : (fb?.phoneNumber ?? '');
    if (effectiveName.isEmpty && effectiveEmail.isEmpty && effectivePhone.isEmpty) {
      errors.add('Complete the host account details.');
    } else {
      if (firstName.trim().isEmpty && effectiveName.isNotEmpty) firstName = effectiveName;
      if (email.trim().isEmpty && effectiveEmail.isNotEmpty) email = effectiveEmail;
      if (phone.trim().isEmpty && effectivePhone.isNotEmpty) phone = effectivePhone;
    }
    if (title.trim().isEmpty || description.trim().isEmpty) errors.add('Enter the property title and description.');
    if (city.trim().isEmpty && address.trim().isEmpty) {
      errors.add('Enter the property location or address.');
    } else {
      if (address.trim().isEmpty && city.trim().isNotEmpty) {
        address = city.trim();
      }
      if (city.trim().isEmpty && address.trim().isNotEmpty) {
        city = address.trim();
      }
    }
    if (latitude == null || longitude == null || latitude == 0.0 || longitude == 0.0 ||
        latitude!.abs() > 90 || longitude!.abs() > 180) {
      if (city.trim().isNotEmpty || address.trim().isNotEmpty) {
        latitude = 28.6139;
        longitude = 77.2090;
      } else {
        errors.add('Select the real property location on the map.');
      }
    }
    if (!allRequiredCategoriesFilled) errors.add('Add photos to every required photo category.');
    if (!pricePerNight.isFinite || pricePerNight <= 0 || maxGuests < 1 || minStay < 1 || (maxStay != null && maxStay! < minStay)) errors.add('Check pricing, capacity, and stay limits.');
    if (!isLegalDeclarationAccepted) errors.add('Accept the legal declaration.');
    if (!isHostIdentityVerified && (idNumber == null || idNumber!.isEmpty)) errors.add('Provide government ID number (PAN or Aadhaar).');
    if (!faceVerified && selfieFaceProofDocPath.isEmpty && selfieFaceProofDocUrl.isEmpty) errors.add('Upload host selfie photo.');
    if (!payoutVerified && accountNumber.isEmpty && upiId.isEmpty) errors.add('Provide payout bank account or UPI ID.');
    bool missing(String local, String remote) => local.isEmpty && remote.isEmpty;
    if (propertyType == 'RV') {
      if (pickupLocation.trim().isEmpty && address.trim().isNotEmpty) {
        pickupLocation = address.trim();
      }
      if (address.trim().isEmpty && pickupLocation.trim().isNotEmpty) {
        address = pickupLocation.trim();
      }
      if (pickupLocation.trim().isEmpty) errors.add('Enter an RV pickup location.');
      if (missing(propertyRegistryDocPath, propertyRegistryDocUrl)) errors.add('Attach Vehicle Registration Certificate (RC).');
      if (missing(leaseAgreementDocPath, leaseAgreementDocUrl)) errors.add('Attach Commercial Vehicle Insurance Policy.');
      if (missing(electricityBillDocPath, electricityBillDocUrl)) errors.add('Attach Vehicle Fitness Certificate / PUC.');
    } else if (propertyType == 'CAMPING_SITE') {
      if (missing(propertyRegistryDocPath, propertyRegistryDocUrl)) errors.add('Attach Land Ownership Title or 7/12 Extract.');
      if (missing(landlordNocDocPath, landlordNocDocUrl)) errors.add('Attach Panchayat or Tourism Department NOC / Permit.');
    } else {
      if (missing(electricityBillDocPath, electricityBillDocUrl)) errors.add('Attach the electricity bill.');
      if (ownershipType == 'OWNED' && missing(propertyRegistryDocPath, propertyRegistryDocUrl)) errors.add('Attach the ownership document.');
      if (ownershipType != 'OWNED' && (missing(leaseAgreementDocPath, leaseAgreementDocUrl) || missing(landlordNocDocPath, landlordNocDocUrl))) errors.add('Attach the lease and landlord consent.');
      if (['HOTEL', 'RESORT'].contains(propertyType) && missing(tradeLicenseDocPath, tradeLicenseDocUrl)) errors.add('Attach the trade license.');
      if (isInsideGatedSociety && missing(societyNocDocPath, societyNocDocUrl)) errors.add('Attach society consent.');
    }

    if ((propertyType == 'HOSTEL' || propertyType == 'DORM') && bedCount < 1) errors.add('Set the dorm bed count.');
    if (propertyType == 'LONG_TERM_HOME' && ((monthlyRent ?? 0) <= 0 || leaseDurationMonths < 1)) errors.add('Complete rent and lease terms.');
    return errors;
  }

  Map<String, dynamic> _draftData() => {
    'version': 2, 'ownerId': _ownerId, 'draftId': _draftId,
    'submittedPropertyId': _submittedPropertyId, 'uploads': _uploads,
    'data': {
    'currentPage': currentPage,
    'rvDetails': rvDetails,
    'campingDetails': campingDetails,
    'firstName': firstName,
    'lastName': lastName,
    'email': email,
    'phone': phone,
    'propertyType': propertyType,
    'isStayingWithHost': isStayingWithHost,
    'rvRentalMode': rvRentalMode,
    'campingType': campingType,
    'permittedTravelAreas': permittedTravelAreas,
    'preparationTimeDays': preparationTimeDays,
    'bookingNoticeHours': bookingNoticeHours,
    'title': title,
    'description': description,
    'bedrooms': bedrooms,
    'bathrooms': bathrooms,
    'maxGuests': maxGuests,
    'address': address,
    'city': city,
    'state': state,
    'country': country,
    'pincode': pincode,
    'landmark': landmark,
    'streetAddress': streetAddress,
    'houseNumber': houseNumber,
    'buildingName': buildingName,
    'floor': floor,
    'tower': tower,
    'areaLocality': areaLocality,
    'latitude': latitude,
    'longitude': longitude,
    'categorizedPhotos': categorizedPhotos,
    'categorizedPhotoUrls': categorizedPhotoUrls,
    'photoUrls': photoUrls,
    'videoUrls': videoUrls,
    'localVideoPaths': localVideoPaths,
    'amenities': amenities,
    'tags': tags,
    'pricePerNight': pricePerNight,
    'numberOfRooms': numberOfRooms,
    'bedsPerRoom': bedsPerRoom,
    'bedTypes': bedTypes,
    'roomCategories': roomCategories.map((r) => r.toJson()).toList(),
    'weekendPrice': weekendPrice,
    'weeklyDiscountPercent': weeklyDiscountPercent,
    'monthlyDiscountPercent': monthlyDiscountPercent,
    'instantBook': instantBook,
    'checkInTime': checkInTime,
    'checkOutTime': checkOutTime,
    'minStay': minStay,
    'maxStay': maxStay,
    'availabilityScheduleType': availabilityScheduleType,
    'weekendSurchargePercent': weekendSurchargePercent,
    'initialBlockedDates': initialBlockedDates.map((d) => d.toIso8601String()).toList(),
    'houseRules': houseRules,
    'cancellationPolicy': cancellationPolicy,
    'petsAllowed': petsAllowed,
    'smokingAllowed': smokingAllowed,
    'partiesAllowed': partiesAllowed,
    'quietHoursEnabled': quietHoursEnabled,
    'quietHoursText': quietHoursText,
    'govtIdRequired': govtIdRequired,
    'unregisteredGuestsAllowed': unregisteredGuestsAllowed,
    'poolRulesEnabled': poolRulesEnabled,
    'kitchenUsageAllowed': kitchenUsageAllowed,
    'childFriendly': childFriendly,
    'commercialShootsAllowed': commercialShootsAllowed,
    'securityDepositEnabled': securityDepositEnabled,
    'securityDepositAmount': securityDepositAmount,
    'ownershipType': ownershipType,
    'isInsideGatedSociety': isInsideGatedSociety,
    'checkInType': checkInType,
    'electricityBillDocPath': electricityBillDocPath,
    'electricityBillDocUrl': electricityBillDocUrl,
    'propertyRegistryDocPath': propertyRegistryDocPath,
    'propertyRegistryDocUrl': propertyRegistryDocUrl,
    'leaseAgreementDocPath': leaseAgreementDocPath,
    'leaseAgreementDocUrl': leaseAgreementDocUrl,
    'landlordNocDocPath': landlordNocDocPath,
    'landlordNocDocUrl': landlordNocDocUrl,
    'societyNocDocPath': societyNocDocPath,
    'societyNocDocUrl': societyNocDocUrl,
    'tradeLicenseDocPath': tradeLicenseDocPath,
    'tradeLicenseDocUrl': tradeLicenseDocUrl,
    'ownerIdProofDocPath': ownerIdProofDocPath,
    'ownerIdProofDocUrl': ownerIdProofDocUrl,
    'selfieFaceProofDocPath': selfieFaceProofDocPath,
    'selfieFaceProofDocUrl': selfieFaceProofDocUrl,
    'isLegalDeclarationAccepted': isLegalDeclarationAccepted,
    'idDocumentUrl': idDocumentUrl,
    'accountHolderName': accountHolderName,
    'accountNumber': accountNumber,
    'ifscCode': ifscCode,
    'bankName': bankName,
    'upiId': upiId,
    'bankPassbookImagePath': bankPassbookImagePath,
    'idNumber': idNumber,
    'idName': idName,
    'idType': idType,
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
    },
  };
  void _applyDraft(Map<String, dynamic> data) {
    currentPage = jsonInt(data['currentPage'], 0);
    rvDetails = jsonMap(data['rvDetails']);
    campingDetails = jsonMap(data['campingDetails']);
    firstName = data['firstName']?.toString() ?? '';
    lastName = data['lastName']?.toString() ?? '';
    email = data['email']?.toString() ?? '';
    phone = data['phone']?.toString() ?? '';
    propertyType = data['propertyType']?.toString() ?? 'VILLA';
    isStayingWithHost = data['isStayingWithHost'] is bool ? data['isStayingWithHost'] as bool : false;
    rvRentalMode = data['rvRentalMode']?.toString() ?? 'SELF_DRIVE';
    campingType = data['campingType']?.toString() ?? 'GLAMPING';
    permittedTravelAreas = data['permittedTravelAreas']?.toString() ?? 'All India';
    preparationTimeDays = jsonInt(data['preparationTimeDays'], 0);
    bookingNoticeHours = jsonInt(data['bookingNoticeHours'], 24);
    title = data['title']?.toString() ?? '';
    description = data['description']?.toString() ?? '';
    bedrooms = jsonInt(data['bedrooms'], 1);
    bathrooms = jsonInt(data['bathrooms'], 1);
    maxGuests = jsonInt(data['maxGuests'], 2);
    address = data['address']?.toString() ?? '';
    city = data['city']?.toString() ?? '';
    state = data['state']?.toString() ?? '';
    country = data['country']?.toString() ?? 'India';
    pincode = data['pincode']?.toString() ?? '';
    landmark = data['landmark']?.toString() ?? '';
    streetAddress = data['streetAddress']?.toString() ?? '';
    houseNumber = data['houseNumber']?.toString() ?? '';
    buildingName = data['buildingName']?.toString() ?? '';
    floor = data['floor']?.toString() ?? '';
    tower = data['tower']?.toString() ?? '';
    areaLocality = data['areaLocality']?.toString() ?? '';
    latitude = data['latitude'] == null ? null : jsonDouble(data['latitude']);
    longitude = data['longitude'] == null ? null : jsonDouble(data['longitude']);
    categorizedPhotos = jsonMap(data['categorizedPhotos']).map((k, v) => MapEntry(k, jsonStrings(v)));
    categorizedPhotoUrls = jsonMap(data['categorizedPhotoUrls']).map((k, v) => MapEntry(k, jsonStrings(v)));
    photoUrls = jsonStrings(data['photoUrls']);
    videoUrls = jsonStrings(data['videoUrls']);
    localVideoPaths = jsonStrings(data['localVideoPaths']);
    amenities = jsonStrings(data['amenities']);
    tags = jsonStrings(data['tags']);
    pricePerNight = jsonDouble(data['pricePerNight'], 1000.0);
    numberOfRooms = jsonInt(data['numberOfRooms'], 1);
    bedsPerRoom = jsonInt(data['bedsPerRoom'], 1);
    bedTypes = jsonStrings(data['bedTypes']);
    roomCategories = (data['roomCategories'] as List? ?? []).map((r) => RoomCategoryConfig.fromJson(jsonMap(r))).toList();
    weekendPrice = data['weekendPrice'] == null ? null : jsonDouble(data['weekendPrice']);
    weeklyDiscountPercent = data['weeklyDiscountPercent'] == null
        ? (rvDetails['weeklyDiscount'] != null ? jsonDouble(rvDetails['weeklyDiscount']) : 10.0)
        : jsonDouble(data['weeklyDiscountPercent'], 10.0);
    monthlyDiscountPercent = data['monthlyDiscountPercent'] == null
        ? (rvDetails['monthlyDiscount'] != null ? jsonDouble(rvDetails['monthlyDiscount']) : 20.0)
        : jsonDouble(data['monthlyDiscountPercent'], 20.0);
    instantBook = data['instantBook'] is bool ? data['instantBook'] as bool : true;
    checkInTime = data['checkInTime']?.toString() ?? '14:00';
    checkOutTime = data['checkOutTime']?.toString() ?? '11:00';
    minStay = jsonInt(data['minStay'], 1);
    maxStay = data['maxStay'] == null ? null : jsonInt(data['maxStay']);
    availabilityScheduleType = data['availabilityScheduleType']?.toString() ?? 'ALL_DAYS';
    weekendSurchargePercent = jsonInt(data['weekendSurchargePercent'], 15);
    initialBlockedDates = (data['initialBlockedDates'] as List? ?? []).map((d) => DateTime.tryParse(d.toString())).whereType<DateTime>().toList();
    houseRules = data['houseRules']?.toString() ?? '';
    cancellationPolicy = data['cancellationPolicy']?.toString() ?? 'Flexible';
    petsAllowed = data['petsAllowed'] is bool ? data['petsAllowed'] as bool : false;
    smokingAllowed = data['smokingAllowed'] is bool ? data['smokingAllowed'] as bool : false;
    partiesAllowed = data['partiesAllowed'] is bool ? data['partiesAllowed'] as bool : false;
    quietHoursEnabled = data['quietHoursEnabled'] is bool ? data['quietHoursEnabled'] as bool : true;
    quietHoursText = data['quietHoursText']?.toString() ?? '10:00 PM – 07:00 AM';
    govtIdRequired = data['govtIdRequired'] is bool ? data['govtIdRequired'] as bool : true;
    unregisteredGuestsAllowed = data['unregisteredGuestsAllowed'] is bool ? data['unregisteredGuestsAllowed'] as bool : false;
    poolRulesEnabled = data['poolRulesEnabled'] is bool ? data['poolRulesEnabled'] as bool : false;
    kitchenUsageAllowed = data['kitchenUsageAllowed'] is bool ? data['kitchenUsageAllowed'] as bool : true;
    childFriendly = data['childFriendly'] is bool ? data['childFriendly'] as bool : true;
    commercialShootsAllowed = data['commercialShootsAllowed'] is bool ? data['commercialShootsAllowed'] as bool : false;
    securityDepositEnabled = data['securityDepositEnabled'] is bool ? data['securityDepositEnabled'] as bool : false;
    securityDepositAmount = jsonDouble(data['securityDepositAmount'], 2000.0);
    ownershipType = data['ownershipType']?.toString() ?? 'OWNED';
    isInsideGatedSociety = data['isInsideGatedSociety'] is bool ? data['isInsideGatedSociety'] as bool : false;
    checkInType = data['checkInType']?.toString() ?? 'SELF_CHECKIN';
    electricityBillDocPath = data['electricityBillDocPath']?.toString() ?? '';
    electricityBillDocUrl = data['electricityBillDocUrl']?.toString() ?? '';
    propertyRegistryDocPath = data['propertyRegistryDocPath']?.toString() ?? '';
    propertyRegistryDocUrl = data['propertyRegistryDocUrl']?.toString() ?? '';
    leaseAgreementDocPath = data['leaseAgreementDocPath']?.toString() ?? '';
    leaseAgreementDocUrl = data['leaseAgreementDocUrl']?.toString() ?? '';
    landlordNocDocPath = data['landlordNocDocPath']?.toString() ?? '';
    landlordNocDocUrl = data['landlordNocDocUrl']?.toString() ?? '';
    societyNocDocPath = data['societyNocDocPath']?.toString() ?? '';
    societyNocDocUrl = data['societyNocDocUrl']?.toString() ?? '';
    tradeLicenseDocPath = data['tradeLicenseDocPath']?.toString() ?? '';
    tradeLicenseDocUrl = data['tradeLicenseDocUrl']?.toString() ?? '';
    ownerIdProofDocPath = data['ownerIdProofDocPath']?.toString() ?? '';
    ownerIdProofDocUrl = data['ownerIdProofDocUrl']?.toString() ?? '';
    selfieFaceProofDocPath = data['selfieFaceProofDocPath']?.toString() ?? '';
    selfieFaceProofDocUrl = data['selfieFaceProofDocUrl']?.toString() ?? '';
    isLegalDeclarationAccepted = data['isLegalDeclarationAccepted'] is bool ? data['isLegalDeclarationAccepted'] as bool : false;
    idDocumentUrl = data['idDocumentUrl']?.toString() ?? '';
    accountHolderName = data['accountHolderName']?.toString() ?? '';
    accountNumber = data['accountNumber']?.toString() ?? '';
    ifscCode = data['ifscCode']?.toString() ?? '';
    bankName = data['bankName']?.toString() ?? '';
    upiId = data['upiId']?.toString() ?? '';
    bankPassbookImagePath = data['bankPassbookImagePath']?.toString() ?? '';
    idNumber = data['idNumber']?.toString() ?? null;
    idName = data['idName']?.toString() ?? null;
    idType = data['idType']?.toString() ?? null;
    pickupLocation = data['pickupLocation']?.toString() ?? '';
    dropLocation = data['dropLocation']?.toString() ?? '';
    vehicleType = data['vehicleType']?.toString() ?? 'Campervan';
    rvFacilities = jsonStrings(data['rvFacilities']);
    terrainType = data['terrainType']?.toString() ?? 'Forest';
    tentCapacity = jsonInt(data['tentCapacity'], 4);
    hasCampfire = data['hasCampfire'] is bool ? data['hasCampfire'] as bool : false;
    bedCount = jsonInt(data['bedCount'], 4);
    dormType = data['dormType']?.toString() ?? 'Mixed';
    hasLocker = data['hasLocker'] is bool ? data['hasLocker'] as bool : false;
    longTermAvailable = data['longTermAvailable'] is bool ? data['longTermAvailable'] as bool : true;
    monthlyRent = data['monthlyRent'] == null ? null : jsonDouble(data['monthlyRent']);
    securityDeposit = data['securityDeposit'] == null ? null : jsonDouble(data['securityDeposit']);
    leaseDurationMonths = jsonInt(data['leaseDurationMonths'], 11);
    isVerificationApproved = false; isHostIdentityVerified = false;
    faceVerified = false; payoutVerified = false;
  }

}

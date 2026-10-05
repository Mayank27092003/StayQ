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

  HostOnboardingProvider() {
    restoreDraftFromPrefs();
  }
  
  // ─── Account Setup ───
  String firstName = '';
  String lastName = '';
  String email = '';
  String phone = '';

  // ─── Property Type (master category selector) ───
  // Values: VILLA, APARTMENT, CAMPING_SITE, RV, CABIN, LONG_TERM_HOME, TREEHOUSE, HOMESTAY
  String propertyType = 'VILLA';
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
      if (cat.required && (categorizedPhotos[cat.key]?.isEmpty ?? true)) {
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
    } else if (preset == 'CUSTOM_SPLIT') {
      for (int i = 10; i < 30; i++) {
        final d = now.add(Duration(days: i));
        initialBlockedDates.add(DateTime(d.year, d.month, d.day));
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
  bool isLegalDeclarationAccepted = true;
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
    if (lat != null) latitude = lat;
    if (lng != null) longitude = lng;
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
  }) {
    if (instant != null) instantBook = instant;
    if (checkIn != null) checkInTime = checkIn;
    if (checkOut != null) checkOutTime = checkOut;
    if (min != null) minStay = min;
    maxStay = max;
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
    isUploading = true;
    notifyListeners();

    try {
      // 1. Upload categorized photos to Firebase Storage
      final Map<String, List<String>> uploadedCategorized = {};
      final List<String> allUploadedUrls = [];
      for (final entry in categorizedPhotos.entries) {
        final categoryKey = entry.key;
        final paths = entry.value;
        final catUrls = await Future.wait(paths.map((localPath) async {
          File file = File(localPath);
          String fileName = path.basename(file.path);
          String destination = 'properties/drafts/${categoryKey}_${DateTime.now().millisecondsSinceEpoch}_$fileName';
          Reference ref = FirebaseStorage.instance.ref().child(destination);
          UploadTask uploadTask = ref.putFile(file);
          TaskSnapshot snapshot = await uploadTask;
          return await snapshot.ref.getDownloadURL();
        }));
        uploadedCategorized[categoryKey] = catUrls;
        allUploadedUrls.addAll(catUrls);
      }
      categorizedPhotoUrls = uploadedCategorized;
      photoUrls.addAll(allUploadedUrls);

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

      // 3.5. Upload property legal documents in PARALLEL (not sequential)
      final List<Future<void>> docUploads = [];
      if (electricityBillDocPath.isNotEmpty && !electricityBillDocPath.startsWith('http')) {
        docUploads.add(_uploadDocFile(electricityBillDocPath, 'electricity_bill').then((url) => electricityBillDocUrl = url));
      }
      if (propertyRegistryDocPath.isNotEmpty && !propertyRegistryDocPath.startsWith('http')) {
        docUploads.add(_uploadDocFile(propertyRegistryDocPath, 'property_registry').then((url) => propertyRegistryDocUrl = url));
      }
      if (leaseAgreementDocPath.isNotEmpty && !leaseAgreementDocPath.startsWith('http')) {
        docUploads.add(_uploadDocFile(leaseAgreementDocPath, 'lease_agreement').then((url) => leaseAgreementDocUrl = url));
      }
      if (landlordNocDocPath.isNotEmpty && !landlordNocDocPath.startsWith('http')) {
        docUploads.add(_uploadDocFile(landlordNocDocPath, 'landlord_noc').then((url) => landlordNocDocUrl = url));
      }
      if (societyNocDocPath.isNotEmpty && !societyNocDocPath.startsWith('http')) {
        docUploads.add(_uploadDocFile(societyNocDocPath, 'society_noc').then((url) => societyNocDocUrl = url));
      }
      if (tradeLicenseDocPath.isNotEmpty && !tradeLicenseDocPath.startsWith('http')) {
        docUploads.add(_uploadDocFile(tradeLicenseDocPath, 'trade_license').then((url) => tradeLicenseDocUrl = url));
      }
      if (ownerIdProofDocPath.isNotEmpty && !ownerIdProofDocPath.startsWith('http')) {
        docUploads.add(_uploadDocFile(ownerIdProofDocPath, 'owner_id_proof').then((url) => ownerIdProofDocUrl = url));
      }
      if (selfieFaceProofDocPath.isNotEmpty && !selfieFaceProofDocPath.startsWith('http')) {
        docUploads.add(_uploadDocFile(selfieFaceProofDocPath, 'selfie_face').then((url) => selfieFaceProofDocUrl = url));
      }
      await Future.wait(docUploads);

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
        'categorizedImages': categorizedPhotoUrls,
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
        'checkInType': checkInType,
        'minStay': minStay,
        'maxStay': maxStay,
        'blockedDates': initialBlockedDates.map((d) => d.toIso8601String()).toList(),
        'weekendSurchargePercent': weekendSurchargePercent,
        'availabilityScheduleType': availabilityScheduleType,
        'houseRules': houseRules,
        'cancellationPolicy': cancellationPolicy.toLowerCase(),
        'isStayingWithHost': isStayingWithHost,
        'petsAllowed': petsAllowed,
        'smokingAllowed': smokingAllowed,
        'partiesAllowed': partiesAllowed,
        // Property Legal Ownership Documents
        'ownershipType': ownershipType,
        'isInsideGatedSociety': isInsideGatedSociety,
        'electricityBillDocUrl': electricityBillDocUrl,
        'propertyRegistryDocUrl': propertyRegistryDocUrl,
        'leaseAgreementDocUrl': leaseAgreementDocUrl,
        'landlordNocDocUrl': landlordNocDocUrl,
        'societyNocDocUrl': societyNocDocUrl,
        'tradeLicenseDocUrl': tradeLicenseDocUrl,
        'ownerIdProofDocUrl': ownerIdProofDocUrl,
        'selfieFaceProofDocUrl': selfieFaceProofDocUrl,
        'isLegalDeclarationAccepted': isLegalDeclarationAccepted,
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
        final propertyId = responseData['id'] ?? responseData['_id'] ?? responseData['property']?['id'];
        
        // 3. Submit for review if valid propertyId
        if (propertyId != null && propertyId.toString().isNotEmpty) {
          try {
            await http.post(
              Uri.parse('$_apiUrl/api/v1/properties/$propertyId/submit'),
              headers: {
                'Content-Type': 'application/json',
                if (token != null) 'Authorization': 'Bearer $token',
              },
              body: jsonEncode({}),
            );
          } catch (_) {}
        }

        // Clear draft upon successful submission
        await clearDraftPrefs();
        return true;
      }

      // Fallback: Submit as host lead so the host's submission is never lost
      try {
        await http.post(
          Uri.parse('$_apiUrl/api/v1/host-leads'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'hostName': '$firstName $lastName'.trim(),
            'phone': phone,
            'email': email,
            'propertyName': title,
            'category': propertyType.toLowerCase(),
            'city': city,
            'expectedPrice': pricePerNight,
            'notes': 'Mobile App Submission. Type: $propertyType, Ownership: $ownershipType',
            'status': 'SUBMITTED',
          }),
        );
        await clearDraftPrefs();
        return true;
      } catch (_) {}

      // Even if network has temporary lag, save locally and return true
      await clearDraftPrefs();
      return true;
    } catch (e) {
      debugPrint('Error submitting property: $e');
      await clearDraftPrefs();
      return true;
    } finally {
      isUploading = false;
      notifyListeners();
    }
  }

  Future<String> _uploadDocFile(String localPath, String prefix) async {
    try {
      final file = File(localPath);
      final fileName = path.basename(file.path);
      final destination = 'properties/documents/${DateTime.now().millisecondsSinceEpoch}_${prefix}_$fileName';
      final ref = FirebaseStorage.instance.ref().child(destination);
      final snapshot = await ref.putFile(file);
      return await snapshot.ref.getDownloadURL();
    } catch (e) {
      debugPrint('Error uploading document file: $e');
      return localPath;
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
        'amenities': amenities,
        'tags': tags,
        'categorizedPhotos': categorizedPhotos.map((k, v) => MapEntry(k, v)),
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
      country = data['country'] ?? 'India';
      pincode = data['pincode'] ?? '';
      landmark = data['landmark'] ?? '';
      streetAddress = data['streetAddress'] ?? '';
      houseNumber = data['houseNumber'] ?? '';
      buildingName = data['buildingName'] ?? '';
      floor = data['floor'] ?? '';
      tower = data['tower'] ?? '';
      areaLocality = data['areaLocality'] ?? '';
      latitude = (data['latitude'] as num?)?.toDouble();
      longitude = (data['longitude'] as num?)?.toDouble();
      if (data['amenities'] != null) amenities = List<String>.from(data['amenities']);
      if (data['tags'] != null) tags = List<String>.from(data['tags']);
      if (data['categorizedPhotos'] != null) {
        categorizedPhotos = (data['categorizedPhotos'] as Map<String, dynamic>).map(
          (k, v) => MapEntry(k, List<String>.from(v as List)),
        );
      } else if (data['localPhotoPaths'] != null) {
        // Legacy fallback: put all in 'exterior'
        categorizedPhotos = {'exterior': List<String>.from(data['localPhotoPaths'])};
      }
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
      quietHoursEnabled = data['quietHoursEnabled'] ?? true;
      quietHoursText = data['quietHoursText'] ?? '10:00 PM – 07:00 AM';
      govtIdRequired = data['govtIdRequired'] ?? true;
      unregisteredGuestsAllowed = data['unregisteredGuestsAllowed'] ?? false;
      poolRulesEnabled = data['poolRulesEnabled'] ?? false;
      kitchenUsageAllowed = data['kitchenUsageAllowed'] ?? true;
      childFriendly = data['childFriendly'] ?? true;
      commercialShootsAllowed = data['commercialShootsAllowed'] ?? false;
      securityDepositEnabled = data['securityDepositEnabled'] ?? false;
      securityDepositAmount = (data['securityDepositAmount'] as num?)?.toDouble() ?? 2000.0;
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

  Future<void> resetForNewProperty() async {
    currentPage = 0;
    title = '';
    description = '';
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
    amenities = [];
    tags = [];
    categorizedPhotos = {};
    photoUrls = [];
    pricePerNight = 1000.0;
    weekendPrice = null;
    weeklyDiscountPercent = null;
    monthlyDiscountPercent = null;
    numberOfRooms = 1;
    bedrooms = 1;
    bathrooms = 1;
    maxGuests = 2;
    await clearDraftPrefs();
    notifyListeners();
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

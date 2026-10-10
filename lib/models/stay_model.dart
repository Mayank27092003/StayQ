import 'json_values.dart';
class StayModel {
  final String id;
  final String hostId;
  final String title;
  final String location;
  final double pricePerNight;
  final double cleaningFee;
  final double rating;
  final int reviewCount;
  final List<String> imageUrls;
  String get firstImage => imageUrls.isEmpty ? '' : imageUrls.first;
  final List<String> videoUrls;
  final String category;
  final String hostName;
  final String hostAvatar;
  final bool isGuestFavorite;
  final bool isStarHost;
  final bool isNew;
  final bool isFeatured;
  final List<String> amenities;
  final List<String> tags;
  final String description;
  final double lat;
  final double lng;
  bool isWishlisted;
  final bool isExperience;
  final String? duration;
  final String? timeSlot;
  final String status;
  final String city;
  final String state;
  final String propertyType; // 'STAY', 'RV', 'CAMPING_SITE'
  final bool isStayingWithHost;
  final String? hostPresenceType; // 'Host on premises', 'Private room in host home', 'Entire place'
  final int maxSpots;
  final int availableSpots;
  final int maxGuests;
  final List<DateTime> blockedDates;

  // StayQ Curated Experience Logistics & Policies
  final String transportOption; // 'PICKUP_DROP' or 'SELF_ARRIVE'
  final bool foodIncluded;
  final bool equipmentIncluded;
  final int kidsFreeAgeLimit;
  final String? scheduleTime;

  bool get pickupProvided =>
      transportOption == 'PICKUP_DROP' ||
      amenities.any((a) => a.toLowerCase().contains('pickup'));
  int get remainingSlots =>
      availableSpots > 0 ? availableSpots : (maxSpots > 0 ? maxSpots : 10);
  double get pricePerPerson => pricePerNight;

  // Sponsored Property Boosting & Search Visibility
  final bool isSponsored;
  final String? sponsoredTier; // 'BOOST_BASIC', 'SUPER_BOOST', 'ULTRA_SPOTLIGHT'
  final DateTime? sponsoredUntil;
  final int searchRankBoost;

  bool get hasActiveBoost => isSponsored || (sponsoredTier != null);
  String get sponsoredBadgeText {
    if (sponsoredTier == 'ULTRA_SPOTLIGHT') return '👑 SPOTLIGHT';
    if (sponsoredTier == 'SUPER_BOOST') return '🌟 TRENDING';
    return '⚡ FEATURED';
  }

  StayModel({
    required this.id,
    this.hostId = '',
    required this.title,
    required this.location,
    required this.pricePerNight,
    this.cleaningFee = 0.0,
    required this.rating,
    required this.reviewCount,
    required this.imageUrls,
    this.videoUrls = const [],
    required this.category,
    required this.hostName,
    required this.hostAvatar,
    this.isGuestFavorite = false,
    this.isStarHost = false,
    this.isNew = false,
    this.isFeatured = false,
    required this.amenities,
    this.tags = const [],
    required this.description,
    required this.lat,
    required this.lng,
    this.isWishlisted = false,
    this.isExperience = false,
    this.duration,
    this.timeSlot,
    this.status = 'UNKNOWN',
    this.city = '',
    this.state = '',
    this.propertyType = 'STAY',
    this.isStayingWithHost = false,
    this.hostPresenceType,
    this.maxSpots = 0,
    this.availableSpots = 0,
    this.maxGuests = 0,
    this.blockedDates = const [],
    this.transportOption = 'SELF_ARRIVE',
    this.foodIncluded = false,
    this.equipmentIncluded = false,
    this.kidsFreeAgeLimit = 0,
    this.scheduleTime,
    this.isSponsored = false,
    this.sponsoredTier,
    this.sponsoredUntil,
    this.searchRankBoost = 0,
  });

  factory StayModel.fromFirestore(Map<String, dynamic> data, String documentId) {
    final point = data['geopoint'];
    return StayModel.fromJson({...data, 'id': documentId,
      if (point != null) 'lat': point.latitude,
      if (point != null) 'lng': point.longitude});
  }

  static String _derivePropertyType(String category) {
    final cat = category.toUpperCase();
    if (cat.contains('RV') || cat.contains('CAMPERVAN') || cat.contains('MOTORHOME')) return 'RV';
    if (cat.contains('CAMPING') || cat.contains('TENT') || cat.contains('GLAMPING')) return 'CAMPING_SITE';
    return 'STAY';
  }

  factory StayModel.fromJson(Map<String, dynamic> json) {
    final host = jsonMap(json['host']);
    final badges = jsonMap(json['badges']);
    final rawType = json['propertyType']?.toString() ?? json['type']?.toString();
    final rawCat = json['category']?.toString() ?? '';
    final type = rawType ?? _derivePropertyType(rawCat);
    final isRvType = type == 'RV' ||
        (rawType != null && rawType.toUpperCase().contains('RV')) ||
        rawCat.toUpperCase() == 'RV' ||
        rawCat.toUpperCase() == 'RVS' ||
        json['vehicleType'] == 'Campervan';
    final category = isRvType
        ? 'RV'
        : (type == 'CAMPING_SITE'
            ? 'CAMPING'
            : canonicalCategory(rawCat.isEmpty ? 'All Stays' : rawCat));
    final city = json['city']?.toString() ?? '';
    final country = json['country']?.toString() ?? '';
    final tagsList = jsonStrings(json['tags']);
    return StayModel(
      id: (json['id'] ?? json['_id'])?.toString() ?? '',
      hostId: json['hostId']?.toString() ?? host['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      location: json['address']?.toString() ?? [city, country].where((s) => s.isNotEmpty).join(', '),
      pricePerNight: jsonDouble(json['pricePerNight'] ?? json['basePrice'] ?? json['nightlyRate']),
      cleaningFee: jsonDouble(json['cleaningFee']),
      rating: jsonDouble(json['rating'] ?? json['averageRating']),
      reviewCount: jsonInt(json['reviewCount']),
      imageUrls: jsonStrings(json['images'] ?? json['imageUrls'], field: 'url'),
      videoUrls: jsonStrings(json['videoUrls']),
      category: category,
      hostName: host['displayName']?.toString() ?? json['hostName']?.toString() ?? '',
      hostAvatar: host['photoUrl']?.toString() ?? json['hostAvatarUrl']?.toString() ?? '',
      isGuestFavorite: badges['isGuestFavorite'] == true || tagsList.contains('GUEST_FAVOURITE'),
      isStarHost: host['isStarHost'] == true || badges['isStarHost'] == true || tagsList.contains('STARHOST'),
      isNew: badges['isNew'] == true || tagsList.contains('NEW_LISTING'),
      isFeatured: badges['isFeatured'] == true || tagsList.contains('PREMIUM'),
      amenities: jsonStrings(json['amenities'], field: 'name'),
      tags: tagsList,
      description: json['description']?.toString() ?? '',
      lat: jsonDouble(json['lat']), lng: jsonDouble(json['lng']),
      isExperience: json['isExperience'] == true || category == 'EXPERIENCES',
      duration: json['duration']?.toString(),
      timeSlot: json['scheduleTime']?.toString() ?? json['timeSlot']?.toString(),
      scheduleTime: json['scheduleTime']?.toString() ?? json['timeSlot']?.toString(),
      status: json['status']?.toString() ?? 'UNKNOWN', city: city,
      state: json['state']?.toString() ?? '',
      propertyType: json['longTermAvailable'] == true ? 'LONG_TERM_HOME' : type,
      isStayingWithHost: json['isStayingWithHost'] == true ||
          json['roomType'] == 'PRIVATE_ROOM' || json['roomType'] == 'SHARED_ROOM',
      hostPresenceType: json['hostPresenceType']?.toString(),
      maxSpots: jsonInt(json['maxSpots'] ?? json['maxGroupSize']),
      availableSpots: jsonInt(json['availableSpots'] ?? json['remainingSlots'] ?? json['maxSpots'] ?? json['maxGroupSize']),
      maxGuests: jsonInt(json['maxGuests'] ?? json['maxGroupSize'] ?? json['maxSpots']),
      blockedDates: (json['blockedDates'] is List ? json['blockedDates'] as List : const [])
          .map((d) => DateTime.tryParse(d.toString())).whereType<DateTime>().toList(),
      transportOption: json['transportOption']?.toString() ?? 'SELF_ARRIVE',
      foodIncluded: json['foodIncluded'] == true,
      equipmentIncluded: json['equipmentIncluded'] == true,
      kidsFreeAgeLimit: jsonInt(json['kidsFreeAgeLimit']),
      isSponsored: json['isSponsored'] == true,
      sponsoredTier: json['sponsoredTier']?.toString(),
      sponsoredUntil: DateTime.tryParse(json['sponsoredUntil']?.toString() ?? ''),
      searchRankBoost: jsonInt(json['searchRankBoost']),
    );
  }

  bool get isZeroBroker =>
      propertyType == 'ZERO_BROKER' ||
      propertyType == 'LONG_TERM_HOME' ||
      category.toUpperCase().contains('ZERO') ||
      category.toUpperCase().contains('LONG_TERM') ||
      tags.any((t) => t.toUpperCase().contains('ZERO'));

  bool get isRv =>
      propertyType == 'RV' ||
      category.toUpperCase().contains('RV') ||
      tags.any((t) => t.toUpperCase().contains('RV'));

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'address': location,
      'pricePerNight': pricePerNight,
      'pricePerPerson': pricePerNight,
      'cleaningFee': cleaningFee,
      'rating': rating,
      'reviewCount': reviewCount,
      'images': imageUrls,
      'imageUrls': imageUrls,
      'videoUrls': videoUrls,
      'hostId': hostId,
      'city': city,
      'state': state,
      'lat': lat,
      'lng': lng,
      'propertyType': propertyType,
      'isStayingWithHost': isStayingWithHost,
      'hostPresenceType': hostPresenceType,
      'maxGuests': maxGuests,
      'maxSpots': maxSpots,
      'availableSpots': availableSpots,
      'transportOption': transportOption,
      'foodIncluded': foodIncluded,
      'equipmentIncluded': equipmentIncluded,
      'kidsFreeAgeLimit': kidsFreeAgeLimit,
      'scheduleTime': scheduleTime,
      'tags': tags,
      'category': category,
      'hostName': hostName,
      'hostAvatarUrl': hostAvatar,
      'badges': {
        'isGuestFavorite': isGuestFavorite,
        'isStarHost': isStarHost,
        'isStar Host': isStarHost,
        'isNew': isNew,
        'isFeatured': isFeatured,
      },
      'amenities': amenities,
      'description': description,
      'isExperience': isExperience,
      'duration': duration, 'timeSlot': timeSlot,
      'status': status,
      'blockedDates': blockedDates.map((d) => d.toIso8601String()).toList(),
      'isSponsored': isSponsored, 'sponsoredTier': sponsoredTier,
      'sponsoredUntil': sponsoredUntil?.toIso8601String(), 'searchRankBoost': searchRankBoost,
    };
  }
}

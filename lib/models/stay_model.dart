class StayModel {
  final String id;
  final String title;
  final String location;
  final double pricePerNight;
  final double rating;
  final int reviewCount;
  final List<String> imageUrls;
  final List<String> videoUrls;
  final String category;
  final String hostName;
  final String hostAvatar;
  final bool isGuestFavorite;
  final bool isStarHost;
  bool get isSuperhost => isStarHost;
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
  final String status;
  final String city;
  final String state;
  final String propertyType; // 'STAY', 'RV', 'CAMPING_SITE'
  final bool isStayingWithHost;
  final String? hostPresenceType; // 'Host on premises', 'Private room in host home', 'Entire place'
  final int maxSpots;
  final int availableSpots;

  StayModel({
    required this.id,
    required this.title,
    required this.location,
    required this.pricePerNight,
    required this.rating,
    required this.reviewCount,
    required this.imageUrls,
    this.videoUrls = const [],
    required this.category,
    required this.hostName,
    required this.hostAvatar,
    this.isGuestFavorite = false,
    bool isStarHost = false,
    bool? isSuperhost,
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
    this.status = 'ACTIVE',
    this.city = 'City',
    this.state = 'State',
    this.propertyType = 'STAY',
    this.isStayingWithHost = false,
    this.hostPresenceType,
    this.maxSpots = 10,
    this.availableSpots = 10,
  }) : isStarHost = isStarHost || (isSuperhost ?? false);

  factory StayModel.fromFirestore(Map<String, dynamic> data, String documentId) {
    return StayModel(
      id: documentId,
      title: data['title'] ?? '',
      location: data['address'] ?? '',
      pricePerNight: (data['pricePerNight'] ?? 0).toDouble(),
      rating: (data['rating'] ?? 0).toDouble(),
      reviewCount: data['reviewCount'] ?? 0,
      imageUrls: List<String>.from(data['images'] ?? []),
      videoUrls: List<String>.from(data['videoUrls'] ?? []),
      category: data['category'] ?? 'All Stays',
      hostName: data['hostName'] ?? '',
      hostAvatar: data['hostAvatarUrl'] ?? '',
      isGuestFavorite: data['badges']?['isGuestFavorite'] ?? false,
      isStarHost: data['badges']?['isStarHost'] ?? data['badges']?['isSuperhost'] ?? false,
      isNew: data['badges']?['isNew'] ?? false,
      isFeatured: data['badges']?['isFeatured'] ?? false,
      amenities: List<String>.from(data['amenities'] ?? []),
      description: data['description'] ?? '',
      lat: data['geopoint']?.latitude ?? 0.0,
      lng: data['geopoint']?.longitude ?? 0.0,
      isWishlisted: false, // Computed locally based on user wishlist subcollection
      isExperience: data['isExperience'] ?? false,
      duration: data['duration'],
      status: data['status'] ?? 'ACTIVE',
      city: data['city'] ?? 'City',
      state: data['state'] ?? 'State',
      propertyType: data['propertyType'] ?? _derivePropertyType(data['category'] ?? ''),
    );
  }

  static String _derivePropertyType(String category) {
    final cat = category.toUpperCase();
    if (cat.contains('RV') || cat.contains('CAMPERVAN') || cat.contains('MOTORHOME')) return 'RV';
    if (cat.contains('CAMPING') || cat.contains('TENT') || cat.contains('GLAMPING')) return 'CAMPING_SITE';
    return 'STAY';
  }

  factory StayModel.fromJson(Map<String, dynamic> json) {
    // Helper to parse pricePerNight which might be string or number from Prisma Decimal
    double price = 0;
    if (json['pricePerNight'] != null) {
      if (json['pricePerNight'] is String) {
        price = double.tryParse(json['pricePerNight']) ?? 0;
      } else if (json['pricePerNight'] is num) {
        price = (json['pricePerNight'] as num).toDouble();
      }
    }

    // Parse images array
    List<String> parsedImages = [];
    if (json['images'] != null && json['images'] is List) {
      for (var img in json['images']) {
        if (img['url'] != null) {
          parsedImages.add(img['url'].toString());
        }
      }
    }
    // Fallback if no images
    if (parsedImages.isEmpty) {
      parsedImages = ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800'];
    }

    // Parse videoUrls array
    List<String> parsedVideos = [];
    if (json['videoUrls'] != null && json['videoUrls'] is List) {
      for (var vid in json['videoUrls']) {
        if (vid != null) {
          parsedVideos.add(vid.toString());
        }
      }
    }

    // Parse host
    String parsedHostName = 'Stay Q Host';
    String parsedHostAvatar = '';
    bool parsedIsStarHost = false;
    if (json['host'] != null) {
      parsedHostName = json['host']['displayName'] ?? parsedHostName;
      parsedHostAvatar = json['host']['photoUrl'] ?? parsedHostAvatar;
      parsedIsStarHost = json['host']['isStarHost'] ?? json['host']['isSuperhost'] ?? false;
    }

    // Parse tags/badges
    bool parsedIsGuestFavorite = false;
    bool parsedIsNew = false;
    bool parsedIsFeatured = false;
    List<String> parsedTags = [];
    if (json['tags'] != null && json['tags'] is List) {
      for (var t in json['tags']) {
        String tag = t['tag'] ?? '';
        if (tag.isNotEmpty) {
          parsedTags.add(tag);
        }
        if (tag == 'GUEST_FAVOURITE') parsedIsGuestFavorite = true;
        if (tag == 'NEW_LISTING') parsedIsNew = true;
        if (tag == 'PREMIUM' || tag == 'POPULAR_IN_AREA') parsedIsFeatured = true;
        if (tag == 'STARHOST' || tag == 'SUPERHOST') parsedIsStarHost = true;
      }
    }

    return StayModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      location: '${json['city'] ?? ''}, ${json['country'] ?? ''}'.trim().replaceAll(RegExp(r'^,\s*'), ''),
      pricePerNight: price,
      rating: 4.8, // Fallback since reviews aren't included yet
      reviewCount: 15,
      imageUrls: parsedImages,
      videoUrls: parsedVideos,
      category: json['category'] ?? 'All Stays',
      hostName: parsedHostName,
      hostAvatar: parsedHostAvatar,
      isGuestFavorite: parsedIsGuestFavorite,
      isStarHost: parsedIsStarHost,
      isNew: parsedIsNew,
      isFeatured: parsedIsFeatured,
      amenities: json['amenities'] != null ? List<String>.from(json['amenities']) : ['Wifi', 'Kitchen', 'AC'],
      tags: parsedTags,
      description: json['description'] ?? '',
      lat: json['lat'] != null ? double.parse(json['lat'].toString()) : 0.0,
      lng: json['lng'] != null ? double.parse(json['lng'].toString()) : 0.0,
      isWishlisted: false,
      isExperience: false,
      status: json['status'] ?? 'ACTIVE',
      city: json['city'] ?? 'City',
      state: json['state'] ?? 'State',
      propertyType: json['propertyType'] ?? _derivePropertyType(json['category'] ?? ''),
      isStayingWithHost: json['isStayingWithHost'] ?? (json['roomType'] == 'PRIVATE_ROOM' || json['roomType'] == 'SHARED_ROOM'),
      hostPresenceType: json['hostPresenceType'] ?? (json['isStayingWithHost'] == true ? 'Host on premises' : null),
      maxSpots: json['maxSpots'] != null ? int.tryParse(json['maxSpots'].toString()) ?? 10 : 10,
      availableSpots: json['availableSpots'] != null ? int.tryParse(json['availableSpots'].toString()) ?? 10 : 10,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'address': location,
      'pricePerNight': pricePerNight,
      'rating': rating,
      'reviewCount': reviewCount,
      'images': imageUrls,
      'category': category,
      'hostName': hostName,
      'hostAvatarUrl': hostAvatar,
      'badges': {
        'isGuestFavorite': isGuestFavorite,
        'isStarHost': isStarHost,
        'isSuperhost': isStarHost,
        'isNew': isNew,
        'isFeatured': isFeatured,
      },
      'amenities': amenities,
      'description': description,
      'isExperience': isExperience,
      'duration': duration,
    };
  }
}

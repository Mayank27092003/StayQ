import 'stay_model.dart';

enum BookingStatus { pending, confirmed, upcoming, completed, cancelled }

class BookingModel {
  final String id;
  final StayModel stay;
  final DateTime checkIn;
  final DateTime checkOut;
  final int adults;
  final int children;
  final double totalAmount;
  final String confirmationCode;
  BookingStatus status;
  final String guestName;
  final String guestAvatar;

  BookingModel({
    required this.id,
    required this.stay,
    required this.checkIn,
    required this.checkOut,
    required this.adults,
    this.children = 0,
    required this.totalAmount,
    required this.confirmationCode,
    required this.status,
    required this.guestName,
    required this.guestAvatar,
  });

  int get totalNights => checkOut.difference(checkIn).inDays;

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    // Determine status based on dates if it's confirmed
    String rawStatus = json['status'] ?? 'pending_payment';
    BookingStatus calculatedStatus = BookingStatus.confirmed;
    
    if (rawStatus == 'cancelled') {
      calculatedStatus = BookingStatus.cancelled;
    } else if (rawStatus == 'confirmed') {
      final checkOutDate = json['checkOut'] != null ? DateTime.parse(json['checkOut'].toString()) : DateTime.now();
      final checkInDate = json['checkIn'] != null ? DateTime.parse(json['checkIn'].toString()) : DateTime.now();
      final now = DateTime.now();
      
      if (now.isAfter(checkOutDate)) {
        calculatedStatus = BookingStatus.completed;
      } else if (now.isBefore(checkInDate)) {
        calculatedStatus = BookingStatus.upcoming;
      } else {
        calculatedStatus = BookingStatus.confirmed; // ongoing
      }
    }

    final propMap = json['property'] is Map<String, dynamic> ? json['property'] as Map<String, dynamic> : null;
    final propImages = propMap != null && propMap['images'] is List
        ? (propMap['images'] as List).map((i) => i is Map ? (i['url'] ?? '').toString() : i.toString()).where((s) => s.isNotEmpty).toList()
        : <String>[];
    if (propImages.isEmpty && json['propertyImage'] != null && json['propertyImage'].toString().isNotEmpty) {
      propImages.add(json['propertyImage'].toString());
    }

    return BookingModel(
      id: json['id'] ?? '',
      stay: StayModel(
        id: propMap?['id'] ?? json['propertyId'] ?? '',
        title: propMap?['title'] ?? json['propertyTitle'] ?? '',
        location: propMap?['city'] ?? json['propertyCity'] ?? '',
        pricePerNight: ((propMap?['basePrice'] ?? json['nightlyRate'] ?? 0) as num).toDouble(),
        rating: ((propMap?['rating'] ?? 0) as num).toDouble(),
        reviewCount: propMap?['reviewCount'] ?? 0,
        imageUrls: propImages,
        category: propMap?['category'] ?? '',
        hostName: propMap?['host']?['displayName'] ?? '',
        hostAvatar: propMap?['host']?['photoUrl'] ?? '',
        amenities: propMap?['amenities'] != null ? List<String>.from(propMap!['amenities']) : [],
        description: propMap?['description'] ?? '',
        lat: ((propMap?['lat'] ?? 0) as num).toDouble(),
        lng: ((propMap?['lng'] ?? 0) as num).toDouble(),
      ),
      checkIn: json['checkIn'] != null ? DateTime.parse(json['checkIn'].toString()) : DateTime.now(),
      checkOut: json['checkOut'] != null ? DateTime.parse(json['checkOut'].toString()) : DateTime.now(),
      adults: json['adults'] ?? 1,
      children: json['children'] ?? 0,
      totalAmount: ((json['totalAmount'] ?? 0) as num).toDouble(),
      confirmationCode: json['confirmationCode'] ?? '',
      status: calculatedStatus,
      guestName: json['guest']?['displayName'] ?? json['guestName'] ?? '',
      guestAvatar: json['guest']?['photoUrl'] ?? json['guestAvatarUrl'] ?? '',
    );
  }
}

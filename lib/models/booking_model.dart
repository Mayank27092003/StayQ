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

    return BookingModel(
      id: json['id'] ?? '',
      // Note: NestJS returns relation property as an object or just its ID.
      // We assume it's flat here like fromFirestore was, but this may need adjusting based on NestJS payload.
      stay: StayModel(
        id: json['propertyId'] ?? '',
        title: json['propertyTitle'] ?? '',
        location: json['propertyCity'] ?? '',
        pricePerNight: (json['nightlyRate'] ?? 0).toDouble(),
        rating: 0,
        reviewCount: 0,
        imageUrls: [json['propertyImage'] ?? ''],
        category: '',
        hostName: '',
        hostAvatar: '',
        amenities: [],
        description: '',
        lat: 0,
        lng: 0,
      ),
      checkIn: json['checkIn'] != null ? DateTime.parse(json['checkIn'].toString()) : DateTime.now(),
      checkOut: json['checkOut'] != null ? DateTime.parse(json['checkOut'].toString()) : DateTime.now(),
      adults: json['adults'] ?? 1,
      children: json['children'] ?? 0,
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      confirmationCode: json['confirmationCode'] ?? '',
      status: calculatedStatus,
      guestName: json['guestName'] ?? '',
      guestAvatar: json['guestAvatarUrl'] ?? '',
    );
  }
}

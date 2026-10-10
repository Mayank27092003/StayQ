import 'json_values.dart';
import 'stay_model.dart';

enum BookingStatus { pending, confirmed, upcoming, completed, cancelled }

class BookingModel {
  final String id;
  final StayModel stay;
  final DateTime checkIn;
  final DateTime checkOut;
  final int adults;
  final int children;
  final int infants;
  final int pets;
  final Map<String, dynamic> options;
  final double totalAmount;
  final String confirmationCode;
  BookingStatus status;
  final String guestName;
  final String guestAvatar;
  final String? accessPin;
  final bool isPaid;
  final String rawStatus;

  BookingModel({
    required this.id,
    required this.stay,
    required this.checkIn,
    required this.checkOut,
    required this.adults,
    this.children = 0,
    this.infants = 0,
    this.pets = 0,
    this.options = const {},
    required this.totalAmount,
    required this.confirmationCode,
    required this.status,
    required this.guestName,
    required this.guestAvatar,
    this.accessPin,
    this.isPaid = false,
    this.rawStatus = 'pending',
  });

  int get totalNights => checkOut.difference(checkIn).inDays;

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    final raw = (json['status']?.toString() ?? 'pending_payment').toLowerCase();
    final start = DateTime.tryParse(json['checkIn']?.toString() ?? '');
    final end = DateTime.tryParse(json['checkOut']?.toString() ?? '');
    if (start == null || end == null || !end.isAfter(start)) {
      throw const FormatException('Booking has invalid check-in/check-out dates.');
    }
    var status = BookingStatus.pending;
    switch (raw) {
      case 'cancelled': case 'canceled': case 'rejected':
        status = BookingStatus.cancelled; break;
      case 'completed': status = BookingStatus.completed; break;
      case 'upcoming': status = BookingStatus.upcoming; break;
      case 'confirmed':
        status = DateTime.now().isAfter(end) ? BookingStatus.completed :
            DateTime.now().isBefore(start) ? BookingStatus.upcoming : BookingStatus.confirmed;
        break;
      default: status = BookingStatus.pending;
    }
    final prop = jsonMap(json['property']);
    final guest = jsonMap(json['guest']);
    final stay = StayModel.fromJson({
      'id': json['propertyId'], 'title': json['propertyTitle'],
      'city': json['propertyCity'], 'pricePerNight': json['nightlyRate'],
      if (json['propertyImage'] != null) 'images': [json['propertyImage']],
      ...prop,
    });
    return BookingModel(
      id: (json['id'] ?? json['_id'])?.toString() ?? '', stay: stay, checkIn: start, checkOut: end,
      adults: json['adults'] == null ? jsonInt(json['guests'], 1) - jsonInt(json['children']) : jsonInt(json['adults'], 1),
      children: jsonInt(json['children']), infants: jsonInt(json['infants']), pets: jsonInt(json['pets']),
      options: Map<String, dynamic>.unmodifiable(jsonMap(json['options'])),
      totalAmount: jsonDouble(json['totalAmount']),
      confirmationCode: json['confirmationCode']?.toString() ?? '', status: status,
      guestName: guest['displayName']?.toString() ?? json['guestName']?.toString() ?? '',
      guestAvatar: guest['photoUrl']?.toString() ?? json['guestAvatarUrl']?.toString() ?? '',
      accessPin: json['accessPin']?.toString(), rawStatus: raw,
      isPaid: json['isPaid'] == true || json['paymentStatus']?.toString().toUpperCase() == 'PAID',
    );
  }

  bool get isConfirmed => status == BookingStatus.confirmed ||
      status == BookingStatus.upcoming || status == BookingStatus.completed;

  BookingModel copyWith({
    String? id,
    StayModel? stay,
    DateTime? checkIn,
    DateTime? checkOut,
    int? adults,
    int? children,
    int? infants,
    int? pets,
    Map<String, dynamic>? options,
    double? totalAmount,
    String? confirmationCode,
    BookingStatus? status,
    String? guestName,
    String? guestAvatar,
    String? accessPin,
    bool? isPaid,
    String? rawStatus,
  }) {
    return BookingModel(
      id: id ?? this.id,
      stay: stay ?? this.stay,
      checkIn: checkIn ?? this.checkIn,
      checkOut: checkOut ?? this.checkOut,
      adults: adults ?? this.adults,
      children: children ?? this.children,
      infants: infants ?? this.infants, pets: pets ?? this.pets,
      options: options ?? this.options,
      totalAmount: totalAmount ?? this.totalAmount,
      confirmationCode: confirmationCode ?? this.confirmationCode,
      status: status ?? this.status,
      guestName: guestName ?? this.guestName,
      guestAvatar: guestAvatar ?? this.guestAvatar,
      accessPin: accessPin ?? this.accessPin,
      isPaid: isPaid ?? this.isPaid,
      rawStatus: rawStatus ?? this.rawStatus,
    );
  }
}

import 'package:flutter_test/flutter_test.dart';
import 'package:stay_q/models/booking_model.dart';
import 'package:stay_q/models/booking_party.dart';
import 'package:stay_q/models/json_values.dart';
import 'package:stay_q/models/stay_model.dart';

Map<String, dynamic> bookingFixture(String status) => {
  'id': 'booking-1', 'status': status, 'checkIn': '2035-05-10',
  'checkOut': '2035-05-12', 'adults': '2', 'children': '1',
  'totalAmount': '1234.50', 'confirmationCode': '',
  'options': {'tentType': 'Family', 'addOns': ['Breakfast']},
  'property': {'id': 'stay-1', 'hostId': 'host-1', 'title': 'A stay',
    'roomType': 'PRIVATE_ROOM', 'images': [{'url': 'https://example.invalid/cover.jpg'}]},
};

void main() {
  for (final status in ['pending_payment', 'failed', 'processing', 'unknown', '']) {
    test('$status remains unconfirmed and unpaid', () {
      final booking = BookingModel.fromJson(bookingFixture(status));
      expect(booking.status, BookingStatus.pending);
      expect(booking.isConfirmed, isFalse);
      expect(booking.isPaid, isFalse);
      expect(booking.confirmationCode, isEmpty);
      expect(booking.accessPin, isNull);
    });
  }
  test('booking parsing retains decimal amounts, host and fulfillment options', () {
    final booking = BookingModel.fromJson(bookingFixture('confirmed'));
    expect(booking.totalAmount, 1234.50);
    expect(booking.adults, 2);
    expect(booking.children, 1);
    expect(booking.stay.hostId, 'host-1');
    expect(booking.stay.isStayingWithHost, isTrue);
    expect(booking.copyWith(status: BookingStatus.cancelled).options['tentType'], 'Family');
  });
  test('bad dates are rejected instead of silently using the current date', () {
    expect(() => BookingModel.fromJson({...bookingFixture('confirmed'), 'checkIn': 'bad'}),
      throwsFormatException);
    expect(() => BookingModel.fromJson({...bookingFixture('confirmed'), 'checkOut': '2035-05-09'}),
      throwsFormatException);
  });
  test('only explicit paid evidence changes the paid flag', () {
    expect(BookingModel.fromJson({...bookingFixture('confirmed'), 'paymentStatus': 'PAID'}).isPaid, isTrue);
    expect(BookingModel.fromJson(bookingFixture('confirmed')).isPaid, isFalse);
  });
  test('children are not counted again as adults in the booking party', () {
    expect(BookingParty.fromTotal(3, {'children': 1, 'infants': 1, 'pets': 2}).toJson(),
      {'guests': 3, 'adults': 2, 'children': 1, 'infants': 1, 'pets': 2});
    expect(() => BookingParty.fromTotal(1, {'children': 1}), throwsArgumentError);
    expect(() => BookingParty.fromTotal(2, {'children': -1}), throwsArgumentError);
  });
  test('empty/missing photos and ratings do not fabricate property data', () {
    final stay = StayModel.fromJson({'id': 'stay-1', 'title': 'A stay'});
    expect(stay.firstImage, isEmpty);
    expect(stay.rating, 0);
    expect(stay.reviewCount, 0);
    expect(stay.maxGuests, 0);
  });
  test('experience media, capacity and metadata survive a local round trip', () {
    final stay = StayModel.fromJson({
      'id': 'experience-1', 'hostId': 'host-1', 'category': 'Experiences',
      'isExperience': true, 'duration': '2 hours', 'timeSlot': '10:00-12:00',
      'maxSpots': '8', 'availableSpots': 5,
      'images': ['https://example.invalid/a.jpg', {'imageUrl': 'https://example.invalid/b.jpg'}],
      'tags': ['NEW_LISTING', {'tag': 'PREMIUM'}],
    });
    final restored = StayModel.fromJson({'id': stay.id, ...stay.toMap()});
    expect(restored.isExperience, isTrue);
    expect(restored.maxSpots, 8);
    expect(restored.availableSpots, 5);
    expect(restored.hostId, 'host-1');
    expect(restored.timeSlot, '10:00-12:00');
    expect(restored.imageUrls.length, 2);
    expect(restored.tags, ['NEW_LISTING', 'PREMIUM']);
  });
  test('category display aliases match API categories', () {
    expect(canonicalCategory('All Stays'), 'ALL');
    expect(canonicalCategory('Villas'), 'VILLA');
    expect(canonicalCategory('RVs'), 'RV');
    expect(canonicalCategory('Glamping'), 'CAMPING');
    expect(canonicalCategory('Hostels'), 'HOSTEL');
  });
  test('non-finite amounts cannot enter pricing models', () {
    expect(jsonDouble('NaN'), 0);
    expect(jsonDouble(double.infinity), 0);
  });
}

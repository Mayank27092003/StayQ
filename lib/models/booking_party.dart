import 'json_values.dart';

/// Adults and children occupy a guest place. Infants and pets remain separate.
class BookingParty {
  final int adults, children, infants, pets;
  const BookingParty._(this.adults, this.children, this.infants, this.pets);
  factory BookingParty.fromTotal(int totalGuests, Map<String, dynamic> options) {
    final children = jsonInt(options['children']);
    final infants = jsonInt(options['infants']);
    final pets = jsonInt(options['pets']);
    final adults = totalGuests - children;
    if (adults < 1 || children < 0 || infants < 0 || pets < 0) {
      throw ArgumentError('Choose at least one adult and valid party counts.');
    }
    return BookingParty._(adults, children, infants, pets);
  }
  Map<String, dynamic> toJson() => {
    'guests': adults + children, 'adults': adults, 'children': children,
    'infants': infants, 'pets': pets,
  };
}

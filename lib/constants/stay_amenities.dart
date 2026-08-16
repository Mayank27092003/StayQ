import 'package:flutter/material.dart';

class StayAmenityItem {
  final String title;
  final String value;
  final String emoji;
  final IconData icon;
  final String category; // 'Essentials', 'Comfort', 'Facilities', 'Safety & Power'

  const StayAmenityItem({
    required this.title,
    required this.value,
    required this.emoji,
    required this.icon,
    required this.category,
  });
}

class StayAmenities {
  /// The 25 Official Standard Stay Q Amenities
  static const List<StayAmenityItem> all = [
    // 1. Essentials
    StayAmenityItem(
      title: 'Wi-Fi',
      value: 'Wi-Fi',
      emoji: '📶',
      icon: Icons.wifi_rounded,
      category: 'Essentials',
    ),
    StayAmenityItem(
      title: 'Air conditioning',
      value: 'Air conditioning',
      emoji: '❄️',
      icon: Icons.ac_unit_rounded,
      category: 'Essentials',
    ),
    StayAmenityItem(
      title: 'Heating',
      value: 'Heating',
      emoji: '🔥',
      icon: Icons.whatshot_rounded,
      category: 'Essentials',
    ),
    StayAmenityItem(
      title: 'TV',
      value: 'TV',
      emoji: '📺',
      icon: Icons.tv_rounded,
      category: 'Essentials',
    ),
    StayAmenityItem(
      title: 'Kitchen',
      value: 'Kitchen',
      emoji: '🍳',
      icon: Icons.restaurant_rounded,
      category: 'Essentials',
    ),
    StayAmenityItem(
      title: 'Refrigerator',
      value: 'Refrigerator',
      emoji: '🧊',
      icon: Icons.kitchen_rounded,
      category: 'Essentials',
    ),
    StayAmenityItem(
      title: 'Washing machine',
      value: 'Washing machine',
      emoji: '🧺',
      icon: Icons.local_laundry_service_rounded,
      category: 'Essentials',
    ),
    StayAmenityItem(
      title: 'Microwave',
      value: 'Microwave',
      emoji: '🍲',
      icon: Icons.microwave_rounded,
      category: 'Essentials',
    ),

    // 2. Facilities & Features
    StayAmenityItem(
      title: 'Parking',
      value: 'Parking',
      emoji: '🚗',
      icon: Icons.local_parking_rounded,
      category: 'Facilities',
    ),
    StayAmenityItem(
      title: 'Swimming pool',
      value: 'Swimming pool',
      emoji: '🏊',
      icon: Icons.pool_rounded,
      category: 'Facilities',
    ),
    StayAmenityItem(
      title: 'Gym',
      value: 'Gym',
      emoji: '🏋️',
      icon: Icons.fitness_center_rounded,
      category: 'Facilities',
    ),
    StayAmenityItem(
      title: 'Balcony',
      value: 'Balcony',
      emoji: '🌅',
      icon: Icons.balcony_rounded,
      category: 'Facilities',
    ),
    StayAmenityItem(
      title: 'Garden',
      value: 'Garden',
      emoji: '🌿',
      icon: Icons.park_rounded,
      category: 'Facilities',
    ),
    StayAmenityItem(
      title: 'Workspace',
      value: 'Workspace',
      emoji: '💻',
      icon: Icons.laptop_mac_rounded,
      category: 'Facilities',
    ),
    StayAmenityItem(
      title: 'Elevator',
      value: 'Elevator',
      emoji: '🛗',
      icon: Icons.elevator_rounded,
      category: 'Facilities',
    ),

    // 3. Comfort & Personal Care
    StayAmenityItem(
      title: 'Hot water',
      value: 'Hot water',
      emoji: '🚿',
      icon: Icons.shower_rounded,
      category: 'Comfort',
    ),
    StayAmenityItem(
      title: 'Washing facilities',
      value: 'Washing facilities',
      emoji: '🧴',
      icon: Icons.wash_rounded,
      category: 'Comfort',
    ),
    StayAmenityItem(
      title: 'Hair dryer',
      value: 'Hair dryer',
      emoji: '💨',
      icon: Icons.air_rounded,
      category: 'Comfort',
    ),
    StayAmenityItem(
      title: 'Iron',
      value: 'Iron',
      emoji: '👔',
      icon: Icons.iron_rounded,
      category: 'Comfort',
    ),
    StayAmenityItem(
      title: 'Towels',
      value: 'Towels',
      emoji: '🧖',
      icon: Icons.dry_rounded,
      category: 'Comfort',
    ),
    StayAmenityItem(
      title: 'Bed linen',
      value: 'Bed linen',
      emoji: '🛏️',
      icon: Icons.bed_rounded,
      category: 'Comfort',
    ),

    // 4. Safety & Power
    StayAmenityItem(
      title: 'Security',
      value: 'Security',
      emoji: '🛡️',
      icon: Icons.shield_rounded,
      category: 'Safety & Power',
    ),
    StayAmenityItem(
      title: 'CCTV in common areas',
      value: 'CCTV in common areas',
      emoji: '📹',
      icon: Icons.videocam_rounded,
      category: 'Safety & Power',
    ),
    StayAmenityItem(
      title: 'Power backup',
      value: 'Power backup',
      emoji: '🔋',
      icon: Icons.battery_charging_full_rounded,
      category: 'Safety & Power',
    ),
    StayAmenityItem(
      title: 'Generator',
      value: 'Generator',
      emoji: '⚡',
      icon: Icons.electric_bolt_rounded,
      category: 'Safety & Power',
    ),
  ];

  static final Map<String, StayAmenityItem> _lookup = {
    for (var item in all) item.value.toLowerCase(): item,
    for (var item in all) item.title.toLowerCase(): item,
    // Synonyms / Aliases
    'wifi': all[0],
    'high-speed wi-fi': all[0],
    'ac': all[1],
    'air conditioning': all[1],
    'pool': all[9],
    'private pool': all[9],
    'washer': all[6],
    'dedicated workspace': all[13],
  };

  static IconData getIcon(String amenity) {
    final clean = amenity.trim().toLowerCase();
    return _lookup[clean]?.icon ?? Icons.check_circle_outline_rounded;
  }

  static String getEmoji(String amenity) {
    final clean = amenity.trim().toLowerCase();
    return _lookup[clean]?.emoji ?? '✨';
  }

  static String getCanonicalTitle(String amenity) {
    final clean = amenity.trim().toLowerCase();
    return _lookup[clean]?.title ?? amenity;
  }
}

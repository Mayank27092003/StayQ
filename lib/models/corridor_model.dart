import 'corridor_region.dart';

class CorridorModel {
  final String id;
  final String slug;
  final CorridorRegion region;
  final String name;
  final int sortOrder;
  final int durationMinDays;
  final int durationMaxDays;
  final double distanceKm;
  final List<String> stops;
  final String theme;
  final String description;
  final String? sourceName;
  final String? sourceUrl;
  final List<String> permits;
  final String? advisoryNotes;
  final String? badge;
  final List<String> highlights;
  final String? imageKey;

  const CorridorModel({
    required this.id,
    required this.slug,
    required this.region,
    required this.name,
    required this.sortOrder,
    required this.durationMinDays,
    required this.durationMaxDays,
    required this.distanceKm,
    required this.stops,
    required this.theme,
    required this.description,
    this.sourceName,
    this.sourceUrl,
    this.permits = const [],
    this.advisoryNotes,
    this.badge,
    this.highlights = const [],
    this.imageKey,
  });

  /// Authoritative single source of truth for route pathway
  String get route => stops.join(' → ');

  /// Formatted duration string for UI
  String get durationFormatted => '$durationMinDays–$durationMaxDays days';

  /// Formatted distance string for UI
  String get distanceFormatted => '${distanceKm.round()} km';

  factory CorridorModel.fromJson(Map<String, dynamic> json) {
    final region = CorridorRegion.fromApi(json['region'] as String?);
    if (region == null) {
      throw FormatException('Invalid or unrecognized CorridorRegion: ${json['region']}');
    }

    return CorridorModel(
      id: json['id'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      region: region,
      name: json['name'] as String? ?? '',
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      durationMinDays: (json['durationMinDays'] as num?)?.toInt() ?? 1,
      durationMaxDays: (json['durationMaxDays'] as num?)?.toInt() ?? 1,
      distanceKm: (json['distanceKm'] as num?)?.toDouble() ?? 0.0,
      stops: (json['stops'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? const [],
      theme: json['theme'] as String? ?? '',
      description: json['description'] as String? ?? '',
      sourceName: json['sourceName'] as String?,
      sourceUrl: json['sourceUrl'] as String?,
      permits: (json['permits'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? const [],
      advisoryNotes: json['advisoryNotes'] as String?,
      badge: json['badge'] as String?,
      highlights: (json['highlights'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? const [],
      imageKey: json['imageKey'] as String?,
    );
  }
}

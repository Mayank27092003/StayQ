import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/corridor_model.dart';
import '../models/corridor_region.dart';
import '../data/curated_corridors_dataset.dart';

class CorridorsRepository {
  static const String _baseUrl = 'https://stayq-api-608570851336.asia-south1.run.app/api/v1/corridors';

  /// Fetches corridors from backend with type-safe JSON mapping and offline fallback
  Future<List<CorridorModel>> getCorridors({CorridorRegion? region}) async {
    try {
      final uri = region != null
          ? Uri.parse('$_baseUrl?region=${region.apiKey}')
          : Uri.parse(_baseUrl);

      final response = await http.get(uri).timeout(const Duration(seconds: 4));
      if (response.statusCode == 200) {
        final dynamic decoded = json.decode(response.body);
        if (decoded is List && decoded.isNotEmpty) {
          final List<CorridorModel> validItems = [];
          for (final item in decoded) {
            if (item is Map<String, dynamic>) {
              try {
                validItems.add(CorridorModel.fromJson(item));
              } catch (parseError) {
                debugPrint('[CorridorsRepository] Skipped invalid item: $parseError');
              }
            }
          }
          if (validItems.isNotEmpty) {
            return validItems;
          }
        }
      }
    } catch (e) {
      debugPrint('[CorridorsRepository] Network error, fallback to curated dataset: $e');
    }

    // High fidelity canonical fallback
    if (region != null) {
      return curatedCampervanCorridors.where((c) => c.region == region).toList();
    }
    return curatedCampervanCorridors;
  }
}

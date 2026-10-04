import '../models/corridor_model.dart';
import '../models/corridor_region.dart';
import 'corridors_repository.dart';

class CorridorsApiService {
  static final CorridorsRepository _repo = CorridorsRepository();

  /// Fetches corridors with automatic fallback to curated dataset
  static Future<List<CorridorModel>> getCorridors({CorridorRegion? region}) {
    return _repo.getCorridors(region: region);
  }
}

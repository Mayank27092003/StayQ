enum CorridorRegion {
  northIndia,
  southIndia,
  gujaratRajasthan,
  northEast;

  static CorridorRegion? fromApi(String? value) {
    switch (value?.trim().toUpperCase()) {
      case 'NORTH_INDIA':
        return CorridorRegion.northIndia;
      case 'SOUTH_INDIA':
        return CorridorRegion.southIndia;
      case 'GUJARAT_RAJASTHAN':
        return CorridorRegion.gujaratRajasthan;
      case 'NORTH_EAST':
        return CorridorRegion.northEast;
      default:
        return null;
    }
  }

  String get apiKey {
    switch (this) {
      case CorridorRegion.northIndia:
        return 'NORTH_INDIA';
      case CorridorRegion.southIndia:
        return 'SOUTH_INDIA';
      case CorridorRegion.gujaratRajasthan:
        return 'GUJARAT_RAJASTHAN';
      case CorridorRegion.northEast:
        return 'NORTH_EAST';
    }
  }
}

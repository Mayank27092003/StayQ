double jsonDouble(dynamic value, [double fallback = 0]) {
  final result = value is num ? value.toDouble() : double.tryParse(value?.toString() ?? '');
  return result != null && result.isFinite ? result : fallback;
}
int jsonInt(dynamic value, [int fallback = 0]) =>
    value is num ? (value.isFinite ? value.toInt() : fallback) : int.tryParse(value?.toString() ?? '') ?? fallback;
Map<String, dynamic> jsonMap(dynamic value) =>
    value is Map ? Map<String, dynamic>.from(value) : <String, dynamic>{};
List<String> jsonStrings(dynamic value, {String? field}) {
  if (value is! List) return <String>[];
  return value.map((item) {
    if (item is Map) {
      if (field != null) return item[field] ?? item[field == 'url' ? 'imageUrl' : (field == 'tag' ? 'name' : 'name')];
      return item['tag'] ?? item['name'] ?? item['url'] ?? item['imageUrl'];
    }
    return item;
  })
      .where((item) => item is String && item.trim().isNotEmpty)
      .map((item) => (item as String).trim()).toList();
}
String canonicalCategory(String value) {
  final normalized = value.trim().toUpperCase().replaceAll(RegExp(r'[\s-]+'), '_');
  const aliases = {
    'ALL_STAYS': 'ALL', 'ALL': 'ALL', 'RVS': 'RV', 'CAMPERVAN': 'RV',
    'CABINS': 'CABIN', 'VILLAS': 'VILLA', 'APARTMENTS': 'APARTMENT',
    'CAMPING_SITE': 'CAMPING', 'CAMPSITES': 'CAMPING', 'HOTELS': 'HOTEL',
    'RESORTS': 'RESORT', 'TREEHOUSES': 'TREEHOUSE', 'HOMESTAYS': 'HOMESTAY',
    'HOSTELS': 'HOSTEL', 'DORMS': 'DORM', 'EXPERIENCE': 'EXPERIENCES',
    'LONG_TERM_HOME': 'COUNTRYSIDE', 'ZERO_BROKERAGE': 'COUNTRYSIDE',
    'ZERO_BROKER': 'COUNTRYSIDE', 'LONG_TERM_HOMES': 'COUNTRYSIDE', 'GLAMPING': 'CAMPING',
  };
  return aliases[normalized] ?? normalized;
}

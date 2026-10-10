import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/app_provider.dart';
import '../../../services/api/api_client.dart';
import '../../../services/api/pricing_api.dart';
import '../../../models/json_values.dart';
import 'host_pro_paywall_sheet.dart';

class NeighborhoodPriceRadarWidget extends StatefulWidget {
  final String city;
  final String? locality;
  final String propertyType;
  final int bedrooms;
  final double currentPrice;
  final List<String> amenities;
  final ValueChanged<double>? onApplyRecommendedPrice;
  const NeighborhoodPriceRadarWidget({super.key, required this.city, this.locality,
    this.propertyType = 'VILLA', this.bedrooms = 2, required this.currentPrice,
    this.amenities = const [], this.onApplyRecommendedPrice});
  @override
  State<NeighborhoodPriceRadarWidget> createState() => _NeighborhoodPriceRadarWidgetState();
}
class _NeighborhoodPriceRadarWidgetState extends State<NeighborhoodPriceRadarWidget> {
  Map<String, dynamic>? _data;
  String? _error;
  bool _loading = false;
  bool? _lastEntitlement;
  int _request = 0;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final pro = context.watch<AppProvider>().isHostPro;
    if (pro != _lastEntitlement) {
      _lastEntitlement = pro;
      if (pro) _load(); else { _request++; _data = null; _loading = false; }
    }
  }
  @override
  void didUpdateWidget(covariant NeighborhoodPriceRadarWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_lastEntitlement == true && (oldWidget.city != widget.city || oldWidget.locality != widget.locality ||
      oldWidget.propertyType != widget.propertyType || oldWidget.bedrooms != widget.bedrooms ||
      oldWidget.currentPrice != widget.currentPrice || oldWidget.amenities.join('|') != widget.amenities.join('|'))) _load();
  }
  Future<void> _load() async {
    final request = ++_request;
    if (widget.city.trim().isEmpty) { setState(() { _data = null; _error = 'Enter your property city to request market data.'; }); return; }
    setState(() { _loading = true; _error = null; _data = null; });
    try {
      final data = await PricingApi(ApiClient.instance).getMarketIntelligence(city: widget.city, locality: widget.locality,
        propertyType: widget.propertyType, bedrooms: widget.bedrooms, currentPrice: widget.currentPrice, amenities: widget.amenities);
      if (!mounted || request != _request || !context.read<AppProvider>().isHostPro) return;
      if (data.isEmpty || data['available'] == false) throw StateError('Market data is unavailable for this location.');
      setState(() => _data = data);
    } catch (e) { if (mounted && request == _request) setState(() => _error = e.toString()); }
    finally { if (mounted && request == _request) setState(() => _loading = false); }
  }
  @override
  Widget build(BuildContext context) {
    final pro = context.watch<AppProvider>().isHostPro;
    final recommended = jsonDouble(_data?['recommendedPrice']);
    final average = jsonDouble(_data?['marketAverage'] ?? _data?['marketAvg']);
    final competitors = _data?['competitors'];
    return Card(child: Padding(padding: const EdgeInsets.all(20), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Neighborhood price radar', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
      const SizedBox(height: 12),
      if (!pro) ...[
        const Text('An active Host Pro subscription is required for market intelligence.'),
        TextButton(onPressed: () => HostProPaywallSheet.show(context), child: const Text('View Host Pro')),
      ] else if (_loading) const Center(child: CircularProgressIndicator())
      else if (_error != null) ...[Text(_error!), TextButton(onPressed: _load, child: const Text('Retry'))]
      else if (_data != null) ...[
        if (average > 0) Text('Reported market average: ₹${average.toStringAsFixed(0)}'),
        if (_data!['asOf'] != null) Text('Data as of ${_data!['asOf']}'),
        if (_data!['rationale'] != null || _data!['aiRationale'] != null) Text((_data!['rationale'] ?? _data!['aiRationale']).toString()),
        if (competitors is List) ...competitors.whereType<Map>().map((c) => ListTile(
          title: Text(c['title']?.toString() ?? 'Comparable property'), subtitle: Text(c['locality']?.toString() ?? ''),
          trailing: Text('₹${jsonDouble(c['price']).toStringAsFixed(0)}'))),
        if (recommended > 0 && widget.onApplyRecommendedPrice != null) TextButton(
          onPressed: () => widget.onApplyRecommendedPrice!(recommended), child: Text('Apply recommendation: ₹${recommended.toStringAsFixed(0)}')),
        const Text('Review the data before changing your rate. Occupancy and revenue are not guaranteed.'),
      ] else const Text('No market data is available.'),
    ])));
  }
}

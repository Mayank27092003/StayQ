import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../services/api/api_client.dart';
import '../../models/json_values.dart';
import '../../theme/app_colors.dart';

class HostAvailabilityScreen extends StatefulWidget {
  final String? propertyId;
  const HostAvailabilityScreen({super.key, this.propertyId});
  @override
  State<HostAvailabilityScreen> createState() => _HostAvailabilityScreenState();
}
class _HostAvailabilityScreenState extends State<HostAvailabilityScreen> {
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);
  final Set<DateTime> _blocked = {};
  List<Map<String, dynamic>> _properties = [];
  String? _propertyId;
  String _preset = 'ALL_DAYS';
  int _surcharge = 0;
  bool _loading = true;
  bool _saving = false;
  String? _error;
  int _request = 0;
  @override
  void initState() { super.initState(); _load(); }
  Future<void> _load() async {
    try {
      final uid = context.read<AppProvider>().userId;
      if (uid == null) throw StateError('Sign in to manage availability.');
      final response = await ApiClient.instance.get('/properties/host/${Uri.encodeComponent(uid)}');
      if (!mounted) return;
      final records = response is List ? response : jsonMap(response)['properties'];
      if (records is! List) throw const FormatException('Invalid host properties response.');
      _properties = records.map(jsonMap).where((p) => (p['id'] ?? p['_id']) != null).toList();
      final wanted = widget.propertyId;
      _propertyId = wanted != null && _properties.any((p) => (p['id'] ?? p['_id']).toString() == wanted)
        ? wanted : _properties.length == 1 ? (_properties.first['id'] ?? _properties.first['_id']).toString() : null;
      if (_propertyId != null) await _select(_propertyId!);
    } catch (e) { _error = e.toString(); }
    finally { if (mounted) setState(() => _loading = false); }
  }
  Future<void> _select(String id) async {
    final request = ++_request;
    setState(() { _propertyId = id; _loading = true; _error = null; });
    try {
      final response = jsonMap(await ApiClient.instance.get('/properties/${Uri.encodeComponent(id)}'));
      if (!mounted || request != _request) return;
      final data = response['property'] is Map ? jsonMap(response['property']) : response;
      _blocked.clear();
      final blocked = data['blockedDates'] ?? jsonMap(data['availability'])['blockedDates'];
      if (blocked is! List) throw const FormatException('The saved blocked dates were not supplied.');
      for (final raw in blocked) {
        final date = DateTime.tryParse(raw.toString());
        if (date == null) throw const FormatException('Invalid blocked date returned.');
        _blocked.add(DateUtils.dateOnly(date));
      }
      _preset = data['availabilityScheduleType']?.toString() ?? 'ALL_DAYS';
      _surcharge = jsonInt(data['weekendSurchargePercent']).clamp(0, 100).toInt();
    } catch (e) { if (mounted && request == _request) _error = e.toString(); }
    finally { if (mounted && request == _request) setState(() => _loading = false); }
  }
  void _setPreset(String value) {
    setState(() {
      _preset = value;
      if (value == 'CUSTOM_SPLIT') return;
      _blocked.clear();
      if (value == 'WEEKENDS_ONLY') {
        final today = DateUtils.dateOnly(DateTime.now());
        for (var i = 0; i < 365; i++) {
          final day = today.add(Duration(days: i));
          if (day.weekday != DateTime.friday && day.weekday != DateTime.saturday && day.weekday != DateTime.sunday) _blocked.add(day);
        }
      }
    });
  }
  Future<void> _save() async {
    if (_saving || _propertyId == null || _error != null || _loading) return;
    setState(() => _saving = true);
    try {
      await context.read<AppProvider>().updateHostAvailability(_blocked.toList(), propertyId: _propertyId!,
        weekendSurcharge: _surcharge, scheduleType: _preset);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Availability saved.')));
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()))); }
    finally { if (mounted) setState(() => _saving = false); }
  }
  @override
  Widget build(BuildContext context) {
    final days = DateUtils.getDaysInMonth(_month.year, _month.month);
    final offset = (_month.weekday + 6) % 7;
    return Scaffold(appBar: AppBar(title: const Text('Property availability')),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        DropdownButtonFormField<String>(key: ValueKey(_propertyId), initialValue: _propertyId,
          decoration: const InputDecoration(labelText: 'Select your property'),
          items: _properties.map((p) => DropdownMenuItem(value: (p['id'] ?? p['_id']).toString(),
            child: Text(p['title']?.toString() ?? 'Property'))).toList(),
          onChanged: _saving ? null : (value) { if (value != null) _select(value); }),
        if (_loading) const Padding(padding: EdgeInsets.all(20), child: Center(child: CircularProgressIndicator())),
        if (_error != null) Padding(padding: const EdgeInsets.symmetric(vertical: 16), child: Text(_error!, style: const TextStyle(color: Colors.red))),
        if (_propertyId == null && !_loading) const Padding(padding: EdgeInsets.symmetric(vertical: 20), child: Text('Choose a property to load its saved calendar.')),
        if (_propertyId != null && !_loading && _error == null) ...[
          const SizedBox(height: 20),
          DropdownButtonFormField<String>(initialValue: ['ALL_DAYS', 'WEEKENDS_ONLY', 'CUSTOM_SPLIT'].contains(_preset) ? _preset : 'CUSTOM_SPLIT',
            decoration: const InputDecoration(labelText: 'Schedule'), items: const [
              DropdownMenuItem(value: 'ALL_DAYS', child: Text('All days')),
              DropdownMenuItem(value: 'WEEKENDS_ONLY', child: Text('Weekends only')),
              DropdownMenuItem(value: 'CUSTOM_SPLIT', child: Text('Custom blocked dates')),
            ], onChanged: _saving ? null : (v) { if (v != null) _setPreset(v); }),
          const SizedBox(height: 16),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            IconButton(onPressed: () => setState(() => _month = DateTime(_month.year, _month.month - 1)), icon: const Icon(Icons.chevron_left)),
            Text(DateFormat('MMMM yyyy').format(_month), style: const TextStyle(fontWeight: FontWeight.bold)),
            IconButton(onPressed: () => setState(() => _month = DateTime(_month.year, _month.month + 1)), icon: const Icon(Icons.chevron_right)),
          ]),
          GridView.builder(shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), itemCount: days + offset,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7, mainAxisSpacing: 5, crossAxisSpacing: 5),
            itemBuilder: (_, index) {
              if (index < offset) return const SizedBox.shrink();
              final date = DateTime(_month.year, _month.month, index - offset + 1);
              final blocked = _blocked.contains(date);
              return TextButton(style: TextButton.styleFrom(backgroundColor: blocked ? Colors.red.shade100 : Colors.green.shade50,
                foregroundColor: blocked ? Colors.red.shade800 : Colors.green.shade800),
                onPressed: _saving || date.isBefore(DateUtils.dateOnly(DateTime.now())) ? null : () => setState(() {
                  if (blocked) _blocked.remove(date); else _blocked.add(date); _preset = 'CUSTOM_SPLIT';
                }), child: Text('${date.day}'));
            }),
          const SizedBox(height: 12), const Text('Red dates are blocked. Tap a date to change it.'),
          const SizedBox(height: 24), Text('Weekend surcharge: $_surcharge%'),
          Slider(value: _surcharge.toDouble(), min: 0, max: 100, divisions: 100,
            onChanged: _saving ? null : (v) => setState(() => _surcharge = v.round())),
          ElevatedButton(onPressed: _saving ? null : _save,
            child: Text(_saving ? 'Saving…' : 'Save availability')),
        ],
      ]));
  }
}

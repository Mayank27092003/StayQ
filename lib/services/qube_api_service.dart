import 'api/api_client.dart';
import '../models/json_values.dart';

class QubeApiService {
  static Future<String> chat(String message, {List<Map<String, String>> history = const []}) async {
    try {
      final result = jsonMap(await ApiClient.instance.post('/qube/chat', authenticated: false,
        body: {'message': message, if (history.isNotEmpty) 'history': history}));
      final reply = result['reply']?.toString().trim();
      if (reply?.isNotEmpty != true) throw const FormatException('No response returned.');
      return reply!;
    } catch (_) { return 'The travel assistant is unavailable. Try again, or browse the current listings in Explore.'; }
  }
  static Future<Map<String, dynamic>> getPlan(String prompt) async {
    try {
      final result = jsonMap(await ApiClient.instance.post('/qube/plan', authenticated: false, body: {'prompt': prompt}));
      if (result.isEmpty) throw const FormatException('No itinerary returned.');
      return result;
    } catch (_) {
      return {'available': false, 'title': 'Travel planner unavailable',
        'description': 'A plan could not be retrieved. Try again when the service is available.',
        'itineraryDays': [], 'properties': []};
    }
  }
}

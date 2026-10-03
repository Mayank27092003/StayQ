import 'dart:convert';
import 'package:http/http.dart' as http;

class QubeApiService {
  static const String _apiRoot = 'https://stayq-api-608570851336.asia-south1.run.app/api/v1/qube';

  /// Conversational chat with DeepSeek AI travel concierge.
  /// Accepts conversation history so Qube maintains context across multiple turns.
  static Future<String> chat(
    String message, {
    List<Map<String, String>> history = const [],
  }) async {
    try {
      final payload = <String, dynamic>{'message': message};
      if (history.isNotEmpty) {
        payload['history'] = history;
      }

      final response = await http
          .post(
            Uri.parse('$_apiRoot/chat'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(payload),
          )
          .timeout(const Duration(seconds: 20));

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        if (data is Map && data['reply'] != null) {
          return data['reply'].toString().trim();
        }
        return data.toString().trim();
      }
    } catch (e) {
      // Graceful offline fallback below
    }

    // Smart contextual fallback matching Hinglish or English if network fails
    final lower = message.toLowerCase();
    if (lower.contains('goa') || lower.contains('beach') || lower.contains('pool')) {
      return "🌴 **Goa Private Pool & Beach Getaway:**\n\nI recommend our **Candolim Glass Pavilion Villa** (private infinity pool, 100m to shore) or **Vagator Cliffside Boutique Home**! Both feature 200 Mbps fiber WiFi, chef on call, and 0% brokerage.\n\nTell me your dates and how many guests are coming, and I'll find the best options!";
    } else if (lower.contains('manali') || lower.contains('mountain') || lower.contains('cabin') || lower.contains('snow')) {
      return "🏔️ **Himachal Mountain Escape:**\n\nCheck out the **Old Manali Pine & Cedar Scandinavian A-Frame Cabin**! It features a wood-burning fireplace, heated mattresses, high-speed fiber internet, and 360° snow-peak views.\n\nWould you like me to check availability or help you map the route?";
    } else if (lower.contains('rv') || lower.contains('campervan') || lower.contains('road trip') || lower.contains('caravan')) {
      return "🚐 **Stay Q Overland RV & Campervan Network:**\n\nIndia's 1st campervan road trip network! Choose your expedition:\n• **Western Ghats**: Mumbai/Pune ⇄ Goa\n• **Coastal Highway**: Goa ⇄ Kerala\n• **Himalayan Trail**: Manali ⇄ Leh\n\nEquipped with 220V shore power pit-stops, onboard kitchenette, and 24x7 support. What's your starting city?";
    } else if (lower.contains('bangalore') || lower.contains('bengaluru') || lower.contains('broker') || lower.contains('rent')) {
      return "🔑 **Zero-Brokerage Stays in Bengaluru:**\n\nCheck out our designer lofts in **Indiranagar & Koramangala** with 0% brokerage, 1Gbps fiber internet, instant digital contracts, and fully equipped workspaces!";
    }

    return "🤖 Hey there! I'm Qube, your Stay Q AI travel companion. I can help you find luxury pool villas, cozy mountain chalets, overland campervans, or create a personalized day-by-day travel plan. What destination are you dreaming of?";
  }

  /// Structured multi-day itinerary generation with verified database properties
  static Future<Map<String, dynamic>> getPlan(String prompt) async {
    try {
      final response = await http
          .post(
            Uri.parse('$_apiRoot/plan'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'prompt': prompt}),
          )
          .timeout(const Duration(seconds: 22));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      }
    } catch (_) {}

    // Fallback structured plan if API is temporarily unreachable
    return {
      'title': 'Curated Stay Q Itinerary',
      'description': 'A tailor-made journey crafted with boutique stays, overland trails, and authentic local experiences.',
      'itineraryDays': [
        {
          'day': 1,
          'activity': 'Check-in & Sunset Welcome',
          'details': 'Arrive at your verified Stay Q property, enjoy artisanal welcome refreshments, and take in the golden sunset.',
        },
        {
          'day': 2,
          'activity': 'Curated Local Experience',
          'details': 'Explore hidden beaches or pine trails, followed by private pool relaxation or campfire barbecue.',
        },
        {
          'day': 3,
          'activity': 'Scenic Brunch & Farewell',
          'details': 'Savor breakfast by the deck and enjoy flexible late checkout with zero hassle.',
        },
      ],
      'properties': [],
    };
  }
}

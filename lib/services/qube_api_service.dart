import 'api/api_client.dart';
import '../models/json_values.dart';

class QubeApiService {
  static Future<String> chat(String message, {List<Map<String, String>> history = const []}) async {
    try {
      final result = jsonMap(await ApiClient.instance.post(
        '/qube/chat',
        authenticated: false,
        body: {'message': message, if (history.isNotEmpty) 'history': history},
      ));
      final reply = result['reply']?.toString().trim();
      if (reply?.isNotEmpty != true) throw const FormatException('No response returned.');
      return reply!;
    } catch (_) {
      final lower = message.toLowerCase();
      if (lower.contains('goa')) {
        return "Goa is magical! For villas, North Goa (Vagator/Anjuna) offers buzzing cafes and cliff sunsets, while South Goa (Palolem/Agonda) provides serene, untouched white-sand beaches. What vibe suits your crew best?";
      } else if (lower.contains('manali') || lower.contains('himachal')) {
        return "Manali is great right now! We have cozy wood-cabin chalets in Old Manali and riverside treehouses in Naggar with panoramic snow-capped Himalayan peaks. Would you prefer an offbeat spot or near the mall road?";
      } else if (lower.contains('campervan') || lower.contains('overland')) {
        return "Our overland campervans come fully equipped with solar 220V power, hot water showers, and kitchenette! We recommend the Western Ghats corridor or the Spiti route. Ready to hit the open road?";
      }
      return "I'm Qube, your StayQ travel companion! Whether you need private pool villas, overland campervans, 0% brokerage lofts, or a customized day-by-day itinerary, I'm here to plan your perfect stay.";
    }
  }

  static Future<Map<String, dynamic>> getPlan(String prompt, {double? budget}) async {
    try {
      final result = jsonMap(await ApiClient.instance.post(
        '/qube/plan',
        authenticated: false,
        body: {
          'prompt': prompt,
          'budget': ?budget,
        },
      ));
      if (result.isEmpty || result['itineraryDays'] == null) {
        throw const FormatException('No itinerary returned.');
      }
      return result;
    } catch (_) {
      return _generateFallbackPlan(prompt, budget: budget);
    }
  }

  static Map<String, dynamic> _generateFallbackPlan(String prompt, {double? budget}) {
    final lower = prompt.toLowerCase();
    final budgetStr = budget != null ? ' (Budget: ₹${budget.toInt()})' : '';

    if (lower.contains('manali') || lower.contains('mountain') || lower.contains('himachal')) {
      return {
        'available': true,
        'title': '🏔️ 3-Day Himalayan Alpine Escape$budgetStr',
        'destination': 'Manali',
        'description': 'A serene mountain itinerary featuring pine forest walks, riverside cafes, and warm wood-fired chalet evenings.',
        'itineraryDays': [
          {
            'day': 1,
            'activity': 'Arrival & Old Manali Heritage Walk',
            'details': 'Morning check-in at your Alpine chalet. Stroll through the cedar trails of Old Manali, visit quaint bakeries, and enjoy a wood-fired trout dinner.',
            'morning': 'Private pickup & check-in to wood-frame alpine chalet.',
            'afternoon': 'Walk through Hadimba Temple forest trail & organic cafe lunch.',
            'evening': 'Campfire by the Beas river & stargazing session.',
          },
          {
            'day': 2,
            'activity': 'Solang Valley High Altitude Vistas',
            'details': 'Head up toward Solang Valley for panoramic valley views. Optional paragliding or quiet pine trail trekking.',
            'morning': 'Warm mountain breakfast with organic valley honey.',
            'afternoon': 'Scenic drive past Atal Tunnel into Sissu for waterfall views.',
            'evening': 'Return to chalet for traditional Himachali Siddu dinner.',
          },
          {
            'day': 3,
            'activity': 'Naggar Castle & Artisan Craft Village',
            'details': 'Explore the historic wooden architecture of Naggar Castle and Roerich art estate before heading home with local memories.',
            'morning': 'Naggar village exploration & hot spring bath at Vashisht.',
            'afternoon': 'Artisan woolen shawl shopping & riverfront coffee.',
            'evening': 'Departure with refreshed spirit and mountain memories.',
          },
        ],
        'properties': [],
      };
    } else if (lower.contains('campervan') || lower.contains('road trip') || lower.contains('kerala')) {
      return {
        'available': true,
        'title': '🚐 4-Day Coastal & Ghats Overland Route$budgetStr',
        'destination': 'Goa to Kerala',
        'description': 'A stunning overland campervan route with verified 220V power stops, coastal campgrounds, and misty Western Ghats viewpoints.',
        'itineraryDays': [
          {
            'day': 1,
            'activity': 'Campervan Handover & Gokarna Beach Camp',
            'details': 'Pick up your overland campervan in South Goa. Cruise down NH66 to Gokarna and park at our partner beachside camp.',
            'morning': 'Orientation & campervan systems briefing (solar, water, galley).',
            'afternoon': 'Scenic drive to Kudle Beach with coastal photo stops.',
            'evening': 'Rooftop tent sunset dinner overlooking the Arabian Sea.',
          },
          {
            'day': 2,
            'activity': 'Murudeshwar & Maravanthe Coastal Highway',
            'details': 'Drive the famous stretch where the Suparnika river runs parallel to the ocean. Overnight at a verified coconut grove RV park.',
            'morning': 'Sunrise swim & fresh coconut water on the beach.',
            'afternoon': 'Cruise along Maravanthe coast with beach picnic.',
            'evening': 'RV pit-stop: 220V plug-in, warm shower, and campfire barbecue.',
          },
          {
            'day': 3,
            'activity': 'Wayanad Ghats Ascent & Tea Plantation Camp',
            'details': 'Ascend the 9 hairpin curves into misty Wayanad. Park amidst lush tea plantations with cool mountain breezes.',
            'morning': 'Ascend Western Ghats via Thamarassery Churam.',
            'afternoon': 'Bamboo rafting & Chembra peak viewpoint walk.',
            'evening': 'Overland campfire with Malabar spices under clear night skies.',
          },
          {
            'day': 4,
            'activity': 'Misty Lake Breakfast & Return Journey',
            'details': 'Wake up to misty morning reflections, enjoy French press coffee by Karapuzha reservoir, and conclude the expedition.',
            'morning': 'Fresh coffee by the lake & morning wildlife spotting.',
            'afternoon': 'Safe campervan handover at designated drop-off station.',
            'evening': 'Trip wrap-up & memorable road trip completion.',
          },
        ],
        'properties': [],
      };
    } else {
      // Default / Goa Beach & Pool Villa itinerary
      return {
        'available': true,
        'title': '🌴 3-Day Luxury Beach & Private Pool Villa Itinerary$budgetStr',
        'destination': 'Goa',
        'description': 'Curated luxury getaway featuring private pool chill-outs, coastal sunset spots, and exquisite boutique dining.',
        'itineraryDays': [
          {
            'day': 1,
            'activity': 'Villa Check-in & Private Infinity Pool Unwind',
            'details': 'Arrive at your Portuguese designer villa. Spend the afternoon in your private pool with chilled tropical refreshments.',
            'morning': 'Direct private check-in with host welcome drink.',
            'afternoon': 'Lounge by the private pool & relax to ambient coastal music.',
            'evening': 'Sunset cocktails at Thalassa cliffside followed by seafood dinner.',
          },
          {
            'day': 2,
            'activity': 'Catamaran Sunset Cruise & Secret Coves',
            'details': 'Charter a private catamaran cruise to secluded sandbars, followed by fine dining at an open-air Goan heritage garden.',
            'morning': 'Artisan breakfast prepared with local sourdough and fresh fruits.',
            'afternoon': 'Private catamaran boat excursion with dolphin watching.',
            'evening': 'Dinner at Gunpowder Assagao under vintage mango trees.',
          },
          {
            'day': 3,
            'activity': 'Boutique Shopping & Serene Beach Farewell',
            'details': 'Explore bohemian boutiques in Fontainhas or relax on the quiet white sands of Morjim before airport departure.',
            'morning': 'Morning yoga session by the pool & breakfast.',
            'afternoon': 'Fontainhas heritage walk through colorful Latin quarter.',
            'evening': 'Farewell toast & smooth airport transfer.',
          },
        ],
        'properties': [],
      };
    }
  }
}

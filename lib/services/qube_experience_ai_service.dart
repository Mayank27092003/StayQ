import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class QubeExperienceAiResult {
  final String categoryKey;
  final String title;
  final String city;
  final String meetingPoint;
  final String duration;
  final String timeSlot;
  final double pricePerPerson;
  final int maxSpots;
  final String description;
  final List<String> inclusions;
  final String transportOption;
  final bool foodIncluded;
  final bool equipmentIncluded;
  final int kidsFreeAgeLimit;

  QubeExperienceAiResult({
    required this.categoryKey,
    required this.title,
    required this.city,
    required this.meetingPoint,
    required this.duration,
    required this.timeSlot,
    required this.pricePerPerson,
    required this.maxSpots,
    required this.description,
    required this.inclusions,
    this.transportOption = 'SELF_ARRIVE',
    this.foodIncluded = true,
    this.equipmentIncluded = true,
    this.kidsFreeAgeLimit = 0,
  });
}

class QubeExperienceAiService {
  static Future<QubeExperienceAiResult> generateExperience({
    required String activityIdea,
    required String location,
    String pricingTier = 'Standard',
    required List<String> validCategoryKeys,
  }) async {
    final trimmedIdea = activityIdea.trim();
    final trimmedLoc = location.trim();

    try {
      final prompt = '''
You are Qube, the official AI Co-Host for StayQ Experiences in India.
A host wants to create an authentic local activity / masterclass.

Host Idea: "$trimmedIdea"
Location / City: "$trimmedLoc"
Pricing Preference: "$pricingTier"

Valid Category Keys (pick the single best matching key strictly from this list):
${validCategoryKeys.join(', ')}

Generate a complete, high-converting 5-step experience blueprint in India.
Return strictly valid JSON only (do not include markdown ticks, no preamble, only raw JSON):
{
  "categoryKey": "ONE_VALID_KEY_FROM_LIST",
  "title": "Engaging, professional title under 75 characters (e.g. Sunset Mangrove Kayaking & Hidden Island Tea Trail)",
  "city": "City, State in India (e.g. Panaji, Goa)",
  "meetingPoint": "Exact landmark / meeting spot (e.g. Divar Ferry Jetty, Old Goa)",
  "duration": "e.g. 2.5 Hours",
  "timeSlot": "e.g. 04:30 PM - 07:00 PM",
  "pricePerPerson": 1499,
  "maxSpots": 8,
  "description": "Rich 3-paragraph engaging narrative for guests detailing what we do, why it is special, and insider tips.",
  "inclusions": [
    "Item 1",
    "Item 2",
    "Item 3",
    "Item 4"
  ],
  "transportOption": "SELF_ARRIVE",
  "foodIncluded": true,
  "equipmentIncluded": true,
  "kidsFreeAgeLimit": 5
}
''';

      final response = await http
          .post(
            Uri.parse('${AppConfig.deepseekBaseUrl}/chat/completions'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ${AppConfig.deepseekApiKey}',
            },
            body: jsonEncode({
              'model': AppConfig.deepseekModel,
              'messages': [
                {
                  'role': 'system',
                  'content':
                      'You are Qube, an expert travel & experience co-host. Return valid JSON only.',
                },
                {'role': 'user', 'content': prompt},
              ],
              'temperature': 0.7,
              'max_tokens': 1200,
            }),
          )
          .timeout(const Duration(seconds: 18));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        final rawContent =
            decoded['choices']?[0]?['message']?['content']?.toString() ?? '';

        String cleanedJson = rawContent.trim();
        if (cleanedJson.startsWith('```json')) {
          cleanedJson = cleanedJson.substring(7);
        } else if (cleanedJson.startsWith('```')) {
          cleanedJson = cleanedJson.substring(3);
        }
        if (cleanedJson.endsWith('```')) {
          cleanedJson = cleanedJson.substring(0, cleanedJson.length - 3);
        }
        cleanedJson = cleanedJson.trim();

        final parsed = jsonDecode(cleanedJson) as Map<String, dynamic>;

        String matchedKey = parsed['categoryKey']?.toString() ?? '';
        if (!validCategoryKeys.contains(matchedKey)) {
          matchedKey = validCategoryKeys.firstWhere(
            (k) =>
                trimmedIdea.toUpperCase().contains(k) ||
                k.contains(matchedKey.toUpperCase()),
            orElse: () => validCategoryKeys.first,
          );
        }

        final double price =
            (parsed['pricePerPerson'] is num)
                ? (parsed['pricePerPerson'] as num).toDouble()
                : (double.tryParse(parsed['pricePerPerson']?.toString() ?? '') ??
                    1499.0);

        final int spots =
            (parsed['maxSpots'] is num)
                ? (parsed['maxSpots'] as num).toInt()
                : (int.tryParse(parsed['maxSpots']?.toString() ?? '') ?? 8);

        final List<String> incList =
            (parsed['inclusions'] is List)
                ? (parsed['inclusions'] as List)
                    .map((e) => e.toString())
                    .toList()
                : [
                  'All Equipment and Materials Provided',
                  'Expert Host Guidance & Stories',
                  'Traditional Refreshment & Snacks',
                ];

        return QubeExperienceAiResult(
          categoryKey: matchedKey,
          title: parsed['title']?.toString() ?? 'Curated $trimmedIdea in $trimmedLoc',
          city: parsed['city']?.toString() ?? (trimmedLoc.isNotEmpty ? trimmedLoc : 'Goa, India'),
          meetingPoint:
              parsed['meetingPoint']?.toString() ?? 'Central Meeting Point, $trimmedLoc',
          duration: parsed['duration']?.toString() ?? '3 Hours',
          timeSlot: parsed['timeSlot']?.toString() ?? '09:30 AM - 12:30 PM',
          pricePerPerson: price > 0 ? price : 1499.0,
          maxSpots: spots > 0 ? spots : 8,
          description: parsed['description']?.toString() ??
              'Join us for an immersive $trimmedIdea experience in $trimmedLoc.\n\nHosted by local specialists with insider access.',
          inclusions: incList,
          transportOption: parsed['transportOption']?.toString() ?? 'SELF_ARRIVE',
          foodIncluded: parsed['foodIncluded'] == true,
          equipmentIncluded: parsed['equipmentIncluded'] != false,
          kidsFreeAgeLimit: (parsed['kidsFreeAgeLimit'] is num)
              ? (parsed['kidsFreeAgeLimit'] as num).toInt()
              : 5,
        );
      }
    } catch (_) {
      // Graceful fallback if offline
    }

    // Intelligent fallback
    final fallbackCat = validCategoryKeys.firstWhere(
      (k) => trimmedIdea.toUpperCase().contains(k),
      orElse: () => 'FOOD_AND_DRINK',
    );
    final targetCity = trimmedLoc.isNotEmpty ? trimmedLoc : 'Goa, India';

    return QubeExperienceAiResult(
      categoryKey: fallbackCat,
      title: 'Curated $trimmedIdea & Insider Trail in $targetCity',
      city: targetCity,
      meetingPoint: 'Old Town Heritage Landmark, $targetCity',
      duration: '3 Hours',
      timeSlot: '10:00 AM - 01:00 PM',
      pricePerPerson: 1299.0,
      maxSpots: 8,
      description:
          'Experience the authentic magic of $trimmedIdea in $targetCity.\n\n'
          'What We\'ll Do:\n'
          '• Meet at our designated spot for local introduction & briefing.\n'
          '• Dive deep hands-on with personalized host guidance and premium gear.\n'
          '• Share refreshments and take home lasting memories and skills.',
      inclusions: [
        'Complete Gear & Materials Provided',
        'Signature Local Welcome Drink & Snacks',
        'Personalized Guided Walk & Historical Context',
      ],
      transportOption: 'SELF_ARRIVE',
      foodIncluded: true,
      equipmentIncluded: true,
      kidsFreeAgeLimit: 5,
    );
  }
}

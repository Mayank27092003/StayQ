import 'dart:convert';
import 'package:http/http.dart' as http;

class QubeApiService {
  static const String _baseUrl = 'https://stayq-api-608570851336.asia-south1.run.app/api/v1/qube/plan';

  static Future<Map<String, dynamic>> getPlan(String prompt) async {
    try {
      final response = await http.post(
        Uri.parse(_baseUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'prompt': prompt}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to get plan from Qube. Status: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to connect to Qube: $e');
    }
  }
}

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class MessagingProvider with ChangeNotifier {
  final String _apiUrl = 'https://stayq-api-608570851336.asia-south1.run.app';
  
  List<Map<String, dynamic>> _conversations = [];
  List<Map<String, dynamic>> _currentMessages = [];
  bool _isLoading = false;
  String? _error;
  
  IO.Socket? _socket;

  List<Map<String, dynamic>> get conversations => _conversations;
  List<Map<String, dynamic>> get currentMessages => _currentMessages;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void initializeSocket() async {
    if (_socket != null && _socket!.connected) return;

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    final token = await user.getIdToken();

    _socket = IO.io(_apiUrl, IO.OptionBuilder()
        .setTransports(['websocket'])
        .enableAutoConnect()
        .setQuery({'userId': user.uid})
        .setExtraHeaders({'Authorization': 'Bearer $token'}) 
        .build());

    _socket!.onConnect((_) {
      print('Connected to chat socket');
    });

    _socket!.on('newMessage', (data) {
      if (data != null) {
        if (_currentMessages.isNotEmpty && _currentMessages.first['conversationId'] == data['conversationId']) {
          _currentMessages.add(Map<String, dynamic>.from(data));
          notifyListeners();
        }
        fetchConversations();
      }
    });

    _socket!.onDisconnect((_) => print('Disconnected from chat socket'));
  }

  void disposeSocket() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  Future<void> fetchConversations() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final token = await FirebaseAuth.instance.currentUser?.getIdToken();
      if (token == null) throw Exception('Not logged in');

      final response = await http.get(
        Uri.parse('$_apiUrl/api/v1/messaging/conversations'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        _conversations = List<Map<String, dynamic>>.from(jsonDecode(response.body));
      } else {
        _error = 'Failed to load conversations';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchConversationDetails(String conversationId) async {
    _isLoading = true;
    _error = null;
    _currentMessages = [];
    notifyListeners();

    try {
      final token = await FirebaseAuth.instance.currentUser?.getIdToken();
      if (token == null) throw Exception('Not logged in');

      final response = await http.get(
        Uri.parse('$_apiUrl/api/v1/messaging/conversations/$conversationId'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _currentMessages = List<Map<String, dynamic>>.from(data['messages'] ?? []);
      } else {
        _error = 'Failed to load conversation details';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> sendMessage(String conversationId, String text) async {
    if (text.trim().isEmpty) return;

    final currentUser = FirebaseAuth.instance.currentUser;
    final tempMsg = {
      'id': 'temp_${DateTime.now().millisecondsSinceEpoch}',
      'conversationId': conversationId,
      'text': text,
      'senderId': currentUser?.uid ?? '',
      'createdAt': DateTime.now().toIso8601String(),
    };

    // Optimistically add to UI
    _currentMessages.add(tempMsg);
    notifyListeners();

    // 1. Emit via socket if active
    if (_socket != null && _socket!.connected) {
      _socket!.emit('sendMessage', {
        'conversationId': conversationId,
        'text': text,
      });
    } else {
      initializeSocket();
    }

    // 2. Guaranteed REST backup delivery
    try {
      final token = await currentUser?.getIdToken();
      await http.post(
        Uri.parse('$_apiUrl/api/v1/messaging/conversations/$conversationId/messages'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'text': text}),
      );
    } catch (e) {
      debugPrint('REST message post error: $e');
    }

    // Refresh conversation preview
    fetchConversations();
  }
}

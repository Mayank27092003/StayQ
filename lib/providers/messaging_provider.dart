import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../config/app_config.dart';
import '../models/json_values.dart';
import '../services/api/api_client.dart';
import '../services/push_notification_service.dart';

class MessagingProvider extends ChangeNotifier {
  String? _ownerId;
  MessagingProvider({String? userId}) : _ownerId = userId;
  bool _disposed = false;
  IO.Socket? _socket;
  bool _connecting = false;
  int _detailsRequest = 0;
  int _conversationRequest = 0;
  String? _activeConversationId;
  List<Map<String, dynamic>> _conversations = [];
  List<Map<String, dynamic>> _currentMessages = [];
  bool _isLoading = false;
  String? _error;
  bool get _owned => !_disposed && _ownerId != null && FirebaseAuth.instance.currentUser?.uid == _ownerId;
  void updateUserId(String? userId) {
    if (_ownerId == userId) return;
    disposeSocket();
    _ownerId = userId;
    _conversations = [];
    _currentMessages = [];
    _error = null;
    notifyListeners();
    if (userId != null) {
      unawaited(initializeSocket());
      unawaited(fetchConversations());
    }
  }
  List<Map<String, dynamic>> get conversations => List.unmodifiable(_conversations);
  List<Map<String, dynamic>> get currentMessages => List.unmodifiable(_currentMessages);
  bool get isLoading => _isLoading;
  String? get error => _error;
  @override
  void notifyListeners() { if (!_disposed) super.notifyListeners(); }
  @override
  void dispose() { _disposed = true; disposeSocket(); super.dispose(); }

  Future<void> initializeSocket() async {
    if (!_owned || _connecting || _socket != null) return;
    _connecting = true;
    try {
      final token = await FirebaseAuth.instance.currentUser!.getIdToken();
      if (!_owned || token == null) return;
      final uri = Uri.parse(AppConfig.apiBaseUrl);
      final origin = '${uri.scheme}://${uri.authority}';
      _socket = IO.io(origin, IO.OptionBuilder().setTransports(['websocket'])
        .disableAutoConnect().enableForceNew().disableMultiplex()
        .setAuth({'token': token}).setExtraHeaders({'Authorization': 'Bearer $token'}).build());
      _socket!.on('newMessage', (dynamic data) {
        if (!_owned || data is! Map) return;
        final message = jsonMap(data);
        final convId = message['conversationId']?.toString();
        final senderId = message['senderId']?.toString();

        if (convId == _activeConversationId) {
          _mergeMessage(message);
          notifyListeners();
        } else if (senderId != null && senderId != _ownerId) {
          final text = message['text']?.toString() ?? 'New message';
          final senderName = (message['sender'] is Map ? message['sender']['displayName'] : null)?.toString() ?? 'New Message';
          PushNotificationService.scaffoldMessengerKey?.currentState?.showSnackBar(
            SnackBar(
              behavior: SnackBarBehavior.floating,
              backgroundColor: const Color(0xFF1E1B4B),
              duration: const Duration(seconds: 4),
              content: Row(
                children: [
                  const Icon(Icons.chat_bubble_rounded, color: Color(0xFFFBBF24), size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(senderName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                        Text(text, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        }
        unawaited(fetchConversations());
      });
      _socket!.onConnectError((dynamic _) { if (_owned) { _error = 'Live chat is disconnected. Messages can still be sent.'; notifyListeners(); } });
      _socket!.connect();
    } catch (e) { if (_owned) { _error = e.toString(); notifyListeners(); } }
    finally { _connecting = false; }
  }
  void disposeSocket() {
    _socket?.clearListeners(); _socket?.disconnect(); _socket?.dispose(); _socket = null;
  }
  void _mergeMessage(Map<String, dynamic> message) {
    final id = (message['id'] ?? message['_id'])?.toString();
    final clientId = message['clientMessageId']?.toString();
    if (id == null || id.isEmpty) return;
    final index = _currentMessages.indexWhere((m) => (m['id'] ?? m['_id'])?.toString() == id ||
      (clientId != null && m['clientMessageId'] == clientId));
    final accepted = {...message, 'id': id, 'deliveryStatus': 'sent'};
    if (index < 0) _currentMessages.add(accepted); else _currentMessages[index] = accepted;
  }
  Future<String?> createOrGetConversation({required String hostId, String? propertyId, String? bookingId}) async {
    if (!_owned || hostId.isEmpty) { _error = 'A verified host account is required to open this conversation.'; notifyListeners(); return null; }
    try {
      final result = jsonMap(await ApiClient.instance.post('/messaging/conversations', body: {
        'hostId': hostId, if (propertyId != null) 'propertyId': propertyId,
        if (bookingId != null) 'bookingId': bookingId,
      }, idempotencyKey: 'conversation:$_ownerId:$hostId:${bookingId ?? propertyId ?? "direct"}'));
      if (!_owned) return null;
      final id = (result['id'] ?? result['_id'] ?? jsonMap(result['conversation'])['id'])?.toString();
      if (id?.isNotEmpty != true) throw const FormatException('No conversation ID returned.');
      unawaited(fetchConversations()); return id;
    } catch (e) { if (_owned) { _error = e.toString(); notifyListeners(); } return null; }
  }
  Future<void> fetchConversations() async {
    if (!_owned) return;
    final request = ++_conversationRequest;
    try {
      final result = await ApiClient.instance.get('/messaging/conversations');
      if (!_owned || request != _conversationRequest) return;
      final records = result is List ? result : jsonMap(result)['conversations'];
      if (records is! List) throw const FormatException('Invalid conversation response.');
      _conversations = records.map(jsonMap).toList(); _error = null; notifyListeners();
    } catch (e) { if (_owned && request == _conversationRequest) { _error = e.toString(); notifyListeners(); } }
  }
  Future<void> fetchConversationDetails(String conversationId) async {
    if (!_owned) return;
    final request = ++_detailsRequest;
    _activeConversationId = conversationId; _currentMessages = []; _isLoading = true; _error = null; notifyListeners();
    try {
      final result = jsonMap(await ApiClient.instance.get('/messaging/conversations/${Uri.encodeComponent(conversationId)}'));
      if (!_owned || request != _detailsRequest || conversationId != _activeConversationId) return;
      // Keep messages received through the socket while this request was in flight.
      final incoming = List<Map<String, dynamic>>.from(_currentMessages);
      _currentMessages = [];
      for (final m in result['messages'] is List ? result['messages'] : []) { _mergeMessage(jsonMap(m)); }
      for (final m in incoming) { _mergeMessage(m); }
    } catch (e) { if (_owned && request == _detailsRequest) _error = e.toString(); }
    finally { if (_owned && request == _detailsRequest) { _isLoading = false; notifyListeners(); } }
  }
  Future<void> sendMessage(String conversationId, String text) async {
    if (!_owned) throw ApiException(401, 'Sign in to send messages.');
    if (text.trim().isEmpty) return;
    final clientId = List.generate(16, (_) => Random.secure().nextInt(256).toRadixString(16).padLeft(2, '0')).join();
    final pending = <String, dynamic>{'id': 'pending:$clientId', 'clientMessageId': clientId,
      'conversationId': conversationId, 'text': text.trim(), 'senderId': _ownerId,
      'createdAt': DateTime.now().toUtc().toIso8601String(), 'deliveryStatus': 'pending'};
    if (_activeConversationId == conversationId) { _currentMessages.add(pending); notifyListeners(); }
    try {
      // Send through one acknowledged transport; the socket is receive-only.
      final result = jsonMap(await ApiClient.instance.post('/messaging/conversations/${Uri.encodeComponent(conversationId)}/messages',
        body: {'text': text.trim(), 'clientMessageId': clientId}, idempotencyKey: 'message:$clientId'));
      if (!_owned) return;
      final message = result['message'] is Map ? jsonMap(result['message']) : result;
      if ((message['id'] ?? message['_id'])?.toString().isNotEmpty != true) throw const FormatException('The server did not acknowledge message delivery.');
      if (_activeConversationId == conversationId) {
        _mergeMessage({...message, 'conversationId': conversationId, 'clientMessageId': clientId}); notifyListeners();
      }
      unawaited(fetchConversations());
    } catch (e) {
      if (_owned) {
        pending['deliveryStatus'] = 'failed'; _error = 'Message was not confirmed: $e'; notifyListeners();
      }
      rethrow;
    }
  }
}

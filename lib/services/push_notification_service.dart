import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'api/api_client.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (Firebase.apps.isEmpty) await Firebase.initializeApp();
}
class PushNotificationService {
  static GlobalKey<ScaffoldMessengerState>? scaffoldMessengerKey;
  static void Function(RemoteMessage)? onForegroundMessageReceived;
  static Future<void> Function(RemoteMessage)? onNotificationOpened;
  static StreamSubscription<String>? _refresh;
  static StreamSubscription<RemoteMessage>? _foreground;
  static StreamSubscription<RemoteMessage>? _opened;
  static bool _initialized = false;
  static FirebaseMessaging get _messaging => FirebaseMessaging.instance;
  static bool _forCurrentUser(RemoteMessage message) {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    final target = message.data['userId']?.toString();
    if (target != null && target.isNotEmpty && uid != null && target != uid) {
      return false;
    }
    return true;
  }
  static Future<void> initialize({GlobalKey<ScaffoldMessengerState>? messengerKey}) async {
    scaffoldMessengerKey = messengerKey;
    if (_initialized) return;
    _initialized = true;
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    _refresh = _messaging.onTokenRefresh.listen((_) => unawaited(syncTokenWithBackend()));
    _foreground = FirebaseMessaging.onMessage.listen((message) {
      if (!_forCurrentUser(message)) return;
      onForegroundMessageReceived?.call(message);
      final title = message.notification?.title ?? message.data['title']?.toString();
      final body = message.notification?.body ?? message.data['body']?.toString();
      if (title != null) {
        scaffoldMessengerKey?.currentState?.showSnackBar(SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: const Color(0xFF1E1B4B),
          content: Row(
            children: [
              const Icon(Icons.notifications_active, color: Color(0xFFFBBF24), size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  [title, if (body != null) body].join('\n'),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ));
      }
    });
    _opened = FirebaseMessaging.onMessageOpenedApp.listen((message) {
      if (_forCurrentUser(message) && onNotificationOpened != null) unawaited(onNotificationOpened!(message));
    });
    try {
      final permission = await _messaging.requestPermission(alert: true, badge: true, sound: true)
        .timeout(const Duration(seconds: 10));
      if (permission.authorizationStatus == AuthorizationStatus.authorized || permission.authorizationStatus == AuthorizationStatus.provisional) {
        unawaited(syncTokenWithBackend());
      }
      final initial = await _messaging.getInitialMessage().timeout(const Duration(seconds: 10));
      if (initial != null && _forCurrentUser(initial) && onNotificationOpened != null) await onNotificationOpened!(initial);
    } catch (e) { debugPrint('Notification setup failed: $e'); }
  }
  static Future<void> syncTokenWithBackend([String? token]) async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;
    try {
      token ??= await _messaging.getToken().timeout(const Duration(seconds: 10));
      if (token == null || token.isEmpty || FirebaseAuth.instance.currentUser?.uid != uid) return;
      final platform = kIsWeb ? 'web' : defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';
      await ApiClient.instance.post('/notifications/device-token', body: {'token': token, 'platform': platform});
    } catch (e) { debugPrint('Notification token registration failed: $e'); }
  }
  static Future<void> removeTokenFromBackend() async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return;
    try {
      final token = await _messaging.getToken().timeout(const Duration(seconds: 3));
      if (token == null || FirebaseAuth.instance.currentUser?.uid != uid) return;
      await ApiClient.instance.delete('/notifications/device-token', body: {'token': token});
    } catch (e) { debugPrint('Notification token removal failed: $e'); }
  }
  static Future<void> dispose() async {
    await _refresh?.cancel(); await _foreground?.cancel(); await _opened?.cancel();
    _refresh = null; _foreground = null; _opened = null; _initialized = false;
  }
}

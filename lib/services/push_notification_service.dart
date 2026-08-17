import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;

// Top-level function for background message handling
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint("Handling a background message: ${message.messageId}");
}

class PushNotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  static Future<void> initialize() async {
    // 1. Request permission
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      debugPrint('User granted permission');
      
      // 2. Get the token
      try {
        String? token = await _messaging.getToken();
        if (token != null) {
          debugPrint("FCM Token: $token");
          await _sendTokenToBackend(token);
        }

        // 3. Listen to token refreshes
        _messaging.onTokenRefresh.listen((newToken) {
          _sendTokenToBackend(newToken);
        });
      } catch (e) {
        debugPrint('Failed to get FCM token: $e');
      }

      // 4. Handle foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Received foreground message: ${message.notification?.title}');
        
        // We can show a toast or local notification
        // Note: Getting a context here requires a global navigator key, 
        // so we just rely on standard system notifications for now, 
        // or a custom top-level overlay if we implement one.
      });

      // 5. Handle background/terminated messages
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
      
      // 6. Handle notification opens when app was in background
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('Message clicked! ${message.data}');
        // Handle routing based on message.data
      });
      
      // 7. Handle notification opens when app was terminated
      RemoteMessage? initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        debugPrint('App launched from terminated state via notification');
      }
    } else {
      debugPrint('User declined or has not accepted permission');
    }
  }

  static Future<void> _sendTokenToBackend(String token) async {
    try {
      final platform = Platform.isIOS ? 'ios' : 'android';
      const String apiUrl = 'https://stayq-api-608570851336.asia-south1.run.app';
      final userToken = await FirebaseAuth.instance.currentUser?.getIdToken();
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (userToken != null) {
        headers['Authorization'] = 'Bearer $userToken';
      }

      await http.post(
        Uri.parse('$apiUrl/api/v1/notifications/device-token'),
        headers: headers,
        body: jsonEncode({
          'token': token,
          'platform': platform,
        }),
      );
      debugPrint("Token successfully sent to backend.");
    } catch (e) {
      debugPrint("Failed to send token to backend: $e");
    }
  }
}

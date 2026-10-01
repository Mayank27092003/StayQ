import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'api/api_client.dart';

// Top-level function for background message handling
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint("Handling a background message: ${message.messageId}");
}

class PushNotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static GlobalKey<ScaffoldMessengerState>? scaffoldMessengerKey;
  static void Function(RemoteMessage message)? onForegroundMessageReceived;

  static Future<void> initialize({GlobalKey<ScaffoldMessengerState>? messengerKey}) async {
    scaffoldMessengerKey = messengerKey;

    // 1. Request permission
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional) {
      debugPrint('[PushNotificationService] Notification permission granted: ${settings.authorizationStatus}');
      
      // 2. Get the token & sync if user is already authenticated
      try {
        String? token = await _messaging.getToken();
        if (token != null) {
          debugPrint("[PushNotificationService] FCM Token obtained: $token");
          await syncTokenWithBackend(token);
        }

        // 3. Listen to token refreshes
        _messaging.onTokenRefresh.listen((newToken) {
          debugPrint("[PushNotificationService] FCM Token refreshed.");
          syncTokenWithBackend(newToken);
        });
      } catch (e) {
        debugPrint('[PushNotificationService] Failed to get FCM token: $e');
      }

      // 4. Handle foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('[PushNotificationService] Received foreground message: ${message.notification?.title}');
        
        onForegroundMessageReceived?.call(message);

        // Show in-app banner if scaffold messenger key is available
        if (scaffoldMessengerKey?.currentState != null && message.notification != null) {
          scaffoldMessengerKey!.currentState!.showSnackBar(
            SnackBar(
              behavior: SnackBarBehavior.floating,
              backgroundColor: const Color(0xFF1E1C2A),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              content: Row(
                children: [
                  const Icon(Icons.notifications_active_rounded, color: Color(0xFFE05638), size: 22),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          message.notification?.title ?? 'Notification',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14),
                        ),
                        if (message.notification?.body != null)
                          Text(
                            message.notification!.body!,
                            style: const TextStyle(color: Colors.white70, fontSize: 12),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              duration: const Duration(seconds: 4),
            ),
          );
        }
      });

      // 5. Handle background/terminated messages
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
      
      // 6. Handle notification opens when app was in background
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('[PushNotificationService] Notification opened from background: ${message.data}');
      });
      
      // 7. Handle notification opens when app was terminated
      RemoteMessage? initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        debugPrint('[PushNotificationService] App launched from terminated state via notification: ${initialMessage.data}');
      }
    } else {
      debugPrint('[PushNotificationService] User declined or has not accepted notification permission');
    }
  }

  /// Syncs the FCM token with the backend for the current logged-in user.
  static Future<void> syncTokenWithBackend([String? token]) async {
    try {
      token ??= await _messaging.getToken();
      if (token == null || token.isEmpty) return;

      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser == null) {
        debugPrint("[PushNotificationService] User not logged in yet. Token will sync upon authentication.");
        return;
      }

      final idToken = await currentUser.getIdToken();
      if (idToken == null) return;

      final platform = Platform.isIOS ? 'ios' : (Platform.isAndroid ? 'android' : 'web');
      final uri = Uri.parse('${ApiClient.instance.baseUrl}/notifications/device-token');

      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $idToken',
        },
        body: jsonEncode({
          'token': token,
          'platform': platform,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        debugPrint("[PushNotificationService] Device token successfully registered with backend.");
      } else {
        debugPrint("[PushNotificationService] Failed to sync token (${response.statusCode}): ${response.body}");
      }
    } catch (e) {
      debugPrint("[PushNotificationService] Error syncing token to backend: $e");
    }
  }

  /// Removes the device token on logout so subsequent notifications aren't sent to this device.
  static Future<void> removeTokenFromBackend() async {
    try {
      final token = await _messaging.getToken();
      if (token == null || token.isEmpty) return;

      final currentUser = FirebaseAuth.instance.currentUser;
      if (currentUser == null) return;

      final idToken = await currentUser.getIdToken();
      if (idToken == null) return;

      final uri = Uri.parse('${ApiClient.instance.baseUrl}/notifications/device-token');
      await http.delete(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $idToken',
        },
        body: jsonEncode({
          'token': token,
        }),
      );
      debugPrint("[PushNotificationService] Device token removed from backend on logout.");
    } catch (e) {
      debugPrint("[PushNotificationService] Error removing token on logout: $e");
    }
  }
}

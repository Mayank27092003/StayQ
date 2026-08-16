import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/app_provider.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import '../../theme/app_colors.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _isLoading = true;
  List<dynamic> _notifications = [];

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  String _getTimeAgo(String isoString) {
    if (isoString.isEmpty) return 'Just now';
    try {
      final date = DateTime.parse(isoString);
      final diff = DateTime.now().difference(date);
      if (diff.inDays > 1) {
        return '${diff.inDays}d ago';
      } else if (diff.inDays == 1) {
        return 'Yesterday';
      } else if (diff.inHours > 0) {
        return '${diff.inHours}h ago';
      } else if (diff.inMinutes > 0) {
        return '${diff.inMinutes}m ago';
      } else {
        return 'Just now';
      }
    } catch (e) {
      return 'Just now';
    }
  }

  Future<void> _fetchNotifications() async {
    const String apiUrl = 'https://stayq-api-608570851336.asia-south1.run.app';

    try {
      final token = await FirebaseAuth.instance.currentUser?.getIdToken();
      final headers = token != null ? {'Authorization': 'Bearer $token'} : <String, String>{};

      final res = await http.get(Uri.parse('$apiUrl/api/v1/notifications'), headers: headers);
      if (res.statusCode == 200) {
        _notifications = jsonDecode(res.body) as List;
      }
    } catch (e) {
      _notifications = [];
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Notifications', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                for (var notif in _notifications) {
                  if (notif is Map) {
                    notif['isRead'] = true;
                  }
                }
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('All notifications marked as read')),
              );
            },
            child: const Text('Mark all as read'),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              onRefresh: _fetchNotifications,
              child: _notifications.isEmpty
                  ? const Center(child: Text('No notifications yet', style: TextStyle(color: AppColors.textSecondary)))
                  : ListView.builder(
                      padding: const EdgeInsets.all(20),
                      itemCount: _notifications.length,
                      itemBuilder: (context, index) {
                        final notif = _notifications[index];
                        final isRead = notif['isRead'] == true;
                        
                        IconData icon;
                        Color iconColor;
                        switch (notif['type']) {
                          case 'BOOKING':
                            icon = Icons.calendar_today_rounded;
                            iconColor = AppColors.primary;
                            break;
                          case 'MESSAGE':
                            icon = Icons.chat_bubble_outline_rounded;
                            iconColor = Colors.blue;
                            break;
                          case 'PROMO':
                            icon = Icons.local_offer_outlined;
                            iconColor = Colors.orange;
                            break;
                          default:
                            icon = Icons.notifications_none_rounded;
                            iconColor = AppColors.textSecondary;
                        }

                        return GestureDetector(
                          onTap: () {
                            if (!isRead) {
                              setState(() {
                                _notifications[index]['isRead'] = true;
                              });
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Notification marked as read')),
                              );
                            }
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isRead ? Colors.white : AppColors.primary.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: isRead ? AppColors.borderLight : AppColors.primary.withOpacity(0.2)),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: iconColor.withOpacity(0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(icon, color: iconColor, size: 20),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        notif['title'] ?? '',
                                        style: TextStyle(
                                          fontWeight: isRead ? FontWeight.w600 : FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        notif['message'] ?? '',
                                        style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        _getTimeAgo(notif['createdAt'] ?? ''),
                                        style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                                      ),
                                    ],
                                  ),
                                ),
                                if (!isRead)
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: AppColors.primary,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ).animate().fadeIn(delay: (index * 100).ms).slideY(begin: 0.1);
                      },
                    ),
            ),
    );
  }
}

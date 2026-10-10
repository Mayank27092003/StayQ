import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../services/api/api_client.dart';
import '../../theme/app_colors.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _isLoading = true;
  bool _markingAll = false;
  String? _error;
  List<Map<String, dynamic>> _notifications = [];

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  String _getTimeAgo(String? isoString) {
    if (isoString == null || isoString.isEmpty) return 'Just now';
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

  void _showError(Object error) {
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
  }

  Future<void> _fetchNotifications() async {
    if (mounted) setState(() { _isLoading = true; _error = null; });
    try {
      final data = await ApiClient.instance.get('/notifications');
      if (data is! List) throw ApiException(502, 'Invalid notifications response.');
      if (mounted) setState(() {
        _notifications = data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
      });
    } catch (e) { if (mounted) setState(() => _error = e.toString()); }
    finally { if (mounted) setState(() => _isLoading = false); }
  }

  Future<void> _markAllAsRead() async {
    if (_markingAll) return;
    _markingAll = true;
    try {
      await ApiClient.instance.patch('/notifications/read-all');
      if (!mounted) return;
      setState(() {
        for (final notification in _notifications) {
          notification['readAt'] = DateTime.now().toIso8601String(); notification['isRead'] = true;
        }
      });
    } catch (e) { _showError(e); } finally { _markingAll = false; }
  }

  Future<void> _markSingleAsRead(int index) async {
    if (index >= _notifications.length) return;
    final notification = _notifications[index]; final id = notification['id'];
    if (id == null) return;
    try {
      await ApiClient.instance.patch('/notifications/$id/read');
      if (mounted && _notifications.contains(notification)) setState(() {
        notification['readAt'] = DateTime.now().toIso8601String(); notification['isRead'] = true;
      });
    } catch (e) { _showError(e); }
  }

  (IconData, Color) _getNotificationIcon(String? type) {
    switch (type) {
      case 'BOOKING_CONFIRMED':
      case 'BOOKING':
        return (Icons.check_circle_outline_rounded, const Color(0xFF10B981));
      case 'BOOKING_CANCELLED':
        return (Icons.cancel_outlined, const Color(0xFFEF4444));
      case 'BOOKING_REQUEST':
        return (Icons.event_available_rounded, AppColors.primary);
      case 'PAYMENT_CAPTURED':
        return (Icons.account_balance_wallet_rounded, const Color(0xFF059669));
      case 'PAYOUT_RELEASED':
        return (Icons.payments_rounded, const Color(0xFF2563EB));
      case 'NEW_MESSAGE':
      case 'MESSAGE':
        return (Icons.chat_bubble_outline_rounded, const Color(0xFF3B82F6));
      case 'NEW_REVIEW':
      case 'REVIEW_REMINDER':
        return (Icons.star_outline_rounded, const Color(0xFFF59E0B));
      case 'PRICE_DROP':
      case 'PROMOTION':
      case 'PROMO':
        return (Icons.local_offer_outlined, const Color(0xFFF97316));
      case 'SYSTEM':
      default:
        return (Icons.notifications_none_rounded, AppColors.primary);
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => n['readAt'] == null && n['isRead'] != true).length;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Notifications', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        actions: [
          if (_notifications.isNotEmpty && unreadCount > 0)
            TextButton(
              onPressed: _markAllAsRead,
              child: const Text('Mark all as read', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600)),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              Text(_error!), TextButton(onPressed: _fetchNotifications, child: const Text('Retry'))]))
          : RefreshIndicator(
              onRefresh: _fetchNotifications,
              color: AppColors.primary,
              child: _notifications.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 72,
                            height: 72,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.notifications_off_outlined, color: AppColors.primary, size: 36),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'No notifications yet',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17, color: AppColors.textPrimary),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            "We'll notify you about your bookings, messages, and updates here.",
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      itemCount: _notifications.length,
                      itemBuilder: (context, index) {
                        final notif = _notifications[index];
                        final isRead = notif['readAt'] != null || notif['isRead'] == true;
                        final (icon, iconColor) = _getNotificationIcon(notif['type'] as String?);
                        final title = notif['title'] as String? ?? 'Notification';
                        final body = (notif['body'] ?? notif['message'] ?? '') as String;
                        final timeAgo = _getTimeAgo(notif['createdAt'] as String?);

                        return GestureDetector(
                          onTap: () {
                            if (!isRead) {
                              _markSingleAsRead(index);
                            }
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: isRead ? Colors.white : AppColors.primary.withValues(alpha: 0.04),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isRead ? AppColors.borderLight : AppColors.primary.withValues(alpha: 0.25),
                                width: isRead ? 1 : 1.2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.02),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: iconColor.withValues(alpha: 0.12),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(icon, color: iconColor, size: 20),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        title,
                                        style: TextStyle(
                                          fontWeight: isRead ? FontWeight.w600 : FontWeight.bold,
                                          fontSize: 15,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                      if (body.isNotEmpty) ...[
                                        const SizedBox(height: 4),
                                        Text(
                                          body,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            color: AppColors.textSecondary,
                                            height: 1.3,
                                          ),
                                        ),
                                      ],
                                      const SizedBox(height: 6),
                                      Text(
                                        timeAgo,
                                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                      ),
                                    ],
                                  ),
                                ),
                                if (!isRead)
                                  Container(
                                    margin: const EdgeInsets.only(top: 4, left: 8),
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
                        ).animate().fadeIn(delay: (index * 40).ms).slideY(begin: 0.05);
                      },
                    ),
            ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/empty_state_view.dart';
import '../../providers/app_provider.dart';
import '../../providers/messaging_provider.dart';
import 'chat_detail_screen.dart';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      Provider.of<MessagingProvider>(context, listen: false).fetchConversations();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);

    if (!provider.isLoggedIn || FirebaseAuth.instance.currentUser == null) {
      return Scaffold(
        backgroundColor: AppColors.bg(context),
        appBar: AppBar(
          title: const Text('Inbox', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
        body: SafeArea(
          child: EmptyStateView(
            title: 'Please log in',
            message: 'You need to be logged in to view your messages.',
            buttonText: 'Start Exploring',
            onAction: () {
              context.read<AppProvider>().setTabIndex(0);
            },
          ),
        ),
      );
    }

    final currentUserId = FirebaseAuth.instance.currentUser!.uid;

    return Scaffold(
      backgroundColor: AppColors.bg(context),
      appBar: AppBar(
        title: const Text('Inbox', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SafeArea(
        child: Consumer<MessagingProvider>(
          builder: (context, messaging, child) {
            if (messaging.isLoading && messaging.conversations.isEmpty) {
              return const Center(child: CircularProgressIndicator(color: AppColors.primary));
            }

            if (messaging.error != null && messaging.conversations.isEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline_rounded, size: 48, color: Colors.red),
                      const SizedBox(height: 12),
                      Text(messaging.error!, textAlign: TextAlign.center, style: TextStyle(color: AppColors.text(context))),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => messaging.fetchConversations(),
                        child: const Text('Try Again'),
                      ),
                    ],
                  ),
                ),
              );
            }

            if (messaging.conversations.isEmpty) {
              return EmptyStateView(
                title: 'No new messages',
                message: 'When you contact a host or receive a booking update, your messages will appear here.',
                buttonText: 'Explore Stays',
                onAction: () {
                  context.read<AppProvider>().setTabIndex(0);
                },
              );
            }

            final chats = messaging.conversations;

            return RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async {
                await messaging.fetchConversations();
              },
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                itemCount: chats.length,
                separatorBuilder: (_, _) => Divider(height: 20, color: AppColors.border(context)),
                itemBuilder: (context, index) {
                  final chat = chats[index];
                  final chatId = (chat['id'] ?? chat['_id'] ?? '').toString();
                  
                  // Determine the other user based on host vs guest
                  final isHost = chat['hostId'] == provider.userId || 
                                 chat['hostId'] == currentUserId || 
                                 chat['host']?['firebaseUid'] == currentUserId ||
                                 chat['host']?['id'] == provider.userId;
                  final otherUser = isHost ? chat['guest'] : chat['host'];

                  final otherUserName = otherUser?['displayName'] ?? otherUser?['firstName'] ?? 'Host';
                  final otherUserAvatar = otherUser?['photoUrl'] ?? otherUser?['avatarUrl'] ?? '';
                  
                  // Property associated
                  final property = chat['property'];
                  final stayTitle = property?['title'] ?? (isHost ? 'Guest inquiry' : 'Host message');
                  
                  // Last message
                  final lastMessageArray = chat['messages'] as List?;
                  final lastMessage = (lastMessageArray != null && lastMessageArray.isNotEmpty) 
                      ? (lastMessageArray.first['text'] ?? 'Sent an attachment') 
                      : 'No messages yet';
                  
                  // Unread count sync
                  final unreadCount = int.tryParse(chat['unreadCount']?.toString() ?? '0') ?? 0;
                  final hasUnread = unreadCount > 0;

                  String timeStr = '';
                  if (chat['lastMessageAt'] != null) {
                    final time = DateTime.tryParse(chat['lastMessageAt'].toString());
                    if (time != null) {
                      timeStr = DateFormat('MMM dd, hh:mm a').format(time.toLocal());
                    }
                  }

                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Stack(
                      children: [
                        CircleAvatar(
                          radius: 26,
                          backgroundColor: AppColors.surface(context),
                          backgroundImage: otherUserAvatar.isNotEmpty ? NetworkImage(otherUserAvatar) : null,
                          child: otherUserAvatar.isEmpty
                              ? Icon(Icons.person, color: AppColors.textSub(context))
                              : null,
                        ),
                        if (hasUnread)
                          Positioned(
                            right: 0,
                            top: 0,
                            child: Container(
                              padding: const EdgeInsets.all(5),
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                '$unreadCount',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                    title: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            otherUserName,
                            style: TextStyle(
                              fontWeight: hasUnread ? FontWeight.w900 : FontWeight.bold,
                              fontSize: 15,
                              color: AppColors.text(context),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          timeStr,
                          style: TextStyle(
                            fontSize: 11,
                            color: hasUnread ? AppColors.primary : AppColors.textMuted,
                            fontWeight: hasUnread ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ],
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 2),
                        Text(
                          stayTitle,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          lastMessage,
                          style: TextStyle(
                            fontSize: 13,
                            color: hasUnread ? AppColors.text(context) : AppColors.textSub(context),
                            fontWeight: hasUnread ? FontWeight.w600 : FontWeight.normal,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                    onTap: () {
                      AppMotion.tapSelection();
                      messaging.markConversationAsRead(chatId);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ChatDetailScreen(
                            chatId: chatId,
                            otherUserName: otherUserName,
                            otherUserAvatar: otherUserAvatar,
                            property: property is Map<String, dynamic> ? property : null,
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            );
          },
        ),
      ),
    );
  }
}

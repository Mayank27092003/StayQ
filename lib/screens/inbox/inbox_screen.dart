import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import '../../theme/app_colors.dart';
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
      Provider.of<MessagingProvider>(context, listen: false).fetchConversations();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);

    if (!provider.isLoggedIn || FirebaseAuth.instance.currentUser == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Inbox', style: TextStyle(fontWeight: FontWeight.bold)),
        ),
        body: SafeArea(
          child: EmptyStateView(
            title: 'Please log in',
            message: 'You need to be logged in to view your messages.',
            buttonText: 'Start Exploring',
            onAction: () {
              Navigator.pushNamedAndRemoveUntil(context, '/main', (route) => false);
            },
          ),
        ),
      );
    }

    final currentUserId = FirebaseAuth.instance.currentUser!.uid;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Inbox', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SafeArea(
        child: Consumer<MessagingProvider>(
          builder: (context, messaging, child) {
            if (messaging.isLoading && messaging.conversations.isEmpty) {
              return const Center(child: CircularProgressIndicator());
            }

            if (messaging.error != null) {
              return Center(child: Text(messaging.error!, style: const TextStyle(color: Colors.red)));
            }

            if (messaging.conversations.isEmpty) {
              return EmptyStateView(
                title: 'No new messages',
                message: 'When you contact a host or receive a booking update, your messages will appear here.',
                buttonText: 'Explore Stays',
                onAction: () {
                  Navigator.pushNamedAndRemoveUntil(context, '/main', (route) => false);
                },
              );
            }

            final chats = messaging.conversations;

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: chats.length,
              separatorBuilder: (_, __) => const Divider(height: 20, color: AppColors.borderLight),
              itemBuilder: (context, index) {
                final chat = chats[index];
                final chatId = chat['id'];
                
                // Determine the other user based on host vs guest
                final isHost = chat['hostId'] == currentUserId;
                final otherUser = isHost ? chat['guest'] : chat['host'];
                final otherUserName = otherUser?['displayName'] ?? otherUser?['firstName'] ?? 'User';
                final otherUserAvatar = otherUser?['photoUrl'] ?? otherUser?['avatarUrl'] ?? '';
                
                // For property title, we check if there's an associated property
                final stayTitle = chat['property']?['title'] ?? (isHost ? 'Guest inquiry' : 'Host message');
                
                // Last message
                final lastMessageArray = chat['messages'] as List?;
                final lastMessage = (lastMessageArray != null && lastMessageArray.isNotEmpty) 
                    ? lastMessageArray.first['text'] 
                    : 'No messages yet';
                
                String timeStr = '';
                if (chat['lastMessageAt'] != null) {
                  final time = DateTime.parse(chat['lastMessageAt']);
                  timeStr = DateFormat('MMM dd, hh:mm a').format(time.toLocal());
                }

                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    radius: 26,
                    backgroundImage: otherUserAvatar.isNotEmpty ? NetworkImage(otherUserAvatar) : null,
                    child: otherUserAvatar.isEmpty ? const Icon(Icons.person) : null,
                  ),
                  title: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(otherUserName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      Text(timeStr, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
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
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ChatDetailScreen(
                          chatId: chatId,
                          otherUserName: otherUserName,
                          otherUserAvatar: otherUserAvatar,
                        ),
                      ),
                    );
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../providers/messaging_provider.dart';
import '../../theme/app_colors.dart';
import '../../widgets/bouncing_widget.dart';
import 'package:intl/intl.dart';

class ChatDetailScreen extends StatefulWidget {
  final String chatId;
  final String otherUserName;
  final String otherUserAvatar;

  const ChatDetailScreen({
    super.key,
    required this.chatId,
    required this.otherUserName,
    required this.otherUserAvatar,
  });

  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  bool _sending = false;
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final messaging = Provider.of<MessagingProvider>(context, listen: false);
      messaging.initializeSocket();
      messaging.fetchConversationDetails(widget.chatId);
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    if (_sending) return;
    final text = _messageController.text.trim(); if (text.isEmpty) return;
    _sending = true;
    try {
      await context.read<MessagingProvider>().sendMessage(widget.chatId, text);
      if (!mounted) return;
      if (_messageController.text.trim() == text) _messageController.clear();
      if (_scrollController.hasClients) _scrollController.animateTo(0, curve: Curves.easeOut, duration: const Duration(milliseconds: 300));
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Message was not confirmed: $e'))); }
    finally { _sending = false; }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);

    if (!provider.isLoggedIn || FirebaseAuth.instance.currentUser == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundImage: widget.otherUserAvatar.isNotEmpty ? NetworkImage(widget.otherUserAvatar) : null,
                child: widget.otherUserAvatar.isEmpty ? const Icon(Icons.person, size: 20) : null,
              ),
              const SizedBox(width: 12),
              Text(widget.otherUserName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
        ),
        body: const Center(
          child: Text('Please log in to view this chat', style: TextStyle(color: AppColors.textSecondary, fontSize: 16)),
        ),
      );
    }

    final currentUserId = FirebaseAuth.instance.currentUser!.uid;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundImage: widget.otherUserAvatar.isNotEmpty ? NetworkImage(widget.otherUserAvatar) : null,
              child: widget.otherUserAvatar.isEmpty ? const Icon(Icons.person, size: 20) : null,
            ),
            const SizedBox(width: 12),
            Text(widget.otherUserName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: Consumer<MessagingProvider>(
              builder: (context, messaging, child) {
                if (messaging.isLoading && messaging.currentMessages.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }
                
                if (messaging.currentMessages.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.chat_bubble_outline_rounded, size: 36, color: AppColors.primary),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            'Chat with ${widget.otherUserName}',
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Ask questions about check-in, directions, or amenities before booking.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                          const SizedBox(height: 20),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            alignment: WrapAlignment.center,
                            children: [
                              'Hi! Is early check-in possible?',
                              'What are the check-in timings?',
                              'Is parking available on site?',
                            ].map((prompt) {
                              return ActionChip(
                                label: Text(prompt, style: const TextStyle(fontSize: 12)),
                                backgroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  side: const BorderSide(color: AppColors.borderLight),
                                ),
                                onPressed: () {
                                  _messageController.text = prompt;
                                },
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                // Make sure to reverse messages since ListView is reverse: true
                final messages = messaging.currentMessages.reversed.toList();

                return ListView.builder(
                  reverse: true, // Scroll up to see older messages
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final msg = messages[index];
                    final isMe = msg['senderId'] == currentUserId || msg['senderId'] == provider.userId;
                    
                    String timeStr = '';
                    if (msg['createdAt'] != null) {
                      final time = DateTime.tryParse(msg['createdAt'].toString());
                      if (time != null) timeStr = DateFormat('hh:mm a').format(time.toLocal());
                    }

                    return Align(
                      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        constraints: BoxConstraints(
                          maxWidth: MediaQuery.of(context).size.width * 0.75,
                        ),
                        decoration: BoxDecoration(
                          color: isMe ? AppColors.primary : AppColors.cardBg,
                          borderRadius: BorderRadius.only(
                            topLeft: const Radius.circular(16),
                            topRight: const Radius.circular(16),
                            bottomLeft: Radius.circular(isMe ? 16 : 4),
                            bottomRight: Radius.circular(isMe ? 4 : 16),
                          ),
                          border: isMe ? null : Border.all(color: AppColors.borderLight),
                        ),
                        child: Column(
                          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                          children: [
                            Text(
                              (msg['text'] ?? '').toString(),
                              style: TextStyle(
                                color: isMe ? Colors.white : AppColors.textPrimary,
                                fontSize: 15,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '$timeStr ${msg['deliveryStatus'] == 'failed' ? '• Not sent' : msg['deliveryStatus'] == 'pending' ? '• Sending' : ''}',
                              style: TextStyle(
                                color: isMe ? Colors.white70 : AppColors.textMuted,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
          _buildMessageInput(),
        ],
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.background,
        border: Border(top: BorderSide(color: AppColors.borderLight)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.attach_file_rounded, color: AppColors.textSecondary),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Media & Document attachment opened'),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
            ),
            Expanded(
              child: TextField(
                controller: _messageController,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendMessage(),
                decoration: InputDecoration(
                  hintText: 'Type a message...',
                  hintStyle: const TextStyle(color: AppColors.textMuted),
                  filled: true,
                  fillColor: AppColors.cardBg,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: const BorderSide(color: AppColors.borderLight),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: const BorderSide(color: AppColors.borderLight),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: const BorderSide(color: AppColors.primary),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            BouncingWidget(
              onTap: _sendMessage,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

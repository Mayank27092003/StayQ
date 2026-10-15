import 'dart:io';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/stay_model.dart';
import '../../providers/app_provider.dart';
import '../../providers/messaging_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';
import '../../widgets/media_upload_sheet.dart';
import '../listing/listing_detail_screen.dart';

class ChatDetailScreen extends StatefulWidget {
  final String chatId;
  final String otherUserName;
  final String otherUserAvatar;
  final Map<String, dynamic>? property;

  const ChatDetailScreen({
    super.key,
    required this.chatId,
    required this.otherUserName,
    required this.otherUserAvatar,
    this.property,
  });

  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen> {
  bool _sending = false;
  String? _selectedAttachmentPath;
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final messaging = Provider.of<MessagingProvider>(context, listen: false);
      messaging.initializeSocket();
      messaging.fetchConversationDetails(widget.chatId);
    });

    _focusNode.addListener(() {
      if (_focusNode.hasFocus) {
        Future.delayed(const Duration(milliseconds: 250), () {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              0,
              curve: Curves.easeOut,
              duration: const Duration(milliseconds: 250),
            );
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _pickAttachment() async {
    AppMotion.tapSelection();
    final pickedFiles = await showStayQUploadSheet(
      context,
      title: 'Send Attachment',
      subtitle: 'Choose an image from camera or gallery to send to ${widget.otherUserName}',
      type: MediaUploadType.singleImage,
    );

    if (pickedFiles != null && pickedFiles.isNotEmpty) {
      setState(() {
        _selectedAttachmentPath = pickedFiles.first;
      });
    }
  }

  Future<void> _sendMessage() async {
    if (_sending) return;
    final text = _messageController.text.trim();
    final attachment = _selectedAttachmentPath;
    if (text.isEmpty && attachment == null) return;

    setState(() => _sending = true);
    String? uploadedUrl;

    try {
      if (attachment != null) {
        // Upload attachment to Firebase Storage if available
        try {
          final file = File(attachment);
          if (await file.exists()) {
            final fileName = 'chat_${widget.chatId}_${DateTime.now().millisecondsSinceEpoch}.jpg';
            final ref = FirebaseStorage.instance.ref().child('chats/${widget.chatId}/$fileName');
            final uploadTask = await ref.putFile(file);
            uploadedUrl = await uploadTask.ref.getDownloadURL();
          }
        } catch (_) {
          // If storage is unavailable or simulated, use the local path as attachment reference
          uploadedUrl = attachment;
        }
      }

      if (!mounted) return;
      await context.read<MessagingProvider>().sendMessage(
        widget.chatId,
        text.isNotEmpty ? text : 'Photo',
        imageUrl: uploadedUrl,
      );

      if (!mounted) return;
      _messageController.clear();
      setState(() {
        _selectedAttachmentPath = null;
      });
      if (_scrollController.hasClients) {
        _scrollController.animateTo(0, curve: Curves.easeOut, duration: const Duration(milliseconds: 300));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Message was not confirmed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Widget _buildPreBookingPropertyHeader(BuildContext context) {
    if (widget.property == null) return const SizedBox.shrink();
    final prop = widget.property!;
    final title = (prop['title'] ?? prop['propertyTitle'] ?? 'Featured Stay').toString();
    final city = (prop['city'] ?? prop['location'] ?? prop['propertyCity'] ?? '').toString();
    final price = prop['nightlyRate'] ?? prop['pricePerNight'];
    final image = (prop['propertyImage'] ?? prop['image'] ?? '').toString();

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.card(context),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border(context)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: AppColors.isDark(context) ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: image.isNotEmpty && image.startsWith('http')
                ? Image.network(
                    image,
                    width: 50,
                    height: 50,
                    fit: BoxFit.cover,
                    errorBuilder: (_, _, _) => Container(
                      width: 50,
                      height: 50,
                      color: AppColors.surface(context),
                      child: const Icon(Icons.holiday_village_rounded, color: AppColors.primary, size: 24),
                    ),
                  )
                : Container(
                    width: 50,
                    height: 50,
                    color: AppColors.surface(context),
                    child: const Icon(Icons.holiday_village_rounded, color: AppColors.primary, size: 24),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text(context),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  city.isNotEmpty ? city : 'Inquiry Property',
                  style: TextStyle(fontSize: 11.5, color: AppColors.textSub(context)),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (price != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    '₹$price / night',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primary),
                  ),
                ],
              ],
            ),
          ),
          TextButton(
            onPressed: () {
              AppMotion.tapSelection();
              final stay = StayModel.fromJson(widget.property!);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => ListingDetailScreen(stay: stay)),
              );
            },
            child: const Text('View Stay', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
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
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.text(context)),
            ),
            const SizedBox(height: 6),
            Text(
              'Ask questions about check-in, directions, or amenities before booking.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.textSub(context)),
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
                'Are pets allowed on the property?',
              ].map((prompt) {
                return ActionChip(
                  label: Text(prompt, style: TextStyle(fontSize: 12, color: AppColors.text(context))),
                  backgroundColor: AppColors.card(context),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: AppColors.border(context)),
                  ),
                  onPressed: () {
                    AppMotion.tapSelection();
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

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);

    if (!provider.isLoggedIn || FirebaseAuth.instance.currentUser == null) {
      return Scaffold(
        backgroundColor: AppColors.bg(context),
        appBar: AppBar(
          title: Text(widget.otherUserName, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.text(context))),
        ),
        body: Center(
          child: Text('Please log in to view this chat', style: TextStyle(color: AppColors.textSub(context), fontSize: 16)),
        ),
      );
    }

    final currentUserId = FirebaseAuth.instance.currentUser!.uid;

    return Scaffold(
      backgroundColor: AppColors.bg(context),
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              radius: 17,
              backgroundColor: AppColors.surface(context),
              backgroundImage: widget.otherUserAvatar.isNotEmpty ? NetworkImage(widget.otherUserAvatar) : null,
              child: widget.otherUserAvatar.isEmpty ? Icon(Icons.person, size: 20, color: AppColors.textSub(context)) : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    widget.otherUserName,
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15.5, color: AppColors.text(context)),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const Text('Active on StayQ', style: TextStyle(fontSize: 11, color: AppColors.successGreen)),
                ],
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Pre-booking inquiry property card
            _buildPreBookingPropertyHeader(context),

            // Messages Stream
            Expanded(
              child: Consumer<MessagingProvider>(
                builder: (context, messaging, child) {
                  if (messaging.isLoading && messaging.currentMessages.isEmpty) {
                    return const Center(child: CircularProgressIndicator(color: AppColors.primary));
                  }

                  if (messaging.currentMessages.isEmpty) {
                    return _buildEmptyState();
                  }

                  final messages = messaging.currentMessages.reversed.toList();

                  return ListView.builder(
                    reverse: true,
                    controller: _scrollController,
                    keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final msg = messages[index];
                      final isMe = msg['senderId'] == currentUserId || msg['senderId'] == provider.userId;
                      final imageUrl = msg['imageUrl']?.toString();
                      final hasImage = imageUrl != null && imageUrl.isNotEmpty;

                      String timeStr = '';
                      if (msg['createdAt'] != null) {
                        final time = DateTime.tryParse(msg['createdAt'].toString());
                        if (time != null) timeStr = DateFormat('hh:mm a').format(time.toLocal());
                      }

                      return Align(
                        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          constraints: BoxConstraints(
                            maxWidth: MediaQuery.of(context).size.width * 0.78,
                          ),
                          decoration: BoxDecoration(
                            color: isMe ? AppColors.primary : AppColors.card(context),
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(16),
                              topRight: const Radius.circular(16),
                              bottomLeft: Radius.circular(isMe ? 16 : 4),
                              bottomRight: Radius.circular(isMe ? 4 : 16),
                            ),
                            border: isMe ? null : Border.all(color: AppColors.border(context)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: AppColors.isDark(context) ? 0.2 : 0.04),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              if (hasImage) ...[
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: imageUrl.startsWith('http')
                                      ? Image.network(
                                          imageUrl,
                                          width: 220,
                                          height: 160,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, _, _) => Container(
                                            width: 220,
                                            height: 120,
                                            color: Colors.black12,
                                            child: const Icon(Icons.broken_image_rounded, size: 40),
                                          ),
                                        )
                                      : Image.file(
                                          File(imageUrl),
                                          width: 220,
                                          height: 160,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, _, _) => Container(
                                            width: 220,
                                            height: 120,
                                            color: Colors.black12,
                                            child: const Icon(Icons.broken_image_rounded, size: 40),
                                          ),
                                        ),
                                ),
                                const SizedBox(height: 6),
                              ],
                              if ((msg['text'] ?? '').toString().isNotEmpty && (msg['text'] != 'Photo' || !hasImage))
                                Align(
                                  alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                                  child: Text(
                                    (msg['text'] ?? '').toString(),
                                    style: TextStyle(
                                      color: isMe ? Colors.white : AppColors.text(context),
                                      fontSize: 14.5,
                                      height: 1.35,
                                    ),
                                  ),
                                ),
                              const SizedBox(height: 4),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    timeStr,
                                    style: TextStyle(
                                      color: isMe ? Colors.white70 : AppColors.textMuted,
                                      fontSize: 10.5,
                                    ),
                                  ),
                                  if (isMe) ...[
                                    const SizedBox(width: 4),
                                    Icon(
                                      msg['deliveryStatus'] == 'pending'
                                          ? Icons.access_time_rounded
                                          : msg['deliveryStatus'] == 'failed'
                                              ? Icons.error_outline_rounded
                                              : Icons.done_all_rounded,
                                      size: 13,
                                      color: Colors.white70,
                                    ),
                                  ],
                                ],
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

            // Attachment Preview Bar if image picked
            if (_selectedAttachmentPath != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.surface(context),
                  border: Border(top: BorderSide(color: AppColors.border(context))),
                ),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.file(
                        File(_selectedAttachmentPath!),
                        width: 50,
                        height: 50,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Attached Photo',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.text(context)),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Colors.red, size: 20),
                      onPressed: () {
                        setState(() => _selectedAttachmentPath = null);
                      },
                    ),
                  ],
                ),
              ),

            // Input Field Bar
            _buildMessageInput(),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.card(context),
        border: Border(top: BorderSide(color: AppColors.border(context))),
      ),
      child: Row(
        children: [
          IconButton(
            icon: Icon(Icons.photo_camera_rounded, color: AppColors.textSub(context)),
            tooltip: 'Attach Photo',
            onPressed: _pickAttachment,
          ),
          Expanded(
            child: TextField(
              controller: _messageController,
              focusNode: _focusNode,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _sendMessage(),
              style: TextStyle(color: AppColors.text(context)),
              decoration: InputDecoration(
                hintText: _selectedAttachmentPath != null ? 'Add a caption...' : 'Type a message...',
                hintStyle: const TextStyle(color: AppColors.textMuted),
                filled: true,
                fillColor: AppColors.surface(context),
                contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide(color: AppColors.border(context)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide(color: AppColors.border(context)),
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
              child: _sending
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Icon(Icons.send_rounded, color: Colors.white, size: 18),
            ),
          ),
        ],
      ),
    );
  }
}

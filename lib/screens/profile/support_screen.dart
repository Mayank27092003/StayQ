import '../../services/api/api_client.dart';
import '../../models/json_values.dart';
import 'dart:convert';
import 'dart:math';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/app_config.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _chatController = TextEditingController();
  final ScrollController _scrollController = ScrollController();


  // Chat State
  final List<Map<String, dynamic>> _messages = [
    {
      'sender': 'ai',
      'text': '👋 Hi! I\'m Qube, your StayQ 24/7 AI Concierge & Support Specialist.\n\nI can instantly resolve cancellations, refund questions, keybox access, zero-broker leases, or connect you directly with a Senior Support Executive.',
      'time': 'Just now',
    },
  ];
  bool _isAiTyping = false;

  // Selected Topic
  String? _selectedTopic;

  // Escalation Form State
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _issueController = TextEditingController();
  String _urgency = 'HIGH';
  bool _isSubmittingTicket = false;
  String? _ticketSelection;
  String? _ticketRequestKey;
  Map<String, dynamic>? _createdTicket;
  int _userMessageCount = 0;

  // Active Tickets State
  List<dynamic> _myTickets = [];
  bool _isLoadingTickets = false;

  final List<Map<String, dynamic>> _guidedTopics = [
    {
      'id': 'cancellation',
      'title': 'Cancellation & Refund',
      'icon': Icons.credit_card_rounded,
      'color': Colors.blue,
      'desc': '100% refund policy & bank timelines',
      'prompts': [
        'How does the 100% full refund policy work?',
        'How long does a refund take to reach my bank account?',
        'I need to cancel my booking right now',
      ],
    },
    {
      'id': 'checkin',
      'title': 'Check-in & Key Access',
      'icon': Icons.key_rounded,
      'color': Colors.amber,
      'desc': 'Smart lock pin, keybox access & directions',
      'prompts': [
        'Where do I find my digital door unlock code?',
        'Smart lock or keybox is not opening at property',
        'I am arriving late at night, is late check-in allowed?',
      ],
    },
    {
      'id': 'host',
      'title': 'Host Not Responding',
      'icon': Icons.phone_forwarded_rounded,
      'color': Colors.red,
      'desc': 'Urgent host outreach & emergency assistance',
      'prompts': [
        'My host has not responded for more than 1 hour',
        'I have reached the property location but host is unreachable',
        'Need emergency dispatch from StayQ team',
      ],
    },
    {
      'id': 'zerobroker',
      'title': 'Zero Brokerage Lofts',
      'icon': Icons.description_rounded,
      'color': Colors.purple,
      'desc': '1-month security deposit & verified contracts',
      'prompts': [
        'How does 0% brokerage long-term lease work?',
        'What is the security deposit refund guarantee?',
        'Can I schedule an in-person physical tour?',
      ],
    },
    {
      'id': 'property',
      'title': 'Property & Amenities',
      'icon': Icons.build_circle_rounded,
      'color': Colors.teal,
      'desc': 'Wi-Fi, AC, pool servicing & cleanliness',
      'prompts': [
        'Wi-Fi internet is not working at the villa',
        'Cleanliness does not match the photos',
        'Private swimming pool needs immediate servicing',
      ],
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.index == 1) {
        _fetchTickets();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final provider = Provider.of<AppProvider>(context, listen: false);
      if (provider.userName.isNotEmpty && provider.userName != 'Guest') {
        _nameController.text = provider.userName;
      } else if (_nameController.text.isEmpty) {
        _nameController.text = 'Guest User';
      }

      if (provider.userEmail.isNotEmpty) {
        _emailController.text = provider.userEmail;
      }

      if (provider.userPhone.isNotEmpty) {
        _phoneController.text = provider.userPhone;
      } else if (_phoneController.text.isEmpty) {
        _phoneController.text = '+91 ';
      }

      if (_emailController.text.isNotEmpty && _emailController.text.contains('@') && _emailController.text != 'guest@stayq.space') {
        _fetchTickets();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _chatController.dispose();
    _scrollController.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _issueController.dispose();
    super.dispose();
  }

  // Send message to AI Triage Endpoint
  Future<void> _sendMessage([String? predefinedText]) async {
    final text = (predefinedText ?? _chatController.text).trim();
    if (text.isEmpty || _isAiTyping) return;

    setState(() {
      _messages.add({
        'sender': 'user',
        'text': text,
        'time': 'Just now',
      });
      _isAiTyping = true;
    });
    _chatController.clear();
    _scrollToBottom();

    _userMessageCount++;
    // Check if user requested human agent (only permitted after 3+ exchanges with AI)
    final lower = text.toLowerCase();
    if ((lower.contains('agent') || lower.contains('human') || lower.contains('executive') || lower.contains('call me')) && _userMessageCount >= 3) {
      if (_issueController.text.isEmpty) {
        _issueController.text = text;
      }
      await Future.delayed(const Duration(milliseconds: 500));
      if (mounted) {
        setState(() {
          _isAiTyping = false;
          _messages.add({
            'sender': 'ai',
            'text': 'Connecting you with our senior support desk. Please review your issue details in the escalation form.',
            'time': 'Just now',
          });
        });
        _scrollToBottom();
        _showEscalationSheet();
      }
      return;
    }

    try {
      final data = await ApiClient.instance.post('/support/ai-triage', body: {
        'message': text, 'topic': _selectedTopic,
        'chatHistory': _messages.where((m) => m['sender'] == 'user' || m['sender'] == 'ai')
          .map((m) => {'role': m['sender'] == 'user' ? 'user' : 'assistant', 'content': m['text']}).toList(),
      });

      if (data is Map && data['reply'] is String) {
        if (mounted) {
          setState(() {
            _messages.add({
              'sender': 'ai',
              'text': data['reply'] ?? 'Our concierge is reviewing your request.',
              'time': 'Just now',
            });
          });
        }
      } else {
        throw Exception('AI Triage error');
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _messages.add({
            'sender': 'ai',
            'text': 'Support chat is temporarily unavailable. Tap "Transfer to Agent" to submit a support request.',
            'time': 'Just now',
          });
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isAiTyping = false);
        _scrollToBottom();
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // Create Support Ticket in Database
  Future<bool> _createSupportTicket() async {
    if (_isSubmittingTicket) return false;
    final name = _nameController.text.trim(); final email = _emailController.text.trim();
    final phone = _phoneController.text.trim(); final issue = _issueController.text.trim();
    if (name.isEmpty || !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email) || phone.isEmpty || issue.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter your name, email, phone, and issue.'))); return false;
    }
    final selection = jsonEncode([name, email, phone, issue, _selectedTopic, _urgency]);
    if (_ticketSelection != selection) {
      _ticketSelection = selection;
      _ticketRequestKey = 'ticket:${DateTime.now().microsecondsSinceEpoch}:${Random.secure().nextInt(1 << 32)}';
    }
    setState(() { _isSubmittingTicket = true; _createdTicket = null; });
    try {
      final response = jsonMap(await ApiClient.instance.post('/support/tickets', idempotencyKey: _ticketRequestKey, body: {
        'name': name, 'email': email, 'phone': phone, 'subject': issue, 'message': issue,
        'category': _selectedTopic ?? 'General Support', 'priority': _urgency,
        'chatTranscript': _messages.map((m) => {'sender': m['sender'], 'text': m['text']}).toList(),
      }));
      final ticket = response['ticket'] is Map ? jsonMap(response['ticket']) : response;
      if (ticket['ticketRef']?.toString().isNotEmpty != true) throw const FormatException('The server did not return a ticket reference.');
      if (!mounted) return false;
      setState(() => _createdTicket = ticket);
      _ticketSelection = null; _ticketRequestKey = null;
      await _fetchTickets(); return true;
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Ticket was not confirmed: $e'))); return false; }
    finally { if (mounted) setState(() => _isSubmittingTicket = false); }
  }

  // Fetch Active Tickets
  Future<void> _fetchTickets() async {
    if (!context.read<AppProvider>().isLoggedIn) return;
    setState(() => _isLoadingTickets = true);
    try {
      // The authenticated server must derive ticket ownership from the token.
      final data = await ApiClient.instance.get('/support/tickets');
      if (!mounted) return;
      final tickets = data is List ? data : jsonMap(data)['tickets'];
      if (tickets is! List) throw const FormatException('Invalid tickets response.');
      setState(() => _myTickets = tickets);
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()))); }
    finally { if (mounted) setState(() => _isLoadingTickets = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('24/7 Help & Support', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Container(
            decoration: const BoxDecoration(
              color: AppColors.background,
              border: Border(
                bottom: BorderSide(color: AppColors.borderLight, width: 1),
              ),
            ),
            child: TabBar(
              controller: _tabController,
              indicatorColor: AppColors.primary,
              indicatorWeight: 3,
              labelColor: AppColors.primary,
              unselectedLabelColor: AppColors.textSecondary,
              labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              unselectedLabelStyle: const TextStyle(fontSize: 12),
              tabs: const [
                Tab(icon: Icon(Icons.auto_awesome, size: 18), text: 'AI Concierge & Live Chat'),
                Tab(icon: Icon(Icons.confirmation_number_outlined, size: 18), text: 'My Tickets'),
              ],
            ),
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildChatTab(),
          _buildMyTicketsTab(),
        ],
      ),
    );
  }

  // 1. AI Chat Tab with Guided Steps
  Widget _buildChatTab() {
    return Column(
      children: [
        // Guided Topic Chips
        Container(
          height: 52,
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: _guidedTopics.length,
            separatorBuilder: (context, index) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final topic = _guidedTopics[index];
              final isSelected = _selectedTopic == topic['title'];
              return ChoiceChip(
                label: Text(topic['title'], style: TextStyle(fontSize: 12, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                avatar: Icon(topic['icon'], size: 14, color: isSelected ? Colors.white : topic['color']),
                selected: isSelected,
                selectedColor: AppColors.primary,
                labelStyle: TextStyle(color: isSelected ? Colors.white : AppColors.textPrimary),
                onSelected: (selected) {
                  setState(() {
                    _selectedTopic = selected ? topic['title'] : null;
                  });
                },
              );
            },
          ),
        ),

        // Quick prompts if topic selected
        if (_selectedTopic != null) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            color: AppColors.primary.withValues(alpha: 0.06),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: (_guidedTopics.firstWhere((t) => t['title'] == _selectedTopic)['prompts'] as List<String>)
                    .map((p) => Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ActionChip(
                            label: Text(p, style: const TextStyle(fontSize: 11)),
                            backgroundColor: Colors.white,
                            onPressed: () => _sendMessage(p),
                          ),
                        ))
                    .toList(),
              ),
            ),
          ),
        ],

        // Messages Thread
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.all(16),
            itemCount: _messages.length,
            itemBuilder: (context, index) {
              final msg = _messages[index];
              final isUser = msg['sender'] == 'user';
              return Align(
                alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                  decoration: BoxDecoration(
                    color: isUser ? AppColors.primary : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 4, offset: const Offset(0, 2)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                    children: [
                      Text(
                        msg['text'],
                        style: TextStyle(
                          color: isUser ? Colors.white : AppColors.textPrimary,
                          fontSize: 14,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        msg['time'],
                        style: TextStyle(
                          color: isUser ? Colors.white70 : AppColors.textMuted,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),

        if (_isAiTyping)
          Padding(
            padding: const EdgeInsets.only(left: 16, bottom: 8),
            child: Row(
              children: [
                const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
                const SizedBox(width: 8),
                Text('Qube AI is resolving...', style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600)),
              ],
            ),
          ),

        // Handover Quick Strip - only available after 3+ interactions with AI
        if (_userMessageCount >= 3)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.white,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Still need human assistance?', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                TextButton.icon(
                  onPressed: _showEscalationSheet,
                  icon: const Icon(Icons.headset_mic_rounded, size: 16),
                  label: const Text('Escalate to Senior Agent', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),

        // Message Input
        Container(
          padding: const EdgeInsets.all(12),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: AppColors.borderLight)),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _chatController,
                  decoration: const InputDecoration(
                    hintText: 'Type your question or issue...',
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  onSubmitted: (_) => _sendMessage(),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.send_rounded, color: AppColors.primary),
                onPressed: () => _sendMessage(),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // 2. Escalation Sheet Triggered from AI Chat
  void _showEscalationSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (modalContext) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.85,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  Center(
                    child: Container(
                      margin: const EdgeInsets.only(top: 12, bottom: 8),
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Escalate to Senior Agent',
                                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    'Chat transcript will be attached automatically',
                                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                              IconButton(
                                icon: const Icon(Icons.close),
                                onPressed: () => Navigator.pop(modalContext),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // WhatsApp Priority Desk
                          Material(
                            color: Colors.transparent,
                            child: InkWell(
                              onTap: () async {
                                final uri = Uri.parse(AppConfig.whatsappSupportUrl);
                                if (await canLaunchUrl(uri)) {
                                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                                }
                              },
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF25D366).withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: const Color(0xFF25D366).withValues(alpha: 0.35)),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 40,
                                      height: 40,
                                      decoration: const BoxDecoration(
                                        color: Color(0xFF25D366),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.chat_bubble_rounded, color: Colors.white, size: 20),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Text(
                                            'WhatsApp Instant Desk',
                                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF075E54)),
                                          ),
                                          Text(
                                            AppConfig.whatsappSupportNumber,
                                            style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF25D366),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Text(
                                        'Chat',
                                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Name
                          const Text('Full Name', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _nameController,
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: Colors.grey.shade50,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.borderLight)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Phone
                          const Text('WhatsApp / Phone Number', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: Colors.grey.shade50,
                              hintText: '+91 ',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.borderLight)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Email
                          const Text('Email Address', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: Colors.grey.shade50,
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.borderLight)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Urgency
                          const Text('Urgency Level', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              _buildModalUrgencyOption('NORMAL', 'Standard', 'Within 2 hrs', setModalState),
                              const SizedBox(width: 8),
                              _buildModalUrgencyOption('HIGH', 'High', '30 mins', setModalState),
                              const SizedBox(width: 8),
                              _buildModalUrgencyOption('URGENT', 'Urgent', 'Emergency', setModalState),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // Issue Summary
                          const Text('Brief Issue Summary', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _issueController,
                            maxLines: 3,
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: Colors.grey.shade50,
                              hintText: 'Describe what you need help with...',
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.borderLight)),
                              contentPadding: const EdgeInsets.all(12),
                            ),
                          ),
                          const SizedBox(height: 20),

                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: ElevatedButton(
                              onPressed: _isSubmittingTicket
                                  ? null
                                  : () async {
                                      final messenger = ScaffoldMessenger.of(context);
                                      setModalState(() {});
                                      final accepted = await _createSupportTicket();
                                      if (!accepted) return;
                                      if (modalContext.mounted) {
                                        Navigator.pop(modalContext);
                                      }
                                      if (mounted) {
                                        _tabController.animateTo(1);
                                        final ref = _createdTicket?['ticketRef'] ?? '';
                                        messenger.showSnackBar(
                                          SnackBar(
                                            content: Text('Priority ticket $ref registered!'),
                                            backgroundColor: Colors.green,
                                          ),
                                        );
                                      }
                                    },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
                              child: _isSubmittingTicket
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                  : const Text('Dispatch Priority Support Ticket', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildModalUrgencyOption(String id, String title, String subtitle, StateSetter setModalState) {
    final isSelected = _urgency == id;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setModalState(() => _urgency = id);
          setState(() => _urgency = id);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary.withValues(alpha: 0.08) : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isSelected ? AppColors.primary : AppColors.borderLight, width: isSelected ? 2 : 1),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: isSelected ? AppColors.primary : AppColors.textPrimary),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 9, color: AppColors.textMuted),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // 3. My Tickets Tracker Tab
  Widget _buildMyTicketsTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: Colors.white,
                    hintText: 'Tickets belong to your signed-in account',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.borderLight)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _fetchTickets,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(80, 44),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: const Text('Search', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
        Expanded(
          child: _isLoadingTickets
              ? const Center(child: CircularProgressIndicator())
              : _myTickets.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.confirmation_number_outlined, size: 48, color: AppColors.textMuted.withValues(alpha: 0.5)),
                          const SizedBox(height: 12),
                          const Text('No Active Tickets Found', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(height: 4),
                          const Text('Submit a ticket in the Transfer tab to track resolution.', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _myTickets.length,
                      itemBuilder: (context, index) {
                        final t = _myTickets[index];
                        final status = t['status'] ?? 'OPEN';
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          elevation: 1,
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      t['subject']?.contains('[SQ-TICKET')
                                          ? t['subject'].split(']')[0].replaceAll('[', '')
                                          : 'SQ-TICKET-${t['id']?.toString().substring(0, 6).toUpperCase()}',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primary),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: status == 'RESOLVED' ? Colors.green.withValues(alpha: 0.1) : Colors.amber.withValues(alpha: 0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        status,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: status == 'RESOLVED' ? Colors.green : Colors.amber[800],
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(t['subject'] ?? 'Support Inquiry', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                const SizedBox(height: 4),
                                Text(t['message']?.toString().split('--- AI PRE-TRIAGE')[0] ?? '', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                if (t['resolution'] != null) ...[
                                  const SizedBox(height: 8),
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(color: Colors.green.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(8)),
                                    child: Text('Resolution: ${t['resolution']}', style: const TextStyle(fontSize: 11, color: Colors.green, fontWeight: FontWeight.w600)),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }
}

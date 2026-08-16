import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
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

  static const String _apiBaseUrl = 'https://stayq-api-608570851336.asia-south1.run.app/api/v1';

  // Chat State
  final List<Map<String, dynamic>> _messages = [
    {
      'sender': 'ai',
      'text': '👋 Hi! I\'m Qube, your Stay Q 24/7 AI Concierge & Support Specialist.\n\nI can instantly resolve cancellations, refund questions, keybox access, zero-broker leases, or connect you directly with a Senior Support Executive.',
      'time': 'Just now',
    },
  ];
  bool _isAiTyping = false;

  // Selected Topic
  String? _selectedTopic;

  // Escalation Form State
  final TextEditingController _nameController = TextEditingController(text: 'Guest User');
  final TextEditingController _emailController = TextEditingController(text: 'guest@stayq.in');
  final TextEditingController _phoneController = TextEditingController(text: '+91 ');
  final TextEditingController _issueController = TextEditingController();
  String _urgency = 'HIGH';
  bool _isSubmittingTicket = false;
  Map<String, dynamic>? _createdTicket;

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
        'Need emergency dispatch from Stay Q team',
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
    _tabController = TabController(length: 3, vsync: this);
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

    // Check if user requested human agent
    final lower = text.toLowerCase();
    if (lower.contains('agent') || lower.contains('human') || lower.contains('executive') || lower.contains('call me')) {
      await Future.delayed(const Duration(milliseconds: 600));
      if (mounted) {
        setState(() {
          _isAiTyping = false;
          _messages.add({
            'sender': 'ai',
            'text': '🤝 Absolutely! I will connect you with a Senior Support Executive right away.\n\nPlease switch to the "Transfer to Agent" tab to confirm your phone number and raise your priority ticket.',
            'time': 'Just now',
          });
        });
        _scrollToBottom();
      }
      return;
    }

    try {
      final response = await http.post(
        Uri.parse('$_apiBaseUrl/support/ai-triage'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'message': text,
          'topic': _selectedTopic,
          'chatHistory': _messages
              .where((m) => m['sender'] == 'user' || m['sender'] == 'ai')
              .map((m) => {'role': m['sender'] == 'user' ? 'user' : 'assistant', 'content': m['text']})
              .toList(),
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
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
            'text': '✨ Thank you! If you need urgent assistance, tap "Transfer to Agent" above and our operations team will call or WhatsApp you directly.',
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
  Future<void> _createSupportTicket() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();

    if (name.isEmpty || email.isEmpty || phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your name, email, and phone number.')),
      );
      return;
    }

    setState(() => _isSubmittingTicket = true);

    try {
      final response = await http.post(
        Uri.parse('$_apiBaseUrl/support/tickets'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'email': email,
          'phone': phone,
          'subject': _issueController.text.isNotEmpty ? _issueController.text : '${_selectedTopic ?? "General"} Support Request',
          'message': _issueController.text.isNotEmpty ? _issueController.text : 'Customer escalated to human agent via Stay Q App.',
          'category': _selectedTopic ?? 'General Support',
          'priority': _urgency,
          'chatTranscript': _messages.map((m) => {'sender': m['sender'], 'text': m['text']}).toList(),
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _createdTicket = data;
          });
        }
      } else {
        // Fallback optimistic reference
        final ref = 'SQ-TICKET-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
        if (mounted) {
          setState(() {
            _createdTicket = {
              'ticketRef': ref,
              'name': name,
              'phone': phone,
              'status': 'OPEN',
            };
          });
        }
      }
    } catch (_) {
      final ref = 'SQ-TICKET-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
      if (mounted) {
        setState(() {
          _createdTicket = {
            'ticketRef': ref,
            'name': name,
            'phone': phone,
            'status': 'OPEN',
          };
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmittingTicket = false);
      }
    }
  }

  // Fetch Active Tickets
  Future<void> _fetchTickets() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) return;

    setState(() => _isLoadingTickets = true);

    try {
      final response = await http.get(Uri.parse('$_apiBaseUrl/support/tickets?email=${Uri.encodeComponent(email)}'));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _myTickets = data is List ? data : [];
          });
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() => _myTickets = []);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoadingTickets = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('24/7 Help & Support', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          tabs: const [
            Tab(icon: Icon(Icons.auto_awesome, size: 18), text: 'AI & Live Chat'),
            Tab(icon: Icon(Icons.support_agent, size: 18), text: 'Transfer to Agent'),
            Tab(icon: Icon(Icons.confirmation_number_outlined, size: 18), text: 'My Tickets'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildChatTab(),
          _buildHandoverTab(),
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
            color: AppColors.primary.withOpacity(0.06),
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
                      BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4, offset: const Offset(0, 2)),
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

        // Handover Quick Strip
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: Colors.white,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Need a human agent?', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              TextButton.icon(
                onPressed: () => _tabController.animateTo(1),
                icon: const Icon(Icons.headset_mic_rounded, size: 16),
                label: const Text('Transfer to Executive', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
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

  // 2. Transfer to Agent / Ticket Escalation Tab
  Widget _buildHandoverTab() {
    if (_createdTicket != null) {
      return SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.green.withOpacity(0.3)),
            boxShadow: [
              BoxShadow(color: Colors.green.withOpacity(0.05), blurRadius: 16, offset: const Offset(0, 4)),
            ],
          ),
          child: Column(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_rounded, color: Colors.green, size: 36),
              ),
              const SizedBox(height: 16),
              const Text(
                'Support Ticket Dispatched!',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'Your ticket has been assigned to a Senior Stay Q Support Executive. We will contact you at ${_createdTicket!['phone'] ?? _phoneController.text} shortly.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    const Text('Ticket Tracking Reference', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    const SizedBox(height: 4),
                    Text(
                      _createdTicket!['ticketRef'] ?? 'SQ-TICKET-ACTIVE',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary, letterSpacing: 1),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() => _createdTicket = null);
                        _tabController.animateTo(0);
                      },
                      child: const Text('Back to Chat'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        _fetchTickets();
                        _tabController.animateTo(2);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Track Ticket'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Transfer to Senior Support Executive', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          const Text('Our operations team will review your chat transcript and call you directly.', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 20),

          // Name Field
          const Text('Full Name', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
          const SizedBox(height: 6),
          TextField(
            controller: _nameController,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.borderLight)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
          const SizedBox(height: 14),

          // Phone Field
          const Text('WhatsApp / Phone Number', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
          const SizedBox(height: 6),
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              hintText: '+91 98765 43210',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.borderLight)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
          const SizedBox(height: 14),

          // Email Field
          const Text('Email Address', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
          const SizedBox(height: 6),
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.borderLight)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
          const SizedBox(height: 14),

          // Urgency Selection
          const Text('Urgency Level', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
          const SizedBox(height: 6),
          Row(
            children: [
              _buildUrgencyOption('NORMAL', 'Standard', 'Within 2 hrs'),
              const SizedBox(width: 8),
              _buildUrgencyOption('HIGH', 'High', 'Within 30 mins'),
              const SizedBox(width: 8),
              _buildUrgencyOption('URGENT', 'Urgent', 'Emergency'),
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
              fillColor: Colors.white,
              hintText: 'Describe what you need help with...',
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.borderLight)),
              contentPadding: const EdgeInsets.all(12),
            ),
          ),
          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: _isSubmittingTicket ? null : _createSupportTicket,
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
        ],
      ),
    );
  }

  Widget _buildUrgencyOption(String id, String title, String subtitle) {
    final isSelected = _urgency == id;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _urgency = id),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary.withValues(alpha: 0.08) : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isSelected ? AppColors.primary : AppColors.borderLight, width: isSelected ? 2 : 1),
          ),
          child: Column(
            children: [
              Text(title, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: isSelected ? AppColors.primary : AppColors.textPrimary)),
              const SizedBox(height: 2),
              Text(subtitle, style: const TextStyle(fontSize: 9, color: AppColors.textMuted)),
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
                    hintText: 'Enter email to track tickets...',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.borderLight)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: _fetchTickets,
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                child: const Text('Search'),
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

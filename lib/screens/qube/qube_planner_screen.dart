import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../models/stay_model.dart';
import '../../providers/app_provider.dart';
import '../../services/qube_api_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/qube_robot_avatar.dart';
import '../../widgets/stay_card.dart';
import '../listing/listing_detail_screen.dart';

class QubeMessage {
  final String text;
  final bool isUser;
  final Map<String, dynamic>? planData;
  final DateTime timestamp;

  QubeMessage({
    required this.text,
    required this.isUser,
    this.planData,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
}

enum QubeMode {
  chat, // Conversational AI concierge
  itinerary, // Structured day-by-day travel plan
}

class QubePlannerScreen extends StatefulWidget {
  final String? initialPrompt;

  const QubePlannerScreen({super.key, this.initialPrompt});

  @override
  State<QubePlannerScreen> createState() => _QubePlannerScreenState();
}

class _QubePlannerScreenState extends State<QubePlannerScreen> with TickerProviderStateMixin {
  final TextEditingController _promptController = TextEditingController();
  final List<QubeMessage> _messages = [];
  bool _isLoading = false;
  QubeMode _currentMode = QubeMode.chat;
  final ScrollController _scrollController = ScrollController();

  // Budget slider state for itinerary planning
  double _budget = 25000;
  bool _showBudgetSlider = false;

  // Typing dots animation
  late AnimationController _dotsController;
  late Animation<double> _dotsAnimation;

  static String _getRandomGreeting([String? userName]) {
    final now = DateTime.now();
    final hour = now.hour;
    final timeGreeting = hour < 12
        ? "Good morning"
        : hour < 17
            ? "Good afternoon"
            : hour < 21
                ? "Good evening"
                : "Hey night owl";

    final nameStr = (userName != null && userName.trim().isNotEmpty && userName.toLowerCase() != 'guest')
        ? ", ${userName.trim().split(' ').first}"
        : "";

    final pools = [
      // 🌿 Nature & Scenic Escapes
      "$timeGreeting$nameStr! I'm Qube 🌿\n\nCraving fresh air and tranquility? From A-frame cabins in misty Manali to coffee-estate treehouses in Wayanad and riverside chalets — tell me your nature vibe and I'll find your dream stay!",

      // 🌴 Private Pool & Beachfront Villas
      "Hey$nameStr! Qube here 🌊☀️\n\nLooking for a luxury villa with a private infinity pool, cliffside views in Vagator, or quiet beachfront bliss in Palolem? Tell me your dates and who you're traveling with, and let's find the spot!",

      // 🚐 Overland Campervans & Road Trips
      "Hello$nameStr! Ready to hit the open road? 🚐💨\n\nI'm Qube, StayQ's overland companion. We've got campervans mapped across the Western Ghats and Himalayan passes with verified 220V pit-stops and hot showers. Where is the road trip taking you?",

      // 🏔️ Mountain Chalets & Pine Trails
      "$timeGreeting$nameStr! Qube at your service 🏔️✨\n\nSnow peaks, wood-burning fireplaces, and quiet pine forests calling your name? Let me know if you want an offbeat Himalayan hideout or a scenic road trip route!",

      // 🔑 Zero-Brokerage Living & Workcations
      "$timeGreeting$nameStr! Looking for a workcation or monthly stay? 🔑💻\n\nCheck out our 0% broker designer lofts with 1Gbps fiber internet in Bengaluru, Goa, and Pune. Where do you want to settle in next?",

      // 🇮🇳 Warm Hinglish / Local Vibe
      "Namaste$nameStr! Main hoon Qube 🙏✨\n\nStayQ ka travel companion. Goa ki pool party, Manali ki thand, ya campervan me mast road trip — batao kya plan ban raha hai, baaki main sambhalta hoon!",
    ];

    return pools[math.Random().nextInt(pools.length)];
  }

  @override
  void initState() {
    super.initState();
    _dotsController = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _dotsAnimation = Tween<double>(begin: 0, end: 1).animate(_dotsController);

    // Initial warm greeting
    _messages.add(QubeMessage(text: _getRandomGreeting(), isUser: false));

    // Personalize with user's name once provider is attached
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final userName = Provider.of<AppProvider>(context, listen: false).userName;
      if (userName.isNotEmpty && userName.toLowerCase() != 'guest') {
        setState(() {
          _messages[0] = QubeMessage(text: _getRandomGreeting(userName), isUser: false);
        });
      }
      if (widget.initialPrompt != null && widget.initialPrompt!.trim().isNotEmpty) {
        _sendPrompt(widget.initialPrompt!);
      }
    });
  }

  @override
  void dispose() {
    _promptController.dispose();
    _scrollController.dispose();
    _dotsController.dispose();
    super.dispose();
  }

  String _formatTime(DateTime t) {
    final h = t.hour > 12 ? t.hour - 12 : (t.hour == 0 ? 12 : t.hour);
    final m = t.minute.toString().padLeft(2, '0');
    final suffix = t.hour >= 12 ? 'PM' : 'AM';
    return '$h:$m $suffix';
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 320),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  List<Map<String, String>> _buildHistory() {
    final history = <Map<String, String>>[];
    final recent = _messages.length > 8 ? _messages.sublist(_messages.length - 8) : _messages;
    for (final m in recent) {
      history.add({
        'role': m.isUser ? 'user' : 'assistant',
        'content': m.text,
      });
    }
    return history;
  }

  Future<void> _sendPrompt([String? customText]) async {
    final prompt = (customText ?? _promptController.text).trim();
    if (prompt.isEmpty) return;

    setState(() {
      _messages.add(QubeMessage(text: prompt, isUser: true));
      _isLoading = true;
      if (customText == null) {
        _promptController.clear();
      }
    });
    _scrollToBottom();

    final lower = prompt.toLowerCase();
    final isExplicitItinerary = _currentMode == QubeMode.itinerary ||
        lower.contains('generate itinerary') ||
        lower.contains('create itinerary') ||
        lower.contains('make itinerary') ||
        lower.contains('day-by-day') ||
        lower.contains('trip itinerary');

    try {
      if (isExplicitItinerary) {
        final data = await QubeApiService.getPlan(
          prompt,
          budget: _showBudgetSlider || _currentMode == QubeMode.itinerary ? _budget : null,
        );
        if (!mounted) return;
        setState(() {
          _messages.add(QubeMessage(
            text: data['title'] ?? 'Here is your custom itinerary:',
            isUser: false,
            planData: data,
          ));
        });
      } else {
        final history = _buildHistory();
        final reply = await QubeApiService.chat(prompt, history: history);
        if (!mounted) return;
        setState(() {
          _messages.add(QubeMessage(
            text: reply,
            isUser: false,
          ));
        });
      }
    } catch (_) {
      if (!mounted) return;
      final fallbackReply = await QubeApiService.chat(prompt);
      setState(() {
        _messages.add(QubeMessage(
          text: fallbackReply,
          isUser: false,
        ));
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        _scrollToBottom();
      }
    }
  }

  void _saveItineraryToTrips(Map<String, dynamic> planData) {
    AppMotion.tapHeavy();
    final title = planData['title'] ?? 'Custom Trip';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_rounded, color: AppColors.successGreen, size: 20),
            const SizedBox(width: 10),
            Expanded(child: Text('$title saved to your Trip Plans! 🎒')),
          ],
        ),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 3),
        action: SnackBarAction(
          label: 'View Trips',
          textColor: AppColors.primary,
          onPressed: () {
            context.read<AppProvider>().setTabIndex(2);
            Navigator.pop(context);
          },
        ),
      ),
    );
  }

  void _exploreStaysForDestination(String destination) {
    AppMotion.tapSelection();
    context.read<AppProvider>().setTabIndex(0);
    Navigator.pop(context);
  }

  Widget _buildQuickPromptChip(String emoji, String text) {
    return GestureDetector(
      onTap: () {
        AppMotion.tapSelection();
        _sendPrompt(text);
      },
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.card(context),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: AppColors.border(context),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: AppColors.isDark(context) ? 0.2 : 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 14)),
            const SizedBox(width: 6),
            Text(
              text,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: AppColors.text(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRobotHeroBanner() {
    final isDark = AppColors.isDark(context);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isDark
              ? [const Color(0xFF1E1B4B), const Color(0xFF1E1035)]
              : [const Color(0xFFF3E8FF), const Color(0xFFEDE9FE)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF8B5CF6).withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF7C3AED).withValues(alpha: 0.12),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              const QubeRobotAvatar(
                size: 76,
                animate: true,
                showBadge: true,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF7C3AED).withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.auto_awesome, color: Color(0xFFA855F7), size: 12),
                          SizedBox(width: 4),
                          Text(
                            'AI TRAVEL ROBOT',
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF7C3AED),
                              letterSpacing: 0.6,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Meet Qube',
                      style: TextStyle(
                        fontSize: 19,
                        fontWeight: FontWeight.w900,
                        color: AppColors.text(context),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'StayQ AI travel companion with day-by-day itineraries and verified stays.',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSub(context),
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              _buildFeatureBadge('🏡 Private Pool Villas'),
              _buildFeatureBadge('🚐 Overland Campervans'),
              _buildFeatureBadge('🔑 0% Broker Rentals'),
              _buildFeatureBadge('🗺️ Custom Itineraries'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureBadge(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surface(context).withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border(context)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: AppColors.text(context),
        ),
      ),
    );
  }

  Widget _buildBudgetSliderBar() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.card(context),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border(context)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: AppColors.isDark(context) ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.tune_rounded, color: AppColors.primary, size: 16),
                  const SizedBox(width: 6),
                  Text(
                    'Trip Budget Filter',
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppColors.text(context)),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '₹${_budget.toInt()}',
                  style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w900, color: AppColors.primary),
                ),
              ),
            ],
          ),
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: AppColors.primary,
              inactiveTrackColor: AppColors.border(context),
              thumbColor: AppColors.primary,
              overlayColor: AppColors.primary.withValues(alpha: 0.2),
              trackHeight: 4,
            ),
            child: Slider(
              value: _budget,
              min: 5000,
              max: 100000,
              divisions: 19,
              onChanged: (val) {
                setState(() => _budget = val);
              },
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('₹5k (Budget)', style: TextStyle(fontSize: 10.5, color: AppColors.textSub(context))),
              Text('₹25k (Comfort)', style: TextStyle(fontSize: 10.5, color: AppColors.textSub(context))),
              Text('₹100k+ (Luxury)', style: TextStyle(fontSize: 10.5, color: AppColors.textSub(context))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMessage(QubeMessage message) {
    if (message.isUser) {
      return Align(
        alignment: Alignment.centerRight,
        child: GestureDetector(
          onLongPress: () {
            HapticFeedback.mediumImpact();
            Clipboard.setData(ClipboardData(text: message.text));
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Message copied'), duration: Duration(seconds: 1), behavior: SnackBarBehavior.floating),
            );
          },
          child: Container(
            margin: const EdgeInsets.only(top: 4, bottom: 2, left: 60, right: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.primary, Color(0xFF7C3AED)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(22),
                      topRight: Radius.circular(22),
                      bottomLeft: Radius.circular(22),
                      bottomRight: Radius.circular(4),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.28),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Text(
                    message.text,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15.5,
                      fontWeight: FontWeight.w500,
                      height: 1.4,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 3, right: 4),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _formatTime(message.timestamp),
                        style: TextStyle(
                          fontSize: 10.5,
                          color: AppColors.textSub(context).withValues(alpha: 0.7),
                        ),
                      ),
                      const SizedBox(width: 3),
                      Icon(Icons.done_all_rounded, size: 12, color: AppColors.primary.withValues(alpha: 0.7)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ).animate().fadeIn().slideX(begin: 0.15, end: 0, curve: AppMotion.signatureCurve),
      );
    }

    // Assistant Robot Response
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const QubeRobotAvatar(
              size: 34,
              animate: false,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.card(context),
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(4),
                        topRight: Radius.circular(22),
                        bottomLeft: Radius.circular(22),
                        bottomRight: Radius.circular(22),
                      ),
                      border: Border.all(
                        color: AppColors.border(context),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: AppColors.isDark(context) ? 0.2 : 0.04),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (message.planData != null) ...[
                          Row(
                            children: [
                              const Icon(Icons.map_rounded, color: AppColors.primary, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  message.planData!['title'] ?? 'Custom Itinerary',
                                  style: const TextStyle(
                                    fontSize: 16.5,
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            message.planData!['description'] ?? '',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppColors.text(context),
                              height: 1.4,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                '🗓️ Day-by-Day Schedule',
                                style: TextStyle(
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                'Tap day to expand',
                                style: TextStyle(fontSize: 11, color: AppColors.textSub(context)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          // Expandable Day-by-Day items
                          ...?((message.planData!['itineraryDays'] as List?)?.map((day) {
                            return _ExpandableDayTile(day: day as Map<String, dynamic>);
                          })),
                          const SizedBox(height: 14),
                          // Action buttons: "Add to Trip" & "Explore Stays"
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () => _saveItineraryToTrips(message.planData!),
                                  icon: const Icon(Icons.bookmark_add_rounded, size: 16),
                                  label: const Text('Add to Trip', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () => _exploreStaysForDestination(
                                    message.planData!['destination']?.toString() ?? 'Stays',
                                  ),
                                  icon: const Icon(Icons.travel_explore_rounded, size: 16),
                                  label: const Text('Explore Stays', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.text(context),
                                    side: BorderSide(color: AppColors.border(context)),
                                    padding: const EdgeInsets.symmetric(vertical: 10),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ] else ...[
                          Text(
                            message.text,
                            style: TextStyle(
                              fontSize: 14.5,
                              height: 1.45,
                              color: AppColors.text(context),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  // Properties Carousel if returned with Itinerary Plan
                  if (message.planData != null &&
                      message.planData!['properties'] is List &&
                      (message.planData!['properties'] as List).isNotEmpty) ...[
                    const SizedBox(height: 12),
                    const Padding(
                      padding: EdgeInsets.only(left: 4),
                      child: Text(
                        '🏡 Recommended Stays for This Trip',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 310,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: (message.planData!['properties'] as List).length,
                        itemBuilder: (context, index) {
                          final propJson = (message.planData!['properties'] as List)[index];
                          if (propJson is! Map<String, dynamic>) return const SizedBox.shrink();
                          final stay = StayModel.fromJson(propJson);
                          return Padding(
                            padding: const EdgeInsets.only(right: 14),
                            child: StayCard(
                              stay: stay,
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => ListingDetailScreen(stay: stay),
                                  ),
                                );
                              },
                              onFavoriteTap: () {
                                Provider.of<AppProvider>(context, listen: false).toggleWishlist(stay);
                              },
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                  // Timestamp below Qube bubble
                  Padding(
                    padding: const EdgeInsets.only(top: 3, left: 4),
                    child: Text(
                      _formatTime(message.timestamp),
                      style: TextStyle(
                        fontSize: 10.5,
                        color: AppColors.textSub(context).withValues(alpha: 0.7),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn().slideX(begin: -0.15, end: 0, curve: AppMotion.signatureCurve);
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      child: Scaffold(
        backgroundColor: AppColors.bg(context),
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
            onPressed: () => Navigator.pop(context),
          ),
          titleSpacing: 0,
          title: Row(
            children: [
              QubeRobotAvatar(
                size: 38,
                animate: true,
                isThinking: _isLoading,
                showBadge: true,
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Row(
                    children: [
                      Text(
                        'Qube Travel Robot',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                      ),
                      SizedBox(width: 4),
                      Icon(Icons.verified, color: Color(0xFF06B6D4), size: 14),
                    ],
                  ),
                  Text(
                    'AI Concierge • Always Active',
                    style: TextStyle(fontSize: 11, color: AppColors.textSub(context)),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            IconButton(
              icon: Icon(
                _showBudgetSlider ? Icons.tune_rounded : Icons.tune_outlined,
                color: _showBudgetSlider ? AppColors.primary : AppColors.icon(context),
              ),
              tooltip: 'Budget Filter',
              onPressed: () {
                AppMotion.tapSelection();
                setState(() => _showBudgetSlider = !_showBudgetSlider);
              },
            ),
            IconButton(
              icon: Icon(Icons.refresh_rounded, color: AppColors.icon(context)),
              tooltip: 'New Conversation',
              onPressed: () {
                HapticFeedback.lightImpact();
                final userName = Provider.of<AppProvider>(context, listen: false).userName;
                setState(() {
                  _messages.clear();
                  _messages.add(QubeMessage(
                    text: _getRandomGreeting(userName),
                    isUser: false,
                  ));
                });
              },
            ),
          ],
          backgroundColor: AppColors.bg(context),
          elevation: 0,
        ),
        body: Column(
          children: [
            // Mode Selector Pill (Concierge Chat vs Itinerary Plan)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppColors.card(context),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border(context)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        AppMotion.tapSelection();
                        setState(() {
                          _currentMode = QubeMode.chat;
                          _showBudgetSlider = false;
                        });
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: _currentMode == QubeMode.chat ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.chat_bubble_outline_rounded,
                              size: 15,
                              color: _currentMode == QubeMode.chat ? Colors.white : AppColors.textSub(context),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Concierge Chat',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.bold,
                                color: _currentMode == QubeMode.chat ? Colors.white : AppColors.textSub(context),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        AppMotion.tapSelection();
                        setState(() {
                          _currentMode = QubeMode.itinerary;
                          _showBudgetSlider = true;
                        });
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(
                          color: _currentMode == QubeMode.itinerary ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.route_rounded,
                              size: 15,
                              color: _currentMode == QubeMode.itinerary ? Colors.white : AppColors.textSub(context),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              'Trip Itinerary',
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.bold,
                                color: _currentMode == QubeMode.itinerary ? Colors.white : AppColors.textSub(context),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Budget Slider when active
            if (_showBudgetSlider || _currentMode == QubeMode.itinerary)
              _buildBudgetSliderBar(),

            // Messages List
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: _messages.length + (_isLoading ? 1 : 0) + (_messages.length <= 1 ? 1 : 0),
                itemBuilder: (context, index) {
                  if (_messages.length <= 1 && index == 0) {
                    return _buildRobotHeroBanner();
                  }

                  final msgIndex = _messages.length <= 1 ? index - 1 : index;

                  // Animated Typing Bubble
                  if (msgIndex == _messages.length) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const QubeRobotAvatar(size: 32, isThinking: true),
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                            decoration: BoxDecoration(
                              color: AppColors.card(context),
                              borderRadius: const BorderRadius.only(
                                topLeft: Radius.circular(4),
                                topRight: Radius.circular(20),
                                bottomLeft: Radius.circular(20),
                                bottomRight: Radius.circular(20),
                              ),
                              border: Border.all(
                                color: const Color(0xFF06B6D4).withValues(alpha: 0.25),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: AppColors.isDark(context) ? 0.2 : 0.04),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: AnimatedBuilder(
                              animation: _dotsAnimation,
                              builder: (context, _) {
                                return Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: List.generate(3, (i) {
                                    final offset = math.sin(
                                      (_dotsAnimation.value * math.pi * 2) - (i * 0.8),
                                    );
                                    return Container(
                                      margin: const EdgeInsets.symmetric(horizontal: 3),
                                      transform: Matrix4.translationValues(0, -4 * offset.clamp(0.0, 1.0), 0),
                                      child: Container(
                                        width: 8,
                                        height: 8,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: const Color(0xFF7C3AED).withValues(alpha: 0.6 + 0.4 * offset.clamp(0.0, 1.0)),
                                        ),
                                      ),
                                    );
                                  }),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ).animate().fadeIn(duration: 200.ms);
                  }

                  return _buildMessage(_messages[msgIndex]);
                },
              ),
            ),

            // Quick Starter Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: Row(
                children: [
                  _buildQuickPromptChip('🌴', 'Pool villas in Goa'),
                  _buildQuickPromptChip('🏔️', 'A-Frame cabin in Manali'),
                  _buildQuickPromptChip('🚐', 'Plan campervan trip Goa to Kerala'),
                  _buildQuickPromptChip('🔑', 'Zero brokerage flat in Bengaluru'),
                  _buildQuickPromptChip('🗺️', '3-Day luxury itinerary for Udaipur'),
                  _buildQuickPromptChip('🎟️', 'Catamaran sunset cruise in Goa'),
                ],
              ),
            ),

            // Bottom Input Field
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.card(context),
                border: Border(
                  top: BorderSide(color: AppColors.border(context)),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: AppColors.isDark(context) ? 0.2 : 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _promptController,
                        style: TextStyle(
                          fontSize: 14,
                          color: AppColors.text(context),
                        ),
                        decoration: InputDecoration(
                          hintText: _currentMode == QubeMode.itinerary
                              ? 'e.g. Plan a 3-day luxury trip to Goa...'
                              : 'Ask Qube: stays, campervans, rules, prices...',
                          hintStyle: TextStyle(
                            fontSize: 13.5,
                            color: AppColors.textSub(context).withValues(alpha: 0.7),
                          ),
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
                          filled: true,
                          fillColor: AppColors.surface(context),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                        ),
                        onSubmitted: (_) => _sendPrompt(),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Container(
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [AppColors.primary, Color(0xFF7C3AED)],
                        ),
                      ),
                      child: IconButton(
                        onPressed: _sendPrompt,
                        icon: const Icon(Icons.arrow_upward_rounded, color: Colors.white, size: 22),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ExpandableDayTile extends StatefulWidget {
  final Map<String, dynamic> day;

  const _ExpandableDayTile({required this.day});

  @override
  State<_ExpandableDayTile> createState() => _ExpandableDayTileState();
}

class _ExpandableDayTileState extends State<_ExpandableDayTile> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final day = widget.day;
    final dayNum = day['day'] ?? 1;
    final activity = (day['activity'] ?? '').toString();
    final details = (day['details'] ?? '').toString();
    final morning = day['morning']?.toString();
    final afternoon = day['afternoon']?.toString();
    final evening = day['evening']?.toString();

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppColors.surface(context),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: _expanded ? AppColors.primary.withValues(alpha: 0.4) : AppColors.border(context),
        ),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () {
              AppMotion.tapLight();
              setState(() => _expanded = !_expanded);
            },
            borderRadius: BorderRadius.circular(14),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Day $dayNum',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w900,
                        fontSize: 11,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      activity,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: AppColors.text(context),
                      ),
                      maxLines: _expanded ? null : 1,
                      overflow: _expanded ? null : TextOverflow.ellipsis,
                    ),
                  ),
                  Icon(
                    _expanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                    color: AppColors.textSub(context),
                    size: 20,
                  ),
                ],
              ),
            ),
          ),
          if (_expanded) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Divider(height: 12, color: AppColors.border(context)),
                  Text(
                    details,
                    style: TextStyle(
                      color: AppColors.textSub(context),
                      fontSize: 12.5,
                      height: 1.35,
                    ),
                  ),
                  if (morning != null || afternoon != null || evening != null) ...[
                    const SizedBox(height: 10),
                    if (morning != null)
                      _buildTimeRow(context, '🌅 Morning', morning),
                    if (afternoon != null)
                      _buildTimeRow(context, '☀️ Afternoon', afternoon),
                    if (evening != null)
                      _buildTimeRow(context, '🌙 Evening', evening),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTimeRow(BuildContext context, String timeLabel, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 85,
            child: Text(
              timeLabel,
              style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: AppColors.primary),
            ),
          ),
          Expanded(
            child: Text(
              content,
              style: TextStyle(fontSize: 12, color: AppColors.text(context)),
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../models/stay_model.dart';
import '../../services/qube_api_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/stay_card.dart';
import '../listing/listing_detail_screen.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';

class QubeMessage {
  final String text;
  final bool isUser;
  final Map<String, dynamic>? planData;

  QubeMessage({required this.text, required this.isUser, this.planData});
}

class QubePlannerScreen extends StatefulWidget {
  const QubePlannerScreen({super.key});

  @override
  State<QubePlannerScreen> createState() => _QubePlannerScreenState();
}

class _QubePlannerScreenState extends State<QubePlannerScreen> {
  final TextEditingController _promptController = TextEditingController();
  final List<QubeMessage> _messages = [];
  bool _isLoading = false;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _messages.add(
      QubeMessage(
        text: "Hi! I'm Qube, your Stay Q AI travel companion ✨ Where would you like to explore next?",
        isUser: false,
      ),
    );
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

  Future<void> _sendPrompt() async {
    final prompt = _promptController.text.trim();
    if (prompt.isEmpty) return;

    setState(() {
      _messages.add(QubeMessage(text: prompt, isUser: true));
      _isLoading = true;
      _promptController.clear();
    });
    _scrollToBottom();

    try {
      final data = await QubeApiService.getPlan(prompt);
      setState(() {
        _messages.add(QubeMessage(
          text: "Here is your plan:",
          isUser: false,
          planData: data,
        ));
      });
    } catch (e) {
      setState(() {
        _messages.add(QubeMessage(
          text: "Sorry, I couldn't generate a plan right now. Please try again.",
          isUser: false,
        ));
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
      _scrollToBottom();
    }
  }

  Widget _buildQuickPromptChip(String prompt) {
    return GestureDetector(
      onTap: () {
        _promptController.text = prompt;
        _sendPrompt();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.borderLight),
        ),
        child: Text(
          prompt,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
        ),
      ),
    );
  }

  Widget _buildMessage(QubeMessage message) {
    if (message.isUser) {
      return Align(
        alignment: Alignment.centerRight,
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(20),
              topRight: Radius.circular(20),
              bottomLeft: Radius.circular(20),
            ),
          ),
          child: Text(
            message.text,
            style: const TextStyle(color: Colors.white, fontSize: 16),
          ),
        ).animate().fadeIn().slideX(begin: 0.2, end: 0, curve: AppMotion.signatureCurve),
      );
    }

    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const CircleAvatar(
              backgroundColor: AppColors.primaryLight,
              child: Icon(Icons.auto_awesome, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Theme.of(context).cardColor,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(20),
                        topRight: Radius.circular(20),
                        bottomRight: Radius.circular(20),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (message.planData != null) ...[
                          Text(
                            message.planData!['title'] ?? 'Trip Plan',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            message.planData!['description'] ?? '',
                            style: TextStyle(
                              fontSize: 15,
                              color: Theme.of(context).textTheme.bodyMedium?.color,
                            ),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Itinerary',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          ...?((message.planData!['itineraryDays'] as List?)?.map((day) {
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Day ${day['day']}: ${day['activity']}',
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  Text(
                                    day['details'] ?? '',
                                    style: TextStyle(
                                      color: Theme.of(context).textTheme.bodySmall?.color,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          })),
                        ] else ...[
                          Text(
                            message.text,
                            style: TextStyle(
                              fontSize: 16,
                              color: Theme.of(context).textTheme.bodyLarge?.color,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  
                  // Properties List
                  if (message.planData != null && message.planData!['properties'] != null)
                    Container(
                      height: 320,
                      margin: const EdgeInsets.only(top: 16),
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: (message.planData!['properties'] as List).length,
                        itemBuilder: (context, index) {
                          final propJson = message.planData!['properties'][index];
                          final stay = StayModel.fromJson(propJson);
                          return Padding(
                            padding: const EdgeInsets.only(right: 16),
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
              ),
            ),
          ],
        ),
      ).animate().fadeIn().slideX(begin: -0.2, end: 0, curve: AppMotion.signatureCurve),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.auto_awesome, color: AppColors.primary),
            SizedBox(width: 8),
            Text('Stay Q Planner'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.textPrimary),
            tooltip: 'New Itinerary',
            onPressed: () {
              setState(() {
                _messages.clear();
                _messages.add(
                  QubeMessage(
                    text: "Hi! I'm Qube, your Stay Q AI travel companion ✨ Where would you like to explore next?",
                    isUser: false,
                  ),
                );
              });
            },
          ),
        ],
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        elevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(vertical: 16),
              itemCount: _messages.length + (_isLoading ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length) {
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(
                      child: CircularProgressIndicator(),
                    ),
                  );
                }
                return _buildMessage(_messages[index]);
              },
            ),
          ),
          // Quick Suggestion Pills
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                _buildQuickPromptChip('🏝️ Goa Homestay with Host'),
                const SizedBox(width: 8),
                _buildQuickPromptChip('🏔️ Weekend in Manali Chalet'),
                const SizedBox(width: 8),
                _buildQuickPromptChip('🎟️ Jaipur Experience Spots'),
                const SizedBox(width: 8),
                _buildQuickPromptChip('🏕️ Riverside Camping in Rishikesh'),
              ],
            ),
          ),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).cardColor,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _promptController,
                      decoration: InputDecoration(
                        hintText: 'Ask Qube: e.g. 3-day homestay in Goa...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: AppColors.surfaceLight,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      ),
                      onSubmitted: (_) => _sendPrompt(),
                    ),
                  ),
                  const SizedBox(width: 12),
                  FloatingActionButton(
                    onPressed: _sendPrompt,
                    backgroundColor: AppColors.primary,
                    elevation: 0,
                    child: const Icon(Icons.send_rounded, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

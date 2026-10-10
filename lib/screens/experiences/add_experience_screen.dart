import 'dart:io';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../../providers/app_provider.dart';
import '../../models/stay_model.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';
import '../../widgets/stayq_loader.dart';
import '../../services/qube_experience_ai_service.dart';

class AddExperienceScreen extends StatefulWidget {
  const AddExperienceScreen({super.key});

  @override
  State<AddExperienceScreen> createState() => _AddExperienceScreenState();
}

class _AddExperienceScreenState extends State<AddExperienceScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final PageController _pageController = PageController();

  int _currentStep = 0;
  static const int _totalSteps = 5;

  // Controllers
  final _titleController = TextEditingController();
  final _cityController = TextEditingController();
  final _locationController = TextEditingController();
  final _priceController = TextEditingController(text: '1500');
  final _durationController = TextEditingController(text: '3 hours');
  final _maxSpotsController = TextEditingController(text: '10');
  final _timeSlotController = TextEditingController(text: '10:00 AM - 01:00 PM');
  final _descController = TextEditingController();
  final _inclusionController = TextEditingController();
  final _categorySearchController = TextEditingController();

  // State
  String _selectedCategory = 'FOOD_AND_DRINK';
  String _categorySearchQuery = '';
  String _categoryFilterTab = 'ALL';
  bool _showAllCategories = false;
  String _transportOption = 'PICKUP_DROP'; // 'PICKUP_DROP' | 'SELF_ARRIVE'
  bool _foodIncluded = true;
  bool _equipmentIncluded = true;
  int _kidsFreeAgeLimit = 5; // 0 = none, 5 = up to 5 yrs free
  final List<String> _inclusions = [
    'Traditional Welcome Refreshment',
    'All Equipment & Ingredients Provided',
    'Personalized Guide & Local Stories',
  ];

  final String _submissionKey =
      'experience:${DateTime.now().microsecondsSinceEpoch}:${Random.secure().nextInt(1 << 32)}';
  bool _isLoading = false;
  String _selectedImage = '';
  bool _isQubeGenerating = false;
  String _qubeStatusMessage = '';

  // 52 Curated Categories
  final List<Map<String, String>> _categories = [
    {'key': 'FOOD_AND_DRINK', 'label': 'Food & Cooking Masterclass', 'icon': '🍲'},
    {'key': 'TREKKING', 'label': 'Mountain & Trail Trekking', 'icon': '🥾'},
    {'key': 'KAYAKING', 'label': 'Sunset & Mangrove Kayaking', 'icon': '🛶'},
    {'key': 'SCUBA_DIVING', 'label': 'Scuba Diving & Snorkeling', 'icon': '🤿'},
    {'key': 'HERITAGE_WALK', 'label': 'Heritage & Historical Walks', 'icon': '🏛️'},
    {'key': 'WELLNESS', 'label': 'Wellness, Yoga & Breathwork', 'icon': '🧘'},
    {'key': 'WILDLIFE_SAFARI', 'label': 'Wildlife & Jungle Safari', 'icon': '🐅'},
    {'key': 'PARAGLIDING', 'label': 'Tandem Paragliding & Aerial', 'icon': '🪂'},
    {'key': 'POTTERY', 'label': 'Artisan Pottery & Clay Craft', 'icon': '🏺'},
    {'key': 'TEA_TASTING', 'label': 'Tea Tasting & Estate Trail', 'icon': '🍵'},
    {'key': 'COFFEE_ESTATE', 'label': 'Coffee Plantation & Roasting', 'icon': '☕'},
    {'key': 'FARM_TO_TABLE', 'label': 'Organic Farm to Table', 'icon': '🚜'},
    {'key': 'WINE_TOUR', 'label': 'Vineyard & Wine Tasting', 'icon': '🍷'},
    {'key': 'STARGAZING', 'label': 'Stargazing & Dark Sky Astro', 'icon': '🔭'},
    {'key': 'SURFING', 'label': 'Surfing & Paddleboarding', 'icon': '🏄'},
    {'key': 'RIVER_RAFTING', 'label': 'River Rafting & White Water', 'icon': '🌊'},
    {'key': 'PHOTOGRAPHY_WALK', 'label': 'Photography & Drone Walk', 'icon': '📸'},
    {'key': 'FOLK_MUSIC', 'label': 'Folk Music, Baithak & Dance', 'icon': '🪕'},
    {'key': 'DESERT_SAFARI', 'label': 'Desert Camel & Dune Safari', 'icon': '🐪'},
    {'key': 'CAMPFIRE_MUSIC', 'label': 'Campfire Acoustic Nights', 'icon': '🔥'},
    {'key': 'CYCLING_TOUR', 'label': 'Cycling & Coastal Trails', 'icon': '🚴'},
    {'key': 'SOUND_HEALING', 'label': 'Sound Bath & Tibetan Bowls', 'icon': '🥣'},
    {'key': 'AYURVEDA', 'label': 'Ayurveda & Herbal Healing', 'icon': '🌿'},
    {'key': 'CIDER_AND_BAKING', 'label': 'Mountain Cider & Baking', 'icon': '🍏'},
    {'key': 'STREET_FOOD_SAFARI', 'label': 'Street Food Safari & Bazaars', 'icon': '🍢'},
    {'key': 'BOAT_CRUISE', 'label': 'Backwater Cruise & Canals', 'icon': '🛥️'},
    {'key': 'ROCK_CLIMBING', 'label': 'High Altitude Rock Climbing', 'icon': '🧗'},
    {'key': 'BIRDWATCHING', 'label': 'Birdwatching & Wetland Walk', 'icon': '🦩'},
    {'key': 'TEXTILE_PRINTING', 'label': 'Textile & Block Printing', 'icon': '🧵'},
    {'key': 'NATURE_PAINTING', 'label': 'Art & Canvas in Nature', 'icon': '🎨'},
    {'key': 'SOURDOUGH_BAKING', 'label': 'Artisan Bread & Sourdough', 'icon': '🥖'},
    {'key': 'MIXOLOGY_LAB', 'label': 'Craft Cocktail & Mixology', 'icon': '🍸'},
    {'key': 'SPICE_PLANTATION', 'label': 'Spices & Botanical Trail', 'icon': '🌶️'},
    {'key': 'VILLAGE_LIFE', 'label': 'Village Life & Rural Living', 'icon': '🛖'},
    {'key': 'MOTORCYCLE_EXPEDITION', 'label': 'Motorcycle & High Pass Tour', 'icon': '🏍️'},
    {'key': 'FISHING_ANGLING', 'label': 'Deep Sea Fishing & Angling', 'icon': '🎣'},
    {'key': 'FOREST_BATHING', 'label': 'Forest Bathing & Shinrin-yoku', 'icon': '🌲'},
    {'key': 'TEMPLE_ARCHITECTURE', 'label': 'Temple Art & Architecture', 'icon': '🛕'},
    {'key': 'CAVE_EXPLORATION', 'label': 'Cave Exploration & Caving', 'icon': '🦇'},
    {'key': 'ROOFTOP_CINEMA', 'label': 'Rooftop Cinema & Film Evenings', 'icon': '🎬'},
    {'key': 'ARCHERY', 'label': 'Archery & Traditional Combat', 'icon': '🏹'},
    {'key': 'SAILING', 'label': 'Sailing & Yacht Charter', 'icon': '⛵'},
    {'key': 'CALLIGRAPHY', 'label': 'Calligraphy & Regional Scripts', 'icon': '✒️'},
    {'key': 'PERFUMERY', 'label': 'Perfumery & Essential Attars', 'icon': '🌸'},
    {'key': 'MIDNIGHT_LEGENDS', 'label': 'Ghost Walk & Midnight Lore', 'icon': '🕯️'},
    {'key': 'BOARD_GAMES_CAFE', 'label': 'Strategy Games & Social Club', 'icon': '🎲'},
    {'key': 'CANYONING', 'label': 'Waterfall Rappelling & Canyons', 'icon': '🧗‍♂️'},
    {'key': 'SNOW_SPORTS', 'label': 'Skiing, Snowboard & Snowshoes', 'icon': '⛷️'},
    {'key': 'HORSE_RIDING', 'label': 'Horse Riding & Country Trails', 'icon': '🐎'},
    {'key': 'METAL_CRAFT', 'label': 'Artisan Silver & Metal Craft', 'icon': '💍'},
    {'key': 'PUPPET_THEATRE', 'label': 'Puppetry & Folk Storytelling', 'icon': '🎭'},
    {'key': 'DARK_SKY_CAMPING', 'label': 'Astronomy & Milky Way Camp', 'icon': '🌌'},
  ];

  @override
  void dispose() {
    _pageController.dispose();
    _categorySearchController.dispose();
    _titleController.dispose();
    _cityController.dispose();
    _locationController.dispose();
    _priceController.dispose();
    _durationController.dispose();
    _maxSpotsController.dispose();
    _timeSlotController.dispose();
    _descController.dispose();
    _inclusionController.dispose();
    super.dispose();
  }

  // Navigation between steps
  void _goToStep(int step) {
    if (step < 0 || step >= _totalSteps) return;
    AppMotion.tapSelection();
    setState(() => _currentStep = step);
    _pageController.animateToPage(
      step,
      duration: const Duration(milliseconds: 380),
      curve: Curves.easeOutCubic,
    );
  }

  void _nextStep() {
    if (_currentStep == 0) {
      if (_titleController.text.trim().isEmpty) {
        _showToast('Please enter an experience title or use Qube AI to generate one.');
        return;
      }
      if (_cityController.text.trim().isEmpty) {
        _showToast('Please specify the city/town for this experience.');
        return;
      }
    } else if (_currentStep == 1) {
      if (_descController.text.trim().length < 20) {
        _showToast('Please describe what guests will do (minimum 20 characters).');
        return;
      }
    } else if (_currentStep == 3) {
      final price = double.tryParse(_priceController.text.trim());
      final spots = int.tryParse(_maxSpotsController.text.trim());
      if (price == null || price <= 0) {
        _showToast('Please enter a valid price per guest.');
        return;
      }
      if (spots == null || spots < 1) {
        _showToast('Please specify group capacity (minimum 1 guest).');
        return;
      }
    } else if (_currentStep == 4) {
      if (_selectedImage.isEmpty) {
        _showToast('Please add a cover photo before publishing.');
        return;
      }
      _submitForm();
      return;
    }
    _goToStep(_currentStep + 1);
  }

  void _showToast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  // Qube AI Assistance Engine for Experiences
  Future<void> _invokeQubeMagic(int step) async {
    _showQubeInterviewSheet(context, Theme.of(context).brightness == Brightness.dark);
  }

  Future<void> _pickMedia() async {
    AppMotion.tapSelection();
    final ImagePicker picker = ImagePicker();
    final XFile? media = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (media != null && mounted) {
      setState(() {
        _selectedImage = media.path;
      });
      HapticFeedback.lightImpact();
    }
  }

  void _addInclusion() {
    final text = _inclusionController.text.trim();
    if (text.isNotEmpty && !_inclusions.contains(text)) {
      setState(() {
        _inclusions.add(text);
        _inclusionController.clear();
      });
      HapticFeedback.selectionClick();
    }
  }

  Future<void> _submitForm() async {
    if (_isLoading) return;
    final provider = context.read<AppProvider>();
    final price = double.tryParse(_priceController.text.trim());
    final spots = int.tryParse(_maxSpotsController.text.trim());

    if (!provider.isLoggedIn) {
      _showToast('Please sign in to host an experience.');
      return;
    }

    if (_selectedImage.isEmpty) {
      _showToast('Please add at least one cover photo.');
      return;
    }

    if (price == null || price <= 0) {
      _showToast('Please enter a valid price per guest.');
      return;
    }

    if (spots == null || spots < 1) {
      _showToast('Please specify group capacity (min 1 guest).');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final cityText = _cityController.text.trim().isNotEmpty
          ? _cityController.text.trim()
          : _locationController.text.split(',').first.trim();

      final created = await provider.addExperience(
        StayModel(
          id: '',
          title: _titleController.text.trim(),
          location: _locationController.text.trim().isNotEmpty
              ? _locationController.text.trim()
              : '$cityText, India',
          city: cityText,
          pricePerNight: price,
          rating: 5.0,
          reviewCount: 0,
          imageUrls: [_selectedImage],
          category: _selectedCategory,
          hostName: provider.userName.isNotEmpty ? provider.userName : 'StayQ Host',
          hostAvatar: provider.userAvatar,
          amenities: _inclusions,
          description: _descController.text.trim(),
          lat: 0,
          lng: 0,
          isExperience: true,
          duration: _durationController.text.trim(),
          timeSlot: _timeSlotController.text.trim(),
          scheduleTime: _timeSlotController.text.trim(),
          maxSpots: spots,
          availableSpots: spots,
          transportOption: _transportOption,
          foodIncluded: _foodIncluded,
          equipmentIncluded: _equipmentIncluded,
          kidsFreeAgeLimit: _kidsFreeAgeLimit,
        ),
        idempotencyKey: _submissionKey,
      );

      if (!mounted) return;
      HapticFeedback.heavyImpact();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFF059669),
          content: Text('🎉 Curated Experience "${created.title}" is now live on StayQ!'),
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.errorRed,
            content: Text('Failed to publish: $e'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Flexible(
              child: Text(
                'Host Experience',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Text(
                'QUBE AI',
                style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.4),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Qube AI Assistance',
            icon: const Icon(Icons.auto_awesome_rounded, color: AppColors.primary),
            onPressed: () => _showQubeInterviewSheet(context, isDark),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: StayQLoader(size: 64, message: 'Publishing your curated experience to StayQ...'),
            )
          : SafeArea(
              child: Column(
                children: [
                  // 1. Ultra-Animated Step Indicator & Progress Bar
                  _buildAnimatedStepHeader(isDark),

                  // 2. Qube AI Live Floating Assistant Bar
                  _buildQubeAssistantBanner(isDark),

                  // 3. Multi-Step Page View
                  Expanded(
                    child: Form(
                      key: _formKey,
                      child: PageView(
                        controller: _pageController,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          _buildStep1Concept(isDark),
                          _buildStep2Story(isDark),
                          _buildStep3Logistics(isDark),
                          _buildStep4Pricing(isDark),
                          _buildStep5Review(isDark),
                        ],
                      ),
                    ),
                  ),

                  // 4. Ultra-Animated Bottom Bar Navigation
                  _buildBottomNavBar(isDark),
                ],
              ),
            ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  // HEADER PROGRESS INDICATOR
  // ══════════════════════════════════════════════════════════════
  Widget _buildAnimatedStepHeader(bool isDark) {
    final stepLabels = ['Concept', 'Story', 'Logistics', 'Pricing', 'Live Pass'];
    final progress = (_currentStep + 1) / _totalSteps;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
      child: Column(
        children: [
          // Step Pills Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(_totalSteps, (index) {
              final isCurrent = index == _currentStep;
              final isDone = index < _currentStep;

              return GestureDetector(
                onTap: () {
                  if (index <= _currentStep) _goToStep(index);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutCubic,
                  padding: EdgeInsets.symmetric(horizontal: isCurrent ? 12 : 8, vertical: 6),
                  decoration: BoxDecoration(
                    color: isCurrent
                        ? AppColors.primary
                        : (isDone ? const Color(0xFF10B981) : (isDark ? Colors.white10 : Colors.grey.shade200)),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: isCurrent
                        ? [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.35),
                              blurRadius: 10,
                              offset: const Offset(0, 3),
                            ),
                          ]
                        : null,
                  ),
                  child: Row(
                    children: [
                      Icon(
                        isDone ? Icons.check_circle_rounded : Icons.circle_rounded,
                        size: 11,
                        color: Colors.white,
                      ),
                      if (isCurrent) ...[
                        const SizedBox(width: 6),
                        Text(
                          stepLabels[index],
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.white),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 10),
          // Animated Smooth Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: TweenAnimationBuilder<double>(
              tween: Tween<double>(begin: 0.2, end: progress),
              duration: const Duration(milliseconds: 400),
              curve: Curves.easeOutCubic,
              builder: (context, value, _) {
                return LinearProgressIndicator(
                  value: value,
                  minHeight: 5,
                  backgroundColor: isDark ? Colors.white10 : Colors.grey.shade200,
                  valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  // QUBE AI ASSISTANT BANNER
  // ══════════════════════════════════════════════════════════════
  Widget _buildQubeAssistantBanner(bool isDark) {
    final stepPrompts = [
      'Tap to generate high-converting title, duration & meeting point',
      'Tap to generate a captivating narrative & itinerary schedule',
      'Tap to auto-populate curated inclusions & guest perks',
      'Tap to optimize per-guest pricing for peak host revenue',
      'Review your verified StayQ experience live ticket preview',
    ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF7C3AED).withValues(alpha: 0.12),
            const Color(0xFF4C1D95).withValues(alpha: 0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF7C3AED).withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: const BoxDecoration(
              gradient: AppColors.primaryGradient,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 16),
          )
              .animate(onPlay: (c) => c.repeat(reverse: true))
              .scale(begin: const Offset(0.9, 0.9), end: const Offset(1.1, 1.1), duration: 1500.ms),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'Qube AI Co-Host',
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12, color: AppColors.primary),
                    ),
                    const SizedBox(width: 6),
                    if (_isQubeGenerating)
                      const SizedBox(
                        width: 10,
                        height: 10,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                      ),
                  ],
                ),
                const SizedBox(height: 1),
                Text(
                  _isQubeGenerating ? _qubeStatusMessage : stepPrompts[_currentStep],
                  style: TextStyle(fontSize: 11, color: isDark ? Colors.white70 : AppColors.textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          if (_currentStep < 4)
            BouncingWidget(
              onTap: () => _showQubeInterviewSheet(context, isDark),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Auto-Craft', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                    SizedBox(width: 4),
                    Icon(Icons.bolt_rounded, color: Colors.white, size: 14),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  // QUBE AI CO-HOST INTERVIEW SHEET (DEEPSEEK AI INTEGRATION)
  // ══════════════════════════════════════════════════════════════
  void _showQubeInterviewSheet(BuildContext context, bool isDark) {
    AppMotion.tapSelection();
    HapticFeedback.mediumImpact();
    final ideaController = TextEditingController(
      text: _titleController.text.trim().isNotEmpty ? _titleController.text.trim() : '',
    );
    final locationController = TextEditingController(
      text: _cityController.text.trim().isNotEmpty ? _cityController.text.trim() : 'Goa',
    );
    String pricingTier = 'Standard (₹1,200 - ₹2,500)';
    bool isGenerating = false;
    String statusNote = '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalContext, setModalState) {
            final bottomInset = MediaQuery.of(modalContext).viewInsets.bottom;
            return Container(
              padding: EdgeInsets.fromLTRB(20, 16, 20, 24 + bottomInset),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF141829) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.35),
                    blurRadius: 25,
                    offset: const Offset(0, -6),
                  ),
                ],
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Handle bar
                    Center(
                      child: Container(
                        width: 44,
                        height: 5,
                        decoration: BoxDecoration(
                          color: isDark ? Colors.white24 : Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Header with Qube AI badge
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            gradient: AppColors.primaryGradient,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.4),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Text(
                                    'Qube AI Co-Host',
                                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF10B981).withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4)),
                                    ),
                                    child: const Text(
                                      'DeepSeek AI Live',
                                      style: TextStyle(
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFF10B981),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Answer 3 quick questions. Qube will auto-fill all 5 steps!',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? Colors.white70 : AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Question 1: Activity Idea
                    const Text(
                      '1. What experience or craft do you want to host?',
                      style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: ideaController,
                      style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontSize: 13.5),
                      decoration: InputDecoration(
                        hintText: 'e.g. Sunset Mangrove Kayaking & Tea, Pottery Masterclass...',
                        hintStyle: TextStyle(color: isDark ? Colors.white38 : Colors.grey.shade400, fontSize: 12.5),
                        prefixIcon: const Icon(Icons.palette_outlined, size: 19, color: AppColors.primary),
                        filled: true,
                        fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade50,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.grey.shade200),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.grey.shade200),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Quick activity chips
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          '🛶 Sunset Mangrove Kayaking',
                          '🍲 Heritage Spice Kitchen',
                          '🏺 Traditional Clay Pottery',
                          '🥾 Secret Pine Ridge Trek',
                          '☕ Artisan Coffee Roasting',
                          '🌌 Milky Way Astro Camp',
                        ].map((idea) {
                          return Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: ActionChip(
                              label: Text(idea, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                              backgroundColor: isDark ? Colors.white10 : Colors.grey.shade100,
                              onPressed: () {
                                setModalState(() {
                                  ideaController.text = idea.substring(3).trim();
                                });
                              },
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Question 2: Location
                    const Text(
                      '2. Where in India will this take place?',
                      style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: locationController,
                      style: TextStyle(color: isDark ? Colors.white : Colors.black87, fontSize: 13.5),
                      decoration: InputDecoration(
                        hintText: 'e.g. Panaji, Goa or Old Manali or Jaipur',
                        hintStyle: TextStyle(color: isDark ? Colors.white38 : Colors.grey.shade400, fontSize: 12.5),
                        prefixIcon: const Icon(Icons.location_on_outlined, size: 19, color: AppColors.primary),
                        filled: true,
                        fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade50,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.grey.shade200),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: isDark ? Colors.white12 : Colors.grey.shade200),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Location Quick Chips
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: ['Goa', 'Manali', 'Jaipur', 'Rishikesh', 'Udaipur', 'Bengaluru'].map((city) {
                          return Padding(
                            padding: const EdgeInsets.only(right: 6),
                            child: ActionChip(
                              label: Text(city, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                              backgroundColor: isDark ? Colors.white10 : Colors.grey.shade100,
                              onPressed: () {
                                setModalState(() {
                                  locationController.text = city;
                                });
                              },
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Question 3: Pricing Tier
                    const Text(
                      '3. Pricing Preference per Guest',
                      style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        'Budget (Under ₹1,200)',
                        'Standard (₹1,200 - ₹2,500)',
                        'Luxury (₹2,500+)',
                      ].map((tier) {
                        final isSelected = pricingTier == tier;
                        return Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setModalState(() => pricingTier = tier);
                              HapticFeedback.selectionClick();
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.primary.withValues(alpha: 0.15)
                                    : (isDark ? Colors.white.withValues(alpha: 0.05) : Colors.grey.shade100),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isSelected ? AppColors.primary : (isDark ? Colors.white12 : Colors.grey.shade300),
                                  width: isSelected ? 1.6 : 1.0,
                                ),
                              ),
                              child: Text(
                                tier.split(' ').first,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 11.5,
                                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                  color: isSelected ? AppColors.primary : (isDark ? Colors.white70 : AppColors.textSecondary),
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),

                    // Action Button
                    BouncingWidget(
                      onTap: isGenerating
                          ? null
                          : () async {
                              final idea = ideaController.text.trim().isNotEmpty
                                  ? ideaController.text.trim()
                                  : 'Authentic Local Culture & Food Experience';
                              final loc = locationController.text.trim().isNotEmpty
                                  ? locationController.text.trim()
                                  : 'Goa';

                              setModalState(() {
                                isGenerating = true;
                                statusNote = 'DeepSeek AI analyzing Indian travel patterns...';
                              });
                              HapticFeedback.mediumImpact();

                              try {
                                final result = await QubeExperienceAiService.generateExperience(
                                  activityIdea: idea,
                                  location: loc,
                                  pricingTier: pricingTier,
                                  validCategoryKeys: _categories.map((c) => c['key']!).toList(),
                                );

                                if (mounted) {
                                  setState(() {
                                    _selectedCategory = result.categoryKey;
                                    _titleController.text = result.title;
                                    _cityController.text = result.city;
                                    _locationController.text = result.meetingPoint;
                                    _durationController.text = result.duration;
                                    _timeSlotController.text = result.timeSlot;
                                    _priceController.text = result.pricePerPerson.toInt().toString();
                                    _maxSpotsController.text = result.maxSpots.toString();
                                    _descController.text = result.description;
                                    _inclusions.clear();
                                    _inclusions.addAll(result.inclusions);
                                    _transportOption = result.transportOption;
                                    _foodIncluded = result.foodIncluded;
                                    _equipmentIncluded = result.equipmentIncluded;
                                    _kidsFreeAgeLimit = result.kidsFreeAgeLimit;
                                  });
                                }

                                if (Navigator.canPop(modalContext)) {
                                  Navigator.pop(modalContext);
                                }

                                _showToast('✨ Qube AI populated all 5 steps! Ready to preview & launch.');
                                HapticFeedback.heavyImpact();
                              } catch (e) {
                                setModalState(() {
                                  isGenerating = false;
                                  statusNote = 'Failed: $e';
                                });
                              }
                            },
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.4),
                              blurRadius: 14,
                              offset: const Offset(0, 5),
                            ),
                          ],
                        ),
                        child: Center(
                          child: isGenerating
                              ? Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.2),
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      statusNote.isNotEmpty ? statusNote : 'Auto-Crafting with DeepSeek...',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                    ),
                                  ],
                                )
                              : const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 18),
                                    SizedBox(width: 8),
                                    Text(
                                      'Auto-Craft with DeepSeek AI 🚀',
                                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  // ══════════════════════════════════════════════════════════════
  // POU-STYLE BUBBLY POP CATEGORY GRID & HELPERS
  // ══════════════════════════════════════════════════════════════
  bool _matchesCategoryFilter(String key, String tab) {
    if (tab == 'ALL') return true;
    switch (tab) {
      case 'ADVENTURE':
        return const [
          'TREKKING', 'KAYAKING', 'SCUBA_DIVING', 'WILDLIFE_SAFARI', 'PARAGLIDING',
          'SURFING', 'RIVER_RAFTING', 'DESERT_SAFARI', 'CYCLING_TOUR', 'ROCK_CLIMBING',
          'MOTORCYCLE_EXPEDITION', 'CAVE_EXPLORATION', 'ARCHERY', 'SAILING',
          'CANYONING', 'SNOW_SPORTS', 'HORSE_RIDING',
        ].contains(key);
      case 'FOOD':
        return const [
          'FOOD_AND_DRINK', 'TEA_TASTING', 'COFFEE_ESTATE', 'FARM_TO_TABLE', 'WINE_TOUR',
          'CIDER_AND_BAKING', 'STREET_FOOD_SAFARI', 'SOURDOUGH_BAKING', 'MIXOLOGY_LAB', 'SPICE_PLANTATION',
        ].contains(key);
      case 'ART':
        return const [
          'HERITAGE_WALK', 'POTTERY', 'PHOTOGRAPHY_WALK', 'FOLK_MUSIC', 'CAMPFIRE_MUSIC',
          'TEXTILE_PRINTING', 'NATURE_PAINTING', 'VILLAGE_LIFE', 'TEMPLE_ARCHITECTURE',
          'ROOFTOP_CINEMA', 'CALLIGRAPHY', 'PERFUMERY', 'MIDNIGHT_LEGENDS',
          'BOARD_GAMES_CAFE', 'METAL_CRAFT', 'PUPPET_THEATRE',
        ].contains(key);
      case 'WELLNESS':
        return const [
          'WELLNESS', 'STARGAZING', 'SOUND_HEALING', 'AYURVEDA', 'BOAT_CRUISE',
          'BIRDWATCHING', 'FOREST_BATHING', 'DARK_SKY_CAMPING', 'FISHING_ANGLING',
        ].contains(key);
      default:
        return true;
    }
  }

  Widget _buildPouCategoryGrid(bool isDark) {
    final query = _categorySearchQuery.toLowerCase().trim();
    final filtered = _categories.where((cat) {
      final key = cat['key'] ?? '';
      final label = (cat['label'] ?? '').toLowerCase();
      final matchesTab = _matchesCategoryFilter(key, _categoryFilterTab);
      final matchesSearch = query.isEmpty || label.contains(query) || key.toLowerCase().contains(query);
      return matchesTab && matchesSearch;
    }).toList();

    final displayed = (_showAllCategories || query.isNotEmpty) ? filtered : filtered.take(9).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category Filter Tabs
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildCategoryFilterTab('ALL', '🌟 All (${_categories.length})', isDark),
              _buildCategoryFilterTab('ADVENTURE', '🏃 Adventure', isDark),
              _buildCategoryFilterTab('FOOD', '🍜 Food & Taste', isDark),
              _buildCategoryFilterTab('ART', '🎨 Art & Craft', isDark),
              _buildCategoryFilterTab('WELLNESS', '🧘 Wellness', isDark),
            ],
          ),
        ),
        const SizedBox(height: 10),

        // Search Bar
        Container(
          height: 42,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E2235) : Colors.grey.shade100,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? Colors.white12 : Colors.grey.shade300,
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            children: [
              Icon(Icons.search_rounded, size: 18, color: isDark ? Colors.white60 : Colors.grey.shade600),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _categorySearchController,
                  style: TextStyle(fontSize: 12.5, color: isDark ? Colors.white : Colors.black87),
                  decoration: InputDecoration(
                    hintText: 'Search 52+ curated activity categories...',
                    hintStyle: TextStyle(fontSize: 12, color: isDark ? Colors.white38 : Colors.grey.shade400),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                  onChanged: (val) => setState(() => _categorySearchQuery = val),
                ),
              ),
              if (_categorySearchQuery.isNotEmpty)
                GestureDetector(
                  onTap: () {
                    _categorySearchController.clear();
                    setState(() => _categorySearchQuery = '');
                  },
                  child: Icon(Icons.close_rounded, size: 16, color: isDark ? Colors.white60 : Colors.grey.shade600),
                ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // POU-Style 3D Chunky Grid
        if (displayed.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            alignment: Alignment.center,
            child: Text(
              'No activities match "$_categorySearchQuery"',
              style: TextStyle(fontSize: 13, color: isDark ? Colors.white60 : Colors.grey.shade600),
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: displayed.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              childAspectRatio: 0.88,
              crossAxisSpacing: 10,
              mainAxisSpacing: 12,
            ),
            itemBuilder: (context, index) {
              final cat = displayed[index];
              final key = cat['key']!;
              final isSelected = _selectedCategory == key;
              return _buildPouCategoryCard(
                category: cat,
                index: index,
                isSelected: isSelected,
                isDark: isDark,
              );
            },
          ),

        // Expand / Collapse Toggle Button
        if (query.isEmpty && filtered.length > 9) ...[
          const SizedBox(height: 12),
          Center(
            child: BouncingWidget(
              onTap: () {
                AppMotion.tapSelection();
                HapticFeedback.lightImpact();
                setState(() => _showAllCategories = !_showAllCategories);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white10 : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? Colors.white12 : Colors.grey.shade300,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _showAllCategories ? 'Show Less ⬆️' : 'Show All ${filtered.length} Categories 🎪',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildCategoryFilterTab(String tabKey, String label, bool isDark) {
    final isSelected = _categoryFilterTab == tabKey;
    return GestureDetector(
      onTap: () {
        AppMotion.tapSelection();
        HapticFeedback.selectionClick();
        setState(() => _categoryFilterTab = tabKey);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary
              : (isDark ? Colors.white.withValues(alpha: 0.06) : Colors.grey.shade100),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppColors.primary : (isDark ? Colors.white12 : Colors.grey.shade300),
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected ? Colors.white : (isDark ? Colors.white70 : AppColors.textSecondary),
          ),
        ),
      ),
    );
  }

  Widget _buildPouCategoryCard({
    required Map<String, String> category,
    required int index,
    required bool isSelected,
    required bool isDark,
  }) {
    final key = category['key']!;
    final label = category['label']!;
    final icon = category['icon'] ?? '✨';

    // Candy colors for Pou cards
    const pastelBgs = [
      Color(0xFFFFF7ED), // Warm Amber
      Color(0xFFECFEFF), // Light Cyan
      Color(0xFFECFDF5), // Light Mint
      Color(0xFFFAF5FF), // Soft Lavender
      Color(0xFFFFF1F2), // Pale Rose
      Color(0xFFFEF3C7), // Honey Gold
      Color(0xFFEFF6FF), // Soft Sky
    ];
    const pastelShadows = [
      Color(0xFFFED7AA), // Amber shadow
      Color(0xFFA5F3FC), // Cyan shadow
      Color(0xFFA7F3D0), // Mint shadow
      Color(0xFFE9D5FF), // Lavender shadow
      Color(0xFFFECDD3), // Rose shadow
      Color(0xFFFDE68A), // Gold shadow
      Color(0xFFBFDBFE), // Sky shadow
    ];

    final bgColor = isSelected
        ? (isDark ? const Color(0xFF3B2773) : const Color(0xFFF3E8FF))
        : (isDark ? const Color(0xFF1E2235) : pastelBgs[index % pastelBgs.length]);

    final shadowColor = isSelected
        ? AppColors.primary.withValues(alpha: 0.5)
        : (isDark ? const Color(0xFF0F121E) : pastelShadows[index % pastelShadows.length]);

    return BouncingWidget(
      onTap: () {
        AppMotion.tapSelection();
        HapticFeedback.selectionClick();
        setState(() => _selectedCategory = key);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutBack,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : (isDark ? Colors.white12 : Colors.black.withValues(alpha: 0.05)),
            width: isSelected ? 2.5 : 1.2,
          ),
          // Physical 3D extrusion bevel (POU Style)
          boxShadow: [
            BoxShadow(
              color: shadowColor,
              offset: const Offset(0, 4.0),
              blurRadius: isSelected ? 8.0 : 0.0,
            ),
          ],
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // Selected Checkmark Badge
            if (isSelected)
              Positioned(
                top: 6,
                right: 6,
                child: Container(
                  padding: const EdgeInsets.all(2.5),
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check, size: 10, color: Colors.white),
                ),
              ),

            // Card Body
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Emoji container
                  Container(
                    width: 44,
                    height: 44,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.white.withValues(alpha: 0.8),
                      shape: BoxShape.circle,
                    ),
                    child: Text(icon, style: const TextStyle(fontSize: 24)),
                  ),
                  const SizedBox(height: 6),

                  // Label
                  Text(
                    label,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 10.5,
                      fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                      height: 1.15,
                      color: isSelected
                          ? AppColors.primary
                          : (isDark ? Colors.white : const Color(0xFF1E293B)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 1: CONCEPT & CATEGORY
  // ══════════════════════════════════════════════════════════════
  Widget _buildStep1Concept(bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStepTitle('Step 1: Experience Concept', 'Pick an activity category and define your local craft or trail.'),
          const SizedBox(height: 16),

          // ─── POU-STYLE BUBBLY POP CATEGORY GRID ───
          _buildFieldHeader('Select Activity Category'),
          const SizedBox(height: 8),
          _buildPouCategoryGrid(isDark),
          const SizedBox(height: 20),

          // Title
          _buildFieldHeader('Experience Title'),
          _buildTextField(
            controller: _titleController,
            hint: 'e.g. Sunset Kayaking & Firefly Sanctuary in Mandovi River',
            icon: Icons.title_rounded,
          ),
          const SizedBox(height: 16),

          // City & Meeting Point
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildFieldHeader('City / Hub'),
                    _buildTextField(
                      controller: _cityController,
                      hint: 'e.g. Panaji, Goa',
                      icon: Icons.location_city_rounded,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildFieldHeader('Duration'),
                    _buildTextField(
                      controller: _durationController,
                      hint: 'e.g. 2.5 hours',
                      icon: Icons.timer_outlined,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          _buildFieldHeader('Meeting Point / Address'),
          _buildTextField(
            controller: _locationController,
            hint: 'e.g. Jetty Gate #2, Ribandar Causeway',
            icon: Icons.pin_drop_rounded,
          ),
        ],
      ),
    ).animate().fadeIn(duration: 250.ms).slideX(begin: 0.05, end: 0);
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 2: STORY & ITINERARY
  // ══════════════════════════════════════════════════════════════
  Widget _buildStep2Story(bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStepTitle('Step 2: Story & Itinerary', 'Tell travelers what makes this activity magical and what they will do.'),
          const SizedBox(height: 16),

          _buildFieldHeader('Experience Narrative & What Guests Will Do'),
          TextFormField(
            controller: _descController,
            maxLines: 8,
            style: TextStyle(fontSize: 14, color: isDark ? Colors.white : AppColors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Share the flow of the activity, from welcome drinks to hidden trails. Explain what guests will experience step-by-step...',
              hintStyle: const TextStyle(fontSize: 13, color: AppColors.textMuted),
              filled: true,
              fillColor: isDark ? const Color(0xFF1E293B) : Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(18), borderSide: BorderSide.none),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(18), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
              contentPadding: const EdgeInsets.all(16),
            ),
          ),
          const SizedBox(height: 20),

          _buildFieldHeader('Daily Schedule / Time Slot'),
          _buildTextField(
            controller: _timeSlotController,
            hint: 'e.g. 10:00 AM - 01:00 PM',
            icon: Icons.access_time_filled_rounded,
          ),
          const SizedBox(height: 12),

          // Quick Time Slot Presets
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildSlotPresetChip('🌅 Sunrise: 06:00 AM - 09:00 AM'),
              _buildSlotPresetChip('☀️ Midday: 11:00 AM - 02:00 PM'),
              _buildSlotPresetChip('🌇 Golden Hour: 04:30 PM - 07:30 PM'),
              _buildSlotPresetChip('🌌 Stargazing: 08:30 PM - 11:30 PM'),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 250.ms).slideX(begin: 0.05, end: 0);
  }

  Widget _buildSlotPresetChip(String slot) {
    return BouncingWidget(
      onTap: () {
        AppMotion.tapSelection();
        final raw = slot.split(': ').last.trim();
        setState(() => _timeSlotController.text = raw);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
        ),
        child: Text(
          slot,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 3: LOGISTICS & INCLUSIONS
  // ══════════════════════════════════════════════════════════════
  Widget _buildStep3Logistics(bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStepTitle('Step 3: What\'s Included & Logistics', 'Specify amenities, hospitality items, and transport options.'),
          const SizedBox(height: 16),

          // Inclusions List
          _buildFieldHeader('Items & Services Included in the Booking'),
          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _inclusionController,
                  hint: 'Add an item (e.g. Life Jackets, Tea, Art canvas)...',
                  icon: Icons.check_circle_outline_rounded,
                ),
              ),
              const SizedBox(width: 10),
              ElevatedButton(
                onPressed: _addInclusion,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Icon(Icons.add, color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Dynamic Inclusion Chips
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _inclusions.map((item) {
              return Chip(
                backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                label: Text(
                  item,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
                deleteIcon: const Icon(Icons.close_rounded, size: 16, color: AppColors.primary),
                onDeleted: () {
                  setState(() => _inclusions.remove(item));
                  HapticFeedback.lightImpact();
                },
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide.none),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          // Toggle Cards
          _buildFieldHeader('Hospitality & Equipment Flags'),
          _buildToggleTile(
            title: 'Food & Beverages Included',
            subtitle: 'Meals, traditional tastings, or welcome refreshments',
            icon: Icons.restaurant_rounded,
            value: _foodIncluded,
            onChanged: (v) => setState(() => _foodIncluded = v),
            isDark: isDark,
          ),
          const SizedBox(height: 10),
          _buildToggleTile(
            title: 'Equipment & Gear Provided',
            subtitle: 'All tools, craft supplies, safety gear, or sports gear provided',
            icon: Icons.handyman_rounded,
            value: _equipmentIncluded,
            onChanged: (v) => setState(() => _equipmentIncluded = v),
            isDark: isDark,
          ),
          const SizedBox(height: 16),

          // Transport Option
          _buildFieldHeader('Transport Logistics'),
          Row(
            children: [
              Expanded(
                child: _buildRadioOption(
                  title: 'Host Pickup & Drop',
                  subtitle: 'Provided from meeting hub',
                  isSelected: _transportOption == 'PICKUP_DROP',
                  onTap: () => setState(() => _transportOption = 'PICKUP_DROP'),
                  icon: Icons.directions_car_rounded,
                  isDark: isDark,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildRadioOption(
                  title: 'Self-Arrival',
                  subtitle: 'Guests meet at spot',
                  isSelected: _transportOption == 'SELF_ARRIVE',
                  onTap: () => setState(() => _transportOption = 'SELF_ARRIVE'),
                  icon: Icons.hiking_rounded,
                  isDark: isDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Kids Free Policy
          _buildFieldHeader('Family & Children Policy'),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.child_care_rounded, color: AppColors.primary),
                const SizedBox(width: 12),
                const Expanded(
                  child: Text('Kids free entry up to age:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                ),
                DropdownButton<int>(
                  value: _kidsFreeAgeLimit,
                  underline: const SizedBox(),
                  items: [0, 3, 5, 8, 12].map((age) {
                    return DropdownMenuItem(
                      value: age,
                      child: Text(age == 0 ? 'None (Charged)' : '$age years old', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    );
                  }).toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => _kidsFreeAgeLimit = v);
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 250.ms).slideX(begin: 0.05, end: 0);
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 4: CAPACITY & PRICING
  // ══════════════════════════════════════════════════════════════
  Widget _buildStep4Pricing(bool isDark) {
    final price = double.tryParse(_priceController.text.trim()) ?? 0;
    final spots = int.tryParse(_maxSpotsController.text.trim()) ?? 1;
    final perSessionEarnings = price * spots;
    final monthlyPotential = perSessionEarnings * 8; // 8 sessions a month

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStepTitle('Step 4: Group Capacity & Pricing', 'Set your rate per guest and see your projected host revenue in real-time.'),
          const SizedBox(height: 16),

          // Price per Guest
          _buildFieldHeader('Price per Guest (₹ INR)'),
          _buildTextField(
            controller: _priceController,
            hint: '1500',
            icon: Icons.currency_rupee_rounded,
            keyboardType: TextInputType.number,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 16),

          // Maximum Spots
          _buildFieldHeader('Maximum Group Capacity per Session'),
          _buildTextField(
            controller: _maxSpotsController,
            hint: '10',
            icon: Icons.groups_rounded,
            keyboardType: TextInputType.number,
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 24),

          // Ultra-Animated Neon Earnings Simulator
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0F172A), Color(0xFF1E1B4B), Color(0xFF312E81)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.4), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF10B981).withValues(alpha: 0.2),
                  blurRadius: 20,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.insights_rounded, color: Color(0xFF10B981), size: 20),
                        SizedBox(width: 8),
                        Text(
                          'HOST EARNINGS SIMULATOR',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF10B981), letterSpacing: 1),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text('LIVE 100% PAYOUT', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Per Session Revenue', style: TextStyle(fontSize: 12, color: Colors.white70)),
                          const SizedBox(height: 4),
                          Text(
                            '₹${perSessionEarnings.toStringAsFixed(0)}',
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white),
                          ),
                          Text('$spots spots × ₹${price.toStringAsFixed(0)}', style: const TextStyle(fontSize: 11, color: Colors.white54)),
                        ],
                      ),
                    ),
                    Container(height: 40, width: 1, color: Colors.white24),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Monthly Potential (8 Slots)', style: TextStyle(fontSize: 12, color: Colors.white70)),
                          const SizedBox(height: 4),
                          Text(
                            '₹${monthlyPotential.toStringAsFixed(0)}',
                            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF34D399)),
                          ),
                          const Text('Direct to verified bank / UPI', style: TextStyle(fontSize: 11, color: Colors.white54)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          )
              .animate()
              .scale(duration: 400.ms, curve: Curves.easeOutBack)
              .shimmer(delay: 500.ms, duration: 1500.ms),
        ],
      ),
    ).animate().fadeIn(duration: 250.ms).slideX(begin: 0.05, end: 0);
  }

  // ══════════════════════════════════════════════════════════════
  // STEP 5: PHOTOS & LIVE PASS REVIEW
  // ══════════════════════════════════════════════════════════════
  Widget _buildStep5Review(bool isDark) {
    final price = double.tryParse(_priceController.text.trim()) ?? 0;
    final spots = int.tryParse(_maxSpotsController.text.trim()) ?? 1;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStepTitle('Step 5: Photos & Live Review', 'Upload hero media and preview your curated StayQ Experience ticket.'),
          const SizedBox(height: 16),

          // Cover Photo Upload Area
          _buildFieldHeader('Experience Cover Photo (Gallery)'),
          GestureDetector(
            onTap: _pickMedia,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              height: 180,
              width: double.infinity,
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: _selectedImage.isNotEmpty ? AppColors.primary : AppColors.primary.withValues(alpha: 0.3),
                  width: 2,
                ),
                image: _selectedImage.isNotEmpty
                    ? DecorationImage(
                        image: _selectedImage.startsWith('http')
                            ? NetworkImage(_selectedImage) as ImageProvider
                            : FileImage(File(_selectedImage)),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: _selectedImage.isEmpty
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.add_a_photo_rounded, color: AppColors.primary, size: 28),
                        ),
                        const SizedBox(height: 10),
                        const Text('Upload High-Res Cover Photo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 4),
                        const Text('Tap to select from device gallery', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                      ],
                    )
                  : Stack(
                      children: [
                        Positioned(
                          bottom: 12,
                          right: 12,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.7),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.edit, color: Colors.white, size: 14),
                                SizedBox(width: 4),
                                Text('Change Photo', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
            ),
          ),
          const SizedBox(height: 24),

          // Live Card Pass Preview
          _buildFieldHeader('Live Traveler Feed Preview'),
          Container(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: isDark ? Colors.white10 : AppColors.borderLight),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 18,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Image or Placeholder
                Container(
                  height: 150,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                    image: _selectedImage.isNotEmpty
                        ? DecorationImage(
                            image: _selectedImage.startsWith('http')
                                ? NetworkImage(_selectedImage) as ImageProvider
                                : FileImage(File(_selectedImage)),
                            fit: BoxFit.cover,
                          )
                        : null,
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        top: 12,
                        left: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.75),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.auto_awesome, color: Colors.amber, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                _selectedCategory.replaceAll('_', ' '),
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10),
                              ),
                            ],
                          ),
                        ),
                      ),
                      Positioned(
                        top: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '$spots SPOTS LEFT',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 10),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _titleController.text.isNotEmpty ? _titleController.text : 'Curated StayQ Experience',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.location_on, size: 14, color: AppColors.primary),
                          const SizedBox(width: 4),
                          Text(
                            _cityController.text.isNotEmpty ? _cityController.text : 'India',
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                          const SizedBox(width: 12),
                          const Icon(Icons.access_time_filled_rounded, size: 14, color: Colors.amber),
                          const SizedBox(width: 4),
                          Text(
                            _durationController.text,
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          RichText(
                            text: TextSpan(
                              children: [
                                TextSpan(
                                  text: '₹${price.toStringAsFixed(0)} ',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: isDark ? Colors.white : AppColors.textPrimary,
                                  ),
                                ),
                                const TextSpan(
                                  text: '/ guest',
                                  style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              gradient: AppColors.primaryGradient,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text('Book Experience', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 250.ms).slideX(begin: 0.05, end: 0);
  }

  // ══════════════════════════════════════════════════════════════
  // BOTTOM NAVIGATION BAR
  // ══════════════════════════════════════════════════════════════
  Widget _buildBottomNavBar(bool isDark) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        border: Border(top: BorderSide(color: isDark ? Colors.white10 : AppColors.borderLight)),
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            BouncingWidget(
              onTap: () => _goToStep(_currentStep - 1),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white10 : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.arrow_back_rounded, size: 18),
                    SizedBox(width: 4),
                    Text('Back', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  ],
                ),
              ),
            ),
          const SizedBox(width: 12),
          Expanded(
            child: BouncingWidget(
              onTap: _nextStep,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  gradient: _currentStep == 4
                      ? const LinearGradient(
                          colors: [Color(0xFF059669), Color(0xFF10B981)],
                        )
                      : AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: [
                    BoxShadow(
                      color: (_currentStep == 4 ? const Color(0xFF10B981) : AppColors.primary).withValues(alpha: 0.35),
                      blurRadius: 14,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _currentStep == 4 ? '🚀 Publish Curated Experience' : 'Continue to Next Step',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    const SizedBox(width: 8),
                    Icon(_currentStep == 4 ? Icons.check_circle_rounded : Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════
  // HELPER WIDGETS
  // ══════════════════════════════════════════════════════════════
  Widget _buildStepTitle(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
        const SizedBox(height: 4),
        Text(subtitle, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
      ],
    );
  }

  Widget _buildFieldHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        title,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    void Function(String)? onChanged,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      onChanged: onChanged,
      style: TextStyle(fontSize: 14, color: isDark ? Colors.white : AppColors.textPrimary),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(fontSize: 13, color: AppColors.textMuted),
        prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
        filled: true,
        fillColor: isDark ? const Color(0xFF1E293B) : Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }

  Widget _buildToggleTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool value,
    required ValueChanged<bool> onChanged,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
          ),
          Switch(
            value: value,
            activeThumbColor: Colors.white,
            activeTrackColor: AppColors.primary,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildRadioOption({
    required String title,
    required String subtitle,
    required bool isSelected,
    required VoidCallback onTap,
    required IconData icon,
    required bool isDark,
  }) {
    return BouncingWidget(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.12)
              : (isDark ? const Color(0xFF1E293B) : Colors.white),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isSelected ? AppColors.primary : (isDark ? Colors.white10 : AppColors.borderLight),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: isSelected ? AppColors.primary : AppColors.textMuted),
            const SizedBox(height: 8),
            Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: isSelected ? AppColors.primary : null)),
            Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
          ],
        ),
      ),
    );
  }
}

import 'dart:ui';
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:syncfusion_flutter_datepicker/datepicker.dart';
import 'package:http/http.dart' as http;
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../config/app_config.dart';
import '../../constants/stay_amenities.dart';
import 'search_results_screen.dart';

class SearchFilterModal extends StatefulWidget {
  const SearchFilterModal({super.key});

  @override
  State<SearchFilterModal> createState() => _SearchFilterModalState();
}

class _SearchFilterModalState extends State<SearchFilterModal> {
  late TextEditingController _destController;
  late int _adults;
  late int _children;
  late int _infants;
  late int _pets;
  DateTimeRange? _dateRange;
  RangeValues _priceRange = const RangeValues(500, 50000);
  bool? _isStayingWithHost;
  final Set<String> _selectedAmenities = {};

  final List<String> _popularDestinations = [
    'Goa',
    'Manali, Himachal Pradesh',
    'Udaipur, Rajasthan',
    'Wayanad, Kerala',
    'Indiranagar, Bengaluru',
  ];

  List<String> _predictions = [];
  Timer? _debounce;
  bool _isSearching = false;

  final String _placesApiKey = AppConfig.googlePlacesApiKey;

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<AppProvider>(context, listen: false);
    _destController = TextEditingController(text: provider.searchDestination);
    _adults = provider.adultsCount;
    _children = provider.childrenCount;
    _infants = provider.infantsCount;
    _pets = provider.petsCount;
    _dateRange = provider.selectedDateRange;
    _destController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _destController.removeListener(_onSearchChanged);
    _destController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchChanged() {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      final input = _destController.text;
      if (input.isNotEmpty) {
        _fetchAutocomplete(input);
      } else {
        if (mounted) {
          setState(() {
            _predictions = [];
            _isSearching = false;
          });
        }
      }
    });
  }

  Future<void> _fetchAutocomplete(String input) async {
    if (!mounted) return;
    setState(() => _isSearching = true);
    final url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${Uri.encodeComponent(input)}&key=$_placesApiKey';
    try {
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'OK' && mounted) {
          setState(() {
            _predictions = (data['predictions'] as List)
                .map((p) => p['description'] as String)
                .toList();
            _isSearching = false;
          });
          return;
        }
      }
    } catch (e) {
      // ignore
    }
    if (mounted) {
      setState(() {
        _predictions = [];
        _isSearching = false;
      });
    }
  }

  void _selectDestination(String dest) {
    _destController.removeListener(_onSearchChanged);
    _destController.text = dest;
    setState(() {
      _predictions = [];
      _isSearching = false;
    });
    _destController.addListener(_onSearchChanged);
    FocusScope.of(context).unfocus();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.92,
      margin: const EdgeInsets.only(top: 24),
      decoration: const BoxDecoration(
        color: Colors.transparent,
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 25, sigmaY: 25),
          child: Container(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.85),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(40)),
              border: Border.all(color: Colors.white.withOpacity(0.5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle bar
                Center(
                  child: Container(
                    width: 48,
                    height: 5,
                    decoration: BoxDecoration(
                      color: AppColors.textMuted.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Refine Search',
                      style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.textPrimary, letterSpacing: -0.5),
                    ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.2),
                    Row(
                      children: [
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _destController.clear();
                              _dateRange = null;
                              _adults = 2;
                              _children = 0;
                              _infants = 0;
                              _pets = 0;
                              _priceRange = const RangeValues(500, 50000);
                              _isStayingWithHost = null;
                            });
                          },
                          child: const Text(
                            'Clear All',
                            style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                        const SizedBox(width: 4),
                        _BouncyButton(
                          onTap: () => Navigator.pop(context),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceLight.withOpacity(0.7),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.close_rounded, size: 20),
                          ),
                        ),
                      ],
                    ).animate().fadeIn(duration: 400.ms).scale(begin: const Offset(0.8, 0.8)),
                  ],
                ),
                
                const SizedBox(height: 24),

                // Stays vs Experiences Toggle
                Consumer<AppProvider>(
                  builder: (context, provider, _) {
                    final isExp = provider.searchExperiencesOnly;
                    return Container(
                      height: 54,
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceLight.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(30),
                        border: Border.all(color: Colors.white.withOpacity(0.8), width: 1.5),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, 4))
                        ],
                      ),
                      child: Stack(
                        children: [
                          AnimatedAlign(
                            duration: const Duration(milliseconds: 400),
                            curve: Curves.fastOutSlowIn,
                            alignment: isExp ? Alignment.centerRight : Alignment.centerLeft,
                            child: FractionallySizedBox(
                              widthFactor: 0.5,
                              heightFactor: 1.0,
                              child: Container(
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [AppColors.primary, AppColors.accent],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(26),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primary.withOpacity(0.3),
                                      blurRadius: 8,
                                      offset: const Offset(0, 3),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          Row(
                            children: [
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => provider.toggleSearchExperiencesOnly(false),
                                  behavior: HitTestBehavior.opaque,
                                  child: Center(
                                    child: AnimatedDefaultTextStyle(
                                      duration: const Duration(milliseconds: 250),
                                      style: TextStyle(
                                        fontFamily: 'Inter',
                                        fontWeight: !isExp ? FontWeight.w800 : FontWeight.w600,
                                        color: !isExp ? Colors.white : AppColors.textPrimary.withOpacity(0.6),
                                        fontSize: 16,
                                        letterSpacing: -0.3,
                                      ),
                                      child: const Text('Stays'),
                                    ),
                                  ),
                                ),
                              ),
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => provider.toggleSearchExperiencesOnly(true),
                                  behavior: HitTestBehavior.opaque,
                                  child: Center(
                                    child: AnimatedDefaultTextStyle(
                                      duration: const Duration(milliseconds: 250),
                                      style: TextStyle(
                                        fontFamily: 'Inter',
                                        fontWeight: isExp ? FontWeight.w800 : FontWeight.w600,
                                        color: isExp ? Colors.white : AppColors.textPrimary.withOpacity(0.6),
                                        fontSize: 16,
                                        letterSpacing: -0.3,
                                      ),
                                      child: const Text('Experiences'),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.2, curve: Curves.easeOutCirc);
                  },
                ),

                const SizedBox(height: 24),

                Expanded(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Destination Input
                        const _SectionTitle('Where'),
                        const SizedBox(height: 12),
                        Container(
                          decoration: BoxDecoration(
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 15, offset: const Offset(0, 5))
                            ]
                          ),
                          child: TextField(
                            controller: _destController,
                            style: const TextStyle(fontWeight: FontWeight.w600),
                            decoration: InputDecoration(
                              hintText: 'Search destinations',
                              hintStyle: TextStyle(color: AppColors.textMuted.withOpacity(0.8), fontWeight: FontWeight.normal),
                              prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
                              suffixIcon: _isSearching 
                                  ? const Padding(
                                      padding: EdgeInsets.all(12),
                                      child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
                                    ) 
                                  : _destController.text.isNotEmpty 
                                      ? IconButton(
                                          icon: const Icon(Icons.clear_rounded, color: AppColors.textMuted),
                                          onPressed: () {
                                            _destController.clear();
                                            setState(() => _predictions = []);
                                          },
                                        )
                                      : null,
                              filled: true,
                              fillColor: Colors.white,
                              contentPadding: const EdgeInsets.symmetric(vertical: 18),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(20),
                                borderSide: BorderSide.none,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        
                        if (_predictions.isNotEmpty) ...[
                          Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))
                              ]
                            ),
                            child: Column(
                              children: _predictions.map((p) => ListTile(
                                leading: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(color: AppColors.surfaceLight, borderRadius: BorderRadius.circular(8)),
                                  child: const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 18),
                                ),
                                title: Text(p, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary)),
                                onTap: () => _selectDestination(p),
                              )).toList(),
                            ),
                          ).animate().fadeIn(duration: 200.ms).slideY(begin: 0.1),
                          const SizedBox(height: 24),
                        ] else if (_destController.text.isEmpty) ...[
                          Wrap(
                            spacing: 10,
                            runSpacing: 10,
                            children: _popularDestinations.map((dest) {
                              return _BouncyButton(
                                onTap: () => _selectDestination(dest),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.7),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: AppColors.borderLight.withOpacity(0.5)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.location_on_rounded, size: 14, color: AppColors.primary),
                                      const SizedBox(width: 6),
                                      Text(dest, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                                    ],
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 32),
                        ],

                        // Dates Calendar
                        const _SectionTitle('When?'),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 15, offset: const Offset(0, 5))
                            ]
                          ),
                          child: SfDateRangePicker(
                            selectionMode: DateRangePickerSelectionMode.range,
                            initialSelectedRange: _dateRange != null 
                              ? PickerDateRange(_dateRange!.start, _dateRange!.end)
                              : null,
                            minDate: DateTime.now(),
                            maxDate: DateTime.now().add(const Duration(days: 365)),
                            onSelectionChanged: (DateRangePickerSelectionChangedArgs args) {
                              if (args.value is PickerDateRange) {
                                final range = args.value as PickerDateRange;
                                if (range.startDate != null && range.endDate != null) {
                                  setState(() {
                                    _dateRange = DateTimeRange(start: range.startDate!, end: range.endDate!);
                                  });
                                }
                              }
                            },
                            monthCellStyle: const DateRangePickerMonthCellStyle(
                              textStyle: TextStyle(fontWeight: FontWeight.w500, color: AppColors.textPrimary),
                              todayTextStyle: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary),
                            ),
                            rangeSelectionColor: AppColors.primary.withOpacity(0.15),
                            startRangeSelectionColor: AppColors.primary,
                            endRangeSelectionColor: AppColors.primary,
                            todayHighlightColor: AppColors.primary,
                            selectionTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            headerStyle: const DateRangePickerHeaderStyle(
                              textStyle: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                            ),
                          ),
                        ),

                        const SizedBox(height: 32),

                        // Price Range
                        const _SectionTitle('Price range per night'),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 15, offset: const Offset(0, 5))
                            ]
                          ),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text('₹${_priceRange.start.round()}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.primary)),
                                  Text('₹${_priceRange.end.round()}+', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.primary)),
                                ],
                              ),
                              const SizedBox(height: 16),
                              SliderTheme(
                                data: SliderTheme.of(context).copyWith(
                                  activeTrackColor: AppColors.primary,
                                  inactiveTrackColor: AppColors.primary.withOpacity(0.1),
                                  thumbColor: AppColors.primary,
                                  overlayColor: AppColors.primary.withOpacity(0.2),
                                  trackHeight: 6,
                                  thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 14, elevation: 4),
                                  overlayShape: const RoundSliderOverlayShape(overlayRadius: 24),
                                ),
                                child: RangeSlider(
                                  values: _priceRange,
                                  min: 500,
                                  max: 50000,
                                  divisions: 100,
                                  onChanged: (values) {
                                    setState(() {
                                      _priceRange = values;
                                    });
                                  },
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 32),

                        // Guests Counter Section
                        const _SectionTitle('Who\'s coming?'),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 15, offset: const Offset(0, 5))
                            ]
                          ),
                          child: Column(
                            children: [
                              _GuestCounterRow(
                                title: 'Adults',
                                subtitle: 'Ages 13 or above',
                                count: _adults,
                                onDecremented: () => setState(() => _adults = _adults > 1 ? _adults - 1 : 1),
                                onIncremented: () => setState(() => _adults++),
                              ),
                              Divider(height: 1, color: AppColors.borderLight.withOpacity(0.5)),
                              _GuestCounterRow(
                                title: 'Children',
                                subtitle: 'Ages 2–12',
                                count: _children,
                                onDecremented: () => setState(() => _children = _children > 0 ? _children - 1 : 0),
                                onIncremented: () => setState(() => _children++),
                              ),
                              Divider(height: 1, color: AppColors.borderLight.withOpacity(0.5)),
                              _GuestCounterRow(
                                title: 'Infants',
                                subtitle: 'Under 2',
                                count: _infants,
                                onDecremented: () => setState(() => _infants = _infants > 0 ? _infants - 1 : 0),
                                onIncremented: () => setState(() => _infants++),
                              ),
                              Divider(height: 1, color: AppColors.borderLight.withOpacity(0.5)),
                              _GuestCounterRow(
                                title: 'Pets',
                                subtitle: 'Bringing a service animal?',
                                count: _pets,
                                onDecremented: () => setState(() => _pets = _pets > 0 ? _pets - 1 : 0),
                                onIncremented: () => setState(() => _pets++),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 32),

                        // Staying with Host Filter Section
                        const _SectionTitle('Property Type & Host Presence'),
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 15, offset: const Offset(0, 5))
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Choose your preferred stay style',
                                style: TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                              ),
                              const SizedBox(height: 14),
                              Row(
                                children: [
                                  Expanded(
                                    child: _HostOptionCard(
                                      title: 'All Stays',
                                      subtitle: 'Show all places',
                                      icon: Icons.holiday_village_rounded,
                                      isSelected: _isStayingWithHost == null,
                                      onTap: () => setState(() => _isStayingWithHost = null),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _HostOptionCard(
                                      title: 'With Host',
                                      subtitle: 'Homestay / Shared',
                                      icon: Icons.people_alt_rounded,
                                      isSelected: _isStayingWithHost == true,
                                      onTap: () => setState(() => _isStayingWithHost = true),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _HostOptionCard(
                                      title: 'Entire Place',
                                      subtitle: 'Private home',
                                      icon: Icons.vpn_key_rounded,
                                      isSelected: _isStayingWithHost == false,
                                      onTap: () => setState(() => _isStayingWithHost = false),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 32),

                        // Official 25 Stay Q Amenities Filter Section
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const _SectionTitle('Amenities & Perks'),
                            if (_selectedAmenities.isNotEmpty)
                              TextButton(
                                onPressed: () => setState(() => _selectedAmenities.clear()),
                                child: const Text('Clear', style: TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.bold)),
                              ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 15, offset: const Offset(0, 5))
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Filter stays having specific amenities',
                                style: TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                              ),
                              const SizedBox(height: 14),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: StayAmenities.all.map((item) {
                                  final isSelected = _selectedAmenities.contains(item.value);
                                  return InkWell(
                                    onTap: () {
                                      setState(() {
                                        if (isSelected) {
                                          _selectedAmenities.remove(item.value);
                                        } else {
                                          _selectedAmenities.add(item.value);
                                        }
                                      });
                                    },
                                    borderRadius: BorderRadius.circular(14),
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 150),
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: isSelected ? AppColors.primary.withValues(alpha: 0.12) : AppColors.surfaceLight,
                                        borderRadius: BorderRadius.circular(14),
                                        border: Border.all(
                                          color: isSelected ? AppColors.primary : AppColors.borderLight,
                                          width: isSelected ? 1.5 : 1,
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(item.icon, size: 16, color: isSelected ? AppColors.primary : AppColors.textSecondary),
                                          const SizedBox(width: 6),
                                          Text(
                                            item.title,
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                              color: isSelected ? AppColors.primary : AppColors.textPrimary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 80),
                      ],
                    ),
                  ),
                ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),

                // Search Button
                _BouncyButton(
                  onTap: () {
                    final provider = Provider.of<AppProvider>(context, listen: false);
                    provider.updateSearch(
                      destination: _destController.text,
                      dateRange: _dateRange,
                      adults: _adults,
                      children: _children,
                      infants: _infants,
                      pets: _pets,
                      minPrice: _priceRange.start,
                      maxPrice: _priceRange.end,
                      isStayingWithHost: _isStayingWithHost,
                    );
                    final nav = Navigator.of(context);
                    // Close modal first, then navigate to results
                    nav.pop();
                    nav.push(
                      MaterialPageRoute(
                        builder: (_) => const SearchResultsScreen(),
                      ),
                    );
                  },
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppColors.primary, AppColors.accent],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 6)),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.search_rounded, color: Colors.white, size: 22),
                        const SizedBox(width: 8),
                        Consumer<AppProvider>(
                          builder: (context, provider, _) {
                            return Text(
                              provider.searchExperiencesOnly ? 'Show Experiences' : 'Show Places',
                              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 0.2),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle(this.title);

  @override
  Widget build(BuildContext context) {
    return Text(
      title, 
      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary, letterSpacing: -0.3)
    );
  }
}

class _BouncyButton extends StatefulWidget {
  final Widget child;
  final VoidCallback onTap;

  const _BouncyButton({required this.child, required this.onTap});

  @override
  State<_BouncyButton> createState() => _BouncyButtonState();
}

class _BouncyButtonState extends State<_BouncyButton> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _isPressed = false),
      child: widget.child.animate(target: _isPressed ? 1 : 0).scale(
        begin: const Offset(1, 1),
        end: const Offset(0.92, 0.92),
        duration: 150.ms,
        curve: Curves.easeOutQuad,
      ),
    );
  }
}

class _GuestCounterRow extends StatelessWidget {
  final String title;
  final String subtitle;
  final int count;
  final VoidCallback onDecremented;
  final VoidCallback onIncremented;

  const _GuestCounterRow({
    required this.title,
    required this.subtitle,
    required this.count,
    required this.onDecremented,
    required this.onIncremented,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              const SizedBox(height: 4),
              Text(subtitle, style: TextStyle(fontSize: 13, color: AppColors.textSecondary.withOpacity(0.8), fontWeight: FontWeight.w500)),
            ],
          ),
          Row(
            children: [
              _BouncyButton(
                onTap: onDecremented,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: count > 0 ? AppColors.surfaceLight : AppColors.surfaceLight.withOpacity(0.3),
                    shape: BoxShape.circle,
                    border: Border.all(color: count > 0 ? AppColors.primary.withOpacity(0.2) : Colors.transparent),
                  ),
                  child: Icon(
                    Icons.remove_rounded,
                    size: 20,
                    color: count > 0 ? AppColors.primary : AppColors.textMuted,
                  ),
                ),
              ),
              SizedBox(
                width: 36,
                child: Center(
                  child: Text(
                    '$count', 
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)
                  ),
                ),
              ),
              _BouncyButton(
                onTap: onIncremented,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.1),
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                  ),
                  child: const Icon(
                    Icons.add_rounded,
                    size: 20,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HostOptionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _HostOptionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return _BouncyButton(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withOpacity(0.08) : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.borderLight,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              size: 22,
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
            ),
            const SizedBox(height: 6),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                color: isSelected ? AppColors.primary : AppColors.textPrimary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.textMuted,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

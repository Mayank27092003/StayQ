import 'package:provider/provider.dart';
import '../../../../providers/host_onboarding_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';

class QubeAiListingAssistantWidget extends StatefulWidget {
  final Function(String title, String description, List<String> amenities, int suggestedPrice)? onApplyMagic;

  const QubeAiListingAssistantWidget({Key? key, this.onApplyMagic}) : super(key: key);

  @override
  State<QubeAiListingAssistantWidget> createState() => _QubeAiListingAssistantWidgetState();
}

class _QubeAiListingAssistantWidgetState extends State<QubeAiListingAssistantWidget> {
  final TextEditingController _promptController = TextEditingController();
  bool _isGenerating = false;
  bool _hasGenerated = false;

  String _generatedTitle = '';
  String _generatedDesc = '';
  int _generatedPrice = 12500;
  List<String> _suggestedAmenities = [];

  final List<String> _sampleKeywords = [
    '3BHK Goa pool villa',
    'Manali cedar snow cabin',
    'Udaipur lakefront haveli',
    'Wayanad tea plantation cottage',
    'Luxury Caravan with stargazing roof',
  ];

  Future<void> _generateListing(String query) async {
    if (_isGenerating) return;
    final p = context.read<HostOnboardingProvider>();
    if (p.city.trim().isEmpty || p.description.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter the property location and description first.'))); return;
    }
    setState(() {
      _generatedTitle = p.title.trim().isNotEmpty ? p.title.trim() : '${p.bedrooms}-bedroom ${p.propertyType.toLowerCase().replaceAll('_', ' ')} in ${p.city}';
      _generatedDesc = '${p.description.trim()}\n\n${p.bedrooms} bedrooms, ${p.bathrooms} bathrooms. Maximum ${p.maxGuests} guests.';
      if (p.amenities.isNotEmpty) _generatedDesc += '\nAmenities entered by the host: ${p.amenities.join(', ')}.';
      _generatedPrice = p.pricePerNight.round();
      _suggestedAmenities = List<String>.from(p.amenities);
      _isGenerating = false; _hasGenerated = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E1B2E) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.25), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with Mascot Avatar
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.auto_awesome_rounded, color: AppColors.primary, size: 22),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Listing draft helper',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    Text(
                      'Build a draft from your entered property facts; review before applying',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Quick Tag Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: _sampleKeywords.map((kw) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ActionChip(
                    label: Text(kw),
                    onPressed: () {
                      _promptController.text = kw;
                      _generateListing(kw);
                    },
                    backgroundColor: AppColors.primary.withValues(alpha: 0.08),
                    labelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primary),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 12),

          // Input Box & Action Button
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _promptController,
                  decoration: InputDecoration(
                    hintText: 'e.g. 4bhk villa in Coorg with coffee estate',
                    hintStyle: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    filled: true,
                    fillColor: isDark ? const Color(0xFF28253B) : AppColors.surfaceLight,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onSubmitted: (v) => _generateListing(v),
                ),
              ),
              const SizedBox(width: 10),
              ElevatedButton(
                onPressed: _isGenerating ? null : () => _generateListing(_promptController.text),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: _isGenerating
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Row(
                        children: [
                          Icon(Icons.bolt_rounded, size: 18, color: Colors.white),
                          SizedBox(width: 4),
                          Text('Magic', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ],
                      ),
              ),
            ],
          ),

          // Generated Output Preview Card
          if (_hasGenerated) ...[
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 16),
                          SizedBox(width: 6),
                          Text('AI DRAFT READY', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF10B981))),
                        ],
                      ),
                      Text('Suggested: ₹$_generatedPrice/night', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(_generatedTitle, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  const SizedBox(height: 6),
                  Text(_generatedDesc, style: const TextStyle(fontSize: 12, height: 1.4, color: AppColors.textSecondary)),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        AppMotion.tapSelection();
                        widget.onApplyMagic?.call(_generatedTitle, _generatedDesc, _suggestedAmenities, _generatedPrice);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('✨ Applied AI Title, Description & Pricing!'),
                            backgroundColor: Color(0xFF10B981),
                          ),
                        );
                      },
                      icon: const Icon(Icons.download_done_rounded, size: 18, color: Colors.white),
                      label: const Text('Apply to Listing Form', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF10B981),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1),
          ],
        ],
      ),
    );
  }
}

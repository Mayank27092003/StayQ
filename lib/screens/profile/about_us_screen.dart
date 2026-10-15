import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';

class AboutUsScreen extends StatefulWidget {
  const AboutUsScreen({super.key});

  @override
  State<AboutUsScreen> createState() => _AboutUsScreenState();
}

class _AboutUsScreenState extends State<AboutUsScreen> {
  bool _isDeleting = false;

  Future<void> _launchUrl(String urlString) async {
    final uri = Uri.parse(urlString);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _confirmDeleteAccount(BuildContext context, AppProvider provider) {
    showCupertinoDialog(
      context: context,
      builder: (dialogCtx) => CupertinoAlertDialog(
        title: const Text('Delete StayQ Account?'),
        content: const Padding(
          padding: EdgeInsets.only(top: 8.0),
          child: Text(
            'This action is irreversible. In compliance with data privacy regulations, all your account profile records, booking history, verified KYC tokens, and StayQ Club Pass reward credits will be permanently purged.',
          ),
        ),
        actions: [
          CupertinoDialogAction(
            child: const Text('Cancel'),
            onPressed: () => Navigator.pop(dialogCtx),
          ),
          CupertinoDialogAction(
            isDestructiveAction: true,
            child: const Text('Delete Permanently'),
            onPressed: () async {
              Navigator.pop(dialogCtx);
              setState(() => _isDeleting = true);
              final messenger = ScaffoldMessenger.of(context);
              final navigator = Navigator.of(context, rootNavigator: true);
              final success = await provider.deleteAccount();
              if (!mounted) return;
              setState(() => _isDeleting = false);

              messenger.showSnackBar(
                SnackBar(
                  content: Text(
                    success
                        ? 'Your StayQ account and data have been scheduled for immediate permanent deletion.'
                        : provider.sessionError ?? 'Account deletion failed. Please ensure you have signed in recently.',
                  ),
                  backgroundColor: success ? Colors.green.shade800 : Colors.red.shade800,
                  behavior: SnackBarBehavior.floating,
                ),
              );

              if (success) {
                navigator.pushNamedAndRemoveUntil(
                  '/login',
                  (route) => false,
                );
              }
            },
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final isDark = provider.isDarkMode;
    final bg = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);
    final cardBg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final textColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final mutedText = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final borderCol = isDark ? Colors.white.withValues(alpha: 0.1) : const Color(0xFFE2E8F0);

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: bg,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'About StayQ',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: textColor,
            letterSpacing: -0.4,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ─── HERO BRAND BANNER ───
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF5A31F4), Color(0xFF7C3AED), Color(0xFF38BDF8)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF5A31F4).withValues(alpha: 0.35),
                    blurRadius: 24,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.verified_rounded, color: Colors.white, size: 14),
                            SizedBox(width: 5),
                            Text(
                              'QUATALYST TECHNOLOGIES',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10.5,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.8,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'v1.4.2 • Build 248',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  const Text(
                    'More Than A Place To Stay.\nIt’s Where Uncharted India Begins.',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      height: 1.22,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Stay Q was engineered by Quatalyst Private Limited to reinvent Indian travel and long-stay living: combining 0% brokerage residences, private pool heritage villas, 4x4 expedition campervans, and heated alpine glamping in one seamless ecosystem.',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      height: 1.5,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ─── VERIFIED STATS ───
            Row(
              children: [
                _buildStatCard('1,420+', 'Verified Stays', 'Across 28+ States', const Color(0xFF7C3AED), cardBg, borderCol, textColor, mutedText),
                const SizedBox(width: 12),
                _buildStatCard('0%', 'Brokerage', 'On Long-Term Homes', const Color(0xFF10B981), cardBg, borderCol, textColor, mutedText),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildStatCard('30', 'Overland Routes', 'Ladakh to Kerala', const Color(0xFFF59E0B), cardBg, borderCol, textColor, mutedText),
                const SizedBox(width: 12),
                _buildStatCard('4.98 ★', 'Guest Rating', 'Based on 1,400+ Stays', const Color(0xFF06B6D4), cardBg, borderCol, textColor, mutedText),
              ],
            ),

            const SizedBox(height: 28),

            // ─── SECTION: 4 VERTICALS ───
            Text(
              'THE STAYQ ECOSYSTEM',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF7C3AED),
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 12),

            _buildVerticalCard(
              icon: Icons.cottage_rounded,
              color: const Color(0xFF5A31F4),
              badge: 'Curated Luxury',
              title: 'Homestays & Villas',
              subtitle: 'Private Pool Estates & Mountain Glass Cabins',
              features: [
                '100% verified on-ground host inspection',
                'Private pool villas, heritage havelis & pine forest cabins',
                'Direct host booking with zero hidden convenience fees',
              ],
              cardBg: cardBg,
              borderCol: borderCol,
              textColor: textColor,
              mutedText: mutedText,
            ),
            const SizedBox(height: 14),

            _buildVerticalCard(
              icon: Icons.key_rounded,
              color: const Color(0xFF10B981),
              badge: '0% Brokerage Forever',
              title: '11-Month Home Rentals',
              subtitle: 'Direct Owner Connect & Digital Agreements',
              features: [
                'Zero brokerage fees for tenants forever',
                'Direct chat & video tours with verified owners',
                'Legally vetted 11-month digital rental lease contracts',
              ],
              cardBg: cardBg,
              borderCol: borderCol,
              textColor: textColor,
              mutedText: mutedText,
            ),
            const SizedBox(height: 14),

            _buildVerticalCard(
              icon: Icons.alt_route_rounded,
              color: const Color(0xFFF59E0B),
              badge: 'Overlanding India',
              title: '4x4 Caravans & RVs',
              subtitle: 'Self-Drive Overland Expeditions Across the Himalayas',
              features: [
                'Expedition-grade 4x4 campervans with pop-up tents & kitchenettes',
                'Verified routes across Ladakh, Spiti, Himachal & Kerala',
                'Complete 24/7 off-grid roadside assistance & camp gear',
              ],
              cardBg: cardBg,
              borderCol: borderCol,
              textColor: textColor,
              mutedText: mutedText,
            ),
            const SizedBox(height: 14),

            _buildVerticalCard(
              icon: Icons.night_shelter_rounded,
              color: const Color(0xFF06B6D4),
              badge: 'Alpine Glamping',
              title: 'Camps & Geodesic Domes',
              subtitle: 'High-Altitude Stargazing & Riverside Campsites',
              features: [
                'Heated all-weather panoramic glass domes at 11,500 ft',
                'Verified campsites with clean sanitation, campfires & safety',
                'Stargazing gear, sunrise yoga & guided valley treks',
              ],
              cardBg: cardBg,
              borderCol: borderCol,
              textColor: textColor,
              mutedText: mutedText,
            ),

            const SizedBox(height: 28),

            // ─── SECTION: OUR STORY & TIMELINE ───
            Text(
              'OUR ORIGIN STORY',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF7C3AED),
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: borderCol),
              ),
              child: Column(
                children: [
                  _buildTimelineItem(
                    step: 'THE PROBLEM',
                    title: 'The Broken Indian Rental & Stays Market',
                    desc: 'Inflated broker commissions, misleading photos, chaotic fragmented campervan operators, and lack of verified experiential stays.',
                    icon: Icons.report_problem_rounded,
                    color: const Color(0xFFEF4444),
                    textColor: textColor,
                    mutedText: mutedText,
                  ),
                  Divider(color: borderCol, height: 28),
                  _buildTimelineItem(
                    step: 'THE INNOVATION',
                    title: 'Stay Q by Quatalyst Technologies',
                    desc: 'A singular, unified hospitality ecosystem connecting direct owners, 4x4 RVs, alpine domes, and long-term rentals with 0% brokerage.',
                    icon: Icons.auto_awesome_rounded,
                    color: const Color(0xFF5A31F4),
                    textColor: textColor,
                    mutedText: mutedText,
                  ),
                  Divider(color: borderCol, height: 28),
                  _buildTimelineItem(
                    step: 'THE EXPERIENCE',
                    title: '3D Digital Immersion & Qube AI',
                    desc: 'Every villa and caravan comes with high-resolution walkthroughs and intelligent route planning, ensuring zero surprises.',
                    icon: Icons.explore_rounded,
                    color: const Color(0xFF10B981),
                    textColor: textColor,
                    mutedText: mutedText,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // ─── OFFICIAL CONTACT DESKS ───
            Text(
              'OFFICIAL DESKS & SUPPORT',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF7C3AED),
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: borderCol),
              ),
              child: Column(
                children: [
                  _buildContactTile(
                    icon: Icons.handshake_rounded,
                    iconColor: const Color(0xFFF59E0B),
                    title: 'Partnerships & Host Inquiries',
                    detail: 'hello@stayq.space',
                    onTap: () => _launchUrl('mailto:hello@stayq.space?subject=StayQ%20Partnership%20Inquiry'),
                    textColor: textColor,
                    mutedText: mutedText,
                  ),
                  Divider(color: borderCol, height: 20),
                  _buildContactTile(
                    icon: Icons.headset_mic_rounded,
                    iconColor: const Color(0xFF7C3AED),
                    title: 'Guest & Member Support',
                    detail: 'support@stayq.space',
                    onTap: () => _launchUrl('mailto:support@stayq.space?subject=StayQ%20Support%20Request'),
                    textColor: textColor,
                    mutedText: mutedText,
                  ),
                  Divider(color: borderCol, height: 20),
                  _buildContactTile(
                    icon: Icons.chat_rounded,
                    iconColor: const Color(0xFF22C55E),
                    title: 'Official WhatsApp Concierge',
                    detail: '+91 9225270718',
                    onTap: () => _launchUrl('https://wa.me/919225270718?text=Hi%20Stay%20Q%20Support'),
                    textColor: textColor,
                    mutedText: mutedText,
                  ),
                  Divider(color: borderCol, height: 20),
                  _buildContactTile(
                    icon: Icons.gavel_rounded,
                    iconColor: const Color(0xFF38BDF8),
                    title: 'Grievance Redressal Officer',
                    detail: 'grievance@stayq.space',
                    onTap: () => _launchUrl('mailto:grievance@stayq.space?subject=StayQ%20Grievance%20Notice'),
                    textColor: textColor,
                    mutedText: mutedText,
                  ),
                  Divider(color: borderCol, height: 20),
                  _buildContactTile(
                    icon: Icons.language_rounded,
                    iconColor: const Color(0xFF64748B),
                    title: 'Web Portal',
                    detail: 'https://stayq.space',
                    onTap: () => _launchUrl('https://stayq.space'),
                    textColor: textColor,
                    mutedText: mutedText,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // ─── SECTION: ACCOUNT MANAGEMENT & DATA PRIVACY ───
            Text(
              'ACCOUNT & DATA SOVEREIGNTY',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: const Color(0xFFEF4444),
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF2D1515) : const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: isDark ? const Color(0xFF7F1D1D) : const Color(0xFFFECACA),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEF4444).withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.delete_forever_rounded,
                          color: Color(0xFFEF4444),
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Delete StayQ Account',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                                color: isDark ? Colors.white : const Color(0xFF991B1B),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Data Privacy & Right to Be Forgotten',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? Colors.white70 : const Color(0xFFB91C1C),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'In accordance with Apple App Store and Google Play privacy guidelines, you can permanently request the deletion of your StayQ account, contact information, identity tokens, and transaction logs. This action cannot be undone.',
                    style: TextStyle(
                      fontSize: 12.5,
                      height: 1.45,
                      color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFF7F1D1D),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isDeleting || !provider.isLoggedIn
                          ? null
                          : () => _confirmDeleteAccount(context, provider),
                      icon: _isDeleting
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.delete_outline_rounded, size: 18),
                      label: Text(
                        _isDeleting
                            ? 'Deleting Account...'
                            : (!provider.isLoggedIn ? 'Sign In to Manage Account' : 'Permanently Delete My Account'),
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13.5),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFDC2626),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 36),

            // Footer note
            Center(
              child: Column(
                children: [
                  Text(
                    'StayQ Technologies Pvt Ltd • Quatalyst Inc.',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: mutedText,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Crafted with pride in India for modern explorers',
                    style: TextStyle(
                      fontSize: 11,
                      color: mutedText.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String val, String lbl, String sub, Color color, Color bg, Color border, Color textCol, Color muted) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              val,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                color: color,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              lbl,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w800,
                color: textCol,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              sub,
              style: TextStyle(
                fontSize: 10.5,
                color: muted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerticalCard({
    required IconData icon,
    required Color color,
    required String badge,
    required String title,
    required String subtitle,
    required List<String> features,
    required Color cardBg,
    required Color borderCol,
    required Color textColor,
    required Color mutedText,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: borderCol),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  badge,
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: textColor,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 12,
              color: mutedText,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 10),
          ...features.map(
            (f) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.check_circle_rounded, size: 14, color: color),
                  const SizedBox(width: 7),
                  Expanded(
                    child: Text(
                      f,
                      style: TextStyle(
                        fontSize: 12,
                        color: textColor.withValues(alpha: 0.85),
                        height: 1.35,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem({
    required String step,
    required String title,
    required String desc,
    required IconData icon,
    required Color color,
    required Color textColor,
    required Color mutedText,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: color, size: 18),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                step,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.8,
                  color: color,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                title,
                style: TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w800,
                  color: textColor,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                desc,
                style: TextStyle(
                  fontSize: 12,
                  color: mutedText,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildContactTile({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String detail,
    required VoidCallback onTap,
    required Color textColor,
    required Color mutedText,
  }) {
    return BouncingWidget(
      onTap: () {
        AppMotion.tapLight();
        onTap();
      },
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: textColor,
                  ),
                ),
                Text(
                  detail,
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w600,
                    color: iconColor,
                  ),
                ),
              ],
            ),
          ),
          Icon(Icons.arrow_forward_ios_rounded, size: 12, color: mutedText),
        ],
      ),
    );
  }
}

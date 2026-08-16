import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';

class CampingDetailsScreen extends StatefulWidget {
  const CampingDetailsScreen({Key? key}) : super(key: key);

  @override
  State<CampingDetailsScreen> createState() => _CampingDetailsScreenState();
}

class _CampingDetailsScreenState extends State<CampingDetailsScreen> {
  int _bedsProvided = 0;
  bool _hasFoodOptions = false;
  bool _hasTrekking = false;
  bool _hasFirstAid = true;
  bool _isEcoFriendly = false;

  final List<Map<String, dynamic>> _terrainOptions = [
    {'name': 'Forest', 'icon': Icons.park},
    {'name': 'Riverside', 'icon': Icons.water},
    {'name': 'Mountain', 'icon': Icons.terrain},
    {'name': 'Desert', 'icon': Icons.wb_sunny},
    {'name': 'Beach', 'icon': Icons.beach_access},
  ];

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<HostOnboardingProvider>(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Camping Details ⛺',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 8),
          const Text(
            'Make your campsite stand out! Tell us what makes your nature retreat special.',
            style: TextStyle(
              fontSize: 16,
              color: AppColors.textSecondary,
              height: 1.4,
            ),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 32),

          // 1. Terrain Type (Horizontal Cards)
          _buildSectionHeader('Terrain Type', Icons.landscape).animate().fadeIn(delay: 200.ms),
          const SizedBox(height: 16),
          SizedBox(
            height: 100,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _terrainOptions.length,
              separatorBuilder: (context, index) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final terrain = _terrainOptions[index];
                final isSelected = provider.terrainType == terrain['name'];
                
                return GestureDetector(
                  onTap: () {
                    provider.terrainType = terrain['name'] as String;
                    provider.notifyListeners();
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOutCubic,
                    width: 100,
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary : AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected ? AppColors.primary : AppColors.borderLight,
                        width: 2,
                      ),
                      boxShadow: isSelected
                          ? [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 4))]
                          : [],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          terrain['icon'] as IconData,
                          size: 32,
                          color: isSelected ? Colors.white : AppColors.textSecondary,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          terrain['name'] as String,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected ? Colors.white : AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ).animate().fadeIn(delay: (250 + (index * 50)).ms).slideY(begin: 0.2);
              },
            ),
          ),
          const SizedBox(height: 32),

          // 2. Accommodation Details
          _buildSectionHeader('Accommodation', Icons.home_filled).animate().fadeIn(delay: 400.ms),
          const SizedBox(height: 16),
          Container(
            decoration: BoxDecoration(
              color: AppColors.cardBg,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.borderLight),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, 4)),
              ],
            ),
            child: Column(
              children: [
                _buildCounterRow(
                  title: 'Tent Capacity',
                  subtitle: 'Guests per tent',
                  value: provider.tentCapacity,
                  onDecrement: () {
                    if (provider.tentCapacity > 1) {
                      provider.tentCapacity--;
                      provider.notifyListeners();
                    }
                  },
                  onIncrement: () {
                    provider.tentCapacity++;
                    provider.notifyListeners();
                  },
                ),
                const Divider(color: AppColors.borderLight, height: 1),
                _buildCounterRow(
                  title: 'Beds Provided',
                  subtitle: 'Mats, cots, or mattresses',
                  value: _bedsProvided,
                  onDecrement: () {
                    if (_bedsProvided > 0) setState(() => _bedsProvided--);
                  },
                  onIncrement: () {
                    setState(() => _bedsProvided++);
                  },
                ),
              ],
            ),
          ).animate().fadeIn(delay: 450.ms).slideY(begin: 0.1),
          const SizedBox(height: 32),

          // 3. Amenities
          _buildSectionHeader('Amenities & Dining', Icons.restaurant_menu).animate().fadeIn(delay: 500.ms),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildToggleCard(
                  title: 'Campfire',
                  icon: Icons.local_fire_department,
                  value: provider.hasCampfire,
                  activeColor: Colors.orangeAccent,
                  onChanged: (val) {
                    provider.hasCampfire = val;
                    provider.notifyListeners();
                  },
                ).animate().fadeIn(delay: 550.ms).slideX(begin: -0.1),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildToggleCard(
                  title: 'Food Prov.',
                  icon: Icons.fastfood,
                  value: _hasFoodOptions,
                  activeColor: Colors.green,
                  onChanged: (val) => setState(() => _hasFoodOptions = val),
                ).animate().fadeIn(delay: 600.ms).slideX(begin: 0.1),
              ),
            ],
          ),
          const SizedBox(height: 32),

          // 4. Activities & Trekking
          _buildSectionHeader('Activities', Icons.directions_walk).animate().fadeIn(delay: 650.ms),
          const SizedBox(height: 16),
          _buildSwitchTile(
            title: 'Trekking Trails Available',
            subtitle: 'Access to nearby hiking paths',
            icon: Icons.hiking,
            value: _hasTrekking,
            onChanged: (val) => setState(() => _hasTrekking = val),
          ).animate().fadeIn(delay: 700.ms).scale(),
          const SizedBox(height: 32),

          // 5. Safety & Eco-Friendly
          _buildSectionHeader('Safety & Environment', Icons.health_and_safety).animate().fadeIn(delay: 750.ms),
          const SizedBox(height: 16),
          _buildSwitchTile(
            title: 'First Aid on Site',
            subtitle: 'Medical kits and emergency support',
            icon: Icons.medical_services,
            value: _hasFirstAid,
            onChanged: (val) => setState(() => _hasFirstAid = val),
          ).animate().fadeIn(delay: 800.ms).scale(),
          const SizedBox(height: 12),
          _buildSwitchTile(
            title: 'Eco-Friendly Features',
            subtitle: 'Solar power, waste recycling, etc.',
            icon: Icons.eco,
            value: _isEcoFriendly,
            onChanged: (val) => setState(() => _isEcoFriendly = val),
          ).animate().fadeIn(delay: 850.ms).scale(),
          
          const SizedBox(height: 60),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: AppColors.primary, size: 24),
        const SizedBox(width: 12),
        Text(
          title,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildCounterRow({
    required String title,
    required String subtitle,
    required int value,
    required VoidCallback onDecrement,
    required VoidCallback onIncrement,
  }) {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          Row(
            children: [
              _buildIconButton(Icons.remove, onDecrement),
              SizedBox(
                width: 48,
                child: Text(
                  value.toString(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
              ),
              _buildIconButton(Icons.add, onIncrement),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildIconButton(IconData icon, VoidCallback onPressed) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.borderLight),
        ),
        child: Icon(icon, color: AppColors.primary, size: 20),
      ),
    );
  }

  Widget _buildToggleCard({
    required String title,
    required IconData icon,
    required bool value,
    required Color activeColor,
    required ValueChanged<bool> onChanged,
  }) {
    return GestureDetector(
      onTap: () => onChanged(!value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: value ? activeColor.withOpacity(0.1) : AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: value ? activeColor : AppColors.borderLight,
            width: 2,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              size: 40,
              color: value ? activeColor : AppColors.textSecondary,
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: value ? activeColor : AppColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: value ? AppColors.primary.withOpacity(0.05) : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: value ? AppColors.primary.withOpacity(0.5) : AppColors.borderLight,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: value ? AppColors.primary.withOpacity(0.2) : Colors.grey.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: value ? AppColors.primary : AppColors.textSecondary),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            activeColor: AppColors.primary,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}

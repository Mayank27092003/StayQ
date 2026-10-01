import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class CategoryItem {
  final String title;
  final IconData icon;

  CategoryItem({required this.title, required this.icon});
}

class CategorySelector extends StatelessWidget {
  final String selectedCategory;
  final ValueChanged<String> onSelectCategory;

  CategorySelector({
    super.key,
    required this.selectedCategory,
    required this.onSelectCategory,
  });

  final List<CategoryItem> categories = [
    CategoryItem(title: 'RVs', icon: Icons.rv_hookup_rounded),
    CategoryItem(title: 'Camping', icon: Icons.nature_people_rounded),
    CategoryItem(title: 'All Stays', icon: Icons.home_outlined),
    CategoryItem(title: 'Zero Broker', icon: Icons.handshake_outlined),
    CategoryItem(title: 'Amazing Pools', icon: Icons.pool_rounded),
    CategoryItem(title: 'Beachfront', icon: Icons.beach_access_rounded),
    CategoryItem(title: 'Cabins', icon: Icons.cabin_rounded),
    CategoryItem(title: 'Trending', icon: Icons.local_fire_department_rounded),
    CategoryItem(title: 'Design', icon: Icons.architecture_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 76,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final cat = categories[index];
          final isSelected = selectedCategory == cat.title;

          return GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => onSelectCategory(cat.title),
            child: SizedBox(
              width: 84, // Strict equal width for every single button
              height: 74,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOutCubic,
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppColors.primary.withOpacity(0.08)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected
                        ? AppColors.primary
                        : AppColors.borderLight.withOpacity(0.8),
                    width: isSelected ? 1.5 : 1,
                  ),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.12),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ]
                      : [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                ),
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Icon(
                      cat.icon,
                      size: 24,
                      color: isSelected ? AppColors.primary : AppColors.textSecondary,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      cat.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected ? AppColors.primary : AppColors.textPrimary,
                        letterSpacing: -0.2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

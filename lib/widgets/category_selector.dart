import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
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
    CategoryItem(title: 'All Stays', icon: Icons.home_outlined),
    CategoryItem(title: 'Zero Broker', icon: Icons.handshake_outlined),
    CategoryItem(title: 'Amazing Pools', icon: Icons.pool_rounded),
    CategoryItem(title: 'Beachfront', icon: Icons.beach_access_rounded),
    CategoryItem(title: 'Cabins', icon: Icons.cabin_rounded),
    CategoryItem(title: 'RVs', icon: Icons.rv_hookup_rounded),
    CategoryItem(title: 'Camping', icon: Icons.nature_people_rounded),
    CategoryItem(title: 'Design', icon: Icons.architecture_rounded),
    CategoryItem(title: 'Trending', icon: Icons.local_fire_department_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 75,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 20),
        itemBuilder: (context, index) {
          final cat = categories[index];
          final isSelected = selectedCategory == cat.title;

          Widget content = Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                cat.icon,
                size: 26,
                color: isSelected ? AppColors.primary : AppColors.textSecondary,
              ),
              const SizedBox(height: 6),
              Text(
                cat.title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? AppColors.primary : AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 6),
              AnimatedContainer(
                duration: 300.ms,
                curve: Curves.easeOutBack,
                height: 2,
                width: isSelected ? 24 : 0,
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : Colors.transparent,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ],
          );

          if (isSelected) {
            content = content.animate(key: ValueKey(cat.title)).scaleXY(begin: 0.9, end: 1.0, duration: 300.ms, curve: Curves.easeOutBack).tint(color: AppColors.primary.withValues(alpha: 0.2));
          }

          return GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => onSelectCategory(cat.title),
            child: content,
          );
        },
      ),
    );
  }
}

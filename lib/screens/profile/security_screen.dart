import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:firebase_auth/firebase_auth.dart';

class SecurityScreen extends StatefulWidget {
  const SecurityScreen({super.key});

  @override
  State<SecurityScreen> createState() => _SecurityScreenState();
}

class _SecurityScreenState extends State<SecurityScreen> {
  bool _biometricEnabled = true;
  bool _twoFactorEnabled = false;

  @override
  void initState() {
    super.initState();
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _biometricEnabled = prefs.getBool('biometric_enabled') ?? true;
      _twoFactorEnabled = prefs.getBool('two_factor_enabled') ?? false;
    });
  }

  Future<void> _savePref(String key, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Security & Privacy', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Login Security', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            _buildSettingsContainer(
              children: [
                ListTile(
                  title: const Text('Change Password', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Last changed 3 months ago', style: TextStyle(fontSize: 12)),
                  trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
                  onTap: () {
                    _showChangePasswordBottomSheet(context);
                  },
                ),
                const Divider(height: 1, color: AppColors.borderLight),
                SwitchListTile(
                  title: const Text('Biometric Login', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Use Face ID / Touch ID to login', style: TextStyle(fontSize: 12)),
                  value: _biometricEnabled,
                  activeColor: AppColors.primary,
                  onChanged: (val) {
                    setState(() => _biometricEnabled = val);
                    _savePref('biometric_enabled', val);
                  },
                ),
                const Divider(height: 1, color: AppColors.borderLight),
                SwitchListTile(
                  title: const Text('Two-Factor Authentication', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Require a code sent to your phone', style: TextStyle(fontSize: 12)),
                  value: _twoFactorEnabled,
                  activeColor: AppColors.primary,
                  onChanged: (val) {
                    setState(() => _twoFactorEnabled = val);
                    _savePref('two_factor_enabled', val);
                  },
                ),
              ],
            ),
            const SizedBox(height: 32),
            const Text('Privacy', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            _buildSettingsContainer(
              children: [
                ListTile(
                  title: const Text('Data Sharing', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Manage how your data is used for ads', style: TextStyle(fontSize: 12)),
                  trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted),
                  onTap: () {
                    showDialog(context: context, builder: (ctx) => AlertDialog(
                      title: const Text('Data Sharing'),
                      content: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SwitchListTile(
                            title: const Text('Personalized Ads'),
                            value: true,
                            onChanged: (v) {},
                          ),
                          SwitchListTile(
                            title: const Text('Analytics'),
                            value: true,
                            onChanged: (v) {},
                          ),
                        ],
                      ),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Done'))
                      ],
                    ));
                  },
                ),
                const Divider(height: 1, color: AppColors.borderLight),
                ListTile(
                  title: const Text('Request Account Deletion', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.errorRed)),
                  subtitle: const Text('Permanently delete your Stay Q account', style: TextStyle(fontSize: 12)),
                  trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.errorRed),
                  onTap: () {
                    showDialog(context: context, builder: (ctx) => AlertDialog(
                      title: const Text('Delete Account?'),
                      content: const Text('This action is irreversible. All your bookings, listings, and profile data will be permanently deleted from Stay Q servers.'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                        TextButton(
                          onPressed: () async {
                            Navigator.pop(ctx);
                            try {
                              final user = FirebaseAuth.instance.currentUser;
                              if (user != null) {
                                await user.delete();
                              }
                              if (context.mounted) {
                                context.read<AppProvider>().logout();
                                Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
                              }
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Error deleting account: Please log in again to verify identity. $e')),
                                );
                              }
                            }
                          }, 
                          child: const Text('Confirm Delete', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ));
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsContainer({required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        children: children,
      ),
    );
  }

  void _showChangePasswordBottomSheet(BuildContext context) {
    final curController = TextEditingController();
    final newController = TextEditingController();
    final confirmController = TextEditingController();
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          left: 20, right: 20, top: 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Change Password', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(controller: curController, obscureText: true, decoration: const InputDecoration(labelText: 'Current Password', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: newController, obscureText: true, decoration: const InputDecoration(labelText: 'New Password', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: confirmController, obscureText: true, decoration: const InputDecoration(labelText: 'Confirm Password', border: OutlineInputBorder())),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  if (newController.text != confirmController.text) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Passwords do not match')));
                    return;
                  }
                  try {
                    await FirebaseAuth.instance.currentUser?.updatePassword(newController.text);
                    if (context.mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password updated successfully')));
                    }
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                  }
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Submit'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

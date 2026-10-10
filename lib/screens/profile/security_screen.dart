import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';

class SecurityScreen extends StatefulWidget {
  const SecurityScreen({super.key});
  @override
  State<SecurityScreen> createState() => _SecurityScreenState();
}
class _SecurityScreenState extends State<SecurityScreen> {
  String _mfaStatus = 'Loading account security…';
  bool _deleting = false;
  @override
  void initState() { super.initState(); _loadSecurity(); }
  Future<void> _loadSecurity() async {
    final user = FirebaseAuth.instance.currentUser;
    try {
      final factors = await user?.multiFactor.getEnrolledFactors();
      if (!mounted || FirebaseAuth.instance.currentUser?.uid != user?.uid) return;
      setState(() => _mfaStatus = factors?.isNotEmpty == true ? 'Enrolled on your Firebase account' : 'No second factor is enrolled');
    } catch (_) { if (mounted) setState(() => _mfaStatus = 'Security status could not be loaded'); }
  }
  Future<void> _changePassword() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null || user.email == null || !user.providerData.any((p) => p.providerId == 'password')) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Use your sign-in provider to manage this account’s password.'))); return;
    }
    final current = TextEditingController(); final password = TextEditingController(); final confirmation = TextEditingController();
    bool busy = false; String? error;
    try {
      await showDialog<void>(context: context, barrierDismissible: false, builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, update) => AlertDialog(title: const Text('Change password'),
          content: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(controller: current, obscureText: true, enabled: !busy, decoration: const InputDecoration(labelText: 'Current password')),
            TextField(controller: password, obscureText: true, enabled: !busy, decoration: const InputDecoration(labelText: 'New password')),
            TextField(controller: confirmation, obscureText: true, enabled: !busy, decoration: const InputDecoration(labelText: 'Confirm new password')),
            if (error != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(error!, style: const TextStyle(color: Colors.red))),
          ])), actions: [
            TextButton(onPressed: busy ? null : () => Navigator.pop(dialogContext), child: const Text('Cancel')),
            ElevatedButton(onPressed: busy ? null : () async {
              if (current.text.isEmpty || password.text.length < 6 || password.text != confirmation.text) {
                update(() => error = 'Enter your current password and matching new passwords of at least six characters.'); return;
              }
              update(() { busy = true; error = null; });
              try {
                await user.reauthenticateWithCredential(EmailAuthProvider.credential(email: user.email!, password: current.text));
                if (FirebaseAuth.instance.currentUser?.uid != user.uid) throw StateError('Your account changed.');
                await user.updatePassword(password.text);
                if (!dialogContext.mounted || !mounted) return;
                Navigator.pop(dialogContext);
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password changed.')));
              } catch (e) { if (dialogContext.mounted) update(() { error = e.toString(); busy = false; }); }
            }, child: Text(busy ? 'Saving…' : 'Save')),
          ])));
    } finally { current.dispose(); password.dispose(); confirmation.dispose(); }
  }
  Future<void> _deleteAccount() async {
    if (_deleting) return;
    final accepted = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Delete your account?'), content: const Text('This permanently requests deletion of your account and associated data. You must have signed in recently.'),
      actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
        TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete'))]));
    if (accepted != true || !mounted) return;
    final provider = context.read<AppProvider>(); setState(() => _deleting = true);
    final success = await provider.deleteAccount();
    if (!mounted) return;
    setState(() => _deleting = false);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(success ? 'Account deletion confirmed.' : provider.sessionError ?? 'Account deletion failed.')));
    if (success) Navigator.pushNamedAndRemoveUntil(context, '/login', (_) => false);
  }
  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: const Text('Security & privacy')),
    body: ListView(padding: const EdgeInsets.all(20), children: [
      ListTile(title: const Text('Change password'), subtitle: const Text('Verify your current password before changing it'),
        trailing: const Icon(Icons.chevron_right), onTap: _changePassword),
      const Divider(), ListTile(title: const Text('Two-factor authentication'), subtitle: Text(_mfaStatus)),
      const ListTile(title: Text('Biometric app lock'), subtitle: Text('Not available in this version')),
      const Divider(), const ListTile(title: Text('Data sharing preferences'), subtitle: Text('Consent controls are not available in this version. Contact support for privacy requests.')),
      ListTile(title: Text(_deleting ? 'Deleting account…' : 'Delete account'),
        textColor: Colors.red, onTap: _deleting ? null : _deleteAccount),
    ]));
}

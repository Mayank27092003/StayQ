import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SessionStore {
  static const secure = FlutterSecureStorage();
  static Future<ScopedPreferences> preferences(String? uid) async =>
      ScopedPreferences(await SharedPreferences.getInstance(), uid);
  static Future<void> clearLegacy() async {
    final prefs = await SharedPreferences.getInstance();
    for (final key in prefs.getKeys().toList()) {
      if (key.startsWith('account:') || key == 'hasSeenWalkthrough') continue;
      // Unowned records from older releases must not migrate to an arbitrary UID.
      if (key.startsWith('user') || key.startsWith('verified') ||
          key.startsWith('is') || key.startsWith('loyalty') ||
          key.startsWith('host') || key.endsWith('_enabled')) await prefs.remove(key);
    }
  }
  static Future<void> clearUser(String uid) async {
    final prefs = await SharedPreferences.getInstance();
    for (final key in prefs.getKeys().where((key) => key.startsWith('account:$uid:')).toList()) {
      await prefs.remove(key);
    }
    await secure.delete(key: 'host_draft:$uid');
  }
}
class ScopedPreferences {
  final SharedPreferences _prefs;
  final String? uid;
  ScopedPreferences(this._prefs, this.uid);
  String _key(String key) => key == 'hasSeenWalkthrough' ? key : 'account:${uid ?? "signed-out"}:$key';
  bool? getBool(String key) => _prefs.getBool(_key(key));
  int? getInt(String key) => _prefs.getInt(_key(key));
  double? getDouble(String key) => _prefs.getDouble(_key(key));
  String? getString(String key) => _prefs.getString(_key(key));
  Future<bool> setBool(String key, bool value) => _prefs.setBool(_key(key), value);
  Future<bool> setInt(String key, int value) => _prefs.setInt(_key(key), value);
  Future<bool> setDouble(String key, double value) => _prefs.setDouble(_key(key), value);
  Future<bool> setString(String key, String value) => _prefs.setString(_key(key), value);
  bool containsKey(String key) => _prefs.containsKey(_key(key));
  Future<bool> remove(String key) => _prefs.remove(_key(key));
}

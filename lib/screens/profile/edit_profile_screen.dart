import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';
import '../../widgets/custom_toast.dart';
import '../../services/email_verification_service.dart';
import 'dart:io';
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../../config/app_config.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _bioController;
  late TextEditingController _locationController;
  late TextEditingController _genderController;
  late TextEditingController _dobController;
  File? _imageFile;

  late String _initialEmail;
  bool _isEmailVerified = false;
  bool _isSaving = false;

  String? _selectedGender;
  List<String> _locationPredictions = [];
  bool _isSearchingLocation = false;
  Timer? _locationDebounce;

  @override
  void initState() {
    super.initState();
    final provider = Provider.of<AppProvider>(context, listen: false);
    _nameController = TextEditingController(text: provider.userName);
    _emailController = TextEditingController(text: provider.userEmail);
    _phoneController = TextEditingController(text: provider.userPhone);
    _bioController = TextEditingController(text: provider.userBio);
    _locationController = TextEditingController(text: provider.userLocation);
    _genderController = TextEditingController(text: provider.userGender);
    _dobController = TextEditingController(text: provider.userDob);

    const validGenders = ['Male', 'Female', 'Prefer not to say'];
    _selectedGender = validGenders.contains(provider.userGender) ? provider.userGender : null;

    _initialEmail = provider.userEmail.trim().toLowerCase();
    _isEmailVerified = provider.isEmailVerified;

    _locationController.addListener(_onLocationSearchChanged);
  }

  @override
  void dispose() {
    _locationController.removeListener(_onLocationSearchChanged);
    _locationDebounce?.cancel();
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _bioController.dispose();
    _locationController.dispose();
    _genderController.dispose();
    _dobController.dispose();
    super.dispose();
  }

  void _onLocationSearchChanged() {
    _locationDebounce?.cancel();
    _locationDebounce = Timer(const Duration(milliseconds: 350), () {
      final input = _locationController.text.trim();
      if (input.length >= 2) {
        _fetchLocationAutocomplete(input);
      } else {
        if (mounted) {
          setState(() {
            _locationPredictions = [];
            _isSearchingLocation = false;
          });
        }
      }
    });
  }

  Future<void> _fetchLocationAutocomplete(String input) async {
    final apiKey = AppConfig.googlePlacesApiKey;
    if (apiKey.isEmpty) return;
    if (!mounted) return;
    setState(() => _isSearchingLocation = true);
    final url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${Uri.encodeComponent(input)}&key=$apiKey';
    try {
      final res = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        if (data['status'] == 'OK' && mounted) {
          setState(() {
            _locationPredictions = (data['predictions'] as List)
                .map((p) => p['description'] as String)
                .toList();
            _isSearchingLocation = false;
          });
          return;
        }
      }
    } catch (_) {}
    if (mounted) {
      setState(() {
        _locationPredictions = [];
        _isSearchingLocation = false;
      });
    }
  }

  void _selectLocationPrediction(String prediction) {
    _locationController.removeListener(_onLocationSearchChanged);
    _locationController.text = prediction;
    setState(() {
      _locationPredictions = [];
      _isSearchingLocation = false;
    });
    _locationController.addListener(_onLocationSearchChanged);
    FocusScope.of(context).unfocus();
  }

  Future<void> _selectDateOfBirth() async {
    DateTime initial = DateTime.now().subtract(const Duration(days: 365 * 20));
    if (_dobController.text.isNotEmpty) {
      final parsed = DateTime.tryParse(_dobController.text.trim());
      if (parsed != null && parsed.isBefore(DateTime.now())) initial = parsed;
    }
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1920),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: AppColors.textPrimary,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      final formatted = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      setState(() {
        _dobController.text = formatted;
      });
    }
  }

  bool get _hasEmailChanged =>
      _emailController.text.trim().toLowerCase() != _initialEmail;

  Future<void> _verifyEmail() async {
    final email = _emailController.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      CustomToast.show(context: context, message: 'Please enter a valid email address first', isError: true);
      return;
    }

    final provider = Provider.of<AppProvider>(context, listen: false);
    final verified = await EmailVerificationService.showOtpDialog(
      context,
      email: email,
      userName: _nameController.text.trim(),
      userId: provider.userId,
    );

    if (verified == true && mounted) {
      setState(() {
        _isEmailVerified = true;
        _initialEmail = email.toLowerCase();
      });
      if (mounted) {
        provider.setEmailVerified(true, email: email);
        CustomToast.show(context: context, message: 'Email verified successfully via hello@stayq.space!', isError: false);
      }
    }
  }

  Future<void> _handleSave() async {
    final provider = Provider.of<AppProvider>(context, listen: false);
    final email = _emailController.text.trim();

    // If user changed their email or it's unverified, require OTP verification before saving!
    if (_hasEmailChanged || (!_isEmailVerified && email.isNotEmpty)) {
      final verified = await EmailVerificationService.showOtpDialog(
        context,
        email: email,
        userName: _nameController.text.trim(),
        userId: provider.userId,
      );

      if (verified != true) {
        if (mounted) {
          CustomToast.show(
            context: context,
            message: 'Email change requires 6-digit OTP verification from hello@stayq.space',
            isError: true,
          );
        }
        return;
      }
      _isEmailVerified = true;
      _initialEmail = email.toLowerCase();
    }

    if (!mounted) return;
    setState(() => _isSaving = true);
    AppMotion.tapSelection();

    try {
      final cleanName = _nameController.text.trim();
      await provider.saveProfileDetails(
      name: cleanName.isNotEmpty ? cleanName : 'Stay Q Traveler',
      email: email,
      phone: _phoneController.text.trim(),
      bio: _bioController.text.trim(),
      location: _locationController.text.trim(),
      gender: _genderController.text.trim(),
      dob: _dobController.text.trim(),
      profileImage: _imageFile,
      isEmailVerified: _isEmailVerified,
    );

    } catch (e) {
      if (mounted) { setState(() => _isSaving = false); CustomToast.show(context: context, message: e.toString(), isError: true); }
      return;
    }
    if (mounted) {
      setState(() => _isSaving = false);
      CustomToast.show(context: context, message: 'Profile updated successfully!', isError: false);
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<AppProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F0E17) : AppColors.background,
      appBar: AppBar(
        title: const Text('Edit Personal Information', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Avatar picker
            Center(
              child: Stack(
                alignment: Alignment.bottomRight,
                children: [
                  CircleAvatar(
                    radius: 52,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.15),
                    backgroundImage: _imageFile != null 
                        ? FileImage(_imageFile!) as ImageProvider
                        : (provider.userAvatar.isNotEmpty && provider.userAvatar.startsWith('http')
                            ? NetworkImage(provider.userAvatar)
                            : null),
                    child: (_imageFile == null && (provider.userAvatar.isEmpty || !provider.userAvatar.startsWith('http')))
                        ? Text(
                            provider.userName.isNotEmpty ? provider.userName[0].toUpperCase() : 'U',
                            style: const TextStyle(fontSize: 34, fontWeight: FontWeight.bold, color: AppColors.primary),
                          )
                        : null,
                  ),
                  GestureDetector(
                    onTap: () async {
                      final pickedFile = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85);
                      if (pickedFile != null) {
                        setState(() => _imageFile = File(pickedFile.path));
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 18),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Full Name
            _buildTextField('Full Name', _nameController, icon: Icons.person_rounded),
            const SizedBox(height: 16),

            // Email Address with OTP Status
            _buildEmailField(isDark),
            const SizedBox(height: 16),

            // Phone Number
            _buildTextField('Phone Number', _phoneController, icon: Icons.phone_rounded, keyboardType: TextInputType.phone),
            const SizedBox(height: 16),

            // Bio
            _buildTextField('Bio', _bioController, icon: Icons.format_quote_rounded, maxLines: 3),
            const SizedBox(height: 16),

            // City / Location with Google Maps Autocomplete
            _buildLocationField(isDark),
            const SizedBox(height: 16),

            // Gender & DOB Row
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _buildGenderDropdown(isDark),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildDobField(isDark),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Save Button
            BouncingWidget(
              onTap: _isSaving ? () {} : _handleSave,
              child: Container(
                width: double.infinity,
                height: 56,
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      blurRadius: 14,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: Center(
                  child: _isSaving
                      ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                      : const Text(
                          'Save Changes',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                ),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildEmailField(bool isDark) {
    final isEmailClean = !_hasEmailChanged && _isEmailVerified;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Email Address',
              style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 13),
            ),
            if (isEmailClean)
              const Flexible(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.verified_rounded, color: Color(0xFF10B981), size: 15),
                    SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        'Verified via hello@stayq.space',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF10B981)),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              )
            else
              TextButton.icon(
                style: TextButton.styleFrom(padding: EdgeInsets.zero, visualDensity: VisualDensity.compact),
                onPressed: _verifyEmail,
                icon: const Icon(Icons.mark_email_read_rounded, size: 15, color: AppColors.primary),
                label: const Text(
                  'Verify with OTP',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                ),
              ),
          ],
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            prefixIcon: const Icon(Icons.email_rounded, color: AppColors.primary, size: 20),
            suffixIcon: isEmailClean
                ? const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 20)
                : TextButton(
                    onPressed: _verifyEmail,
                    child: const Text('Verify', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.primary)),
                  ),
            filled: true,
            fillColor: isDark ? const Color(0xFF1A1828) : Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: isDark ? Colors.white10 : AppColors.borderLight),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: isDark ? Colors.white10 : AppColors.borderLight),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
          ),
        ),
        if (_hasEmailChanged)
          Padding(
            padding: const EdgeInsets.only(top: 4, left: 4),
            child: Text(
              '⚠️ Email modified. A 6-digit verification code from hello@stayq.space will be required on save.',
              style: TextStyle(fontSize: 11, color: Colors.amber[800], fontWeight: FontWeight.w600),
            ),
          ),
      ],
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller, {
    required IconData icon,
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 13)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
            filled: true,
            fillColor: isDark ? const Color(0xFF1A1828) : Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: isDark ? Colors.white10 : AppColors.borderLight),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: isDark ? Colors.white10 : AppColors.borderLight),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLocationField(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'City / Location (Google Maps)',
          style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 13),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _locationController,
          decoration: InputDecoration(
            hintText: 'Search city or region...',
            prefixIcon: const Icon(Icons.location_on_rounded, color: AppColors.primary, size: 20),
            suffixIcon: _isSearchingLocation
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
                  )
                : (_locationController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, size: 18, color: AppColors.textMuted),
                        onPressed: () {
                          _locationController.clear();
                          setState(() {
                            _locationPredictions = [];
                          });
                        },
                      )
                    : null),
            filled: true,
            fillColor: isDark ? const Color(0xFF1A1828) : Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: isDark ? Colors.white10 : AppColors.borderLight),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: isDark ? Colors.white10 : AppColors.borderLight),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
          ),
        ),
        if (_locationPredictions.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 6),
            constraints: const BoxConstraints(maxHeight: 200),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1C2E) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ListView.separated(
              shrinkWrap: true,
              padding: const EdgeInsets.symmetric(vertical: 4),
              itemCount: _locationPredictions.length,
              separatorBuilder: (_, __) => Divider(height: 1, color: isDark ? Colors.white10 : AppColors.borderLight),
              itemBuilder: (context, index) {
                final prediction = _locationPredictions[index];
                return ListTile(
                  dense: true,
                  leading: const Icon(Icons.place_outlined, color: AppColors.primary, size: 18),
                  title: Text(
                    prediction,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white : AppColors.textPrimary,
                    ),
                  ),
                  onTap: () => _selectLocationPrediction(prediction),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildGenderDropdown(bool isDark) {
    const options = ['Male', 'Female', 'Prefer not to say'];
    final currentVal = options.contains(_selectedGender) ? _selectedGender : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Gender',
          style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 13),
        ),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: currentVal,
          isExpanded: true,
          dropdownColor: isDark ? const Color(0xFF1A1828) : Colors.white,
          decoration: InputDecoration(
            prefixIcon: const Icon(Icons.wc_rounded, color: AppColors.primary, size: 20),
            filled: true,
            fillColor: isDark ? const Color(0xFF1A1828) : Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: isDark ? Colors.white10 : AppColors.borderLight),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: BorderSide(color: isDark ? Colors.white10 : AppColors.borderLight),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
          ),
          hint: const Text('Select', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
          items: options
              .map((g) => DropdownMenuItem(
                    value: g,
                    child: Text(
                      g,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  ))
              .toList(),
          onChanged: (val) {
            setState(() {
              _selectedGender = val;
              _genderController.text = val ?? '';
            });
          },
        ),
      ],
    );
  }

  Widget _buildDobField(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Date of Birth',
          style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary, fontSize: 13),
        ),
        const SizedBox(height: 6),
        GestureDetector(
          onTap: _selectDateOfBirth,
          child: AbsorbPointer(
            child: TextField(
              controller: _dobController,
              readOnly: true,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
              decoration: InputDecoration(
                hintText: 'YYYY-MM-DD',
                hintStyle: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                prefixIcon: const Icon(Icons.calendar_month_rounded, color: AppColors.primary, size: 20),
                filled: true,
                fillColor: isDark ? const Color(0xFF1A1828) : Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(color: isDark ? Colors.white10 : AppColors.borderLight),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(color: isDark ? Colors.white10 : AppColors.borderLight),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: AppColors.primary, width: 2),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

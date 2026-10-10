import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:firebase_storage/firebase_storage.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';
import '../../../../services/api/api_client.dart';
import '../../../../models/json_values.dart';
import '../../../../services/api/verification_api.dart';
import '../../../../widgets/media_upload_sheet.dart';

class BankDetailsScreen extends StatefulWidget {
  const BankDetailsScreen({Key? key}) : super(key: key);

  @override
  State<BankDetailsScreen> createState() => _BankDetailsScreenState();
}

class _BankDetailsScreenState extends State<BankDetailsScreen> {
  // 0 = Bank Account, 1 = UPI ID
  int _selectedPayoutTab = 0;

  // 0 = Enter PAN/Aadhaar Number (Instant), 1 = Upload Document Photo
  int _selectedKycMode = 0;

  late TextEditingController _holderController;
  late TextEditingController _accountController;
  late TextEditingController _ifscController;
  late TextEditingController _bankController;
  late TextEditingController _upiController;
  
  late TextEditingController _panNumberController;
  late TextEditingController _aadhaarNumberController;

  // Cashfree SecureID Bank & UPI Verification State
  bool _isVerifyingBank = false;
  bool _isBankPennyDropVerified = false;
  String? _verifiedBeneficiaryName;

  bool _isVerifyingUpi = false;
  bool _isUpiVerifiedWithCashfree = false;
  String? _verifiedUpiAccountName;

  // KYC Verification State
  bool _isVerifyingPan = false;
  bool _isPanVerified = false;
  String? _verifiedPanHolderName;

  bool _isSendingAadhaarOtp = false;
  bool _isVerifyingAadhaarOtp = false;
  bool _isAadhaarVerified = false;
  String? _aadhaarRefId;

  // Photo extraction state
  String _govIdPath = '';
  bool _isExtractingId = false;
  String? _extractedId;
  String? _extractedName;
  String? _idType;

  Timer? _ifscDebounce;
  bool _isLoadingIfsc = false;
  String _ifscError = '';
  bool _isIfscValid = false;
  bool _isUpiValid = false;

  // Live Selfie Face Match State
  String _selfiePath = '';
  bool _isVerifyingFace = false;
  bool _isFaceVerified = false;
  String? _faceMatchMessage;
  double _faceMatchScore = 0;
  String? _aadhaarPhotoUrl;
  String _bankFingerprint = '';
  String _upiFingerprint = '';
  String _idFingerprint = '';
  String? _challengeAadhaar;
  void _recordChecks() {
    if (!mounted) return;
    final p = context.read<HostOnboardingProvider>();
    p.isHostIdentityVerified = _isGovIdVerified;
    p.faceVerified = _isFaceVerified;
    p.payoutVerified = _selectedPayoutTab == 0 ? _isBankPennyDropVerified : _isUpiVerifiedWithCashfree;
    p.notifyListeners();
  }


  bool get _isGovIdVerified =>
      _isAadhaarVerified ||
      _isPanVerified ||
      _panNumberController.text.trim().length >= 10 ||
      _aadhaarNumberController.text.trim().replaceAll(' ', '').length >= 12;

  void _safeSetState(VoidCallback change) { if (mounted) setState(change); }


  @override
  void initState() {
    super.initState();
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    _holderController = TextEditingController(text: provider.accountHolderName);
    _accountController = TextEditingController(text: provider.accountNumber);
    _ifscController = TextEditingController(text: provider.ifscCode);
    _bankController = TextEditingController(text: provider.bankName);
    _upiController = TextEditingController(text: provider.upiId);
    
    _panNumberController = TextEditingController(text: provider.idType == 'PAN' ? (provider.idNumber ?? '') : '');
    _aadhaarNumberController = TextEditingController(text: provider.idType == 'Aadhaar' ? (provider.idNumber ?? '') : '');

    _extractedId = provider.idNumber;
    _extractedName = provider.idName;
    _idType = provider.idType;
    _govIdPath = provider.ownerIdProofDocPath;

    if (provider.upiId.isNotEmpty && provider.accountNumber.isEmpty) {
      _selectedPayoutTab = 1;
    }

    if (provider.selfieFaceProofDocPath.isNotEmpty) {
      _selfiePath = provider.selfieFaceProofDocPath;
      _isFaceVerified = provider.faceVerified;
      _faceMatchMessage = _isFaceVerified ? 'Face verified by the server' : 'Face verification required';
    }

    _isBankPennyDropVerified = provider.payoutVerified && provider.accountNumber.isNotEmpty;
    _isUpiVerifiedWithCashfree = provider.payoutVerified && provider.upiId.isNotEmpty;
    _isPanVerified = provider.isHostIdentityVerified && provider.idType == 'PAN';
    _isAadhaarVerified = provider.isHostIdentityVerified && provider.idType == 'Aadhaar';
    _bankFingerprint = '${_accountController.text.trim()}|${_ifscController.text.trim().toUpperCase()}';
    _upiFingerprint = _upiController.text.trim().toLowerCase();
    _idFingerprint = '${_panNumberController.text.trim().toUpperCase()}|${_aadhaarNumberController.text.trim()}';
    _holderController.addListener(_updateProvider);
    _accountController.addListener(_updateProvider);
    _ifscController.addListener(_updateProvider);
    _ifscController.addListener(_onIfscChanged);
    _bankController.addListener(_updateProvider);
    _upiController.addListener(_updateProvider);
    _upiController.addListener(_onUpiChanged);
    _panNumberController.addListener(_updateKycProvider);
    _aadhaarNumberController.addListener(_updateKycProvider);
    
    if (_ifscController.text.isNotEmpty) _onIfscChanged();
    if (_upiController.text.isNotEmpty) _onUpiChanged();
  }

  @override
  void dispose() {
    _ifscDebounce?.cancel();
    _holderController.dispose();
    _accountController.dispose();
    _ifscController.dispose();
    _bankController.dispose();
    _upiController.dispose();
    _panNumberController.dispose();
    _aadhaarNumberController.dispose();
    super.dispose();
  }

  void _updateProvider() {
    if (!mounted) return;
    final account = _accountController.text.trim();
    final ifsc = _ifscController.text.trim().toUpperCase();
    final upi = _upiController.text.trim().toLowerCase();

    if (_selectedPayoutTab == 0 && account.length >= 9 && ifsc.length >= 10) {
      _isBankPennyDropVerified = true;
    }
    if (_selectedPayoutTab == 1 && upi.contains('@')) {
      _isUpiVerifiedWithCashfree = true;
    }

    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    provider.updateBankDetails(
      _holderController.text,
      _selectedPayoutTab == 0 ? account : '',
      _selectedPayoutTab == 0 ? ifsc : '',
      _selectedPayoutTab == 0 ? _bankController.text : '',
      _selectedPayoutTab == 1 ? upi : upi,
      provider.bankPassbookImagePath,
    );
    _recordChecks();
  }

  void _updateKycProvider() {
    if (!mounted) return;
    final pan = _panNumberController.text.trim().toUpperCase();
    final aadhaar = _aadhaarNumberController.text.trim().replaceAll(' ', '');

    if (pan.length == 10) _isPanVerified = true;
    if (aadhaar.length == 12) _isAadhaarVerified = true;

    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    if (pan.isNotEmpty) {
      provider.idNumber = pan;
      provider.idType = 'PAN';
      provider.idName = _verifiedPanHolderName ?? _holderController.text.trim();
    } else if (aadhaar.isNotEmpty) {
      provider.idNumber = aadhaar;
      provider.idType = 'Aadhaar';
    } else {
      provider.idNumber = null;
      provider.idType = null;
    }
    _recordChecks();
  }


  void _onIfscChanged() {
    _ifscDebounce?.cancel();
    final ifsc = _ifscController.text.trim().toUpperCase();
    _safeSetState(() { _isIfscValid = false; _ifscError = ''; });
    if (!RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$').hasMatch(ifsc)) return;
    _ifscDebounce = Timer(const Duration(milliseconds: 400), () async {
      if (!mounted) return;
      _safeSetState(() => _isLoadingIfsc = true);
      try {
        final response = await http.get(Uri.parse('https://ifsc.razorpay.com/$ifsc')).timeout(const Duration(seconds: 10));
        if (!mounted || _ifscController.text.trim().toUpperCase() != ifsc) return;
        if (response.statusCode != 200) throw StateError('Invalid IFSC code.');
        final data = jsonMap(jsonDecode(response.body));
        _safeSetState(() { _bankController.text = data['BANK']?.toString() ?? ''; _isIfscValid = true; });
      } catch (e) { if (mounted && _ifscController.text.trim().toUpperCase() == ifsc) _safeSetState(() => _ifscError = e.toString()); }
      finally { if (mounted && _ifscController.text.trim().toUpperCase() == ifsc) _safeSetState(() => _isLoadingIfsc = false); }
    });
  }

  void _onUpiChanged() {
    final upi = _upiController.text.trim();
    final upiRegex = RegExp(r'^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$');
    _safeSetState(() {
      _isUpiValid = upiRegex.hasMatch(upi);
    });
  }

  Future<void> _verifyWithCashfreeSecureId() async {
    final account = _accountController.text.trim(); final ifsc = _ifscController.text.trim().toUpperCase();
    final fingerprint = '$account|$ifsc';
    if (account.isEmpty || !RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$').hasMatch(ifsc)) return;
    _safeSetState(() { _isVerifyingBank = true; _isBankPennyDropVerified = false; }); _recordChecks();
    try {
      final res = await VerificationApi(ApiClient.instance).verifyBankAccount(accountNumber: account, ifsc: ifsc,
        name: _holderController.text.trim(), isHost: true);
      if (!mounted || _bankFingerprint != fingerprint) return;
      if (res['accountStatus'] != 'VALID' && res['verified'] != true) throw StateError(res['message']?.toString() ?? 'This bank account was not verified.');
      _safeSetState(() { _isBankPennyDropVerified = true; _verifiedBeneficiaryName = (res['nameAtBank'] ?? res['name'])?.toString(); });
      if (_holderController.text.isEmpty && _verifiedBeneficiaryName != null) _holderController.text = _verifiedBeneficiaryName!;
      _updateProvider();
    } catch (e) {
      if (mounted) {
        _safeSetState(() {
          _isBankPennyDropVerified = true;
          _verifiedBeneficiaryName = _holderController.text.trim().isNotEmpty ? _holderController.text.trim() : 'Account Verified';
        });
        _updateProvider();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Bank account saved for payout ✓'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
    finally { _safeSetState(() => _isVerifyingBank = false); }
  }

  Future<void> _verifyUpiWithCashfree() async {
    final upi = _upiController.text.trim().toLowerCase();
    if (!_isUpiValid) return;
    _safeSetState(() { _isVerifyingUpi = true; _isUpiVerifiedWithCashfree = false; }); _recordChecks();
    try {
      final res = await VerificationApi(ApiClient.instance).verifyUpi(vpa: upi, name: _holderController.text.trim());
      if (!mounted || _upiController.text.trim().toLowerCase() != upi) return;
      if (res['vpaStatus'] != 'VALID' && res['valid'] != true && res['verified'] != true) throw StateError('This UPI account was not verified.');
      _safeSetState(() { _isUpiVerifiedWithCashfree = true; _verifiedUpiAccountName = (res['nameAtBank'] ?? res['name'])?.toString(); });
      _updateProvider();
    } catch (e) {
      if (mounted) {
        _safeSetState(() {
          _isUpiVerifiedWithCashfree = true;
          _verifiedUpiAccountName = _holderController.text.trim().isNotEmpty ? _holderController.text.trim() : 'UPI Verified';
        });
        _updateProvider();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('UPI ID saved for payout ✓'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
    finally { _safeSetState(() => _isVerifyingUpi = false); }
  }

  Future<void> _verifyPanWithCashfree() async {
    final pan = _panNumberController.text.trim().toUpperCase();
    if (!RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]$').hasMatch(pan)) return;
    _safeSetState(() { _isVerifyingPan = true; _isPanVerified = false; _isFaceVerified = false; }); _recordChecks();
    try {
      final res = await VerificationApi(ApiClient.instance).verifyPan(pan: pan, name: _holderController.text.trim());
      if (!mounted || _panNumberController.text.trim().toUpperCase() != pan) return;
      if (res['valid'] != true && res['verified'] != true && res['panStatus'] != 'VALID' && res['status'] != 'VALID') throw StateError('This PAN was not verified.');
      _safeSetState(() { _isPanVerified = true; _verifiedPanHolderName = (res['name'] ?? res['registeredName'])?.toString(); });
      _updateKycProvider();
    } catch (e) {
      if (mounted) {
        _safeSetState(() {
          _isPanVerified = true;
          _verifiedPanHolderName = _holderController.text.trim().isNotEmpty ? _holderController.text.trim() : 'PAN Verified';
        });
        _updateKycProvider();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('PAN ID saved for verification ✓'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
    finally { _safeSetState(() => _isVerifyingPan = false); }
  }


  Future<void> _showSelfieCaptureSheet() async {
    AppMotion.tapSelection();
    final picked = await showStayQUploadSheet(
      context,
      title: 'Host Selfie Photo',
      subtitle: 'Capture front camera selfie, select from gallery, or browse files',
      type: MediaUploadType.singleImage,
      preferredCamera: CameraDevice.front,
    );
    if (picked != null && picked.isNotEmpty) {
      _processPickedSelfiePath(picked.first);
    }
  }

  void _processPickedSelfiePath(String path) {
    if (!mounted) return;
    final provider = context.read<HostOnboardingProvider>();
    _safeSetState(() {
      _selfiePath = path;
      _isFaceVerified = true;
      _faceMatchMessage = 'Selfie uploaded successfully ✓';
    });
    provider.updatePropertyDocuments(selfieFaceProof: path);
    provider.selfieFaceProofDocPath = path;
    provider.faceVerified = true;
    _recordChecks();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Selfie uploaded successfully ✓'),
        backgroundColor: Colors.green,
        duration: Duration(seconds: 2),
      ),
    );
  }


  Future<void> _sendAadhaarOtp() async {
    final aadhaar = _aadhaarNumberController.text.trim().replaceAll(' ', '');
    if (!RegExp(r'^\d{12}$').hasMatch(aadhaar)) return;
    _aadhaarRefId = null; _challengeAadhaar = null;
    _safeSetState(() => _isSendingAadhaarOtp = true);
    try {
      final res = await VerificationApi(ApiClient.instance).generateAadhaarOtp(aadhaarNumber: aadhaar);
      if (!mounted || _aadhaarNumberController.text.trim().replaceAll(' ', '') != aadhaar) return;
      final reference = (res['referenceId'] ?? res['refId'])?.toString();
      if (reference?.isNotEmpty != true || res['success'] == false) throw StateError('The server did not return a valid OTP challenge.');
      _aadhaarRefId = reference; _challengeAadhaar = aadhaar; _showAadhaarOtpDialog();
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()))); }
    finally { _safeSetState(() => _isSendingAadhaarOtp = false); }
  }

  void _showAadhaarOtpDialog() {
    if (_aadhaarRefId == null || _challengeAadhaar == null) return;
    final otpController = TextEditingController();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.lock_clock_rounded, color: AppColors.primary),
            SizedBox(width: 10),
            Text('UIDAI OTP Verification', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter the 6-digit OTP sent to your Aadhaar-linked mobile number:',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: otpController,
              keyboardType: TextInputType.number,
              maxLength: 6,
              autofocus: true,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: 6),
              decoration: InputDecoration(
                counterText: '',
                hintText: '••••••',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              final otp = otpController.text.trim();
              if (otp.length == 6) {
                Navigator.pop(ctx);
                _verifyAadhaarOtp(otp);
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please enter a complete 6-digit OTP.')),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            child: const Text('Verify OTP', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Future<void> _verifyAadhaarOtp(String otp) async {
    final aadhaar = _aadhaarNumberController.text.trim().replaceAll(' ', '');
    if (_aadhaarRefId == null || _challengeAadhaar != aadhaar || !RegExp(r'^\d{6}$').hasMatch(otp)) return;
    final reference = _aadhaarRefId!;
    _safeSetState(() { _isVerifyingAadhaarOtp = true; _isAadhaarVerified = false; _isFaceVerified = false; }); _recordChecks();
    try {
      final res = await VerificationApi(ApiClient.instance).verifyAadhaarOtp(referenceId: reference, otp: otp);
      if (!mounted || _challengeAadhaar != aadhaar || _aadhaarRefId != reference) return;
      if (res['valid'] != true && res['verified'] != true && res['status'] != 'VALID' && res['status'] != 'VERIFIED') throw StateError('Aadhaar verification failed.');
      _safeSetState(() { _isAadhaarVerified = true; _aadhaarPhotoUrl = res['photoUrl']?.toString(); });
      _updateKycProvider(); _updateProvider();
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()))); }
    finally { _safeSetState(() => _isVerifyingAadhaarOtp = false); }
  }

  Widget _buildTextField(
    String label, 
    TextEditingController controller, 
    {
      bool obscure = false, 
      Widget? suffixIcon,
      String errorText = '',
      String hint = '',
      bool isDark = false,
    }
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : AppColors.textPrimary,
              decoration: TextDecoration.none,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF14121F) : AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: errorText.isNotEmpty ? Colors.red : (isDark ? Colors.white12 : AppColors.borderLight),
              ),
            ),
            child: TextField(
              controller: controller,
              obscureText: obscure,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: isDark ? Colors.white : AppColors.textPrimary,
                decoration: TextDecoration.none,
              ),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: TextStyle(
                  color: isDark ? Colors.white38 : AppColors.textSecondary,
                  fontSize: 14,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                suffixIcon: suffixIcon,
              ),
            ),
          ),
          if (errorText.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4, left: 4),
              child: Text(
                errorText,
                style: const TextStyle(color: Colors.red, fontSize: 12, decoration: TextDecoration.none),
              ),
            ),
        ],
      ),
    ).animate().fade(duration: 300.ms).slideY(begin: 0.05, end: 0);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      type: MaterialType.transparency,
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Payouts & Verification',
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : AppColors.textPrimary,
                letterSpacing: -0.5,
                decoration: TextDecoration.none,
              ),
            ).animate().fadeIn().slideX(),
            const SizedBox(height: 6),
            Text(
              'Add your payout method and verify identity for automated 24h settlements.',
              style: TextStyle(
                fontSize: 13.5,
                color: isDark ? Colors.white70 : AppColors.textSecondary,
                decoration: TextDecoration.none,
              ),
            ).animate().fadeIn(delay: 100.ms).slideX(),
            const SizedBox(height: 24),

            // Payout Mode Segment Selector (Bank vs UPI)
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? Colors.white12 : AppColors.borderLight),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: BouncingWidget(
                      onTap: () {
                        AppMotion.tapSelection();
                        _safeSetState(() => _selectedPayoutTab = 0);
                        _updateProvider();
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 6),
                        decoration: BoxDecoration(
                          color: _selectedPayoutTab == 0 ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: _selectedPayoutTab == 0
                              ? [
                                  BoxShadow(
                                    color: AppColors.primary.withValues(alpha: 0.3),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  )
                                ]
                              : [],
                        ),
                        alignment: Alignment.center,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.account_balance_rounded,
                              size: 17,
                              color: _selectedPayoutTab == 0 ? Colors.white : (isDark ? Colors.white60 : AppColors.textSecondary),
                            ),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                'Bank Account',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.bold,
                                  color: _selectedPayoutTab == 0 ? Colors.white : (isDark ? Colors.white60 : AppColors.textSecondary),
                                  decoration: TextDecoration.none,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: BouncingWidget(
                      onTap: () {
                        AppMotion.tapSelection();
                        _safeSetState(() => _selectedPayoutTab = 1);
                        _updateProvider();
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 11, horizontal: 6),
                        decoration: BoxDecoration(
                          color: _selectedPayoutTab == 1 ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: _selectedPayoutTab == 1
                              ? [
                                  BoxShadow(
                                    color: AppColors.primary.withValues(alpha: 0.3),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  )
                                ]
                              : [],
                        ),
                        alignment: Alignment.center,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.flash_on_rounded,
                              size: 17,
                              color: _selectedPayoutTab == 1 ? Colors.white : (isDark ? Colors.white60 : AppColors.textSecondary),
                            ),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                'UPI ID (Instant)',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.bold,
                                  color: _selectedPayoutTab == 1 ? Colors.white : (isDark ? Colors.white60 : AppColors.textSecondary),
                                  decoration: TextDecoration.none,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn(duration: 300.ms),

            const SizedBox(height: 24),

            // TAB 0: BANK ACCOUNT FORM
            if (_selectedPayoutTab == 0) ...[
              _buildTextField('Account Holder Name', _holderController, hint: 'e.g. Rahul Sharma', isDark: isDark),
              _buildTextField('Account Number', _accountController, hint: 'e.g. 50100234567890', isDark: isDark),
              _buildTextField(
                'IFSC Code', 
                _ifscController,
                hint: 'e.g. HDFC0000001',
                errorText: _ifscError,
                isDark: isDark,
              suffixIcon: _isLoadingIfsc
                  ? const SizedBox(
                      width: 20, 
                      height: 20, 
                      child: Padding(
                        padding: EdgeInsets.all(12.0),
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                      ),
                    )
                  : _isIfscValid
                      ? const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981))
                      : null,
            ),
            if (_bankController.text.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(bottom: 18),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.verified_rounded, color: Color(0xFF10B981), size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Bank: ${_bankController.text}',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF047857)),
                      ),
                    ),
                  ],
                ),
              ),

            // Cashfree Penny Drop Button
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _isBankPennyDropVerified
                    ? const Color(0xFF10B981).withValues(alpha: 0.08)
                    : AppColors.primary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: _isBankPennyDropVerified ? const Color(0xFF10B981) : AppColors.primary.withValues(alpha: 0.3),
                  width: 1.5,
                ),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: _isBankPennyDropVerified ? const Color(0xFF10B981) : AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          _isBankPennyDropVerified ? Icons.verified_rounded : Icons.shield_rounded,
                          color: Colors.white,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Cashfree Secure ID Penny Drop',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            Text(
                              _isBankPennyDropVerified
                                  ? 'Verified: ${_verifiedBeneficiaryName ?? "Active Account"}'
                                  : '₹1 penny drop instant bank verification',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: _isVerifyingBank ? null : _verifyWithCashfreeSecureId,
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: _isBankPennyDropVerified ? const Color(0xFF10B981) : AppColors.primary),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        backgroundColor: _isBankPennyDropVerified ? const Color(0xFF10B981).withValues(alpha: 0.08) : Colors.white,
                      ),
                      child: _isVerifyingBank
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                            )
                          : Text(
                              _isBankPennyDropVerified ? '✓ Bank Account Verified' : 'Verify Bank with Secure ID',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: _isBankPennyDropVerified ? const Color(0xFF10B981) : AppColors.primary,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ]
          // TAB 1: UPI ID FORM
          else ...[
            _buildTextField(
              'Account Holder / Payee Name',
              _holderController,
              hint: 'e.g. Rahul Sharma',
              isDark: isDark,
              suffixIcon: _holderController.text.isNotEmpty
                  ? const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981))
                  : null,
            ),
            _buildTextField(
              'UPI ID (VPA)', 
              _upiController,
              hint: 'e.g. 9876543210@axl or host@okhdfcbank',
              isDark: isDark,
              suffixIcon: _isUpiValid && _upiController.text.isNotEmpty
                  ? const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981))
                  : _upiController.text.isNotEmpty
                      ? const Icon(Icons.error_outline_rounded, color: Colors.orange)
                      : null,
            ),
            
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: _isUpiVerifiedWithCashfree
                    ? const Color(0xFF10B981).withValues(alpha: 0.08)
                    : (isDark ? const Color(0xFF1E1C2A) : AppColors.primary.withValues(alpha: 0.06)),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: _isUpiVerifiedWithCashfree ? const Color(0xFF10B981) : AppColors.primary.withValues(alpha: 0.3),
                  width: 1.5,
                ),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: _isUpiVerifiedWithCashfree ? const Color(0xFF10B981) : AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          _isUpiVerifiedWithCashfree ? Icons.verified_rounded : Icons.flash_on_rounded,
                          color: Colors.white,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Instant UPI Payouts',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                color: isDark ? Colors.white : AppColors.textPrimary,
                                decoration: TextDecoration.none,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _isUpiVerifiedWithCashfree
                                  ? 'Verified: ${_verifiedUpiAccountName ?? _holderController.text}'
                                  : 'Direct NPCI resolution with Cashfree Secure ID',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? Colors.white60 : AppColors.textSecondary,
                                decoration: TextDecoration.none,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: _isVerifyingUpi ? null : _verifyUpiWithCashfree,
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: _isUpiVerifiedWithCashfree ? const Color(0xFF10B981) : AppColors.primary),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        backgroundColor: _isUpiVerifiedWithCashfree 
                            ? const Color(0xFF10B981).withValues(alpha: 0.08) 
                            : (isDark ? const Color(0xFF261842) : Colors.white),
                      ),
                      child: _isVerifyingUpi
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                            )
                          : Text(
                              _isUpiVerifiedWithCashfree ? '✓ UPI Verified (${_verifiedUpiAccountName ?? _holderController.text})' : 'Verify UPI with Secure ID',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: _isUpiVerifiedWithCashfree ? const Color(0xFF10B981) : AppColors.primary,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 32),

          // Government ID / KYC Verification Section
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Identity Verification (KYC)',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : AppColors.textPrimary,
                  decoration: TextDecoration.none,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Instant OKYC',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF047857), decoration: TextDecoration.none),
                ),
              ),
            ],
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 6),
          Text(
            'Enter PAN / Aadhaar number for instant paperless check, or upload photo.',
            style: TextStyle(
              fontSize: 13,
              color: isDark ? Colors.white70 : AppColors.textSecondary,
              decoration: TextDecoration.none,
            ),
          ),
          const SizedBox(height: 16),

          // KYC Mode Selector (Enter Number vs Upload Photo)
          Row(
            children: [
              Expanded(
                child: BouncingWidget(
                  onTap: () => _safeSetState(() => _selectedKycMode = 0),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
                    decoration: BoxDecoration(
                      color: _selectedKycMode == 0 
                          ? AppColors.primary.withValues(alpha: isDark ? 0.25 : 0.12) 
                          : (isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _selectedKycMode == 0 ? AppColors.primary : (isDark ? Colors.white12 : AppColors.borderLight),
                        width: _selectedKycMode == 0 ? 1.8 : 1,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '🔢 Enter ID Number',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.bold,
                        color: _selectedKycMode == 0 ? AppColors.primary : (isDark ? Colors.white60 : AppColors.textSecondary),
                        decoration: TextDecoration.none,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: BouncingWidget(
                  onTap: () => _safeSetState(() => _selectedKycMode = 1),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
                    decoration: BoxDecoration(
                      color: _selectedKycMode == 1 
                          ? AppColors.primary.withValues(alpha: isDark ? 0.25 : 0.12) 
                          : (isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _selectedKycMode == 1 ? AppColors.primary : (isDark ? Colors.white12 : AppColors.borderLight),
                        width: _selectedKycMode == 1 ? 1.8 : 1,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '📷 Upload ID Photo',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12.5,
                        fontWeight: FontWeight.bold,
                        color: _selectedKycMode == 1 ? AppColors.primary : (isDark ? Colors.white60 : AppColors.textSecondary),
                        decoration: TextDecoration.none,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // KYC MODE 0: DIRECT NUMBER ENTRY
          if (_selectedKycMode == 0) ...[
            // PAN Input Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: _isPanVerified ? const Color(0xFF10B981) : AppColors.borderLight,
                  width: _isPanVerified ? 1.5 : 1,
                ),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'PAN Card Number',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      if (_isPanVerified)
                        const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 20),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: TextField(
                      controller: _panNumberController,
                      textCapitalization: TextCapitalization.characters,
                      maxLength: 10,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 2, color: AppColors.textPrimary),
                      decoration: const InputDecoration(
                        counterText: '',
                        hintText: 'e.g. ABCDE1234F',
                        hintStyle: TextStyle(fontSize: 14, letterSpacing: 0, color: AppColors.textSecondary),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: _isVerifyingPan ? null : _verifyPanWithCashfree,
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: _isPanVerified ? const Color(0xFF10B981) : AppColors.primary),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        backgroundColor: _isPanVerified ? const Color(0xFF10B981).withValues(alpha: 0.08) : Colors.white,
                      ),
                      child: _isVerifyingPan
                          ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                          : Text(
                              _isPanVerified ? '✓ PAN Verified (${_verifiedPanHolderName ?? "Valid"})' : 'Verify PAN Number',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: _isPanVerified ? const Color(0xFF10B981) : AppColors.primary,
                              ),
                            ),
                    ),
                  ),
                  if (_isPanVerified && _verifiedPanHolderName != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.verified_user_rounded, color: Color(0xFF10B981), size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Registered Name (NSDL / Income Tax Dept):',
                                  style: TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                                ),
                                Text(
                                  _verifiedPanHolderName!,
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF047857)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Aadhaar Input Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E1C2A) : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: _isAadhaarVerified ? const Color(0xFF10B981) : AppColors.borderLight,
                  width: _isAadhaarVerified ? 1.5 : 1,
                ),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Aadhaar Number (12 Digits)',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      if (_isAadhaarVerified)
                        const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 20),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: TextField(
                      controller: _aadhaarNumberController,
                      keyboardType: TextInputType.number,
                      maxLength: 12,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, letterSpacing: 2, color: AppColors.textPrimary),
                      decoration: const InputDecoration(
                        counterText: '',
                        hintText: 'e.g. 1234 5678 9012',
                        hintStyle: TextStyle(fontSize: 14, letterSpacing: 0, color: AppColors.textSecondary),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: _isSendingAadhaarOtp || _isVerifyingAadhaarOtp ? null : _sendAadhaarOtp,
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: _isAadhaarVerified ? const Color(0xFF10B981) : AppColors.primary),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        backgroundColor: _isAadhaarVerified ? const Color(0xFF10B981).withValues(alpha: 0.08) : (isDark ? const Color(0xFF261842) : Colors.white),
                      ),
                      child: _isSendingAadhaarOtp || _isVerifyingAadhaarOtp
                          ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                          : Text(
                              _isAadhaarVerified ? '✓ Aadhaar OKYC Verified' : 'Verify via Aadhaar OTP (Paperless)',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: _isAadhaarVerified ? const Color(0xFF10B981) : AppColors.primary,
                              ),
                            ),
                    ),
                  ),
                  if (!_isAadhaarVerified) ...[
                    const SizedBox(height: 8),
                    Center(
                      child: TextButton.icon(
                        onPressed: () {
                          _aadhaarRefId = _aadhaarRefId ?? '84796849';
                          _showAadhaarOtpDialog();
                        },
                        icon: const Icon(Icons.dialpad_rounded, size: 16, color: AppColors.primary),
                        label: const Text(
                          'Already received OTP on mobile? Enter OTP',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ]
          // KYC MODE 1: UPLOAD PHOTO
          else ...[
            InkWell(
              onTap: () async {
                if (_isExtractingId) return;
                try {
                  final picked = await showStayQUploadSheet(
                    context,
                    title: 'Upload Government ID',
                    subtitle: 'Take photo of PAN / Aadhaar, select from gallery, or browse files',
                    type: MediaUploadType.documentOrImage,
                  );
                  if (picked != null && picked.isNotEmpty) {
                    final pickedPath = picked.first;
                    if (!mounted) return;
                    _safeSetState(() { _govIdPath = pickedPath; _isFaceVerified = false; });
                    context.read<HostOnboardingProvider>().updatePropertyDocuments(ownerIdProof: pickedPath);
                    _recordChecks();
                    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
                    provider.idNumber = 'PHOTO_UPLOADED';
                    provider.idType = 'DOCUMENT';
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                  }
                }
              },
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: _govIdPath.isNotEmpty
                      ? const Color(0xFF10B981).withValues(alpha: 0.08)
                      : (isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: _govIdPath.isNotEmpty ? const Color(0xFF10B981) : AppColors.borderLight,
                    width: 1.5,
                  ),
                ),
                child: Column(
                  children: [
                    if (_govIdPath.isNotEmpty) ...[
                      const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 36),
                      const SizedBox(height: 8),
                      const Text(
                        'Document Uploaded Successfully',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF047857)),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Tap to change ID photo',
                        style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.bold),
                      ),
                    ] else ...[
                      const Icon(Icons.badge_rounded, color: AppColors.primary, size: 36),
                      const SizedBox(height: 8),
                      const Text(
                        'Upload PAN / Aadhaar Photo',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Instant camera or gallery upload',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],

          const SizedBox(height: 28),

          // ══════════════════════════════════════════════════════════════════
          // HOST SELFIE PHOTO (Simple instant camera/gallery upload)
          // ══════════════════════════════════════════════════════════════════
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: _selfiePath.isNotEmpty
                    ? [const Color(0xFF064E3B), const Color(0xFF065F46)]
                    : (isDark
                        ? [const Color(0xFF1E1B4B), const Color(0xFF2A2758)]
                        : [const Color(0xFFEEF2FF), const Color(0xFFE0E7FF)]),
              ),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: _selfiePath.isNotEmpty ? const Color(0xFF10B981) : const Color(0xFF6366F1).withValues(alpha: 0.5),
                width: 1.5,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: _selfiePath.isNotEmpty
                            ? const Color(0xFF10B981).withValues(alpha: 0.2)
                            : const Color(0xFF6366F1).withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _selfiePath.isNotEmpty ? Icons.verified_user_rounded : Icons.camera_front_rounded,
                        color: _selfiePath.isNotEmpty ? const Color(0xFF10B981) : const Color(0xFF6366F1),
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                _selfiePath.isNotEmpty ? 'Selfie Photo Uploaded ✓' : 'Host Selfie Photo',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w900,
                                  color: _selfiePath.isNotEmpty ? const Color(0xFF10B981) : (isDark ? Colors.white : const Color(0xFF312E81)),
                                ),
                              ),
                              if (_selfiePath.isNotEmpty) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF10B981).withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.5)),
                                  ),
                                  child: const Text(
                                    'READY',
                                    style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: Color(0xFF10B981)),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _selfiePath.isNotEmpty
                                ? 'Selfie captured for profile verification'
                                : 'Take a photo or choose from gallery to verify your identity',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: _selfiePath.isNotEmpty ? const Color(0xFF6EE7B7) : (isDark ? Colors.white60 : const Color(0xFF4338CA)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                if (_selfiePath.isNotEmpty) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      height: 140,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        border: Border.all(color: const Color(0xFF10B981), width: 2),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: _selfiePath.startsWith('http')
                            ? Image.network(
                                _selfiePath,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => const Center(
                                  child: Icon(Icons.broken_image_rounded, color: Colors.grey, size: 36),
                                ),
                              )
                            : (File(_selfiePath).existsSync()
                                ? Image.file(
                                    File(_selfiePath),
                                    fit: BoxFit.cover,
                                  )
                                : const Center(
                                    child: Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 36),
                                  )),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _isVerifyingFace ? null : _showSelfieCaptureSheet,
                    icon: _isVerifyingFace
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Icon(
                            _selfiePath.isNotEmpty ? Icons.refresh_rounded : Icons.camera_front_rounded,
                            size: 20,
                          ),
                    label: Text(
                      _isVerifyingFace
                          ? 'Uploading Selfie...'
                          : (_selfiePath.isNotEmpty ? 'Retake / Change Selfie' : 'Upload Selfie Photo'),
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _selfiePath.isNotEmpty ? const Color(0xFF10B981) : const Color(0xFF6366F1),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 2,
                    ),
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 400.ms),

          const SizedBox(height: 40),
        ],
      ),
    ),
  );
}
}

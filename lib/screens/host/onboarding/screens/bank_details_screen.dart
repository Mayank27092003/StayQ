import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_motion.dart';
import '../../../../widgets/bouncing_widget.dart';
import '../../../../services/api/api_client.dart';
import '../../../../services/api/verification_api.dart';

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
    if (_extractedId != null) {
      _govIdPath = 'Already Uploaded';
    }

    if (provider.upiId.isNotEmpty && provider.accountNumber.isEmpty) {
      _selectedPayoutTab = 1;
    }

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
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    provider.updateBankDetails(
      _holderController.text,
      _selectedPayoutTab == 0 ? _accountController.text : '',
      _selectedPayoutTab == 0 ? _ifscController.text : '',
      _selectedPayoutTab == 0 ? _bankController.text : '',
      _selectedPayoutTab == 1 ? _upiController.text : _upiController.text,
      '',
    );
  }

  void _updateKycProvider() {
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    if (_panNumberController.text.isNotEmpty) {
      provider.idNumber = _panNumberController.text.trim().toUpperCase();
      provider.idType = 'PAN';
      provider.idName = _verifiedPanHolderName;
    } else if (_aadhaarNumberController.text.isNotEmpty) {
      provider.idNumber = _aadhaarNumberController.text.trim().replaceAll(' ', '');
      provider.idType = 'Aadhaar';
    }
  }

  void _onIfscChanged() {
    final ifsc = _ifscController.text.trim().toUpperCase();
    if (ifsc.isEmpty || ifsc.length != 11) {
      setState(() {
        _isIfscValid = false;
        _ifscError = ifsc.isNotEmpty && ifsc.length < 11 ? 'IFSC must be 11 characters' : '';
      });
      return;
    }

    if (_ifscDebounce?.isActive ?? false) _ifscDebounce!.cancel();
    _ifscDebounce = Timer(const Duration(milliseconds: 400), () async {
      setState(() {
        _isLoadingIfsc = true;
        _ifscError = '';
      });

      try {
        final response = await http.get(Uri.parse('https://ifsc.razorpay.com/$ifsc'));
        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          setState(() {
            _bankController.text = data['BANK'] ?? '';
            _isIfscValid = true;
            _ifscError = '';
          });
        } else {
          setState(() {
            _isIfscValid = false;
            _ifscError = 'Invalid IFSC code';
          });
        }
      } catch (e) {
        setState(() {
          _isIfscValid = false;
          _ifscError = 'Failed to verify IFSC';
        });
      } finally {
        if (mounted) setState(() => _isLoadingIfsc = false);
      }
    });
  }

  void _onUpiChanged() {
    final upi = _upiController.text.trim();
    final upiRegex = RegExp(r'^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$');
    setState(() {
      _isUpiValid = upiRegex.hasMatch(upi);
    });
  }

  Future<void> _verifyWithCashfreeSecureId() async {
    final account = _accountController.text.trim();
    final ifsc = _ifscController.text.trim().toUpperCase();
    if (account.isEmpty || ifsc.isEmpty || ifsc.length != 11) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid Account Number and 11-digit IFSC code.')),
      );
      return;
    }

    setState(() => _isVerifyingBank = true);
    try {
      final apiClient = ApiClient(baseUrl: 'https://stayq-api-608570851336.asia-south1.run.app/api/v1');
      final verificationApi = VerificationApi(apiClient);
      final res = await verificationApi.verifyBankAccount(
        accountNumber: account,
        ifsc: ifsc,
        name: _holderController.text.trim().isNotEmpty ? _holderController.text.trim() : null,
        isHost: true,
      );

      if (res['accountStatus'] == 'VALID' || res['status'] == 'SUCCESS') {
        setState(() {
          _isBankPennyDropVerified = true;
          _verifiedBeneficiaryName = res['nameAtBank'] ?? res['name'];
          if (_verifiedBeneficiaryName != null && _holderController.text.isEmpty) {
            _holderController.text = _verifiedBeneficiaryName!;
          }
        });
        _updateProvider();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.verified_rounded, color: Colors.white, size: 20),
                  const SizedBox(width: 8),
                  Expanded(child: Text('Verified via Cashfree Secure ID: ${_verifiedBeneficiaryName ?? "Valid Account"}')),
                ],
              ),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Bank Verification: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isVerifyingBank = false);
    }
  }

  Future<void> _verifyUpiWithCashfree() async {
    final upi = _upiController.text.trim().toLowerCase();
    if (upi.isEmpty || !_isUpiValid) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid UPI ID (e.g. 9876543210@paytm).')),
      );
      return;
    }

    setState(() => _isVerifyingUpi = true);
    try {
      final apiClient = ApiClient(baseUrl: 'https://stayq-api-608570851336.asia-south1.run.app/api/v1');
      final verificationApi = VerificationApi(apiClient);
      final res = await verificationApi.verifyUpi(
        vpa: upi,
        name: _holderController.text.trim().isNotEmpty ? _holderController.text.trim() : null,
      );

      if (res['vpaStatus'] == 'VALID' || res['status'] == 'SUCCESS' || res['accountExists'] == 'YES') {
        setState(() {
          _isUpiVerifiedWithCashfree = true;
          _verifiedUpiAccountName = res['nameAtBank'] ?? res['name'] ?? 'Active UPI ID';
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.verified_rounded, color: Colors.white, size: 20),
                  const SizedBox(width: 8),
                  Expanded(child: Text('UPI Verified: ${_verifiedUpiAccountName ?? "Active VPA"}')),
                ],
              ),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('UPI Verification: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isVerifyingUpi = false);
    }
  }

  Future<void> _verifyPanWithCashfree() async {
    final pan = _panNumberController.text.trim().toUpperCase();
    final panRegex = RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$');
    if (!panRegex.hasMatch(pan)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 10-digit PAN format (e.g. ABCDE1234F).')),
      );
      return;
    }

    setState(() => _isVerifyingPan = true);
    try {
      final apiClient = ApiClient(baseUrl: 'https://stayq-api-608570851336.asia-south1.run.app/api/v1');
      final verificationApi = VerificationApi(apiClient);
      final res = await verificationApi.verifyPan(
        pan: pan,
        name: _holderController.text.isNotEmpty ? _holderController.text : null,
      );

      if (res['panStatus'] == 'VALID' || res['status'] == 'SUCCESS' || res['valid'] == true) {
        setState(() {
          _isPanVerified = true;
          _verifiedPanHolderName = res['registeredName'] ?? res['name'] ?? 'Verified Taxpayer';
        });
        _updateKycProvider();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('✓ PAN Verified: ${_verifiedPanHolderName ?? "Valid PAN"}'),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('PAN Check: $e')));
      }
    } finally {
      if (mounted) setState(() => _isVerifyingPan = false);
    }
  }

  Future<void> _sendAadhaarOtp() async {
    final aadhaar = _aadhaarNumberController.text.trim().replaceAll(' ', '');
    if (aadhaar.length != 12 || int.tryParse(aadhaar) == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 12-digit Aadhaar number.')),
      );
      return;
    }

    setState(() => _isSendingAadhaarOtp = true);
    try {
      final apiClient = ApiClient(baseUrl: 'https://stayq-api-608570851336.asia-south1.run.app/api/v1');
      final verificationApi = VerificationApi(apiClient);
      final res = await verificationApi.generateAadhaarOtp(aadhaarNumber: aadhaar);
      _aadhaarRefId = res['referenceId']?.toString() ?? res['refId']?.toString();

      if (mounted) {
        _showAadhaarOtpDialog();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Aadhaar OTP request: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSendingAadhaarOtp = false);
    }
  }

  void _showAadhaarOtpDialog() {
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
    setState(() => _isVerifyingAadhaarOtp = true);
    try {
      final apiClient = ApiClient(baseUrl: 'https://stayq-api-608570851336.asia-south1.run.app/api/v1');
      final verificationApi = VerificationApi(apiClient);
      final res = await verificationApi.verifyAadhaarOtp(
        referenceId: _aadhaarRefId ?? '',
        otp: otp,
      );

      if (res['status'] == 'VALID' || res['status'] == 'SUCCESS' || res['valid'] == true) {
        setState(() {
          _isAadhaarVerified = true;
        });
        _updateKycProvider();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✓ Aadhaar OKYC Verified Successfully!'),
              backgroundColor: Color(0xFF10B981),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('OTP verification: $e')));
      }
    } finally {
      if (mounted) setState(() => _isVerifyingAadhaarOtp = false);
    }
  }

  Widget _buildTextField(
    String label, 
    TextEditingController controller, 
    {
      bool obscure = false, 
      Widget? suffixIcon,
      String errorText = '',
      String hint = '',
    }
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: errorText.isNotEmpty ? Colors.red : AppColors.borderLight,
              ),
            ),
            child: TextField(
              controller: controller,
              obscureText: obscure,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
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
                style: const TextStyle(color: Colors.red, fontSize: 12),
              ),
            ),
        ],
      ),
    ).animate().fade(duration: 300.ms).slideY(begin: 0.05, end: 0);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Payouts & Verification',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 6),
          const Text(
            'Add your payout method and verify identity for automated 24h settlements.',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 24),

          // Payout Mode Segment Selector (Bank vs UPI)
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E1C2A) : AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Row(
              children: [
                Expanded(
                  child: BouncingWidget(
                    onTap: () {
                      AppMotion.tapSelection();
                      setState(() => _selectedPayoutTab = 0);
                      _updateProvider();
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(vertical: 12),
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
                        children: [
                          Icon(
                            Icons.account_balance_rounded,
                            size: 18,
                            color: _selectedPayoutTab == 0 ? Colors.white : AppColors.textSecondary,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Bank Account',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: _selectedPayoutTab == 0 ? Colors.white : AppColors.textSecondary,
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
                      setState(() => _selectedPayoutTab = 1);
                      _updateProvider();
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(vertical: 12),
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
                        children: [
                          Icon(
                            Icons.flash_on_rounded,
                            size: 18,
                            color: _selectedPayoutTab == 1 ? Colors.white : AppColors.textSecondary,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'UPI ID (Instant)',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: _selectedPayoutTab == 1 ? Colors.white : AppColors.textSecondary,
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
            _buildTextField('Account Holder Name', _holderController, hint: 'e.g. Mayank Kumar'),
            _buildTextField('Account Number', _accountController, hint: 'e.g. 50100234567890'),
            _buildTextField(
              'IFSC Code', 
              _ifscController,
              hint: 'e.g. HDFC0000001',
              errorText: _ifscError,
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
              'UPI ID (VPA)', 
              _upiController,
              hint: 'e.g. 9876543210@paytm or host@okhdfcbank',
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
                    : AppColors.primary.withValues(alpha: 0.06),
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
                            const Text(
                              'Instant UPI Payouts',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
                            Text(
                              _isUpiVerifiedWithCashfree
                                  ? 'Verified: ${_verifiedUpiAccountName ?? "Active VPA"}'
                                  : 'Direct NPCI resolution with Cashfree Secure ID',
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
                      onPressed: _isVerifyingUpi ? null : _verifyUpiWithCashfree,
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: _isUpiVerifiedWithCashfree ? const Color(0xFF10B981) : AppColors.primary),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        backgroundColor: _isUpiVerifiedWithCashfree ? const Color(0xFF10B981).withValues(alpha: 0.08) : Colors.white,
                      ),
                      child: _isVerifyingUpi
                          ? const SizedBox(
                              height: 18,
                              width: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                            )
                          : Text(
                              _isUpiVerifiedWithCashfree ? '✓ UPI Verified (${_verifiedUpiAccountName ?? "Active"})' : 'Verify UPI with Secure ID',
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
              const Text(
                'Identity Verification (KYC)',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
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
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF047857)),
                ),
              ),
            ],
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 6),
          const Text(
            'Enter PAN / Aadhaar number for instant paperless check, or upload photo.',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 16),

          // KYC Mode Selector (Enter Number vs Upload Photo)
          Row(
            children: [
              Expanded(
                child: BouncingWidget(
                  onTap: () => setState(() => _selectedKycMode = 0),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: _selectedKycMode == 0 ? AppColors.primary.withValues(alpha: 0.12) : AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _selectedKycMode == 0 ? AppColors.primary : AppColors.borderLight,
                        width: _selectedKycMode == 0 ? 1.8 : 1,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '🔢 Enter ID Number',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: _selectedKycMode == 0 ? AppColors.primary : AppColors.textSecondary,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: BouncingWidget(
                  onTap: () => setState(() => _selectedKycMode = 1),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: _selectedKycMode == 1 ? AppColors.primary.withValues(alpha: 0.12) : AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _selectedKycMode == 1 ? AppColors.primary : AppColors.borderLight,
                        width: _selectedKycMode == 1 ? 1.8 : 1,
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '📷 Upload ID Photo',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: _selectedKycMode == 1 ? AppColors.primary : AppColors.textSecondary,
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
                        backgroundColor: _isAadhaarVerified ? const Color(0xFF10B981).withValues(alpha: 0.08) : Colors.white,
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
                  final picker = ImagePicker();
                  final pickedFile = await picker.pickImage(source: ImageSource.gallery);
                  if (pickedFile != null) {
                    setState(() => _govIdPath = pickedFile.path);
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

          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

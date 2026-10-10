import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../providers/app_provider.dart';
import '../../services/api/api_client.dart';
import '../../services/api/verification_api.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_motion.dart';
import '../../widgets/bouncing_widget.dart';

class KycVerificationScreen extends StatefulWidget {
  final bool initialIsHost;
  final int initialTabIndex;
  const KycVerificationScreen({super.key, this.initialIsHost = false, this.initialTabIndex = 0});

  @override
  State<KycVerificationScreen> createState() => _KycVerificationScreenState();
}

class _KycVerificationScreenState extends State<KycVerificationScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late VerificationApi _verificationApi;

  int _credentialRevision = 0;
  bool _isLoadingStatus = true;
  Map<String, dynamic>? _verificationStatus;

  // Edit toggles to allow user to modify already-verified credentials
  bool _editBank = false;
  bool _editAadhaar = false;
  bool _editPan = false;
  bool _editUpi = false;

  // Bank Form State
  final _accountController = TextEditingController();
  final _ifscController = TextEditingController();
  final _accountHolderController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isVerifyingBank = false;
  Map<String, dynamic>? _bankResult;

  // Aadhaar Form State
  final _aadhaarController = TextEditingController();
  final _aadhaarOtpController = TextEditingController();
  String? _aadhaarRefId;
  String? _challengeAadhaar;
  bool _isGeneratingAadhaarOtp = false;
  bool _isVerifyingAadhaarOtp = false;
  Map<String, dynamic>? _aadhaarResult;

  // PAN Form State
  final _panController = TextEditingController();
  final _panNameController = TextEditingController();
  bool _isVerifyingPan = false;
  Map<String, dynamic>? _panResult;

  // UPI Form State
  final _upiController = TextEditingController();
  final _upiNameController = TextEditingController();
  bool _isVerifyingUpi = false;
  Map<String, dynamic>? _upiResult;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 4,
      vsync: this,
      initialIndex: widget.initialTabIndex,
    );
    final apiClient = ApiClient.instance;
    _verificationApi = VerificationApi(apiClient);
    _accountController.addListener(() => _invalidate('bank'));
    _ifscController.addListener(() => _invalidate('bank'));
    _aadhaarController.addListener(() { _aadhaarRefId = null; _challengeAadhaar = null; _invalidate('aadhaar'); });
    _panController.addListener(() => _invalidate('pan'));
    _upiController.addListener(() => _invalidate('upi'));
    _loadStatus();
  }

  void _invalidate(String type) {
    if (!mounted) return;
    _credentialRevision++;
    context.read<AppProvider>().invalidateVerification(type);
    _safeSetState(() {
      _verificationStatus = {...?_verificationStatus,
        if (type == 'bank') ...{'isBankVerified': false, 'bankAccountVerified': false},
        if (type == 'upi') ...{'isUpiVerified': false, 'upiVerified': false},
        if (type == 'aadhaar') ...{'isAadhaarVerified': false, 'aadhaarVerified': false},
        if (type == 'pan') ...{'isPanVerified': false, 'panVerified': false}};
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _accountController.dispose();
    _ifscController.dispose();
    _accountHolderController.dispose();
    _phoneController.dispose();
    _aadhaarController.dispose();
    _aadhaarOtpController.dispose();
    _panController.dispose();
    _panNameController.dispose();
    _upiController.dispose();
    _upiNameController.dispose();
    super.dispose();
  }

  Future<void> _loadStatus() async {
    final revision = _credentialRevision;
    _safeSetState(() => _isLoadingStatus = true);
    try {
      final res = await _verificationApi.getVerificationStatus();
      if (mounted && revision == _credentialRevision) {
        _safeSetState(() {
          _verificationStatus = res;
          _isLoadingStatus = false;
        });
        context.read<AppProvider>().syncVerificationFromBackend(res);
      } else { _safeSetState(() => _isLoadingStatus = false); }
    } catch (e) {
      if (mounted) {
        _safeSetState(() => _isLoadingStatus = false);
      }
    }
  }

  // 1. Bank Account Penny Drop
  Future<void> _verifyBank() async {
    final acc = _accountController.text.trim();
    final ifsc = _ifscController.text.trim();
    if (acc.length < 8 || ifsc.length != 11) {
      _showSnackbar('Please enter a valid Account Number & 11-digit IFSC code', isError: true);
      return;
    }

    _safeSetState(() {
      _isVerifyingBank = true;
      _bankResult = null;
    });

    try {
      final res = await _verificationApi.verifyBankAccount(
        accountNumber: acc,
        ifsc: ifsc,
        name: _accountHolderController.text.trim().isNotEmpty ? _accountHolderController.text.trim() : null,
        phone: _phoneController.text.trim().isNotEmpty ? _phoneController.text.trim() : null,
        isHost: widget.initialIsHost,
      );
      if (!mounted || _accountController.text.trim() != acc || _ifscController.text.trim() != ifsc) return;

      _safeSetState(() {
        _bankResult = res;
        _isVerifyingBank = false;
      });

      if (res['verified'] == true || res['accountStatus'] == 'VALID') {
        final bankName = res['bankName'] ?? ifsc.substring(0, 4);
        final holderName = res['nameAtBank'] ?? res['name'] ?? _accountHolderController.text.trim();
        if (mounted) {
          context.read<AppProvider>().setBankVerified(
            bankName: bankName,
            accountNumber: acc,
            ifsc: ifsc,
            accountHolderName: holderName.isNotEmpty ? holderName : null,
          );
        }
        AppMotion.tapHeavy();
        _showSnackbar('Bank Account Verified via Cashfree Penny Drop! ✅');
        _loadStatus();
      } else {
        _showSnackbar(res['message'] ?? 'Bank verification failed. Check account details.', isError: true);
      }
    } catch (e) {
      _safeSetState(() => _isVerifyingBank = false);
      _showSnackbar('Verification request error: $e', isError: true);
    } finally { _safeSetState(() => _isVerifyingBank = false); }
  }

  // 2. Aadhaar OKYC - Step 1: Send OTP
  Future<void> _sendAadhaarOtp() async {
    final cleanAadhaar = _aadhaarController.text.replaceAll(' ', '').trim();
    if (cleanAadhaar.length != 12) {
      _showSnackbar('Please enter a valid 12-digit Aadhaar number', isError: true);
      return;
    }

    _safeSetState(() {
      _isGeneratingAadhaarOtp = true;
      _aadhaarResult = null;
    });

    _aadhaarRefId = null; _challengeAadhaar = null;
    try {
      final res = await _verificationApi.generateAadhaarOtp(aadhaarNumber: cleanAadhaar);
      if (!mounted || _aadhaarController.text.replaceAll(' ', '').trim() != cleanAadhaar) return;
      _safeSetState(() {
        _isGeneratingAadhaarOtp = false;
        _aadhaarRefId = res['referenceId']?.toString() ?? res['refId']?.toString();
        _challengeAadhaar = _aadhaarRefId?.isNotEmpty == true ? cleanAadhaar : null;
      });

      if (_aadhaarRefId?.isNotEmpty == true) {
        AppMotion.tapLight();
        _showSnackbar(res['message'] ?? 'OTP sent to mobile linked with Aadhaar! 📲');
      } else {
        _showSnackbar(res['message'] ?? 'Failed to send Aadhaar OTP', isError: true);
      }
    } catch (e) {
      _safeSetState(() => _isGeneratingAadhaarOtp = false);
      _showSnackbar('Aadhaar OTP request error: $e', isError: true);
    } finally { _safeSetState(() => _isGeneratingAadhaarOtp = false); }
  }

  // 2. Aadhaar OKYC - Step 2: Verify OTP
  Future<void> _verifyAadhaarOtp() async {
    if (_isVerifyingAadhaarOtp) return;
    final otp = _aadhaarOtpController.text.trim();
    final aadhaar = _aadhaarController.text.replaceAll(' ', '').trim();
    final reference = _aadhaarRefId;
    if (!RegExp(r'^\d{6}$').hasMatch(otp) || reference == null || _challengeAadhaar != aadhaar) {
      _showSnackbar('Request an OTP for this Aadhaar and enter the six-digit code.', isError: true); return;
    }
    _safeSetState(() { _isVerifyingAadhaarOtp = true; _aadhaarResult = null; });
    try {
      final res = await _verificationApi.verifyAadhaarOtp(referenceId: reference, otp: otp);
      if (!mounted || _aadhaarRefId != reference || _challengeAadhaar != aadhaar ||
          _aadhaarController.text.replaceAll(' ', '').trim() != aadhaar) return;
      _safeSetState(() => _aadhaarResult = res);
      if (res['verified'] == true || res['status'] == 'VALID' || res['status'] == 'VERIFIED') {
        context.read<AppProvider>().setAadhaarVerified(name: res['name']?.toString() ?? '',
          aadhaarNumber: aadhaar, address: res['address']?.toString() ?? '', dob: res['dob']?.toString());
        AppMotion.tapHeavy(); _showSnackbar('Aadhaar verification confirmed.'); await _loadStatus();
      } else { _showSnackbar(res['message']?.toString() ?? 'Invalid Aadhaar OTP', isError: true); }
    } catch (e) { if (mounted) _showSnackbar('Aadhaar verification error: $e', isError: true); }
    finally { _safeSetState(() => _isVerifyingAadhaarOtp = false); }
  }

  // 3. PAN Verification
  Future<void> _verifyPan() async {
    final pan = _panController.text.trim().toUpperCase();
    final name = _panNameController.text.trim();
    if (pan.length != 10) {
      _showSnackbar('Please enter a valid 10-character PAN number (e.g. ABCDE1234F)', isError: true);
      return;
    }

    _safeSetState(() {
      _isVerifyingPan = true;
      _panResult = null;
    });

    try {
      final res = await _verificationApi.verifyPan(
        pan: pan,
        name: name.isNotEmpty ? name : null,
      );
      if (!mounted || _panController.text.trim().toUpperCase() != pan) return;

      _safeSetState(() {
        _panResult = res;
        _isVerifyingPan = false;
      });

      if (res['valid'] == true || res['verified'] == true) {
        final resolvedName = res['registeredName'] ?? res['name'] ?? res['registered_name'] ?? '';
        if (resolvedName.isNotEmpty) {
          _panNameController.text = resolvedName;
        }
        if (mounted) {
          context.read<AppProvider>().setPanVerified(
            name: resolvedName,
            panNumber: pan,
          );
        }
        AppMotion.tapHeavy();
        _showSnackbar('✓ PAN Verified with NSDL: $resolvedName');
        _loadStatus();
      } else if (res['status'] == 'IP_WHITELIST_REQUIRED') {
        _showSnackbar(res['message'] ?? 'Cashfree IP whitelisting required in Merchant Portal.', isError: true);
      } else {
        _showSnackbar(res['message'] ?? 'PAN verification failed', isError: true);
      }
    } catch (e) {
      _safeSetState(() => _isVerifyingPan = false);
      _showSnackbar('PAN verification error: $e', isError: true);
    } finally { _safeSetState(() => _isVerifyingPan = false); }
  }

  // 4. UPI Verification
  Future<void> _verifyUpi() async {
    final vpa = _upiController.text.trim().toLowerCase();
    if (!vpa.contains('@')) {
      _showSnackbar('Please enter a valid UPI ID (e.g. 6266601638@axl)', isError: true);
      return;
    }

    _safeSetState(() {
      _isVerifyingUpi = true;
      _upiResult = null;
    });

    try {
      final res = await _verificationApi.verifyUpi(
        vpa: vpa,
        name: _upiNameController.text.trim().isNotEmpty ? _upiNameController.text.trim() : null,
      );
      if (!mounted || _upiController.text.trim().toLowerCase() != vpa) return;

      _safeSetState(() {
        _upiResult = res;
        _isVerifyingUpi = false;
      });

      if (res['valid'] == true) {
        final holderName = res['nameAtVpa'] ?? res['name'] ?? _upiNameController.text.trim();
        if (mounted) {
          context.read<AppProvider>().setUpiVerified(
            upiId: vpa,
            name: holderName.isNotEmpty ? holderName : null,
          );
        }
        AppMotion.tapHeavy();
        _showSnackbar('✓ UPI ID Verified with Cashfree Secure ID');
        _loadStatus();
      } else {
        _showSnackbar(res['message'] ?? 'UPI verification failed', isError: true);
      }
    } catch (e) {
      _safeSetState(() => _isVerifyingUpi = false);
      _showSnackbar('UPI verification error: $e', isError: true);
    } finally { _safeSetState(() => _isVerifyingUpi = false); }
  }

  void _safeSetState(VoidCallback change) { if (mounted) setState(change); }

  void _showSnackbar(String msg, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? AppColors.errorRed : AppColors.primary,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Identity & SecureID Verification', style: TextStyle(fontWeight: FontWeight.bold)),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          tabs: const [
            Tab(icon: Icon(Icons.account_balance_rounded), text: 'Bank Penny Drop'),
            Tab(icon: Icon(Icons.shield_outlined), text: 'Aadhaar OKYC'),
            Tab(icon: Icon(Icons.badge_outlined), text: 'PAN Card'),
            Tab(icon: Icon(Icons.flash_on_rounded), text: 'UPI Fast Refund'),
          ],
        ),
      ),
      body: _isLoadingStatus
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : Column(
              children: [
                _buildVerificationHeader(),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildBankTab(),
                      _buildAadhaarTab(),
                      _buildPanTab(),
                      _buildUpiTab(),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildVerificationHeader() {
    final provider = context.watch<AppProvider>();
    final isBankVerified = _verificationStatus?['isBankVerified'] == true ||
        _verificationStatus?['bankAccountVerified'] == true ||
        provider.isBankVerified;
    final isAadhaarVerified = _verificationStatus?['isAadhaarVerified'] == true ||
        _verificationStatus?['aadhaarVerified'] == true ||
        provider.isAadhaarVerified;
    final isPanVerified = _verificationStatus?['isPanVerified'] == true ||
        _verificationStatus?['panVerified'] == true ||
        provider.isPanVerified;

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            const Color(0xFF4F46E5).withValues(alpha: 0.1),
            const Color(0xFF06B6D4).withValues(alpha: 0.08),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF4F46E5).withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Color(0xFF4F46E5),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.verified_user_rounded, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Cashfree SecureID Verified Protection',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Instant 60-sec refund routing & verified host payouts',
                      style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              _buildStatusPill('Bank Account', isBankVerified),
              _buildStatusPill('UIDAI Aadhaar', isAadhaarVerified),
              _buildStatusPill('NSDL PAN', isPanVerified),
            ],
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: -0.1);
  }

  Widget _buildStatusPill(String title, bool isVerified) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isVerified ? const Color(0xFF10B981).withValues(alpha: 0.15) : Colors.black.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isVerified ? const Color(0xFF10B981) : AppColors.borderLight,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isVerified ? Icons.check_circle_rounded : Icons.pending_outlined,
            size: 14,
            color: isVerified ? const Color(0xFF059669) : AppColors.textMuted,
          ),
          const SizedBox(width: 4),
          Text(
            '$title: ${isVerified ? "Verified" : "Pending"}',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isVerified ? const Color(0xFF059669) : AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerifiedCredentialCard({
    required String title,
    required String subtitle,
    required List<MapEntry<String, String>> fields,
    required VoidCallback onEdit,
    String editLabel = 'Update Details',
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF10B981).withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Color(0xFF10B981),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_rounded, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF047857)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.verified_rounded, color: Colors.white, size: 12),
                    SizedBox(width: 4),
                    Text(
                      'VERIFIED',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 10),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: Color(0xFFA7F3D0)),
          const SizedBox(height: 12),
          ...fields.map((f) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      f.key,
                      style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                    ),
                    Flexible(
                      child: Text(
                        f.value,
                        textAlign: TextAlign.end,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              )),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: onEdit,
              icon: const Icon(Icons.edit_outlined, size: 16, color: AppColors.textSecondary),
              label: Text(editLabel, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.borderLight),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.05);
  }

  // TAB 1: Bank Account
  Widget _buildBankTab() {
    final provider = context.watch<AppProvider>();
    final isBankVerified = _verificationStatus?['isBankVerified'] == true ||
        _verificationStatus?['bankAccountVerified'] == true ||
        provider.isBankVerified;

    if (isBankVerified && !_editBank) {
      final bankDetails = _verificationStatus?['bankDetails'] as Map?;
      final bankName = bankDetails?['bankName']?.toString() ??
          (provider.verifiedBankName.isNotEmpty ? provider.verifiedBankName : 'Verified Bank');
      final accNum = bankDetails?['accountNumberMasked']?.toString() ??
          (provider.verifiedAccountNumber.isNotEmpty ? provider.verifiedAccountNumber : '••••••••');
      final holder = _verificationStatus?['accountHolderName']?.toString() ??
          (provider.verifiedFullName.isNotEmpty ? provider.verifiedFullName : 'Account Holder');
      final ifsc = bankDetails?['ifsc']?.toString() ?? 'VERIFIED';

      return SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildVerifiedCredentialCard(
              title: 'Bank Account Verified',
              subtitle: 'Cashfree Penny Drop Authenticated',
              fields: [
                MapEntry('Bank Name', bankName),
                MapEntry('Account Number', accNum),
                MapEntry('IFSC Code', ifsc),
                MapEntry('Beneficiary Name', holder),
                const MapEntry('Status', 'Active for Instant 60-Sec Refund & Payouts'),
              ],
              onEdit: () {
                _safeSetState(() => _editBank = true);
              },
              editLabel: 'Change or Re-verify Bank Account',
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isBankVerified && _editBank) ...[
            TextButton.icon(
              onPressed: () => _safeSetState(() => _editBank = false),
              icon: const Icon(Icons.arrow_back, size: 16),
              label: const Text('Back to Verified Bank Details'),
            ),
            const SizedBox(height: 8),
          ],
          const Text(
            'Penny Drop Bank Verification',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 4),
          const Text(
            'SecureID performs an instant ₹1 penny drop to verify account authenticity, active status, and matching beneficiary name.',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 20),

          _buildInputField('Account Number', _accountController, icon: Icons.numbers_rounded, keyboardType: TextInputType.number),
          const SizedBox(height: 14),
          _buildInputField('IFSC Code', _ifscController, icon: Icons.location_city_rounded, isCaps: true),
          const SizedBox(height: 14),
          _buildInputField('Beneficiary Name (Optional Match)', _accountHolderController, icon: Icons.person_outline_rounded),
          const SizedBox(height: 14),
          _buildInputField('Phone Number (Optional)', _phoneController, icon: Icons.phone_outlined, keyboardType: TextInputType.phone),
          const SizedBox(height: 24),

          if (_bankResult != null) _buildResultCard(_bankResult!),

          const SizedBox(height: 12),
          BouncingWidget(
            onTap: _isVerifyingBank ? null : _verifyBank,
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isVerifyingBank ? null : _verifyBank,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: _isVerifyingBank
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.verified_rounded, color: Colors.white, size: 20),
                          SizedBox(width: 8),
                          Text('Verify Bank with Cashfree SecureID', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white)),
                        ],
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // TAB 2: Aadhaar OKYC
  Widget _buildAadhaarTab() {
    final provider = context.watch<AppProvider>();
    final isAadhaarVerified = _verificationStatus?['isAadhaarVerified'] == true ||
        _verificationStatus?['aadhaarVerified'] == true ||
        provider.isAadhaarVerified;

    if (isAadhaarVerified && !_editAadhaar) {
      final name = provider.verifiedFullName.isNotEmpty
          ? provider.verifiedFullName
          : (_verificationStatus?['displayName']?.toString() ?? 'UIDAI Aadhaar Holder');
      final aadhaarNum = provider.verifiedAadhaarNumber.isNotEmpty
          ? provider.verifiedAadhaarNumber
          : (_verificationStatus?['govIdNumber'] != null
              ? '••••••••' + _verificationStatus!['govIdNumber'].toString().substring(_verificationStatus!['govIdNumber'].toString().length - 4)
              : '••••••••••••');
      final addr = provider.verifiedAddress.isNotEmpty ? provider.verifiedAddress : 'UIDAI Verified Resident';

      return SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildVerifiedCredentialCard(
              title: 'UIDAI Aadhaar Verified',
              subtitle: 'Paperless e-KYC (OKYC) Authenticated',
              fields: [
                MapEntry('Aadhaar Number', aadhaarNum),
                MapEntry('Cardholder Name', name),
                MapEntry('Address', addr),
                const MapEntry('Status', 'UIDAI Digital Identity Confirmed'),
              ],
              onEdit: () {
                _safeSetState(() => _editAadhaar = true);
              },
              editLabel: 'Re-verify Aadhaar',
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isAadhaarVerified && _editAadhaar) ...[
            TextButton.icon(
              onPressed: () => _safeSetState(() => _editAadhaar = false),
              icon: const Icon(Icons.arrow_back, size: 16),
              label: const Text('Back to Verified Aadhaar Details'),
            ),
            const SizedBox(height: 8),
          ],
          const Text(
            'UIDAI Aadhaar OKYC Verification',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 4),
          const Text(
            'Official paperless Aadhaar authentication. Enter your 12-digit Aadhaar number to receive an OTP directly from UIDAI.',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 20),

          _buildInputField(
            'Aadhaar Number (12 Digits)',
            _aadhaarController,
            icon: Icons.fingerprint_rounded,
            keyboardType: TextInputType.number,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(12),
            ],
          ),
          const SizedBox(height: 16),

          BouncingWidget(
            onTap: _isGeneratingAadhaarOtp ? null : _sendAadhaarOtp,
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton(
                onPressed: _isGeneratingAadhaarOtp ? null : _sendAadhaarOtp,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.primary),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _isGeneratingAadhaarOtp
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                    : Text(_aadhaarRefId != null ? 'Resend Aadhaar OTP' : 'Generate Aadhaar OTP', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
              ),
            ),
          ),

          if (_aadhaarRefId != null) ...[
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 16),
            const Text(
              'Enter 6-Digit UIDAI OTP',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 12),
            _buildInputField(
              '6-Digit OTP',
              _aadhaarOtpController,
              icon: Icons.lock_outline_rounded,
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(6),
              ],
            ),
            const SizedBox(height: 16),
            BouncingWidget(
              onTap: _isVerifyingAadhaarOtp ? null : _verifyAadhaarOtp,
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isVerifyingAadhaarOtp ? null : _verifyAadhaarOtp,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: _isVerifyingAadhaarOtp
                      ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.verified_user_rounded, color: Colors.white, size: 20),
                            SizedBox(width: 8),
                            Text('Confirm & Verify Aadhaar', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white)),
                          ],
                        ),
                ),
              ),
            ),
          ],

          if (_aadhaarResult != null) ...[
            const SizedBox(height: 20),
            _buildResultCard(_aadhaarResult!),
          ],
        ],
      ),
    );
  }

  // TAB 3: PAN Card
  Widget _buildPanTab() {
    final provider = context.watch<AppProvider>();
    final isPanVerified = _verificationStatus?['isPanVerified'] == true ||
        _verificationStatus?['panVerified'] == true ||
        provider.isPanVerified;

    if (isPanVerified && !_editPan) {
      final name = provider.verifiedFullName.isNotEmpty
          ? provider.verifiedFullName
          : (_verificationStatus?['accountHolderName']?.toString() ??
              _verificationStatus?['displayName']?.toString() ??
              'Taxpayer');
      final panNum = provider.verifiedPanNumber.isNotEmpty
          ? provider.verifiedPanNumber
          : (_verificationStatus?['govIdNumber']?.toString() ?? '••••••••••');

      return SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildVerifiedCredentialCard(
              title: 'NSDL PAN Card Verified',
              subtitle: 'Income Tax Dept Database Matched',
              fields: [
                MapEntry('PAN Number', panNum),
                MapEntry('Taxpayer Name', name),
                const MapEntry('Status', 'Active & Govt Validated'),
              ],
              onEdit: () {
                _safeSetState(() => _editPan = true);
              },
              editLabel: 'Re-verify PAN Card',
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isPanVerified && _editPan) ...[
            TextButton.icon(
              onPressed: () => _safeSetState(() => _editPan = false),
              icon: const Icon(Icons.arrow_back, size: 16),
              label: const Text('Back to Verified PAN Details'),
            ),
            const SizedBox(height: 8),
          ],
          const Text(
            'NSDL PAN Card Verification',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 4),
          const Text(
            'Validates PAN card authenticity with the Income Tax Department and verifies legal name for host payouts and guest compliance.',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 20),

          _buildInputField(
            '10-Digit PAN Number',
            _panController,
            icon: Icons.credit_card_rounded,
            isCaps: true,
            inputFormatters: [LengthLimitingTextInputFormatter(10)],
          ),
          const SizedBox(height: 14),
          _buildInputField('Full Name as on PAN (Optional Check)', _panNameController, icon: Icons.person_outline_rounded),
          const SizedBox(height: 24),

          if (_panResult != null) _buildResultCard(_panResult!),

          const SizedBox(height: 12),
          BouncingWidget(
            onTap: _isVerifyingPan ? null : _verifyPan,
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isVerifyingPan ? null : _verifyPan,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: _isVerifyingPan
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.shield_rounded, color: Colors.white, size: 20),
                          SizedBox(width: 8),
                          Text('Verify PAN with SecureID', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white)),
                        ],
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // TAB 4: UPI ID Fast Refund
  Widget _buildUpiTab() {
    final provider = context.watch<AppProvider>();
    final isUpiVerified = _verificationStatus?['isUpiVerified'] == true || provider.isUpiVerified;

    if (isUpiVerified && !_editUpi) {
      final upiId = provider.verifiedUpiId.isNotEmpty ? provider.verifiedUpiId : 'user@upi';
      final name = provider.verifiedFullName.isNotEmpty ? provider.verifiedFullName : 'UPI Holder';

      return SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildVerifiedCredentialCard(
              title: 'Instant UPI Refund Setup',
              subtitle: 'Active Fast-Refund & Payout VPA',
              fields: [
                MapEntry('UPI VPA ID', upiId),
                MapEntry('Account Holder', name),
                const MapEntry('Status', '60-Sec Automated Refund Enabled'),
              ],
              onEdit: () {
                _safeSetState(() => _editUpi = true);
              },
              editLabel: 'Change UPI ID',
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isUpiVerified && _editUpi) ...[
            TextButton.icon(
              onPressed: () => _safeSetState(() => _editUpi = false),
              icon: const Icon(Icons.arrow_back, size: 16),
              label: const Text('Back to Verified UPI Details'),
            ),
            const SizedBox(height: 8),
          ],
          const Text(
            'Instant UPI Refund & Payout Setup',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 4),
          const Text(
            'Verify your UPI VPA to enable automated 60-second instant refunds when you cancel any booking or receive fast host earnings.',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 20),

          _buildInputField(
            'UPI ID (e.g. mobile@upi, name@okaxis)',
            _upiController,
            icon: Icons.flash_on_rounded,
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 14),
          _buildInputField('Account Holder Name (Optional)', _upiNameController, icon: Icons.person_outline_rounded),
          const SizedBox(height: 24),

          if (_upiResult != null) _buildResultCard(_upiResult!),

          const SizedBox(height: 12),
          BouncingWidget(
            onTap: _isVerifyingUpi ? null : _verifyUpi,
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isVerifyingUpi ? null : _verifyUpi,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: _isVerifyingUpi
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.bolt_rounded, color: Colors.white, size: 22),
                          SizedBox(width: 8),
                          Text('Verify UPI VPA with SecureID', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white)),
                        ],
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputField(
    String label,
    TextEditingController controller, {
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    bool isCaps = false,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          textCapitalization: isCaps ? TextCapitalization.characters : TextCapitalization.none,
          inputFormatters: inputFormatters,
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: AppColors.primary, size: 20),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.borderLight),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.borderLight),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildResultCard(Map<String, dynamic> data) {
    final isVerified = data['verified'] == true || data['valid'] == true || data['status'] == 'SUCCESS';
    final rawScore = data['nameMatchScore'];
    int? displayScore;
    if (rawScore is num) {
      displayScore = rawScore <= 1.0 ? (rawScore * 100).round() : rawScore.round();
    }

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isVerified ? const Color(0xFF10B981).withValues(alpha: 0.1) : const Color(0xFFEF4444).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isVerified ? const Color(0xFF10B981) : const Color(0xFFEF4444),
          width: 1.5,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            isVerified ? Icons.check_circle_rounded : Icons.error_outline_rounded,
            color: isVerified ? const Color(0xFF059669) : const Color(0xFFDC2626),
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isVerified ? 'Verification Successful' : 'Verification Failed',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: isVerified ? const Color(0xFF059669) : const Color(0xFFDC2626),
                  ),
                ),
                const SizedBox(height: 4),
                if (data['registeredName'] != null)
                  Text(
                    'Registered Name: ${data['registeredName']}',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary),
                  ),
                if (displayScore != null)
                  Text(
                    'Name Match Score: $displayScore%',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                if (data['name'] != null && data['name'] != data['registeredName'])
                  Text(
                    'Name: ${data['name']}',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary),
                  ),
                if (data['message'] != null)
                  Text(
                    data['message'],
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn().scale(begin: const Offset(0.95, 0.95));
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'dart:io';
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../../providers/host_onboarding_provider.dart';
import '../../../../theme/app_colors.dart';
import '../../../../services/api/api_client.dart';
import '../../../../services/api/verification_api.dart';

class BankDetailsScreen extends StatefulWidget {
  const BankDetailsScreen({Key? key}) : super(key: key);

  @override
  State<BankDetailsScreen> createState() => _BankDetailsScreenState();
}

class _BankDetailsScreenState extends State<BankDetailsScreen> {
  late TextEditingController _holderController;
  late TextEditingController _accountController;
  late TextEditingController _ifscController;
  late TextEditingController _bankController;
  late TextEditingController _upiController;
  String _passbookPath = '';
  
  // Gov ID State
  String _govIdPath = '';
  bool _isExtractingId = false;
  String? _extractedId;
  String? _extractedName;
  String? _idType;

  // Cashfree SecureID Bank Verification State
  bool _isVerifyingBank = false;
  bool _isBankPennyDropVerified = false;
  String? _verifiedBeneficiaryName;

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
    _passbookPath = provider.bankPassbookImagePath;
    _extractedId = provider.idNumber;
    _extractedName = provider.idName;
    _idType = provider.idType;
    if (_extractedId != null) {
      _govIdPath = 'Already Uploaded';
    }

    _holderController.addListener(_updateProvider);
    _accountController.addListener(_updateProvider);
    _ifscController.addListener(_updateProvider);
    _ifscController.addListener(_onIfscChanged);
    _bankController.addListener(_updateProvider);
    _upiController.addListener(_updateProvider);
    _upiController.addListener(_onUpiChanged);
    
    // Initial validation if pre-filled
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
    super.dispose();
  }

  void _updateProvider() {
    final provider = Provider.of<HostOnboardingProvider>(context, listen: false);
    provider.updateBankDetails(
      _holderController.text,
      _accountController.text,
      _ifscController.text,
      _bankController.text,
      _upiController.text,
      _passbookPath,
    );
    provider.idNumber = _extractedId;
    provider.idName = _extractedName;
    provider.idType = _idType;
  }

  void _onIfscChanged() {
    final ifsc = _ifscController.text.trim().toUpperCase();
    
    // Reset state if empty
    if (ifsc.isEmpty) {
      setState(() {
        _isIfscValid = false;
        _ifscError = '';
      });
      return;
    }

    // Basic length check for IFSC
    if (ifsc.length != 11) {
      setState(() {
        _isIfscValid = false;
        _ifscError = '';
      });
      return;
    }

    if (_ifscDebounce?.isActive ?? false) _ifscDebounce!.cancel();
    _ifscDebounce = Timer(const Duration(milliseconds: 500), () async {
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
    // Basic UPI validation (e.g. name@bank)
    final upiRegex = RegExp(r'^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$');
    setState(() {
      _isUpiValid = upiRegex.hasMatch(upi);
    });
  }

  Future<void> _processGovId(String path) async {
    setState(() {
      _isExtractingId = true;
      _extractedId = null;
      _extractedName = null;
      _idType = null;
    });

    try {
      final inputImage = InputImage.fromFilePath(path);
      final textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);
      final RecognizedText recognizedText = await textRecognizer.processImage(inputImage);
      
      String text = recognizedText.text;
      String? foundId;
      String? foundType;
      String? foundName;

      // 1. Check for PAN Card [A-Z]{5}[0-9]{4}[A-Z]{1}
      final panRegex = RegExp(r'[A-Z]{5}[0-9]{4}[A-Z]{1}');
      final panMatch = panRegex.firstMatch(text.toUpperCase());
      
      // 2. Check for Aadhaar Card \d{4}\s?\d{4}\s?\d{4}
      final aadhaarRegex = RegExp(r'\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b');
      final aadhaarMatch = aadhaarRegex.firstMatch(text);

      if (panMatch != null) {
        foundId = panMatch.group(0);
        foundType = 'PAN Card';
        
        // Try to extract name (PAN usually has "Name" followed by the actual name, or it's the largest text above the PAN)
        // This is a naive extraction for demonstration.
        final lines = text.split('\n');
        for (int i = 0; i < lines.length; i++) {
          if (lines[i].toUpperCase().contains('INCOME TAX DEPARTMENT') && i + 1 < lines.length) {
            foundName = lines[i + 1].trim();
            break;
          }
        }
      } else if (aadhaarMatch != null) {
        foundId = aadhaarMatch.group(0);
        foundType = 'Aadhaar Card';
        
        // Naive extraction for Aadhaar name (usually above DOB)
        final lines = text.split('\n');
        for (int i = 0; i < lines.length; i++) {
          if ((lines[i].contains('DOB') || lines[i].contains('Year of Birth')) && i > 0) {
            foundName = lines[i - 1].trim();
            break;
          }
        }
      }

      if (foundId != null) {
        setState(() {
          _extractedId = foundId;
          _idType = foundType;
          if (foundName != null && foundName!.isNotEmpty) {
             _extractedName = foundName;
          }
          _govIdPath = path;
        });
        _updateProvider();
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Detected $foundType: $foundId', style: const TextStyle(color: Colors.white)),
              backgroundColor: AppColors.successGreen,
            )
          );
        }
      } else {
         if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Could not detect PAN or Aadhaar number clearly. Please try a better photo.'),
              backgroundColor: Colors.red,
            )
          );
        }
        setState(() {
          _govIdPath = '';
        });
      }

      textRecognizer.close();
    } catch (e) {
      if (mounted) {
         ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error extracting ID: $e'))
          );
      }
      setState(() {
        _govIdPath = '';
      });
    } finally {
      setState(() {
        _isExtractingId = false;
      });
    }
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
                  Expanded(child: Text('Verified via Cashfree SecureID: ${_verifiedBeneficiaryName ?? "Valid Account"}')),
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
          SnackBar(content: Text('Verification check: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isVerifyingBank = false);
    }
  }


  Widget _buildTextField(
    String label, 
    TextEditingController controller, 
    {
      bool obscure = false, 
      Widget? suffixIcon,
      String errorText = '',
    }
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surfaceLight,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: errorText.isNotEmpty ? Colors.red.withOpacity(0.5) : AppColors.borderLight,
              ),
            ),
            child: TextField(
              controller: controller,
              obscureText: obscure,
              textCapitalization: label.contains('IFSC') ? TextCapitalization.characters : TextCapitalization.none,
              decoration: InputDecoration(
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                suffixIcon: suffixIcon,
              ),
            ),
          ),
          if (errorText.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6, left: 4),
              child: Text(
                errorText,
                style: const TextStyle(color: Colors.red, fontSize: 12),
              ),
            ).animate().fadeIn().slideY(begin: -0.2),
        ],
      ),
    ).animate().fade(duration: 400.ms).slideY(begin: 0.1, end: 0);
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Bank Details',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 8),
          const Text(
            'Where should we send your payouts?',
            style: TextStyle(
              fontSize: 16,
              color: AppColors.textSecondary,
            ),
          ).animate().fadeIn(delay: 100.ms).slideX(),
          const SizedBox(height: 32),
          
          _buildTextField('Account Holder Name', _holderController),
          _buildTextField('Account Number', _accountController),
          _buildTextField(
            'IFSC Code', 
            _ifscController,
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
                    ? const Icon(Icons.check_circle_rounded, color: Colors.green)
                    : null,
          ),
          _buildTextField('Bank Name', _bankController),
          _buildTextField(
            'UPI ID', 
            _upiController,
            suffixIcon: _isUpiValid && _upiController.text.isNotEmpty
                ? const Icon(Icons.check_circle_rounded, color: Colors.green)
                : _upiController.text.isNotEmpty
                    ? Icon(Icons.error_outline_rounded, color: Colors.red.withOpacity(0.5))
                    : null,
          ),

          // Cashfree SecureID Verification CTA
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  const Color(0xFF4F46E5).withOpacity(0.08),
                  const Color(0xFF06B6D4).withOpacity(0.08),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _isBankPennyDropVerified
                    ? const Color(0xFF10B981)
                    : const Color(0xFF6366F1).withOpacity(0.3),
                width: 1.5,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: _isBankPennyDropVerified ? const Color(0xFF10B981) : const Color(0xFF4F46E5),
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
                          Row(
                            children: [
                              const Text(
                                'Cashfree SecureID',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: _isBankPennyDropVerified
                                      ? const Color(0xFF10B981).withOpacity(0.15)
                                      : const Color(0xFF4F46E5).withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  _isBankPennyDropVerified ? 'VERIFIED' : 'PENNY DROP',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: _isBankPennyDropVerified ? const Color(0xFF059669) : const Color(0xFF4F46E5),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _isBankPennyDropVerified
                                ? 'Account verified at Bank: ${_verifiedBeneficiaryName ?? "Valid"}'
                                : 'Automated penny drop verification for instant host payouts',
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
                      side: BorderSide(color: _isBankPennyDropVerified ? const Color(0xFF10B981) : const Color(0xFF4F46E5)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      backgroundColor: _isBankPennyDropVerified ? const Color(0xFF10B981).withOpacity(0.08) : Colors.white,
                    ),
                    child: _isVerifyingBank
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF4F46E5)),
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                _isBankPennyDropVerified ? Icons.check_circle_rounded : Icons.flash_on_rounded,
                                color: _isBankPennyDropVerified ? const Color(0xFF10B981) : const Color(0xFF4F46E5),
                                size: 18,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                _isBankPennyDropVerified ? 'Bank Account Verified' : 'Verify Bank with SecureID',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: _isBankPennyDropVerified ? const Color(0xFF10B981) : const Color(0xFF4F46E5),
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 32),
          const Text(
            'Government ID (For Verification)',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 8),
          const Text(
            'Upload a clear picture of your PAN or Aadhaar card. We will extract the details automatically.',
            style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 16),
          
          StatefulBuilder(
            builder: (context, setStateLocal) {
              return InkWell(
                onTap: () async {
                  if (_isExtractingId) return;
                  try {
                    final picker = ImagePicker();
                    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
                    if (pickedFile != null) {
                      setState(() {
                        _govIdPath = 'Processing...';
                      });
                      
                      // Process with ML Kit immediately
                      await _processGovId(pickedFile.path);
                      
                      // Then upload to Firebase Storage if successful
                      if (_extractedId != null) {
                        setState(() { _govIdPath = 'Uploading...'; });
                        final file = File(pickedFile.path);
                        final fileName = 'gov_ids/${DateTime.now().millisecondsSinceEpoch}_${pickedFile.name}';
                        final ref = FirebaseStorage.instance.ref().child(fileName);
                        await ref.putFile(file);
                        final downloadUrl = await ref.getDownloadURL();
                        
                        setState(() {
                          _govIdPath = downloadUrl;
                        });
                        _updateProvider();
                      }
                    }
                  } catch (e) {
                     setState(() { _govIdPath = ''; });
                  }
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                  decoration: BoxDecoration(
                    color: _govIdPath.isEmpty ? AppColors.surfaceLight : AppColors.primaryLight.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: _govIdPath.isEmpty ? AppColors.borderLight : AppColors.primary,
                      width: 2,
                    ),
                  ),
                  child: Column(
                    children: [
                      if (_isExtractingId || _govIdPath == 'Uploading...' || _govIdPath == 'Processing...')
                        const CircularProgressIndicator(color: AppColors.primary)
                      else if (_extractedId != null)
                        Column(
                          children: [
                            const Icon(Icons.verified_user_rounded, color: AppColors.successGreen, size: 40),
                            const SizedBox(height: 8),
                            Text(
                              '$_idType Verified',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.successGreen),
                            ),
                            const SizedBox(height: 4),
                            Text('ID: $_extractedId', style: const TextStyle(color: AppColors.textPrimary)),
                            if (_extractedName != null)
                               Text('Name: $_extractedName', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                          ],
                        )
                      else
                        const Column(
                          children: [
                            Icon(Icons.badge_outlined, size: 40, color: AppColors.primary),
                            SizedBox(height: 8),
                            Text(
                              'Scan Document',
                              style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.primary),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
              );
            }
          ).animate().fadeIn().slideY(begin: 0.1),

          const SizedBox(height: 24),
          const Divider(),
          const SizedBox(height: 24),

          const Text(
            'Bank Passbook / Cancelled Cheque',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ).animate().fadeIn().slideX(),
          const SizedBox(height: 8),
          StatefulBuilder(
            builder: (context, setStateLocal) {
              bool isPicking = false;
              return InkWell(
                onTap: () async {
                  if (isPicking) return;
                  setStateLocal(() => isPicking = true);
                  try {
                    final picker = ImagePicker();
                    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
                    if (pickedFile != null) {
                      setState(() {
                        _passbookPath = 'Uploading...';
                      });
                      final file = File(pickedFile.path);
                      final fileName = 'passbooks/${DateTime.now().millisecondsSinceEpoch}_${pickedFile.name}';
                      final ref = FirebaseStorage.instance.ref().child(fileName);
                      final uploadTask = ref.putFile(file);
                      final snapshot = await uploadTask;
                      final downloadUrl = await snapshot.ref.getDownloadURL();
                      setState(() {
                        _passbookPath = downloadUrl;
                      });
                      _updateProvider();
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Failed to upload image: $e')),
                      );
                      setState(() {
                        _passbookPath = '';
                      });
                    }
                  } finally {
                    setStateLocal(() => isPicking = false);
                  }
                },
                borderRadius: BorderRadius.circular(16),
                child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 24),
              decoration: BoxDecoration(
                color: _passbookPath.isEmpty ? AppColors.surfaceLight : AppColors.primaryLight.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _passbookPath.isEmpty ? AppColors.borderLight : AppColors.primary,
                  width: 2,
                  style: BorderStyle.solid,
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.05),
                    blurRadius: 8,
                    spreadRadius: 2,
                  )
                ]
              ),
              child: Column(
                children: [
                  _passbookPath == 'Uploading...' 
                      ? const CircularProgressIndicator(color: AppColors.primary)
                      : Icon(
                          _passbookPath.isEmpty ? Icons.cloud_upload_outlined : Icons.check_circle,
                          size: 40,
                          color: _passbookPath.isEmpty ? AppColors.primary : AppColors.successGreen,
                        ).animate(target: _passbookPath.isEmpty ? 0 : 1).scale(duration: 300.ms),
                  const SizedBox(height: 12),
                  Text(
                    _passbookPath.isEmpty
                        ? 'Upload Bank Passbook / Cancelled Cheque'
                        : _passbookPath == 'Uploading...' 
                            ? 'Uploading Document...' 
                            : 'Document Uploaded Successfully',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: _passbookPath.isEmpty || _passbookPath == 'Uploading...' ? AppColors.primary : AppColors.successGreen,
                    ),
                  ),
                  if (_passbookPath.isEmpty)
                    const Padding(
                      padding: EdgeInsets.only(top: 4.0),
                      child: Text(
                        'Tap to browse files',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          );
          }).animate().fadeIn().slideY(begin: 0.1, end: 0),
          
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.successGreen.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.successGreen.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.security, color: AppColors.successGreen),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Your financial information is securely encrypted and stored safely.',
                    style: TextStyle(fontSize: 13, color: AppColors.successGreen.withOpacity(0.9)),
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 300.ms),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../api_service.dart';
import '../widgets/app_drawer.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiService _api = ApiService();

  bool _loading = true;

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  bool _profileSubmitting = false;
  String? _profileError;
  String? _profileSuccess;

  final TextEditingController _currentPasswordController = TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  bool _passwordSubmitting = false;
  String? _passwordError;
  String? _passwordSuccess;

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    final user = await _api.getProfile();
    if (mounted) {
      setState(() {
        if (user != null) {
          _nameController.text = user['full_name'] ?? '';
          _emailController.text = user['email'] ?? '';
        }
        _loading = false;
      });
    }
  }

  Future<void> _handleProfileSubmit() async {
    setState(() {
      _profileError = null;
      _profileSuccess = null;
    });

    final name = _nameController.text.trim();
    final email = _emailController.text.trim();

    if (name.isEmpty || email.isEmpty) {
      setState(() => _profileError = 'Name and email are required.');
      return;
    }

    setState(() => _profileSubmitting = true);

    final success = await _api.updateProfile(name, email);

    if (mounted) {
      setState(() {
        _profileSubmitting = false;
        if (success) {
          _profileSuccess = 'Profile updated successfully.';
        } else {
          _profileError = 'Unable to update your profile details. Please try again.';
        }
      });
    }
  }

  Future<void> _handlePasswordSubmit() async {
    setState(() {
      _passwordError = null;
      _passwordSuccess = null;
    });

    final current = _currentPasswordController.text;
    final newPwd = _newPasswordController.text;
    final confirm = _confirmPasswordController.text;

    if (current.isEmpty || newPwd.isEmpty || confirm.isEmpty) {
      setState(() => _passwordError = 'All password fields are required.');
      return;
    }

    if (newPwd != confirm) {
      setState(() => _passwordError = 'New passwords do not match.');
      return;
    }

    if (newPwd.length < 8) {
      setState(() => _passwordError = 'Use at least 8 characters for your new password.');
      return;
    }

    setState(() => _passwordSubmitting = true);

    final success = await _api.changePassword(current, newPwd);

    if (mounted) {
      setState(() {
        _passwordSubmitting = false;
        if (success) {
          _passwordSuccess = 'Password updated successfully.';
          _currentPasswordController.clear();
          _newPasswordController.clear();
          _confirmPasswordController.clear();
        } else {
          _passwordError = 'Unable to update your password. Check your current password and try again.';
        }
      });
    }
  }

  Widget _buildTextField({required String label, required IconData icon, required TextEditingController controller, bool isPassword = false, String? hint}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.5)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFFCFCFC),
            border: Border.all(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(12),
          ),
          child: TextField(
             controller: controller,
             obscureText: isPassword,
             style: const TextStyle(fontSize: 13, color: Color(0xFF333333), fontWeight: FontWeight.w600),
             decoration: InputDecoration(
                hintText: hint,
                hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400, fontWeight: FontWeight.normal),
                prefixIcon: Icon(icon, size: 16, color: Colors.grey),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 14)
             ),
          ),
        )
      ],
    );
  }

  Widget _buildAlert(String message, bool isSuccess) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
         color: isSuccess ? Colors.green.shade50 : Colors.red.shade50,
         border: Border.all(color: isSuccess ? Colors.green.shade100 : Colors.red.shade100),
         borderRadius: BorderRadius.circular(12)
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(isSuccess ? Icons.check_circle_rounded : Icons.error_outline_rounded, size: 16, color: isSuccess ? Colors.green : Colors.red),
          const SizedBox(width: 8),
          Expanded(child: Text(message, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: isSuccess ? Colors.green.shade700 : Colors.red.shade700))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F8),
      drawer: const AppDrawer(currentRoute: '/profile'),
      appBar: AppBar(
        title: Column(
           crossAxisAlignment: CrossAxisAlignment.start,
           children: const [
              Text('ACCOUNT PROFILE', style: TextStyle(color: Color(0xFF333333), fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5)),
              Text('Manage your personal information and security.', style: TextStyle(color: Color(0xFF999999), fontSize: 10)),
           ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Color(0xFF333333)),
      ),
      body: SafeArea(
        child: _loading 
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFA5C422)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // General Information Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.grey.shade200), borderRadius: BorderRadius.circular(16)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.shield_outlined, size: 16, color: Color(0xFFA5C422)),
                            SizedBox(width: 8),
                            Text('GENERAL INFORMATION', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.5)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Text('Update your name and primary email address.', style: TextStyle(fontSize: 10, color: Colors.grey)),
                        const SizedBox(height: 20),
                        
                        if (_profileError != null) _buildAlert(_profileError!, false),
                        if (_profileSuccess != null) _buildAlert(_profileSuccess!, true),
                        
                        _buildTextField(label: 'Full Name', icon: Icons.person_outline_rounded, controller: _nameController),
                        const SizedBox(height: 16),
                        _buildTextField(label: 'Email Address', icon: Icons.mail_outline_rounded, controller: _emailController),
                        const SizedBox(height: 20),
                        
                        ElevatedButton.icon(
                          onPressed: _profileSubmitting ? null : _handleProfileSubmit,
                          style: ElevatedButton.styleFrom(
                             backgroundColor: const Color(0xFFA5C422),
                             foregroundColor: Colors.white,
                             elevation: 0,
                             padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                             shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                             disabledBackgroundColor: const Color(0xFFA5C422).withValues(alpha: 0.5)
                          ),
                          icon: _profileSubmitting 
                             ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) 
                             : const Icon(Icons.save_outlined, size: 16),
                          label: Text(_profileSubmitting ? 'Saving changes...' : 'Save changes', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        )
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Security Settings Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.grey.shade200), borderRadius: BorderRadius.circular(16)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.lock_outline_rounded, size: 16, color: Color(0xFFA5C422)),
                            SizedBox(width: 8),
                            Text('SECURITY SETTINGS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.5)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Text('Change your password and secure your account.', style: TextStyle(fontSize: 10, color: Colors.grey)),
                        const SizedBox(height: 20),

                        if (_passwordError != null) _buildAlert(_passwordError!, false),
                        if (_passwordSuccess != null) _buildAlert(_passwordSuccess!, true),

                        _buildTextField(label: 'Current Password', icon: Icons.lock_outline_rounded, controller: _currentPasswordController, isPassword: true, hint: '••••••••'),
                        const SizedBox(height: 16),
                        _buildTextField(label: 'New Password', icon: Icons.lock_outline_rounded, controller: _newPasswordController, isPassword: true, hint: 'New password (8+ chars)'),
                        const SizedBox(height: 16),
                        _buildTextField(label: 'Confirm New Password', icon: Icons.lock_outline_rounded, controller: _confirmPasswordController, isPassword: true, hint: 'Confirm password'),
                        const SizedBox(height: 20),

                        OutlinedButton.icon(
                          onPressed: _passwordSubmitting ? null : _handlePasswordSubmit,
                          style: OutlinedButton.styleFrom(
                             foregroundColor: Colors.grey.shade700,
                             side: BorderSide(color: Colors.grey.shade300),
                             padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                             shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          icon: _passwordSubmitting
                             ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.grey)) 
                             : const Icon(Icons.lock_outline_rounded, size: 16, color: Colors.grey),
                          label: Text(_passwordSubmitting ? 'Updating...' : 'Update password', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        )
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
      ),
    );
  }
}

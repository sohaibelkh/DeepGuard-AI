import 'package:flutter/material.dart';
import '../api_service.dart';
import '../screens/login_screen.dart';
import '../screens/dashboard_screen.dart';
import '../screens/ecg_diagnosis_screen.dart';
import '../screens/live_ecg_screen.dart';
import '../screens/history_screen.dart';
import '../screens/chat_screen.dart';
import '../screens/performance_screen.dart';
import '../screens/profile_screen.dart';



class AppDrawer extends StatelessWidget {
  final String currentRoute;

  const AppDrawer({super.key, required this.currentRoute});

  void _handleLogout(BuildContext context) async {
    await ApiService().logout();
    if (context.mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  Widget _buildNavItem(BuildContext context, {
    required String label,
    required IconData icon,
    required String route,
    required bool isActive,
    VoidCallback? onTap,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFFA5C422) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        boxShadow: isActive
            ? [
                BoxShadow(
                  color: const Color(0xFFA5C422).withOpacity(0.4),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                )
              ]
            : null,
      ),
      child: ListTile(
        leading: Icon(icon, color: isActive ? Colors.white : Colors.white70, size: 22),
        title: Text(
          label,
          style: TextStyle(
            color: isActive ? Colors.white : Colors.white70,
            fontSize: 14,
            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
          ),
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        onTap: () {
          Navigator.pop(context); // Close drawer
          if (onTap != null) {
            onTap();
          } else if (!isActive) {
            // Not implemented features
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('$label is coming soon!'),
                backgroundColor: const Color(0xFF333333),
              ),
            );
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // A dark glassmorphic-inspired beautiful drawer
    return Drawer(
      child: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF1E293B), // Slate 800 roughly
        ),
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white24),
                      ),
                      child: const Icon(
                        Icons.monitor_heart_rounded,
                        color: Color(0xFFA5C422),
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 16),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'CardioAI',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                        Text(
                          'Diagnostic Console',
                          style: TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const Divider(color: Colors.white12, height: 1),
              const SizedBox(height: 16),
              
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: Text(
                  'NAVIGATION',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.5),
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
              ),

              Expanded(
                child: ListView(
                  padding: EdgeInsets.zero,
                  children: [
                    _buildNavItem(
                      context,
                      label: 'Dashboard',
                      icon: Icons.space_dashboard_rounded,
                      route: '/dashboard',
                      isActive: currentRoute == '/dashboard',
                      onTap: () {
                        if (currentRoute != '/dashboard') {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const DashboardScreen()),
                          );
                        }
                      },
                    ),
                    _buildNavItem(
                      context,
                      label: 'ECG Diagnosis',
                      icon: Icons.show_chart_rounded,
                      route: '/diagnosis',
                      isActive: currentRoute == '/diagnosis',
                      onTap: () {
                        if (currentRoute != '/diagnosis') {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const EcgDiagnosisScreen()),
                          );
                        }
                      },
                    ),
                    _buildNavItem(
                      context,
                      label: 'Live ECG',
                      icon: Icons.sensors_rounded,
                      route: '/live-ecg',
                      isActive: currentRoute == '/live-ecg',
                      onTap: () {
                        if (currentRoute != '/live-ecg') {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const LiveEcgScreen()),
                          );
                        }
                      },
                    ),
                    _buildNavItem(
                      context,
                      label: 'History',
                      icon: Icons.history_rounded,
                      route: '/history',
                      isActive: currentRoute == '/history',
                      onTap: () {
                        if (currentRoute != '/history') {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const HistoryScreen()),
                          );
                        }
                      },
                    ),
                    _buildNavItem(
                      context,
                      label: 'AI Assistant',
                      icon: Icons.chat_bubble_outline_rounded,
                      route: '/chat',
                      isActive: currentRoute == '/chat',
                      onTap: () {
                        if (currentRoute != '/chat') {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const ChatScreen()),
                          );
                        }
                      },
                    ),
                    _buildNavItem(
                      context,
                      label: 'Model Performance',
                      icon: Icons.insights_rounded,
                      route: '/performance',
                      isActive: currentRoute == '/performance',
                      onTap: () {
                        if (currentRoute != '/performance') {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const PerformanceScreen()),
                          );
                        }
                      },
                    ),
                    _buildNavItem(
                      context,
                      label: 'Profile',
                      icon: Icons.person_outline_rounded,
                      route: '/profile',
                      isActive: currentRoute == '/profile',
                      onTap: () {
                        if (currentRoute != '/profile') {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                                builder: (_) => const ProfileScreen()),
                          );
                        }
                      },
                    ),
                  ],
                ),
              ),
              
              const Divider(color: Colors.white12, height: 1),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                child: InkWell(
                  onTap: () => _handleLogout(context),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.redAccent.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.logout_rounded, color: Colors.redAccent, size: 22),
                        SizedBox(width: 12),
                        Text(
                          'Logout',
                          style: TextStyle(
                            color: Colors.redAccent,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

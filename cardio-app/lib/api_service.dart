import 'dart:convert';
import 'dart:io' show Platform;
import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();

  factory ApiService() {
    return _instance;
  }

  ApiService._internal();

  String get baseUrl {
    if (kIsWeb) {
      return 'http://127.0.0.1:8000/api';
    } else if (Platform.isAndroid) {
      return 'http://10.41.181.37:8000/api';
    } else {
      return 'http://10.41.181.37:8000/api';
    }
  }

  // Helper to attach authorization header
  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('dg_access_token');
    if (token != null) {
      return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };
    }
    return {
      'Content-Type': 'application/json',
    };
  }

  // Store tokens natively
  Future<void> _storeTokens(String accessToken, String refreshToken) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('dg_access_token', accessToken);
    await prefs.setString('dg_refresh_token', refreshToken);
  }

  // Login
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'identifier': email,
          'password': password,
        }),
      );

      final body = jsonDecode(response.body);

      if (response.statusCode == 200) {
        await _storeTokens(body['access_token'], body['refresh_token']);
        return {'success': true, 'user': body['user']};
      } else {
        return {'success': false, 'error': body['detail'] ?? 'Login failed'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  // Register
  Future<Map<String, dynamic>> register(String fullName, String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'full_name': fullName,
          'email': email,
          'password': password,
        }),
      );

      final body = jsonDecode(response.body);

      if (response.statusCode == 201) {
        await _storeTokens(body['access_token'], body['refresh_token']);
        return {'success': true, 'user': body['user']};
      } else {
        return {'success': false, 'error': body['detail'] ?? 'Registration failed'};
      }
    } catch (e) {
      return {'success': false, 'error': 'Network error: $e'};
    }
  }

  // Auto-login verify token validity
  Future<bool> checkAuthStatus() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('dg_access_token');
    
    if (token == null) return false;

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/me'),
        headers: await _getHeaders(),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Fetch Dashboard Analytics
  Future<Map<String, dynamic>?> fetchAnalyticsSummary() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/analytics/summary'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  // Fetch available models
  Future<List<dynamic>?> fetchModels() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/models/list'),
        headers: await _getHeaders(),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body)['models'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Predict ECG (Multipart upload)
  Future<Map<String, dynamic>?> predictECG({String? filePath, Uint8List? fileBytes, required String fileName, required String modelName}) async {
    try {
      final request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/predict?model_name=$modelName'),
      );
      
      request.headers.addAll(await _getHeaders());
      
      if (fileBytes != null) {
        request.files.add(http.MultipartFile.fromBytes('file', fileBytes, filename: fileName));
      } else if (filePath != null) {
        request.files.add(await http.MultipartFile.fromPath('file', filePath));
      } else {
        return {'is_error': true, 'error': 'No file to upload'};
      }
      
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode == 200 || response.statusCode == 201 || response.statusCode == 202) {
        return jsonDecode(response.body);
      } else {
        return {'is_error': true, 'error': jsonDecode(response.body)['detail'] ?? 'Prediction failed'};
      }
    } catch (e) {
      return {'is_error': true, 'error': 'Network error: $e'};
    }
  }

  String get wsBaseUrl {
    final base = baseUrl;
    if (base.startsWith('https')) {
      return base.replaceFirst('https', 'wss');
    } else {
      return base.replaceFirst('http', 'ws');
    }
  }

  // Fetch History for Stream Selection
  Future<List<dynamic>?> fetchHistoryRecords() async {
     try {
       final response = await http.get(
        Uri.parse('$baseUrl/history/analyses?page_size=50'),
         headers: await _getHeaders(),
       );
       if (response.statusCode == 200) {
         final body = jsonDecode(response.body);
         final items = body['items'] as List<dynamic>? ?? [];
         
         final uniqueItems = <dynamic>[];
         final seenFiles = <String>{};
         for (var item in items) {
           final fName = item['file_name']?.toString() ?? '';
           if (!seenFiles.contains(fName)) {
              seenFiles.add(fName);
              uniqueItems.add(item);
           }
         }
         return uniqueItems;
       }
       return null;
     } catch (e) {
       return null;
     }
  }

  // Get Paginated Analysis History with Filters
  Future<Map<String, dynamic>?> getAnalysisHistory({
    int page = 1,
    int pageSize = 10,
    String? prediction,
    String? startDate,
    String? endDate,
  }) async {
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'page_size': pageSize.toString(),
      };
      if (prediction != null && prediction.isNotEmpty && prediction != 'all') {
        queryParams['prediction'] = prediction;
      }
      if (startDate != null && startDate.isNotEmpty) {
        queryParams['start'] = startDate;
      }
      if (endDate != null && endDate.isNotEmpty) {
        queryParams['end'] = endDate;
      }
      
      final String queryString = Uri(queryParameters: queryParams).query;
      final uri = Uri.parse('$baseUrl/history/analyses?$queryString');
      
      final response = await http.get(uri, headers: await _getHeaders());
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Update ground truth logic 
  Future<bool> verifyDiagnosis(int recordId, String trueDiagnosis) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/history/$recordId/verify'),
        headers: await _getHeaders(),
        body: jsonEncode({'true_diagnosis': trueDiagnosis}),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // Submit query to Chatbot
  Future<String?> sendChatMessage({required String question, String language = 'en'}) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/chat/'),
        headers: await _getHeaders(),
        body: jsonEncode({
          'question': question,
          'language': language,
        }),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['answer'];
      }
      return 'Error: Received status code ${response.statusCode} from the server.';
    } catch (e) {
      return 'Error: Could not connect to the chat server. Ensure the backend is active.';
    }
  }

  // Get Model Performance Data
  Future<List<dynamic>?> getModelPerformance() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/models/performance'), headers: await _getHeaders());
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['models'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<Map<String, dynamic>?> getProfile() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/auth/me'), headers: await _getHeaders());
      if (response.statusCode == 200) {
        return jsonDecode(response.body)['user'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<bool> updateProfile(String fullName, String email) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/auth/profile'),
        headers: await _getHeaders(),
        body: jsonEncode({'full_name': fullName, 'email': email}),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<bool> changePassword(String currentPassword, String newPassword) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/change-password'),
        headers: await _getHeaders(),
        body: jsonEncode({'current_password': currentPassword, 'new_password': newPassword}),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<Uint8List?> downloadReportPdf(int recordId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/report/$recordId'), headers: await _getHeaders());
      if (response.statusCode == 200) {
        return response.bodyBytes;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('dg_access_token');
    await prefs.remove('dg_refresh_token');
  }
}

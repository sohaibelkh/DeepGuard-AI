import 'dart:io';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
import '../api_service.dart';
import '../widgets/app_drawer.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final ApiService _api = ApiService();
  
  List<dynamic> _rows = [];
  bool _loading = false;
  String? _error;

  String _predictionFilter = 'all';
  DateTime? _startDate;
  DateTime? _endDate;

  int _page = 1;
  final int _pageSize = 10;
  int _totalPages = 1;
  int _total = 0;

  static const List<String> PREDICTION_OPTIONS = [
    'Normal',
    'Arrhythmia',
    'Atrial Fibrillation',
    'Myocardial Infarction',
    'Tachycardia',
    'Bradycardia'
  ];

  @override
  void initState() {
    super.initState();
    _fetchAnalyses();
  }

  Future<void> _fetchAnalyses() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    final startStr = _startDate != null ? DateFormat('yyyy-MM-dd').format(_startDate!) : '';
    final endStr = _endDate != null ? DateFormat('yyyy-MM-dd').format(_endDate!) : '';

    try {
      final response = await _api.getAnalysisHistory(
        page: _page,
        pageSize: _pageSize,
        prediction: _predictionFilter,
        startDate: startStr,
        endDate: endStr,
      );

      if (mounted) {
        if (response != null) {
          setState(() {
            _rows = response['items'] ?? [];
            _totalPages = response['total_pages'] ?? 1;
            _total = response['total'] ?? 0;
          });
        } else {
          setState(() {
            _error = 'Unable to load analysis history. Please try again.';
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Network error fetching history.';
        });
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _handleVerify(int recordId, String groundTruth) async {
    final success = await _api.verifyDiagnosis(recordId, groundTruth);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ground truth verified successfully!'), backgroundColor: Colors.green),
      );
      
      setState(() {
        final index = _rows.indexWhere((r) => r['id'] == recordId);
        if (index != -1) {
          _rows[index]['true_diagnosis'] = groundTruth;
        }
      });
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to save verification.'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _handleDownloadReport(int recordId) async {
    final bytes = await _api.downloadReportPdf(recordId);
    
    if (bytes != null) {
      try {
        final dir = await getApplicationDocumentsDirectory();
        final timestamp = DateTime.now().millisecondsSinceEpoch;
        final file = File('${dir.path}/DeepGuard_Report_${recordId}_$timestamp.pdf');
        await file.writeAsBytes(bytes);
        
        if (mounted) {
           ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Report downloaded successfully!', style: TextStyle(color: Colors.white)), backgroundColor: const Color(0xFFA5C422), duration: const Duration(seconds: 4), action: SnackBarAction(label: 'OPEN', textColor: Colors.white, onPressed: () => OpenFilex.open(file.path))));
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to save file: $e', style: const TextStyle(fontSize: 10)), backgroundColor: Colors.red));
        }
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to download report from server.', style: TextStyle(color: Colors.white)), backgroundColor: Colors.red));
      }
    }
  }

  void _resetFilters() {
    setState(() {
      _predictionFilter = 'all';
      _startDate = null;
      _endDate = null;
      _page = 1;
    });
    _fetchAnalyses();
  }

  Future<void> _pickDate(bool isStart) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
            colorScheme: const ColorScheme.light(primary: Color(0xFFA5C422)),
          ),
          child: child!,
        );
      },
    );
    
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
        } else {
          _endDate = picked;
        }
        _page = 1;
      });
      _fetchAnalyses();
    }
  }

  Widget _buildFilterSection() {
    final startStr = _startDate != null ? DateFormat('MM/dd/yyyy').format(_startDate!) : 'mm/dd/yyyy';
    final endStr = _endDate != null ? DateFormat('MM/dd/yyyy').format(_endDate!) : 'mm/dd/yyyy';

    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 16),
      width: double.infinity,
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.filter_list_rounded, size: 16, color: Colors.grey),
              const SizedBox(width: 6),
              const Text('FILTERS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.5)),
              const Spacer(),
              TextButton(
                onPressed: _resetFilters,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text('RESET FILTERS', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFFA5C422), letterSpacing: 0.5)),
              )
            ],
          ),
          const SizedBox(height: 12),
          
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              // Prediction Dropdown
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5)
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _predictionFilter,
                    dropdownColor: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    icon: const Padding(
                      padding: EdgeInsets.only(left: 8.0),
                      child: Icon(Icons.unfold_more_rounded, size: 18, color: Color(0xFF94A3B8)),
                    ),
                    items: [
                      const DropdownMenuItem(value: 'all', child: Text('All Predictions', style: TextStyle(fontSize: 12, color: Color(0xFF333333), fontWeight: FontWeight.w500))),
                      ...PREDICTION_OPTIONS.map((p) => DropdownMenuItem(value: p, child: Text(p, style: const TextStyle(fontSize: 12, color: Color(0xFF333333), fontWeight: FontWeight.w500)))),
                    ],
                    onChanged: (val) {
                      if (val != null) {
                        setState(() { _predictionFilter = val; _page = 1; });
                        _fetchAnalyses();
                      }
                    },
                  ),
                ),
              ),
              
              // Dates
              Row(
                 mainAxisSize: MainAxisSize.min,
                 children: [
                   InkWell(
                     onTap: () => _pickDate(true),
                     child: Container(
                       padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                       decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.grey.shade300)),
                       child: Row(
                         mainAxisSize: MainAxisSize.min,
                         children: [
                           const Text('FROM  ', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                           Text(startStr, style: const TextStyle(fontSize: 12, color: Colors.black87)),
                           const SizedBox(width: 8),
                           const Icon(Icons.calendar_today_rounded, size: 14, color: Colors.grey),
                         ],
                       ),
                     ),
                   ),
                   const SizedBox(width: 8),
                   InkWell(
                     onTap: () => _pickDate(false),
                     child: Container(
                       padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                       decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10), border: Border.all(color: Colors.grey.shade300)),
                       child: Row(
                         mainAxisSize: MainAxisSize.min,
                         children: [
                           const Text('TO  ', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                           Text(endStr, style: const TextStyle(fontSize: 12, color: Colors.black87)),
                           const SizedBox(width: 8),
                           const Icon(Icons.calendar_today_rounded, size: 14, color: Colors.grey),
                         ],
                       ),
                     ),
                   ),
                 ],
              )
            ],
          )
        ],
      ),
    );
  }

  Widget _buildAnalysisCard(Map<String, dynamic> row) {
    final bNormal = row['prediction'] == 'Normal';
    final parsedDate = DateTime.tryParse(row['created_at'] ?? '') ?? DateTime.now();
    final dateStr = DateFormat('MMM dd, yyyy, hh:mm a').format(parsedDate);
    final confPct = ((row['confidence'] as num? ?? 0) * 100).round();
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(dateStr, style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w500)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: bNormal ? const Color(0xFFF0F7D4) : Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: bNormal ? const Color(0xFFA5C422).withOpacity(0.3) : Colors.amber.shade200)
                ),
                child: Text(row['prediction'] ?? 'Unknown', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: bNormal ? const Color(0xFFA5C422) : Colors.amber.shade800)),
              )
            ],
          ),
          const SizedBox(height: 12),
          
          Row(
            children: [
              Container(
                 padding: const EdgeInsets.all(8),
                 decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.grey.shade200)),
                 child: const Icon(Icons.insert_drive_file_rounded, size: 16, color: Colors.grey),
              ),
              const SizedBox(width: 10),
              Expanded(
                 child: Text(row['file_name'] ?? 'Unknown File', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF333333))),
              ),
              Column(
                 crossAxisAlignment: CrossAxisAlignment.end,
                 children: [
                   const Text('CONFIDENCE', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.grey)),
                   Text('$confPct%', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF333333))),
                 ],
              )
            ],
          ),
          
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1),
          ),
          
          Row(
            children: [
              // Verification Dropdown
              Expanded(
                child: Container(
                  height: 38,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: row['true_diagnosis'] != null ? const Color(0xFFF0F7D4) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: row['true_diagnosis'] != null ? const Color(0xFFA5C422).withValues(alpha: 0.5) : const Color(0xFFE2E8F0), width: 1.5)
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      dropdownColor: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      value: PREDICTION_OPTIONS.contains(row['true_diagnosis']) ? row['true_diagnosis'] : null,
                      hint: const Text('Verify...', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                      icon: Icon(Icons.unfold_more_rounded, size: 18, color: row['true_diagnosis'] != null ? const Color(0xFFA5C422) : const Color(0xFF94A3B8)),
                      items: PREDICTION_OPTIONS.map((p) => DropdownMenuItem(value: p, child: Text(p, style: TextStyle(fontSize: 12, color: row['true_diagnosis'] != null ? const Color(0xFFA5C422) : const Color(0xFF333333), fontWeight: FontWeight.w500)))).toList(),
                      onChanged: (val) {
                         if (val != null) _handleVerify(row['id'], val);
                      },
                    ),
                  ),
                ),
              ),
              
              const SizedBox(width: 12),
              
              // PDF Action
              ElevatedButton.icon(
                onPressed: () => _handleDownloadReport(row['id']),
                icon: const Icon(Icons.picture_as_pdf_rounded, size: 14, color: Colors.white),
                label: const Text('PDF', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFA5C422),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                  minimumSize: const Size(0, 32),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              )
            ],
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F8),
      drawer: const AppDrawer(currentRoute: '/history'),
      appBar: AppBar(
        title: Column(
           crossAxisAlignment: CrossAxisAlignment.start,
           children: [
              const Text('ANALYSIS HISTORY', style: TextStyle(color: Color(0xFF333333), fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.5)),
              const Text('Review past ECG analyses and predictions.', style: TextStyle(color: Color(0xFF999999), fontSize: 11)),
           ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Color(0xFF333333)),
        actions: [
          Center(
            child: Container(
              margin: const EdgeInsets.only(right: 16),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade200)),
              child: Row(
                children: [
                  const Icon(Icons.history_rounded, size: 12, color: Color(0xFFA5C422)),
                  const SizedBox(width: 4),
                  Text('$_total Analyses', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                ],
              ),
            ),
          )
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildFilterSection(),
              
              if (_error != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.red.shade100)),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline_rounded, size: 16, color: Colors.red),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_error!, style: const TextStyle(fontSize: 11, color: Colors.red))),
                    ],
                  ),
                ),
                
              if (_loading)
                const Center(child: Padding(padding: EdgeInsets.all(32.0), child: CircularProgressIndicator(color: Color(0xFFA5C422))))
              else if (_rows.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
                  child: Column(
                    children: const [
                       Icon(Icons.inbox_rounded, size: 48, color: Colors.grey),
                       SizedBox(height: 16),
                       Text('No analyses match the current filters.', style: TextStyle(fontSize: 13, color: Colors.black54)),
                    ],
                  ),
                )
              else
                ..._rows.map((r) => _buildAnalysisCard(r as Map<String, dynamic>)),

              if (!_loading && _rows.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8.0, bottom: 24.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Page $_page of $_totalPages', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.grey)),
                      Row(
                        children: [
                          OutlinedButton.icon(
                            onPressed: _page > 1 ? () { setState(() => _page--); _fetchAnalyses(); } : null,
                            icon: const Icon(Icons.chevron_left_rounded, size: 16),
                            label: const Text('Prev', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.black87,
                              side: BorderSide(color: Colors.grey.shade300),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                              minimumSize: const Size(0, 32),
                            ),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton(
                            onPressed: _page < _totalPages ? () { setState(() => _page++); _fetchAnalyses(); } : null,
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.black87,
                              side: BorderSide(color: Colors.grey.shade300),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                              minimumSize: const Size(0, 32),
                            ),
                            child: Row(
                               children: const [
                                 Text('Next', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                 SizedBox(width: 4),
                                 Icon(Icons.chevron_right_rounded, size: 16),
                               ],
                            ),
                          ),
                        ],
                      )
                    ],
                  ),
                )
            ],
          ),
        ),
      ),
    );
  }
}

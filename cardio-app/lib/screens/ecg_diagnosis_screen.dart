import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:fl_chart/fl_chart.dart';
import '../api_service.dart';
import '../widgets/app_drawer.dart';

class EcgDiagnosisScreen extends StatefulWidget {
  const EcgDiagnosisScreen({super.key});

  @override
  State<EcgDiagnosisScreen> createState() => _EcgDiagnosisScreenState();
}

class _EcgDiagnosisScreenState extends State<EcgDiagnosisScreen> {
  PlatformFile? _selectedFile;
  List<FlSpot> _signalData = [];
  String? _error;
  bool _submitting = false;
  Map<String, dynamic>? _result;
  List<dynamic> _models = [];
  String _selectedModel = 'hybrid_cnn_lstm';
  
  static const Map<String, Color> CLASS_COLORS = {
    'Normal': Color(0xFF22C55E),
    'Arrhythmia': Color(0xFFF97316),
    'Atrial Fibrillation': Color(0xFFA5C422),
    'Myocardial Infarction': Color(0xFFEF4444),
    'Tachycardia': Color(0xFFA855F7),
    'Bradycardia': Color(0xFFEAB308),
  };

  @override
  void initState() {
    super.initState();
    _fetchModels();
  }

  Future<void> _fetchModels() async {
    final api = ApiService();
    final models = await api.fetchModels();
    if (mounted && models != null) {
      setState(() {
        _models = models;
        if (models.isNotEmpty) {
          _selectedModel = models.first['name'];
        }
      });
    }
  }

  Future<void> _pickFile() async {
    setState(() => _error = null);
    FilePickerResult? result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['csv', 'txt', 'dat', 'hea'],
      withData: true,
    );

    if (result != null && result.files.isNotEmpty) {
      final file = result.files.single;
      if (file.size > 5 * 1024 * 1024) {
        setState(() {
          _error = 'File too large. Maximum size is 5MB.';
          _selectedFile = null;
          _signalData = [];
          _result = null;
        });
        return;
      }

      setState(() {
        _selectedFile = file;
        _result = null;
      });

      _parseFileForPreview(file);
    }
  }

  Future<void> _parseFileForPreview(PlatformFile file) async {
    try {
      String fileContent = '';
      if (kIsWeb) {
        fileContent = String.fromCharCodes(file.bytes!);
      } else {
        fileContent = await File(file.path!).readAsString();
      }

      final lines = fileContent.split(RegExp(r'\r?\n'));
      List<FlSpot> spots = [];
      int index = 0;
      int maxPoints = 500; // Limit rendering for mobile performance

      for (var line in lines) {
        if (index >= maxPoints) break;
        var parts = line.split(RegExp(r'[\s,;]+')).where((p) => p.isNotEmpty);
        for (var part in parts) {
          var numValue = double.tryParse(part);
          if (numValue != null) {
            spots.add(FlSpot(index.toDouble(), numValue));
            index++;
            if (index >= maxPoints) break;
          }
        }
      }
      setState(() {
        _signalData = spots;
      });
    } catch (e) {
      setState(() {
        _signalData = [];
      });
    }
  }

  Future<void> _runDiagnosis() async {
    if (_selectedFile == null || _submitting) return;

    setState(() {
      _error = null;
      _submitting = true;
      _result = null;
    });

    final api = ApiService();
    final result = await api.predictECG(
      filePath: kIsWeb ? null : _selectedFile!.path,
      fileBytes: kIsWeb ? _selectedFile!.bytes : null,
      fileName: _selectedFile!.name,
      modelName: _selectedModel,
    );

    if (mounted) {
      setState(() {
        _submitting = false;
        if (result != null && result['is_error'] != true) {
          _result = result;
        } else {
          _error = result?['error'] ?? 'Unable to complete analysis.';
        }
      });
    }
  }

  Widget _buildPreviewChart() {
    if (_signalData.isEmpty) {
      return Container(
        height: 150,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: const Center(
          child: Text('Upload an ECG file to see the signal preview.', style: TextStyle(color: Color(0xFF999999), fontSize: 12)),
        ),
      );
    }

    double minY = _signalData.map((e) => e.y).reduce((a, b) => a < b ? a : b);
    double maxY = _signalData.map((e) => e.y).reduce((a, b) => a > b ? a : b);

    return Container(
      height: 200,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: LineChart(
        LineChartData(
          minX: 0,
          maxX: _signalData.length.toDouble(),
          minY: minY - (maxY - minY) * 0.1,
          maxY: maxY + (maxY - minY) * 0.1,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (value) => FlLine(color: Colors.grey.shade200, strokeWidth: 1, dashArray: [4, 4]),
          ),
          titlesData: FlTitlesData(
            show: true,
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(showTitles: true, reservedSize: 22, getTitlesWidget: (val, meta) => Text(val.toInt().toString(), style: const TextStyle(fontSize: 10, color: Color(0xFF999999)))),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(showTitles: true, reservedSize: 32, getTitlesWidget: (val, meta) => Text(val.toStringAsFixed(1), style: const TextStyle(fontSize: 10, color: Color(0xFF999999)))),
            ),
          ),
          borderData: FlBorderData(show: false),
          lineBarsData: [
            LineChartBarData(
              spots: _signalData,
              isCurved: true,
              color: const Color(0xFFA5C422),
              barWidth: 2,
              isStrokeCapRound: true,
              dotData: const FlDotData(show: false),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResultPanel() {
    if (_result == null && !_submitting) {
      return Container(
        height: 200,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: const Center(
          child: Text('Results will appear here after diagnosis.', style: TextStyle(color: Color(0xFF999999), fontSize: 12)),
        ),
      );
    }

    if (_submitting) {
       return Container(
        height: 200,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: const Center(
          child: CircularProgressIndicator(color: Color(0xFFA5C422)),
        ),
      );
    }

    final prediction = _result!['prediction']?.toString() ?? 'Unanalyzed';
    final pColor = CLASS_COLORS[prediction] ?? Colors.grey;
    final conf = (_result!['confidence'] ?? 0.0) * 100.0;
    
    final relScore = (_result!['reliability_score'] ?? 0.0) * 100.0;
    final isReliable = _result!['is_reliable'] == true;

    final classProbsRaw = _result!['class_probabilities'] as Map<String, dynamic>? ?? {};
    final classProbs = classProbsRaw.entries.map((e) => MapEntry(e.key, (e.value as num).toDouble() * 100.0)).toList();
    classProbs.sort((a, b) => b.value.compareTo(a.value));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Top Diagnosis Card
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('DIAGNOSIS RESULT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF999999), letterSpacing: 0.5)),
                  if (!isReliable)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.red.shade200)),
                      child: Row(
                        children: const [
                           Icon(Icons.warning_amber_rounded, size: 14, color: Colors.red),
                           SizedBox(width: 4),
                           Text('LOW RELIABILITY', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.red)),
                        ],
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(prediction, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: pColor)),
                      const SizedBox(height: 4),
                      Text('Model: ${_result!['model_used']} · ${(_result!['processing_time_ms'] ?? 0).toInt()}ms', style: const TextStyle(fontSize: 11, color: Color(0xFF999999))),
                    ],
                  ),
                  Row(
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('${conf.toInt()}%', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF333333))),
                          const Text('Confidence', style: TextStyle(fontSize: 10, color: Color(0xFF999999))),
                        ],
                      ),
                      const SizedBox(width: 16),
                       Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('${relScore.toInt()}%', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: isReliable ? Colors.green : Colors.orange)),
                          const Text('Reliability', style: TextStyle(fontSize: 10, color: Color(0xFF999999))),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
              if (!isReliable)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Text('* Low clinical reliability detected. The signal may be too noisy or the pattern is highly uncertain. Manual cardiologist review is recommended.',
                    style: TextStyle(fontSize: 10, color: Colors.red.shade400, fontStyle: FontStyle.italic),
                  ),
                ),
            ],
          ),
        ),
        
        const SizedBox(height: 16),
        
        // Probability Bars
        if (classProbs.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('CLASS PROBABILITIES', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF999999), letterSpacing: 0.5)),
                const SizedBox(height: 16),
                ...classProbs.map((e) {
                   return Padding(
                     padding: const EdgeInsets.only(bottom: 12.0),
                     child: Column(
                       crossAxisAlignment: CrossAxisAlignment.start,
                       children: [
                         Row(
                           mainAxisAlignment: MainAxisAlignment.spaceBetween,
                           children: [
                             Text(e.key, style: const TextStyle(fontSize: 12, color: Color(0xFF555555))),
                             Text('${e.value.toStringAsFixed(1)}%', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF333333))),
                           ],
                         ),
                         const SizedBox(height: 6),
                         LinearProgressIndicator(
                           value: e.value / 100.0,
                           backgroundColor: Colors.grey.shade100,
                           valueColor: AlwaysStoppedAnimation<Color>(CLASS_COLORS[e.key] ?? const Color(0xFF999999)),
                           minHeight: 8,
                           borderRadius: BorderRadius.circular(4),
                         ),
                       ],
                     ),
                   );
                }).toList(),
              ],
            ),
          )
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F8),
      drawer: const AppDrawer(currentRoute: '/diagnosis'),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('ECG DIAGNOSIS', style: TextStyle(color: Color(0xFF333333), fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.5)),
            const Text('AI-powered cardiac analysis runner', style: TextStyle(color: Color(0xFF999999), fontSize: 11)),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Color(0xFF333333)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: LayoutBuilder(
          builder: (context, constraints) {
            bool isDesktop = constraints.maxWidth > 800;
            
            List<Widget> content = [
               // Form Section
               Expanded(
                 flex: isDesktop ? 6 : 0,
                 child: Column(
                   crossAxisAlignment: CrossAxisAlignment.start,
                   children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Drap/Drop
                            GestureDetector(
                              onTap: _submitting ? null : _pickFile,
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(vertical: 40),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade50,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid, width: 1.5), 
                                ),
                                child: Column(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(color: Colors.grey.shade200, shape: BoxShape.circle),
                                      child: const Icon(Icons.upload_file_rounded, color: Colors.grey, size: 24),
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                       _selectedFile != null ? _selectedFile!.name : 'Tap to select your ECG signal file',
                                       style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF333333), fontSize: 14),
                                       textAlign: TextAlign.center,
                                    ),
                                    const SizedBox(height: 8),
                                    const Text('Supports .csv and .txt formats', style: TextStyle(color: Color(0xFF999999), fontSize: 11)),
                                    if (_selectedFile != null)
                                       Padding(
                                         padding: const EdgeInsets.only(top: 16.0),
                                         child: Container(
                                           padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                           decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade300), borderRadius: BorderRadius.circular(20)),
                                           child: const Text('CHANGE FILE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF777777))),
                                         ),
                                       ),
                                  ],
                                ),
                              ),
                            ),
                            
                            if (_error != null)
                               Padding(
                                 padding: const EdgeInsets.only(top: 12.0),
                                 child: Text(_error!, style: TextStyle(color: Colors.red.shade400, fontSize: 12)),
                               ),

                            const SizedBox(height: 24),
                            
                            // Model dropdown
                            const Text('MODEL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF999999), letterSpacing: 0.5)),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  dropdownColor: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  isExpanded: true,
                                  value: _selectedModel,
                                  icon: const Icon(Icons.unfold_more_rounded, color: Color(0xFF94A3B8)),
                                  items: _models.map((m) {
                                    return DropdownMenuItem<String>(
                                      value: m['name'],
                                      child: Text('${m['display_name']} (${m['type'] == 'classical' ? 'ML' : 'DL'})', style: const TextStyle(fontSize: 13, color: Color(0xFF333333))),
                                    );
                                  }).toList().isEmpty ? [
                                     const DropdownMenuItem(value: 'hybrid_cnn_lstm', child: Text('CNN + LSTM Hybrid (DL)', style: TextStyle(fontSize: 13))),
                                  ] : _models.map((m) {
                                    return DropdownMenuItem<String>(
                                      value: m['name'],
                                      child: Text('${m['display_name']} (${m['type'] == 'classical' ? 'ML' : 'DL'})', style: const TextStyle(fontSize: 13, color: Color(0xFF333333))),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    if (val != null) setState(() => _selectedModel = val);
                                  },
                                ),
                              ),
                            ),
                            
                            const SizedBox(height: 20),
                            Row(
                               mainAxisAlignment: MainAxisAlignment.end,
                               children: [
                                  ElevatedButton(
                                    onPressed: (_selectedFile == null || _submitting) ? null : _runDiagnosis,
                                    style: ElevatedButton.styleFrom(
                                       backgroundColor: const Color(0xFFA5C422),
                                       disabledBackgroundColor: Colors.grey.shade300,
                                       shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                       padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                       elevation: 0,
                                    ),
                                    child: _submitting 
                                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                      : const Text('Run Diagnosis', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                                  ),
                               ],
                            )
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 20),
                      const Text('SIGNAL PREVIEW', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF999999), letterSpacing: 0.5)),
                      const SizedBox(height: 8),
                      _buildPreviewChart(),
                   ],
                 )
               ),
               
               if (isDesktop) const SizedBox(width: 20),
               if (!isDesktop) const SizedBox(height: 20),
               
               Expanded(
                 flex: isDesktop ? 6 : 0,
                 child: _buildResultPanel()
               ),
            ];
            
            return isDesktop 
               ? Row(crossAxisAlignment: CrossAxisAlignment.start, children: content) 
               : Column(crossAxisAlignment: CrossAxisAlignment.start, children: content);
          }
        ),
      ),
    );
  }
}

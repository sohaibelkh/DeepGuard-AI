import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:fl_chart/fl_chart.dart';
import '../api_service.dart';
import '../widgets/app_drawer.dart';

class PerformanceScreen extends StatefulWidget {
  const PerformanceScreen({super.key});

  @override
  State<PerformanceScreen> createState() => _PerformanceScreenState();
}

class _PerformanceScreenState extends State<PerformanceScreen> {
  final ApiService _api = ApiService();

  List<dynamic> _models = [];
  String _selectedModelName = 'hybrid_cnn_lstm';
  bool _loading = true;

  static const Map<String, Color> MODEL_COLORS = {
    'svm': Color(0xFFf97316),
    'random_forest': Color(0xFF22c55e),
    'knn': Color(0xFFeab308),
    'cnn': Color(0xFFA5C422),
    'lstm': Color(0xFFa855f7),
    'hybrid_cnn_lstm': Color(0xFF06b6d4),
  };

  static const List<String> ECG_CLASSES = [
    'Normal', 'Arrhythmia', 'Atrial Fib.', 'Myocard. Inf.', 'Tachycardia', 'Bradycardia'
  ];

  @override
  void initState() {
    super.initState();
    _fetchModels();
  }

  Future<void> _fetchModels() async {
    final models = await _api.getModelPerformance();
    if (mounted) {
      setState(() {
        _models = models ?? [];
        if (_models.isNotEmpty && !_models.any((m) => m['model_name'] == _selectedModelName)) {
          _selectedModelName = _models.first['model_name'];
        }
        _loading = false;
      });
    }
  }

  Map<String, dynamic>? get _selectedModel {
    if (_models.isEmpty) return null;
    return _models.firstWhere((m) => m['model_name'] == _selectedModelName, orElse: () => _models.first);
  }

  Widget _buildMetricCard(String title, num value, String subtitle) {
    final displayVal = (value * 100).toStringAsFixed(1);
    return Container(
      width: (MediaQuery.of(context).size.width - 32 - 16) / 2, // 2 columns
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200)
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.5)),
          const SizedBox(height: 8),
          Text('$displayVal%', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF333333))),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(fontSize: 11, color: Colors.grey), maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }

  Widget _buildMetricsGrid(Map<String, dynamic> model) {
    return Wrap(
      spacing: 16,
      runSpacing: 16,
      children: [
        _buildMetricCard('Accuracy', model['accuracy'] ?? 0, 'Overall correct'),
        _buildMetricCard('Precision', model['precision'] ?? 0, 'Positive quality'),
        _buildMetricCard('Recall', model['recall'] ?? 0, 'Sensitivity (Medical)'),
        _buildMetricCard('F1-Score', model['f1_score'] ?? 0, 'Harmonic mean of P & R'),
      ],
    );
  }

  Widget _buildRocCurve(Map<String, dynamic> model) {
    List<dynamic> rocData = [];
    if (model['roc_data'] != null) {
      try {
        rocData = jsonDecode(model['roc_data']);
      } catch (_) {}
    }

    final spots = rocData.map((e) {
      final fpr = (e['fpr'] as num).toDouble();
      final tpr = (e['tpr'] as num).toDouble();
      return FlSpot(fpr, tpr);
    }).toList();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.security_rounded, size: 16, color: Color(0xFFA5C422)),
              const SizedBox(width: 8),
              Text('ROC CURVE — ${model['display_name']}'.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.5)),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 220,
            child: LineChart(
              LineChartData(
                minX: 0, maxX: 1, minY: 0, maxY: 1,
                gridData: FlGridData(
                  show: true, 
                  drawVerticalLine: true,
                  getDrawingHorizontalLine: (value) => FlLine(color: Colors.grey.shade200, strokeWidth: 1, dashArray: [5, 5]),
                  getDrawingVerticalLine: (value) => FlLine(color: Colors.grey.shade200, strokeWidth: 1, dashArray: [5, 5]),
                ),
                titlesData: FlTitlesData(
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 40, getTitlesWidget: (val, _) {
                    return Text('${(val * 100).toInt()}%', style: const TextStyle(fontSize: 10, color: Colors.grey));
                  })),
                  bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 20, getTitlesWidget: (val, _) {
                    return Text('${(val * 100).toInt()}%', style: const TextStyle(fontSize: 10, color: Colors.grey));
                  })),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: const [FlSpot(0, 0), FlSpot(1, 1)],
                    isCurved: false,
                    color: Colors.grey.shade300,
                    barWidth: 1,
                    dotData: FlDotData(show: false),
                    dashArray: [5, 5]
                  ),
                  LineChartBarData(
                    spots: spots.isEmpty ? const [FlSpot(0, 0), FlSpot(1, 1)] : spots,
                    isCurved: false,
                    color: const Color(0xFFA5C422),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(show: false),
                    belowBarData: BarAreaData(show: false),
                  ),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildConfusionMatrix(Map<String, dynamic> model) {
    List<dynamic> cm = [];
    if (model['confusion_matrix'] != null) {
      try {
        cm = jsonDecode(model['confusion_matrix']);
      } catch (_) {}
    }
    
    num maxVal = 1;
    if (cm.isNotEmpty) {
      for (var row in cm) {
         for (var val in row) {
            if (val > maxVal) maxVal = val;
         }
      }
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.grid_view_rounded, size: 16, color: Color(0xFFA5C422)),
              const SizedBox(width: 8),
              Text('CONFUSION MATRIX — ${model['display_name']}'.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.5)),
            ],
          ),
          const SizedBox(height: 16),
          
          Container(
            decoration: BoxDecoration(border: Border.all(color: Colors.grey.shade200), borderRadius: BorderRadius.circular(12)),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Row
                  Row(
                    children: [
                      Container(width: 90, height: 40, alignment: Alignment.center, decoration: BoxDecoration(color: const Color(0xFFF9F9F9), border: Border(right: BorderSide(color: Colors.grey.shade200), bottom: BorderSide(color: Colors.grey.shade200))), child: const Text('PRED \\ TRUE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey))),
                      ...ECG_CLASSES.map((c) => Container(width: 80, height: 40, alignment: Alignment.center, decoration: BoxDecoration(color: const Color(0xFFF9F9F9), border: Border(right: BorderSide(color: Colors.grey.shade200), bottom: BorderSide(color: Colors.grey.shade200))), child: Text(c.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)))),
                    ],
                  ),
                  // Data Rows
                  ...List.generate(cm.length, (i) {
                     final row = cm[i] as List<dynamic>;
                     return Row(
                        children: [
                          Container(width: 90, height: 40, alignment: Alignment.centerLeft, padding: const EdgeInsets.only(left: 8), decoration: BoxDecoration(color: const Color(0xFFFDFDFD), border: Border(right: BorderSide(color: Colors.grey.shade200), bottom: BorderSide(color: Colors.grey.shade200))), child: Text(ECG_CLASSES[i], style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black54))),
                          ...List.generate(row.length, (j) {
                             final val = row[j] as num;
                             final intensity = maxVal > 0 ? val / maxVal : 0.0;
                             
                             Color bg = Colors.white;
                             Color textColor = Colors.grey;
                             FontWeight weight = FontWeight.normal;
                             
                             if (i == j) {
                                bg = intensity > 0.3 ? const Color(0xFFF0F7D4) : const Color(0xFFFAFDCF);
                                textColor = const Color(0xFFA5C422);
                                weight = FontWeight.bold;
                             } else {
                                if (intensity > 0.1) bg = Colors.red.shade50;
                             }
                             
                             return Container(
                                width: 80, height: 40, alignment: Alignment.center,
                                decoration: BoxDecoration(color: bg, border: Border(right: BorderSide(color: Colors.grey.shade200), bottom: BorderSide(color: Colors.grey.shade200))),
                                child: Text('$val', style: TextStyle(fontSize: 11, color: textColor, fontWeight: weight)),
                             );
                          })
                        ]
                     );
                  })
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
Widget _buildComparisonChart() {
    final metrics = ['accuracy', 'precision', 'recall', 'f1_score'];
    final labels = ['Accuracy', 'Precision', 'Recall', 'F1'];
  

    List<BarChartGroupData> barGroups = [];

    for (int i = 0; i < metrics.length; i++) {
       final metric = metrics[i];
       
       List<BarChartRodData> rods = [];
       
       for (int j = 0; j < _models.length; j++) {
          final m = _models[j];
          final val = (m[metric] as num? ?? 0).toDouble() * 100;
          final isSelected = m['model_name'] == _selectedModelName;
          
          rods.add(
             BarChartRodData(
                toY: val,
                color: MODEL_COLORS[m['model_name']] ?? Colors.grey,
                width: isSelected ? 8 : 4,
                borderRadius: const BorderRadius.only(topLeft: Radius.circular(2), topRight: Radius.circular(2)),
             )
          );
       }
       
       barGroups.add(BarChartGroupData(
          x: i,
          barRods: rods,
          barsSpace: 4,
       ));
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.bar_chart_rounded, size: 16, color: Color(0xFFA5C422)),
              SizedBox(width: 8),
              Text('MODEL METRICS COMPARISON', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.5)),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 250,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: 100,
                barTouchData: BarTouchData(enabled: false),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 28,
                      getTitlesWidget: (val, _) {
                        return Padding(
                          padding: const EdgeInsets.only(top: 8.0),
                          child: Text(labels[val.toInt()], style: const TextStyle(fontSize: 10, color: Colors.grey)),
                        );
                      }
                    )
                  ),
                  leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 40, getTitlesWidget: (val, _) {
                    return Text('${val.toInt()}%', style: const TextStyle(fontSize: 10, color: Colors.grey));
                  })),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) => FlLine(color: Colors.grey.shade200, strokeWidth: 1, dashArray: [5, 5]),
                ),
                borderData: FlBorderData(show: false),
                barGroups: barGroups,
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          Wrap(
             spacing: 8,
             runSpacing: 8,
             children: _models.map((m) {
                return Container(
                   padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                   decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
                   child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                         Container(width: 8, height: 8, decoration: BoxDecoration(color: MODEL_COLORS[m['model_name']] ?? Colors.grey, shape: BoxShape.circle)),
                         const SizedBox(width: 6),
                         Text(m['display_name'] ?? '', style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
                      ],
                   ),
                );
             }).toList(),
          )
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F8),
      drawer: const AppDrawer(currentRoute: '/performance'),
      appBar: AppBar(
        title: Column(
           crossAxisAlignment: CrossAxisAlignment.start,
           children: const [
              Text('MODEL PERFORMANCE', style: TextStyle(color: Color(0xFF333333), fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5)),
              Text('Evaluation metrics and configuration.', style: TextStyle(color: Color(0xFF999999), fontSize: 10)),
           ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Color(0xFF333333)),
        actions: [
          if (!_loading && _models.isNotEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.only(right: 16.0),
                child: Container(
                  height: 32,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                     color: const Color(0xFFF8FAFC),
                     borderRadius: BorderRadius.circular(10),
                     border: Border.all(color: const Color(0xFFE2E8F0))
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedModelName,
                      dropdownColor: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      icon: const Padding(
                        padding: EdgeInsets.only(left: 4.0),
                        child: Icon(Icons.unfold_more_rounded, size: 16, color: Color(0xFF94A3B8)),
                      ),
                      items: _models.map((m) {
                        return DropdownMenuItem<String>(
                          value: m['model_name']!,
                          child: Text(m['display_name'] ?? '', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF333333))),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedModelName = val);
                      },
                    ),
                  ),
                ),
              ),
            )
        ],
      ),
      body: SafeArea(
        child: _loading 
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFA5C422)))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   _buildMetricsGrid(_selectedModel!),
                   const SizedBox(height: 16),
                   _buildRocCurve(_selectedModel!),
                   const SizedBox(height: 16),
                   _buildConfusionMatrix(_selectedModel!),
                   const SizedBox(height: 16),
                   _buildComparisonChart(),
                   const SizedBox(height: 24),
                ],
              ),
            ),
      ),
    );
  }
}

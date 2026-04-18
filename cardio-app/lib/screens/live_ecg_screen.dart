import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../api_service.dart';
import '../widgets/app_drawer.dart';

class LiveEcgScreen extends StatefulWidget {
  const LiveEcgScreen({super.key});

  @override
  State<LiveEcgScreen> createState() => _LiveEcgScreenState();
}

enum ConnStatus { disconnected, connecting, connected, done }

class _LiveEcgScreenState extends State<LiveEcgScreen> {
  ConnStatus _status = ConnStatus.disconnected;
  List<FlSpot> _data = [];
  int _heartRate = 0;
  double _progress = 0.0;
  
  List<Map<String, dynamic>> _aiResults = [];
  Map<String, dynamic>? _latestDiagnosis;
  
  List<dynamic> _records = [];
  String _selectedRecordId = '';
  
  WebSocketChannel? _channel;
  final int _maxVisible = 600;


  @override
  void initState() {
    super.initState();
    _fetchRecords();
  }

  Future<void> _fetchRecords() async {
    final api = ApiService();
    final records = await api.fetchHistoryRecords();
    if (mounted && records != null) {
      setState(() {
        _records = records;
      });
    }
  }

  void _connect() {
    _disconnect();
    
    setState(() {
      _status = ConnStatus.connecting;
      _data = [];
      _heartRate = 0;
      _progress = 0;
      _aiResults = [];
      _latestDiagnosis = null;
    });

    final api = ApiService();
    String wsUrlStr = '${api.wsBaseUrl}/ws/ecg-stream';
    if (_selectedRecordId.isNotEmpty) {
      wsUrlStr += '?record_id=$_selectedRecordId';
    }

    try {
      _channel = WebSocketChannel.connect(Uri.parse(wsUrlStr));
      
      setState(() {
         _status = ConnStatus.connected;
      });

      _channel!.stream.listen(
        (message) {
          if (!mounted) return;
          final msg = jsonDecode(message);
          
          if (msg['type'] == 'ecg_data') {
             final int startIndex = msg['index'];
             final List<dynamic> newPointsRaw = msg['data'];
             
             setState(() {
               final newSpots = List.generate(newPointsRaw.length, (i) {
                 return FlSpot((startIndex + i).toDouble(), (newPointsRaw[i] as num).toDouble());
               });
               
               _data.addAll(newSpots);
               if (_data.length > _maxVisible) {
                 _data = _data.sublist(_data.length - _maxVisible);
               }
               
               _heartRate = (msg['heart_rate'] as num?)?.toInt() ?? 0;
               _progress = (msg['progress'] as num?)?.toDouble() ?? 0.0;
             });
          } else if (msg['type'] == 'ai_analysis') {
             final result = {
               'index': msg['index'],
               'prediction': msg['prediction'],
               'confidence': msg['confidence'],
               'timestamp': DateTime.now(),
             };
             
             setState(() {
               _latestDiagnosis = result;
               _aiResults.insert(0, result);
               if (_aiResults.length > 10) {
                 _aiResults = _aiResults.sublist(0, 10);
               }
             });
          } else if (msg['type'] == 'stream_end') {
             setState(() {
               _status = ConnStatus.done;
             });
          }
        },
        onError: (error) {
          if (mounted) setState(() => _status = ConnStatus.disconnected);
        },
        onDone: () {
          if (mounted && _status != ConnStatus.done) {
            setState(() => _status = ConnStatus.disconnected);
          }
        },
      );
    } catch (e) {
      if (mounted) setState(() => _status = ConnStatus.disconnected);
    }
  }

  void _disconnect() {
    _channel?.sink.close();
    _channel = null;
    if (mounted) {
       setState(() {
         _status = ConnStatus.disconnected;
       });
    }
  }

  @override
  void dispose() {
    _channel?.sink.close();
    super.dispose();
  }

  Widget _buildTopMetrics() {
    return Row(
      children: [
        Expanded(
          child: _buildMetricCard(
             title: 'Heart Rate',
             value: _heartRate > 0 ? '$_heartRate' : '—',
             icon: Icons.favorite_rounded,
             iconColor: _status == ConnStatus.connected ? Colors.red : Colors.grey.shade400,
             suffix: 'BPM',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildMetricCard(
             title: 'Samples',
             value: _data.isNotEmpty ? '${_data.last.x.toInt()}' : '0',
             icon: Icons.show_chart_rounded,
             iconColor: const Color(0xFFA5C422),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
            child: Column(
               crossAxisAlignment: CrossAxisAlignment.start,
               children: [
                 const Text('STREAM PROGRESS', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF999999), letterSpacing: 0.5)),
                 const SizedBox(height: 8),
                 Text('${_progress.toStringAsFixed(1)}%', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF333333))),
                 const SizedBox(height: 8),
                 LinearProgressIndicator(
                   value: _progress / 100.0,
                   backgroundColor: Colors.grey.shade100,
                   valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFA5C422)),
                   minHeight: 6,
                   borderRadius: BorderRadius.circular(4),
                 ),
               ],
            ),
          )
        ),
      ],
    );
  }
  
  Widget _buildMetricCard({required String title, required String value, required IconData icon, required Color iconColor, String? suffix}) {
     return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
        child: Column(
           crossAxisAlignment: CrossAxisAlignment.start,
           children: [
             Text(title.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF999999), letterSpacing: 0.5)),
             const SizedBox(height: 8),
             FittedBox(
               fit: BoxFit.scaleDown,
               alignment: Alignment.centerLeft,
               child: Row(
                 crossAxisAlignment: CrossAxisAlignment.baseline,
                 textBaseline: TextBaseline.alphabetic,
                 children: [
                   Icon(icon, color: iconColor, size: 22),
                   const SizedBox(width: 8),
                   Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF333333))),
                   if (suffix != null) ...[
                     const SizedBox(width: 4),
                     Container(
                       padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                       decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                       child: Text(suffix, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF999999))),
                     )
                   ]
                 ],
               ),
             ),
           ],
        ),
     );
  }

  Widget _buildChartPanel() {
    double minX = _data.isNotEmpty ? _data.first.x : 0;
    double maxX = _data.isNotEmpty ? _data.last.x : 600;
    
    // Auto scale Y axis beautifully like Recharts 'auto' domain
    double minY = _data.isNotEmpty ? _data.map((e) => e.y).reduce((a, b) => a < b ? a : b) : -1;
    double maxY = _data.isNotEmpty ? _data.map((e) => e.y).reduce((a, b) => a > b ? a : b) : 1;
    
    if (minY == maxY) {
       minY -= 1; maxY += 1;
    }

    return Container(
      height: 350,
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
              const Icon(Icons.show_chart_rounded, size: 16, color: Color(0xFFA5C422)),
              const SizedBox(width: 6),
              const Text('ECG SIGNAL TRACE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF555555), letterSpacing: 0.5)),
              const Spacer(),
              if (_status == ConnStatus.connected)
                Container(
                   padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                   decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.green.shade200)),
                   child: Row(
                     children: [
                       Container(width: 6, height: 6, decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle)),
                       const SizedBox(width: 6),
                       const Text('LIVE FEED', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.green)),
                     ],
                   ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: _data.isEmpty ? const Center(child: Text('Press "Start Stream" to begin real-time ECG visualization.', style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic, fontSize: 13))) : LineChart(
              LineChartData(
                minX: minX,
                maxX: maxX,
                minY: minY - (maxY - minY) * 0.1,
                maxY: maxY + (maxY - minY) * 0.1,
                gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (v) => FlLine(color: Colors.grey.shade200, strokeWidth: 1, dashArray: [4, 4])),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(showTitles: true, reservedSize: 22, getTitlesWidget: (val, m) => Text(val.toInt().toString(), style: const TextStyle(fontSize: 9, color: Color(0xFF999999)))),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(showTitles: true, reservedSize: 32, getTitlesWidget: (val, m) => Text(val.toStringAsFixed(1), style: const TextStyle(fontSize: 9, color: Color(0xFF999999)))),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: _data,
                    isCurved: true,
                    color: const Color(0xFFA5C422),
                    barWidth: 2.5,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: false),
                  ),
                ],
              ),
              duration: const Duration(milliseconds: 0), // Disable animation for live feed
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveDiagnosticsPanel() {
     bool isNormal = _latestDiagnosis?['prediction'] == 'Normal';
     Color bannerColor = _latestDiagnosis == null ? Colors.grey.shade50 : (isNormal ? Colors.green.shade50 : Colors.red.shade50);
     Color bannerBorder = _latestDiagnosis == null ? Colors.grey.shade200 : (isNormal ? Colors.green.shade200 : Colors.red.shade200);
     
     return Container(
        height: 350,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
        child: Column(
           crossAxisAlignment: CrossAxisAlignment.start,
           children: [
             Row(
               children: const [
                 Icon(Icons.memory_rounded, size: 16, color: Colors.purple),
                 SizedBox(width: 6),
                 Text('LIVE DIAGNOSTICS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF555555), letterSpacing: 0.5)),
               ],
             ),
             const SizedBox(height: 16),
             AnimatedContainer(
                duration: const Duration(milliseconds: 500),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: bannerColor, borderRadius: BorderRadius.circular(12), border: Border.all(color: bannerBorder)),
                child: Column(
                   crossAxisAlignment: CrossAxisAlignment.start,
                   children: [
                      const Text('DETECTOR STATUS', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
                      const SizedBox(height: 8),
                      if (_latestDiagnosis == null)
                        const Text('Scanning Stream...', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey))
                      else
                        Row(
                           children: [
                             Icon(isNormal ? Icons.check_circle_rounded : Icons.warning_rounded, color: isNormal ? Colors.green : Colors.red, size: 28),
                             const SizedBox(width: 8),
                             Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                   Text(_latestDiagnosis!['prediction'], style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isNormal ? Colors.green.shade700 : Colors.red.shade700)),
                                   Text('Confidence: ${(_latestDiagnosis!['confidence'] * 100).toStringAsFixed(1)}%', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isNormal ? Colors.green.shade600 : Colors.red.shade600)),
                                ],
                             )
                           ],
                        )
                   ],
                ),
             ),
             const SizedBox(height: 12),
             Expanded(
                child: ListView.builder(
                   padding: EdgeInsets.zero,
                   itemCount: _aiResults.length,
                   itemBuilder: (context, index) {
                      final res = _aiResults[index];
                      final bNormal = res['prediction'] == 'Normal';
                      final timeInfo = res['timestamp'] as DateTime;
                      final hrStr = '${timeInfo.hour.toString().padLeft(2, '0')}:${timeInfo.minute.toString().padLeft(2, '0')}:${timeInfo.second.toString().padLeft(2, '0')}';
                      
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12.0),
                        child: Row(
                           children: [
                              Container(
                                 padding: const EdgeInsets.all(6),
                                 decoration: BoxDecoration(color: bNormal ? Colors.green.shade50 : Colors.red.shade50, shape: BoxShape.circle),
                                 child: Icon(bNormal ? Icons.check_circle_rounded : Icons.warning_rounded, color: bNormal ? Colors.green : Colors.red, size: 14),
                              ),
                              const SizedBox(width: 10),
                              Column(
                                 crossAxisAlignment: CrossAxisAlignment.start,
                                 children: [
                                    Text(res['prediction'], style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: bNormal ? Colors.grey.shade700 : Colors.red.shade600)),
                                    Text('$hrStr • Frame ${res['index']}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                 ],
                              )
                           ],
                        ),
                      );
                   },
                ),
             )
           ],
        ),
     );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F8),
      drawer: const AppDrawer(currentRoute: '/live-ecg'),
      appBar: AppBar(
        title: Column(
           crossAxisAlignment: CrossAxisAlignment.start,
           children: [
              const Text('LIVE ECG MONITOR', style: TextStyle(color: Color(0xFF333333), fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 0.5)),
              const Text('Simulated real-time signal streaming', style: TextStyle(color: Color(0xFF999999), fontSize: 11)),
           ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Color(0xFF333333)),
      ),
      body: SingleChildScrollView(
         padding: const EdgeInsets.all(16),
         child: LayoutBuilder(
           builder: (context, constraints) {
             bool isDesktop = constraints.maxWidth > 800;
             return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   // Controls Row
                   Container(
                      padding: const EdgeInsets.all(16),
                      width: double.infinity,
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
                      child: Wrap(
                         crossAxisAlignment: WrapCrossAlignment.center,
                         alignment: WrapAlignment.spaceBetween,
                         runAlignment: WrapAlignment.spaceBetween,
                         spacing: 16,
                         runSpacing: 16,
                         children: [
                            if (_status != ConnStatus.connected)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5)
                                ),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<String>(
                                    dropdownColor: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    value: _selectedRecordId,
                                    icon: const Padding(
                                      padding: EdgeInsets.only(left: 8.0),
                                      child: Icon(Icons.unfold_more_rounded, size: 20, color: Color(0xFF94A3B8)),
                                    ),
                                    items: [
                                      const DropdownMenuItem(value: '', child: Text('Demo (Synthetic)', style: TextStyle(fontSize: 13, color: Color(0xFF333333)))),
                                      ..._records.map((r) => DropdownMenuItem(value: r['id'].toString(), child: Text('Record #${r['id']} - ${r['file_name'] ?? 'Upload'}', style: const TextStyle(fontSize: 13, color: Color(0xFF333333))))),
                                    ],
                                    onChanged: (val) {
                                       if (val != null) setState(() => _selectedRecordId = val);
                                    },
                                  ),
                                ),
                              ),
                            
                            Wrap(
                               crossAxisAlignment: WrapCrossAlignment.center,
                               spacing: 16,
                               runSpacing: 16,
                               children: [
                                 Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(_status == ConnStatus.connected ? Icons.wifi : Icons.wifi_off, size: 14, color: _status == ConnStatus.connected ? Colors.green : Colors.grey),
                                      const SizedBox(width: 6),
                                      Text(
                                         _status == ConnStatus.connected ? 'LIVE STREAMING' : _status == ConnStatus.connecting ? 'CONNECTING...' : _status == ConnStatus.done ? 'COMPLETED' : 'DISCONNECTED',
                                         style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _status == ConnStatus.connected ? Colors.green : Colors.grey)
                                      ),
                                    ],
                                 ),
                                 
                                 _status == ConnStatus.connected
                                   ? ElevatedButton(
                                       onPressed: _disconnect,
                                       style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade50, elevation: 0, padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10), side: BorderSide(color: Colors.red.shade100))),
                                       child: const Text('Stop', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 13)),
                                     )
                                   : ElevatedButton(
                                       onPressed: _connect,
                                       style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFA5C422), elevation: 0, padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                                       child: const Text('Start Stream', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                     )
                               ],
                            ),
                         ],
                      ),
                   ),
                   const SizedBox(height: 16),
                   
                   _buildTopMetrics(),
                   const SizedBox(height: 16),
                   
                   if (isDesktop)
                     Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                           Expanded(flex: 3, child: _buildChartPanel()),
                           const SizedBox(width: 16),
                           Expanded(flex: 1, child: _buildLiveDiagnosticsPanel()),
                        ],
                     )
                   else
                     Column(
                        children: [
                           _buildChartPanel(),
                           const SizedBox(height: 16),
                           _buildLiveDiagnosticsPanel(),
                        ],
                     ),
                     
                   const SizedBox(height: 16),
                   Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.5), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade300, style: BorderStyle.solid)),
                      child: const Text(
                        'How it works: The backend splits a stored ECG recording into small chunks and streams them via WebSocket at ~100ms intervals, simulating a real-time ECG monitor feed from a physical sensor. The chart displays a sliding window.',
                        style: TextStyle(fontSize: 11, color: Color(0xFF777777), fontStyle: FontStyle.italic, height: 1.5),
                      ),
                   )
                ],
             );
           }
         ),
      ),
    );
  }
}

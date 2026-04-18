import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../api_service.dart';
import '../widgets/app_drawer.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  Map<String, dynamic>? _summaryData;

  @override
  void initState() {
    super.initState();
    _fetchSummary();
  }

  Future<void> _fetchSummary() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final api = ApiService();
    final data = await api.fetchAnalyticsSummary();

    if (mounted) {
      if (data != null) {
        setState(() {
          _summaryData = data;
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage =
              'Failed to load dashboard data.\nPlease try pulling down to refresh.';
          _isLoading = false;
        });
      }
    }
  }

  String _formatDate(String? isoDate) {
    if (isoDate == null) return "—";
    try {
      final dt = DateTime.parse(isoDate).toLocal();
      return DateFormat('MMM dd, yyyy, hh:mm a').format(dt);
    } catch (_) {
      return isoDate;
    }
  }

  Widget _buildTopCard({
    required String title,
    required String value,
    required String subtitle,
    IconData? icon,
    Color? iconColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: (iconColor ?? const Color(0xFFA5C422)).withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(
          color: (iconColor ?? const Color(0xFFA5C422)).withOpacity(0.1),
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF999999),
                    letterSpacing: 0.5,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (icon != null) ...[
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: iconColor?.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: iconColor, size: 18),
                ),
              ],
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF333333),
                ),
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 10,
                  color: Color(0xFF999999),
                  height: 1.2,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTrendChart() {
    final trendList = (_summaryData!['trend'] as List?)?.toList() ?? [];
    if (trendList.isEmpty) return const SizedBox();

    double maxY = 0;
    List<FlSpot> spots = [];
    for (int i = 0; i < trendList.length; i++) {
      double val = (trendList[i]['analyses'] as num).toDouble();
      if (val > maxY) maxY = val;
      spots.add(FlSpot(i.toDouble(), val));
    }

    // Add some padding to maxY
    maxY = maxY <= 0 ? 5 : maxY + (maxY * 0.2);

    return Container(
      height: 300,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: const [
                  Icon(
                    Icons.show_chart_rounded,
                    color: Color(0xFFA5C422),
                    size: 18,
                  ),
                  SizedBox(width: 8),
                  Text(
                    'WEEKLY ANALYSIS TREND',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF777777),
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
              const Text(
                'Last 7 days',
                style: TextStyle(fontSize: 11, color: Color(0xFF999999)),
              ),
            ],
          ),
          const SizedBox(height: 30),
          Expanded(
            child: LineChart(
              LineChartData(
                minX: 0,
                maxX: (trendList.length - 1).toDouble() > 0
                    ? (trendList.length - 1).toDouble()
                    : 1,
                minY: 0,
                maxY: maxY,
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: maxY / 4 == 0 ? 1 : maxY / 4,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey.shade200,
                      strokeWidth: 1,
                      dashArray: [4, 4],
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 22,
                      interval: 1,
                      getTitlesWidget: (value, meta) {
                        int index = value.toInt();
                        if (index >= 0 && index < trendList.length) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Text(
                              trendList[index]['label'].toString(),
                              style: const TextStyle(
                                color: Color(0xFF999999),
                                fontSize: 10,
                              ),
                            ),
                          );
                        }
                        return const SizedBox();
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 28,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          value.toInt().toString(),
                          style: const TextStyle(
                            color: Color(0xFF999999),
                            fontSize: 10,
                          ),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(
                  show: true,
                  border: Border(
                    bottom: BorderSide(color: Colors.grey.shade300, width: 1),
                  ),
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: const Color(0xFFA5C422),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 4,
                          color: Colors.white,
                          strokeWidth: 2.5,
                          strokeColor: const Color(0xFFA5C422),
                        );
                      },
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      color: const Color(0xFFA5C422).withOpacity(0.1),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPieChart() {
    final conditionList = _summaryData!['by_condition'] as List? ?? [];

    // Define a palette for conditions
    final colors = [
      Colors.redAccent,
      Colors.blueAccent,
      const Color(0xFFA5C422),
      Colors.orangeAccent,
      Colors.purpleAccent,
    ];

    List<PieChartSectionData> sections = [];
    if (conditionList.isEmpty) {
      sections.add(
        PieChartSectionData(
          value: 1,
          color: Colors.grey.shade200,
          title: '',
          radius: 30,
        ),
      );
    } else {
      for (int i = 0; i < conditionList.length; i++) {
        final double val = (conditionList[i]['value'] as num).toDouble();
        sections.add(
          PieChartSectionData(
            color: colors[i % colors.length],
            value: val,
            title: '', // Don't show text in slices
            radius: 35,
          ),
        );
      }
    }

    return Container(
      height: 300,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(
                Icons.pie_chart_outline_rounded,
                color: Color(0xFFA5C422),
                size: 18,
              ),
              SizedBox(width: 8),
              Text(
                'BY CONDITION',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF777777),
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const Spacer(),
          SizedBox(
            height: 180,
            child: PieChart(
              PieChartData(
                sectionsSpace: 4,
                centerSpaceRadius: 50,
                sections: sections,
              ),
            ),
          ),
          const Spacer(),
          // Custom Legend
          if (conditionList.isNotEmpty)
            Center(
              child: Wrap(
                spacing: 12,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: conditionList.asMap().entries.map((entry) {
                  return Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: colors[entry.key % colors.length],
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        entry.value['label']?.toString() ?? 'Unanalyzed',
                        style: const TextStyle(
                          fontSize: 10,
                          color: Color(0xFF555555),
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDataTable() {
    final recent = _summaryData!['recent'] as List? ?? [];

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.all(20.0),
            child: Text(
              'RECENT ACTIVITY',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Color(0xFF777777),
                letterSpacing: 0.5,
              ),
            ),
          ),
          const Divider(height: 1, color: Color(0xFFEEEEEE)),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              headingTextStyle: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: Color(0xFF999999),
              ),
              dataTextStyle: const TextStyle(
                fontSize: 12,
                color: Color(0xFF555555),
              ),
              columns: const [
                DataColumn(label: Text('DATE')),
                DataColumn(label: Text('ECG FILE')),
                DataColumn(label: Text('PREDICTION')),
                DataColumn(label: Text('CONFIDENCE')),
                DataColumn(label: Text('REPORT')),
              ],
              rows: recent.map((item) {
                final prediction = item['prediction'] ?? 'Unknown';
                final isNormal =
                    prediction.toString().toLowerCase() == 'normal';

                return DataRow(
                  cells: [
                    DataCell(Text(_formatDate(item['created_at']))),
                    DataCell(Text(item['file_name'] ?? '—')),
                    DataCell(
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: isNormal
                              ? const Color(0xFFA5C422).withOpacity(0.12)
                              : Colors.redAccent.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          prediction.toString().toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isNormal
                                ? const Color(0xFFA5C422)
                                : Colors.redAccent,
                          ),
                        ),
                      ),
                    ),
                    DataCell(
                      Text('${((item['confidence'] ?? 0.0) * 100).toInt()}%'),
                    ),
                    DataCell(
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFA5C422),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'PDF',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
          if (recent.isEmpty)
            const Padding(
              padding: EdgeInsets.all(32.0),
              child: Center(
                child: Text(
                  "No recent data available.",
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F6F8),
      drawer: const AppDrawer(currentRoute: '/dashboard'),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'ECG DIAGNOSIS OVERVIEW',
              style: TextStyle(
                color: Color(0xFF333333),
                fontWeight: FontWeight.bold,
                fontSize: 14,
                letterSpacing: 0.5,
              ),
            ),
            Row(
              children: const [
                Text(
                  'System Status: ',
                  style: TextStyle(color: Color(0xFF999999), fontSize: 11),
                ),
                Text(
                  'Active',
                  style: TextStyle(
                    color: Color(0xFFA5C422),
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Color(0xFF333333)),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchSummary,
        color: const Color(0xFFA5C422),
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: Color(0xFFA5C422)),
              )
            : _errorMessage != null
            ? CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.error_outline_rounded,
                            size: 60,
                            color: Colors.black26,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _errorMessage!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Color(0xFF777777),
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              )
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 24,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Row 1: Top 4 KPIs
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final double width = constraints.maxWidth;
                        final int crossAxisCount = width > 800 ? 4 : 2;
                        final double ratio = width > 800 ? 1.6 : 0.95;

                        return GridView.count(
                          crossAxisCount: crossAxisCount,
                          childAspectRatio: ratio,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          children: [
                            _buildTopCard(
                              title: 'Total ECG Analyses',
                              value:
                                  '${_summaryData!['totals']['total_analyses'] ?? 0}',
                              icon: Icons.monitor_heart_rounded,
                              iconColor: const Color(0xFFA5C422),
                              subtitle: 'All ECG files evaluated by the model.',
                            ),
                            _buildTopCard(
                              title: 'Last Diagnosis',
                              value:
                                  (_summaryData!['totals']['last_diagnosis'] ??
                                          '—')
                                      .toString()
                                      .split(' ')
                                      .first,
                              icon: Icons.health_and_safety_rounded,
                              iconColor: Colors.blueAccent,
                              subtitle: _formatDate(
                                _summaryData!['totals']['last_diagnosis_at'],
                              ),
                            ),
                            _buildTopCard(
                              title: 'Model Accuracy',
                              value:
                                  '${((_summaryData!['totals']['model_accuracy'] ?? 0) * 100).toInt()}%',
                              icon: Icons.check_circle_rounded,
                              iconColor: const Color(0xFFA5C422),
                              subtitle: 'Current reported model performance.',
                            ),
                            _buildTopCard(
                              title: 'Most Frequent',
                              value:
                                  (_summaryData!['totals']['most_frequent_condition'] ??
                                          '—')
                                      .toString()
                                      .split(' ')
                                      .first,
                              icon: Icons.analytics_rounded,
                              iconColor: Colors.orangeAccent,
                              subtitle: 'Most detected across your analyses.',
                            ),
                          ],
                        );
                      },
                    ),

                    const SizedBox(height: 16),

                    // Row 2: Charts
                    LayoutBuilder(
                      builder: (context, constraints) {
                        if (constraints.maxWidth > 800) {
                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(flex: 2, child: _buildTrendChart()),
                              const SizedBox(width: 16),
                              Expanded(flex: 1, child: _buildPieChart()),
                            ],
                          );
                        } else {
                          return Column(
                            children: [
                              _buildTrendChart(),
                              const SizedBox(height: 16),
                              _buildPieChart(),
                            ],
                          );
                        }
                      },
                    ),

                    const SizedBox(height: 16),

                    // Average Confidence Card
                    _buildTopCard(
                      title: 'Average Confidence',
                      value:
                          '${((_summaryData!['totals']['avg_confidence'] ?? 0) * 100).toInt()}%',
                      icon: Icons.bar_chart_rounded,
                      iconColor: Colors.purpleAccent,
                      subtitle: 'Mean model confidence across your analyses.',
                    ),

                    const SizedBox(height: 16),

                    // Recent Activity Table
                    _buildDataTable(),
                  ],
                ),
              ),
      ),
    );
  }
}

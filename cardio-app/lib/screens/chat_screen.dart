import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api_service.dart';
import '../widgets/app_drawer.dart';

class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;

  ChatMessage({required this.text, required this.isUser, required this.timestamp});
}

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ApiService _api = ApiService();
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  final List<ChatMessage> _messages = [];
  bool _isTyping = false;

  final String _welcomeText = "Hello! I'm DeepGuard's AI Assistant 🩺\n\nI'm here to help you understand your ECG results, explain cardiac conditions, and guide you through the platform.\n\nHow can I help you today?";

  final List<Map<String, dynamic>> _suggestions = [
    {'icon': Icons.monitor_heart_rounded, 'text': 'What is Atrial Fibrillation?'},
    {'icon': Icons.analytics_rounded, 'text': 'How does the ECG analysis work?'},
    {'icon': Icons.bolt_rounded, 'text': 'What models does DeepGuard use?'},
    {'icon': Icons.security_rounded, 'text': 'What should I do if MI is detected?'},
  ];

  @override
  void initState() {
    super.initState();
    _messages.add(ChatMessage(text: _welcomeText, isUser: false, timestamp: DateTime.now()));
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage(String text) async {
    final query = text.trim();
    if (query.isEmpty) return;

    _textController.clear();

    setState(() {
      _messages.add(ChatMessage(text: query, isUser: true, timestamp: DateTime.now()));
      _isTyping = true;
    });
    
    _scrollToBottom();

    final response = await _api.sendChatMessage(question: query);

    if (mounted) {
      setState(() {
        _isTyping = false;
        _messages.add(ChatMessage(
          text: response ?? "Sorry, there was an error processing your request.",
          isUser: false,
          timestamp: DateTime.now()
        ));
      });
      _scrollToBottom();
    }
  }

  Widget _buildMessageBubble(ChatMessage msg) {
    final isMe = msg.isUser;
    final timeStr = DateFormat('hh:mm a').format(msg.timestamp);

    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          if (!isMe)
            Container(
              width: 32,
              height: 32,
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F4E8),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFD4E89A), width: 2),
              ),
              child: const Center(child: Icon(Icons.smart_toy_rounded, size: 16, color: Color(0xFFA5C422))),
            ),
          
          Flexible(
            child: Column(
              crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isMe ? const Color(0xFFA5C422) : Colors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: isMe ? const Radius.circular(18) : const Radius.circular(4),
                      bottomRight: isMe ? const Radius.circular(4) : const Radius.circular(18),
                    ),
                    border: isMe ? null : Border.all(color: Colors.grey.shade200),
                    boxShadow: [
                      BoxShadow(
                        color: isMe ? const Color(0xFFA5C422).withOpacity(0.2) : Colors.black.withOpacity(0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 4)
                      )
                    ]
                  ),
                  child: Text(
                    msg.text,
                    style: TextStyle(
                      fontSize: 14,
                      color: isMe ? Colors.white : Colors.black87,
                      height: 1.5,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(timeStr, style: const TextStyle(fontSize: 10, color: Colors.grey)),
              ],
            ),
          ),
          
          if (isMe)
            Container(
              width: 32,
              height: 32,
              margin: const EdgeInsets.only(left: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFA5C422),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF8EA31D), width: 2),
              ),
              child: const Center(child: Icon(Icons.person_rounded, size: 16, color: Colors.white)),
            ),
        ],
      ),
    );
  }

  Widget _buildSuggestions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(bottom: 12, top: 8),
          child: Text('SUGGESTED QUESTIONS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.5)),
        ),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _suggestions.map((s) {
            return InkWell(
              onTap: () => _sendMessage(s['text']),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(s['icon'], size: 14, color: const Color(0xFFA5C422)),
                    const SizedBox(width: 8),
                    Text(s['text'], style: const TextStyle(fontSize: 12, color: Colors.black87, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      drawer: const AppDrawer(currentRoute: '/chat'),
      appBar: AppBar(
        title: Column(
           crossAxisAlignment: CrossAxisAlignment.start,
           children: [
              Row(
                 children: [
                    const Text('DeepGuard AI Assistant', style: TextStyle(color: Color(0xFF333333), fontWeight: FontWeight.bold, fontSize: 14)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF0F8D6),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFD4E89A))
                      ),
                      child: Row(
                         children: [
                           Container(width: 5, height: 5, decoration: const BoxDecoration(color: Color(0xFFA5C422), shape: BoxShape.circle)),
                           const SizedBox(width: 4),
                           const Text('ONLINE', style: TextStyle(fontSize: 9, color: Color(0xFF6B9A10), fontWeight: FontWeight.bold)),
                         ],
                      ),
                    )
                 ],
              ),
              const Text('Cardiac AI • Powered by DeepGuard', style: TextStyle(color: Color(0xFF999999), fontSize: 11)),
           ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Color(0xFF333333)),
        actions: [
          Center(
            child: Padding(
              padding: const EdgeInsets.only(right: 16.0),
              child: Row(
                children: const [
                  Icon(Icons.auto_awesome_rounded, size: 14, color: Color(0xFFA5C422)),
                  SizedBox(width: 4),
                  Text('RAG • Groq', style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w500)),
                ],
              ),
            ),
          )
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(20),
                itemCount: _messages.length + (_isTyping ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _messages.length && _isTyping) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 24.0),
                      child: Row(
                        children: [
                          Container(
                            width: 32,
                            height: 32,
                            margin: const EdgeInsets.only(right: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF0F4E8),
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFFD4E89A), width: 2),
                            ),
                            child: const Center(child: Icon(Icons.smart_toy_rounded, size: 16, color: Color(0xFFA5C422))),
                          ),
                          Container(
                             padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                             decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: const BorderRadius.only(topLeft: Radius.circular(18), topRight: Radius.circular(18), bottomRight: Radius.circular(18), bottomLeft: Radius.circular(4)),
                                border: Border.all(color: Colors.grey.shade200),
                             ),
                             child: Row(
                               mainAxisSize: MainAxisSize.min,
                               children: [
                                 Container(width: 6, height: 6, decoration: BoxDecoration(color: const Color(0xFFA5C422).withOpacity(0.5), shape: BoxShape.circle)),
                                 const SizedBox(width: 4),
                                 Container(width: 6, height: 6, decoration: const BoxDecoration(color: Color(0xFFA5C422), shape: BoxShape.circle)),
                                 const SizedBox(width: 4),
                                 Container(width: 6, height: 6, decoration: BoxDecoration(color: const Color(0xFFA5C422).withOpacity(0.5), shape: BoxShape.circle)),
                               ],
                             ),
                          )
                        ],
                      ),
                    );
                  }
                  
                  final msg = _messages[index];
                  
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildMessageBubble(msg),
                      if (index == 0 && _messages.length == 1 && !_isTyping)
                        _buildSuggestions()
                    ],
                  );
                },
              ),
            ),
            
            // Warning Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              color: const Color(0xFFFFFDE7),
              child: Row(
                children: const [
                  Icon(Icons.info_outline_rounded, size: 14, color: Colors.amber),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text('AI responses are for informational purposes only. Always consult a physician.', style: TextStyle(fontSize: 10, color: Color(0xFFB8860B))),
                  ),
                ],
              ),
            ),
            
            // Input Region
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                   BoxShadow(color: Colors.black.withOpacity(0.05), offset: const Offset(0, -4), blurRadius: 20)
                ]
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      minLines: 1,
                      maxLines: 4,
                      textInputAction: TextInputAction.send,
                      onSubmitted: _sendMessage,
                      decoration: InputDecoration(
                        hintText: 'Ask about ECG results...',
                        hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: const BorderSide(color: Color(0xFFA5C422), width: 1.5),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFA5C422),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(color: const Color(0xFFA5C422).withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 4))
                      ]
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                      onPressed: () => _sendMessage(_textController.text),
                    ),
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

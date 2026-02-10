import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AnimatedBackground from '../../components/AnimatedBackground';
import { generateAIResponse } from '../../services/ai-service';
import type { RAGSource } from '../../types/chat';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sources?: RAGSource[];
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Chat screen
// ---------------------------------------------------------------------------

export default function ChatScreen() {
  const { id, make, model, year } = useLocalSearchParams<{
    id: string;
    make: string;
    model: string;
    year: string;
  }>();

  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm your ${make} ${model} ${year} AI assistant powered by Gear AI. I can help you with:\n\n- Owner's manual questions\n- Maintenance schedules and specs\n- Recall and safety information\n- Diagnostics and troubleshooting\n\nWhat would you like to know?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isResponding) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    // Add user message and a placeholder loading message
    const loadingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        id: loadingId,
        text: '',
        isUser: false,
        timestamp: new Date(),
        isLoading: true,
      },
    ]);
    setInputText('');
    setIsResponding(true);

    // Scroll to bottom
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Call the AI service with full vehicle context for RAG
      const response = await generateAIResponse({
        session_id: id || 'default',
        message: text,
        include_rag: true,
        context_type: 'manual',
        // Vehicle context (picked up by extractVehicleFromRequest)
        vehicle_year: parseInt(year || '0', 10),
        vehicle_make: make || '',
        vehicle_model: model || '',
      } as any);

      // Replace loading message with actual response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                text: response.content,
                isLoading: false,
                sources: response.sources,
              }
            : msg
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                text: 'Sorry, I encountered an error processing your request. Please try again.',
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsResponding(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  // ------- Sub-components -------

  const SourcePill = ({ source }: { source: RAGSource }) => (
    <View style={styles.sourcePill}>
      <Ionicons name="book-outline" size={10} color="#a4b8ff" />
      <Text style={styles.sourcePillText} numberOfLines={1}>
        {source.section_title || 'Manual'} {source.page_number ? `p.${source.page_number}` : ''}
      </Text>
    </View>
  );

  const MessageBubble = ({ message }: { message: Message }) => (
    <View style={[styles.messageContainer, message.isUser ? styles.userMessage : styles.aiMessage]}>
      <BlurView intensity={15} tint="light" style={styles.messageBlur}>
        <LinearGradient
          colors={
            message.isUser
              ? ['rgba(103,126,234,0.8)', 'rgba(118,75,162,0.8)']
              : ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']
          }
          style={styles.messageGradient}
        >
          {message.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="rgba(255,255,255,0.7)" size="small" />
              <Text style={styles.loadingText}>Searching manual...</Text>
            </View>
          ) : (
            <>
              <Text style={[styles.messageText, message.isUser ? styles.userText : styles.aiText]}>
                {message.text}
              </Text>
              {/* RAG source citations */}
              {message.sources && message.sources.length > 0 && (
                <View style={styles.sourcesContainer}>
                  <Text style={styles.sourcesLabel}>Sources:</Text>
                  <View style={styles.sourcePills}>
                    {message.sources.map((source, i) => (
                      <SourcePill key={i} source={source} />
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </LinearGradient>
      </BlurView>
    </View>
  );

  // ------- Render -------

  return (
    <View style={styles.container}>
      <AnimatedBackground />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {make} {model} {year}
          </Text>
          <Text style={styles.headerSubtitle}>RAG-Powered AI Assistant</Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <View style={{ height: 10 }} />
        </ScrollView>

        <View style={styles.inputContainer}>
          <BlurView intensity={20} tint="light" style={styles.inputBlur}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about your vehicle..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                editable={!isResponding}
              />
              <TouchableOpacity
                style={[styles.sendButton, isResponding && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={isResponding}
              >
                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.sendGradient}>
                  <Ionicons name="send" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: 'white' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  messagesContainer: { flex: 1, paddingHorizontal: 16 },
  messageContainer: { marginBottom: 12, maxWidth: '80%' },
  userMessage: { alignSelf: 'flex-end' },
  aiMessage: { alignSelf: 'flex-start' },
  messageBlur: { borderRadius: 16, overflow: 'hidden' },
  messageGradient: { padding: 12, borderRadius: 16 },
  messageText: { fontSize: 15, lineHeight: 21 },
  userText: { color: 'white' },
  aiText: { color: 'white' },

  // Loading state
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },

  // Sources
  sourcesContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  sourcesLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  sourcePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102,126,234,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  sourcePillText: { color: '#a4b8ff', fontSize: 11, fontWeight: '500', maxWidth: 150 },

  // Input
  inputContainer: { padding: 16, paddingBottom: 30 },
  inputBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12 },
  textInput: { flex: 1, color: 'white', fontSize: 16, maxHeight: 100, paddingVertical: 8 },
  sendButton: { marginLeft: 12 },
  sendButtonDisabled: { opacity: 0.5 },
  sendGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

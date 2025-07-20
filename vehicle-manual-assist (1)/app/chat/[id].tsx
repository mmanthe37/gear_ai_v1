import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AnimatedBackground from '../../components/AnimatedBackground';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const { id, make, model, year } = useLocalSearchParams<{
    id: string;
    make: string;
    model: string;
    year: string;
  }>();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm your ${make} ${model} ${year} AI assistant. I can help you with maintenance schedules, troubleshooting, owner's manual questions, and more. What would you like to know?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        isUser: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputText('');
      
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: getAIResponse(inputText),
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const getAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('oil')) {
      return `For your ${make} ${model} ${year}, I recommend changing the oil every 5,000-7,500 miles with synthetic oil. Check your owner's manual for the exact specification.`;
    }
    if (lowerInput.includes('maintenance')) {
      return `Your ${make} ${model} maintenance schedule includes: Oil changes every 5,000-7,500 miles, tire rotation every 5,000 miles, and brake inspection every 12,000 miles.`;
    }
    if (lowerInput.includes('problem') || lowerInput.includes('issue')) {
      return `I can help diagnose issues with your ${make} ${model}. Can you describe the specific symptoms you're experiencing?`;
    }
    return `I understand you're asking about your ${make} ${model} ${year}. Could you provide more specific details so I can give you the most accurate information?`;
  };

  const MessageBubble = ({ message }: { message: Message }) => (
    <View style={[styles.messageContainer, message.isUser ? styles.userMessage : styles.aiMessage]}>
      <BlurView intensity={15} tint="light" style={styles.messageBlur}>
        <LinearGradient
          colors={message.isUser ? 
            ['rgba(103, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)'] :
            ['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.1)']
          }
          style={styles.messageGradient}
        >
          <Text style={[styles.messageText, message.isUser ? styles.userText : styles.aiText]}>
            {message.text}
          </Text>
        </LinearGradient>
      </BlurView>
    </View>
  );

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{make} {model} {year}</Text>
          <Text style={styles.headerSubtitle}>AI Assistant</Text>
        </View>
        
        <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
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
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.sendGradient}
                >
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageBlur: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  messageGradient: {
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: 'white',
  },
  inputContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  inputBlur: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
  },
  textInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 12,
  },
  sendGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
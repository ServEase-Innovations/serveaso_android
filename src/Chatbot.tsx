import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Mock user data
const mockUser = {
  role: 'CUSTOMER',
  customerDetails: {
    customerId: 123,
    firstName: 'John',
    lastName: 'Doe',
    currentLocation: 'New York',
  },
};

const generalFaqData = [
  { question: 'What services do you offer?', answer: 'We offer services for Cooks, Maids, and Nannies.' },
  { question: 'How do I book a service?', answer: 'You can book a service by selecting a provider and scheduling a time.' },
  { question: 'Are the service providers verified?', answer: 'Yes, all our service providers go through a verification process.' },
  { question: 'Can I cancel a booking?', answer: 'Yes, you can cancel a booking from your profile under "My Bookings".' },
  { question: 'How do I contact customer support?', answer: 'You can reach out to our support team via chat or email.' },
];

const customerFaqData = [
  { question: 'How do I track my booking?', answer: 'You can track your booking status in the "My Bookings" section.' },
  { question: 'Can I reschedule my service?', answer: 'Yes, you can reschedule your service from the booking details page.' },
  { question: 'How do I make a payment?', answer: 'Payments can be made via credit card, debit card, or UPI.' },
];

interface ChatbotProps {
  open: boolean;
  onClose: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ open, onClose }) => {
  const user = mockUser;
  const customerId = user?.customerDetails?.customerId || null;
  const role = user?.role;
  const faqData = role === 'CUSTOMER' ? [...generalFaqData, ...customerFaqData] : generalFaqData;

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: 'Namaste! Welcome to ServEase. How can we assist you today?', sender: 'bot' },
  ]);
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation and position values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const positionAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Pan responder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: positionAnim.x, dy: positionAnim.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        positionAnim.extractOffset();
      },
    })
  ).current;

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
    
    if (isMinimized && messages.length > 1) {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setIsMinimized(false);
      setUnreadCount(0);
    }
  }, [open]);

  const handleQuestionClick = (faq: any) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { text: faq.question, sender: 'user' },
      { text: faq.answer, sender: 'bot' },
    ]);
  };

  const handleSendMessage = () => {
    if (inputText.trim() !== '') {
      setMessages((prevMessages) => [...prevMessages, { text: inputText, sender: 'user' }]);
      setInputText('');
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      setUnreadCount(0);
    }
  };

  if (!open && !isMinimized) return null;

  return (
    <>
      {/* Minimized Chat Button */}
      {isMinimized && (
        <Animated.View
          style={[
            styles.minimizedButton,
            {
              transform: [
                { translateX: positionAnim.x },
                { translateY: positionAnim.y },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity onPress={toggleMinimize} style={styles.minimizedButtonContent}>
            <Icon name="chat" size={28} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Chat Container */}
      {open && !isMinimized && (
        <Animated.View
          style={[
            styles.chatContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateX: positionAnim.x },
                { translateY: positionAnim.y },
                { scale: scaleAnim },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.chatContent}>
            {/* Header Section */}
            <View style={styles.header}>
              {chatOpen && (
                <TouchableOpacity onPress={() => setChatOpen(false)} style={styles.backButton}>
                  <Icon name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
              )}
              <Text style={styles.headerText}>Chat Support</Text>
              <View style={styles.headerRightButtons}>
                <TouchableOpacity onPress={toggleMinimize} style={styles.minimizeButton}>
                  <Icon name="chevron-down" size={24} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages and FAQ Section */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map((msg, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageBubble,
                    msg.sender === 'user' ? styles.userMessage : styles.botMessage,
                  ]}
                >
                  <Text style={msg.sender === 'user' ? styles.userMessageText : styles.botMessageText}>
                    {msg.text}
                  </Text>
                </View>
              ))}

              {!chatOpen &&
                faqData.map((faq, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.faqButton}
                    onPress={() => handleQuestionClick(faq)}
                  >
                    <Text style={styles.faqButtonText}>{faq.question}</Text>
                  </TouchableOpacity>
                ))}

              {!chatOpen && (
                <TouchableOpacity
                  style={styles.chatButton}
                  onPress={() => setChatOpen(true)}
                >
                  <Text style={styles.chatButtonText}>Chat with Assistant</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Chat Input Section */}
            {chatOpen && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Type your question..."
                  placeholderTextColor="#999"
                  onSubmitEditing={handleSendMessage}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                  <Icon name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  minimizedButton: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    zIndex: 1001,
  },
  minimizedButtonContent: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4285f4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: Dimensions.get('window').width * 0.85,
    maxWidth: 400,
    height: Dimensions.get('window').height * 0.7,
    zIndex: 1000,
  },
  chatContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  backButton: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minimizeButton: {
    marginRight: 15,
  },
  closeButton: {
    marginLeft: 0,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  messagesContent: {
    paddingBottom: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  botMessage: {
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  userMessage: {
    backgroundColor: '#4285f4',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  botMessageText: {
    color: '#333',
    fontSize: 14,
  },
  userMessageText: {
    color: '#fff',
    fontSize: 14,
  },
  faqButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    width: '100%',
  },
  faqButtonText: {
    fontSize: 14,
    color: '#333',
  },
  chatButton: {
    backgroundColor: '#4285f4',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#4285f4',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Chatbot;
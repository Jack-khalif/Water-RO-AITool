import {
  Box,
  VStack,
  Input,
  Button,
  Text,
  useToast,
  IconButton,
  HStack,
  Avatar,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa';

interface Message {
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export default function EngineerChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi! I'm your RO system design assistant. Ask me anything about water treatment, system design, or proposal generation!",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      text: input,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Import the RAG service
      const { askEngineerQuestion } = await import('../services/ragService');
      
      // Show typing indicator
      setIsLoading(true);
      
      // Use the RAG service to get a contextual answer
      const result = await askEngineerQuestion(input);
      
      // Create bot message with the answer
      const botMessage = {
        text: result.answer,
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get response',
        status: 'error',
        duration: 3000,
      });
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <IconButton
        aria-label="Open chat"
        icon={<FaRobot />}
        position="fixed"
        bottom="4"
        right="4"
        size="lg"
        colorScheme="blue"
        onClick={onOpen}
        borderRadius="full"
        boxShadow="lg"
      />

      <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            RO System Design Assistant
          </DrawerHeader>

          <DrawerBody p={0}>
            <VStack h="full" spacing={0}>
              <Box
                flex="1"
                w="full"
                p={4}
                overflowY="auto"
                bg="gray.50"
              >
                <VStack spacing={4} align="stretch">
                  {messages.map((msg, idx) => (
                    <HStack
                      key={idx}
                      alignSelf={msg.isBot ? 'flex-start' : 'flex-end'}
                      spacing={2}
                    >
                      {msg.isBot && (
                        <Avatar
                          icon={<FaRobot />}
                          bg="blue.500"
                          color="white"
                          size="sm"
                        />
                      )}
                      <Box
                        bg={msg.isBot ? 'white' : 'blue.500'}
                        color={msg.isBot ? 'black' : 'white'}
                        px={4}
                        py={2}
                        borderRadius="lg"
                        maxW="80%"
                        boxShadow="sm"
                      >
                        <Text fontSize="sm">{msg.text}</Text>
                        <Text fontSize="xs" color={msg.isBot ? 'gray.500' : 'blue.100'}>
                          {msg.timestamp.toLocaleTimeString()}
                        </Text>
                      </Box>
                      {!msg.isBot && (
                        <Avatar
                          icon={<FaUser />}
                          bg="blue.500"
                          color="white"
                          size="sm"
                        />
                      )}
                    </HStack>
                  ))}
                  <div ref={messagesEndRef} />
                </VStack>
              </Box>

              <Box p={4} w="full" bg="white" borderTopWidth="1px">
                <HStack>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask anything about RO systems..."
                    disabled={isLoading}
                  />
                  <IconButton
                    aria-label="Send message"
                    icon={<FaPaperPlane />}
                    onClick={handleSend}
                    isLoading={isLoading}
                    colorScheme="blue"
                  />
                </HStack>
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

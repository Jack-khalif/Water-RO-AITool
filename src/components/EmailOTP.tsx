import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  PinInput,
  PinInputField,
  Text,
  Button,
  useToast,
} from '@chakra-ui/react';

interface EmailOTPProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerify: () => void;
}

export default function EmailOTP({ isOpen, onClose, email, onVerify }: EmailOTPProps) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const toast = useToast();

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      // TODO: Add actual OTP verification logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating API call
      
      if (otp === '123456') { // For testing purposes
        toast({
          title: 'Email verified successfully',
          status: 'success',
          duration: 3000,
        });
        onVerify();
        onClose();
        window.location.href = '/dashboard';
      } else {
        toast({
          title: 'Invalid OTP',
          description: 'Please check the code and try again',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      // TODO: Add actual resend OTP logic here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating API call
      
      toast({
        title: 'OTP resent successfully',
        description: 'Please check your email',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Failed to resend OTP',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Email Verification</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            <Text>
              Please enter the 6-digit code sent to <strong>{email}</strong>
            </Text>
            <HStack>
              <PinInput
                type="number"
                value={otp}
                onChange={setOtp}
                otp
                size="lg"
              >
                {[...Array(6)].map((_, i) => (
                  <PinInputField key={i} />
                ))}
              </PinInput>
            </HStack>
            <Button
              colorScheme="blue"
              width="full"
              onClick={handleVerify}
              isLoading={isVerifying}
            >
              Verify
            </Button>
            <Button
              variant="ghost"
              width="full"
              onClick={handleResend}
            >
              Resend Code
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

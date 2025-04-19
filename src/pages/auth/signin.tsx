import React, { useState } from 'react';
import { Box, Button, Input, VStack, Text, useToast } from '@chakra-ui/react';
import { signIn } from 'next-auth/react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const toast = useToast();

  const handleSendOtp = async () => {
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setIsOtpSent(true);
        toast({
          title: 'OTP Sent',
          description: 'Please check your email for the verification code',
          status: 'success',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send OTP',
        status: 'error',
      });
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const result = await signIn('credentials', {
        email,
        otp,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: 'Error',
          description: 'Invalid OTP',
          status: 'error',
        });
      } else {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Verification failed',
        status: 'error',
      });
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={20} p={6} borderWidth={1} borderRadius="lg">
      <VStack spacing={4}>
        <Text fontSize="2xl" fontWeight="bold">
          Sign In
        </Text>
        {!isOtpSent ? (
          <>
            <Input
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button colorScheme="blue" onClick={handleSendOtp} width="full">
              Send OTP
            </Button>
          </>
        ) : (
          <>
            <Input
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <Button colorScheme="green" onClick={handleVerifyOtp} width="full">
              Verify OTP
            </Button>
          </>
        )}
      </VStack>
    </Box>
  );
}

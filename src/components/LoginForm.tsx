import {
  VStack, FormControl, FormLabel, Input, Button, Text,
  useToast, Checkbox, InputGroup, InputRightElement, IconButton
} from '@chakra-ui/react';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface LoginFormProps {
  onSuccess: (email: string) => void;
  onClose: () => void;
}

export default function LoginForm({ onSuccess, onClose }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn('email', { email, redirect: true, callbackUrl: '/dashboard' });

      toast({
        title: 'Check your email',
        description: 'A magic link has been sent to your email.',
        status: 'info',
        duration: 4000,
      });

      onSuccess(email);
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: 'Could not send login link. Try again.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <Input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="Enter your password"
/>
        </FormControl>

        <Checkbox
          isChecked={rememberDevice}
          onChange={(e) => setRememberDevice(e.target.checked)}
        >
          Remember this device for 30 days
        </Checkbox>

        <Button type="submit" colorScheme="blue" size="lg" isLoading={isLoading}>
          Login
        </Button>
      </VStack>
    </form>
  );
}

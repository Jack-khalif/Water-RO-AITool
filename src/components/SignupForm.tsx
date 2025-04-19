import {
  VStack, FormControl, FormLabel, Input, Button, useToast,
  InputGroup, InputRightElement, IconButton, Text
} from '@chakra-ui/react';
import { useState } from 'react';
import { addUser, findUserByEmail } from '../utils/userDb';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface SignupFormProps {
  onSuccess: (email: string) => void;
  onClose: () => void;
}

export default function SignupForm({ onSuccess, onClose }: SignupFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (findUserByEmail(email)) {
        throw new Error('Email already registered');
      }

      const user = addUser(name, email, password);

      toast({
        title: 'Account Created',
        description: `Welcome to HydroFlow, ${user.name}!`,
        status: 'success',
        duration: 3000,
      });

      onSuccess(email);
    } catch (error) {
      toast({
        title: 'Signup Failed',
        description: error instanceof Error ? error.message : 'Please try again',
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
          <FormLabel>Full Name</FormLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <InputGroup>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
            />
            <InputRightElement>
              <IconButton
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                variant="ghost"
                onClick={() => setShowPassword(!showPassword)}
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Confirm Password</FormLabel>
          <InputGroup>
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
            <InputRightElement>
              <IconButton
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                icon={showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                variant="ghost"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <Text fontSize="sm" color="gray.600">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </Text>

        <Button type="submit" colorScheme="blue" size="lg" isLoading={isLoading}>
          Create Account
        </Button>
      </VStack>
    </form>
  );
}

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  VStack,
  Text,
  Button,
  Icon,
  useToast,
  Progress,
} from '@chakra-ui/react';
import { FiUpload, FiFile } from 'react-icons/fi';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFileTypes?: string[];
  maxSize?: number;
}

export default function FileUpload({
  onFileSelect,
  acceptedFileTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
  maxSize = 10 * 1024 * 1024, // 10MB
}: FileUploadProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const toast = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          onFileSelect(file);
          toast({
            title: 'File uploaded successfully',
            status: 'success',
            duration: 3000,
          });
        }
      }, 200);
    }
  }, [onFileSelect, toast]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({
      ...acc,
      [type]: []
    }), {}),
    maxSize,
    multiple: false,
  });

  return (
    <VStack spacing={4} width="100%">
      <Box
        {...getRootProps()}
        width="100%"
        p={6}
        border="2px dashed"
        borderColor={isDragActive ? 'blue.400' : 'gray.200'}
        borderRadius="lg"
        textAlign="center"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ borderColor: 'blue.400' }}
      >
        <input {...getInputProps()} />
        <Icon as={FiUpload} w={8} h={8} color="gray.400" mb={2} />
        {isDragActive ? (
          <Text>Drop the file here</Text>
        ) : (
          <VStack spacing={1}>
            <Text>Drag and drop your file here, or click to select</Text>
            <Text fontSize="sm" color="gray.500">
              Supported formats: {acceptedFileTypes.join(', ')}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Max size: {maxSize / (1024 * 1024)}MB
            </Text>
          </VStack>
        )}
      </Box>

      {acceptedFiles.length > 0 && (
        <VStack width="100%" spacing={2}>
          <Box
            p={3}
            bg="gray.50"
            borderRadius="md"
            width="100%"
            display="flex"
            alignItems="center"
          >
            <Icon as={FiFile} mr={2} />
            <Text fontSize="sm" isTruncated>
              {acceptedFiles[0].name}
            </Text>
          </Box>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Progress
              width="100%"
              value={uploadProgress}
              size="sm"
              colorScheme="blue"
            />
          )}
        </VStack>
      )}

      <Button
        colorScheme="blue"
        onClick={() => document.querySelector('input')?.click()}
        width="100%"
      >
        Select File
      </Button>
    </VStack>
  );
}

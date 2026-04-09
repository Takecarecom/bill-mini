'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ReceiptScannerProps {
  onScanComplete: (data: {
    merchantName?: string;
    amount?: number;
    date?: string;
    category?: string;
    description?: string;
    type?: string;
    receiptImage?: string;
  }) => void;
  onError?: (message: string) => void;
}

export function ReceiptScanner({ onScanComplete, onError }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload and scan
    setIsScanning(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/expenses/scan-receipt', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        onError?.(result.error || 'ไม่สามารถสแกนใบเสร็จได้');
        return;
      }

      onScanComplete({
        ...result.data,
        receiptImage: result.receiptImage,
      });
    } catch {
      onError?.('เกิดข้อผิดพลาดในการสแกนใบเสร็จ');
    } finally {
      setIsScanning(false);
    }
  }, [onScanComplete, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: isScanning,
  });

  const clearPreview = () => {
    setPreview(null);
  };

  return (
    <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm overflow-hidden">
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <Camera className="h-4 w-4" />
          สแกนใบเสร็จ
        </h3>

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Receipt preview"
              className="w-full max-h-64 object-contain rounded-lg"
            />
            {isScanning && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                  <span className="text-sm text-white">กำลังอ่านใบเสร็จ...</span>
                </div>
              </div>
            )}
            {!isScanning && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={clearPreview}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              {isDragActive ? (
                <>
                  <ImageIcon className="h-10 w-10 text-blue-400" />
                  <p className="text-blue-400">วางรูปที่นี่...</p>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-500" />
                  <div>
                    <p className="text-gray-300 text-sm">
                      ลากวางรูปใบเสร็จ หรือคลิกเพื่อเลือก
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      รองรับ JPG, PNG, WebP
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

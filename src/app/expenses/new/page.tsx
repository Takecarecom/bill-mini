'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReceiptScanner } from '@/components/receipt-scanner';
import { ExpenseForm } from '@/components/expense-form';
import type { CreateExpenseData } from '@/schemas/expense';

export default function NewExpensePage() {
  const router = useRouter();
  const [scannedData, setScannedData] = useState<Partial<CreateExpenseData> | null>(null);
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleScanComplete = (data: {
    merchantName?: string;
    amount?: number;
    date?: string;
    category?: string;
    description?: string;
    type?: string;
    receiptImage?: string;
  }) => {
    setScannedData({
      merchantName: data.merchantName || '',
      amount: data.amount || undefined,
      date: data.date || new Date().toISOString().split('T')[0],
      category: data.category || '',
      description: data.description || '',
      type: (data.type as 'income' | 'expense') || 'expense',
    });
    if (data.receiptImage) {
      setReceiptImage(data.receiptImage);
    }
    setError(null);
  };

  const handleSubmit = async (data: CreateExpenseData) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'ไม่สามารถบันทึกข้อมูลได้');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/expenses'), 1500);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-gradient-to-br from-black via-gray-900 to-black text-white p-6 pt-2 min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">บันทึกสำเร็จ!</h2>
          <p className="text-gray-400">กำลังกลับไปหน้ารายการ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-black text-white p-6 pt-2">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/expenses">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-1" />
              กลับ
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            เพิ่มรายการใหม่
          </h1>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Receipt Scanner */}
        <div className="mb-6">
          <ReceiptScanner
            onScanComplete={handleScanComplete}
            onError={(msg) => setError(msg)}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 border-t border-gray-800" />
          <span className="text-gray-500 text-sm">หรือกรอกข้อมูลเอง</span>
          <div className="flex-1 border-t border-gray-800" />
        </div>

        {/* Form */}
        <ExpenseForm
          initialData={scannedData || undefined}
          receiptImage={receiptImage}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

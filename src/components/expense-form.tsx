'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createExpenseSchema, type CreateExpenseData } from '@/schemas/expense';
import { getCategoriesByType, type CategoryType } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ExpenseFormProps {
  initialData?: Partial<CreateExpenseData>;
  receiptImage?: string;
  onSubmit: (data: CreateExpenseData) => Promise<void>;
  isLoading?: boolean;
}

export function ExpenseForm({ initialData, receiptImage, onSubmit, isLoading }: ExpenseFormProps) {
  const [selectedType, setSelectedType] = useState<CategoryType>(
    (initialData?.type as CategoryType) || 'expense'
  );

  const form = useForm<CreateExpenseData>({
    resolver: zodResolver(createExpenseSchema),
    mode: 'onChange',
    defaultValues: {
      type: 'expense',
      category: '',
      amount: undefined,
      description: '',
      merchantName: '',
      date: new Date().toISOString().split('T')[0],
      receiptImage: receiptImage || '',
      ...initialData,
    },
  });

  const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = form;

  const currentType = watch('type');

  useEffect(() => {
    if (currentType !== selectedType) {
      setSelectedType(currentType as CategoryType);
      setValue('category', '');
    }
  }, [currentType, selectedType, setValue]);

  // Update form when initialData changes (from OCR scan)
  useEffect(() => {
    if (initialData) {
      if (initialData.type) {
        setValue('type', initialData.type);
        setSelectedType(initialData.type as CategoryType);
      }
      if (initialData.category) setValue('category', initialData.category);
      if (initialData.amount) setValue('amount', initialData.amount);
      if (initialData.description) setValue('description', initialData.description);
      if (initialData.merchantName) setValue('merchantName', initialData.merchantName);
      if (initialData.date) setValue('date', initialData.date);
      trigger();
    }
  }, [initialData, setValue, trigger]);

  useEffect(() => {
    if (receiptImage) {
      setValue('receiptImage', receiptImage);
    }
  }, [receiptImage, setValue]);

  const categories = getCategoriesByType(selectedType);

  const handleFormSubmit = async (data: CreateExpenseData) => {
    await onSubmit(data);
  };

  return (
    <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
        {/* Type */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setValue('type', 'expense')}
            className={`p-3 rounded-lg border text-sm font-medium transition-all ${
              currentType === 'expense'
                ? 'border-red-500 bg-red-500/10 text-red-400'
                : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
            }`}
          >
            รายจ่าย
          </button>
          <button
            type="button"
            onClick={() => setValue('type', 'income')}
            className={`p-3 rounded-lg border text-sm font-medium transition-all ${
              currentType === 'income'
                ? 'border-green-500 bg-green-500/10 text-green-400'
                : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
            }`}
          >
            รายรับ
          </button>
        </div>
        <input type="hidden" {...register('type')} />
        {errors.type && <p className="text-red-400 text-xs">{errors.type.message}</p>}

        {/* Amount */}
        <div>
          <Label className="text-gray-300 text-sm">จำนวนเงิน (บาท)</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            className="bg-gray-800 border-gray-700 text-white mt-1 text-lg"
            {...register('amount', { valueAsNumber: true })}
          />
          {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
        </div>

        {/* Category */}
        <div>
          <Label className="text-gray-300 text-sm">หมวดหมู่</Label>
          <Select
            value={watch('category')}
            onValueChange={(val) => {
              setValue('category', val);
              trigger('category');
            }}
          >
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
              <SelectValue placeholder="เลือกหมวดหมู่" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {categories.map((cat) => (
                <SelectItem key={cat.key} value={cat.key} className="text-white hover:bg-gray-700">
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>}
        </div>

        {/* Date */}
        <div>
          <Label className="text-gray-300 text-sm">วันที่</Label>
          <Input
            type="date"
            className="bg-gray-800 border-gray-700 text-white mt-1"
            {...register('date')}
          />
          {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
        </div>

        {/* Merchant Name */}
        <div>
          <Label className="text-gray-300 text-sm">ชื่อร้านค้า / แหล่งที่มา</Label>
          <Input
            placeholder="เช่น 7-Eleven, บริษัท ABC"
            className="bg-gray-800 border-gray-700 text-white mt-1"
            {...register('merchantName')}
          />
          {errors.merchantName && <p className="text-red-400 text-xs mt-1">{errors.merchantName.message}</p>}
        </div>

        {/* Description */}
        <div>
          <Label className="text-gray-300 text-sm">รายละเอียด / บันทึก</Label>
          <Input
            placeholder="รายละเอียดเพิ่มเติม..."
            className="bg-gray-800 border-gray-700 text-white mt-1"
            {...register('description')}
          />
          {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <input type="hidden" {...register('receiptImage')} />

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              บันทึกรายการ
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}

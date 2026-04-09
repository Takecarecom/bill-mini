'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  Receipt,
  Image as ImageIcon,
} from 'lucide-react';
import { getCategoryByKey, allCategories } from '@/lib/categories';
import type { Expense } from '@/lib/db';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
  }).format(num);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export function ExpenseList() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const limit = 20;
  const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
  if (typeFilter !== 'all') params.set('type', typeFilter);
  if (categoryFilter !== 'all') params.set('category', categoryFilter);
  if (search) params.set('search', search);

  const { data, error, isLoading, mutate } = useSWR(
    `/api/expenses?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: true }
  );

  const expenses: Expense[] = data?.expenses || [];
  const total: number = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        mutate();
        setDeleteId(null);
      }
    } catch {
      // ignore
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="ค้นหาร้านค้า, รายละเอียด..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="bg-gray-800 border-gray-700 text-white"
          />
          <Button variant="outline" onClick={handleSearch} className="border-gray-700 text-white hover:bg-gray-800">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1); }}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white hover:bg-gray-700">ทั้งหมด</SelectItem>
              <SelectItem value="expense" className="text-white hover:bg-gray-700">รายจ่าย</SelectItem>
              <SelectItem value="income" className="text-white hover:bg-gray-700">รายรับ</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setPage(1); }}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="all" className="text-white hover:bg-gray-700">ทุกหมวดหมู่</SelectItem>
              {allCategories.map((cat) => (
                <SelectItem key={cat.key} value={cat.key} className="text-white hover:bg-gray-700">
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-400">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
      ) : expenses.length === 0 ? (
        <Card className="border-gray-800 bg-gray-900/50 p-12 text-center">
          <Receipt className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">ยังไม่มีรายการ</p>
          <p className="text-gray-500 text-sm mt-1">เพิ่มรายการแรกของคุณเลย!</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) => {
            const category = getCategoryByKey(expense.category);
            const isIncome = expense.type === 'income';

            return (
              <Card
                key={expense.id}
                className="border-gray-800 bg-gray-900/50 backdrop-blur-sm hover:bg-gray-900/70 transition-all p-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isIncome ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {isIncome ? (
                      <ArrowDownCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate">
                        {expense.merchantName || expense.description || category?.label || 'ไม่ระบุ'}
                      </span>
                      {expense.receiptImage && (
                        <button
                          onClick={() => setPreviewImage(expense.receiptImage)}
                          className="text-gray-500 hover:text-blue-400 transition-colors"
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={`text-xs border-gray-700 ${
                        isIncome ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {category?.label || expense.category}
                      </Badge>
                      <span className="text-gray-500 text-xs">{formatDate(expense.date)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                      {isIncome ? '+' : '-'}{formatCurrency(expense.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-red-400 h-8 w-8 p-0"
                      onClick={() => setDeleteId(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">
            {total} รายการ (หน้า {page}/{totalPages})
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบ</DialogTitle>
          </DialogHeader>
          <p className="text-gray-400">คุณต้องการลบรายการนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} className="border-gray-700 text-white">
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>รูปใบเสร็จ</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="Receipt" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

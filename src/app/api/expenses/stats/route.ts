import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db';
import { eq, and, sql, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get totals by type
    const totals = await db
      .select({
        type: expenses.type,
        total: sql<number>`sum(${expenses.amount})::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .groupBy(expenses.type);

    const incomeTotal = totals.find(t => t.type === 'income')?.total || 0;
    const expenseTotal = totals.find(t => t.type === 'expense')?.total || 0;
    const incomeCount = totals.find(t => t.type === 'income')?.count || 0;
    const expenseCount = totals.find(t => t.type === 'expense')?.count || 0;

    // Monthly data (last 6 months) in Thailand timezone
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await db
      .select({
        month: sql<string>`to_char(${expenses.date} AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM')`,
        type: expenses.type,
        total: sql<number>`sum(${expenses.amount})::float`,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.date, sixMonthsAgo.toISOString())
        )
      )
      .groupBy(sql`to_char(${expenses.date} AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM')`, expenses.type)
      .orderBy(sql`to_char(${expenses.date} AT TIME ZONE 'Asia/Bangkok', 'YYYY-MM')`);

    // Transform monthly data for chart
    const monthlyMap = new Map<string, { month: string; income: number; expense: number }>();
    for (const row of monthlyData) {
      if (!monthlyMap.has(row.month)) {
        monthlyMap.set(row.month, { month: row.month, income: 0, expense: 0 });
      }
      const entry = monthlyMap.get(row.month)!;
      if (row.type === 'income') entry.income = row.total;
      if (row.type === 'expense') entry.expense = row.total;
    }

    // Category breakdown for expenses
    const categoryBreakdown = await db
      .select({
        category: expenses.category,
        type: expenses.type,
        total: sql<number>`sum(${expenses.amount})::float`,
        count: sql<number>`count(*)::int`,
      })
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .groupBy(expenses.category, expenses.type);

    return NextResponse.json({
      success: true,
      incomeTotal,
      expenseTotal,
      balance: incomeTotal - expenseTotal,
      incomeCount,
      expenseCount,
      totalCount: incomeCount + expenseCount,
      monthlyData: Array.from(monthlyMap.values()),
      categoryBreakdown,
    });
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลสถิติได้' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db';
import { eq, desc, and, ilike, or, sql } from 'drizzle-orm';
import { createExpenseSchema } from '@/schemas';

// GET /api/expenses - List expenses with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // income | expense
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const conditions = [eq(expenses.userId, session.user.id)];

    if (type && (type === 'income' || type === 'expense')) {
      conditions.push(eq(expenses.type, type));
    }
    if (category) {
      conditions.push(eq(expenses.category, category));
    }
    if (search) {
      conditions.push(
        or(
          ilike(expenses.description, `%${search}%`),
          ilike(expenses.merchantName, `%${search}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    const [records, countResult] = await Promise.all([
      db
        .select()
        .from(expenses)
        .where(whereClause)
        .orderBy(desc(expenses.date))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(expenses)
        .where(whereClause),
    ]);

    return NextResponse.json({
      success: true,
      expenses: records,
      total: countResult[0]?.count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถโหลดข้อมูลได้' },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createExpenseSchema.parse(body);

    const newExpense = await db
      .insert(expenses)
      .values({
        userId: session.user.id,
        type: validatedData.type,
        category: validatedData.category,
        amount: validatedData.amount.toString(),
        description: validatedData.description || null,
        merchantName: validatedData.merchantName || null,
        receiptImage: validatedData.receiptImage || null,
        date: new Date(validatedData.date).toISOString(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      expense: newExpense[0],
    });
  } catch (error) {
    console.error('Error creating expense:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'ไม่สามารถบันทึกข้อมูลได้' },
      { status: 500 }
    );
  }
}

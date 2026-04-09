import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { expenses } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { updateExpenseSchema } from '@/schemas';

// PUT /api/expenses/[id] - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateExpenseSchema.parse(body);

    // Build update object only with provided fields
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (validatedData.type !== undefined) updateValues.type = validatedData.type;
    if (validatedData.category !== undefined) updateValues.category = validatedData.category;
    if (validatedData.amount !== undefined) updateValues.amount = validatedData.amount.toString();
    if (validatedData.description !== undefined) updateValues.description = validatedData.description || null;
    if (validatedData.merchantName !== undefined) updateValues.merchantName = validatedData.merchantName || null;
    if (validatedData.date !== undefined) updateValues.date = new Date(validatedData.date).toISOString();
    if (validatedData.receiptImage !== undefined) updateValues.receiptImage = validatedData.receiptImage || null;

    const updated = await db
      .update(expenses)
      .set(updateValues)
      .where(and(eq(expenses.id, id), eq(expenses.userId, session.user.id)))
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        { error: 'ไม่พบรายการ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      expense: updated[0],
    });
  } catch (error) {
    console.error('Error updating expense:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'ไม่สามารถอัปเดตข้อมูลได้' },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const deleted = await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, session.user.id)))
      .returning();

    if (!deleted.length) {
      return NextResponse.json(
        { error: 'ไม่พบรายการ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ลบรายการสำเร็จ',
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถลบข้อมูลได้' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'กรุณาอัปโหลดรูปใบเสร็จ' },
        { status: 400 }
      );
    }

    // Get user's Anthropic API key or use server env
    const user = await db
      .select({ anthropicApiKey: users.anthropicApiKey })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const apiKey = user[0]?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'กรุณาตั้งค่า Anthropic API Key ในหน้าโปรไฟล์ หรือติดต่อผู้ดูแลระบบ' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // Determine media type
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `วิเคราะห์ใบเสร็จในรูปภาพนี้ แล้วดึงข้อมูลออกมาเป็น JSON ในรูปแบบนี้:
{
  "merchantName": "ชื่อร้านค้า/ผู้ออกใบเสร็จ",
  "amount": 0.00,
  "date": "YYYY-MM-DD",
  "category": "food|transport|utilities|shopping|health|entertainment|education|housing|other_expense",
  "description": "รายละเอียดสั้นๆ ของรายการ",
  "type": "expense"
}

หมวดหมู่ที่ใช้ได้:
- food: อาหารและเครื่องดื่ม
- transport: เดินทาง
- utilities: ค่าน้ำ/ค่าไฟ/เน็ต
- shopping: ช้อปปิ้ง
- health: สุขภาพ/ยา
- entertainment: บันเทิง
- education: การศึกษา
- housing: ที่อยู่อาศัย/ค่าเช่า
- other_expense: อื่นๆ

สำหรับรายรับ:
- salary: เงินเดือน
- freelance: ฟรีแลนซ์
- business: ธุรกิจ
- investment: การลงทุน
- gift: ของขวัญ/เงินให้
- other_income: อื่นๆ

ถ้าเป็นใบเสร็จจ่ายเงิน ให้ type เป็น "expense"
ถ้าเป็นใบเสร็จรับเงิน ให้ type เป็น "income"

ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบายอื่น`,
            },
          ],
        },
      ],
    });

    // Extract the text content
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { error: 'ไม่สามารถอ่านข้อมูลจากใบเสร็จได้' },
        { status: 500 }
      );
    }

    // Parse JSON from the response
    let extractedData;
    try {
      // Try to extract JSON from the response (may have markdown code blocks)
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      return NextResponse.json(
        { error: 'ไม่สามารถแปลงข้อมูลจากใบเสร็จได้ กรุณากรอกข้อมูลเอง' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: extractedData,
      receiptImage: `data:${mediaType};base64,${base64}`,
    });
  } catch (error) {
    console.error('Error scanning receipt:', error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: 'API Key ไม่ถูกต้อง หรือเกิดข้อผิดพลาดจาก API' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสแกนใบเสร็จ' },
      { status: 500 }
    );
  }
}

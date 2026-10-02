import { NextRequest, NextResponse } from 'next/server';
import { defaultChatOrchestrator } from '@/core/chat';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, sessionId, preferredLanguage } = body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required and must be non-empty.' },
        { status: 400 }
      );
    }

    const response = await defaultChatOrchestrator.handleQuestion({
      question: question.trim(),
      sessionId,
      preferredLanguage,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('API /api/chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error processing question.' },
      { status: 500 }
    );
  }
}

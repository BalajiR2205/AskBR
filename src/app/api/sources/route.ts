import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Ask Ambedkar primary sources catalog endpoint (Segment 0 Placeholder).',
    permittedCategories: [
      'Books and authored works',
      'Speeches',
      'Interviews',
      'Constituent Assembly debates and recorded statements',
      'Letters and correspondence',
      'Articles and editorials written by Ambedkar',
    ],
    status: 'Ingestion pipeline to be connected in subsequent segments.',
    provenanceSchema: {
      requiredFields: [
        'workTitle',
        'author ("B. R. Ambedkar")',
        'sourceType',
        'originalText',
        'referenceInfo',
      ],
      optionalFields: [
        'dateOrYear',
        'chapter',
        'section',
        'page',
        'originalLanguage',
        'volume',
        'archiveUrl',
      ],
    },
  });
}

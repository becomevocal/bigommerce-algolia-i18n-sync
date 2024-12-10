import { NextResponse } from 'next/server';
import algoliasearch from 'algoliasearch';

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_API_KEY!
);

const syncLogIndex = client.initIndex(process.env.ALGOLIA_SYNC_LOG_INDEX_NAME!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  
  try {
    const { hits } = await syncLogIndex.search('', {
      hitsPerPage: limit,
      sort: ['timestamp:desc']
    });

    return NextResponse.json({ success: true, logs: hits });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return NextResponse.json({ success: false, message: 'Error fetching sync logs' }, { status: 500 });
  }
}


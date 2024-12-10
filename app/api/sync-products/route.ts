import { NextResponse } from 'next/server';
import { fetchBigCommerceProducts } from '@/lib/bigcommerce';
import { indexProductsToAlgolia, logSyncStatus } from '@/lib/algolia';

export async function GET() {
  const syncId = Date.now().toString();
  try {
    await logSyncStatus(syncId, 'started', 'Sync process started');

    let allProducts = [];
    let page = 1;
    let hasMore = true;
    let cursor = null;

    while (hasMore) {
      await logSyncStatus(syncId, 'in_progress', `Fetching page ${page} of products`);
      const products = await fetchBigCommerceProducts({ limit: 50, cursor });
      allProducts = allProducts.concat(products);

      if (products.length < 50) {
        hasMore = false;
      } else {
        cursor = products[products.length - 1].id; // Use the last product's ID as the cursor
        page++;
      }

      await logSyncStatus(syncId, 'in_progress', `Fetched ${allProducts.length} products so far`);
    }

    await logSyncStatus(syncId, 'in_progress', `Fetched a total of ${allProducts.length} products from BigCommerce`);

    await indexProductsToAlgolia(allProducts);
    await logSyncStatus(syncId, 'completed', `Indexed ${allProducts.length} products to Algolia for all configured locales`);

    return NextResponse.json({ success: true, message: 'Products synced successfully', syncId, totalProducts: allProducts.length });
  } catch (error) {
    console.error('Error syncing products:', error);
    await logSyncStatus(syncId, 'error', `Error syncing products: ${error.message}`);
    return NextResponse.json({ success: false, message: 'Error syncing products', syncId }, { status: 500 });
  }
}


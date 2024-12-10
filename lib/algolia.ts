import algoliasearch from 'algoliasearch';

const client = algoliasearch(
  process.env.ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_API_KEY!
);

const syncLogIndex = client.initIndex(process.env.ALGOLIA_SYNC_LOG_INDEX_NAME!);

export async function indexProductsToAlgolia(products) {
  const locales = process.env.BIGCOMMERCE_LOCALES ? JSON.parse(process.env.BIGCOMMERCE_LOCALES) : [];
  const defaultLocale = process.env.BIGCOMMERCE_DEFAULT_LOCALE || 'en';

  for (const locale of locales) {
    const indexName = `${process.env.ALGOLIA_PRODUCT_INDEX_NAME}_${locale.code}`;
    const index = client.initIndex(indexName);

    const localizedProducts = products.map(product => {
      const localizedData = locale.code === defaultLocale ? product : product[locale.code];
      return {
        objectID: product.id,
        name: localizedData.basicInformation.name,
        description: localizedData.basicInformation.description,
        pageTitle: localizedData.seoInformation.pageTitle,
        metaDescription: localizedData.seoInformation.metaDescription,
        options: product.options.edges.map(edge => ({
          id: edge.node.id,
          displayName: locale.code === defaultLocale ? edge.node.displayName : edge.node[locale.code]?.displayName || edge.node.displayName,
          values: edge.node.values.map(value => ({
            id: value.id,
            label: locale.code === defaultLocale ? value.label : edge.node[locale.code]?.values.find(v => v.id === value.id)?.label || value.label,
          })),
        })),
        customFields: product.customFields.edges.map(edge => ({
          id: edge.node.id,
          name: edge.node.name,
          value: locale.code === defaultLocale ? edge.node.value : edge.node[locale.code]?.edges[0]?.node.value || edge.node.value,
        })),
      };
    });

    try {
      // Split products into batches of 1000 (Algolia's recommended batch size)
      const batches = [];
      for (let i = 0; i < localizedProducts.length; i += 1000) {
        batches.push(localizedProducts.slice(i, i + 1000));
      }

      for (const [batchIndex, batch] of batches.entries()) {
        const result = await index.saveObjects(batch);
        console.log(`Indexed batch ${batchIndex + 1}/${batches.length} (${result.objectIDs.length} products) to Algolia index ${indexName}`);
        
        // Add a small delay between batches to avoid rate limiting
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`Completed indexing ${localizedProducts.length} products to Algolia index ${indexName}`);
    } catch (error) {
      console.error(`Error indexing products to Algolia index ${indexName}:`, error);
      throw error;
    }
  }
}

export async function logSyncStatus(syncId: string, status: 'started' | 'in_progress' | 'completed' | 'error', message: string) {
  try {
    const logEntry = {
      objectID: syncId,
      status,
      message,
      timestamp: new Date().toISOString()
    };
    await syncLogIndex.saveObject(logEntry);
    console.log(`Logged sync status: ${status} - ${message}`);
  } catch (error) {
    console.error('Error logging sync status to Algolia:', error);
  }
}


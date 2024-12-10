import { createGraphQLClient, GraphQLClient } from './graphqlClient';

let client: GraphQLClient;

export function getBigCommerceClient(): GraphQLClient {
  if (!client) {
    const accessToken = process.env.BIGCOMMERCE_ACCESS_TOKEN;
    const storeHash = process.env.BIGCOMMERCE_STORE_HASH;
    if (!accessToken || !storeHash) {
      throw new Error('BigCommerce credentials are not set in environment variables');
    }
    client = createGraphQLClient(accessToken, storeHash);
  }
  return client;
}

interface FetchProductsOptions {
  limit?: number;
  cursor?: string;
}

export async function fetchBigCommerceProducts(options: FetchProductsOptions = {}) {
  const client = getBigCommerceClient();
  const channelId = process.env.BIGCOMMERCE_CHANNEL_ID;
  const locales = process.env.BIGCOMMERCE_LOCALES ? JSON.parse(process.env.BIGCOMMERCE_LOCALES) : [];
  const defaultLocale = process.env.BIGCOMMERCE_DEFAULT_LOCALE || 'en';

  if (!channelId) {
    throw new Error('BigCommerce channel ID is not set in environment variables');
  }

  const limit = options.limit || 50; // Default to 50 products per page

  let hasNextPage = true;
  let cursor = options.cursor;
  let allProducts = [];

  while (hasNextPage) {
    const result = await client.getAllProducts(limit, cursor);
    const pageInfo = result.data.store.products.pageInfo;
    const productIds = result.data.store.products.edges.map(edge => edge.node.id);

    // Fetch detailed data for each product
    const products = await Promise.all(productIds.map(async (pid) => {
      const result = await client.getProductLocaleData({
        pid: pid.replace('bc/store/product/', ''),
        channelId,
        availableLocales: locales,
        defaultLocale
      });
      return result.data.store.products.edges[0].node;
    }));

    allProducts = allProducts.concat(products);

    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return allProducts;
}


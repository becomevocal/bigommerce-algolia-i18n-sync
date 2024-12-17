# BigCommerce to Algolia Multi-language Product Sync (WIP)
> ⚠️ **Work in Progress**: This project is under active development

A Next.js API route that synchronizes products from BigCommerce to Algolia, with support for multiple locales. Uses the BigCommerce Admin GraphQL API to fetch products, their locale specific data, and indexes them in Algolia as a separate index for each locale.

## Features
- Fetches products from BigCommerce using pagination
- Indexes products to Algolia with locale support
- Tracks sync progress with detailed logging (non-functional atm)
- Debug mode for testing with limited product set

## Environment Variables
Copy `.env.example` to `.env` and configure the following variables:

```env
### BigCommerce Configuration
BIGCOMMERCE_ACCESS_TOKEN=your_access_token
BIGCOMMERCE_STORE_HASH=your_store_hash
BIGCOMMERCE_CHANNEL_ID=your_channel_id
BIGCOMMERCE_LOCALES=[{"code":"en"},{"code":"fr"},{"code":"es"}]
BIGCOMMERCE_DEFAULT_LOCALE=en

### Algolia Configuration
ALGOLIA_APP_ID=your_app_id
ALGOLIA_ADMIN_API_KEY=your_admin_api_key
ALGOLIA_PRODUCT_INDEX_NAME=your_product_index_name
ALGOLIA_SYNC_LOG_INDEX_NAME=your_sync_log_index_name

### Sync Configuration
# Optional: Set to 'true' to only sync one page of products (for testing)
SYNC_DEBUG_MODE=false
```

## Usage

### Starting a Sync
To initiate a product sync, send a GET request to:
`GET /api/sync-products`

The endpoint will return a response with:
- `syncId`: Unique identifier for tracking the sync
- `success`: Boolean indicating if the sync was successful
- `totalProducts`: Number of products synced
- `message`: Status message

## Response Example
```json
{
"success": true,
"message": "Products synced successfully",
"syncId": "1234567890",
"totalProducts": 150
}
```
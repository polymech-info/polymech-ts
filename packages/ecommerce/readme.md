# Todo List: React + Hono + Shopify + Google Merchant + Crypto Backup + Refund Flow

## 1. Frontend - React Components / Pages

### Product & Catalog
- [ ] `ProductsPage` - Display all products from Shopify Storefront API.
- [ ] `ProductDetail` - Show single product details, include JSON-LD schema for Google.
- [ ] `ProductCard` - Reusable card component for product grid.
- [ ] `ProductGrid` - Grid layout component for listing products.

### Cart & Checkout
- [ ] `CartPage` - Show cart items, quantities, subtotal.
- [ ] `CartItem` - Individual item component in cart.
- [ ] `CheckoutPage` - Handle checkout selection (Shopify or crypto).
- [ ] `OrderSummary` - Display order totals, taxes, shipping.

### Policies / Info Pages
- [ ] `ShippingPage` - Public page with shipping info and rates.
- [ ] `ReturnsPage` - Public page with refund/return policy.
- [ ] `PrivacyPolicyPage` - Public page with privacy/cookie info.
- [ ] `TermsPage` - Optional terms of service page.

### Payment / Backup
- [ ] `CryptoPayButton` - Button to trigger crypto payment backup flow.
- [ ] `GoogleFeedButton` (optional) - Trigger feed refresh manually.

### Admin / Sync
- [ ] `ProductSyncPage` - Admin page to sync products to Google Merchant (optional).
- [ ] `ReportsPage` - Show feed errors or Merchant API warnings (optional).
- [ ] `RefundRequestPage` - Admin/customer page to view/refund orders.

---

## 2. Backend - Hono Endpoints

### Shopify / Orders
- [ ] `/api/checkout-session` - Create Shopify checkout session.
- [ ] `/api/order-webhook` - Receive Shopify order updates, update stock.
- [ ] `/api/refund-order` - Trigger Shopify refund (full/partial).

### Payment
- [ ] `/api/create-payment-intent` - Stripe PaymentIntent for card payments.
- [ ] `/api/create-crypto-session` - Create crypto invoice/session (Coinbase / BitPay).
- [ ] `/api/crypto-webhook` - Receive crypto payment confirmations.
- [ ] `/api/refund-crypto-payment` - Refund crypto payment via provider API.

### Google Merchant
- [ ] `/api/google-feed` - Generate product feed (JSON/XML) for Google Merchant.
- [ ] `/api/product-sync` - Optional: push product updates to Google Merchant Content API.

---

## 3. Product Feed / Google Merchant

- [ ] Ensure each product includes:
  - `id`, `title`, `description`
  - `link` (product detail URL)
  - `image_link` (high-res images)
  - `price` (match checkout)
  - `availability` (`in_stock`, `out_of_stock`, `preorder`)
  - `brand`, `gtin` or `mpn` (if available)
- [ ] Set up scheduled feed update (daily) via Hono cron / scheduler.
- [ ] Validate feed with Google Merchant Center tools.

---

## 4. Crypto Payment Integration

- [ ] Choose crypto provider: Coinbase Commerce / BitPay / CoinPayments.
- [ ] Implement backend API to generate invoice / checkout session.
- [ ] Implement webhook verification for crypto payments.
- [ ] Update Shopify order or draft order once crypto payment confirmed.
- [ ] Implement refund endpoint for crypto payments.
- [ ] Track refunded crypto payments in order history.

---

## 5. Refund Flow

### Frontend
- [ ] `RefundRequestPage` - Customer/admin can request refund.
- [ ] `RefundStatusComponent` - Display refund progress (pending, completed, failed).

### Backend (Hono)
- [ ] `/api/refund-order` - Trigger Shopify refund (full/partial) via Admin API.
- [ ] `/api/refund-crypto-payment` - Refund crypto payment through provider API (Coinbase/BitPay).
- [ ] Update order status in database / Shopify once refund is processed.
- [ ] Send email/notification to customer about refund status.

### Notes
- Refunds must adjust inventory and availability.
- Partial refunds must recalc totals correctly.
- Refund webhooks (if supported) should be verified for crypto payments.

---

## 6. SEO / Compliance

- [ ] Ensure all pages are HTTPS.
- [ ] Structured data for products (`Product` JSON-LD).
- [ ] Meta tags for title, description, OG tags.
- [ ] Accurate shipping, returns, privacy policies.
- [ ] Validate Google Merchant feed compliance.

---

## 7. Optional / Advanced

- [ ] Support multiple currencies in Shopify and crypto backup.
- [ ] Admin page to monitor crypto payments and refunds.
- [ ] Retry / error handling for failed webhook calls.
- [ ] Analytics tracking (Google Analytics / server-side events).
- [ ] Scheduled feed validation to catch product/price issues.

## 8. Stripe Specifics

https://docs.stripe.com/testing?testing-method=card-numbers
https://dashboard.stripe.com/test/payments

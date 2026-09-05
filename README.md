# Crafts & Crumbs — Ionic Mobile App

Ionic Angular mobile storefront for the current Crafts & Crumbs website.

## Stack
- Ionic Angular standalone components
- Capacitor
- Firebase Authentication
- Cloud Firestore

## Firebase data used
The app connects to the same Firebase project as the website and uses:
- `products`
- `combos`
- `orders`
- `users`
- `carts`
- `wishlists`
- `reviews`
- `settings/general`

The delivery fee is read from `settings/general.deliveryFee`, matching the current website's admin-configurable delivery fee.

## Run
```bash
npm install
npx ionic serve
```

## Android
```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Do not commit `node_modules`, build output, `.env` files, or Firebase Admin/service-account credentials.

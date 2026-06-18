# Nursery Management Portal + E-Commerce Website

Tech stack: **Node.js backend, Next.js frontend, MySQL database**.

## Modules Included

- Customer website: home, products, cart, checkout, my orders, about, contact
- Admin portal: inventory, production, orders, billing, advance booking, dispatch, attendance, wages
- Product management for plants and seeds
- MySQL schema for roles, users, products, categories, stock ledger, orders, billing, attendance, wages
- Standalone Node.js REST backend for products, orders, production, billing, payments, bookings, dispatch, attendance, wages and reports

## Setup

```bash
npm install
cp .env.example .env
npm run dev:frontend
```

Start the Node.js backend in a separate terminal:

```bash
npm run dev:backend
```

Frontend: `http://localhost:3000`

Backend: `http://localhost:4000/api/health`

Default admin logins after backend startup:

- Super Admin: `owner@nursery.local` / `owner123`
- Staff User: `staff@nursery.local` / `staff123`
- Billing User: `billing@nursery.local` / `billing123`

Create the database and tables:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

Open `http://localhost:3000`.

## Notes

The frontend lives in `frontend/`. The backend lives in `backend/` and uses Node.js, `mysql2`, and MySQL.
"# nursery_management" 
"# nursery_management" 
"# nursery_management" 
"# nursery_management" 
"# nursery_management" 
"# nursery_management" 

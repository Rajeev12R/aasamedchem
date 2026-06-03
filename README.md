# AasaMedChem - B2B Chemical Marketplace

A premium-designed inventory, quotation, and order management system built for chemical manufacturers, suppliers, and buyers.

---

## 🚀 Live Demo & Key Features

* **Role-Based Access Control**: Strict routing and auth using NextAuth.js v5 for three user archetypes:
  * **Admin**: View metrics, manage inventory levels (full Product CRUD), view client quotations, and approve/reject them.
  * **Seller**: List and edit owned products, track inventory levels, and view quotation history.
  * **Buyer**: Search/filter products, configure custom quantities/units in a shopping cart, see dynamic price calculations in INR, and submit quotations.
* **Dynamic Unit Conversions**: Seamless, automatic conversions of volume/weight inputs (e.g. `kg` to `g`, `L` to `mL`) in real-time.
* **Precise Decimal Pricing**: High-precision pricing and stock storage using Neon PostgreSQL decimals.
* **Stock Reservation Safeguards**: PostgreSQL database transactions reserve inventory immediately upon quotation request, preventing duplicate allocations.

---

## 🛠️ Tech Stack & Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js (React 19)                   │
│                     Tailwind CSS v4                     │
└────────────────────────────┬────────────────────────────┘
                             │ (API Actions & Routes)
┌────────────────────────────▼────────────────────────────┐
│                    Prisma 6 Client                      │
│                    next-auth v5 (Beta)                  │
└────────────────────────────┬────────────────────────────┘
                             │ (SQL Queries)
┌────────────────────────────▼────────────────────────────┐
│                Neon hosted PostgreSQL Database           │
└─────────────────────────────────────────────────────────┘
```

* **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, Sonner (Toasts)
* **Backend**: Next.js Route Handlers, NextAuth v5 Beta, decimal.js
* **Database**: Neon PostgreSQL serverless database
* **ORM**: Prisma ORM v6 with schema verification

---

## 📊 Database Schema & Precision Choices

### High-Precision Decimals
Chemical trading requires massive quantities (e.g. metric tons) and small rates (e.g. price per gram). To avoid float rounding errors, the database uses PostgreSQL `Decimal(30, 10)` fields.
* **Integer Precision (20 digits)**: Supports quantities/prices up to $99,999,999,999,999,999,999$.
* **Fractional Precision (10 digits)**: Preserves precise rates (e.g. ₹$0.000375$ per gram).

### Database Model Definition
* **`User`**: Core accounts holding name, credentials, and `Role` (`ADMIN`, `SELLER`, `BUYER`).
* **`Product`**:
  * `inventoryQuantity` (`Decimal`): Total stock in standard base units.
  * `reservedQuantity` (`Decimal`): Stock held by pending quotations.
  * `basePrice` (`Decimal`): Rate per base unit.
* **`Quotation`** & **`QuotationItem`**: Holds buyer information, requested display quantities/units, base quantities, and calculated prices.
* **`Order`** & **`OrderItem`**: Holds approved orders converted from quotations, tracking processing and completion status.

---

## ⚖️ Unit Storage & Conversion Strategy

To maintain database consistency and allow flexible UI unit selections, we store all amounts in standard base units internally:

| Dimension | User-Facing Units | Database Base Unit | Conversion Factor |
| :--- | :--- | :--- | :--- |
| **WEIGHT** | Grams (`g`), Kilograms (`kg`) | `g` | $1\text{ kg} = 1000\text{ g}$ |
| **VOLUME** | Milliliters (`mL`), Liters (`L`) | `mL` | $1\text{ L} = 1000\text{ mL}$ |
| **COUNT** | Items (`item`) | `item` | $1\text{ item} = 1\text{ item}$ |

### Conversion Flow
1. **Creation/Edit (Admin/Seller)**: 
   * User enters `50 kg` of stock. 
   * System multiplies $50 \times 1000$ and saves `50000` to `inventoryQuantity` with `baseUnit: "g"`.
2. **Catalog Cart (Buyer)**:
   * Buyer enters `1.5 kg` in the cart.
   * Client-side calculator multiplies $1.5 \times 1000 = 1500\text{ g}$.
   * Total line price is calculated as $1500\text{ g} \times \text{basePrice}$.
   * Total is immediately validated against available stock: `(inventoryQuantity - reservedQuantity) >= 1500 g`.
3. **Quotation Submission (API)**:
   * System recalculates conversions on the server.
   * Increments `reservedQuantity` by the base unit quantity (`1500 g`) to secure the stock.
4. **Approval (Admin)**:
   * When approved, quotation status becomes `APPROVED`, creating an `Order`.
   * Stock is finalized: `inventoryQuantity` and `reservedQuantity` are both decremented by `1500 g`.

---

## 🛠️ Local Setup & Commands

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd aasamedchem
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://user:password@ep-xxxx.neon.tech/dbname?sslmode=require"
AUTH_SECRET="your-32-character-auth-secret-string-here"
```

### 3. Apply Schema Migrations
```bash
npx prisma migrate dev
```

### 4. Seed the Database
Seed the database with pre-configured user credentials (uses the `prisma/seed.ts` script):
```bash
npx prisma db seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Test Login Credentials

To make evaluating the assignment seamless, the login page has **Quick-Fill Buttons** to prefill the email and password for each role automatically.

| Role | Email | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@aasa.com` | `password123` | Control Panel: CRUD products, process quotations, update orders |
| **Seller** | `seller@aasa.com` | `password123` | Vendor Panel: list owned products, view order metrics |
| **Buyer** | `buyer@aasa.com` | `password123` | B2B Catalog: Browse inventory, checkout cart, review quote status |

---

## ☁️ Deploying to Vercel

1. Push your changes to a GitHub repository.
2. Link the repository to your Vercel project.
3. Configure the environment variables (`DATABASE_URL`, `AUTH_SECRET`) in Vercel settings.
4. Set the build commands:
   * **Build Command**: `prisma generate && next build`
5. Click **Deploy**.

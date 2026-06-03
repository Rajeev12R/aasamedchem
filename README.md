# AasaMedChem - B2B Chemical Marketplace

An inventory, quotation, and order management portal built for chemical manufacturers, suppliers, and buyers.

---

<!-- PLACEHOLDER FOR SCREENSHOTS / GIFS -->
<div align="center">
  <!-- You can replace the URLs below with your uploaded GitHub image links -->
  <img src="https://via.placeholder.com/800x450.png?text=AasaMedChem+Landing+Page" alt="Landing Page" width="800" style="border-radius: 8px; margin-bottom: 10px;" />
  <br />
  <img src="https://via.placeholder.com/800x450.png?text=Buyer+Catalog+And+Cart+Conversions" alt="Buyer Catalog" width="800" style="border-radius: 8px;" />
</div>

---

## 🛠️ Quick Start & Local Setup

### 1. Clone & Install
```bash
git clone <repository-url>
cd aasamedchem
npm install
```

### 2. Configure Environment (`.env`)
Create a `.env` file in the root:
```env
DATABASE_URL="postgresql://user:password@ep-xxxx.neon.tech/dbname?sslmode=require"
AUTH_SECRET="some-random-32-character-secret-key-here"
```

### 3. Setup Database
```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## 🔑 Test Logins
The login page has **Quick-Fill Buttons** to pre-fill test credentials in one click.

| Role | Email | Password | What to Test |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@aasa.com` | `password123` | Create/edit chemicals, approve/reject quotations, track orders |
| **Seller** | `seller@aasa.com` | `password123` | List own products, view client quotation requests |
| **Buyer** | `buyer@aasa.com` | `password123` | Search products, customize checkout quantities/units, submit quotes |

---

## ⚙️ Core Architecture & Mappings

### 1. High-Precision Decimals
To handle massive quantities (tons) alongside fractional pricing rates (e.g., price per gram), all numeric fields use PostgreSQL `Decimal(30, 10)` data types. This avoids Javascript floating-point rounding errors during financial transactions.

### 2. Unit Storage Strategy
All chemical quantities are converted and stored in **Standard Base Units** inside the database:
* **WEIGHT**: Base unit is Grams (`g`). ($1\text{ kg} = 1000\text{ g}$).
* **VOLUME**: Base unit is Milliliters (`mL`). ($1\text{ L} = 1000\text{ mL}$).
* **COUNT**: Base unit is Items (`item`).

---

## 📈 Implementation History (Git Commits)

Here are the features implemented, in chronological order:

### 1. Auth & layouts setup
* Configured NextAuth.js v5 credentials flow.
* Created middleware-level route protection for `/admin`, `/buyer`, and `/seller`.
* Designed individual navigation layouts (sidebars for Admin/Seller, topbar for Buyer).

### 2. Admin Product CRUD
* Implemented POST, PUT, and DELETE API endpoints for product inventory.
* Created the admin inventory dashboard listing available, reserved, and total stock.
* Added chemical creation and edit forms.

### 3. Buyer Catalog & Dynamic Cart
* Implemented the search/category-filtered catalog page.
* Built the interactive checkout cart sidebar. Quantities entered in custom units (e.g. `kg`, `L`) automatically convert to base units and display calculations (e.g. `1.5 kg = 1500 g @ ₹0.05/g = ₹75.00`).
* Added live stock check warnings inside the cart to prevent over-purchasing.

### 4. Quotations & Order Automation
* Added a stock reservation API: when a buyer requests a quote, the stock is marked as `reservedQuantity` in PostgreSQL.
* Added admin approval handlers: approving a quote converts it into a pending `Order`, releases the reserved stock, and decrements actual inventory.
* Added cancellation handler: cancelling an order restores the stock levels in a secure transaction.

### 5. Seller Portal
* Created seller-specific dashboard metrics.
* Added products list and edit flows restricting sellers to only manage listings they created.
* Created quotations list displaying requests for the seller's specific products.

### 6. UI Polish & Seed data
* Redesigned landing page with dark-mode hero graphics.
* Created a glassmorphism login interface.
* Expanded `prisma/seed.ts` with mock chemicals, pending quotes, and active orders for instant verification.

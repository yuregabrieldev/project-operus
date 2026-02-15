# Operus System Design Context & PRD

**System Overview**: Operus is a comprehensive SaaS solution for franchise and retail chain management. It connects a central "Brand" with multiple "Stores", handling everything from stock and logistics to cash management and financial reporting.

---

## 1. Global Design System

### 1.1. Color Palette
*   **Primary Blue**: `#2563EB` (blue-600) - Main actions, active states, key branding.
*   **Secondary Indigo**: `#4F46E5` (indigo-600) - Gradients, developer portal accents.
*   **Success Green**: `#10B981` (emerald-500) - Positive metrics, "Active" badges, profit indicators.
*   **Warning Amber**: `#D97706` (amber-600) - Pending actions, alerts, "Low Stock".
*   **Danger Red**: `#EF4444` (red-500) - Errors, "Critical Stock", delete actions, negative trends.
*   **Backgrounds**:
    *   **App**: `#F3F4F6` (gray-100) - Main application background.
    *   **Sidebar**: `#0F172A` (slate-900) - Dark sidebar for contrast.
    *   **Cards**: `#FFFFFF` (white) - With `shadow-md` and `rounded-lg`.

### 1.2. Typography & Iconography
*   **Font**: Inter or similar clean-sans serif.
*   **Headings**: Bold, simple. `text-2xl` for page titles.
*   **Icons**: Lucide React set (outline style, 1.5px stroke).

### 1.3. Common UI Patterns
*   **Page Layout**: Sidebar (Left) + Header (Top) + Main Content (Scrollable).
*   **Cards**: Used for grouping statistics and forms. rounded corners.
*   **Tables**: Clean rows, hover effects (`hover:bg-gray-50`), badge indicators for status columns.
*   **Modals (Dialogs)**: Centered, backdrop blur, clear "Cancel/Confirm" footer.
*   **Toasts**: Notifications for success/error appear at bottom-right.

---

## 2. Public Pages

### 2.1. Landing Page (`/`)
*   **Header**:
    *   **Logo**: Blue square with white "O" + "Operus".
    *   **Navigation**: Links to "Funcionalidades", "Depoimentos", "Preços".
    *   **Auth Buttons**: "Entrar" (Login) and "Cadastrar" (Register).
*   **Hero Section**:
    *   **Background**: Blue-to-Indigo gradient.
    *   **Content**: Large headline "Gerencie seu negócio com inteligência", value prop subtext, "Começar Gratuitamente" CTA.
    *   **Visual**: Abstract dashboard preview or illustration.
*   **Features Section**: 3-column grid of cards.
    *   Each card: Large colored icon (Stock, Logistics, Finance), Title, Description.
*   **Testimonials**: Carousel or grid of user reviews (Stars, Quote, User Info).
*   **Pricing Section**:
    *   **Toggle**: Monthly vs Annual (Annual shows discount badge).
    *   **Starter Plan Card**: Price, basic features list, "Subscrever" button.
    *   **Business Plan Card**: Price, all features + *Waste/Production*, "Popular" badge, "Subscrever" button.
*   **Footer**: Links, Copyright, Social icons.

### 2.2. Authentication Flows
*   **Login Modal**: Email/Password inputs. "Esqueci a senha" link.
*   **Register Modal**: Name, Email, Password inputs.
*   **Subscribe Modal**: Triggered from Pricing. Collects Name, Email, Phone (+ Country Code selector). Shows success message.

---

## 3. Developer Portal (Role: `developer`)
*   **Sidebar**: Dark purple theme (`#1a1025`). Items: Dashboard, Brands, Finance, Users, Settings.

### 3.1. Dev Dashboard
*   **KPI Cards**: Total Revenue (with % growth), Total Brands, Active Stores, Total Users.
*   **Main Chart**: Revenue growth bar chart (Monthly view).
*   **System Health**: Status indicators (API Green, DB Green, Cache Green).

### 3.2. Brands Management (`/dev-brands`)
*   **Header**: Title + "Nova Marca" button.
*   **Brand Cards**: Grid layout. Each card shows Logo, Name, Plan, Status.
    *   **Expanded View**: Shows list of Stores under that brand.
    *   **Add Store Action**: Button to add a store to a specific brand.
*   **Dialogs**:
    *   **Create Brand**: Name, Image Upload, Admin User Assignment (Search).
    *   **Add Store**: Name, Address, Image, Manager Assignment.

### 3.3. Financial Overview (`/dev-finance`)
*   **Tabs**: "Finanças" (General) vs "Receitas" (Revenue Analysis).
*   **Receitas Tab**:
    *   **Metrics**: MRR, ARPU, Churn Rate.
    *   **Charts**: Revenue breakdown by Plan (Pie chart).

### 3.4. Settings (`/dev-settings`)
*   **API Keys**: List masked keys. "Add Key" dialog.
*   **Integrations**: Toggles for Stripe, SendGrid, S3. Configuration dialogs for webhooks.
*   **Notifications**: Global system toggles (Email, Push, System Alerts).
*   **Security**: Enforce 2FA, Session Timeout settings.
*   **Backup**: Schedule (Daily/Weekly), Manual Trigger, Historical List (Download).

---

## 4. Main Application (Roles: Admin, Manager, Assistant)

### 4.1. Navigation & Header
*   **Sidebar Items**: Dashboard, Inventory, Operations, Transit, Purchases, Cashbox, Invoices, Licenses, Waste, Checklists, Stores, Users, Settings.
*   **Header**:
    *   **Brand Context**: Logo and Name of current brand.
    *   **Global Actions**: Theme Toggle (Sun/Moon), Language (PT/EN/ES), Notification Bell.
    *   **User Menu**: Avatar -> Profile, Logout.

### 4.2. Dashboard (`/dashboard`)
*   **Tabs**: "Operacional" vs "Financeiro".
*   **Operacional Tab**:
    *   **Stats**: Total Products, Low Stock (Red), Pending Invoices (Yellow), Open Cashboxes (Green).
    *   **Recent Movements**: List of last 5 stock updates (In/Out/Transfer).
    *   **Alerts**: Critical stock levels and overdue invoices list.
*   **Financeiro Tab**: Revenue charts, Expense breakdown.

### 4.3. Inventory Management (`/inventory`)
*   **Filters**: Search bar, Store selector, Category selector.
*   **View Modes**: List (Table) vs Card (Grid).
*   **Main Table**:
    *   Columns: Product Name, SKU, Category, Supplier, Current Stock, Min Stock, Status Badge (Normal/Low/Critical).
    *   Actions: Edit, Adjust Stock, View History.
*   **Actions**: "Novo Produto" button (Opens comprehensive form).

### 4.4. Operations & Transit (`/operations`, `/transit`)
*   **Operations**: Log of all stock movements. Filters by Date/Type.
*   **Transit**:
    *   **Kanban/List**: Shipments in "Pending", "In Transit", "Delivered".
    *   **Create Shipment**: Form to select Origin Store -> Destination Store, Products, Driver/Vehicle.

### 4.5. Cash Management (`/cash`)
*   **Tabs**: Caixa, Depósito, Resumo, Definições.
*   **Caixa Tab**:
    *   **Daily Cards**: One card per opened cash day.
    *   **Card Content**: Date, Total Sales (Badge), Withdrawals (Badge), Deposit Status (Icon + Badge).
    *   **Action**: "Adicionar" (Open new cash day or register separate movement).
*   **Depósito Tab**:
    *   **Pending Table**: List of stores with undeposited cash.
    *   **Actions**:
        *   **"DEPOSITAR"**: Opens dialog to register bank deposit. Input: Value, Date, Proof (Attachment).
        *   **"HISTÓRICO"**: Shows past deposits. Rows expand to show comments. Edit icon allows modification.

### 4.6. Users & Permissions (`/users`)
*   **User List**: Table with Name, Role (Badge), Assigned Store.
*   **Edit User Dialog**:
    *   **Info**: Name, Email, Role selector.
    *   **Store Access**: Checkboxes for stores user can access.
    *   **Permissions**: Toggles for specific modules (e.g., "Can access Reports", "Can access Cash").
    *   **PIN**: Numeric PIN input for quick access (masked).

### 4.7. Store Management (`/stores`)
*   **Store Cards**: Grid view of stores. Image, Address, Manager Name.
*   **Edit/Create**:
    *   Form with Image Upload (Wait for approval toast), Name, Address, Contact.

### 4.8. Checklists (`/checklists`)
*   **Tabs**: My Checklists (Execution) vs Manage (Templates).
*   **Execution**: List of tasks. Click to toggle status. Progress bar.
*   **Templates**: Create new checklist templates, assign to roles/stores.

### 4.9. Settings (`/settings`)
*   **General**: Brand info, Logos.
*   **Preferences**: default currency, timezone.
*   **Notifications**: User-specific notification preferences.

---

## 5. Interactions & States
*   **Hover Effects**: Buttons lighten/darken. Table rows highlight.
*   **Loading**: Skeleton loaders used while fetching data.
*   **Transitions**: Smooth scrolling to top on route change. Content fades in (`animate-in fade-in`).
*   **Validation**: Forms show red borders and error text for invalid inputs.
*   **Success**: Green toast notification appearing at bottom right.

---

## 6. Technical Components
*   **React Contexts**: `AuthContext` (User session), `BrandContext` (Selected workings), `DataContext` (Global store/product data).
*   **UI Library**: `shadcn/ui` (built on Radix UI + Tailwind).
*   **Charts**: `recharts` for visual data.
*   **Date Handling**: Native Date objects, formatted to local strings (PT-PT).

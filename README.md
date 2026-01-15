# Dine Flow - Restaurant Billing & Management App

Dine Flow is a high-performance, real-time restaurant management solution built with **React Native (Expo)** and **Supabase**. It transitions traditional paper-based billing into a digital workflow, connecting Waiters, Chefs, and Admins in a single ecosystem.

## 🚀 Key Features

*   **Multi-Tenancy**: Isolated data for different hotels/restaurants.
*   **Floor Management**: Visual seat/table map with real-time occupancy tracking.
*   **Multi-Parcel Management**: Manage multiple concurrent takeaway orders with automated session-based numbering.
*   **Kitchen Display System (KDS)**: A dedicated chef's view for managing orders and marking items as served.
*   **Inventory Tracking**: 
    *   Automated "Sold Out" status.
    *   **Fractional Stock**: Supports portions (Full = 1, Half = 0.5, Quarter = 0.25).
    *   **Auto-Restock**: Stock is returned if an item/order is cancelled.
*   **Item Customizations**: Add special notes (e.g., "No onions", "Extra spicy") to any item in the order.
*   **Admin Dashboard**: Comprehensive views for sales reports, staff management, and menu editing.
*   **Role-Based Access**: 
    *   **Admin**: Full control over menu, staff, and reports.
    *   **Waiter**: Floor management and order taking.
    *   **Kitchen**: Order tracking and preparation.

---

## 🛠️ Setup Instructions

### 1. Prerequisites
Ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v16 or higher)
*   [Expo Go](https://expo.dev/client) app on your mobile device (for testing)

### 2. Installation
Clone the repository and install dependencies:
```bash
cd "Restaurant Billing App/RestaurantApp"
npm install
```

### 3. Supabase Configuration
1.  Create a new project on [Supabase](https://supabase.com/).
2.  Go to **SQL Editor** and run the scripts in the following order:
    *   Run `Sql Codes/01_main_schema.sql` (Creates tables and RLS)
    *   Run `Sql Codes/02_inventory_system.sql` (Enables stock management functions)
    *   Run `Sql Codes/03_staff_helpers.sql` (Enables staff profile creation)
3.  Copy your `SUPABASE_URL` and `SUPABASE_ANON_KEY` from Settings > API.
4.  Update the credentials in `supabase.ts`.

---

## 💻 Terminal Commands

| Command | Description |
| :--- | :--- |
| `npm install` | Install all required packages |
| `npx expo start` | Start the development server |
| `npx expo start --tunnel` | Start with a tunnel (useful for testing on remote devices) |
| `npm run android` | Run on Android Emulator |
| `npm run ios` | Run on iOS Simulator |

---

## 🗺️ Documentation & Testing

*   **[System Architecture](SYSTEM_ARCHITECTURE.md)**: Detailed technical overview and Mermaid diagram of the tech stack.
*   **[Automation Test Cases](automation_testcases.csv)**: 30+ Positive and Negative test scenarios for QA.

## 🗄️ SQL Files Organization

All database logic is organized in the `Sql Codes/` directory:

1.  **[01_main_schema.sql](Sql%20Codes/01_main_schema.sql)**: Core project tables and security policies.
2.  **[02_inventory_system.sql](Sql%20Codes/02_inventory_system.sql)**: Advanced inventory logic (Restocking, fractional units).
3.  **[03_staff_helpers.sql](Sql%20Codes/03_staff_helpers.sql)**: Helper functions for staff onboarding.

---
*Built with ❤️ for Restaurant Efficiency.*

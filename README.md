# DATAra Mobile Application

The premium mobile client for **DATAra** — a data consumption prediction and monitoring application designed in React Native using **Expo** and styled meticulously to match dark Figma mockups.

---

## 🎨 Design & Theme
The application incorporates a dark theme matching the Figma UI specifications:
- **Background**: Deep Navy/Dark Slate (`#0d1117`)
- **Card Backgrounds**: Sleek Dark Blue (`#1a1f2e` / `#1e293b`)
- **Primary Colors**: Green (`#16a34a`), Orange (`#ea580c`), Red (`#dc2626`), and Blue (`#3b82f6`) for status-driven indicator bars and alerts.
- **Typography**: Clean hierarchy with responsive weights and custom layouts for all screens.

---

## 📱 App Screens & Features

1. **Authentication Flow (`/app`)**:
   - **Login (`index.tsx`)**: Login with credentials and secure storage of session tokens via `AsyncStorage`.
   - **Register (`register.tsx`)**: Prompts user validation, password creation, and **strict Terms & Conditions acceptance** (enforced via a disabled state until checked).
   - **Forgot Password / OTP / Reset (`/Auth`)**: Complete, sequential flow for account recovery with clean form layouts.

2. **Dashboard (`/app/Tabs/dashboard.tsx`)**:
   - Displays real-time cellular data usage progress bars replacing circular charts.
   - Includes **Interactive Prediction Simulator** controls to dynamically adjust variables (`Remaining Data`, `Screen On Time`, `Battery Level`) to see instant changes.
   - Incorporates a **DataInsightCard** driven by real-time WebSocket notifications.

3. **History (`/app/Tabs/history.tsx`)**:
   - Detailed usage metrics logs filtered by time slots.
   - Integrates the **UsageTable** containing buttons to **Upload to Global** (copies local statistics to server repository) and **Download Local** (exports local datasets as a packaged `.zip` archive).

4. **Settings (`/app/Tabs/settings.tsx`)**:
   - Controls for Strict Data Saver and Theme toggles.
   - Hosts the **AI Prediction Report** modal, which fetches live aggregate summary statistics and model metrics (MAE, RMSE, R-squared) from the backend.

5. **Profile (`/app/Tabs/profile.tsx`)**:
   - Displays user credentials, provider details, and location codes.
   - Integrates an authenticated **Delete Account** flow (deactivates credentials and anonymizes username).

---

## 🚀 Setup & Development

1. **Install Node Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the `frontend` root directory:
   ```env
   EXPO_PUBLIC_API_URL=http://<your-django-server-ip>:8000
   EXPO_PUBLIC_WS_URL=ws://<your-django-server-ip>:8000
   ```

3. **Start Expo Development Server**:
   ```bash
   npx expo start
   ```
   Press `a` to open in an Android Emulator, `i` for iOS Simulator, or scan the QR code to run on a physical device using **Expo Go**.

4. **Production Web Export**:
   To bundle the app for web deployment:
   ```bash
   npx expo export:web
   ```

---

## 📡 Live Predictions & WebSockets

The frontend connects dynamically to the Django Channels server.
- **Connection Hook**: Established on dashboard load via a `WebSocket` instance pointed to the `/ws/predictions/` endpoint.
- **Dynamic Updates**: Modifying values in the simulator triggers a payload transmission via `ws.send()`. The received forecast instantly re-renders the insight texts without page refresh.
- **Robust Recovery**: Includes automatic reconnection logic that waits 3 seconds and rebuilds the handshake if the connection drops.

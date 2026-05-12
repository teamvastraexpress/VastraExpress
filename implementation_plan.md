# Native App for Vastra Express Driver

Build a React Native (Expo) app named `vastra-express-driver-native-app` that replicates the existing `vastra-express-driver-web` UI 1:1, wired to the **same backend** (no backend changes).

## Analysis Summary

The web app (`vastra-express-driver-web`) is a Next.js app with:
- **Auth**: Email + password login, first-time password change flow
- **Dashboard**: KPI cards (active pickups, deliveries, completed today) + active task list
- **Pickups page**: Filterable list (Active / Completed / All) with task cards
- **Deliveries page**: Same filterable list pattern for delivery tasks
- **Pickup detail**: Step-by-step flow (Start Trip → Arrived → Complete w/ weight modal)
- **Delivery detail**: Step-by-step flow (Start Trip → Arrived → Complete) + COD payment confirmation
- **Profile**: User info, contact info, employment details
- **Sidebar**: Navigation with Dashboard, Pickups, Deliveries, Profile, Completed Tasks shortcut, and Logout
- **Stores**: Zustand for auth (persist) and delivery state
- **API**: Axios instance at `http://localhost:3000/api` with JWT Bearer token

## Proposed Changes

### New directory: `vastra-express-driver-native-app`

A fresh Expo Router project using **expo-router v4** with the same architecture as the web app. The key technology mapping:

| Web (Next.js)         | Native (Expo)                       |
|-----------------------|-------------------------------------|
| Next.js pages/routes  | Expo Router file-based routing      |
| TailwindCSS           | React Native StyleSheet             |
| `next/link`           | Expo Router `Link` / `router.push` |
| `next/navigation`     | `expo-router` hooks                 |
| `react-hot-toast`     | `Alert` / custom toast component    |
| `lucide-react`        | `lucide-react-native`              |
| `js-cookie`           | `expo-secure-store`                 |
| `zustand/persist`     | `zustand/persist` + AsyncStorage    |
| `next/image`          | `Image` from react-native          |
| `clsx` + `tailwind-merge` | Not needed (StyleSheet)        |

### File Structure

```
vastra-express-driver-native-app/
├── app/
│   ├── _layout.tsx          # Root layout with auth check
│   ├── index.tsx            # Redirect to login or tabs
│   ├── (auth)/
│   │   └── login.tsx        # Login + change-password screen
│   └── (tabs)/
│       ├── _layout.tsx      # Tab navigation (replaces sidebar)
│       ├── index.tsx        # Dashboard
│       ├── pickups/
│       │   ├── index.tsx    # Pickup list
│       │   └── [id].tsx     # Pickup detail
│       ├── deliveries/
│       │   ├── index.tsx    # Delivery list
│       │   └── [id].tsx     # Delivery detail
│       └── profile.tsx      # Profile page
├── components/
│   ├── Badge.tsx
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Loading.tsx
│   ├── TaskCard.tsx
│   ├── KpiCard.tsx
│   ├── StepCard.tsx
│   ├── WeightModal.tsx
│   └── Toast.tsx
├── lib/
│   ├── api.ts               # Axios instance (same endpoints)
│   ├── tokenStorage.ts      # SecureStore token helpers
│   └── utils.ts             # Status colors, formatters
├── store/
│   ├── authStore.ts          # Same Zustand auth logic
│   └── deliveryStore.ts      # Same Zustand delivery logic
├── types/
│   └── index.ts              # Same TypeScript types
├── assets/
│   └── vastra-logo.png       # Logo asset
├── app.json
├── babel.config.js
├── tsconfig.json
├── package.json
└── .env.example
```

### Key Decisions

1. **Tab Navigation** replaces the web sidebar — more natural on mobile with bottom tabs for Dashboard, Pickups, Deliveries, and Profile
2. **Colors and spacing** will precisely match the web UI's violet/emerald theme using React Native StyleSheet values
3. **Same API endpoints** — no backend changes at all
4. **Same Zustand stores** logic — adapted for React Native (AsyncStorage instead of localStorage, SecureStore for tokens)
5. **Same step-by-step flow** for pickup/delivery detail screens
6. **COD payment confirmation** preserved exactly as in the web version

> [!IMPORTANT]
> The `NEXT_PUBLIC_API_URL` env var will be replaced with a configurable `API_URL` in the native app's config. For local development on a physical device, this should point to your machine's LAN IP instead of `localhost`.

## Verification Plan

### Automated Tests
- Run `npx expo start` to verify the app compiles and launches
- Confirm all screens render without runtime errors

### Manual Verification
- Compare each screen side-by-side with the web version to verify visual fidelity
- Test login flow, dashboard KPIs, task lists, detail pages, step actions

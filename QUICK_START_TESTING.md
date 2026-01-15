# Quick Start Testing Guide 🚀

This guide will help you quickly test the Gear AI CoPilot app using either the live web version or the iOS simulator with Expo Go.

## 🌐 Option 1: GitHub Pages (Web)

The fastest way to test the app - no installation required!

### Access the Live Demo

1. **Visit the live deployment:**
   - URL: https://mmanthe37.github.io/gear_ai_v1/
   
2. **What to expect:**
   - The app will load in your browser
   - You'll see a "🚧 Demo Mode - Using Mock Data" banner at the top
   - All UI elements are functional
   - Navigation between tabs works
   - VIN decoder uses real NHTSA API
   - Other features show mock/placeholder data

### Testing Steps (Web)

1. **Garage Screen (Home):**
   - View mock vehicles in the garage
   - Click the "+" button to add a vehicle
   - Test VIN decoder with: `1HGBH41JXMN109186`
   - Observe vehicle details populate from NHTSA API

2. **Diagnostics Tab:**
   - View placeholder diagnostic cards
   - Check the UI layout and styling
   - Note: OBD-II integration is Phase 2

3. **Maintenance Tab:**
   - Browse mock maintenance records
   - View cost tracking UI
   - Add service records (data won't persist)

4. **Manuals Tab:**
   - Browse placeholder owner's manuals
   - Test search functionality (UI only)

5. **AI Chat:**
   - Click on a vehicle to open chat
   - Send messages (mock responses only)
   - Note: Real AI integration is Phase 2

### Browser Compatibility

✅ **Supported Browsers:**
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

⚠️ **Known Limitations:**
- Some glassmorphism effects may vary by browser
- File upload features won't work on web (mobile only)
- Camera features are disabled

---

## 📱 Option 2: iOS Simulator with Expo Go

For the full native experience with all features.

### Prerequisites

Before you begin, ensure you have:

- **macOS** (required for iOS simulator)
- **Xcode Command Line Tools** installed
- **Node.js 18+** and npm
- **iOS Simulator** (comes with Xcode)

### Step 1: Install Xcode Command Line Tools

```bash
# Check if already installed
xcode-select -p

# If not installed, run:
xcode-select --install
```

### Step 2: Clone and Install

```bash
# Clone the repository
git clone https://github.com/mmanthe37/gear_ai_v1.git
cd gear_ai_v1

# Install dependencies
npm install
```

This may take 2-3 minutes depending on your connection.

### Step 3: Start the Development Server

```bash
npm start
```

You should see:

```
› Metro waiting on exp://192.168.1.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
```

### Step 4: Launch iOS Simulator

**Method 1: Keyboard Shortcut**
- Press `i` in the terminal where Metro is running
- iOS simulator will launch automatically
- Expo Go will install if needed
- Your app will open in Expo Go

**Method 2: Manual Launch**
```bash
# Open simulator manually
open -a Simulator

# Then press 'i' in the Metro terminal
```

### Step 5: Testing in iOS Simulator

The simulator should now show the Gear AI CoPilot app running in Expo Go.

**Test the following:**

1. ✅ App launches without errors
2. ✅ Demo mode banner appears at top
3. ✅ Navigation tabs are responsive
4. ✅ Animations and glassmorphism effects work smoothly
5. ✅ VIN decoder functions (real API call)
6. ✅ All screens load correctly
7. ✅ Modal dialogs open/close properly

### Troubleshooting iOS Simulator

#### Problem: "Could not connect to development server"

**Solution:**
```bash
# Stop the server (Ctrl+C)
# Clear Expo cache
npx expo start --clear

# Press 'i' again
```

#### Problem: Simulator doesn't open

**Solution:**
```bash
# List available simulators
xcrun simctl list devices

# Boot a specific simulator
xcrun simctl boot "iPhone 15"

# Then press 'i' in Metro terminal
```

#### Problem: "Developer Mode disabled"

**Solution:**
- iOS 16+ requires Developer Mode
- Simulator → Settings → Privacy & Security
- Enable Developer Mode
- Restart simulator

#### Problem: App shows white screen

**Solution:**
```bash
# Reload the app
# In the simulator: Cmd+D (opens dev menu)
# Select "Reload"

# Or in Metro terminal: Press 'r'
```

#### Problem: "Expo Go not compatible with SDK 53"

**Solution:**
```bash
# Update Expo Go in the simulator
# In simulator: Open App Store
# Search for "Expo Go"
# Update to latest version

# Or reinstall:
npx expo start --ios --clear
```

---

## 🌐 Option 3: Physical iPhone with Expo Go

You can also test on a real iPhone using Expo Go.

### Prerequisites

- iPhone running iOS 13.4 or later
- Expo Go app installed from App Store
- iPhone and computer on the same WiFi network

### Steps

1. **Install Expo Go on iPhone:**
   - Open App Store
   - Search for "Expo Go"
   - Install the app

2. **Start the dev server:**
   ```bash
   npm start
   ```

3. **Scan the QR code:**
   - Open Expo Go on your iPhone
   - Tap "Scan QR Code"
   - Point camera at the QR code in terminal
   - App will load in Expo Go

### Troubleshooting: Can't Connect?

**Solution: Use Tunnel Mode**

```bash
# Stop the server (Ctrl+C)
# Start with tunnel
npm run tunnel

# Or:
npx expo start --tunnel
```

Tunnel mode routes through Expo's servers, working even if devices aren't on the same network.

---

## ⚡ Quick Command Reference

```bash
# Start development server
npm start

# Start with specific platform
npm run ios          # iOS simulator
npm run android      # Android emulator
npm run web          # Web browser

# Start with tunnel (for remote testing)
npm run tunnel

# Build web version locally
npm run build        # Output: dist/

# Export for all platforms
npm run export:web   # Web export to dist/
```

---

## 🎯 Expected Behavior & Known Limitations

### ✅ What Works

- ✅ All UI screens and navigation
- ✅ VIN decoder (real NHTSA API integration)
- ✅ Glassmorphism and animations
- ✅ Tab navigation
- ✅ Modal dialogs
- ✅ Form inputs
- ✅ Photo selection UI (mobile only)

### ⚠️ What's Mock/Placeholder

- ⚠️ **Vehicle data**: Using mock garage data
- ⚠️ **Authentication**: No login required (bypassed)
- ⚠️ **AI Chat**: Mock responses only
- ⚠️ **Diagnostics**: Placeholder OBD-II data
- ⚠️ **Maintenance history**: Local storage only, not persisted
- ⚠️ **Manuals content**: Placeholder PDFs
- ⚠️ **Subscriptions**: UI only, no payment processing

### 🚧 Phase 2+ Features (Not Yet Implemented)

- RAG-powered manual chat (AI integration pending)
- Real-time OBD-II diagnostics (hardware integration pending)
- Persistent data storage (Supabase integration pending)
- User authentication (Firebase Auth pending)
- Photo damage detection (ML model pending)
- Real-time vehicle valuation (API integration pending)

---

## 📊 Testing Checklist

Use this checklist to verify everything works:

### Web Testing
- [ ] App loads at GitHub Pages URL
- [ ] Navigation between all 4 tabs works
- [ ] Mock vehicles display on Garage screen
- [ ] Add vehicle modal opens
- [ ] VIN decoder works: `1HGBH41JXMN109186`
- [ ] Vehicle details populate correctly
- [ ] Chat interface displays
- [ ] Maintenance screen shows mock records
- [ ] No critical console errors
- [ ] Glassmorphism effects render
- [ ] App is mobile-responsive

### iOS Simulator Testing
- [ ] App launches in Expo Go
- [ ] Demo banner shows at top
- [ ] All tabs navigate smoothly
- [ ] Animations perform well (60fps)
- [ ] VIN decoder API call succeeds
- [ ] Modals open/close correctly
- [ ] Keyboard interactions work
- [ ] No crash on any screen
- [ ] Dev menu accessible (Cmd+D)
- [ ] Fast refresh works (save file to reload)

---

## 🐛 Reporting Issues

If you encounter issues during testing:

1. **Check console for errors:**
   - Web: Browser DevTools → Console
   - iOS: Metro terminal shows errors

2. **Expected warnings (can ignore):**
   - "Demo mode active"
   - "Using mock data for [feature]"
   - "Backend not connected"

3. **Report unexpected errors:**
   - Open an issue on GitHub
   - Include: platform, error message, steps to reproduce
   - Screenshots help!

---

## 🚀 Next Steps

After testing, you can:

1. **Explore the codebase:**
   - `/app` - Expo Router screens
   - `/components` - Reusable UI components
   - `/services` - API integration services
   - `/types` - TypeScript definitions

2. **Read the documentation:**
   - [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design
   - [ROADMAP.md](docs/ROADMAP.md) - Development phases
   - [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) - Data structure

3. **Contribute:**
   - See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
   - Pick an issue from GitHub Issues
   - Submit a PR!

---

## 📞 Support

- **GitHub Issues:** https://github.com/mmanthe37/gear_ai_v1/issues
- **Documentation:** `/docs` directory
- **Expo Docs:** https://docs.expo.dev

---

**Happy Testing! 🎉**

Built with ❤️ for automotive enthusiasts and everyday drivers alike.

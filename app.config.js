module.exports = {
  expo: {
    name: "Gear AI CoPilot",
    slug: "gear-ai-copilot",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "gear-ai-copilot",
    userInterfaceStyle: "automatic",
    newArchEnabled: false,
    platforms: ["ios", "android", "web"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.gearai.copilot",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.gearai.copilot",
      edgeToEdgeEnabled: true,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      "expo-web-browser",
    ],
    experiments: {
      typedRoutes: true,
    },
    runtimeVersion: {
      policy: "sdkVersion",
    },
    extra: {
      eas: {
        projectId: "your-project-id-here",
      },
      // Firebase Configuration
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
      // Supabase Configuration
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },
};

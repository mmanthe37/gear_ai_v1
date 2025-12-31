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
    },
  },
};

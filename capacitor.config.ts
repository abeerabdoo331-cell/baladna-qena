/**
 * Capacitor configuration for packaging "بلدنا" as an Android APK.
 * Build web bundle with `npm run build`, then run:
 *   npx cap add android
 *   npx cap sync android
 *   npx cap open android
 */
const config = {
  appId: 'com.baladna.qena',
  appName: 'بلدنا',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

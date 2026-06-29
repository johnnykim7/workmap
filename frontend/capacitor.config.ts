import type { CapacitorConfig } from '@capacitor/cli';

// WorkMap 모바일 앱 셸 (CR-029, WMP-APP-001).
// 현 React/Vite 웹앱을 Capacitor 웹뷰로 iOS/Android 네이티브 셸에 탑재한다.
// 앱은 dev 프록시가 없으므로 운영 BE(59.8.160.12:8186)에 절대 URL로 접속한다.
const config: CapacitorConfig = {
  appId: 'com.therecommerce.workmap',
  appName: 'WorkMap',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    iosScheme: 'ionic',
    // 운영 BE가 http(8186)라 cleartext 필요 — HTTPS 전환 시 cleartext/allowNavigation 정리.
    cleartext: true,
    allowNavigation: ['59.8.160.12'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#ffffff',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;

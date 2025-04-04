// Firebase 구성 정보 - REST API 사용을 위한 모듈
// API 키 보호를 위해 환경 변수 사용

// Firebase 구성
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Firebase 접근 관리를 위한 모듈
const FirebaseAuthManager = {
  // 기본 화이어베이스 설정 정보
  config: firebaseConfig,
  
  // Firebase 데이터베이스 URL 가져오기 함수
  getDatabaseUrl() {
    return this.config.databaseURL;
  },
  
  // REST API 호출을 위한 URL 생성
  getAuthenticatedUrl(path) {
    const sanitizedPath = path.replace(/[.#$\[\]]/g, '_');
    // Firebase 규칙으로 보호된 공개 URL 사용
    return `${this.config.databaseURL}/${sanitizedPath}.json`;
  },
  
  // 초기화 함수
  initializeAuthentication() {
    console.log("[Firebase] 접근 초기화 성공");
    return true;
  }
};

// 내보내기
export default FirebaseAuthManager;
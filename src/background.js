// 환경 변수 및 기본 설정
const DEFAULT_SAVE_TO_FIREBASE = true;

// Firebase 인증 관리자 가져오기
import FirebaseAuthManager from './firebase-config';

// Firebase 관련 함수들을 모듈로 분리
const FirebaseService = {
  // Firebase REST API를 사용하여 데이터 저장
  async saveToFirebase(path, data) {
    // 인증 토큰 및 타임스탬프 추가
    data.authToken = FirebaseAuthManager.authToken;
    data.lastWrite = Date.now();
    console.log(`[Background] Firebase 저장 시도: ${path}`);
    
    try {
      // 인증 메서드를 통한 URL 호출
      const url = FirebaseAuthManager.getAuthenticatedUrl(path);
      
      // 요청 제한 - 초당 5개 이하로 제한
      const currentTime = Date.now();
      const lastRequestTime = this.lastRequestTime || 0;
      
      if (currentTime - lastRequestTime < 200) { // 최소 200ms 간격 유지
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      this.lastRequestTime = Date.now();
      
      console.log(`[Background] Firebase 요청 준비`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Firebase 저장 실패: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`[Background] Firebase 저장 성공`);
      return { success: true, message: "Firebase에 저장됨" };
    } catch (error) {
      console.error(`[Background] Firebase 저장 오류:`, error);
      return { success: false, message: error.message };
    }
  },
  
  // Firebase에서 가장 최근 캐릭터 데이터 가져오기
  async getLatestCharacterData(server, characterName) {
    console.log(`[Background] 최근 캐릭터 데이터 조회 시도: ${server}/${characterName}`);
    
    try {
      // 인코딩이나 특수문자 처리
      const path = `characters/${server}/${characterName}`;
      
      // 요청 제한 - 초당 5개 이하로 제한
      const currentTime = Date.now();
      const lastReadTime = this.lastReadTime || 0;
      
      if (currentTime - lastReadTime < 200) { // 최소 200ms 간격 유지 
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      this.lastReadTime = Date.now();
      
      // 인증 관리자를 통한 URL 생성
      const url = FirebaseAuthManager.getAuthenticatedUrl(path);
      
      console.log(`[Background] Firebase 조회 준비`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Firebase 조회 실패: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`[Background] Firebase 조회 성공`);
      
      // 결과가 없거나 빈 객체인 경우
      if (!result || Object.keys(result).length === 0) {
        return { success: true, data: null, message: "이전 데이터 없음" };
      }
      
      // 가장 최근 데이터 추출 (정렬하여 가장 최근것 선택)
      const keys = Object.keys(result).sort().reverse();
      const latestKey = keys[0];
      const latestData = result[latestKey];
      
      // 호환성을 위해 converted_zp 필드 확인
      if (latestData && latestData.converted_zp === undefined && latestData.zp_score !== undefined) {
        latestData.converted_zp = latestData.zp_score; // 이전 버전 호환성
      }
      
      return { success: true, data: latestData, message: "성공" };
    } catch (error) {
      console.error(`[Background] Firebase 조회 오류:`, error);
      return { success: false, data: null, message: error.message };
    }
  }
};

// 확장 프로그램 설치/업데이트 시 초기 설정
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] ZLoa History Tracker 설치/업데이트됨');
  
  // 기본 설정 저장
  chrome.storage.sync.set({
    saveToFirebase: DEFAULT_SAVE_TO_FIREBASE,
    simplifiedMode: true // 기본값은 간소화 모드 활성화
  });
});

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] 메시지 수신:', request);
  
  // 비동기 처리를 위해 Promise 사용
  (async () => {
    try {
      // 데이터 저장 요청 처리
      if (request.action === "saveData" && request.data) {
        // 저장 설정 가져오기
        const settings = await new Promise(resolve => 
          chrome.storage.sync.get(['saveToFirebase'], resolve)
        );
        
        const saveToFirebase = settings.saveToFirebase ?? DEFAULT_SAVE_TO_FIREBASE;
        
        const timestamp = new Date().toISOString();
        const characterName = request.data.charname || "unknown";
        const serverName = request.data.server || "unknown";
        const key = `zloa_${characterName}_${timestamp.replace(/[:.]/g, '_')}`;
        
        // Firebase 저장 로직
        const firebaseSaveResult = saveToFirebase 
          ? await FirebaseService.saveToFirebase(
              `characters/${serverName}/${characterName}/${timestamp.replace(/[:.]/g, '_')}`, 
              request.data
            )
          : { success: false, message: "Firebase 저장 비활성화됨" };
        
        // 저장 결과 구성
        const saveResult = {
          key: key,
          success: firebaseSaveResult.success,
          message: firebaseSaveResult.message,
          firebaseSave: firebaseSaveResult
        };
        
        console.log('[Background] 저장 결과:', saveResult);
        sendResponse(saveResult);
      }
      
      // 최근 캐릭터 데이터 조회 요청 처리
      if (request.action === "getLatestCharacterData" && request.server && request.character) {
        console.log(`[Background] 최근 데이터 조회 요청: ${request.server}/${request.character}`);
        
        // Firebase에서 가장 최근 데이터 가져오기
        const result = await FirebaseService.getLatestCharacterData(request.server, request.character);
        
        console.log('[Background] 최근 데이터 조회 결과:', result);
        sendResponse(result);
      }

      // 저장 설정 업데이트
      if (request.action === "updateSaveSettings") {
        await new Promise(resolve => 
          chrome.storage.sync.set({
            saveToFirebase: request.saveToFirebase
          }, resolve)
        );
        
        sendResponse({ 
          success: true, 
          message: "Firebase 저장 설정이 업데이트되었습니다." 
        });
      }

      // 현재 저장 설정 가져오기
      if (request.action === "getSaveSettings") {
        const settings = await new Promise(resolve => 
          chrome.storage.sync.get(['saveToFirebase'], resolve)
        );
        
        sendResponse({
          saveToFirebase: settings.saveToFirebase ?? DEFAULT_SAVE_TO_FIREBASE
        });
      }
    } catch (error) {
      console.error('[Background] 메시지 처리 중 오류:', error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    }
  })();

  // 비동기 응답을 위해 true 반환
  return true;
});

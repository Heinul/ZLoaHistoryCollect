/**
 * 스토리지 서비스 모듈
 * 로컬 및 원격 데이터 저장, 조회 기능 담당
 */

// 마지막 저장 시간 기록
let lastSavedTime = null;

/**
 * 확장 프로그램 컨텍스트가 유효한지 확인
 * @returns {boolean} 컨텍스트 유효 여부
 */
function isExtensionContextValid() {
  try {
    chrome.runtime.getURL("");
    return true;
  } catch (e) {
    console.error("[ZLoa History Tracker] 확장 프로그램 컨텍스트 무효화됨");
    return false;
  }
}

/**
 * 확장 프로그램 사용 설정 불러오기
 * @returns {Promise<boolean>} 사용 여부 설정 값
 */
function isExtensionEnabled() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['extensionEnabled'], (result) => {
      resolve(result.extensionEnabled ?? true); // 기본값은 true
    });
  });
}

/**
 * 간소화 모드 설정 불러오기
 * @returns {Promise<boolean>} 간소화 모드 설정 값
 */
function getSimplifiedMode() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['simplifiedMode'], (result) => {
      resolve(result.simplifiedMode ?? true); // 기본값은 true
    });
  });
}

/**
 * 이전에 저장된 데이터와 환산점수 비교
 * @param {string} characterName 캐릭터 이름
 * @param {string} serverName 서버 이름
 * @param {number} score 환산점수
 * @returns {Promise<boolean>} 이전과 동일한 점수면 true
 */
async function checkPreviouslySavedData(characterName, serverName, score) {
  if (!characterName || !serverName || score === undefined) {
    return false; // 비교 불가능한 경우
  }

  // 로컬 캐시 확인
  const cacheKey = `zloa_${characterName}_${serverName}_score`;
  try {
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      const cache = JSON.parse(cachedData);
      const cachedTimestamp = cache.timestamp || 0;
      const currentTime = Date.now();
      
      // 캐시가 5분 이내인 경우 사용
      if (currentTime - cachedTimestamp < 5 * 60 * 1000) {
        const previousScore = parseFloat(cache.score) || 0;
        const currentScore = parseFloat(score) || 0;
        
        console.log(`[ZLoa History Tracker] 캐시된 환산점수 비교: 이전=${previousScore}, 현재=${currentScore}`);
        const isSameScore = Math.abs(previousScore - currentScore) < 0.01;
        
        if (isSameScore) {
          console.log(`[ZLoa History Tracker] 환산점수 동일(캐시됨), 저장 건너뜀`);
          return true;
        }
        
        // 새로운 점수 캐시 업데이트
        if (currentScore > 0) {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            score: currentScore,
            timestamp: currentTime
          }));
        }
        
        return false;
      }
    }
  } catch (e) {
    console.error("[ZLoa History Tracker] 캐시 확인 오류:", e);
    // 캐시 오류시 무시하고 서버 조회로 진행
  }

  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: "getLatestCharacterData",
      server: serverName,
      character: characterName
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("[ZLoa History Tracker] 이전 데이터 조회 오류:", chrome.runtime.lastError);
        resolve(false);
        return;
      }

      // 이전 데이터가 없거나 조회 실패한 경우
      if (!response || !response.success || !response.data) {
        console.log("[ZLoa History Tracker] 이전 데이터 없음, 저장 진행");
        
        // 현재 점수를 캐시에 저장
        if (parseFloat(score) > 0) {
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({
              score: parseFloat(score),
              timestamp: Date.now()
            }));
          } catch (e) {
            console.error("[ZLoa History Tracker] 캐시 저장 오류:", e);
          }
        }
        
        resolve(false);
        return;
      }

      // 이전 데이터와 현재 환산점수 비교
      const previousScore = parseFloat(response.data.converted_zp || response.data.zp_score) || 0;
      const currentScore = parseFloat(score) || 0;

      console.log(`[ZLoa History Tracker] 환산점수 비교: 이전=${previousScore}, 현재=${currentScore}`);

      // 점수가 같으면 true 반환 (저장 안함), 다르면 false 반환 (저장함)
      const isSameScore = Math.abs(previousScore - currentScore) < 0.01; // 부동소수점 비교를 위한 허용 오차
      
      // 캐시 업데이트
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          score: isSameScore ? previousScore : currentScore,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error("[ZLoa History Tracker] 캐시 저장 오류:", e);
      }
      
      if (isSameScore) {
        console.log(`[ZLoa History Tracker] 환산점수 동일(${previousScore}), 저장 건너뜀`);
      }

      resolve(isSameScore);
    });
  });
}

/**
 * 캐릭터 데이터 저장
 * @param {Object} data 저장할 캐릭터 데이터
 * @returns {Promise<Object>} 저장 결과 객체
 */
async function saveCharacterData(data) {
  try {
    if (!isExtensionContextValid()) {
      console.error("[ZLoa History Tracker] 확장 프로그램 컨텍스트가 무효화되었습니다.");
      return { success: false, message: "확장 프로그램 오류" };
    }

    // 환산점수가 같은 경우 저장하지 않음
    // API 응답에서 converted_zp 또는 zp_score 필드를 사용
    const scoreToCompare = data.converted_zp !== undefined ? data.converted_zp : data.zp_score;
    
    const isSameScore = await checkPreviouslySavedData(data.charname, data.server, scoreToCompare);
    if (isSameScore) {
      return { success: true, skipped: true, message: "환산점수가 변경되지 않아 저장을 건너뜁니다." };
    }

    const timestamp = new Date().toISOString();
    data.saved_at = timestamp;
    
    console.log("[ZLoa History Tracker] 데이터 저장 요청");
    
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: "saveData",
        data: data
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("[ZLoa History Tracker] 메시지 전송 오류:", chrome.runtime.lastError);
          resolve({ success: false, message: chrome.runtime.lastError.message });
          return;
        }

        console.log("[ZLoa History Tracker] 저장 응답 수신");
        
        // 응답 성공 여부 확인
        if (response && (response.localSave?.success || response.firebaseSave?.success)) {
          lastSavedTime = new Date().toLocaleString();
          resolve({ success: true, message: "저장 성공" });
        } else {
          resolve({ success: false, message: "저장 실패" });
        }
      });
    });
  } catch (error) {
    console.error("[ZLoa History Tracker] 데이터 저장 오류:", error);
    return { success: false, message: error.message };
  }
}

/**
 * 마지막 저장 시간 반환
 * @returns {string|null} 마지막 저장 시간 (없으면 null)
 */
function getLastSavedTime() {
  return lastSavedTime;
}

// 모듈 내보내기
export {
  isExtensionContextValid,
  isExtensionEnabled,
  getSimplifiedMode,
  saveCharacterData,
  getLastSavedTime
};

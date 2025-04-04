// 데이터 저장 및 관리 서비스

// 크롬 로컬 스토리지에 데이터 저장
export function saveToLocalStorage(key, data) {
  try {
    chrome.storage.local.set({ [key]: data }, () => {
      console.log(`[ZLoa History Tracker] 로컬 스토리지에 ${key} 저장 완료`);
    });
    return true;
  } catch (error) {
    console.error(`[ZLoa History Tracker] 로컬 스토리지 저장 오류: ${error}`);
    return false;
  }
}

// 크롬 로컬 스토리지에서 데이터 조회
export function getFromLocalStorage(key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key] || null);
      });
    } catch (error) {
      console.error(`[ZLoa History Tracker] 로컬 스토리지 조회 오류: ${error}`);
      reject(error);
    }
  });
}

// 저장된 캐릭터 목록 관리
export async function addCharacterToHistory(characterInfo) {
  if (!characterInfo || !characterInfo.charname) return false;
  
  try {
    // 기존 기록 가져오기
    const histories = await getFromLocalStorage('characterHistories') || [];
    
    // 새로운 기록 추가
    const newHistory = {
      charname: characterInfo.charname,
      server: characterInfo.server,
      class: characterInfo.class,
      temlv: characterInfo.temlv,
      savedAt: new Date().toISOString()
    };
    
    // 중복 제거 (같은 캐릭터가 있으면 최신 기록만 유지)
    const filteredHistories = histories.filter(h => 
      h.charname !== characterInfo.charname || h.server !== characterInfo.server
    );
    
    // 새 기록 추가
    filteredHistories.unshift(newHistory);
    
    // 최대 50개 기록만 유지
    if (filteredHistories.length > 50) {
      filteredHistories.length = 50;
    }
    
    // 저장
    return saveToLocalStorage('characterHistories', filteredHistories);
  } catch (error) {
    console.error(`[ZLoa History Tracker] 캐릭터 히스토리 관리 오류: ${error}`);
    return false;
  }
}

// 캐릭터 히스토리 가져오기
export async function getCharacterHistories() {
  return await getFromLocalStorage('characterHistories') || [];
}

// 오프라인 저장 데이터 관리
export async function addOfflineData(data) {
  try {
    // 기존 오프라인 데이터 가져오기
    const offlineData = await getFromLocalStorage('offlineData') || [];
    
    // 새 데이터 추가
    offlineData.push({
      data: data,
      timestamp: new Date().toISOString(),
      synced: false
    });
    
    return saveToLocalStorage('offlineData', offlineData);
  } catch (error) {
    console.error(`[ZLoa History Tracker] 오프라인 데이터 저장 오류: ${error}`);
    return false;
  }
}

// 동기화되지 않은 오프라인 데이터 가져오기
export async function getUnsyncedOfflineData() {
  const offlineData = await getFromLocalStorage('offlineData') || [];
  return offlineData.filter(item => !item.synced);
}

// 오프라인 데이터 동기화 상태 업데이트
export async function updateOfflineDataSyncStatus(index, synced = true) {
  try {
    const offlineData = await getFromLocalStorage('offlineData') || [];
    if (index >= 0 && index < offlineData.length) {
      offlineData[index].synced = synced;
      return saveToLocalStorage('offlineData', offlineData);
    }
    return false;
  } catch (error) {
    console.error(`[ZLoa History Tracker] 오프라인 동기화 상태 업데이트 오류: ${error}`);
    return false;
  }
}

// Firebase 서비스 모듈
import FirebaseAuthManager from './firebase-config';

// Firebase에 데이터 저장하는 함수
export async function saveData(path, data) {
  // 인증 토큰 및 타임스탬프 추가
  data.authToken = FirebaseAuthManager.authToken;
  data.lastWrite = Date.now();
  try {
    // 인증 된 URL을 사용하여 API 호출
    const url = FirebaseAuthManager.getAuthenticatedUrl(path);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`데이터 저장 실패: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`[ZLoa History Tracker] 데이터가 ${path}에 저장되었습니다.`, result);
    return { success: true, message: "저장 성공" };
  } catch (error) {
    console.error("[ZLoa History Tracker] 데이터 저장 오류:", error);
    return { success: false, message: error.message };
  }
}

// Firebase에서 데이터 조회하는 함수
export async function getData(path) {
  try {
    // 인증 된 URL을 사용하여 API 호출
    const url = FirebaseAuthManager.getAuthenticatedUrl(path);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`데이터 조회 실패: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("[ZLoa History Tracker] 데이터 조회 오류:", error);
    return null;
  }
}

// 캐릭터 정보를 파이어베이스에 저장하는 함수
export async function saveCharacterInfo(data) {
  if (!data || !data.charname || !data.server) {
    console.error("[ZLoa History Tracker] 유효하지 않은 캐릭터 데이터:", data);
    return { success: false, message: "유효하지 않은 데이터" };
  }

  // 타임스탬프 추가
  const timestamp = new Date().toISOString();
  data.saved_at = timestamp;
  
  // 캐릭터명으로 경로 생성 (특수문자 처리)
  const characterName = data.charname;
  const serverName = data.server;
  const path = `characters/${serverName}/${characterName}/${timestamp.replace(/[.]/g, '-')}`;
  
  return await saveData(path, data);
}

// 최근 저장된 캐릭터 목록 조회
export async function getRecentCharacters(limit = 10) {
  try {
    const result = await getData('characters');
    if (!result) return [];
    
    // 모든 서버와 캐릭터를 평탄화하여 가장 최근 수 개를 추출
    const characters = [];
    
    for (const server in result) {
      for (const character in result[server]) {
        const characterData = result[server][character];
        const timestamps = Object.keys(characterData).sort().reverse();
        
        if (timestamps.length > 0) {
          const latestData = characterData[timestamps[0]];
          characters.push({
            name: character,
            server: server,
            timestamp: timestamps[0],
            data: latestData
          });
        }
      }
    }
    
    // 시간 기준 정렬 후 제한된 개수만 반환
    return characters
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error("[ZLoa History Tracker] 최근 캐릭터 조회 오류:", error);
    return [];
  }
}

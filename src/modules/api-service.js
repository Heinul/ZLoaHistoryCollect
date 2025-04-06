/**
 * API 서비스 모듈
 * zloa.net API와의 통신을 처리
 */

/**
 * API를 통해 캐릭터 데이터를 가져오는 함수
 * @returns {Promise<Object>} API 응답 데이터 또는 에러 객체
 */
async function fetchCharacterData() {
  console.log("[ZLoa History Tracker] API에서 데이터 가져오기 시작");
  
  try {
    // 현재 URL에서 캐릭터 정보 추출
    const currentUrl = window.location.href;
    
    // API URL로 변환 (zloa.net/char/모주뱅 -> api.zloa.net/zp/char/모주뱅)
    let apiUrl;
    
    if (currentUrl.includes('zloa.net/char/')) {
      // 캐릭터 이름 추출 및 URL 인코딩
      const charNameMatch = currentUrl.match(/zloa\.net\/char\/([^?&#]+)/);
      if (!charNameMatch || !charNameMatch[1]) {
        throw new Error("URL에서 캐릭터 이름을 추출할 수 없습니다.");
      }
      
      const charName = decodeURIComponent(charNameMatch[1]);
      
      // 영어와 숫자는 인코딩하지 않고, 한글과 특수문자만 인코딩
      const encodedCharName = charName.replace(/[^a-zA-Z0-9]/g, match => {
        return encodeURIComponent(match);
      });
      
      // API URL 생성
      apiUrl = `https://api.zloa.net/zp/char/${encodedCharName}`;
    } else {
      throw new Error("지원되지 않는 URL 형식입니다.");
    }
    
    console.log(`[ZLoa History Tracker] API 요청 URL: ${apiUrl}`);
    
    // API 호출
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ZLoa History Tracker Extension/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
    }
    
    // JSON 데이터 파싱
    const data = await response.json();
    
    // 데이터 검증
    if (!data || !data.charname) {
      throw new Error("API에서 유효한 캐릭터 데이터를 받지 못했습니다.");
    }
    
    console.log("[ZLoa History Tracker] API 데이터 수신 성공:", data);
    
    // 필수 필드를 추가하여 데이터 보강
    data.observed_at = new Date().toISOString();
    
    return data;
  } catch (error) {
    console.error("[ZLoa History Tracker] API 데이터 가져오기 오류:", error);
    return {
      hasError: true,
      errorType: "apiError",
      message: `API 데이터를 가져오는데 실패했습니다: ${error.message}`
    };
  }
}

// 모듈 내보내기
export {
  fetchCharacterData
};

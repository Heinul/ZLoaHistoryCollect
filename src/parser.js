// 캐릭터 정보 파싱 모듈

// 환산 점수 페이지에서 캐릭터 정보를 파싱하는 함수
export function parseCharacterInfo(document) {
  try {
    console.log("[ZLoa History Tracker] 캐릭터 정보 파싱 시작");
    
    // 캐릭터 이름
    const characterNameCell = document.querySelector('table tbody tr:first-child td:nth-child(2)');
    const characterName = characterNameCell ? characterNameCell.textContent.trim() : null;
    
    if (!characterName) {
      console.log("[ZLoa History Tracker] 캐릭터 이름을 찾을 수 없습니다");
      return null;
    }

    // 서버 정보
    const serverCell = document.querySelector('table tbody tr:nth-child(9) td:nth-child(2)');
    const server = serverCell ? serverCell.textContent.trim() : null;

    // 환산 점수
    const scoreCell = document.querySelector('table tbody tr:nth-child(3) td:nth-child(2)');
    const score = scoreCell ? parseFloat(scoreCell.textContent.trim()) : 0;

    // 아이템 레벨
    const itemLevelCell = document.querySelector('table tbody tr:nth-child(8) td:nth-child(2)');
    const itemLevel = itemLevelCell ? parseFloat(itemLevelCell.textContent.trim()) : 0;

    // 클래스
    const classCell = document.querySelector('table tbody tr:nth-child(7) td:nth-child(2)');
    const characterClass = classCell ? classCell.textContent.trim().split(' ')[1] || classCell.textContent.trim() : null;

    // 빌드
    const buildCell = document.querySelector('table tbody tr:nth-child(6) td:nth-child(2)');
    const build = buildCell ? buildCell.textContent.trim() : null;

    // 계산된 시각
    const timeCell = document.querySelector('table tbody tr:nth-child(10) td:nth-child(2)');
    const calculatedAt = timeCell ? timeCell.textContent.trim() : new Date().toLocaleTimeString();

    // 서포터 여부 확인 (클래스 또는 빌드 정보로 판단)
    const isSupportClass = characterClass && ['바드', '홀리나이트', '도화가'].includes(characterClass);
    
    // 결과 객체 생성
    const result = {
      charname: characterName,
      server: server,
      class: characterClass,
      zp_score: score,
      temlv: itemLevel,
      build: build,
      is_sup: isSupportClass,
      calculated_at: calculatedAt,
      observed_at: new Date().toISOString()
    };

    console.log("[ZLoa History Tracker] 파싱된 캐릭터 정보:", result);
    return result;
  } catch (error) {
    console.error("[ZLoa History Tracker] 캐릭터 정보 파싱 오류:", error);
    return null;
  }
}

// 환산 점수 상세 영수증 파싱
export function parseReceiptInfo(document) {
  try {
    console.log("[ZLoa History Tracker] 환산 점수 영수증 파싱 시작");
    
    const receiptTable = document.querySelector('.rounded-xl:nth-child(2) table');
    if (!receiptTable) {
      console.log("[ZLoa History Tracker] 환산 점수 영수증 테이블을 찾을 수 없습니다");
      return null;
    }

    const receiptRows = receiptTable.querySelectorAll('tbody tr');
    const receipt = {};

    receiptRows.forEach(row => {
      const specName = row.querySelector('td:first-child');
      const specValue = row.querySelector('td:last-child');
      
      if (specName && specValue) {
        const name = specName.textContent.trim();
        const valueText = specValue.textContent.trim();
        // % 제거하고 숫자로 변환
        const value = parseFloat(valueText.replace('%', ''));
        
        if (!isNaN(value)) {
          receipt[name] = value;
        }
      }
    });

    console.log("[ZLoa History Tracker] 파싱된 환산 점수 영수증:", receipt);
    return receipt;
  } catch (error) {
    console.error("[ZLoa History Tracker] 환산 점수 영수증 파싱 오류:", error);
    return null;
  }
}

// 전체 데이터 파싱 (캐릭터 정보 + 영수증)
export function parseFullData(document) {
  const characterInfo = parseCharacterInfo(document);
  const receiptInfo = parseReceiptInfo(document);
  
  if (!characterInfo) {
    return null;
  }
  
  // 영수증 정보가 있으면 추가
  if (receiptInfo) {
    characterInfo.receipt = receiptInfo;
  }
  
  return characterInfo;
}

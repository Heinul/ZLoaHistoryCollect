/**
 * UI 컴포넌트 모듈
 * 사용자 인터페이스 요소 생성 및 관리 기능 담당
 */

import { getCurrentTheme } from './theme-manager.js';
import { fetchCharacterData } from './api-service.js';
import { isExtensionContextValid, saveCharacterData } from './storage-service.js';

// 상태 변수
let isSimplifiedMode = true;

/**
 * 간소화 모드 설정
 * @param {boolean} simplified 간소화 모드 여부
 */
function setSimplifiedMode(simplified) {
  isSimplifiedMode = simplified;
  applySimplifiedMode();
}

/**
 * 간소화 모드를 UI에 적용
 */
function applySimplifiedMode() {
  const statusDivs = document.querySelectorAll('#zloaHistoryStatus');
  
  statusDivs.forEach(statusDiv => {
    if (isSimplifiedMode) {
      statusDiv.style.display = 'none';
    } else {
      statusDiv.style.display = 'block';
    }
  });
}

/**
 * 저장 버튼 생성
 */
function createSaveButtonUI() {
  console.log("[ZLoa History Tracker] 저장 버튼 생성 시도");
  
  if (document.getElementById('zloaHistorySaveBtn')) {
    console.log("[ZLoa History Tracker] 이미 버튼이 존재합니다");
    return;
  }
  
  const containerSelectors = [
    '.rounded-xl',
    '[data-testid="character-details"]',
    '#character-info-container'
  ];
  
  let containerDiv = null;
  for (const selector of containerSelectors) {
    containerDiv = document.querySelector(selector);
    if (containerDiv) break;
  }
  
  if (!containerDiv) {
    console.log("[ZLoa History Tracker] 버튼을 삽입할 위치를 찾을 수 없습니다.");
    return;
  }
  
  const buttonContainer = createButtonContainer();
  const saveButton = createSaveButton();
  const statusDiv = createStatusDiv();
  
  // 저장 버튼 클릭 이벤트 등록
  saveButton.addEventListener('click', async () => await handleSaveButtonClick(statusDiv));
  
  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(statusDiv);
  
  containerDiv.parentNode.insertBefore(buttonContainer, containerDiv);
  
  console.log("[ZLoa History Tracker] 저장 버튼이 생성되었습니다.");
}

/**
 * 버튼 컨테이너 요소 생성
 * @returns {HTMLElement} 생성된 버튼 컨테이너
 */
function createButtonContainer() {
  const currentTheme = getCurrentTheme();
  const buttonContainer = document.createElement('div');
  
  buttonContainer.setAttribute('data-zloa-button-container', 'true');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexDirection = 'column';
  buttonContainer.style.gap = '8px';
  buttonContainer.style.margin = '10px 0';
  buttonContainer.style.padding = '10px';
  
  // 테마에 따른 초기 스타일 설정
  if (currentTheme === 'dark') {
    buttonContainer.style.backgroundColor = '#151619';
    buttonContainer.style.border = '1px solid #333';
  } else {
    buttonContainer.style.backgroundColor = '#f5f5f5';
    buttonContainer.style.border = '1px solid #ddd';
  }
  
  return buttonContainer;
}

/**
 * 저장 버튼 요소 생성
 * @returns {HTMLElement} 생성된 저장 버튼
 */
function createSaveButton() {
  const currentTheme = getCurrentTheme();
  const saveButton = document.createElement('button');
  
  saveButton.id = 'zloaHistorySaveBtn';
  saveButton.textContent = '캐릭터 정보 저장';
  saveButton.style.padding = '8px 12px';
  saveButton.style.border = 'none';
  saveButton.style.borderRadius = '4px';
  saveButton.style.cursor = 'pointer';
  saveButton.style.fontWeight = 'bold';
  
  // 테마에 따른 버튼 스타일 설정
  if (currentTheme === 'dark') {
    saveButton.style.backgroundColor = '#1F2641';
    saveButton.style.color = '#e0e0e0';
  } else {
    saveButton.style.backgroundColor = '#4285f4';
    saveButton.style.color = 'white';
  }
  
  return saveButton;
}

/**
 * 상태 메시지 요소 생성
 * @returns {HTMLElement} 생성된 상태 메시지 요소
 */
function createStatusDiv() {
  const currentTheme = getCurrentTheme();
  const statusDiv = document.createElement('div');
  
  statusDiv.id = 'zloaHistoryStatus';
  statusDiv.style.marginTop = '8px';
  statusDiv.style.padding = '8px';
  statusDiv.style.borderRadius = '4px';
  statusDiv.style.fontSize = '13px';
  
  // 테마에 따른 상태 메시지 스타일 설정
  if (currentTheme === 'dark') {
    statusDiv.style.backgroundColor = '#2a2a2a';
    statusDiv.style.color = '#b0b0b0';
    statusDiv.style.border = '1px solid #444';
  } else {
    statusDiv.style.backgroundColor = '#ffffff';
    statusDiv.style.color = '#333';
    statusDiv.style.border = '1px solid #ddd';
  }
  
  // 간소화 모드 즉시 적용
  statusDiv.style.display = isSimplifiedMode ? 'none' : 'block';
  
  statusDiv.textContent = '캐릭터 정보를 저장하려면 버튼을 클릭하세요.';
  
  return statusDiv;
}

/**
 * 저장 버튼 클릭 핸들러
 * @param {HTMLElement} statusDiv 상태 메시지 요소
 */
async function handleSaveButtonClick(statusDiv) {
  if (!isExtensionContextValid()) {
    statusDiv.textContent = '확장 프로그램이 다시 로드되었습니다. 페이지를 새로고침하세요.';
    statusDiv.style.color = '#db4437';
    statusDiv.style.display = 'block'; // 오류시엔 간소화 모드에서도 표시
    return;
  }
  
  statusDiv.textContent = 'API에서 데이터 가져오는 중...';
  statusDiv.style.color = '#4285f4';
  statusDiv.style.display = isSimplifiedMode ? 'none' : 'block';
  
  // API를 통해 데이터 가져오기
  const result = await fetchCharacterData();
  
  // 오류 처리
  if (result && result.hasError) {
    statusDiv.textContent = result.message;
    statusDiv.style.color = '#db4437';
    statusDiv.style.display = 'block'; // 오류시엔 간소화 모드에서도 표시
    return;
  }
  
  if (!result) {
    statusDiv.textContent = 'API 데이터 가져오기 실패. 페이지를 새로고침하고 다시 시도하세요.';
    statusDiv.style.color = '#db4437';
    statusDiv.style.display = 'block'; // 오류시엔 간소화 모드에서도 표시
    return;
  }
  
  statusDiv.textContent = '저장 중...';
  statusDiv.style.color = '#4285f4';
  statusDiv.style.display = isSimplifiedMode ? 'none' : 'block';
  
  const saveResult = await saveCharacterData(result);
  
  if (saveResult.success) {
    if (saveResult.skipped) {
      // 환산점수 동일로 저장 건너뛴 경우
      statusDiv.textContent = `${result.charname}: ${saveResult.message}`;
      statusDiv.style.color = '#ff9800'; // 주황색으로 표시 (경고)
      statusDiv.style.display = 'block'; // 이 경우 간소화 모드에서도 표시
      
      // 간소화 모드인 경우 2초 후에 상태 메시지 숨기기
      if (isSimplifiedMode) {
        setTimeout(() => {
          statusDiv.style.display = 'none';
        }, 2000);
      }
    } else {
      // 정상 저장된 경우
      statusDiv.textContent = `${result.charname} 데이터가 성공적으로 저장되었습니다.`;
      statusDiv.style.color = '#0f9d58'; // 녹색
      statusDiv.style.display = 'block';
      
      // 간소화 모드인 경우 2초 후에 상태 메시지 숨기기
      if (isSimplifiedMode) {
        setTimeout(() => {
          statusDiv.style.display = 'none';
        }, 2000);
      }
    }
  } else {
    // 저장 실패한 경우
    statusDiv.textContent = saveResult.message || '데이터 저장 실패. 콘솔을 확인하세요.';
    statusDiv.style.color = '#db4437'; // 빨간색
    statusDiv.style.display = 'block'; // 오류시엔 간소화 모드에서도 표시
    
    // 간소화 모드인 경우에도 오류는 2초 후 숨김
    if (isSimplifiedMode) {
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 2000);
    }
  }
}

/**
 * 상태 메시지 숨기기 (간소화 모드 전환 시)
 */
function hideStatusMessages() {
  const statusDivs = document.querySelectorAll('#zloaHistoryStatus');
  statusDivs.forEach(statusDiv => {
    statusDiv.style.display = 'none';
  });
}

// 모듈 내보내기
export {
  setSimplifiedMode,
  applySimplifiedMode,
  createSaveButtonUI,
  hideStatusMessages
};

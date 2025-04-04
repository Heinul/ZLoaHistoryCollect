// UI 관련 헬퍼 함수들

// 저장 버튼 생성 함수
export function createSaveButton(container, nextElement, onSave, onTest) {
  // 이미 버튼이 있는지 확인
  if (document.getElementById('zloaHistorySaveBtn')) {
    console.log('[ZLoa History Tracker] 저장 버튼이 이미 존재합니다.');
    return null;
  }
  
  // 버튼 컨테이너 생성
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'zloaHistoryButtonContainer';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.flexDirection = 'column';
  buttonContainer.style.gap = '8px';
  buttonContainer.style.margin = '10px 0';
  buttonContainer.style.padding = '0 10px';
  
  // 저장 버튼 생성
  const saveButton = document.createElement('button');
  saveButton.id = 'zloaHistorySaveBtn';
  saveButton.textContent = '캐릭터 정보 저장';
  saveButton.style.padding = '8px 12px';
  saveButton.style.backgroundColor = '#4285f4';
  saveButton.style.color = 'white';
  saveButton.style.border = 'none';
  saveButton.style.borderRadius = '4px';
  saveButton.style.cursor = 'pointer';
  saveButton.style.fontWeight = 'bold';
  
  // 테스트 데이터 버튼 생성
  const testButton = document.createElement('button');
  testButton.id = 'zloaHistoryTestBtn';
  testButton.textContent = '테스트 데이터 발송';
  testButton.style.padding = '8px 12px';
  testButton.style.backgroundColor = '#0f9d58';
  testButton.style.color = 'white';
  testButton.style.border = 'none';
  testButton.style.borderRadius = '4px';
  testButton.style.cursor = 'pointer';
  testButton.style.fontWeight = 'bold';
  
  // 상태 표시 요소 생성
  const statusDiv = document.createElement('div');
  statusDiv.id = 'zloaHistoryStatus';
  statusDiv.style.marginTop = '8px';
  statusDiv.style.padding = '8px';
  statusDiv.style.backgroundColor = '#f5f5f5';
  statusDiv.style.borderRadius = '4px';
  statusDiv.style.fontSize = '13px';
  statusDiv.textContent = '캐릭터 정보를 저장하려면 버튼을 클릭하세요.';
  
  // 저장 버튼 클릭 이벤트
  saveButton.addEventListener('click', async () => {
    updateStatus('저장 중...', '#4285f4');
    if (typeof onSave === 'function') {
      await onSave(statusDiv);
    }
  });
  
  // 테스트 버튼 클릭 이벤트
  testButton.addEventListener('click', async () => {
    updateStatus('테스트 데이터 발송 중...', '#4285f4');
    if (typeof onTest === 'function') {
      await onTest(statusDiv);
    }
  });
  
  // 버튼 컨테이너에 요소 추가
  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(testButton);
  buttonContainer.appendChild(statusDiv);
  
  // DOM에 버튼 컨테이너 삽입
  if (container && nextElement) {
    container.parentNode.insertBefore(buttonContainer, nextElement);
    console.log('[ZLoa History Tracker] 저장 버튼이 생성되었습니다.');
    return { buttonContainer, saveButton, testButton, statusDiv };
  } else {
    console.error('[ZLoa History Tracker] 버튼을 삽입할 위치를 찾을 수 없습니다.');
    return null;
  }
}

// 상태 업데이트 함수
export function updateStatus(message, color = null) {
  const statusDiv = document.getElementById('zloaHistoryStatus');
  if (statusDiv) {
    statusDiv.textContent = message;
    if (color) {
      statusDiv.style.color = color;
    }
  }
}

// 성공 상태 업데이트
export function updateStatusSuccess(message) {
  updateStatus(message, '#0f9d58');
}

// 오류 상태 업데이트
export function updateStatusError(message) {
  updateStatus(message, '#db4437');
}

// 로딩 상태 업데이트
export function updateStatusLoading(message) {
  updateStatus(message, '#4285f4');
}

// 특정 셀렉터의 요소 감시 (DOM 변화 감지)
export function watchForElement(selector, callback, maxAttempts = 10, interval = 500) {
  let attempts = 0;
  
  const checkElement = () => {
    const element = document.querySelector(selector);
    
    if (element) {
      callback(element);
      return true;
    }
    
    attempts++;
    if (attempts >= maxAttempts) {
      console.log(`[ZLoa History Tracker] ${selector} 요소를 찾지 못했습니다.`);
      return false;
    }
    
    return false;
  };
  
  // 즉시 한 번 확인
  if (checkElement()) return;
  
  // 주기적으로 확인
  const intervalId = setInterval(() => {
    if (checkElement()) {
      clearInterval(intervalId);
    }
  }, interval);
  
  return intervalId;
}

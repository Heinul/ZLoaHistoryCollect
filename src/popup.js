document.addEventListener('DOMContentLoaded', () => {
  const extensionUsageToggle = document.getElementById('extensionUsageToggle');
  const simplifiedModeToggle = document.getElementById('simplifiedModeToggle');
  const statusMessage = document.getElementById('statusMessage');

  // 로그 함수
  function debugLog(message) {
    console.log(`[ZLoa History Tracker Popup] ${message}`);
  }

  // 화면 테마 감지 및 적용
  function applyPageTheme() {
    // zloa.net의 테마에 따라 팝업 테마도 자동 적용
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('zloa.net')) {
        chrome.scripting.executeScript({
          target: {tabId: tabs[0].id},
          function: () => document.body.classList.contains('dark')
        }, (results) => {
          if (results && results[0] && results[0].result !== undefined) {
            const isDarkMode = results[0].result;
            document.body.classList.toggle('dark', isDarkMode);
            debugLog(`페이지 테마 적용: ${isDarkMode ? '다크' : '라이트'} 모드`);
          }
        });
      }
    });
  }

  // 간소화 모드 불러오기
  function loadSimplifiedMode() {
    chrome.storage.sync.get(['simplifiedMode'], (result) => {
      const isSimplifiedMode = result.simplifiedMode ?? true;
      
      simplifiedModeToggle.checked = isSimplifiedMode;
      
      debugLog(`간소화 모드 로드: ${isSimplifiedMode ? '활성화' : '비활성화'}`);
    });
  }

  // 확장 프로그램 사용 설정 불러오기
  function loadExtensionUsageSetting() {
    chrome.storage.sync.get(['extensionEnabled'], (result) => {
      const extensionEnabled = result.extensionEnabled ?? true;
      
      extensionUsageToggle.checked = extensionEnabled;
      
      debugLog(`확장 프로그램 사용 설정 로드: ${extensionEnabled ? '활성화' : '비활성화'}`);
    });
  }

  // 간소화 모드 토글
  function toggleSimplifiedMode() {
    const isSimplifiedMode = simplifiedModeToggle.checked;
    
    chrome.storage.sync.set({ 
      simplifiedMode: isSimplifiedMode 
    }, () => {
      debugLog(`간소화 모드 변경: ${isSimplifiedMode ? '활성화' : '비활성화'}`);
      
      // 콘텐츠 스크립트에 메시지 전송
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateSimplifiedMode',
          simplifiedMode: isSimplifiedMode
        });
      });
      
      showStatus(`간소화 모드 ${isSimplifiedMode ? '활성화' : '비활성화'} 되었습니다.`);
    });
  }

  // 확장 프로그램 사용 토글
  function toggleExtensionUsage() {
    const extensionEnabled = extensionUsageToggle.checked;
    
    chrome.storage.sync.set({ 
      extensionEnabled: extensionEnabled 
    }, () => {
      debugLog(`확장 프로그램 사용 설정 변경: ${extensionEnabled ? '활성화' : '비활성화'}`);
      
      // 콘텐츠 스크립트에 메시지 전송
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateExtensionUsage',
          enabled: extensionEnabled
        });
      });
      
      showStatus(`확장 프로그램 ${extensionEnabled ? '활성화' : '비활성화'} 되었습니다.`);
    });
  }

  // 상태 메시지 표시
  function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.style.color = isError ? '#db4437' : '#0f9d58';
    
    // 3초 후 메시지 사라짐
    setTimeout(() => {
      statusMessage.textContent = '';
    }, 3000);
  }

  // 이벤트 리스너 설정
  extensionUsageToggle.addEventListener('change', toggleExtensionUsage);
  simplifiedModeToggle.addEventListener('change', toggleSimplifiedMode);

  // 초기화
  function init() {
    // 화면 테마 감지 및 적용
    applyPageTheme();
    
    // 설정 불러오기
    loadExtensionUsageSetting();
    loadSimplifiedMode();
  }

  init();
});
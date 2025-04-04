/**
 * 테마 관리 모듈
 * 사이트 테마 감지 및 적용 관련 기능을 담당
 */

// 현재 테마 상태 (dark/light)
let currentTheme = 'dark'; // 기본 테마를 다크로 설정

/**
 * body 태그의 클래스에 따라 테마 결정
 * @returns {string} 현재 테마 (dark/light)
 */
function determineTheme() {
  const isDarkModeInPage = document.body.classList.contains('dark');
  
  // body 태그의 클래스에 따라 테마 결정
  currentTheme = isDarkModeInPage ? 'dark' : 'light';
  
  console.log(`[ZLoa History Tracker] 페이지 테마 감지: ${currentTheme} 모드`);
  
  // 저장소에 현재 테마 저장
  chrome.storage.sync.set({ themeMode: currentTheme }, () => {
    console.log(`[ZLoa History Tracker] 테마 저장: ${currentTheme} 모드`);
  });

  return currentTheme;
}

/**
 * 페이지의 body 클래스를 기준으로 테마 로드
 */
function loadTheme() {
  // 페이지의 body 클래스를 기준으로 테마 결정
  determineTheme();
  // UI 요소에 테마 적용
  applyTheme();
}

/**
 * 테마를 UI 요소에 적용
 * @param {boolean} simplified 간소화 모드 여부
 */
function applyTheme(simplified = true) {
  const buttons = document.querySelectorAll('#zloaHistorySaveBtn');
  const statusDivs = document.querySelectorAll('#zloaHistoryStatus');
  const buttonContainers = document.querySelectorAll('[data-zloa-button-container]');

  buttons.forEach(button => {
    if (currentTheme === 'dark') {
      button.style.backgroundColor = '#1F2641';
      button.style.color = '#e0e0e0';
    } else {
      button.style.backgroundColor = '#1F2641';
      button.style.color = 'white';
    }
  });

  buttonContainers.forEach(container => {
    if (currentTheme === 'dark') {
      container.style.backgroundColor = '#151619';
      container.style.border = '1px solid #333';
    } else {
      container.style.backgroundColor = '#ffffff';
      container.style.border = '1px solid #ddd';
    }
  });

  statusDivs.forEach(statusDiv => {
    if (currentTheme === 'dark') {
      statusDiv.style.backgroundColor = '#2a2a2a';
      statusDiv.style.color = '#b0b0b0';
      statusDiv.style.border = '1px solid #444';
    } else {
      statusDiv.style.backgroundColor = '#ffffff';
      statusDiv.style.color = '#333';
      statusDiv.style.border = '1px solid #ddd';
    }

    // 간소화 모드 적용
    if (simplified) {
      statusDiv.style.display = 'none';
    } else {
      statusDiv.style.display = 'block';
    }
  });
}

/**
 * MutationObserver로 body 클래스 변경 감지
 */
function observeBodyClassChanges() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        console.log('[ZLoa History Tracker] body 클래스 변경 감지');
        loadTheme();
        break;
      }
    }
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class']
  });
}

/**
 * 테마 변경 함수
 * @param {string} theme 변경할 테마 ('dark' 또는 'light')
 */
function setTheme(theme) {
  if (theme === 'dark' || theme === 'light') {
    currentTheme = theme;
    applyTheme();
  }
}

/**
 * 현재 테마 반환
 * @returns {string} 현재 테마 ('dark' 또는 'light')
 */
function getCurrentTheme() {
  return currentTheme;
}

// 모듈 내보내기
export {
  loadTheme,
  applyTheme,
  observeBodyClassChanges,
  setTheme,
  getCurrentTheme
};

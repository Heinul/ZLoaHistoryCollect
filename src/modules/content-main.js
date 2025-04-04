/**
 * 콘텐츠 메인 모듈
 * 확장 프로그램의 주요 로직과 초기화 담당
 */

import { loadTheme, observeBodyClassChanges, setTheme } from './theme-manager.js';
import { isExtensionEnabled, getSimplifiedMode } from './storage-service.js';
import { setSimplifiedMode, createSaveButtonUI } from './ui-components.js';

// 전역 변수
let isInitialized = false;

/**
 * 확장 프로그램 초기화
 */
async function initializeExtension() {
  if (isInitialized) return;
  isInitialized = true;
  
  console.log("[ZLoa History Tracker] 콘텐츠 스크립트가 로드되었습니다.");
  
  // 테마 로드 및 적용
  loadTheme();
  
  // 간소화 모드 로드
  const simplifiedMode = await getSimplifiedMode();
  setSimplifiedMode(simplifiedMode);
  
  // body 클래스 변경 감지 시작
  observeBodyClassChanges();
  
  // URL 변경 감지
  startUrlChangeDetection();
  
  // 페이지 로드 시 확인
  onUrlChange(location.href);
}

/**
 * URL 변경 감지 시작
 */
function startUrlChangeDetection() {
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      onUrlChange(url);
    }
  }).observe(document, { subtree: true, childList: true });
}

/**
 * URL 변경 시 처리
 * @param {string} url 현재 URL
 */
async function onUrlChange(url) {
  console.log("[ZLoa History Tracker] URL 변경 감지:", url);
  
  // 확장 프로그램 사용 여부 확인
  const isEnabled = await isExtensionEnabled();
  
  if (!isEnabled) {
    console.log("[ZLoa History Tracker] 확장 프로그램 사용 중지됨");
    // 이미 생성된 버튼 제거
    const existingContainer = document.querySelector('[data-zloa-button-container]');
    if (existingContainer) {
      existingContainer.remove();
    }
    return;
  }
  
  // 캐릭터 검색 결과 페이지인지 확인
  const characterPageSelectors = [
    'table tbody tr:first-child td:nth-child(2)',
    '[data-testid="character-name"]',
    '.character-name'
  ];
  
  let isCharacterPage = false;
  for (const selector of characterPageSelectors) {
    if (document.querySelector(selector)) {
      isCharacterPage = true;
      break;
    }
  }
  
  if (url.includes('zloa.net') && isCharacterPage) {
    console.log("[ZLoa History Tracker] 캐릭터 검색 결과 페이지 감지");
    
    // DOM이 완전히 로드될 때까지 대기
    setTimeout(() => {
      createSaveButtonUI();
    }, 1000);
  }
}

/**
 * 확장 프로그램 메시지 리스너 설정
 * 팝업과의 통신을 처리
 */
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 테마 업데이트 처리
    if (request.action === 'updateTheme') {
      setTheme(request.theme);
      sendResponse({ success: true });
    }
    
    // 간소화 모드 업데이트 처리
    if (request.action === 'updateSimplifiedMode') {
      setSimplifiedMode(request.simplifiedMode);
      sendResponse({ success: true });
    }
    
    // 확장 프로그램 사용 여부 업데이트 처리
    if (request.action === 'updateExtensionUsage') {
      if (!request.enabled) {
        // 버튼 제거
        const existingContainer = document.querySelector('[data-zloa-button-container]');
        if (existingContainer) {
          existingContainer.remove();
        }
      } else {
        // 페이지 재확인
        onUrlChange(location.href);
      }
      sendResponse({ success: true });
    }
    
    // 비동기 응답을 위해 true 반환
    return true;
  });
}

// 초기화 로직
function init() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
  } else {
    initializeExtension();
  }
  
  // 메시지 리스너 설정
  setupMessageListeners();
}

// 모듈 내보내기
export { 
  init, 
  onUrlChange 
};

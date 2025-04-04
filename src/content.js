(function() {
  // 전역 변수 선언
  let lastSavedTime = null;
  let isInitialized = true;
  let testData = null; // 테스트용 데이터
  let currentTheme = 'dark'; // 기본 테마를 다크로 설정
  let isSimplifiedMode = true; // 기본값을 간소화 모드로 설정

  // 확장 프로그램 컨텍스트 확인 함수
  function isExtensionContextValid() {
    try {
      chrome.runtime.getURL("");
      return true;
    } catch (e) {
      console.error("[ZLoa History Tracker] 확장 프로그램 컨텍스트 무효화됨");
      return false;
    }
  }

  // 확장 프로그램 사용 여부 확인 함수
  function isExtensionEnabled() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['extensionEnabled'], (result) => {
        resolve(result.extensionEnabled ?? true); // 기본값은 true
      });
    });
  }

  // 간소화 모드 불러오기 함수
  function loadSimplifiedMode() {
    chrome.storage.sync.get(['simplifiedMode'], (result) => {
      isSimplifiedMode = result.simplifiedMode ?? true;
      console.log(`[ZLoa History Tracker] 간소화 모드 로드: ${isSimplifiedMode ? '활성화' : '비활성화'}`);
      
      // 이미 생성된 상태 메시지에도 즉시 적용
      const statusDivs = document.querySelectorAll('#zloaHistoryStatus');
      statusDivs.forEach(statusDiv => {
        statusDiv.style.display = isSimplifiedMode ? 'none' : 'block';
      });
    });
  }

  // 간소화 모드 적용 함수
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

  // 테마 결정 함수
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

  // 테마 로드 함수
  function loadTheme() {
    // 페이지의 body 클래스를 기준으로 테마 결정
    determineTheme();
    applyTheme();
  }

  // 테마 적용 함수
  function applyTheme() {
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
      if (isSimplifiedMode) {
        statusDiv.style.display = 'none';
      } else {
        statusDiv.style.display = 'block';
      }
    });
  }

  // MutationObserver로 body 클래스 변경 감지
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

  // 메시지 리스너
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateTheme') {
      currentTheme = request.theme;
      applyTheme();
    }

    if (request.action === 'updateSimplifiedMode') {
      isSimplifiedMode = request.simplifiedMode;
      applySimplifiedMode();
    }
  });

  // 이전에 저장된 데이터와 환산점수 비교 함수 (로컬 캐시 최적화 적용)
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

  // 캐릭터 데이터 저장 함수
  async function saveCharacterData(data) {
    try {
      if (!isExtensionContextValid()) {
        console.error("[ZLoa History Tracker] 확장 프로그램 컨텍스트가 무효화되었습니다.");
        return { success: false, message: "확장 프로그램 오류" };
      }

      // 환산점수가 같은 경우 저장하지 않음
      const isSameScore = await checkPreviouslySavedData(data.charname, data.server, data.converted_zp);
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

  // 캐릭터 데이터 파싱 함수 (기존 코드와 동일)
  function parseCharacterData() {
    console.log("[ZLoa History Tracker] 상세 데이터 파싱 시작");
    
    // 기본 정보 추출
    const nameCell = document.querySelector('table tbody tr:first-child td:nth-child(2)');
    const serverCell = document.querySelector('table tbody tr:nth-child(9) td:nth-child(2)');
    
    if (!nameCell) {
      console.error("[ZLoa History Tracker] 캐릭터 이름을 찾을 수 없습니다.");
      return null;
    }
    
    const characterName = nameCell.textContent.trim();
    const serverName = serverCell ? serverCell.textContent.trim() : "알 수 없음";
    
    // 환산점수 오류 검색 (data-state="closed" 요소)
    const errorStateElements = document.querySelectorAll('[data-state="closed"]');
    let hasScoreError = false;
    
    for (const element of errorStateElements) {
      const errorText = element.textContent || "";
      if (errorText.includes("오류가 발생했습니다")) {
        console.error("[ZLoa History Tracker] data-state=closed 요소에서 환산점수 오류 발견");
        hasScoreError = true;
        break;
      }
    }
    
    // 추가 검색: flex 클래스 요소 내의 오류 메시지 확인
    if (!hasScoreError) {
      const flexElements = document.querySelectorAll('.flex.flex-row.justify-center.items-center.gap-1');
      for (const element of flexElements) {
        const flexText = element.textContent || "";
        if (flexText.includes("오류가 발생했습니다")) {
          console.error("[ZLoa History Tracker] flex 요소에서 환산점수 오류 발견");
          hasScoreError = true;
          break;
        }
      }
    }
    
    // lucide-gem SVG 아이콘 이 포함된 요소 검색 (더 정확한 탐지)
    if (!hasScoreError) {
      const svgElements = document.querySelectorAll('.lucide.lucide-gem');
      for (const svg of svgElements) {
        const parentElement = svg.closest('.flex.flex-row.justify-center.items-center.gap-1');
        if (parentElement && parentElement.textContent.includes("오류가 발생했습니다")) {
          console.error("[ZLoa History Tracker] gem 아이콘 근처에서 환산점수 오류 발견");
          hasScoreError = true;
          break;
        }
      }
    }
    
    if (hasScoreError) {
      return {
        hasError: true,
        errorType: "scoreError",
        message: "환산점수 오류가 발견되어 저장할 수 없습니다. (데이터 오류 상태)"
      };
    }
    
    // 환산 점수 추출
    const scoreCell = document.querySelector('table tbody tr:nth-child(3) td:nth-child(2)');
    const score = scoreCell ? parseFloat(scoreCell.textContent.trim()) : 0;
    
    // 아이템 레벨 추출
    const itemLevelCell = document.querySelector('table tbody tr:nth-child(8) td:nth-child(2)');
    const itemLevel = itemLevelCell ? parseFloat(itemLevelCell.textContent.trim()) : 0;
    
    // 클래스 추출
    const classCell = document.querySelector('table tbody tr:nth-child(7) td:nth-child(2)');
    const characterClass = classCell ? classCell.textContent.trim().split(' ')[1] || classCell.textContent.trim() : "알 수 없음";
    
    // 빌드 추출
    const buildCell = document.querySelector('table tbody tr:nth-child(6) td:nth-child(2)');
    const build = buildCell ? buildCell.textContent.trim() : "알 수 없음";
    
    // 계산된 시각 추출
    const timeCell = document.querySelector('table tbody tr:nth-child(10) td:nth-child(2)');
    const calculated_at = timeCell ? timeCell.textContent.trim() : new Date().toLocaleTimeString();
    
    // 환산 점수 영수증 추출
    const receiptRows = document.querySelectorAll('.rounded-xl:nth-child(2) table tbody tr');
    const receipt = {};
    
    if (receiptRows && receiptRows.length > 0) {
      receiptRows.forEach(row => {
        const specName = row.querySelector('td:first-child');
        const specValue = row.querySelector('td:last-child');
        
        if (specName && specValue) {
          const name = specName.textContent.trim();
          const valueText = specValue.textContent.trim();
          const value = parseFloat(valueText.replace('%', ''));
          
          if (!isNaN(value)) {
            receipt[name] = value;
          }
        }
      });
    }
    
    // 장비 정보 추출 - 중요 정보만 최적화해서 저장
    const equipment = {};
    const equipmentItems = document.querySelectorAll('.flex.flex-row.gap-2.items-center');
    
    if (equipmentItems && equipmentItems.length > 0) {
      equipmentItems.forEach((item, index) => {
        const nameElement = item.querySelector('.flex.justify-start.items-center p');
        const itemName = nameElement ? nameElement.textContent.trim() : `장비${index}`;
        
        const qualityElement = item.querySelector('.w-full.h-5.rounded-b-md');
        const qualityText = qualityElement ? qualityElement.textContent.trim() : "0";
        const quality = parseInt(qualityText) || 0;
        
        const enhanceElement = item.querySelector('b');
        const enhance = enhanceElement ? parseInt(enhanceElement.textContent) || 0 : 0;
        
        if (itemName) {
          equipment[`장비${index+1}`] = {
            name: itemName,
            quality: quality,
            enhance: enhance
          };
        }
      });
    }
    
    // 결과 객체 생성
    const characterData = {
      charname: characterName,
      class: characterClass,
      server: serverName,
      temlv: itemLevel,
      observed_at: new Date().toISOString(),
      is_sup: ["바드", "홀리나이트", "도화가"].includes(characterClass),
      build: build,
      calculated_at: calculated_at,
      converted_zp: score,
      zp_score: score, // 이전 버전과의 호환성을 위해 추가
      receipt: receipt,
      display: {
        equipment: equipment
      }
    };
    
    return characterData;
  }

  // 저장 버튼 생성 함수
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
    
    // 저장 버튼 클릭 이벤트 로직
    saveButton.addEventListener('click', async () => {
      if (!isExtensionContextValid()) {
        statusDiv.textContent = '확장 프로그램이 다시 로드되었습니다. 페이지를 새로고침하세요.';
        statusDiv.style.color = '#db4437';
        statusDiv.style.display = 'block'; // 오류시엔 간소화 모드에서도 표시
        return;
      }
      
      statusDiv.textContent = '데이터 추출 및 점검 중...';
      statusDiv.style.color = '#4285f4';
      statusDiv.style.display = isSimplifiedMode ? 'none' : 'block';
      
      const result = parseCharacterData();
      
      // 환산점수 오류 처리
      if (result && result.hasError) {
        statusDiv.textContent = result.message;
        statusDiv.style.color = '#db4437';
        statusDiv.style.display = 'block'; // 오류시엔 간소화 모드에서도 표시
        return;
      }
      
      if (!result) {
        statusDiv.textContent = '데이터 파싱 실패. 페이지를 새로고침하고 다시 시도하세요.';
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

        // 간소화 모드인 경우 2초 후에 상태 메시지 숨기기
        if (isSimplifiedMode) {
          setTimeout(() => {
            statusDiv.style.display = 'none';
          }, 2000);
        }
      }
    });
    
    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(statusDiv);
    
    containerDiv.parentNode.insertBefore(buttonContainer, containerDiv);
    
    console.log("[ZLoa History Tracker] 저장 버튼이 생성되었습니다.");
  }

  // 페이지 로드 시 실행
  function initializeExtension() {
    console.log("[ZLoa History Tracker] 콘텐츠 스크립트가 로드되었습니다.");
    
    // 테마 로드 및 적용
    loadTheme();
    
    // 간소화 모드 로드
    loadSimplifiedMode();
    
    // body 클래스 변경 감지 시작
    observeBodyClassChanges();
    
    // URL 변경 감지
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        onUrlChange(url);
      }
    }).observe(document, { subtree: true, childList: true });
    
    // 페이지 로드 시 확인
    onUrlChange(location.href);
  }

  // URL 변경 시 처리
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

  // 메시지 리스너
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateTheme') {
      currentTheme = request.theme;
      applyTheme();
    }

    if (request.action === 'updateSimplifiedMode') {
      isSimplifiedMode = request.simplifiedMode;
      applySimplifiedMode();
    }

    // 확장 프로그램 사용 여부 업데이트
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
    }
  });

  // 기존 코드의 나머지 부분 (스크립트 초기화 등) 유지
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
  } else {
    initializeExtension();
  }
})();
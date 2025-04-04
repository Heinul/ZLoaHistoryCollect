/**
 * ZLoa History Tracker - 콘텐츠 스크립트
 * 
 * 이 스크립트는 zloa.net 웹사이트에서 실행되며, 캐릭터 정보를 수집하고 저장합니다.
 * 기능별로 모듈화된 구조로 코드의 가독성과 유지보수성을 향상시켰습니다.
 */

import { init } from './modules/content-main';

// 모듈 초기화 실행
(function() {
  init();
})();

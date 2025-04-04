# 아이콘 변환 가이드

이 프로젝트에서는 SVG 아이콘을 PNG로 변환하여 사용합니다. 다음은 변환 방법입니다.

## 방법 1: 온라인 SVG-to-PNG 컨버터 사용

1. [Convertio](https://convertio.co/svg-png/) 같은 온라인 툴을 이용합니다
2. SVG 파일을 업로드합니다
3. 각 크기별로 변환합니다:
   - icon16.svg → icon16.png (16×16)
   - icon48.svg → icon48.png (48×48)
   - icon128.svg → icon128.png (128×128)

## 방법 2: Inkscape 사용

1. Inkscape를 설치합니다
2. SVG 파일을 열고 파일 → 내보내기를 선택합니다
3. PNG로 내보내고 크기를 지정합니다

## 방법 3: Node.js 스크립트 사용

1. 다음 패키지 설치: `npm install svg2png`
2. 다음과 같은 스크립트를 실행합니다:

```javascript
const svg2png = require('svg2png');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng(svgPath, pngPath, width, height) {
  const source = fs.readFileSync(svgPath);
  const output = await svg2png(source, { width, height });
  fs.writeFileSync(pngPath, output);
  console.log(`Converted ${svgPath} to ${pngPath}`);
}

// 변환 실행
convertSvgToPng('icon16.svg', 'icon16.png', 16, 16);
convertSvgToPng('icon48.svg', 'icon48.png', 48, 48);
convertSvgToPng('icon128.svg', 'icon128.png', 128, 128);
```

## 아이콘 설정

변환한 PNG 파일들을 프로젝트 루트에 저장한 후 `manifest.json`에 경로가 올바르게 지정되었는지 확인하세요.

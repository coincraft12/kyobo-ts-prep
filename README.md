# ts-study

강의 코드 읽기 기준 TypeScript 속성 학습 레포.

## 챕터 구성

| 챕터 | 주제 | 핵심 개념 |
|------|------|-----------|
| ch01 | 변수와 타입 | const/let, 타입 어노테이션, unknown/void/never |
| ch02 | 함수와 화살표 | 화살표 함수, async/await, 콜백, 함수 타입 |
| ch03 | 인터페이스와 타입 | interface, union, Record, 상태 머신 패턴 |
| ch04 | 클래스 | 생성자 단축, implements, extends, static |
| ch05 | 비동기·에러 | 커스텀 Error, retryWithBackoff, Promise.all/allSettled |
| ch06 | 모던 문법 | 구조 분해, ??, ?., as const, as, ! |
| ch07 | 제네릭 | `<T>`, `extends` 제약, 제네릭 클래스/인터페이스 |
| ch08 | 유틸리티 타입 | Partial, Pick, Omit, ReturnType, Awaited, 타입 가드 |

## 파일 구성

각 챕터 폴더 안에:
- `README.md` — 개념 설명 + 왜 쓰는지 + 자주 하는 실수 + 체크리스트
- `index.ts` — 실행 가능한 예제 코드 (강의 실제 패턴 기반)

## 실행

```bash
npm install
npm run ch01   # 챕터별 실행
npm run ch02
# ...
npm run ch08
```

## 학습 순서

1. 챕터 폴더의 `README.md` 읽기 — 개념 이해
2. `index.ts` 읽기 — 실제 코드로 확인
3. `npm run chXX`로 실행 — 출력 확인
4. 코드 일부 수정해서 컴파일 에러 경험하기 (에러 메시지가 곧 학습)

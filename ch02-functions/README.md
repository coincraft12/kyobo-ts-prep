# CH02 — 함수와 화살표

## 핵심 한 줄
> 강의 코드의 80%는 화살표 함수 + async/await 조합이다. 이 두 가지를 눈에 익히는 게 목표.

---

## 1. 함수 선언 3가지 방식

```typescript
// ① function 키워드
function add(a: number, b: number): number {
  return a + b;
}

// ② 함수 표현식
const add = function(a: number, b: number): number {
  return a + b;
};

// ③ 화살표 함수 — 강의 코드 표준
const add = (a: number, b: number): number => a + b;
```

셋 다 동작은 같다. 강의 코드는 ③번이 압도적으로 많다.

---

## 2. 화살표 함수 줄이는 규칙

```typescript
// 기본형
const greet = (name: string): string => {
  return `Hello, ${name}`;
};

// 본문이 한 줄이면 → 중괄호 + return 생략
const greet = (name: string): string => `Hello, ${name}`;

// 매개변수가 하나이면 → 괄호 생략 가능 (TS에선 타입 때문에 보통 안 생략)
const double = n => n * 2;  // JS에선 되는데 TS에선 타입 추론 필요해서 보통 괄호 유지
```

**객체를 리턴할 때 주의:**
```typescript
// 이렇게 하면 중괄호를 함수 본문으로 인식 → 에러
const toObj = (x: number) => { value: x };   // 잘못됨

// 소괄호로 감싸야 함
const toObj = (x: number) => ({ value: x }); // OK
```

---

## 3. 매개변수 종류

```typescript
function createTx(
  from: string,          // 필수 — 반드시 넘겨야 함
  amount: number,        // 필수
  memo?: string,         // 선택적 — 안 넘기면 undefined
  fee: number = 0,       // 기본값 — 안 넘기면 0
): string {
  return `${from} sends ${amount}`;
}

createTx('0xAAA', 100);            // OK
createTx('0xAAA', 100, '메모');   // OK
createTx('0xAAA', 100, undefined, 5);  // OK
```

`?:` 와 `= 기본값` 차이:
- `memo?`: 안 넘기면 undefined, 명시적으로 undefined 넘겨도 됨
- `fee = 0`: 안 넘기거나 undefined 넘기면 0으로 처리됨

---

## 4. 함수 타입

함수를 변수처럼 넘길 때 타입을 표현하는 방법:

```typescript
// 함수 타입 표현식
type Handler = (eventType: string) => Promise<void>;

// 매개변수로 함수 받기
async function runHandler(type: string, handler: Handler): Promise<void> {
  await handler(type);
}

// 사용
await runHandler('NFT_ISSUED', async (type) => {
  console.log('처리:', type);
});
```

강의 코드에서 자주 보이는 형태:
```typescript
// "() => Promise<void>" 타입의 fn을 받아 실행
async run(key: string, fn: () => Promise<void>): Promise<void>
```

---

## 5. Promise — 나중에 완료되는 작업

`Promise<T>`는 "지금 당장 값이 없고, 나중에 T 타입 값이 완성될 것"을 나타내는 타입이다.

```typescript
// 지금 당장 number를 주지 않고, 나중에 number를 줄 것을 약속
function fetchBalance(address: string): Promise<number> { ... }

const p = fetchBalance('0xAAA');  // p의 타입: Promise<number>
                                   // 아직 숫자가 아님 — 약속 상태
```

Promise가 필요한 이유: DB 조회, API 호출, 파일 읽기 등은 시간이 걸린다. 기다리는 동안 다른 일을 할 수 있도록 "나중에 줄게"라는 약속 객체를 먼저 반환하는 것.

Promise 상태 3가지:
- **pending**: 아직 완료 안 됨
- **fulfilled**: 완료, 값 있음
- **rejected**: 실패, 에러 있음

```typescript
// Promise<void> — 완료만 알려주고 반환값 없음
async function saveToDB(): Promise<void> { ... }

// Promise<string> — 완료되면 string을 반환
async function getName(): Promise<string> { ... }

// Promise<number[]> — 완료되면 number 배열 반환
async function getScores(): Promise<number[]> { ... }
```

강의 코드에서 `Promise<void>`가 가장 많이 나온다 — "처리만 하고 값은 안 줌" 패턴.

---

## 6. async / await

```typescript
async function fetchBalance(address: string): Promise<number> {
  const result = await someApi(address);  // Promise가 끝날 때까지 기다림
  return result.balance;                  // 리턴값은 자동으로 Promise<number>
}
```

규칙:
- `async`를 붙이면 함수는 자동으로 `Promise`를 리턴한다
- `await`은 `async` 함수 안에서만 사용 가능
- `await`은 Promise를 "풀어서" 값으로 만든다

```typescript
const p: Promise<number> = fetchBalance('0xAAA');  // Promise
const n: number = await fetchBalance('0xAAA');     // 값
```

---

## 6. 콜백 함수 — 배열 메서드

강의 코드에서 매일 나온다:

```typescript
const processors = [processorA, processorB, processorC];

// filter — 조건에 맞는 것만 남김
const matched = processors.filter(p => p.eventTypes.includes(eventType));

// map — 각 요소를 변환
const promises = processors.map(p => p.process(msg));

// forEach — 각 요소에 함수 실행 (리턴값 없음)
processors.forEach(p => console.log(p.eventTypes));
```

`filter`, `map` 안에 넣는 `p => ...`가 콜백 함수다. "각 요소를 p로 받아서 화살표 뒤를 실행해라"는 의미.

---

## 자주 하는 실수

**실수 1 — async 없이 await 사용**
```typescript
function fetchData() {
  const result = await api();  // 에러: async 함수 안에서만 await 가능
}
```

**실수 2 — async 함수 리턴 타입 잘못 씀**
```typescript
async function getData(): string {    // 에러: async는 항상 Promise 리턴
  return 'hello';
}
async function getData(): Promise<string> {  // OK
  return 'hello';
}
```

---

## 체크리스트

- [ ] `=>` 보고 화살표 함수라고 인식한다
- [ ] `Promise<T>`가 "나중에 T를 주겠다는 약속"임을 설명할 수 있다
- [ ] `Promise<void>` / `Promise<number>` / `Promise<string>` 차이를 안다
- [ ] `async function foo(): Promise<T>` 형태를 읽을 수 있다
- [ ] `?:` (선택적)과 `= 기본값` 차이를 설명할 수 있다
- [ ] `array.filter(p => 조건)` 패턴이 뭘 하는지 설명할 수 있다
- [ ] `(fn: () => Promise<void>)` 같은 함수 타입 표현을 읽을 수 있다

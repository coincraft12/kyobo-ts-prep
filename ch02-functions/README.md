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

### 세 가지가 결과는 같은데 왜 여러 방식이 있나?

**①번 `function` 선언식**은 파일 어디서든 호출할 수 있다. JavaScript는 `function` 선언을 파일 맨 위로 끌어올리는 "호이스팅(hoisting)" 동작을 하기 때문이다. 가장 전통적인 방식이다.

**②번 함수 표현식**은 변수에 함수를 담는 방식이다. `const`를 쓰면 함수 자체를 다른 것으로 교체할 수 없다. 선언 이전에 호출하면 에러가 난다.

**③번 화살표 함수**는 `function` 키워드를 `=>`로 대체한 짧은 문법이다. `this` 바인딩 방식이 다르다는 기술적 차이가 있지만, 강의 코드 수준에서는 ②번과 동일하게 작동한다고 이해해도 무방하다. 간결해서 강의 코드 전반에서 압도적으로 많이 쓰인다.

코드를 읽다가 `=>` 기호가 보이면 "화살표 함수다"라고 즉시 인식하는 것이 목표다.

---

## 2. 화살표 함수 단계별 축약

화살표 함수는 본문이 짧을수록 문법을 하나씩 줄여가면서 더 짧게 쓸 수 있다.  
처음 보면 어디서 어디가 잘려나간 건지 헷갈리니, 단계별로 한 줄씩 줄여보자.

```typescript
// ─── 0단계: 가장 풀어쓴 형태 (function 키워드 버전) ───
function greet(name: string): string {
  return `Hello, ${name}`;
}

// ─── 1단계: 화살표 함수 기본형 (function → const + =>) ───
const greet = (name: string): string => {
  return `Hello, ${name}`;
};
//                           ^^
//                      function을 이걸로 대체

// ─── 2단계: 본문이 한 줄이면 중괄호 + return 동시에 생략 ───
const greet = (name: string): string => `Hello, ${name}`;
//                                      ^^^^^^^^^^^^^^^^
//                                 중괄호/return 없이 표현식이 곧 리턴값
```

2단계에서 일어나는 일을 "암묵적 반환(implicit return)"이라고 한다.  
`=>`  바로 뒤에 중괄호 없이 표현식이 오면, 그 표현식 자체가 리턴값이 된다.

```typescript
// ─── 3단계: 매개변수가 하나면 괄호 생략 가능 (단, TypeScript는 주의) ───

// JavaScript에서는 동작
const double = n => n * 2;

// TypeScript에서는 n의 타입을 알 수 없어서 에러 또는 any
❌ const double = n => n * 2;

// TypeScript에서 올바른 형태 — 괄호 안에 타입 어노테이션이 있으면 괄호 필수
✅ const double = (n: number) => n * 2;
```

> **핵심**: 단계별 요약

| 조건 | 생략 가능한 것 |
|---|---|
| 본문이 표현식 한 줄 | `{}` 와 `return` 동시 생략 |
| 매개변수 1개 (타입 없을 때) | `()` 생략 (TypeScript에서는 타입 때문에 보통 유지) |
| 매개변수 없음 | `()` 는 생략 불가 — 반드시 써야 함 |

---

### 객체를 리턴할 때 — 가장 많이 하는 실수

화살표 함수에서 객체를 직접 리턴하려다 함정에 빠지는 경우가 많다.

```typescript
// ❌ 이렇게 하면 안 된다
const toObj = (x: number) => { value: x };
```

왜 틀렸을까? JS/TS는 `{`를 만나는 순간 "함수 본문이 시작됐다"고 해석한다.  
그 안의 `value: x`는 "value라는 레이블이 붙은 표현식 문장"으로 처리되고,  
함수는 아무것도 반환하지 않으므로 결과는 `undefined`다.

```typescript
// ✅ 소괄호로 감싸면 해결된다
const toObj = (x: number) => ({ value: x });
//                             ^          ^
//                         소괄호가 "이건 객체 리터럴이야"라고 JS에게 알려줌
```

`()` 안에 들어간 것은 표현식으로 해석된다. `{}`가 함수 본문이 아니라 객체 리터럴임을 명시하는 방법이다.

```typescript
// 실제로 자주 쓰이는 패턴 — 배열의 map에서 객체를 바로 만들 때
const items = [1, 2, 3];

❌ const result = items.map(n => { id: n, value: n * 2 });    // undefined 배열
✅ const result = items.map(n => ({ id: n, value: n * 2 }));  // 객체 배열
// 결과: [{ id: 1, value: 2 }, { id: 2, value: 4 }, { id: 3, value: 6 }]
```

> **핵심**: 화살표 함수에서 객체를 암묵적으로 반환하려면 반드시 `({ })` 형태로 소괄호로 감싼다.

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

createTx('0xAAA', 100);                    // ✅ from, amount만 넘김
createTx('0xAAA', 100, '메모');            // ✅ memo도 넘김
createTx('0xAAA', 100, undefined, 5);      // ✅ memo를 건너뛰고 fee만 넘김
```

---

### `?:` vs `= 기본값` — 비교로 이해하기

이 두 가지는 "넘기지 않아도 된다"는 점은 같지만, 내부에서 동작이 완전히 다르다.

#### `memo?: string` — 선택적 매개변수

`?:`는 "이 매개변수는 있어도 되고 없어도 된다"는 선언이다.  
안 넘기거나 `undefined`를 명시적으로 넘기면, 함수 안에서 `memo`는 `undefined`가 된다.

```typescript
function greet(name: string, memo?: string): string {
  //                               ↑
  //           이 함수 안에서 memo의 타입은 string | undefined
  //           반드시 undefined 체크를 해야 안전하게 쓸 수 있음

  if (memo !== undefined) {
    return `${name}: ${memo}`;
  }
  return name;
}
```

#### `fee: number = 0` — 기본값 매개변수

`= 0`은 "안 넘기면 이 값으로 대체해라"는 선언이다.  
특별한 점: `undefined`를 명시적으로 넘겨도 기본값으로 대체된다.

```typescript
function charge(from: string, fee: number = 0): string {
  //                                    ↑
  //           이 함수 안에서 fee의 타입은 항상 number
  //           undefined가 될 일이 없으므로 체크 불필요

  return `${from}, fee: ${fee}`;
}
```

#### 두 가지를 표로 비교

| | `memo?: string` | `fee: number = 0` |
|---|---|---|
| 안 넘기면? | `undefined` | 기본값 `0` |
| 함수 안 타입 | `string \| undefined` | `number` |
| `undefined` 명시적으로 넘기면? | `undefined` 그대로 유지 | 기본값 `0`으로 대체 |
| undefined 체크 필요? | 필요 | 불필요 |

```typescript
// undefined 명시 전달 시 동작 차이 확인
function test(memo?: string, fee: number = 0) {
  console.log(memo, fee);
}

test(undefined, undefined);
// memo → undefined (그대로)
// fee  → 0 (기본값으로 대체됨)
```

#### 주의: 선택적 매개변수는 필수 매개변수 뒤에 와야 한다

```typescript
// ❌ 에러: 선택적 매개변수 뒤에 필수 매개변수가 올 수 없음
function bad(memo?: string, fee: number): string { ... }

// ✅ OK: 필수가 먼저, 선택적·기본값이 뒤
function good(fee: number, memo?: string): string { ... }
```

> **핵심**: `?:`는 undefined가 함수 안으로 들어올 수 있고, `= 기본값`은 undefined가 절대 안 들어온다. 함수 안에서 undefined 체크를 해야 하는지 여부가 달라진다.

---

## 4. 함수 타입 — 함수의 모양을 타입으로 표현

함수도 변수처럼 넘기거나 담을 수 있다. 이때 그 함수가 어떤 "모양"인지를 타입으로 표현해야 한다.

```typescript
type Handler = (eventType: string) => Promise<void>;
```

이 한 줄을 토큰 단위로 분해해보자:

```
type Handler = (eventType: string) => Promise<void>;
│    │          │              │     │    │
│    │          │              │     │    └─ Promise 안에 담긴 값의 타입 (void = 값 없음)
│    │          │              │     └─ 화살표: "이 함수는 이것을 반환한다"
│    │          │              └─ 매개변수의 타입
│    │          └─ 매개변수 이름 (타입을 설명하기 위한 이름, 실제 호출 시 이름과 달라도 됨)
│    └─ 이 타입의 이름
└─ 타입 선언 키워드
```

읽는 법: "`Handler`는 `string`을 받아서 `Promise<void>`를 반환하는 함수의 타입이다."

### 왜 `type Handler = ...` 로 이름을 붙이나?

같은 함수 모양을 여러 곳에서 쓸 때 매번 전부 적으면 길어진다.

```typescript
// ❌ 이름 없이 쓰면 — 같은 타입을 반복 기술
function runHandler(type: string, handler: (eventType: string) => Promise<void>): Promise<void> { ... }
function addHandler(key: string, handler: (eventType: string) => Promise<void>): void { ... }
function removeHandler(key: string, handler: (eventType: string) => Promise<void>): void { ... }

// ✅ 이름을 붙이면 — 한 곳에서만 정의, 나머지는 이름만 참조
type Handler = (eventType: string) => Promise<void>;

function runHandler(type: string, handler: Handler): Promise<void> { ... }
function addHandler(key: string, handler: Handler): void { ... }
function removeHandler(key: string, handler: Handler): void { ... }
```

나중에 `Handler`의 형태가 바뀌면 `type Handler = ...` 한 줄만 수정하면 된다.  
이름 없이 쓰면 사용한 곳 모두 찾아가 고쳐야 한다.

### 실제 Handler 타입을 쓰는 예시

```typescript
type Handler = (eventType: string) => Promise<void>;

// 매개변수로 함수 받기
async function runHandler(type: string, handler: Handler): Promise<void> {
  await handler(type);
}

// 사용 — 화살표 함수를 직접 넘김
await runHandler('NFT_ISSUED', async (type) => {
  //                           ↑
  //           TypeScript가 두 번째 매개변수가 Handler 타입임을 알기 때문에
  //           type의 타입(string)을 자동으로 추론함 — 직접 안 써도 됨
  console.log('처리:', type);
});
```

### 강의 코드에서 자주 보이는 형태

```typescript
async run(key: string, fn: () => Promise<void>): Promise<void>
```

이 시그니처를 토큰 단위로 분해하면:

```
async run(key: string, fn: () => Promise<void>): Promise<void>
│     │   │            │   │       │             │
│     │   │            │   │       │             └─ run 함수 자체의 반환 타입
│     │   │            │   │       └─ fn이 반환하는 Promise 안의 타입 (void)
│     │   │            │   └─ fn은 매개변수 없이 Promise<void>를 반환하는 함수
│     │   │            └─ 두 번째 매개변수 이름
│     │   └─ 첫 번째 매개변수: string 타입의 key
│     └─ 메서드 이름
└─ 이 메서드는 비동기 함수
```

"어떤 비동기 작업(`fn`)을 `key`와 함께 실행하는 메서드"다. 강의 코드에서 매우 자주 나오는 패턴이다.

> **핵심**: 함수 타입은 `(매개변수: 타입) => 리턴타입` 형태로 읽는다. `type`으로 이름을 붙이면 반복을 줄이고, 한 곳에서 관리할 수 있다.

---

## 5. Promise\<T\> — 나중에 완료되는 작업

`Promise<T>`는 "지금 당장 값이 없고, 나중에 T 타입 값이 완성될 것"을 나타내는 타입이다.

### 왜 Promise가 필요한가?

DB 조회, API 호출, 파일 읽기는 시간이 걸린다. JavaScript는 이 기다리는 동안 멈추지 않고 다른 일을 처리한다. 그래서 "나중에 결과가 나오면 줄게"라는 약속 객체를 먼저 반환하는 것이다.

비유: 음식점에서 주문하면 진동벨(Promise)을 준다. 벨이 울릴 때까지 그 자리에 서 있는 게 아니라, 받고 나서 자리에 앉아 다른 일을 할 수 있다. 벨이 울리면(fulfilled) 음식을 받는다.

### T 자리에 뭐가 오는지가 핵심

`Promise<T>`에서 `T`는 "이 Promise가 완료됐을 때 꺼낼 수 있는 값의 타입"이다.

```typescript
// Promise<void> — 완료만 알려주고 꺼낼 값이 없음
async function saveToDB(): Promise<void> { ... }
const result = await saveToDB();  // result의 타입: void (실제로는 undefined)

// Promise<string> — 완료되면 string이 나옴
async function getName(): Promise<string> { ... }
const name = await getName();     // name의 타입: string

// Promise<number> — 완료되면 number가 나옴
async function fetchBalance(): Promise<number> { ... }
const balance = await fetchBalance(); // balance의 타입: number

// Promise<number[]> — 완료되면 number 배열이 나옴
async function getScores(): Promise<number[]> { ... }
const scores = await getScores(); // scores의 타입: number[]
```

`await Promise<T>` → `T`가 나온다. 꺾쇠 괄호 안의 타입이 await 결과물이다.

### Promise 상태 3가지

| 상태 | 의미 | 값 |
|---|---|---|
| **pending** | 아직 완료 안 됨, 작업 진행 중 | 없음 |
| **fulfilled** | 성공적으로 완료 | T 타입 값을 꺼낼 수 있음 |
| **rejected** | 실패, 에러 발생 | `catch`로 처리해야 함 |

### fetch → .json() → await 단계별 타입 추적

실제로 `fetch`를 쓸 때 어디서 어떤 타입이 나오는지 따라가보자:

```typescript
// 1단계: fetch 자체의 반환 타입
const res = fetch('https://api.example.com/data');
//    ↑
//    타입: Promise<Response>  — 아직 응답이 안 온 상태

// 2단계: await로 Promise를 풀면
const res = await fetch('https://api.example.com/data');
//    ↑
//    타입: Response  — Promise가 풀려서 실제 응답 객체

// 3단계: .json()의 반환 타입
const json = res.json();
//    ↑
//    타입: Promise<unknown>  — 아직 JSON 파싱이 안 된 상태

// 4단계: await로 다시 풀면
const json = await res.json();
//    ↑
//    타입: unknown  — TypeScript는 JSON 내용을 모르므로 unknown

// 5단계: 타입 단언으로 구체적인 타입을 붙임
const json = await res.json() as { balance: number };
//    ↑
//    타입: { balance: number }
```

> **핵심**: `Promise<T>`의 `T`는 "나중에 꺼낼 수 있는 값의 타입"이다. `await`은 그 봉투를 뜯어서 T를 꺼내는 연산이다.

---

## 6. async / await 내부 동작

`async`와 `await`은 Promise를 더 읽기 쉽게 다루는 문법이다.

### async를 붙이면 자동으로 일어나는 2가지

`async` 키워드는 두 가지를 동시에 한다:

1. **함수 안에서 `await`을 쓸 수 있게 된다**
2. **이 함수는 항상 `Promise`를 반환한다** — `return 42`라고 써도 실제로는 `Promise<number>`가 반환됨

```typescript
// ─── async 없는 버전 ───
function double(n: number): number {
  return n * 2;
  // 반환 타입: number
}

// ─── async 붙인 버전 ───
async function double(n: number): Promise<number> {
  return n * 2;
  // 실제로는 return Promise.resolve(n * 2)와 동일
  // async가 자동으로 Promise로 감싸줌
}
```

### await 없이 쓰면 타입이 어떻게 달라지나

```typescript
async function fetchBalance(address: string): Promise<number> {
  // ... 내부에서 DB나 API를 호출
}

async function main() {
  // ❌ await 없이 쓰면 — Promise 객체 자체가 변수에 담김
  const p = fetchBalance('0xAAA');
  //    ↑
  //    타입: Promise<number>  (숫자가 아님!)
  console.log(p + 100);  // 에러 또는 "Promise + 100" → 이상한 결과

  // ✅ await 있으면 — Promise가 완료될 때까지 기다렸다가 값을 꺼냄
  const n = await fetchBalance('0xAAA');
  //    ↑
  //    타입: number  (실제 숫자)
  console.log(n + 100);  // 정상 동작
}
```

### await은 Promise를 풀어서 값으로 만드는 과정

```
Promise<number>   →   await   →   number
     ↑                              ↑
봉투 (아직 값이 없음)           봉투를 뜯으면 나오는 실제 값
```

```typescript
// await이 하는 일을 단계별로
const p: Promise<number> = fetchBalance('0xAAA');
// p는 "나중에 number를 줄 것"이라는 약속 객체. 지금 당장 숫자가 아님.

const n: number = await p;
// await이 p의 Promise가 fulfilled 될 때까지 이 함수 실행을 일시 정지.
// fulfilled되면 Promise 안의 number 값을 꺼내서 n에 담음.
```

### await는 async 함수 안에서만 사용 가능

```typescript
// ❌ async 없는 함수에서는 await 사용 불가
function notAsync() {
  const balance = await fetchBalance('0xAAA');
  // 에러: 'await' expressions are only allowed within async functions
}

// ✅ async를 붙이면 해결
async function withAsync() {
  const balance = await fetchBalance('0xAAA');  // OK
}
```

> **핵심**: `async`는 "이 함수는 비동기다, 반환값은 자동으로 Promise로 감싼다, 내부에서 await을 쓸 수 있다"는 선언이다. `await`은 `Promise<T>`를 받아서 `T`를 꺼내는 연산자다.

---

## 7. 콜백 함수 — 배열 메서드

함수를 인수로 넘기는 패턴이다. 강의 코드에서 매일 나온다.

### 콜백 함수란?

`p => p.eventTypes.includes(eventType)` — 이게 콜백 함수다.  
`filter`가 배열의 각 요소를 꺼내서 이 함수에 넣어주는 것이다.

읽는 방법: "각 요소를 `p`라는 이름으로 받아서 화살표 뒤의 내용을 실행해라."

```typescript
// 풀어쓰면 이런 의미
processors.filter(function(p) {
  return p.eventTypes.includes(eventType);
});

// 화살표로 줄이면
processors.filter(p => p.eventTypes.includes(eventType));
```

### filter / map / forEach — 세 메서드의 차이

```typescript
const nums = [1, 2, 3, 4, 5];

// filter — 조건(true/false 반환)에 따라 요소를 걸러냄
// 입력 길이 ≥ 출력 길이 (조건 통과한 것만 남음)
const evens = nums.filter(n => n % 2 === 0);
// 결과: [2, 4]

// map — 모든 요소를 변환, 입력과 출력의 길이가 항상 같음
// 각 요소를 다른 형태로 1:1 변환
const doubled = nums.map(n => n * 2);
// 결과: [2, 4, 6, 8, 10]

// forEach — 각 요소에 어떤 작업만 하고, 새 배열을 반환하지 않음
// 리턴값이 void (undefined)
nums.forEach(n => console.log(n));  // 1, 2, 3, 4, 5 출력

// ❌ forEach 결과를 변수에 담는 건 대부분 실수
const result = nums.forEach(n => n * 2);  // result는 undefined
// ✅ 변환 결과를 담으려면 map 사용
const result = nums.map(n => n * 2);      // result는 [2, 4, 6, 8, 10]
```

| 메서드 | 콜백 반환 | 메서드 반환 | 용도 |
|---|---|---|---|
| `filter` | `boolean` | 조건 통과한 요소 배열 | 걸러내기 |
| `map` | 변환된 값 | 변환된 값 배열 (길이 동일) | 변환하기 |
| `forEach` | 없음 (무시됨) | `undefined` | 부수 효과만 (로그, 저장 등) |

---

## 8. filter + map + Promise.all 조합

강의 코드에서 가장 자주 나오는 패턴이다. 각 메서드를 따로 이해하고, 합쳐진 흐름을 단계별로 보자.

### 각 메서드 단독 역할

```typescript
const processors = [
  { eventTypes: ['NFT_ISSUED', 'NFT_TRANSFER'], process: async (msg) => { ... } },
  { eventTypes: ['TOKEN_TRANSFER'],             process: async (msg) => { ... } },
  { eventTypes: ['NFT_ISSUED'],                 process: async (msg) => { ... } },
];

const eventType = 'NFT_ISSUED';

// 1. filter — NFT_ISSUED를 처리할 수 있는 것만 남김
const matched = processors.filter(p => p.eventTypes.includes(eventType));
// 결과: processor[0], processor[2] — 두 개만 남음

// 2. map — 각 processor에 메시지를 넣어 실행, Promise 배열이 됨
const promises = matched.map(p => p.process(msg));
// 결과: [Promise<void>, Promise<void>] — 두 Promise가 이미 실행 중

// 3. Promise.all — 모든 Promise가 완료될 때까지 기다림
await Promise.all(promises);
// 두 processor가 모두 완료되면 다음으로 넘어감
```

### 실제 강의 코드처럼 한 줄로 합친 형태

```typescript
await Promise.all(
  processors
    .filter(p => p.eventTypes.includes(eventType))
    .map(p => p.process(msg))
);
```

### 이 흐름이 어떻게 작동하는지 단계별 시각화

```
processors (배열)
     ↓
.filter(...)           ← 조건 통과한 processor만 남김
     ↓
matched (작은 배열)
     ↓
.map(p => p.process(msg))  ← 각 processor 실행 → Promise 반환
     ↓
[Promise<void>, Promise<void>, ...]  ← 이미 병렬로 실행 중인 Promise들
     ↓
Promise.all(...)       ← 전부 완료될 때까지 기다림
     ↓
완료 (모든 processor가 처리 끝)
```

### Promise.all이 왜 필요한가?

```typescript
// ❌ 순차 실행 — 하나 끝나야 다음 시작 (느림)
for (const p of matched) {
  await p.process(msg);  // 첫 번째 끝나야 두 번째 시작
}

// ✅ 병렬 실행 — 모두 동시에 시작하고 전부 끝날 때까지 기다림 (빠름)
await Promise.all(matched.map(p => p.process(msg)));
```

`map`은 호출하는 순간 각 `process(msg)`를 모두 실행시킨다.  
`Promise.all`은 이미 실행 중인 Promise들이 전부 완료되기를 기다린다.  
결과적으로 모든 processor가 동시에 작동하고, 가장 느린 것이 끝나는 시점에 await이 풀린다.

> **핵심**: `filter`로 걸러내고 → `map`으로 Promise 배열 만들고 → `Promise.all`로 병렬 대기. 이 세 줄 조합은 "여러 비동기 작업을 동시에 실행하고 전부 기다린다"는 패턴이다.

---

## 자주 하는 실수

**실수 1 — async 없이 await 사용**
```typescript
// ❌
function fetchData() {
  const result = await api();  // 에러: 'await' expressions are only allowed within async functions
}

// ✅
async function fetchData() {
  const result = await api();  // OK
}
```

**실수 2 — async 함수 리턴 타입을 Promise 없이 씀**
```typescript
// ❌
async function getData(): string {           // 에러: async 함수는 항상 Promise를 반환
  return 'hello';
}

// ✅
async function getData(): Promise<string> {  // OK
  return 'hello';
}
```

이유: `async`를 붙이면 리턴값이 자동으로 `Promise`로 포장되기 때문에, 타입 선언도 `Promise<T>`로 해야 한다.

**실수 3 — 객체 리턴할 때 소괄호 생략**
```typescript
// ❌ 함수 본문으로 해석되어 undefined 반환
const toObj = (x: number) => { value: x };

// ✅ 소괄호로 감싸야 객체로 인식
const toObj = (x: number) => ({ value: x });
```

**실수 4 — forEach의 결과를 변수에 담음**
```typescript
// ❌ result는 undefined — forEach는 반환값 없음
const result = items.forEach(x => x * 2);

// ✅ map은 새 배열 반환
const result = items.map(x => x * 2);
```

**실수 5 — Promise를 await 없이 사용**
```typescript
async function main() {
  // ❌ await 빠짐 — balance는 number가 아닌 Promise<number>
  const balance = fetchBalance('0xAAA');
  console.log(balance + 100);  // "Promise + 100" → 이상한 결과

  // ✅
  const balance = await fetchBalance('0xAAA');  // balance는 number
  console.log(balance + 100);  // 정상 동작
}
```

---

## 체크리스트

- [ ] `=>` 보고 화살표 함수라고 즉시 인식한다
- [ ] 함수 본문이 한 줄일 때 중괄호와 `return`을 동시에 생략할 수 있음을 안다
- [ ] 화살표 함수로 객체를 리턴할 때 `({ })` 소괄호가 필요한 이유를 설명할 수 있다 (JS가 `{`를 함수 본문으로 인식하기 때문)
- [ ] `?:` (선택적)과 `= 기본값` 차이, undefined 명시 전달 시 동작 차이를 설명할 수 있다
- [ ] `(fn: () => Promise<void>)` 같은 함수 타입 표현을 토큰 단위로 읽을 수 있다
- [ ] `type Handler = ...`로 함수 타입에 이름을 붙이는 이유를 안다 (반복 방지, 단일 관리)
- [ ] `Promise<T>`가 "나중에 T를 주겠다는 약속"임을 설명할 수 있다
- [ ] `Promise<void>` / `Promise<number>` / `Promise<string>` 차이를 안다
- [ ] `await Promise<T>` 하면 `T`가 나온다는 것을 안다
- [ ] `async`를 붙이면 자동으로 일어나는 2가지를 말할 수 있다 (await 사용 가능 + 자동 Promise 래핑)
- [ ] await 없이 쓰면 변수에 Promise 객체 자체가 담긴다는 것을 안다
- [ ] `filter` → `map` → `Promise.all` 조합이 어떤 흐름인지 설명할 수 있다
- [ ] `map` vs `forEach` 차이 — map은 새 배열 반환, forEach는 반환값 없음

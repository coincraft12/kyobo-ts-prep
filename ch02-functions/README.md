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

## 2. 화살표 함수 줄이는 규칙

화살표 함수는 본문이 짧을수록 문법을 생략해서 더 짧게 쓸 수 있다. 단계별로 보자.

```typescript
// 가장 풀어쓴 형태 — 중괄호 있고, return 있음
const greet = (name: string): string => {
  return `Hello, ${name}`;
};

// 본문이 한 줄이면 → 중괄호 + return 동시에 생략 가능
const greet = (name: string): string => `Hello, ${name}`;
```

이 두 줄은 완전히 동일하게 동작한다. `=>` 다음에 중괄호 없이 바로 표현식이 오면, 그 표현식이 곧 리턴값이다. 이걸 "암묵적 반환(implicit return)"이라고 한다.

```typescript
// 매개변수가 하나이면 괄호 생략 가능 — 단, TypeScript에서는 타입을 써야 해서 보통 안 생략
const double = n => n * 2;         // JS에서는 동작, TS에서는 n의 타입을 모름
const double = (n: number) => n * 2; // TS에서 올바른 형태
```

### 객체를 리턴할 때 — 가장 많이 하는 실수

```typescript
// 이렇게 하면 중괄호를 "함수 본문"으로 인식 — 에러 또는 undefined 반환
const toObj = (x: number) => { value: x };   // 잘못됨
// 이유: TS/JS는 { } 를 보면 "함수 본문 시작"으로 먼저 해석한다
// 결과: value: x 는 "레이블 달린 문장"으로 처리되고, 함수는 undefined를 반환함

// 소괄호로 감싸면 "이건 객체다"라고 명시
const toObj = (x: number) => ({ value: x }); // OK
```

왜 이렇게 해야 할까? `{}`가 "함수 본문"인지 "객체 리터럴"인지 구분이 안 되는 경우에, TypeScript는 함수 본문으로 먼저 해석한다. 소괄호 `()`로 감싸면 "이건 표현식이다"라고 알려주는 것이다.

```typescript
// 실제로 이렇게 자주 쓰임 — 배열의 map에서 객체를 바로 만들 때
const items = [1, 2, 3];
const result = items.map(n => ({ id: n, value: n * 2 }));
// 결과: [{ id: 1, value: 2 }, { id: 2, value: 4 }, { id: 3, value: 6 }]
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

createTx('0xAAA', 100);                    // OK — from, amount만 넘김
createTx('0xAAA', 100, '메모');            // OK — memo도 넘김
createTx('0xAAA', 100, undefined, 5);      // OK — memo를 건너뛰고 fee만 넘김
```

### `?:` 선택적 매개변수 — 있어도 되고 없어도 된다

`memo?: string`은 "memo는 string 타입이고, 넘기지 않아도 된다"는 의미다. 안 넘기면 함수 안에서 `memo`의 값은 `undefined`가 된다.

```typescript
function createTx(from: string, memo?: string): string {
  // memo는 string 또는 undefined일 수 있음
  if (memo !== undefined) {
    return `${from}: ${memo}`;
  }
  return from;
}
```

함수 안에서 `memo`를 쓸 때 undefined일 수 있다는 걸 항상 고려해야 한다. TypeScript도 이를 강제한다.

### `= 기본값` — 안 넘기면 이 값을 써라

`fee: number = 0`은 "fee를 안 넘기면 0으로 처리해라"는 의미다.

```typescript
function createTx(from: string, fee: number = 0): string {
  // fee를 안 넘겨도 이 함수 안에서 fee는 항상 number다 — undefined가 될 일이 없음
  return `${from}, fee: ${fee}`;
}
```

함수 안에서 `fee`는 항상 `number`임이 보장된다. `undefined` 체크가 필요 없다.

### `?:` vs `= 기본값` 차이 정리

| | `memo?: string` | `fee: number = 0` |
|---|---|---|
| 안 넘기면? | `undefined` | 기본값(0) |
| 함수 안 타입 | `string \| undefined` | `number` |
| undefined를 명시적으로 넘기면? | `undefined` 그대로 | 기본값으로 처리 |

```typescript
createTx('A', undefined, 5);  // memo는 undefined, fee는 5
// undefined를 명시적으로 넘기면?
// memo?: string → undefined 그대로
// fee: number = 0 → undefined를 받아도 0으로 대체
```

### 주의: 선택적 매개변수는 필수 매개변수 뒤에 와야 한다

```typescript
// 에러: 선택적 매개변수 뒤에 필수 매개변수가 올 수 없음
function bad(memo?: string, fee: number): string { ... }

// OK: 필수가 먼저, 선택적·기본값이 뒤
function good(fee: number, memo?: string): string { ... }
```

---

## 4. 함수 타입

함수를 변수처럼 넘길 때, 그 함수의 "모양"을 타입으로 표현할 수 있다.

```typescript
// 함수 타입 표현식 — "(매개변수) => 리턴타입"
type Handler = (eventType: string) => Promise<void>;
```

이걸 읽는 방법: "Handler는 string을 받아서 Promise<void>를 반환하는 함수의 타입이다."

`type Handler = ...`은 이 함수 모양에 이름을 붙이는 것이다. 이제 코드 어디서든 `Handler`라고 쓰면 저 함수 형태를 뜻한다.

```typescript
// 매개변수로 함수 받기
async function runHandler(type: string, handler: Handler): Promise<void> {
  await handler(type);  // handler는 반드시 Handler 타입이어야 함
}

// 사용 — 함수를 직접 넘김
await runHandler('NFT_ISSUED', async (type) => {
  console.log('처리:', type);
});
```

여기서 `async (type) => { ... }` 부분이 `Handler` 타입에 맞는 함수다. TypeScript가 `runHandler`의 두 번째 매개변수 타입이 `Handler`임을 알기 때문에 `type`의 타입을 자동 추론한다.

### 강의 코드에서 자주 보이는 형태

```typescript
// "() => Promise<void>" 타입의 fn을 받아 실행
async run(key: string, fn: () => Promise<void>): Promise<void>
```

이 시그니처를 분해하면:

- `key: string` — 문자열 key를 받는다
- `fn: () => Promise<void>` — 매개변수 없이 `Promise<void>`를 반환하는 함수를 받는다
- `: Promise<void>` — 이 함수 자체의 리턴 타입도 `Promise<void>`다

이 패턴은 "어떤 비동기 작업(fn)을 key와 함께 실행하는 함수"를 만들 때 매우 자주 나온다.

---

## 5. Promise — 나중에 완료되는 작업

`Promise<T>`는 "지금 당장 값이 없고, 나중에 T 타입 값이 완성될 것"을 나타내는 타입이다.

### 왜 Promise가 필요한가?

DB 조회, API 호출, 파일 읽기는 시간이 걸린다. JavaScript는 이 기다리는 동안 멈추지 않고 다른 일을 처리한다. 그래서 "나중에 결과가 나오면 줄게"라는 약속 객체를 먼저 반환하는 것이다.

비유하자면: 음식점에서 주문하면 "진동벨(Promise)"을 준다. 벨이 울릴 때까지 기다리는 게 아니라, 받고 나서 다른 일을 할 수 있다. 벨이 울리면 (fulfilled) 음식을 받는다.

```typescript
// 지금 당장 number를 주지 않고, 나중에 number를 줄 것을 약속
function fetchBalance(address: string): Promise<number> {
  // 내부에서 DB나 API를 호출하고 있음
}

const p = fetchBalance('0xAAA');  // p의 타입: Promise<number>
                                   // 이 시점에는 아직 숫자가 아님 — 약속 상태(pending)
```

### Promise 상태 3가지

- **pending**: 아직 완료 안 됨 — 작업이 진행 중
- **fulfilled**: 성공적으로 완료, 값 있음 — T 타입의 값을 꺼낼 수 있음
- **rejected**: 실패, 에러 있음 — `catch`로 처리해야 함

### T 자리에 뭐가 오는지가 핵심

```typescript
// Promise<void> — 완료만 알려주고 반환값 없음
// await 하면 아무 값도 안 나옴 (undefined)
async function saveToDB(): Promise<void> { ... }
const result = await saveToDB();  // result의 타입: void (값 없음)

// Promise<string> — 완료되면 string을 반환
// await 하면 string이 나옴
async function getName(): Promise<string> { ... }
const name = await getName();     // name의 타입: string

// Promise<number[]> — 완료되면 number 배열을 반환
// await 하면 number[]이 나옴
async function getScores(): Promise<number[]> { ... }
const scores = await getScores(); // scores의 타입: number[]
```

핵심 패턴: `await Promise<T>` → `T`가 나온다. 꺾쇠 괄호 안의 타입이 await 결과물이다.

강의 코드에서 `Promise<void>`가 가장 많이 나온다. "처리만 하고 값은 안 줌" 패턴이다. 예를 들어 블록체인에 트랜잭션을 전송하는 함수는 성공 여부만 중요하고, 특별한 리턴값이 없는 경우가 많다.

---

## 6. async / await

`async`와 `await`은 Promise를 더 읽기 쉽게 다루는 문법이다.

```typescript
async function fetchBalance(address: string): Promise<number> {
  const result = await someApi(address);  // someApi가 반환한 Promise가 끝날 때까지 기다림
  return result.balance;                  // 리턴값은 자동으로 Promise<number>로 포장됨
}
```

### async를 붙이면 무슨 일이 일어나나?

`async`를 붙이면 두 가지가 자동으로 된다:

1. 함수 안에서 `await`을 쓸 수 있게 된다
2. 이 함수는 항상 `Promise`를 반환한다 — `return 42`라고 써도 실제로는 `Promise<number>`가 반환됨

```typescript
async function double(n: number): Promise<number> {
  return n * 2;
  // 실제로는 return Promise.resolve(n * 2) 와 동일
}
```

### await은 Promise를 "풀어서" 값으로 만든다

`await`은 `Promise<T>`를 받아서 T를 꺼내는 연산자다.

```typescript
// await 없이 — Promise 객체가 그대로 남음
const p: Promise<number> = fetchBalance('0xAAA');  // p는 Promise, 숫자가 아님

// await 있음 — Promise가 완료될 때까지 기다렸다가 값을 꺼냄
const n: number = await fetchBalance('0xAAA');     // n은 실제 number 값
```

비유: `Promise<number>`는 "숫자가 들어있는 봉투"다. `await`은 그 봉투를 뜯어서 숫자를 꺼내는 행위다.

### await는 async 함수 안에서만 사용 가능

```typescript
// 최상위 레벨에서의 await — ES2022 이후 모듈에서는 가능하지만 일반적으론 async 함수 안에서만
async function main() {
  const balance = await fetchBalance('0xAAA');  // OK
}

// async 없는 함수에서는 await 사용 불가
function notAsync() {
  const balance = await fetchBalance('0xAAA');  // 에러!
}
```

---

## 7. 콜백 함수 — 배열 메서드

강의 코드에서 매일 나온다. "함수를 인수로 넘기는 패턴"이다.

```typescript
const processors = [processorA, processorB, processorC];

// filter — 조건에 맞는 것만 남김, 조건 함수가 true인 요소만 유지
const matched = processors.filter(p => p.eventTypes.includes(eventType));

// map — 각 요소를 변환, 배열의 모든 요소를 다른 형태로 바꿈
const promises = processors.map(p => p.process(msg));

// forEach — 각 요소에 함수 실행, 리턴값 없음
processors.forEach(p => console.log(p.eventTypes));
```

### 콜백 함수란?

`p => p.eventTypes.includes(eventType)` — 이게 콜백 함수다. `filter`가 배열의 각 요소를 꺼내서 이 함수에 넣어주는 것이다.

읽는 방법: "각 요소를 p라는 이름으로 받아서 화살표 뒤의 내용을 실행해라."

```typescript
// 풀어쓰면 이런 의미
processors.filter(function(p) {
  return p.eventTypes.includes(eventType);
});

// 화살표로 줄이면
processors.filter(p => p.eventTypes.includes(eventType));
```

### 세 메서드의 차이

```typescript
const nums = [1, 2, 3, 4, 5];

// filter — 조건(true/false 반환)에 따라 요소를 걸러냄
// 입력: [1,2,3,4,5] / 출력: 조건을 통과한 요소만
const evens = nums.filter(n => n % 2 === 0);       // [2, 4]

// map — 모든 요소를 변환, 입력과 출력의 길이가 항상 같음
// 입력: [1,2,3,4,5] / 출력: [변환값, 변환값, ...]
const doubled = nums.map(n => n * 2);              // [2, 4, 6, 8, 10]

// forEach — 각 요소에 어떤 작업만 하고, 새 배열을 반환하지 않음
// 리턴값이 없음 (undefined)
nums.forEach(n => console.log(n));                 // 1, 2, 3, 4, 5 출력
const result = nums.forEach(n => n * 2);           // result는 undefined — 이 실수 주의
```

실수 포인트: `map`은 새 배열을 반환하고, `forEach`는 undefined를 반환한다. 변환 결과를 쓰려면 `map`을 써야 한다. `forEach` 결과를 변수에 담는 건 대부분 실수다.

### 비동기 콜백과 함께 쓸 때

```typescript
// map으로 Promise 배열을 만들 수 있다
const promises: Promise<void>[] = processors.map(p => p.process(msg));
// 각 p.process(msg)는 Promise<void>를 반환
// map은 그것들을 모아서 Promise<void>[] 배열을 만든다

// Promise.all로 모든 Promise를 병렬 실행
await Promise.all(promises);
// 모든 처리가 완료될 때까지 기다림
```

이 패턴 — `map`으로 Promise 배열을 만들고 `Promise.all`로 병렬 실행 — 은 강의 코드에서 매우 자주 나온다.

---

## 자주 하는 실수

**실수 1 — async 없이 await 사용**
```typescript
function fetchData() {
  const result = await api();  // 에러: 'await' expressions are only allowed within async functions
}

// 고치려면 async를 붙인다
async function fetchData() {
  const result = await api();  // OK
}
```

**실수 2 — async 함수 리턴 타입을 Promise 없이 씀**
```typescript
async function getData(): string {           // 에러: async 함수는 항상 Promise를 반환
  return 'hello';
}
async function getData(): Promise<string> {  // OK
  return 'hello';
}
```

이유: `async`를 붙이면 리턴값이 자동으로 `Promise`로 포장되기 때문에, 타입 선언도 `Promise<T>`로 해야 한다.

**실수 3 — 객체 리턴할 때 괄호 생략**
```typescript
const toObj = (x: number) => { value: x };   // 잘못됨 — undefined 반환
const toObj = (x: number) => ({ value: x }); // OK — 소괄호로 감싸야 함
```

**실수 4 — forEach의 결과를 변수에 담음**
```typescript
const result = items.forEach(x => x * 2);  // result는 undefined — forEach는 반환값 없음
const result = items.map(x => x * 2);      // OK — map은 새 배열 반환
```

**실수 5 — Promise를 await 없이 사용**
```typescript
async function main() {
  const balance = fetchBalance('0xAAA');     // await 빠짐 — balance는 number가 아닌 Promise<number>
  console.log(balance + 100);               // 에러 또는 "Promise + 100" → 이상한 결과
  
  const balance = await fetchBalance('0xAAA'); // OK — balance는 number
  console.log(balance + 100);               // 정상 동작
}
```

---

## 체크리스트

- [ ] `=>` 보고 화살표 함수라고 즉시 인식한다
- [ ] 함수 본문이 한 줄일 때 중괄호와 `return`을 생략할 수 있음을 안다
- [ ] 화살표 함수로 객체를 리턴할 때 `({ })` 소괄호가 필요한 이유를 설명할 수 있다
- [ ] `?:` (선택적)과 `= 기본값` 차이를 설명할 수 있다
- [ ] `(fn: () => Promise<void>)` 같은 함수 타입 표현을 읽을 수 있다
- [ ] `Promise<T>`가 "나중에 T를 주겠다는 약속"임을 설명할 수 있다
- [ ] `Promise<void>` / `Promise<number>` / `Promise<string>` 차이를 안다
- [ ] `await Promise<T>` 하면 `T`가 나온다는 것을 안다
- [ ] `async function foo(): Promise<T>` 형태를 읽을 수 있다
- [ ] `array.filter(p => 조건)` 패턴이 뭘 하는지 설명할 수 있다
- [ ] `map` vs `forEach` 차이 — map은 새 배열 반환, forEach는 반환값 없음

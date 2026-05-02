# CH05 — 비동기 · Promise · 에러

## 핵심 한 줄
> 블록체인 코드는 모든 게 비동기다. Promise의 내부 상태 전환을 이해하고, 에러를 타입별로 구분하는 게 이 챕터의 전부.

---

## 1. Promise란 — 내부 구조부터

### "나중에 값을 줄게"라는 약속 객체

```typescript
const p: Promise<number> = new Promise((resolve, reject) => {
  setTimeout(() => resolve(42), 1000);
});
```

이 코드가 처음 보면 마법처럼 느껴진다. 한 토큰씩 분해한다.

---

### `new Promise((resolve, reject) => { ... })` — 각 부분의 역할

```
new Promise(
  (resolve, reject) => {   ← 이 함수를 "executor"라고 부른다
    setTimeout(() => resolve(42), 1000);
  }
)
```

**`resolve`** — "성공했어, 값은 이거야"라고 알릴 때 호출하는 함수다.

```typescript
resolve(42);  // Promise가 fulfilled 상태로 전환. 값은 42.
```

**`reject`** — "실패했어, 이유는 이거야"라고 알릴 때 호출하는 함수다.

```typescript
reject(new Error('네트워크 오류'));  // Promise가 rejected 상태로 전환.
```

**중요**: `resolve`와 `reject` 중 먼저 호출된 것만 효과가 있다. 두 번째는 무시된다.

```typescript
new Promise((resolve, reject) => {
  resolve(42);           // fulfilled
  reject(new Error());   // 무시됨 — 이미 완료된 Promise는 상태가 바뀌지 않음
});
```

**`Promise<number>`** — 꺾쇠 안의 타입이 "나중에 받을 값의 타입"이다.

```typescript
Promise<number>  // resolve(42)로 숫자를 줄 것
Promise<string>  // resolve('hello')로 문자열을 줄 것
Promise<void>    // 값 없이 완료만 알릴 것 (resolve() 호출)
```

---

### Promise의 세 가지 상태 — 전환 흐름

```
[pending]
    │
    ├─── resolve() 호출 ───▶ [fulfilled]  ← 값이 있음
    │
    └─── reject() 호출 ────▶ [rejected]   ← 에러가 있음
         또는 throw
```

- 처음 생성되면 항상 `pending` 상태다.
- `resolve()` 또는 `reject()`가 호출되는 순간 상태가 바뀐다.
- 한 번 바뀐 상태는 **절대 되돌릴 수 없다**. `fulfilled`에서 `rejected`로 가는 화살표가 없다.

---

### Promise를 직접 만드는 경우 vs async 함수

**언제 `new Promise()`를 직접 쓰는가:**

콜백 기반 API를 Promise로 감쌀 때다. `setTimeout`, `fs.readFile` 같은 구식 Node.js API들이 여기 해당한다.

```typescript
// setTimeout은 콜백 기반 — Promise가 아님
// 이걸 Promise로 감싸야 await로 쓸 수 있음
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);  // ms 후에 resolve() 호출
  });
}

await delay(1000);  // 이제 await로 쓸 수 있음
```

**`async` 함수에서는 Promise가 자동으로 생성된다:**

```typescript
// 직접 만드는 버전
function getBalance(): Promise<number> {
  return new Promise((resolve) => {
    resolve(1000);
  });
}

// async 함수 버전 — 위와 완전히 동일
async function getBalance(): Promise<number> {
  return 1000;  // 자동으로 Promise.resolve(1000)으로 감싸짐
}
```

이미 Promise를 리턴하는 함수(대부분의 fetch, DB 쿼리)를 쓸 때는 `new Promise()`를 직접 만들 이유가 없다. 그때는 `async/await`만 쓰면 된다.

---

## 2. async / await — Promise를 읽기 쉽게

### before / after 비교

```typescript
// ❌ Promise 체인 방식 — 중첩이 깊어지면 읽기 어려움
fetchBalance('0xAAA')
  .then(balance => {
    return fetchHistory(balance);
  })
  .then(history => {
    return processHistory(history);
  })
  .catch(err => console.error(err));

// ✅ async/await 방식 — 위에서 아래로 읽힌다
async function main() {
  const balance = await fetchBalance('0xAAA');
  const history = await fetchHistory(balance);
  await processHistory(history);
}
```

내부 동작은 완전히 동일하다. `async/await`는 문법적 편의(syntactic sugar)다.

---

### `await` 없이 쓰면 타입이 어떻게 달라지는가

```typescript
// ❌ await 없음 — Promise 객체 자체가 담김
const balance = fetchBalance('0xAAA');
//    ^^^^^^^
//    타입: Promise<number>
//    실제로 받은 것: 약속 객체. 숫자 아님.
console.log(balance + 100);  // [object Promise]100 — 버그

// ✅ await 있음 — Promise가 풀려서 안의 값이 나옴
const balance = await fetchBalance('0xAAA');
//    ^^^^^^^
//    타입: number
//    실제로 받은 것: 1000 같은 숫자 값
console.log(balance + 100);  // 1100 — 정상
```

**`await`가 정확히 하는 일:**

```
fetchBalance('0xAAA')  →  Promise<number>  (아직 대기 중)
                              ↓
                          await
                              ↓
                           1000           (number, 풀린 값)
```

`await`는 Promise가 `fulfilled` 또는 `rejected` 상태가 될 때까지 이 자리에서 기다린다. `fulfilled`면 값을 꺼내고, `rejected`면 에러를 던진다.

---

### `async` 함수가 자동으로 하는 2가지

```typescript
async function getBalance(): Promise<number> {
  return 1000;
}
```

1. **리턴값을 자동으로 `Promise.resolve()`로 감싼다.** `return 1000`이라고 써도 실제로는 `return Promise.resolve(1000)`이 된다.
2. **함수 안에서 `await` 키워드를 쓸 수 있게 한다.** `async` 없는 함수에서 `await`를 쓰면 SyntaxError가 난다.

```typescript
// ❌ await는 async 함수 안에서만 쓸 수 있다
function notAsync() {
  const balance = await fetchBalance('0xAAA');  // SyntaxError
}

// ✅ async 함수 안에서
async function isAsync() {
  const balance = await fetchBalance('0xAAA');  // OK
}
```

> **핵심:** `async`는 선언이고, `await`는 그 안에서 쓰는 연산자다. 항상 쌍으로 다닌다.

---

## 3. try / catch — 에러 잡기

```typescript
async function safe() {
  try {
    const result = await riskyOperation();
    return result;
  } catch (err) {
    // err의 타입은 unknown (TS strict 모드)
    console.error(err);
    return null;
  }
}
```

### 제어 흐름

```
try 블록 진입
  → await riskyOperation()
      → Promise fulfilled → result 변수에 값 할당 → 정상 완료, catch 건너뜀
      → Promise rejected  → catch 블록으로 즉시 점프, try의 나머지 코드는 실행 안 됨
```

`await`한 Promise가 `rejected`되면 에러가 "던져진" 것으로 취급된다. `throw new Error()`와 같은 효과다.

### `catch (err)`에서 `err`는 왜 `unknown`인가

JavaScript는 `throw`할 때 어떤 값이든 던질 수 있기 때문이다.

```typescript
throw new Error('에러');   // Error 객체 — 이게 일반적
throw 'string error';     // 문자열도 던질 수 있음
throw 42;                 // 숫자도 던질 수 있음
throw { code: 500 };      // 객체도 던질 수 있음
```

TypeScript는 "어떤 값이 올지 모른다"고 보수적으로 판단해서 `unknown`으로 타입을 잡는다. 그래서 `err.message`에 바로 접근하면 타입 에러가 난다.

```typescript
// ❌ err는 unknown — .message에 바로 접근 불가
catch (err) {
  console.log(err.message);  // 에러: Object is of type 'unknown'
}

// ✅ 타입을 좁힌 후 접근
catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
}
```

- `err instanceof Error` — `err`가 Error 클래스의 인스턴스인지 런타임에 확인. 참이면 TypeScript도 이 블록 안에서 `err`를 `Error` 타입으로 좁혀준다.
- `String(err)` — Error 인스턴스가 아닌 경우 강제로 문자열로 변환한다.

---

## 4. 커스텀 에러 클래스 — 단계별 분해

일반 Error와 특수 에러를 구분해서 다르게 처리하기 위해 사용한다.

```typescript
class DeferredProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeferredProcessingError';
  }
}

class MaxRetriesExceededError extends Error {
  constructor(public readonly attempts: number, cause?: Error) {
    super(`최대 재시도 횟수 초과: ${attempts}회`);
    this.name = 'MaxRetriesExceededError';
    if (cause) this.cause = cause;
  }
}
```

---

### `super(message)` — 왜 반드시 호출해야 하는가

`extends Error`는 "Error 클래스를 상속받는다"는 뜻이다. JavaScript에서 클래스를 상속받으면 **생성자에서 `super()`를 먼저 호출해야 한다**. 이 호출이 부모 클래스(Error)의 초기화를 실행한다.

`super(message)`를 호출하면 Error 클래스가 내부적으로 아래 두 가지를 한다:

1. `this.message = message` — 에러 메시지 설정
2. 스택 트레이스(stack trace) 기록 — "에러가 발생한 파일의 어느 줄인지" 추적 정보

`super()`를 생략하면 JavaScript 런타임이 에러를 던진다. 선택이 아니라 필수다.

```typescript
// ❌ super() 없이 — 런타임 에러
class BadError extends Error {
  constructor(message: string) {
    // super(message) 빠짐
    this.message = message;  // ReferenceError: Must call super constructor
  }
}

// ✅ super() 먼저 호출
class GoodError extends Error {
  constructor(message: string) {
    super(message);          // 부모 Error 초기화
    this.name = 'GoodError'; // 그다음에 자식 초기화
  }
}
```

---

### `this.name` — 설정 전/후 콘솔 출력 비교

`Error`를 상속받아도 `name` 필드의 기본값은 `'Error'`로 고정되어 있다.

```typescript
// this.name 설정 안 한 버전
class DeferredProcessingError extends Error {
  constructor(message: string) {
    super(message);
    // this.name 생략
  }
}

const err = new DeferredProcessingError('나중에 처리해야 함');
console.log(err.toString());
// "Error: 나중에 처리해야 함"  ← DeferredProcessingError가 아닌 Error로 찍힘
console.log(err.name);
// "Error"  ← 클래스 이름이 아님
```

```typescript
// this.name 설정한 버전
class DeferredProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeferredProcessingError';  // 이 줄이 핵심
  }
}

const err = new DeferredProcessingError('나중에 처리해야 함');
console.log(err.toString());
// "DeferredProcessingError: 나중에 처리해야 함"  ← 바로 알아볼 수 있음
console.log(err.name);
// "DeferredProcessingError"
```

디버깅할 때 로그를 보는 순간 어떤 에러인지 알 수 있어야 한다. 그래서 클래스 이름으로 명시적으로 덮어쓴다.

---

### `cause` 패턴 — 에러를 감싸는 이유

```typescript
class MaxRetriesExceededError extends Error {
  constructor(public readonly attempts: number, cause?: Error) {
    super(`최대 재시도 횟수 초과: ${attempts}회`);
    this.name = 'MaxRetriesExceededError';
    if (cause) this.cause = cause;  // ← 원인 에러를 보존
  }
}
```

**왜 `cause`에 원래 에러를 담는가:**

```
원래 에러: NetworkTimeoutError: "연결 시간 초과 (5000ms)"
    ↓ 재시도 3번 — 모두 같은 에러로 실패
상위 에러: MaxRetriesExceededError: "최대 재시도 횟수 초과: 3회"
              └── cause: NetworkTimeoutError: "연결 시간 초과 (5000ms)"
```

`MaxRetriesExceededError`만 봐서는 "3번 실패했다"는 건 알지만 "왜 실패했는지"는 모른다. `cause`를 추가하면 나중에 로그를 볼 때 "3번 재시도했는데 매번 네트워크 타임아웃이었구나"까지 추적할 수 있다.

**원인 추적 흐름:**

```typescript
try {
  await retryWithBackoff(fn, 3);
} catch (err) {
  if (err instanceof MaxRetriesExceededError) {
    console.error(err.message);       // "최대 재시도 횟수 초과: 3회"
    console.error(err.cause);         // NetworkTimeoutError: "연결 시간 초과"
    // 원래 에러까지 함께 기록됨
  }
}
```

`Error.cause`는 Node.js 16.9+에서 지원하는 표준 필드다.

---

### 커스텀 에러가 왜 필요한가 — `instanceof`로 분기하기 위해

```typescript
try {
  await process(msg);
} catch (err) {
  if (err instanceof DeferredProcessingError) {
    // 이 에러는 재시도하면 안 됨 → 별도 큐로 이동
    await deferQueue.push(msg);
  } else if (err instanceof MaxRetriesExceededError) {
    // 재시도를 모두 소진 → 죽은 편지함(DLQ)으로 이동
    await dlq.push(msg);
  } else {
    throw err;  // 그 외 — 재시도 가능
  }
}
```

에러를 문자열 메시지로 구분하면 오타 한 글자로 분기가 망가진다. `instanceof`로 클래스 타입을 비교하면 TypeScript가 컴파일 시점에 잡아준다.

**주의: `instanceof` 순서가 중요하다.**

```typescript
// ❌ 잘못된 순서 — 자식이 부모에 걸림
catch (err) {
  if (err instanceof Error) {                  // 부모 먼저
    console.log('일반 에러');                   // DeferredProcessingError도 여기서 걸린다!
  } else if (err instanceof DeferredProcessingError) {
    console.log('이 블록은 절대 실행 안 됨');   // Error의 자식이므로 이미 위에서 통과
  }
}

// ✅ 올바른 순서 — 자식(더 구체적인 것) 먼저
catch (err) {
  if (err instanceof DeferredProcessingError) {  // 자식 먼저
    console.log('지연 처리 에러');
  } else if (err instanceof Error) {             // 부모 나중에
    console.log('일반 에러');
  }
}
```

`DeferredProcessingError`도 `Error`를 상속받으므로 `instanceof Error`에서도 `true`가 나온다. 더 구체적인 타입을 먼저 확인해야 한다.

---

## 5. 재시도 + 지수 백오프 — 완전 분해

네트워크 오류 등 일시적인 문제는 재시도로 해결한다. 재시도 간격은 점점 늘린다.

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 100,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (err instanceof DeferredProcessingError) {
        throw err;  // 재시도 의미 없는 에러 → 즉시 던짐
      }

      if (attempt < maxAttempts) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        await delay(delayMs);
      }
    }
  }

  throw new MaxRetriesExceededError(maxAttempts, lastError);
}
```

---

### `attempt`가 1부터 시작하는 이유

`attempt`는 "몇 번째 시도인가"를 나타낸다. 1번째 시도, 2번째 시도가 자연스럽다. 0번째 시도는 인간적으로 어색하다.

또한 아래 지수 백오프 계산에서 `attempt - 1`을 지수로 쓰는데, 1부터 시작해야 첫 시도에서 지수가 0이 되어 계산이 깔끔해진다.

---

### for 루프 제어 흐름 — 상태 다이어그램

```
attempt=1
  try: fn() 호출
    → 성공: return → 함수 즉시 종료 (루프 탈출)
    → 실패: catch 진입
        DeferredProcessingError? → throw → 함수 즉시 종료
        attempt(1) < maxAttempts(3)? → 참 → 대기 → attempt=2로

attempt=2
  try: fn() 호출
    → 성공: return → 함수 즉시 종료
    → 실패: catch 진입
        DeferredProcessingError? → throw → 함수 즉시 종료
        attempt(2) < maxAttempts(3)? → 참 → 대기 → attempt=3으로

attempt=3 (마지막)
  try: fn() 호출
    → 성공: return → 함수 즉시 종료
    → 실패: catch 진입
        DeferredProcessingError? → throw → 함수 즉시 종료
        attempt(3) < maxAttempts(3)? → 거짓 → 대기 없이 루프 종료

루프 종료 후:
  throw new MaxRetriesExceededError(maxAttempts, lastError)
```

---

### `attempt < maxAttempts` 조건 — 참/거짓 표

`maxAttempts = 4`일 때:

| attempt | `attempt < 4` | 결과 |
|---------|--------------|------|
| 1 | 1 < 4 → **참** | 대기 후 재시도 |
| 2 | 2 < 4 → **참** | 대기 후 재시도 |
| 3 | 3 < 4 → **참** | 대기 후 재시도 |
| 4 | 4 < 4 → **거짓** | 대기 없이 루프 탈출 |

마지막 시도 후에는 대기할 필요가 없다. 어차피 루프가 끝나고 `MaxRetriesExceededError`를 던질 것이기 때문이다.

---

### `lastError`를 루프 밖에서 선언하는 이유

```typescript
// 루프 밖에서 선언
let lastError: Error | undefined;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    return await fn();
  } catch (err) {
    lastError = err instanceof Error ? err : new Error(String(err));
    // attempt마다 덮어씌워짐 → 항상 "마지막으로 발생한 에러"가 담김
  }
}

// 루프가 끝난 뒤 lastError를 cause로 넘김
throw new MaxRetriesExceededError(maxAttempts, lastError);
//                                              ^^^^^^^^^
//                                              루프 밖에서 접근해야 함
```

만약 `lastError`를 루프 안에서 선언했다면:

```typescript
for (...) {
  try { ... }
  catch (err) {
    let lastError = ...;  // 루프 스코프 안에서만 존재
  }
}

throw new MaxRetriesExceededError(maxAttempts, lastError);
//                                             ^^^^^^^^^ 에러: lastError를 찾을 수 없음
```

루프 전체에 걸쳐 마지막 에러를 기억해야 하고, 루프 바깥에서도 써야 하므로 루프 바깥에서 선언한다.

---

### `Math.pow(2, attempt - 1)` — attempt별 완전 분해

```typescript
const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
```

**`Math.pow(밑, 지수)`** = 밑의 지수 제곱. `Math.pow(2, 3)` = 2³ = 8.

**왜 `attempt - 1`인가:**

`attempt`가 1부터 시작하기 때문에, 첫 번째 시도 후 대기 시간이 기본값의 1배(2⁰ = 1)여야 한다. `attempt` 그대로 쓰면 첫 시도에서 2¹ = 2배부터 시작된다.

**baseDelayMs = 100 기준 계산:**

```
attempt=1:
  지수 = 1 - 1 = 0
  Math.pow(2, 0) = 2⁰ = 1
  100 × 1 = 100ms 대기

attempt=2:
  지수 = 2 - 1 = 1
  Math.pow(2, 1) = 2¹ = 2
  100 × 2 = 200ms 대기

attempt=3:
  지수 = 3 - 1 = 2
  Math.pow(2, 2) = 2² = 4
  100 × 4 = 400ms 대기

attempt=4:
  지수 = 4 - 1 = 3
  Math.pow(2, 3) = 2³ = 8
  100 × 8 = 800ms 대기
```

매 실패마다 대기 시간이 정확히 2배씩 늘어난다.

---

### 선형 증가 vs 지수 증가 — 서버 부하 관점

**선형 증가 (100ms, 200ms, 300ms, 400ms, ...)**

```
0    100  300  600  1000ms ...
|----|----|----|----|----|
```

대기 시간이 일정하게 늘어난다. 1분 후에도 요청이 상대적으로 잦다.

**지수 증가 (100ms, 200ms, 400ms, 800ms, ...)**

```
0    100  300  700  1500ms ...
|----|----|----|-------|
```

대기 시간이 급격히 늘어난다. 문제가 지속될수록 요청 빈도가 빠르게 줄어든다.

**왜 지수인가:**

블록체인 RPC 노드에 문제가 생겨서 수백 개의 클라이언트가 동시에 재시도를 보내는 상황을 생각해보자. 선형 증가면 짧은 간격으로 계속 폭발적인 요청이 들어와 서버가 회복할 틈을 주지 못한다. 지수 증가면 시간이 갈수록 요청이 줄어들어 서버가 회복할 기회를 얻는다. 이를 "자기 회복(self-healing) 패턴"이라고 부른다.

> **핵심:** 지수 백오프는 클라이언트가 서버를 배려하는 방식이다. 빠른 재시도가 오히려 서버 회복을 방해한다.

---

## 6. Promise.all vs Promise.allSettled

### Promise.all — 전부 성공해야 함

```typescript
const results = await Promise.all([fetchA(), fetchB(), fetchC()]);
// 셋 다 성공하면 → [resultA, resultB, resultC]
// 하나라도 실패하면 → 즉시 reject
```

**반환 타입: `T[]`**

세 Promise가 모두 `Promise<number>`라면 결과는 `number[]`다. 값이 직접 담긴 배열이다.

```typescript
const [balanceA, balanceB, balanceC]: number[] = await Promise.all([
  fetchBalance('0xAAA'),  // Promise<number>
  fetchBalance('0xBBB'),  // Promise<number>
  fetchBalance('0xCCC'),  // Promise<number>
]);
```

**하나라도 실패하면:**

```
fetchA() → 성공(1000) ↘
fetchB() → 실패!       → Promise.all 즉시 reject → catch로 점프
fetchC() → 성공(3000) ↗  (결과 버려짐)
```

`fetchB()`가 reject되는 순간 `Promise.all`은 즉시 reject된다. `fetchA()`와 `fetchC()`의 결과는 버려진다.

---

### Promise.allSettled — 일부 실패해도 계속

```typescript
const results = await Promise.allSettled([fetchA(), fetchB(), fetchC()]);
// 항상 배열 리턴 (성공이든 실패든)
```

**반환 타입: `PromiseSettledResult<T>[]`**

`Promise.all`과 달리 각 요소가 값 자체가 아니라 "성공/실패 정보를 담은 객체"다.

```typescript
// 각 요소의 타입은 둘 중 하나:
{ status: 'fulfilled'; value: T }          // 성공한 경우
{ status: 'rejected';  reason: unknown }   // 실패한 경우
```

---

### `status === 'fulfilled'` 체크가 TypeScript 타입 내로잉을 트리거하는 원리

```typescript
const results = await Promise.allSettled([fetchA(), fetchB(), fetchC()]);

results.map((result, i) => {
  // 이 시점에서 result의 타입:
  // PromiseFulfilledResult<number> | PromiseRejectedResult
  // → value와 reason 중 어느 쪽이 있는지 TypeScript는 모름

  console.log(result.value);  // ❌ 에러: value는 fulfilled일 때만 존재

  if (result.status === 'fulfilled') {
    // 이 블록 안에서 TypeScript가 result를 좁힘(narrowing):
    // PromiseFulfilledResult<number>
    // → { status: 'fulfilled'; value: number } 로 확정
    console.log(result.value);   // ✅ OK — number
    console.log(result.reason);  // ❌ 에러: fulfilled 타입엔 reason 없음
  } else {
    // 이 블록 안에서 TypeScript가 result를 좁힘:
    // PromiseRejectedResult
    // → { status: 'rejected'; reason: unknown } 로 확정
    console.log(result.reason);  // ✅ OK — unknown
    console.log(result.value);   // ❌ 에러: rejected 타입엔 value 없음
  }
});
```

`status === 'fulfilled'` 체크는 단순한 런타임 확인이 아니다. TypeScript가 이 조건을 보고 "이 블록 안에서는 fulfilled 형태다"라고 타입을 자동으로 좁혀준다. 이것이 타입 내로잉(type narrowing)이다.

---

### `result.value` vs `result.reason` — 언제 각각 접근하는가

| 필드 | 언제 접근 | 내용 |
|------|----------|------|
| `result.value` | `status === 'fulfilled'` 확인 후 | 성공한 결과값 (T) |
| `result.reason` | `status === 'rejected'` 확인 후 (else 블록) | 실패 이유 (unknown) |

---

### 실전 구현 — `fetchAllSafe` 전체 분해

```typescript
async function fetchAllSafe(
  addresses: string[],
): Promise<Array<{ address: string; balance: number | null }>> {
  const results = await Promise.allSettled(
    addresses.map(addr => fetchTokenBalance(addr)),
    //            ^^^^ 주소 배열을 Promise 배열로 변환
  );
  //                  ^^^^^^^^^^^^^ 모두 병렬로 실행, 성공이든 실패든 기다림

  return results.map((result, i) => ({
    address: addresses[i]!,
    //                  ^ non-null 단언: i는 항상 addresses 범위 안이므로 안전
    balance: result.status === 'fulfilled' ? result.value : null,
    //       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //       성공이면 실제 잔액, 실패면 null — 타입도 number | null
  }));
}
```

---

### Promise.all vs Promise.allSettled — 언제 뭘 쓰는가

| 상황 | 선택 | 이유 |
|------|------|------|
| 모든 결과가 있어야 다음 단계로 진행 (트랜잭션) | `Promise.all` | 하나라도 없으면 전체를 포기해야 함 |
| 일부 실패해도 나머지 결과는 처리 (배치 조회) | `Promise.allSettled` | 100개 중 1개 실패해도 99개는 처리하고 싶음 |

> **핵심:** `Promise.all`은 성공을 보장하는 대신 실패를 전파한다. `Promise.allSettled`는 실패를 격리해서 나머지 처리를 보장한다.

---

## 자주 하는 실수

**실수 1 — await 없이 Promise 사용**
```typescript
// ❌ Promise 객체가 담김
const balance = fetchBalance('0xAAA');
console.log(balance + 100);  // "[object Promise]100"

// ✅ 값을 꺼내야 함
const balance = await fetchBalance('0xAAA');
console.log(balance + 100);  // 1100
```

**실수 2 — catch 안에서 err 타입 가정**
```typescript
// ❌ err는 unknown
catch (err) {
  console.log(err.message);  // 에러: Object is of type 'unknown'
}

// ✅ instanceof로 좁힌 후
catch (err) {
  if (err instanceof Error) console.log(err.message);
}
```

**실수 3 — instanceof 순서 역전**
```typescript
// ❌ 부모 먼저 — 자식은 이미 부모에서 걸림
catch (err) {
  if (err instanceof Error) { ... }           // DeferredProcessingError도 여기서 걸림
  else if (err instanceof DeferredProcessingError) { ... }  // 절대 실행 안 됨
}

// ✅ 자식(더 구체적인 것) 먼저
catch (err) {
  if (err instanceof DeferredProcessingError) { ... }  // 먼저
  else if (err instanceof Error) { ... }               // 나중에
}
```

**실수 4 — async 없이 await 사용**
```typescript
// ❌ SyntaxError
function notAsync() {
  const x = await somePromise();
}

// ✅ async 붙여야
async function isAsync() {
  const x = await somePromise();
}
```

---

## 체크리스트

- [ ] `new Promise((resolve, reject) => {...})`에서 `resolve`와 `reject` 각각의 역할을 설명할 수 있다
- [ ] `pending → fulfilled/rejected` 전환이 일어나는 시점을 안다
- [ ] `new Promise()`를 직접 만드는 경우와 `async` 함수가 자동 생성하는 경우의 차이를 안다
- [ ] `await` 없이 쓰면 타입이 `Promise<T>`로 유지되는 이유를 설명할 수 있다
- [ ] `async` 함수가 자동으로 하는 2가지(Promise 래핑, await 사용 허용)를 안다
- [ ] `super(message)`가 하는 2가지(message 설정, stack trace 기록)를 안다
- [ ] `this.name` 설정 전/후 콘솔 출력 차이를 안다
- [ ] `cause` 필드로 에러를 감싸는 이유(원인 추적)를 설명할 수 있다
- [ ] `attempt`가 1부터 시작하는 이유를 안다
- [ ] `lastError`를 루프 밖에서 선언하는 이유(스코프 + 루프 후 사용)를 설명할 수 있다
- [ ] `Math.pow(2, attempt - 1)`을 attempt=1,2,3,4에서 손으로 계산할 수 있다
- [ ] `attempt < maxAttempts` 조건이 마지막 시도 후 대기를 건너뛰는 이유를 안다
- [ ] 지수 백오프가 선형보다 서버 부하에 유리한 이유를 설명할 수 있다
- [ ] `Promise.all`과 `Promise.allSettled`의 반환 타입 차이(`T[]` vs `PromiseSettledResult<T>[]`)를 안다
- [ ] `status === 'fulfilled'` 체크가 TypeScript 타입 내로잉을 트리거하는 원리를 설명할 수 있다
- [ ] `result.value`와 `result.reason`에 각각 언제 접근하는지 안다

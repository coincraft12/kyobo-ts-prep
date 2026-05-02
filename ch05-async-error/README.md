# CH05 — 비동기 · Promise · 에러

## 핵심 한 줄
> 블록체인 코드는 모든 게 비동기다. Promise를 이해하고 에러를 타입별로 구분하는 게 이 챕터의 전부.

---

## 1. Promise란

"나중에 값을 줄게"라는 약속 객체.

```typescript
const p: Promise<number> = new Promise((resolve, reject) => {
  setTimeout(() => resolve(42), 1000);  // 1초 후에 42를 줌
});
```

### 이 코드를 한 줄씩 분해하면

**`new Promise((resolve, reject) => { ... })`**

Promise를 만들 때 생성자에 함수 하나를 넘긴다. 이 함수는 두 개의 매개변수를 받는다.

- `resolve` — "성공했어, 값은 이거야"라고 알릴 때 호출하는 함수
- `reject` — "실패했어, 이유는 이거야"라고 알릴 때 호출하는 함수

**`setTimeout(() => resolve(42), 1000)`**

1000ms(1초) 뒤에 `resolve(42)`를 호출한다. `resolve(42)`가 호출되는 순간 Promise가 "완료(fulfilled)" 상태가 되고, 값은 `42`가 된다.

**`Promise<number>`**

꺾쇠 안의 타입이 "나중에 받을 값의 타입"이다. `Promise<string>`이면 나중에 문자열을 주겠다는 뜻, `Promise<void>`면 값 없이 완료만 알려주겠다는 뜻.

### Promise의 세 가지 상태

```
pending   → 아직 기다리는 중 (초기 상태)
fulfilled → 성공, 값이 있음  (resolve() 호출 후)
rejected  → 실패, 에러가 있음 (reject() 호출 후, 또는 throw 후)
```

한 번 fulfilled나 rejected가 되면 상태는 바뀌지 않는다.

---

## 2. async / await — Promise를 읽기 쉽게

```typescript
// Promise 체인 방식 (읽기 어려움)
fetchBalance('0xAAA')
  .then(balance => console.log(balance))
  .catch(err => console.error(err));

// async/await 방식 (강의 표준)
async function main() {
  const balance = await fetchBalance('0xAAA');
  console.log(balance);
}
```

### 왜 async/await가 더 나은가

`.then().catch()` 체인 방식은 콜백이 중첩될수록 가독성이 무너진다. async/await는 비동기 코드를 동기 코드처럼 위에서 아래로 읽을 수 있게 해준다. 내부 동작은 똑같다. 문법적 편의다.

### `await`가 하는 일

`await`는 Promise를 "풀어서" 안의 값을 꺼낸다.

```typescript
const balance: Promise<number> = fetchBalance('0xAAA');  // Promise 객체
const balance: number          = await fetchBalance('0xAAA');  // 숫자 값
```

`await` 없이 쓰면 변수에 Promise 객체 자체가 담긴다. 흔한 실수다.

**중요한 제약**: `await`는 `async` 함수 안에서만 쓸 수 있다. 아래는 에러가 난다.

```typescript
// 에러: await는 async 함수 안에서만
function notAsync() {
  const balance = await fetchBalance('0xAAA');  // SyntaxError
}

// 정상: async 함수 안에서
async function isAsync() {
  const balance = await fetchBalance('0xAAA');  // OK
}
```

### `async` 함수는 항상 `Promise`를 리턴한다

```typescript
async function getBalance(): Promise<number> {
  return 100;         // 실제로는 Promise.resolve(100)으로 감싸짐
}
```

`return 100`이라고 써도 TypeScript/JavaScript 런타임이 자동으로 `Promise.resolve(100)`으로 바꿔준다. 그래서 `async` 함수의 반환 타입은 항상 `Promise<T>` 형태다.

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

`try` 블록 안에서 에러가 발생하면(또는 await한 Promise가 reject되면) 코드 실행이 즉시 멈추고 `catch` 블록으로 점프한다. `try` 안의 나머지 코드는 실행되지 않는다.

```
try 블록 실행
  → 에러 없으면: 정상 완료, catch는 건너뜀
  → 에러 있으면: 즉시 catch로 점프
```

### `catch (err)`에서 `err`는 왜 `unknown`인가

TypeScript 4.0부터 `catch`의 `err`는 기본적으로 `unknown` 타입이다. JavaScript는 `throw`할 때 어떤 값이든 던질 수 있기 때문이다.

```typescript
throw new Error('에러');   // Error 객체
throw 'string error';     // 문자열도 던질 수 있음
throw 42;                 // 숫자도 던질 수 있음
throw { code: 500 };      // 객체도 던질 수 있음
```

그래서 TypeScript는 `err`가 뭔지 모른다. `unknown`으로 타입을 보수적으로 잡는다. 그냥 `err.message`처럼 쓰면 타입 에러가 난다. 타입을 확인한 후에 써야 한다.

```typescript
catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
}
```

- `err instanceof Error` — `err`가 Error 클래스의 인스턴스인지 확인. 참이면 `.message` 접근 가능
- `String(err)` — Error 인스턴스가 아닌 경우 강제로 문자열로 변환

---

## 4. 커스텀 에러 클래스 — 강의 핵심 패턴

일반 Error와 특수 에러를 구분해서 다르게 처리하기 위해 사용한다.

```typescript
class DeferredProcessingError extends Error {
  constructor(message: string) {
    super(message);               // 부모 Error 생성자 호출
    this.name = 'DeferredProcessingError';  // 에러 이름 설정
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

### `super(message)` — 왜 반드시 호출해야 하는가

`extends Error`는 "Error 클래스를 상속받는다"는 뜻이다. 클래스를 상속받으면 생성자에서 `super()`를 먼저 호출해야 한다. 이 호출이 부모 클래스(Error)의 초기화를 실행한다.

`super(message)`를 호출하면 Error 클래스가 내부적으로 아래 일을 한다.

- `this.message = message` 설정
- 스택 트레이스(stack trace) 기록

`super()`를 호출하지 않으면 JavaScript 런타임이 에러를 던진다. 생략할 수 없다.

### `this.name = 'DeferredProcessingError'` — 왜 따로 설정하는가

`Error`를 상속받아도 `name` 필드의 기본값은 `'Error'`로 고정되어 있다. 이 줄을 쓰지 않으면 어떤 커스텀 에러든 콘솔에 `Error: ...`라고 찍힌다.

```
// this.name 설정 안 했을 때
Error: 나중에 처리해야 함

// this.name = 'DeferredProcessingError' 설정 후
DeferredProcessingError: 나중에 처리해야 함
```

디버깅할 때 에러 이름만 봐도 어떤 종류인지 즉시 알 수 있어야 한다. 그래서 클래스 이름으로 명시적으로 덮어쓴다.

### `cause` 필드 패턴 — 에러를 감싸는 이유

```typescript
constructor(public readonly attempts: number, cause?: Error) {
  super(`최대 재시도 횟수 초과: ${attempts}회`);
  this.name = 'MaxRetriesExceededError';
  if (cause) this.cause = cause;
}
```

`cause`는 "이 에러를 유발한 원래 에러"다. 비유를 들면 이렇다.

```
원래 에러: "네트워크 타임아웃"
    ↓ 재시도 3번 모두 실패
감싼 에러: "최대 재시도 횟수 초과: 3회" (cause: 네트워크 타임아웃)
```

`MaxRetriesExceededError`만 봐도 뭔가 잘못됐다는 건 알지만, "왜 실패했는지"는 알 수 없다. `cause`에 원래 에러를 담아두면 나중에 로그를 볼 때 "3번 재시도했는데 마지막에도 네트워크 타임아웃이었구나"까지 추적할 수 있다.

`Error.cause`는 Node.js 16.9+ 에서 지원하는 표준 필드다.

### 커스텀 에러가 왜 필요한가 — `instanceof`로 분기하기 위해

```typescript
try {
  await process(msg);
} catch (err) {
  if (err instanceof DeferredProcessingError) {
    // 재시도 없이 별도 큐로 이동
    await deferQueue.push(msg);
  } else if (err instanceof MaxRetriesExceededError) {
    // DLQ로 이동
    await dlq.push(msg);
  } else {
    // 일반 재시도
    throw err;
  }
}
```

에러를 문자열 메시지로 구분하면 오타가 나거나 메시지 내용이 바뀌면 분기가 망가진다. `instanceof`로 클래스 타입을 비교하면 TypeScript가 컴파일 시점에 잡아준다.

**주의: instanceof 순서가 중요하다.** `DeferredProcessingError`도 `Error`의 자식이므로 `err instanceof Error`를 먼저 체크하면 `DeferredProcessingError`도 여기서 걸린다. 자식 클래스를 항상 부모 클래스보다 먼저 확인해야 한다.

---

## 5. 재시도 + 지수 백오프 — 강의 M3_S17 패턴

네트워크 오류 등 일시적인 문제는 재시도로 해결한다. 재시도 간격은 점점 늘린다(지수 백오프).

```
1회 실패 → 100ms 대기 → 재시도
2회 실패 → 200ms 대기 → 재시도
3회 실패 → 400ms 대기 → 재시도
...
```

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
        throw err;   // 이 에러는 재시도 의미 없음 → 즉시 던짐
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

### for 루프 제어 흐름 — 단계별 분해

**`for (let attempt = 1; attempt <= maxAttempts; attempt++)`**

`attempt`가 `0`이 아니라 `1`부터 시작하는 이유가 있다. 이것이 "몇 번째 시도인가"를 나타내는 값이기 때문이다. 1번째 시도, 2번째 시도, 3번째 시도. 0번째 시도는 인간적으로 자연스럽지 않다. 또한 이 값이 아래 지수 백오프 계산에서도 쓰이는데, 거기서도 1부터 시작하는 것이 계산상 깔끔하다.

**`try { return await fn(); }`**

`fn()`이 성공하면 즉시 `return`으로 함수 전체가 종료된다. 루프가 더 돌지 않는다.

```
attempt=1, fn() 성공 → return → 루프 즉시 탈출, 함수 종료
attempt=1, fn() 실패 → catch로 점프
attempt=2, fn() 성공 → return → 루프 즉시 탈출, 함수 종료
attempt=2, fn() 실패 → catch로 점프
...
```

**`if (attempt < maxAttempts)` — 마지막 시도에선 대기하지 않는 이유**

`maxAttempts = 3`이라면 3번째 시도 후 실패했을 때는 더 이상 재시도가 없다. 대기했다가 곧바로 `MaxRetriesExceededError`를 던질 것이므로, 마지막 실패 후 불필요하게 기다릴 이유가 없다.

```
attempt=1 실패 → attempt(1) < maxAttempts(3) → 참 → 대기 후 재시도
attempt=2 실패 → attempt(2) < maxAttempts(3) → 참 → 대기 후 재시도
attempt=3 실패 → attempt(3) < maxAttempts(3) → 거짓 → 즉시 루프 탈출
```

**`let lastError`를 왜 루프 밖에서 선언하는가**

`lastError`는 루프 안에서 에러가 발생할 때마다 덮어씌워진다. 루프가 끝난 뒤, 즉 루프 밖에서 `MaxRetriesExceededError`를 던질 때 이 변수를 `cause`로 넘긴다.

만약 `lastError`를 루프 안에서 선언했다면 루프 스코프 안에서만 살고, 루프 밖에선 접근할 수 없다. 루프 전체를 걸쳐 마지막 에러를 기억해야 하므로 루프 바깥에서 선언한다.

### 지수 백오프 계산 — `Math.pow(2, attempt - 1)` 분해

```typescript
const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
```

이 한 줄이 지수 백오프의 핵심이다. 각 부분을 분해한다.

**`Math.pow(2, attempt - 1)`**

`Math.pow(밑, 지수)`는 `밑`의 `지수` 제곱을 계산한다. `Math.pow(2, 3)`은 2³ = 8.

**왜 `attempt - 1`인가**

`attempt`가 1부터 시작하기 때문이다. 첫 번째 시도(attempt=1)의 대기 시간이 기본 시간의 1배여야 하므로 지수를 0으로 만들어야 한다. 2⁰ = 1이고, `attempt - 1`은 1-1 = 0이 된다.

만약 `attempt`를 그대로 쓰면 첫 번째 시도에서 `Math.pow(2, 1) = 2`가 되어 기본 대기 시간의 2배부터 시작한다.

**실제 계산 과정 (baseDelayMs = 100)**

```
attempt=1:
  Math.pow(2, 1 - 1) = Math.pow(2, 0) = 2⁰ = 1
  100 * 1 = 100ms

attempt=2:
  Math.pow(2, 2 - 1) = Math.pow(2, 1) = 2¹ = 2
  100 * 2 = 200ms

attempt=3:
  Math.pow(2, 3 - 1) = Math.pow(2, 2) = 2² = 4
  100 * 4 = 400ms

attempt=4 (있다면):
  Math.pow(2, 4 - 1) = Math.pow(2, 3) = 2³ = 8
  100 * 8 = 800ms
```

매 실패마다 대기 시간이 2배씩 늘어난다.

### 왜 선형이 아니라 지수로 증가시키는가

**선형 증가 (100ms, 200ms, 300ms, ...)** 는 대기 시간이 일정하게 늘어난다. 처음엔 충분히 빠르게 재시도하지만, 서버 문제가 심각할 때는 여전히 너무 자주 요청을 보내는 경향이 있다.

**지수 증가 (100ms, 200ms, 400ms, 800ms, ...)** 는 대기 시간이 급격히 늘어난다. 문제가 지속될수록 요청 빈도가 빠르게 줄어든다.

이게 왜 중요한가: 블록체인 RPC 노드에 문제가 생겨서 수백 개의 클라이언트가 동시에 재시도를 보내는 상황을 생각해보자. 선형 증가면 짧은 간격으로 계속 폭발적인 요청이 들어와 서버가 회복할 틈을 주지 못한다. 지수 증가면 시간이 갈수록 요청이 줄어들어 서버가 회복할 기회를 얻는다. 이를 "서버 부하 분산" 또는 "자기 회복(self-healing) 패턴"이라고 부른다.

---

## 6. Promise.all vs Promise.allSettled

### Promise.all — 전부 성공해야 함

```typescript
const results = await Promise.all([fetchA(), fetchB(), fetchC()]);
// 셋 다 성공하면 [resultA, resultB, resultC]
// 하나라도 실패하면 즉시 reject
```

**반환 타입: `T[]`**

세 Promise가 모두 `Promise<number>`라면 `Promise.all`의 결과는 `number[]`다. 값이 직접 담긴 배열이다. 성공한 경우에만 이 배열을 얻는다.

```typescript
// fetchA, fetchB, fetchC 모두 Promise<number> 라면
const results: number[] = await Promise.all([fetchA(), fetchB(), fetchC()]);
//            ^^^^^^^^ 숫자 배열. 성공 보장.
```

**하나라도 실패하면?**

`fetchB()`가 reject되는 순간 `Promise.all`은 즉시 reject된다. `fetchA()`와 `fetchC()`의 결과는 버려진다. 전체가 실패로 처리된다.

```
fetchA() → 성공(1000)  ↘
fetchB() → 실패!       → Promise.all 즉시 reject → catch로 점프
fetchC() → 성공(3000)  ↗  (결과 버려짐)
```

**언제 쓰는가**: 세 결과가 모두 있어야 의미 있는 작업. 예를 들어 트랜잭션에서 A, B, C 모두의 잔액이 필요한 경우. 하나라도 없으면 전체를 포기해야 하는 상황.

### Promise.allSettled — 일부 실패해도 계속

```typescript
const results = await Promise.allSettled([fetchA(), fetchB(), fetchC()]);
// 항상 배열 리턴 (성공이든 실패든)
// results[0] = { status: 'fulfilled', value: resultA }
//           또는 { status: 'rejected', reason: error }
```

**반환 타입: `PromiseSettledResult<T>[]`**

`Promise.all`과 달리 결과 배열의 각 요소가 값 자체가 아니라 "성공/실패 정보를 담은 객체"다.

```typescript
// 각 요소의 타입은 둘 중 하나:
{ status: 'fulfilled'; value: T }     // 성공
{ status: 'rejected';  reason: unknown }  // 실패
```

**왜 `result.status === 'fulfilled'` 체크가 필요한가**

`result.value`에 접근하려면 이 결과가 성공한 것인지 먼저 확인해야 한다. TypeScript가 타입 레벨에서 이를 강제한다.

- `status`를 확인하지 않으면 TypeScript는 `result.value`와 `result.reason` 중 어느 것이 있는지 모른다
- `result.status === 'fulfilled'` 이후에는 TypeScript가 자동으로 이 객체를 `{ status: 'fulfilled'; value: T }` 타입으로 좁혀준다(타입 내로잉)
- 그 안에서만 `result.value`에 안전하게 접근할 수 있다

```typescript
const results = await Promise.allSettled([fetchA(), fetchB(), fetchC()]);

results.map((result, i) => {
  if (result.status === 'fulfilled') {
    // 이 블록 안에서 TypeScript는 result를 { status: 'fulfilled'; value: T }로 앎
    console.log(result.value);   // OK
    // console.log(result.reason);  // 에러: 'fulfilled' 타입엔 reason 없음
  } else {
    // 이 블록 안에서 TypeScript는 result를 { status: 'rejected'; reason: unknown }으로 앎
    console.log(result.reason);  // OK
    // console.log(result.value);   // 에러: 'rejected' 타입엔 value 없음
  }
});
```

**`result.value` vs `result.reason`**

| 필드 | 언제 접근 | 내용 |
|---|---|---|
| `result.value` | `status === 'fulfilled'` 확인 후 | 성공한 결과값 |
| `result.reason` | `status === 'rejected'` 확인 후 (또는 else 블록) | 실패 이유(에러 객체) |

**`fetchAllSafe`의 구현 예시 전체 분해**

```typescript
async function fetchAllSafe(
  addresses: string[],
): Promise<Array<{ address: string; balance: number | null }>> {
  const results = await Promise.allSettled(
    addresses.map(addr => fetchTokenBalance(addr)),
  );

  return results.map((result, i) => ({
    address: addresses[i]!,
    balance: result.status === 'fulfilled' ? result.value : null,
  }));
}
```

- `addresses.map(addr => fetchTokenBalance(addr))` — 주소 배열을 Promise 배열로 변환
- `Promise.allSettled(...)` — 모든 Promise를 병렬로 실행하고, 성공이든 실패든 전부 기다림
- `results.map((result, i) => ...)` — 결과 배열을 순회하면서 인덱스 `i`로 `addresses[i]`와 짝지음
- `addresses[i]!` — `!`는 TypeScript에게 "이 값은 undefined가 아님을 보장한다"고 알리는 non-null 단언. `i`가 항상 addresses 범위 안이므로 안전함
- `result.status === 'fulfilled' ? result.value : null` — 성공이면 값, 실패면 null

**언제 뭘 쓰는가**

| 상황 | 선택 | 이유 |
|---|---|---|
| 모든 결과가 있어야 함 (트랜잭션) | `Promise.all` | 하나라도 없으면 전체를 포기해야 함 |
| 일부 실패해도 나머지는 처리 (배치) | `Promise.allSettled` | 100개 중 1개가 실패해도 99개는 처리하고 싶음 |

---

## 자주 하는 실수

**실수 1 — await 없이 Promise 사용**
```typescript
const balance = fetchBalance('0xAAA');  // balance는 Promise<number>, 숫자 아님
console.log(balance + 100);             // 이상한 결과

const balance = await fetchBalance('0xAAA');  // 이렇게 써야 number
```

**실수 2 — catch 안에서 err 타입 가정**
```typescript
catch (err) {
  console.log(err.message);  // 에러: err는 unknown
  console.log((err as Error).message);  // as Error로 단언 (확실할 때만)
  // 또는
  if (err instanceof Error) console.log(err.message);  // 안전
}
```

**실수 3 — instanceof 순서 역전**
```typescript
catch (err) {
  if (err instanceof Error) {            // 부모 먼저 — 잘못됨
    console.log('일반 에러');
  } else if (err instanceof DeferredProcessingError) {  // 자식은 이미 위에서 걸림
    console.log('이 블록은 절대 실행 안 됨');
  }
}

// 올바른 순서: 자식(더 구체적인 것) 먼저
catch (err) {
  if (err instanceof DeferredProcessingError) {  // 자식 먼저
    console.log('지연 처리 에러');
  } else if (err instanceof Error) {             // 부모 나중에
    console.log('일반 에러');
  }
}
```

---

## 체크리스트

- [ ] `Promise<T>`가 "나중에 T를 준다"는 의미임을 안다
- [ ] `async/await` + `try/catch` 조합을 읽을 수 있다
- [ ] `catch (err)`에서 `err`가 `unknown`인 이유를 설명할 수 있다
- [ ] 커스텀 에러 클래스에서 `super()`, `this.name`, `cause` 각각의 역할을 설명할 수 있다
- [ ] `instanceof`로 에러 종류를 구분할 때 자식 클래스를 먼저 체크해야 하는 이유를 안다
- [ ] 지수 백오프 계산 `baseDelayMs * Math.pow(2, attempt - 1)`을 손으로 풀 수 있다
- [ ] `attempt < maxAttempts` 조건이 마지막 실패 후 대기를 건너뛰는 이유를 설명할 수 있다
- [ ] `Promise.all`과 `Promise.allSettled`의 반환 타입 차이(`T[]` vs `PromiseSettledResult<T>[]`)를 설명할 수 있다
- [ ] `result.status === 'fulfilled'` 확인 없이 `result.value`에 접근하면 왜 타입 에러가 나는지 안다

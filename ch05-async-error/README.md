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

`Promise<T>`의 T는 나중에 받을 값의 타입. `Promise<string>`, `Promise<void>`, `Promise<User>` 등.

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

`await`은 Promise를 "풀어서" 값으로 만든다. 단, `async` 함수 안에서만 사용 가능.

`async` 함수는 항상 `Promise`를 리턴한다:
```typescript
async function getBalance(): Promise<number> {
  return 100;         // 실제로는 Promise.resolve(100)으로 감싸짐
}
```

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

`catch (err)`에서 `err`는 `unknown` 타입이다. 그냥 쓰면 에러가 나므로 타입 확인 후 사용:

```typescript
catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(message);
}
```

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

왜 이름을 붙이나:
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

`instanceof`로 에러 종류를 구분하려면 커스텀 클래스가 필요하다.

---

## 5. 재시도 + 지수 백오프 — 강의 M3_S17 패턴

네트워크 오류 등 일시적인 문제는 재시도로 해결. 재시도 간격은 점점 늘린다 (지수 백오프).

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

핵심 포인트:
- `DeferredProcessingError`는 재시도 없이 즉시 throw
- 일반 에러는 정해진 횟수만큼 재시도
- 모두 실패하면 `MaxRetriesExceededError` 던짐

---

## 6. Promise.all vs Promise.allSettled

### Promise.all — 전부 성공해야 함

```typescript
const results = await Promise.all([fetchA(), fetchB(), fetchC()]);
// 셋 다 성공하면 [resultA, resultB, resultC]
// 하나라도 실패하면 즉시 reject
```

### Promise.allSettled — 일부 실패해도 계속

```typescript
const results = await Promise.allSettled([fetchA(), fetchB(), fetchC()]);
// 항상 배열 리턴
// results[0] = { status: 'fulfilled', value: resultA }
//           또는 { status: 'rejected', reason: error }
```

언제 뭘 쓰나:
- `Promise.all` — 전부 성공해야만 의미 있는 경우 (트랜잭션)
- `Promise.allSettled` — 일부 실패해도 나머지는 처리하고 싶은 경우 (배치 작업)

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

---

## 체크리스트

- [ ] `Promise<T>`가 "나중에 T를 준다"는 의미임을 안다
- [ ] `async/await` + `try/catch` 조합을 읽을 수 있다
- [ ] 커스텀 에러 클래스가 왜 필요한지 설명할 수 있다
- [ ] `instanceof`로 에러 종류를 구분하는 패턴을 안다
- [ ] `Promise.all`과 `Promise.allSettled`의 차이를 설명할 수 있다

// ─── CH05: 비동기 · Promise · 에러 ─────────────────────────────────────────

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 커스텀 에러 클래스                                                      │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   표준 Error 클래스를 상속해서 에러의 종류를 구분하는 커스텀 에러.    │
// │   instanceof로 에러 타입을 구분해서 종류별로 다르게 처리할 수 있다.   │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   블록체인 처리에서 에러는 종류가 중요하다:                            │
// │   - 일시적 오류 → 재시도                                               │
// │   - 지연 처리 오류(DeferredProcessingError) → 재시도 큐로 이동        │
// │   - 최대 재시도 초과(MaxRetriesExceededError) → 포기 + 알림           │
// │   문자열로 에러를 구분하면 오타 위험이 있고, instanceof로 구분하면     │
// │   타입 안전하게 분기할 수 있다.                                         │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   class DeferredProcessingError extends Error                           │
// │   ① constructor에서 super(message) 호출 필수                           │
// │   ② this.name 설정: Error.name이 기본 'Error'이므로 클래스명으로 덮어씀│
// │      → console에서 "Error: ..."가 아니라 "DeferredProcessingError: ..." │
// │        로 표시됨                                                        │
// │                                                                         │
// │ [MaxRetriesExceededError 추가 문법]                                     │
// │   constructor(public readonly attempts: number, cause?: Error)          │
// │   - public readonly attempts: 생성자 단축 문법 + 외부 접근 가능         │
// │   - cause?: 에러를 유발한 원인 에러 (선택적). this.cause = cause로 연결│
// │     → Error.cause는 Node 16.9+ 에서 지원하는 표준 필드                │
// └─────────────────────────────────────────────────────────────────────────┘

class DeferredProcessingError extends Error {
  constructor(message: string) {
    super(message);                              // 부모 Error 생성자 호출 필수
    this.name = 'DeferredProcessingError';       // 에러 이름을 클래스명으로 설정
  }
}

class MaxRetriesExceededError extends Error {
  constructor(public readonly attempts: number, cause?: Error) {
    super(`최대 재시도 횟수 초과: ${attempts}회`);  // 에러 메시지 생성
    this.name = 'MaxRetriesExceededError';
    if (cause) this.cause = cause;  // 원인 에러 연결 (디버깅 시 스택 추적에 유용)
  }
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 1. async/await 기본                                                     │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   비동기 함수와 그 결과를 기다리는 문법.                               │
// │   async 함수는 항상 Promise를 반환하므로 호출 후 await로 기다려야      │
// │   실제 값을 얻을 수 있다.                                               │
// │                                                                         │
// │ [에러 던지기]                                                           │
// │   async 함수에서 throw하면 반환 Promise가 rejected 상태가 된다.        │
// │   await로 기다리다가 rejected를 만나면 catch 블록으로 점프한다.        │
// │                                                                         │
// │ [주의사항]                                                              │
// │   Promise<number>: 비동기가 완료되면 number를 준다는 의미.             │
// │   이 함수를 await 없이 호출하면 Promise 객체가 반환된다. 흔한 실수.   │
// └─────────────────────────────────────────────────────────────────────────┘

async function fetchTokenBalance(address: string): Promise<number> {
  await delay(10);  // 10ms 대기로 네트워크 요청 시뮬레이션
  // '0xBAD' 주소면 에러 throw → 호출 측에서 catch로 잡아야 함
  if (address === '0xBAD') throw new Error('주소를 찾을 수 없음');
  return 1000;
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 2. try/catch + 에러 종류별 분기 (강의 핵심 패턴)                       │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   비동기 함수의 에러를 처리하는 기본 구조. try 블록 안에서 에러가      │
// │   발생하면 catch 블록으로 점프한다.                                     │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   블록체인 처리에서는 에러가 다양한 종류이고, 종류별로 다르게 처리해야 │
// │   한다. instanceof로 에러 타입을 구분하는 것이 핵심 패턴이다.         │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   catch (err) 에서 err는 unknown 타입이다.                              │
// │   TypeScript 4.0부터 catch의 err는 기본 unknown이다.                   │
// │   그래서 err.message 처럼 바로 쓸 수 없고, instanceof나 typeof로       │
// │   타입을 확인한 후에야 해당 타입의 메서드/필드를 쓸 수 있다.          │
// │                                                                         │
// │ [주의사항]                                                              │
// │   instanceof 순서가 중요하다. 자식 클래스를 먼저, 부모 클래스를 나중에│
// │   DeferredProcessingError도 Error이므로 Error 체크를 먼저 하면         │
// │   DeferredProcessingError가 걸러지지 않는다.                           │
// └─────────────────────────────────────────────────────────────────────────┘

async function processWithFallback(address: string): Promise<number | null> {
  try {
    const balance = await fetchTokenBalance(address);  // 에러 발생 가능
    return balance;
  } catch (err) {
    // instanceof: 특정 클래스의 인스턴스인지 확인 (타입 좁히기)
    if (err instanceof DeferredProcessingError) {
      console.log('지연 처리 — 재시도 큐로 이동');
      return null;
    }
    // err는 unknown이므로 직접 .message 접근 불가
    // instanceof Error로 확인 후 message 접근, 아니면 String()으로 변환
    const message = err instanceof Error ? err.message : String(err);
    console.error('처리 실패:', message);
    return null;
  }
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 3. 재시도 with 지수 백오프 (Exponential Backoff)                       │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   실패한 작업을 자동으로 재시도하되, 재시도 간격을 지수적으로 늘리는  │
// │   패턴. 1차 실패 → 100ms, 2차 실패 → 200ms, 3차 → 400ms 이런 식.    │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   블록체인 RPC는 순간적 과부하, 네트워크 지연 등으로 일시적으로 실패   │
// │   할 수 있다. 바로 재시도하면 서버에 부하가 집중되므로 간격을 두고     │
// │   재시도하는 것이 표준 패턴이다.                                        │
// │                                                                         │
// │ [문법 해부: 지수 백오프]                                               │
// │   baseDelayMs * Math.pow(2, attempt - 1)                               │
// │   attempt=1: baseDelayMs * 1 = 100ms                                   │
// │   attempt=2: baseDelayMs * 2 = 200ms                                   │
// │   attempt=3: baseDelayMs * 4 = 400ms                                   │
// │                                                                         │
// │ [주의사항]                                                              │
// │   - DeferredProcessingError처럼 재시도가 의미 없는 에러는 즉시 throw  │
// │     해서 재시도 루프를 빠져나온다.                                      │
// │   - lastError를 누적하다가 마지막에 MaxRetriesExceededError에 담아     │
// │     원인을 보존한다.                                                    │
// │   - 제네릭 <T>: 어떤 타입의 작업이든 처리 가능. ch07에서 자세히 다룸. │
// └─────────────────────────────────────────────────────────────────────────┘

async function retryWithBackoff<T>(
  fn: () => Promise<T>,           // 재시도할 작업 함수
  maxAttempts: number = 3,        // 최대 시도 횟수 (기본 3회)
  baseDelayMs: number = 100,      // 기본 대기 시간 (ms)
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();  // 성공하면 즉시 반환, 루프 종료
    } catch (err) {
      // 에러를 Error 타입으로 통일 (catch의 err는 unknown)
      lastError = err instanceof Error ? err : new Error(String(err));

      // DeferredProcessingError: 재시도 의미 없음 → 바로 던짐
      if (err instanceof DeferredProcessingError) {
        throw err;   // 재시도 안 함
      }

      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxAttempts) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);  // 지수 백오프
        console.log(`  시도 ${attempt} 실패, ${delayMs}ms 후 재시도...`);
        await delay(delayMs);  // 지정 시간만큼 대기
      }
    }
  }

  // maxAttempts 모두 실패 → 원인 에러를 담아서 던짐
  throw new MaxRetriesExceededError(maxAttempts, lastError);
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 4. Promise.all — 병렬 실행                                              │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   여러 Promise를 동시에 실행하고, 모두 완료될 때까지 기다린다.         │
// │   순서대로 하나씩 await하는 것보다 훨씬 빠르다.                        │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   여러 주소의 잔액을 조회할 때, 하나씩 순서대로 하면 N * 응답시간이지만│
// │   Promise.all로 하면 max(응답시간) 만큼만 기다리면 된다.              │
// │                                                                         │
// │ [주의사항]                                                              │
// │   하나라도 reject되면 전체가 실패한다. 일부 실패해도 나머지를 계속    │
// │   처리하려면 Promise.allSettled를 쓴다.                                │
// └─────────────────────────────────────────────────────────────────────────┘

async function fetchAllBalances(addresses: string[]): Promise<number[]> {
  // addresses.map(addr => fetchTokenBalance(addr)): Promise 배열 생성
  // Promise.all: 배열의 모든 Promise가 완료될 때까지 기다린 후 결과 배열 반환
  return Promise.all(addresses.map(addr => fetchTokenBalance(addr)));
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 5. Promise.allSettled — 일부 실패해도 계속                              │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   Promise.all과 달리 일부가 실패해도 나머지를 계속 실행하고,           │
// │   각 Promise의 성공/실패 결과를 배열로 반환한다.                       │
// │                                                                         │
// │ [결과 구조]                                                             │
// │   result.status === 'fulfilled': 성공. result.value에 값이 있음.       │
// │   result.status === 'rejected': 실패. result.reason에 에러가 있음.     │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   여러 주소 중 일부가 잘못된 경우에도 나머지 정상 주소의 잔액은 보고  │
// │   싶을 때. 하나가 에러라고 전체를 버리면 안 되는 상황.                │
// └─────────────────────────────────────────────────────────────────────────┘

async function fetchAllSafe(
  addresses: string[],
): Promise<Array<{ address: string; balance: number | null }>> {
  // allSettled: 성공/실패 여부와 관계없이 모든 Promise 완료를 기다림
  const results = await Promise.allSettled(
    addresses.map(addr => fetchTokenBalance(addr)),
  );

  // results 배열을 { address, balance } 형태로 변환
  // i: 인덱스를 이용해 addresses[i]와 results[i]를 매핑
  return results.map((result, i) => ({
    address: addresses[i]!,  // !: addresses[i]가 반드시 존재함을 단언 (인덱스 범위 내이므로)
    // status가 'fulfilled'이면 result.value, 아니면 null
    balance: result.status === 'fulfilled' ? result.value : null,
  }));
}

// ─ 헬퍼 ─
// delay: 지정 시간(ms)만큼 대기하는 Promise. 테스트와 시뮬레이션에 사용.
// new Promise(resolve => setTimeout(resolve, ms))
// → ms 밀리초 후 resolve()를 호출 → Promise가 fulfilled 상태가 됨
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── 실행 확인 ───────────────────────────────────────────────────────────────
async function main() {
  console.log('=== CH05 비동기 · Promise · 에러 ===');

  // 기본 await: fetchTokenBalance는 Promise<number> 반환 → await로 number 추출
  const balance = await fetchTokenBalance('0xAAA');
  console.log('balance:', balance);

  // 에러 분기: '0xBAD'는 에러를 던지므로 processWithFallback이 null 반환
  const result = await processWithFallback('0xBAD');
  console.log('fallback result:', result);

  // 재시도: 처음 2번은 실패, 3번째에 성공
  let attempts = 0;
  try {
    await retryWithBackoff(async () => {
      attempts++;
      if (attempts < 3) throw new Error('일시적 오류');
      return '성공';
    }, 3, 10);
    console.log(`재시도 성공 (${attempts}번 시도)`);
  } catch (err) {
    console.error('재시도 포기:', err instanceof Error ? err.message : err);
  }

  // DeferredProcessingError는 재시도 없이 즉시 throw됨
  try {
    await retryWithBackoff(async () => {
      throw new DeferredProcessingError('나중에 처리');
    }, 3, 10);
  } catch (err) {
    if (err instanceof DeferredProcessingError) {
      console.log('DeferredError 감지 → 재시도 없이 큐로:', err.message);
    }
  }

  // Promise.all: 세 주소 동시 조회
  const balances = await fetchAllBalances(['0xAAA', '0xBBB', '0xCCC']);
  console.log('모든 잔액:', balances);

  // Promise.allSettled: '0xBAD'는 실패하지만 나머지 결과는 살아있음
  const safeResults = await fetchAllSafe(['0xAAA', '0xBAD', '0xCCC']);
  console.log('safe results:', safeResults);
  // 출력 예: [ { address: '0xAAA', balance: 1000 }, { address: '0xBAD', balance: null }, ... ]
}

main();

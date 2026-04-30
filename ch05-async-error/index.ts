// ─── CH05: 비동기 · Promise · 에러 ─────────────────────────────────────────

// ─ 커스텀 에러 클래스 ─
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

// ─ 1. async/await 기본 ─
async function fetchTokenBalance(address: string): Promise<number> {
  await delay(10);
  if (address === '0xBAD') throw new Error('주소를 찾을 수 없음');
  return 1000;
}

// ─ 2. try/catch + 에러 종류별 분기 (강의 핵심 패턴) ─
async function processWithFallback(address: string): Promise<number | null> {
  try {
    const balance = await fetchTokenBalance(address);
    return balance;
  } catch (err) {
    if (err instanceof DeferredProcessingError) {
      console.log('지연 처리 — 재시도 큐로 이동');
      return null;
    }
    // err가 Error인지 확인 후 메시지 추출 (unknown 타입이므로 강제 불가)
    const message = err instanceof Error ? err.message : String(err);
    console.error('처리 실패:', message);
    return null;
  }
}

// ─ 3. 재시도 with backoff (강의 M3_S17 패턴) ─
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
        throw err;   // 재시도 안 함
      }

      if (attempt < maxAttempts) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);  // 지수 백오프
        console.log(`  시도 ${attempt} 실패, ${delayMs}ms 후 재시도...`);
        await delay(delayMs);
      }
    }
  }

  throw new MaxRetriesExceededError(maxAttempts, lastError);
}

// ─ 4. Promise.all — 병렬 실행 ─
async function fetchAllBalances(addresses: string[]): Promise<number[]> {
  return Promise.all(addresses.map(addr => fetchTokenBalance(addr)));
}

// ─ 5. Promise.allSettled — 일부 실패해도 계속 ─
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

// ─ 헬퍼 ─
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── 실행 확인 ───────────────────────────────────────────────────────────────
async function main() {
  console.log('=== CH05 비동기 · Promise · 에러 ===');

  // 기본 await
  const balance = await fetchTokenBalance('0xAAA');
  console.log('balance:', balance);

  // 에러 분기
  const result = await processWithFallback('0xBAD');
  console.log('fallback result:', result);

  // 재시도
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

  // DeferredProcessingError는 재시도 안 함
  try {
    await retryWithBackoff(async () => {
      throw new DeferredProcessingError('나중에 처리');
    }, 3, 10);
  } catch (err) {
    if (err instanceof DeferredProcessingError) {
      console.log('DeferredError 감지 → 재시도 없이 큐로:', err.message);
    }
  }

  // Promise.all
  const balances = await fetchAllBalances(['0xAAA', '0xBBB', '0xCCC']);
  console.log('모든 잔액:', balances);

  // Promise.allSettled (일부 실패해도 OK)
  const safeResults = await fetchAllSafe(['0xAAA', '0xBAD', '0xCCC']);
  console.log('safe results:', safeResults);
}

main();

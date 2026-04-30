// ─── CH07: 제네릭 ────────────────────────────────────────────────────────────
//
// 제네릭 = "타입을 매개변수처럼 넘기는 것"
// Promise<string>, Array<number>, Record<string, number> 모두 제네릭을 씀
// 강의 코드에서 가장 많이 만나는 부분

// ─ 1. 제네릭 함수 기본 ─

// 타입 없이 쓰면 — 항상 string만 가능
function findStringById(items: string[], id: string): string | undefined {
  return items.find(item => item === id);
}

// 제네릭으로 — 어떤 타입이든 동작
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
  // T extends { id: string } → "T는 id 필드가 있는 타입이어야 한다"
}

interface MintRequest {
  id: string;
  tokenId: string;
  toAddress: string;
}

interface WalletRecord {
  id: string;
  address: string;
  chainId: number;
}

const requests: MintRequest[] = [
  { id: 'req-001', tokenId: 'token-1', toAddress: '0xAAA' },
  { id: 'req-002', tokenId: 'token-2', toAddress: '0xBBB' },
];

const wallets: WalletRecord[] = [
  { id: 'w-001', address: '0xAAA', chainId: 1 },
  { id: 'w-002', address: '0xBBB', chainId: 137 },
];

// 같은 함수로 다른 타입 검색
const foundRequest = findById(requests, 'req-001');  // 타입: MintRequest | undefined
const foundWallet  = findById(wallets, 'w-002');     // 타입: WalletRecord | undefined

// ─ 2. 제네릭 + Promise (강의에서 매일 만남) ─

// Promise<T>도 제네릭 — T는 resolve 값의 타입
async function fetchOrNull<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

// ─ 3. 제네릭 인터페이스 ─

interface Repository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  findAll(): Promise<T[]>;
}

// 구체 구현
class InMemoryRepository<T extends { id: string }> implements Repository<T> {
  private store = new Map<string, T>();

  async findById(id: string): Promise<T | null> {
    return this.store.get(id) ?? null;
  }

  async save(entity: T): Promise<void> {
    this.store.set(entity.id, entity);
  }

  async findAll(): Promise<T[]> {
    return [...this.store.values()];
  }
}

// ─ 4. 제네릭 클래스 — 재시도 큐 패턴 ─

class RetryQueue<T> {
  private items: Array<{ item: T; attempts: number }> = [];

  enqueue(item: T): void {
    this.items.push({ item, attempts: 0 });
  }

  dequeue(): { item: T; attempts: number } | undefined {
    return this.items.shift();
  }

  get size(): number {
    return this.items.length;
  }
}

// ─ 5. 제네릭 제약 조합 — extends + 여러 조건 ─

interface HasTimestamp {
  createdAt: Date;
}

interface HasId {
  id: string;
}

// T는 반드시 id와 createdAt 둘 다 가져야 함
function getLatest<T extends HasId & HasTimestamp>(items: T[]): T | undefined {
  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

// ─ 6. retryWithBackoff 제네릭 버전 (강의 M3_S17 핵심) ─

async function retryWithBackoff<T>(
  fn: () => Promise<T>,             // fn은 T를 리턴하는 async 함수
  maxAttempts: number = 3,
  baseDelayMs: number = 100,
): Promise<T> {
  let lastError: Error = new Error('unknown');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();            // T 타입으로 리턴
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, baseDelayMs * attempt));
      }
    }
  }

  throw lastError;
}

// ─── 실행 확인 ───────────────────────────────────────────────────────────────
async function main() {
  console.log('=== CH07 제네릭 ===');

  // findById
  console.log('foundRequest:', foundRequest);
  console.log('foundWallet:', foundWallet);

  // Repository 제네릭
  const requestRepo = new InMemoryRepository<MintRequest>();
  await requestRepo.save({ id: 'req-001', tokenId: 'token-1', toAddress: '0xAAA' });
  await requestRepo.save({ id: 'req-002', tokenId: 'token-2', toAddress: '0xBBB' });

  const found = await requestRepo.findById('req-001');
  console.log('repo findById:', found);

  const all = await requestRepo.findAll();
  console.log('repo findAll:', all);

  // RetryQueue
  const queue = new RetryQueue<MintRequest>();
  queue.enqueue({ id: 'req-003', tokenId: 'token-3', toAddress: '0xCCC' });
  console.log('queue size:', queue.size);
  console.log('dequeue:', queue.dequeue());

  // fetchOrNull
  const result = await fetchOrNull(async () => {
    throw new Error('일시적 오류');
  });
  console.log('fetchOrNull (에러시):', result);  // null

  // retryWithBackoff
  let count = 0;
  const val = await retryWithBackoff(async () => {
    count++;
    if (count < 3) throw new Error('실패');
    return 'OK';
  }, 5, 10);
  console.log(`retryWithBackoff 결과: ${val} (${count}번 시도)`);
}

main();

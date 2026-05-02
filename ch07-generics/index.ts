// ─── CH07: 제네릭 ────────────────────────────────────────────────────────────
//
// 제네릭 = "타입을 매개변수처럼 넘기는 것"
// Promise<string>, Array<number>, Record<string, number> 모두 제네릭을 씀
// 강의 코드에서 가장 많이 만나는 부분

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 1. 제네릭 함수 기본                                                     │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   타입을 변수처럼 받아서 함수 내부에서 사용하는 문법.                  │
// │   같은 로직을 여러 타입에 재사용할 수 있게 한다.                       │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   findById 함수를 만들 때, MintRequest용, WalletRecord용을 각각 만들면 │
// │   코드 중복이 생긴다. 제네릭으로 하나만 만들면 어떤 타입이든 동작한다. │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   function findById<T extends { id: string }>(items: T[], id: string)  │
// │                    ①          ②                     ③                  │
// │   ① <T>: T라는 타입 파라미터를 선언. 호출 시 구체 타입으로 채워짐.   │
// │   ② T extends { id: string }: T는 반드시 id 필드(string)가 있어야 함.│
// │      이 제약이 없으면 item.id 접근 시 에러가 난다.                    │
// │   ③ items: T[]: T의 배열. 어떤 타입이든 배열로 받을 수 있다.          │
// │                                                                         │
// │ [타입 추론]                                                             │
// │   findById(requests, 'req-001')를 호출할 때 TypeScript가               │
// │   requests의 타입을 보고 T = MintRequest로 자동 추론한다.              │
// │   <MintRequest>findById(requests, 'req-001') 처럼 명시하지 않아도 됨. │
// │                                                                         │
// │ [주의사항]                                                              │
// │   extends 제약 없이 T만 쓰면 item.id 접근이 불가하다. T가 어떤 타입  │
// │   인지 모르기 때문에 TS는 id 필드가 있다고 보장할 수 없다.            │
// └─────────────────────────────────────────────────────────────────────────┘

// 제네릭 없이 — string 배열에서만 작동
function findStringById(items: string[], id: string): string | undefined {
  return items.find(item => item === id);
}

// 제네릭 적용 — { id: string }이 있는 어떤 타입이든 동작
// T extends { id: string } → T는 id 필드가 있는 타입으로 제약
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
  // T extends { id: string } 덕분에 item.id 접근이 타입 안전하다
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
// T가 각각 MintRequest, WalletRecord로 자동 추론된다
const foundRequest = findById(requests, 'req-001');  // 반환 타입: MintRequest | undefined
const foundWallet  = findById(wallets, 'w-002');     // 반환 타입: WalletRecord | undefined

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 2. 제네릭 + Promise (강의에서 매일 만남)                               │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   Promise 자체가 제네릭이다. Promise<string>은 "완료 시 string을 주는  │
// │   Promise"를 의미한다. async 함수의 반환 타입에서 가장 많이 등장한다.  │
// │                                                                         │
// │ [fetchOrNull 패턴]                                                      │
// │   에러가 나면 null을 반환하는 안전한 래퍼. 제네릭 T 덕분에           │
// │   어떤 타입의 async 함수든 감쌀 수 있다.                               │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   async function fetchOrNull<T>(fn: () => Promise<T>): Promise<T | null>│
// │                              ①   ②                    ③               │
// │   ① T: 타입 파라미터                                                   │
// │   ② fn: () => Promise<T>: T를 반환하는 async 함수를 매개변수로 받음   │
// │   ③ Promise<T | null>: 성공하면 T, 실패하면 null을 담은 Promise       │
// └─────────────────────────────────────────────────────────────────────────┘

// Promise<T>도 제네릭 — T는 resolve 값의 타입
// fetchOrNull<number>: 숫자를 반환하는 fn이 실패하면 null 반환
async function fetchOrNull<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();   // 성공: T 반환
  } catch {
    return null;         // 실패: null 반환 (에러 메시지는 버림)
  }
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 3. 제네릭 인터페이스                                                    │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   인터페이스도 타입 파라미터를 받을 수 있다. Repository<MintRequest>와  │
// │   Repository<WalletRecord>는 각각 해당 타입을 저장하는 저장소를 의미.  │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   강의 코드에서 Repository<T> 패턴은 핵심이다. DB나 메모리에 어떤     │
// │   타입의 엔티티든 저장/조회하는 계약을 하나의 인터페이스로 표현한다.  │
// │   findById, save, findAll 로직이 동일하므로 제네릭으로 재사용한다.    │
// └─────────────────────────────────────────────────────────────────────────┘

// Repository<T>: T 타입 엔티티를 관리하는 저장소 인터페이스
// T를 MintRequest로 채우면 MintRequest 저장소 계약이 된다
interface Repository<T> {
  findById(id: string): Promise<T | null>;   // T 또는 null 반환
  save(entity: T): Promise<void>;            // T 저장
  findAll(): Promise<T[]>;                   // 모든 T 반환
}

// 구체 구현: InMemoryRepository<T>
// T extends { id: string }: save 시 entity.id로 키를 만들어야 하므로 제약 필요
class InMemoryRepository<T extends { id: string }> implements Repository<T> {
  // Map<string, T>: id를 키로 T를 저장하는 메모리 저장소
  private store = new Map<string, T>();

  async findById(id: string): Promise<T | null> {
    // Map.get은 T | undefined 반환. ?? null로 undefined를 null로 변환
    return this.store.get(id) ?? null;
  }

  async save(entity: T): Promise<void> {
    // entity.id: T extends { id: string } 덕분에 접근 가능
    this.store.set(entity.id, entity);
  }

  async findAll(): Promise<T[]> {
    // Map.values()로 값 이터레이터 얻고 스프레드로 배열화
    return [...this.store.values()];
  }
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 4. 제네릭 클래스 — 재시도 큐 패턴                                      │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   클래스도 타입 파라미터를 받을 수 있다. RetryQueue<MintRequest>는     │
// │   MintRequest를 담는 재시도 큐, RetryQueue<string>은 문자열 재시도 큐. │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   처리 실패한 아이템을 재시도 큐에 넣는 패턴이 강의 코드에서 자주      │
// │   등장한다. 어떤 타입의 아이템이든 같은 큐 구현을 재사용한다.         │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   private items: Array<{ item: T; attempts: number }> = [];             │
// │   → items 배열의 각 원소는 { item: T, attempts: number } 형태         │
// │   → T가 MintRequest면: { item: MintRequest; attempts: number }[]       │
// └─────────────────────────────────────────────────────────────────────────┘

class RetryQueue<T> {
  // 각 아이템과 시도 횟수를 함께 저장
  private items: Array<{ item: T; attempts: number }> = [];

  // enqueue: 아이템을 큐에 추가. attempts는 0으로 초기화.
  enqueue(item: T): void {
    this.items.push({ item, attempts: 0 });
  }

  // dequeue: 큐에서 첫 번째 아이템을 꺼냄. 없으면 undefined.
  // shift(): 배열의 첫 번째 원소를 꺼내고 나머지를 앞으로 당김 (FIFO)
  dequeue(): { item: T; attempts: number } | undefined {
    return this.items.shift();
  }

  // get size(): number → 게터(getter). 호출 시 괄호 없이 .size 로 접근
  get size(): number {
    return this.items.length;
  }
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 5. 제네릭 제약 조합 — extends + 여러 조건                               │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   & (인터섹션)으로 여러 인터페이스의 조건을 동시에 만족해야 하는       │
// │   제약을 만든다.                                                         │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   T extends HasId & HasTimestamp                                         │
// │   → T는 HasId와 HasTimestamp 둘 다 만족해야 함                         │
// │   → id 필드와 createdAt 필드 모두 있어야 함                            │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   getLatest() 함수는 정렬을 위해 createdAt이 필요하고, 식별을 위해    │
// │   id가 필요하다. 이 둘을 동시에 갖는 타입만 허용하는 것이 안전하다.  │
// └─────────────────────────────────────────────────────────────────────────┘

interface HasTimestamp {
  createdAt: Date;
}

interface HasId {
  id: string;
}

// T는 반드시 id와 createdAt 둘 다 가져야 함
// & : 인터섹션 타입. A & B = A와 B의 조건을 모두 만족하는 타입
function getLatest<T extends HasId & HasTimestamp>(items: T[]): T | undefined {
  // createdAt.getTime()으로 타임스탬프 비교. 더 최근 것이 앞으로.
  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 6. retryWithBackoff 제네릭 버전 (강의 M3_S17 핵심)                     │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   ch05에서 본 retryWithBackoff와 동일하지만, 제네릭으로 어떤 타입이든  │
// │   반환하는 작업을 재시도할 수 있게 만든 버전.                           │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   async function retryWithBackoff<T>(fn: () => Promise<T>): Promise<T> │
// │                                   ①   ②                   ③           │
// │   ① T: 타입 파라미터                                                   │
// │   ② fn: T를 반환하는 비동기 함수                                       │
// │   ③ Promise<T>: 함수 전체의 반환 타입도 T를 담은 Promise              │
// │                                                                         │
// │   retryWithBackoff(async () => 'OK')    → Promise<string>             │
// │   retryWithBackoff(async () => 42)      → Promise<number>              │
// │   반환 타입이 입력 fn에 따라 자동 추론된다.                            │
// └─────────────────────────────────────────────────────────────────────────┘

async function retryWithBackoff<T>(
  fn: () => Promise<T>,             // fn은 T를 리턴하는 async 함수
  maxAttempts: number = 3,
  baseDelayMs: number = 100,
): Promise<T> {
  let lastError: Error = new Error('unknown');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();            // 성공 시 T 타입으로 반환
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts) {
        // 지수 백오프: attempt가 늘수록 대기 시간 증가
        await new Promise(r => setTimeout(r, baseDelayMs * attempt));
      }
    }
  }

  throw lastError;  // 모든 시도 실패 → 마지막 에러 던짐
}

// ─── 실행 확인 ───────────────────────────────────────────────────────────────
async function main() {
  console.log('=== CH07 제네릭 ===');

  // findById: T가 각각 MintRequest, WalletRecord로 추론됨
  console.log('foundRequest:', foundRequest);
  console.log('foundWallet:', foundWallet);

  // Repository 제네릭: MintRequest 타입으로 구체화
  // InMemoryRepository<MintRequest>: MintRequest를 저장하는 메모리 저장소
  const requestRepo = new InMemoryRepository<MintRequest>();
  await requestRepo.save({ id: 'req-001', tokenId: 'token-1', toAddress: '0xAAA' });
  await requestRepo.save({ id: 'req-002', tokenId: 'token-2', toAddress: '0xBBB' });

  const found = await requestRepo.findById('req-001');
  console.log('repo findById:', found);

  const all = await requestRepo.findAll();
  console.log('repo findAll:', all);

  // RetryQueue: MintRequest를 담는 FIFO 재시도 큐
  const queue = new RetryQueue<MintRequest>();
  queue.enqueue({ id: 'req-003', tokenId: 'token-3', toAddress: '0xCCC' });
  console.log('queue size:', queue.size);      // 게터: queue.size() 아니라 queue.size
  console.log('dequeue:', queue.dequeue());    // 첫 번째 아이템 꺼냄

  // fetchOrNull: 에러 발생 시 null 반환
  // T = never (에러만 나므로 타입 추론이 안 되지만, null 반환으로 처리됨)
  const result = await fetchOrNull(async () => {
    throw new Error('일시적 오류');
  });
  console.log('fetchOrNull (에러시):', result);  // null

  // retryWithBackoff: 2번 실패 후 3번째 성공
  // T = string으로 자동 추론 (fn이 string을 반환하므로)
  let count = 0;
  const val = await retryWithBackoff(async () => {
    count++;
    if (count < 3) throw new Error('실패');
    return 'OK';  // string 반환 → T = string
  }, 5, 10);
  console.log(`retryWithBackoff 결과: ${val} (${count}번 시도)`);
}

main();

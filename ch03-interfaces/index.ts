// ─── CH03: 인터페이스와 타입 ─────────────────────────────────────────────────

// 1. 기본 인터페이스
interface MintRequest {
  readonly id: string;          // readonly: 할당 후 변경 불가
  readonly chainId: number;
  toAddress: string;
  tokenId: string;
  memo?: string;                // ?: 선택적 필드
}

// 2. 메서드 포함 인터페이스
interface TxRepository {
  findById(id: string): Promise<MintRequest | null>;
  save(req: MintRequest): Promise<void>;
  updateStatus(id: string, status: string): Promise<void>;
}

// 3. 강의 핵심 인터페이스 패턴 — EventProcessor
interface StreamMessage {
  id: string;
  fields: Record<string, string>;   // Record<K,V>: key-value 객체
}

interface EventProcessor {
  eventTypes: string[];             // 이 processor가 처리할 이벤트 타입 목록
  process(message: StreamMessage): Promise<void>;
}

// 4. union 타입 — 상태 머신
type TxStatus =
  | 'REQUESTED'
  | 'SUBMITTED'
  | 'PENDING'
  | 'MINED'
  | 'CONFIRMED'
  | 'FAILED';

// 5. type vs interface
type WalletAddress = string;           // 단순 alias
type Result<T> = { ok: true; data: T } | { ok: false; error: string };  // union 조합엔 type

// 6. 유효 전이 맵 — Record로 상태 머신 정의 (강의 코드에서 등장)
const VALID_TRANSITIONS: Record<TxStatus, TxStatus[]> = {
  REQUESTED: ['SUBMITTED', 'FAILED'],
  SUBMITTED: ['PENDING', 'FAILED'],
  PENDING:   ['MINED', 'FAILED'],
  MINED:     ['CONFIRMED', 'FAILED'],
  CONFIRMED: [],
  FAILED:    [],
};

function canTransition(from: TxStatus, to: TxStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

// 7. 인터페이스 구현체 (구체 객체)
const mockProcessor: EventProcessor = {
  eventTypes: ['NFT_ISSUED', 'NFT_BURNED'],
  async process(message) {
    const eventType = message.fields['eventType'] ?? '';
    console.log(`처리 중: ${eventType}, msgId: ${message.id}`);
  },
};

// 8. Map<K, V> — 타입 안전한 key-value 저장소
// 강의 코드에서 idempotency 키 관리, 정책 저장 등에 사용

const balanceMap = new Map<string, bigint>();          // key: string, value: bigint

balanceMap.set('0xAAA', 1000n);
balanceMap.set('0xBBB', 500n);

const bal = balanceMap.get('0xAAA');                   // bigint | undefined
const safe = balanceMap.get('0xAAA') ?? 0n;            // undefined면 0n

console.log('has 0xAAA:', balanceMap.has('0xAAA'));    // true
console.log('has 0xCCC:', balanceMap.has('0xCCC'));    // false

balanceMap.delete('0xBBB');

// 순회
for (const [addr, amount] of balanceMap) {
  console.log(`${addr}: ${amount}`);
}

// 강의 패턴 — 정책 캐시 (IdempotencyGuard 등)
class IdempotencyGuard {
  private readonly store = new Map<string, boolean>();

  async run(key: string, fn: () => Promise<void>): Promise<void> {
    if (this.store.has(key)) {
      console.log(`중복 실행 차단: ${key}`);
      return;
    }
    this.store.set(key, true);
    await fn();
  }
}

// ─── 실행 확인 ───────────────────────────────────────────────────────────────
async function main() {
  console.log('=== CH03 인터페이스와 타입 ===');

  // union 타입 — 잘못된 값은 컴파일 에러
  const status: TxStatus = 'SUBMITTED';
  console.log('canTransition SUBMITTED → PENDING:', canTransition(status, 'PENDING'));
  console.log('canTransition SUBMITTED → CONFIRMED:', canTransition(status, 'CONFIRMED'));

  // EventProcessor 사용
  const msg: StreamMessage = {
    id: 'msg-001',
    fields: { eventType: 'NFT_ISSUED', tokenId: 'token-1' },
  };

  if (mockProcessor.eventTypes.includes(msg.fields['eventType'])) {
    await mockProcessor.process(msg);
  }

  // Result 타입 활용
  const result: Result<MintRequest> = {
    ok: true,
    data: { id: 'req-001', chainId: 1, toAddress: '0xAAA', tokenId: 'token-1' },
  };

  if (result.ok) {
    console.log('mint request id:', result.data.id);
  }

  // Map
  console.log('balanceMap get 0xAAA:', safe);

  const guard = new IdempotencyGuard();
  await guard.run('mint:token-1', async () => { console.log('실행됨'); });
  await guard.run('mint:token-1', async () => { console.log('이건 안 실행됨'); });
}

main();

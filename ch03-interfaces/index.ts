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
}

main();

// ─── CH08: 유틸리티 타입 + 타입 가드 ───────────────────────────────────────
//
// 유틸리티 타입 = TS 내장 타입 변환 도구
// 강의 코드에서 자주 등장하는 것만 추린다

// ─ 기본 타입 정의 ─

interface MintRequest {
  id: string;
  toAddress: string;
  tokenId: string;
  chainId: number;
  memo: string;
  createdAt: Date;
}

// ─ 1. Partial<T> — 모든 필드를 optional로 ─
// 쓰는 이유: 업데이트 시 일부 필드만 받을 때

type MintRequestUpdate = Partial<MintRequest>;
// 결과: { id?: string; toAddress?: string; tokenId?: string; ... }

async function updateRequest(id: string, patch: Partial<MintRequest>): Promise<void> {
  console.log(`업데이트: id=${id}, patch=`, patch);
  // patch에는 변경할 필드만 있으면 됨
}

// ─ 2. Required<T> — 모든 optional을 필수로 ─

interface Config {
  host?: string;
  port?: number;
  timeout?: number;
}

type FullConfig = Required<Config>;
// 결과: { host: string; port: number; timeout: number }

// ─ 3. Pick<T, K> — 필드 선택 ─
// 쓰는 이유: 특정 필드만 담은 타입이 필요할 때

type MintSummary = Pick<MintRequest, 'id' | 'tokenId' | 'toAddress'>;
// 결과: { id: string; tokenId: string; toAddress: string }

// ─ 4. Omit<T, K> — 필드 제거 ─
// 쓰는 이유: 특정 필드만 빼고 싶을 때

type MintRequestCreate = Omit<MintRequest, 'id' | 'createdAt'>;
// 결과: { toAddress: string; tokenId: string; chainId: number; memo: string }

function createRequest(data: MintRequestCreate): MintRequest {
  return {
    id: `req-${Date.now()}`,
    createdAt: new Date(),
    ...data,
  };
}

// ─ 5. Record<K, V> — 심화 ─
// 강의에서 상태 전이 맵 등에 자주 등장

type TxStatus = 'REQUESTED' | 'SUBMITTED' | 'PENDING' | 'CONFIRMED' | 'FAILED';

const TRANSITIONS: Record<TxStatus, TxStatus[]> = {
  REQUESTED: ['SUBMITTED', 'FAILED'],
  SUBMITTED: ['PENDING', 'FAILED'],
  PENDING:   ['CONFIRMED', 'FAILED'],
  CONFIRMED: [],
  FAILED:    [],
};

// ─ 6. ReturnType<T> — 함수 리턴 타입 추출 ─

function getTokenInfo() {
  return { tokenId: 'token-1', supply: 1000, paused: false };
}

type TokenInfo = ReturnType<typeof getTokenInfo>;
// 결과: { tokenId: string; supply: number; paused: boolean }

// ─ 7. Awaited<T> — Promise 안의 타입 추출 ─

async function fetchUser() {
  return { id: 'user-001', name: 'Sharon' };
}

type User = Awaited<ReturnType<typeof fetchUser>>;
// 결과: { id: string; name: string }

// ─ 8. 타입 가드 — 타입 좁히기 ─

// instanceof 가드 (강의 M3_S17 패턴)
class DeferredError extends Error {
  constructor(msg: string) { super(msg); this.name = 'DeferredError'; }
}

function handleError(err: unknown): void {
  if (err instanceof DeferredError) {
    console.log('Deferred → 큐로:', err.message);
    return;
  }
  if (err instanceof Error) {
    console.log('일반 에러:', err.message);
    return;
  }
  console.log('알 수 없는 에러:', String(err));
}

// typeof 가드
function formatInput(input: string | number): string {
  if (typeof input === 'number') {
    return `숫자: ${input.toFixed(2)}`;   // 여기선 input이 number로 좁혀짐
  }
  return `문자열: ${input.toUpperCase()}`; // 여기선 string으로 좁혀짐
}

// 사용자 정의 타입 가드 (is 키워드)
interface StreamMessage {
  id: string;
  fields: Record<string, string>;
}

function isStreamMessage(val: unknown): val is StreamMessage {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'fields' in val
  );
}

// ─ 9. 실전 패턴 — 에러 안전 추출 ─
function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  return new Error(String(err));
  // catch (err) 블록에서 err는 unknown → 이렇게 변환
}

// ─── 실행 확인 ───────────────────────────────────────────────────────────────
async function main() {
  console.log('=== CH08 유틸리티 타입 + 타입 가드 ===');

  // Partial
  await updateRequest('req-001', { toAddress: '0xBBB', memo: '수정됨' });

  // Omit + createRequest
  const newReq = createRequest({ toAddress: '0xCCC', tokenId: 'token-5', chainId: 1, memo: '' });
  console.log('newReq:', newReq);

  // Record 상태 전이
  const next = TRANSITIONS['SUBMITTED'];
  console.log('SUBMITTED → 가능한 다음 상태:', next);

  // 타입 가드
  handleError(new DeferredError('나중에 처리'));
  handleError(new Error('일반 오류'));
  handleError('문자열 에러');

  console.log('formatInput(42.567):', formatInput(42.567));
  console.log('formatInput("hello"):', formatInput('hello'));

  // isStreamMessage 타입 가드
  const rawData: unknown = { id: 'msg-001', fields: { eventType: 'NFT_ISSUED' } };
  if (isStreamMessage(rawData)) {
    // 여기서 rawData는 StreamMessage 타입으로 좁혀짐
    console.log('StreamMessage 확인됨:', rawData.fields['eventType']);
  }

  // Awaited
  const user: User = await fetchUser();
  console.log('user:', user);
}

main();

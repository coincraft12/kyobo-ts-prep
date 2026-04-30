// ─── CH06: 모던 문법 ─────────────────────────────────────────────────────────

// ─ 1. 구조 분해 할당 ─

// 객체
const mintRequest = { id: 'req-001', toAddress: '0xAAA', tokenId: 'token-1', chainId: 1 };
const { id, toAddress, tokenId } = mintRequest;                   // 기본
const { id: requestId } = mintRequest;                            // 이름 바꾸기
const { chainId = 137 } = {} as typeof mintRequest;              // 기본값

// 강의 빈출 패턴
const message = { id: 'msg-001', fields: { eventType: 'NFT_ISSUED', _retryCount: '2' } };
const { fields } = message;
const { eventType, _retryCount } = fields;

// 배열
const statuses = ['REQUESTED', 'SUBMITTED', 'PENDING'];
const [first, second, ...rest] = statuses;

// 중첩
const result = { data: { user: { name: 'Sharon', role: 'admin' } } };
const { data: { user: { name: userName, role } } } = result;

// for...of + Object.entries
const balances: Record<string, number> = { '0xAAA': 1000, '0xBBB': 500 };
for (const [address, amount] of Object.entries(balances)) {
  console.log(`${address}: ${amount}`);
}

// ─ 2. nullish 연산자 ─

// ?? — null/undefined일 때만 오른쪽 (0, '' 는 정상값 취급)
const retryCount = parseInt(message.fields['_retryCount'] ?? '0', 10);
const port = process.env['PORT'] ?? '3000';

// ?. — 옵셔널 체이닝
interface Order { user?: { address?: { city?: string } } }
const order: Order = {};
const city = order?.user?.address?.city ?? '서울';  // undefined 체인 끊김 → 기본값

// || vs ?? 차이
const inputA = '';
console.log('|| 결과:', inputA || '기본값');   // '기본값' (빈 문자열도 falsy 취급)
console.log('?? 결과:', inputA ?? '기본값');   // '' (빈 문자열은 정상값)

// ─ 3. spread / rest ─

// 배열 spread
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];

// 객체 spread — 복사 + 덮어쓰기
const base = { chainId: 1, toAddress: '0xAAA', tokenId: 'token-1' };
const override = { ...base, toAddress: '0xBBB' };   // toAddress만 교체

// rest 매개변수
function logAll(label: string, ...args: unknown[]): void {
  console.log(label, ...args);
}

// ─ 4. 템플릿 리터럴 ─
const streamKey = `nft:events:chain-${1}`;
const idempotencyKey = `mint:${toAddress}:${tokenId}`;

// ─ 5. as const — 문자열 리터럴 고정 ─
const CHAIN_TYPE = 'EVM' as const;          // 타입: 'EVM' (string 아님)
// CHAIN_TYPE = 'XRPL';                     // 에러: 'EVM'으로 고정됨

const ROLES = {
  MINTER: 'MINTER_ROLE',
  PAUSER: 'PAUSER_ROLE',
  ADMIN:  'DEFAULT_ADMIN_ROLE',
} as const;
// ROLES.MINTER = 'x';                      // 에러: readonly

type Role = typeof ROLES[keyof typeof ROLES];  // 'MINTER_ROLE' | 'PAUSER_ROLE' | 'DEFAULT_ADMIN_ROLE'

// ─ 6. 타입 단언 as / ! ─
const raw: unknown = '{"tokenId":"token-1"}';
const parsed = JSON.parse(raw as string) as { tokenId: string };   // as: "이 타입이라고 믿어"
console.log('tokenId:', parsed.tokenId);

const map = new Map<string, number>();
map.set('0xAAA', 1000);
const val = map.get('0xAAA')!;  // !: "null/undefined 아님" 단언 — get()은 undefined 가능하지만 확실할 때만

// ─── 실행 확인 ───────────────────────────────────────────────────────────────
console.log('=== CH06 모던 문법 ===');
console.log('first, second:', first, second);
console.log('rest:', rest);
console.log('userName, role:', userName, role);
console.log('retryCount:', retryCount);
console.log('city:', city);
console.log('arr2:', arr2);
console.log('override:', override);
console.log('streamKey:', streamKey);
console.log('idempotencyKey:', idempotencyKey);
console.log('CHAIN_TYPE:', CHAIN_TYPE);
console.log('val from map:', val);
logAll('로그:', 'a', 'b', 'c');

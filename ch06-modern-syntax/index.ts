// ─── CH06: 모던 문법 ─────────────────────────────────────────────────────────

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 1. 구조 분해 할당 (Destructuring Assignment)                            │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   객체나 배열에서 필요한 값을 꺼내어 변수에 담는 문법.                 │
// │   강의 코드에서 함수 매개변수, 이벤트 필드 추출 등에 광범위하게 쓰인다.│
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   mintRequest.id, mintRequest.toAddress, mintRequest.tokenId 처럼       │
// │   반복해서 접근하는 대신 한 줄로 꺼낼 수 있어 코드가 짧아진다.        │
// │                                                                         │
// │ [문법 해부: 객체 구조 분해]                                             │
// │   const { id, toAddress, tokenId } = mintRequest;                       │
// │         ①                           ②                                  │
// │   ① 꺼낼 키 이름들 (중괄호 안에)                                       │
// │   ② 원본 객체                                                           │
// │   → mintRequest.id를 id라는 변수에 담는다                              │
// │                                                                         │
// │   이름 바꾸기: { id: requestId } → id 값을 requestId 변수에 담음      │
// │   기본값:     { chainId = 137 }  → chainId가 undefined면 137           │
// │                                                                         │
// │ [주의사항]                                                              │
// │   - 이름 바꾸기 { id: requestId } 에서 requestId가 변수명이고,        │
// │     id가 원본 키다. 처음 보면 방향이 헷갈린다.                         │
// │   - 없는 키를 구조 분해하면 undefined가 담긴다. 에러가 나지 않는다.   │
// └─────────────────────────────────────────────────────────────────────────┘

// 객체 구조 분해 — 기본
const mintRequest = { id: 'req-001', toAddress: '0xAAA', tokenId: 'token-1', chainId: 1 };

// 기본 구조 분해: mintRequest.id → id, mintRequest.toAddress → toAddress ...
const { id, toAddress, tokenId } = mintRequest;

// 이름 바꾸기: id 값을 requestId라는 이름의 변수에 담음
// { 원본키: 새변수명 } 형태
const { id: requestId } = mintRequest;

// 기본값: chainId가 없거나 undefined면 137을 사용
// {} as typeof mintRequest → 빈 객체를 mintRequest 타입으로 단언 (예시용)
const { chainId = 137 } = {} as typeof mintRequest;

// 강의 빈출 패턴: 이벤트 메시지에서 fields 추출 후 다시 구조 분해
const message = { id: 'msg-001', fields: { eventType: 'NFT_ISSUED', _retryCount: '2' } };

// 1단계: message에서 fields 추출
const { fields } = message;

// 2단계: fields에서 필요한 값 추출
// 강의 코드에서 process() 메서드 내부에서 자주 보이는 패턴
const { eventType, _retryCount } = fields;

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 배열 구조 분해                                                          │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   const [first, second, ...rest] = statuses;                            │
// │         ①       ②        ③                                             │
// │   ① first: 첫 번째 원소                                                │
// │   ② second: 두 번째 원소                                               │
// │   ③ ...rest: 나머지 원소들을 배열로 (Rest element)                    │
// │                                                                         │
// │ [주의사항]                                                              │
// │   ...rest 는 반드시 맨 마지막에 와야 한다.                              │
// │   const [first, ...middle, last] = arr  → 에러!                        │
// └─────────────────────────────────────────────────────────────────────────┘

const statuses = ['REQUESTED', 'SUBMITTED', 'PENDING'];

// first = 'REQUESTED', second = 'SUBMITTED', rest = ['PENDING']
const [first, second, ...rest] = statuses;

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 중첩 구조 분해                                                          │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   깊이 중첩된 객체에서 한 번에 값을 꺼내는 문법.                       │
// │   강의 코드에서 API 응답, 설정 객체 등에서 자주 보인다.                │
// │                                                                         │
// │ [주의사항]                                                              │
// │   중첩이 깊어질수록 가독성이 떨어진다. 2~3단계까지만 쓰는 것이 권장.  │
// │   중간 경로의 객체가 undefined면 에러가 나므로 ?. 와 함께 쓰거나      │
// │   기본값을 지정한다.                                                    │
// └─────────────────────────────────────────────────────────────────────────┘

const result = { data: { user: { name: 'Sharon', role: 'admin' } } };

// 한 번에 깊은 곳까지 구조 분해. name은 이미 선언된 변수가 있으므로 userName으로 이름 변경
const { data: { user: { name: userName, role } } } = result;

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ for...of + Object.entries                                               │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   객체의 키-값 쌍을 배열 형태로 반환 후 for...of로 순회하는 패턴.     │
// │   강의 코드에서 설정 맵, 상태 맵 등을 순회할 때 자주 사용된다.        │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   Object.entries(balances)                                              │
// │   → [['0xAAA', 1000], ['0xBBB', 500]] 형태의 배열 반환                │
// │   for (const [address, amount] of ...) → 배열 구조 분해로 꺼냄        │
// └─────────────────────────────────────────────────────────────────────────┘

// Record<string, number>: 키는 string, 값은 number인 객체 타입
const balances: Record<string, number> = { '0xAAA': 1000, '0xBBB': 500 };

// [address, amount]로 구조 분해하며 키-값 동시 접근
for (const [address, amount] of Object.entries(balances)) {
  console.log(`${address}: ${amount}`);
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 2. nullish 연산자: ?? 와 ?.                                             │
// │                                                                         │
// │ [?? — Nullish Coalescing]                                               │
// │ [이게 뭔지]                                                             │
// │   왼쪽 값이 null 또는 undefined일 때만 오른쪽 값을 사용한다.           │
// │   빈 문자열('')이나 숫자 0은 정상값으로 취급한다.                       │
// │                                                                         │
// │ [|| 와의 차이 — 중요!]                                                  │
// │   || (OR): 왼쪽이 falsy면 오른쪽. falsy = false, 0, '', null, undefined│
// │   ??: 왼쪽이 null/undefined일 때만 오른쪽. 0과 ''는 정상값 취급.      │
// │                                                                         │
// │   const port = process.env.PORT || '3000'  → PORT=''이면 '3000'       │
// │   const port = process.env.PORT ?? '3000'  → PORT=''이면 '' 사용      │
// │   PORT가 빈 문자열로 설정된 케이스를 다르게 처리해야 할 때 중요.      │
// └─────────────────────────────────────────────────────────────────────────┘

// parseInt로 문자열을 10진수 정수로 변환. _retryCount가 없으면 ?? '0' → '0' 파싱 → 0
const retryCount = parseInt(message.fields['_retryCount'] ?? '0', 10);

// process.env['PORT']: 환경 변수 PORT. 없으면 undefined → ?? '3000' → '3000'
const port = process.env['PORT'] ?? '3000';

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ ?. — Optional Chaining (옵셔널 체이닝)                                  │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   중간 경로의 값이 null/undefined이면 에러 없이 undefined를 반환하는  │
// │   체이닝 연산자. 깊은 객체에서 안전하게 값을 꺼낼 때 사용한다.        │
// │                                                                         │
// │ [JS와의 차이]                                                           │
// │   JS에도 있다 (ES2020). TS에서는 타입 정보와 함께 더 안전하게 쓴다.  │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   order?.user?.address?.city                                            │
// │   ①    ②     ③         ④                                              │
// │   ?: 각 단계에서 값이 null/undefined이면 전체를 undefined로 단축       │
// │   → order가 없으면 undefined (user, address, city 접근 시도 안 함)    │
// │   → order.user가 없으면 undefined (address, city 접근 시도 안 함)     │
// │                                                                         │
// │ [주의사항]                                                              │
// │   ?. 없이 obj.a.b.c 하면 a가 undefined일 때 "Cannot read property 'b'  │
// │   of undefined" 런타임 에러가 난다.                                     │
// └─────────────────────────────────────────────────────────────────────────┘

interface Order { user?: { address?: { city?: string } } }
const order: Order = {};  // user가 없는 빈 객체

// order.user가 undefined이므로 ?. 체인이 여기서 멈추고 undefined 반환
// ?? '서울': undefined이면 '서울'로 대체
const city = order?.user?.address?.city ?? '서울';  // undefined 체인 끊김 → 기본값

// || vs ?? 차이 — 실제로 헷갈리는 부분
const inputA = '';
console.log('|| 결과:', inputA || '기본값');   // '기본값': 빈 문자열은 falsy라서 오른쪽 선택
console.log('?? 결과:', inputA ?? '기본값');   // '': 빈 문자열은 null/undefined 아니므로 그대로

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 3. spread / rest 연산자 (...)                                           │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   ... (점 세 개)는 문맥에 따라 두 가지 역할을 한다:                    │
// │   - Spread (전개): 배열/객체를 펼쳐서 넣는다                           │
// │   - Rest (나머지): 나머지 값들을 묶어서 배열로 만든다                  │
// │                                                                         │
// │ [배열 spread: 복사 + 합치기]                                            │
// │   [...arr1, 4, 5] → arr1의 원소를 펼친 뒤 4, 5를 뒤에 추가한 새 배열 │
// │   원본 arr1은 변경되지 않는다.                                          │
// │                                                                         │
// │ [객체 spread: 복사 + 덮어쓰기]                                         │
// │   { ...base, toAddress: '0xBBB' }                                       │
// │   → base의 모든 필드를 복사하되, toAddress는 '0xBBB'로 덮어씀.        │
// │   나중에 오는 값이 이전 값을 덮어쓴다. 순서 중요.                      │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   불변성(Immutability) 유지에 핵심. 원본을 바꾸지 않고 일부만 변경된  │
// │   새 객체를 만들 때 사용. 강의 코드에서 설정 오버라이드, 상태 업데이트│
// │   등에 자주 쓰인다.                                                     │
// │                                                                         │
// │ [주의사항]                                                              │
// │   spread는 얕은 복사(shallow copy)다. 중첩 객체는 복사되지 않고        │
// │   참조가 공유된다.                                                       │
// └─────────────────────────────────────────────────────────────────────────┘

// 배열 spread
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];  // [1, 2, 3, 4, 5]. arr1 변경 없음.

// 객체 spread — 복사 + 덮어쓰기
const base = { chainId: 1, toAddress: '0xAAA', tokenId: 'token-1' };
// base의 모든 필드 복사 후 toAddress만 '0xBBB'로 교체
// { chainId: 1, toAddress: '0xBBB', tokenId: 'token-1' }
const override = { ...base, toAddress: '0xBBB' };   // toAddress만 교체

// rest 매개변수: 나머지 인수를 배열로 묶어 받는다
// ...args: unknown[] → 몇 개든 상관없이 배열로 받음
function logAll(label: string, ...args: unknown[]): void {
  console.log(label, ...args);  // args를 다시 spread해서 console.log에 넘김
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 4. 템플릿 리터럴                                                        │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   백틱(``)으로 감싸는 문자열. ${표현식} 으로 변수나 표현식을 삽입.    │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   강의 코드에서 Redis 스트림 키, 멱등성 키 등의 문자열을 조합할 때     │
// │   문자열 연결(+)보다 가독성이 좋다.                                     │
// │   'nft:events:chain-' + chainId 보다 `nft:events:chain-${chainId}` 가 │
// │   한눈에 보인다.                                                        │
// └─────────────────────────────────────────────────────────────────────────┘

const streamKey = `nft:events:chain-${1}`;                   // 'nft:events:chain-1'
const idempotencyKey = `mint:${toAddress}:${tokenId}`;       // 'mint:0xAAA:token-1'

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 5. as const — 문자열 리터럴 고정                                        │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   값을 가장 좁은 타입(리터럴 타입)으로 고정하는 타입 단언.             │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   as const 없이 const CHAIN_TYPE = 'EVM'을 쓰면 TS는 타입을           │
// │   string으로 추론한다. 어떤 string이든 될 수 있다는 의미.              │
// │   as const를 붙이면 타입이 'EVM'(문자열 리터럴)으로 고정된다.         │
// │   이 변수는 'EVM'만 될 수 있고, 다른 값을 넣으면 에러가 난다.         │
// │                                                                         │
// │ [객체에 as const 적용]                                                  │
// │   객체의 모든 필드가 readonly + 리터럴 타입이 된다.                    │
// │   ROLES.MINTER의 타입이 string이 아닌 'MINTER_ROLE'이 된다.           │
// │   이를 이용해 typeof ROLES[keyof typeof ROLES] 로 값들의 union 타입을  │
// │   자동으로 만들 수 있다.                                                │
// │                                                                         │
// │ [문법 해부: typeof ROLES[keyof typeof ROLES]]                           │
// │   keyof typeof ROLES → 'MINTER' | 'PAUSER' | 'ADMIN' (키들의 union)   │
// │   typeof ROLES[...] → 해당 키의 값 타입                                │
// │   → 'MINTER_ROLE' | 'PAUSER_ROLE' | 'DEFAULT_ADMIN_ROLE'              │
// │   객체의 값들로 union 타입을 만드는 관용 패턴이다.                     │
// └─────────────────────────────────────────────────────────────────────────┘

const CHAIN_TYPE = 'EVM' as const;          // 타입: 'EVM' (string이 아닌 리터럴 타입)
// CHAIN_TYPE = 'XRPL';                     // 에러: 'EVM'으로 고정됨

const ROLES = {
  MINTER: 'MINTER_ROLE',
  PAUSER: 'PAUSER_ROLE',
  ADMIN:  'DEFAULT_ADMIN_ROLE',
} as const;
// as const 없으면: ROLES.MINTER의 타입 = string (느슨함)
// as const 있으면: ROLES.MINTER의 타입 = 'MINTER_ROLE' (정확함)
// ROLES.MINTER = 'x';                      // 에러: readonly

// ROLES의 값들로 만든 union 타입: 'MINTER_ROLE' | 'PAUSER_ROLE' | 'DEFAULT_ADMIN_ROLE'
type Role = typeof ROLES[keyof typeof ROLES];

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 6. 타입 단언: as 와 !                                                   │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   TypeScript가 추론한 타입을 개발자가 직접 "이 타입이다"라고 덮어쓰는 │
// │   것. 컴파일러를 설득하는 도구.                                         │
// │                                                                         │
// │ [as — 타입 단언]                                                        │
// │   "나는 이 값이 이 타입이라는 것을 알고 있다. 믿어라."                │
// │   컴파일러가 모르지만 개발자가 확신할 때 사용한다.                      │
// │                                                                         │
// │ [! — Non-null 단언]                                                     │
// │   값 뒤에 ! 를 붙이면 "이 값은 null/undefined가 절대 아니다"라고 단언. │
// │   Map.get()은 타입상 T | undefined를 반환하지만, 키가 확실히 있다는    │
// │   것을 알 때 사용한다.                                                  │
// │                                                                         │
// │ [주의사항]                                                              │
// │   as와 !는 런타임 체크가 없다. 잘못 사용하면 런타임 에러가 날 수 있다.│
// │   실제로 타입이 맞는지 확인할 수 없는 상황에서는 타입 가드(ch08)를    │
// │   쓰는 것이 더 안전하다.                                                │
// │   "as any"는 특히 위험하다 — 모든 타입 안전성을 포기하는 것.          │
// └─────────────────────────────────────────────────────────────────────────┘

const raw: unknown = '{"tokenId":"token-1"}';

// raw는 unknown → JSON.parse 호출 불가
// raw as string: "raw는 string이다"라고 단언 → JSON.parse 호출 가능
// JSON.parse(...) as { tokenId: string }: 파싱 결과가 이 형태라고 단언
const parsed = JSON.parse(raw as string) as { tokenId: string };
console.log('tokenId:', parsed.tokenId);

const map = new Map<string, number>();
map.set('0xAAA', 1000);

// map.get('0xAAA')의 타입: number | undefined
// !: "이 값은 undefined가 아니다"라고 단언. 반드시 키가 존재한다는 확신이 있을 때만 사용.
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
logAll('로그:', 'a', 'b', 'c');  // logAll('로그:', ...'a','b','c') 로 전달됨

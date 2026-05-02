// ─── CH03: 인터페이스와 타입 ─────────────────────────────────────────────────

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 1. 기본 인터페이스 (interface)                                          │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   객체의 "형태(shape)"를 정의하는 계약서. 어떤 키가 있어야 하는지,    │
// │   각 키의 타입은 무엇인지, 선택적인지 필수인지를 선언한다.             │
// │                                                                         │
// │ [JS와의 차이]                                                           │
// │   JavaScript에는 interface가 없다. 런타임에 사라지는 TS 전용 개념.    │
// │   컴파일 후 JS 코드에서는 interface가 흔적도 없이 지워진다.            │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   interface 인터페이스명 {                                              │
// │     readonly id: string;   // readonly: 한 번 할당 후 변경 불가        │
// │     toAddress: string;     // 일반 필드: 필수, 변경 가능              │
// │     memo?: string;         // ?: 선택적 필드. 없으면 undefined        │
// │   }                                                                     │
// │                                                                         │
// │ [주의사항]                                                              │
// │   - readonly는 할당 후 변경을 막는다. 생성자에서만 값을 설정할 수 있다.│
// │   - ?와 readonly는 함께 쓸 수 있다: readonly memo?: string             │
// │   - interface 안의 구분자는 세미콜론(;)이 관례. 쉼표(,)도 허용된다.  │
// └─────────────────────────────────────────────────────────────────────────┘

interface MintRequest {
  readonly id: string;          // readonly: 할당 후 변경 불가 (실수 방지)
  readonly chainId: number;     // 체인 ID도 생성 후 바뀌면 안 되니까 readonly
  toAddress: string;            // 수신 주소: 필수, 변경 가능
  tokenId: string;              // 토큰 ID: 필수
  memo?: string;                // ?: 선택적 필드. 없어도 유효한 MintRequest
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 2. 메서드 포함 인터페이스                                               │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   데이터 필드뿐만 아니라 메서드(함수)까지 포함한 인터페이스.           │
// │   이 인터페이스를 구현하는 클래스나 객체는 반드시 이 메서드를 포함해야 │
// │   한다.                                                                 │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   Repository 패턴, Service 패턴 등 강의 코드의 핵심 설계 패턴에서     │
// │   인터페이스로 "이 서비스는 이런 기능을 제공한다"고 계약을 먼저        │
// │   정의하고, 실제 구현체는 나중에 만든다. 테스트 시 가짜 구현체(mock)  │
// │   를 넣을 수 있어서 의존성 주입과 잘 맞는다.                           │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   findById(id: string): Promise<MintRequest | null>;                   │
// │   ①        ②           ③                                              │
// │   ① 메서드 이름                                                        │
// │   ② 매개변수와 타입                                                    │
// │   ③ 반환 타입: Promise<MintRequest | null>                             │
// │      - Promise<>: 비동기 메서드                                        │
// │      - MintRequest | null: MintRequest 또는 null (못 찾으면 null)     │
// └─────────────────────────────────────────────────────────────────────────┘

interface TxRepository {
  findById(id: string): Promise<MintRequest | null>;         // 있으면 MintRequest, 없으면 null
  save(req: MintRequest): Promise<void>;                     // 저장 후 반환값 없음
  updateStatus(id: string, status: string): Promise<void>;   // 상태 업데이트
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 3. 강의 핵심 인터페이스 패턴 — EventProcessor                          │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   이벤트 처리기(EventProcessor)와 메시지(StreamMessage) 패턴.          │
// │   강의 kyobo-digital-asset-platform 코드 전반에서 가장 자주 등장하는   │
// │   구조다. 이 두 인터페이스를 이해하면 강의 코드 흐름이 보인다.         │
// │                                                                         │
// │ [왜 이 구조인가]                                                        │
// │   블록체인 이벤트(NFT_ISSUED, NFT_BURNED 등)는 스트림(Redis Streams,   │
// │   Kafka 등)에서 메시지 형태로 온다. 각 메시지는 이벤트 타입과 함께     │
// │   key-value 필드를 담고 있다. EventProcessor는 자신이 처리할 이벤트    │
// │   타입 목록을 선언하고, 메시지가 오면 process()를 호출받는다.          │
// │                                                                         │
// │ [문법 해부: Record<K, V>]                                               │
// │   Record<string, string>은 "키도 string, 값도 string인 객체" 타입.    │
// │   { [key: string]: string } 과 완전히 동일한 의미다.                   │
// │   예: { eventType: 'NFT_ISSUED', tokenId: 'token-1' }                  │
// └─────────────────────────────────────────────────────────────────────────┘

interface StreamMessage {
  id: string;                           // 메시지 고유 ID
  fields: Record<string, string>;       // Record<K,V>: key-value 객체. 이벤트 데이터 담음
}

interface EventProcessor {
  eventTypes: string[];                 // 이 processor가 처리할 이벤트 타입 목록
  process(message: StreamMessage): Promise<void>;  // 실제 처리 로직
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 4. union 타입 — 상태 머신                                              │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   A | B | C 형태로 "이 타입들 중 하나"를 의미하는 타입.               │
// │   특히 문자열 리터럴의 union으로 "허용된 값 집합"을 정의하는 패턴이   │
// │   강의 코드에서 자주 나온다.                                            │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   TxStatus = string 으로 선언하면 어떤 문자열이든 들어올 수 있다.      │
// │   union 타입으로 좁히면 'REQUESTED' | 'SUBMITTED' ... 만 허용하므로   │
// │   오타나 잘못된 상태값 삽입을 컴파일 타임에 막는다.                    │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   type TxStatus = 'REQUESTED' | 'SUBMITTED' | ...;                     │
// │   | (파이프)로 구분한다. 줄 맨 앞에 |를 두는 방식이 가독성이 좋다.    │
// │                                                                         │
// │ [주의사항]                                                              │
// │   union 타입 변수에 목록에 없는 값을 넣으면 즉시 에러가 난다.         │
// │   const status: TxStatus = 'PROCESSING'; // 에러! 목록에 없음         │
// └─────────────────────────────────────────────────────────────────────────┘

type TxStatus =
  | 'REQUESTED'   // 요청됨
  | 'SUBMITTED'   // 블록체인에 제출됨
  | 'PENDING'     // 채굴 대기중
  | 'MINED'       // 채굴 완료
  | 'CONFIRMED'   // 충분한 블록 확인 완료
  | 'FAILED';     // 실패

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 5. type vs interface                                                    │
// │                                                                         │
// │ [언제 type을 쓰고 언제 interface를 쓰는가]                             │
// │   - interface: 객체 형태(shape) 정의, 클래스가 implements 할 계약.    │
// │     나중에 선언 병합(declaration merging)으로 확장 가능.               │
// │   - type: 단순 alias, union/intersection 조합, 함수 타입 등.           │
// │     interface로 표현하기 어려운 복잡한 타입 조합에 쓴다.               │
// │                                                                         │
// │ [실용 기준]                                                             │
// │   - 객체 구조 정의 → interface                                         │
// │   - 문자열 union (상태값 등) → type                                    │
// │   - Result<T> 처럼 타입을 조합하는 경우 → type                        │
// │   - 강의 코드: 계약 정의는 interface, 상태/결과 조합은 type 패턴      │
// └─────────────────────────────────────────────────────────────────────────┘

type WalletAddress = string;           // 단순 alias: WalletAddress 타입은 그냥 string과 같다

// Result<T>: 성공 또는 실패를 나타내는 union 타입
// ok가 true면 data 필드 존재, ok가 false면 error 메시지 존재
// 이 패턴은 예외를 던지지 않고 결과를 명시적으로 반환할 때 유용하다
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 6. Record로 상태 전이 맵 정의                                           │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   Record<K, V>를 이용해 "각 상태에서 어떤 상태로 전이할 수 있는지"를  │
// │   명시적으로 정의한 상태 머신 맵.                                       │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   강의 코드에서 트랜잭션 상태 관리는 핵심 비즈니스 로직이다.           │
// │   CONFIRMED → REQUESTED 같은 불법 전이를 코드로 방지한다.             │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   Record<TxStatus, TxStatus[]>                                          │
// │   → "TxStatus 값을 키로, TxStatus 배열을 값으로 갖는 객체"            │
// │   → TxStatus의 모든 값(REQUESTED, SUBMITTED...)이 키로 존재해야 함.   │
// │      하나라도 빠지면 컴파일 에러 → 빠뜨린 상태 방지                   │
// └─────────────────────────────────────────────────────────────────────────┘

// VALID_TRANSITIONS: 각 상태에서 다음으로 갈 수 있는 상태들
// Record<TxStatus, TxStatus[]> 덕분에 TxStatus의 모든 키를 채워야 한다
// → CONFIRMED나 FAILED를 빠뜨리면 컴파일 에러
const VALID_TRANSITIONS: Record<TxStatus, TxStatus[]> = {
  REQUESTED: ['SUBMITTED', 'FAILED'],    // 요청 후 → 제출 또는 실패
  SUBMITTED: ['PENDING', 'FAILED'],      // 제출 후 → 채굴 대기 또는 실패
  PENDING:   ['MINED', 'FAILED'],        // 채굴 대기 → 채굴 완료 또는 실패
  MINED:     ['CONFIRMED', 'FAILED'],    // 채굴 완료 → 확인 완료 또는 실패
  CONFIRMED: [],                          // 최종 확인: 더 이상 전이 없음
  FAILED:    [],                          // 실패: 재시도는 별도 로직
};

// from 상태에서 to 상태로 전이 가능한지 확인하는 함수
// includes(): 배열 안에 해당 값이 있으면 true
function canTransition(from: TxStatus, to: TxStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 7. 인터페이스 구현체 (객체 리터럴로 구현)                              │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   interface를 클래스 없이 객체 리터럴로 구현하는 패턴.                 │
// │   클래스를 만들기엔 너무 단순한 경우, 또는 테스트용 mock을 빠르게      │
// │   만들 때 사용한다.                                                     │
// │                                                                         │
// │ [주의사항]                                                              │
// │   객체에 EventProcessor에 없는 필드를 추가하면 에러가 난다.           │
// │   interface와 정확히 일치하는 구조여야 한다.                           │
// └─────────────────────────────────────────────────────────────────────────┘

// mockProcessor: EventProcessor 인터페이스를 만족하는 객체 리터럴
// eventTypes와 process 메서드 둘 다 있어야 컴파일 통과
const mockProcessor: EventProcessor = {
  eventTypes: ['NFT_ISSUED', 'NFT_BURNED'],
  async process(message) {
    // message.fields는 Record<string, string>이므로 ['키'] 로 접근
    const eventType = message.fields['eventType'] ?? '';  // undefined면 빈 문자열
    console.log(`처리 중: ${eventType}, msgId: ${message.id}`);
  },
};

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 8. Map<K, V> — 타입 안전한 key-value 저장소                           │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   JavaScript의 Map 객체에 TypeScript 제네릭 타입을 붙인 것.            │
// │   일반 객체({})와 달리 키 타입이 자유롭고, 삽입 순서가 보장되며,      │
// │   size, has, delete 등 명시적인 API를 제공한다.                        │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   강의 코드에서 idempotency 키 관리, 정책 캐시, 처리기 등록 등에       │
// │   Map이 광범위하게 사용된다. 일반 객체보다 동적 키 추가/삭제가 명확.  │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   new Map<string, bigint>()                                             │
// │       ①     ②      ③                                                  │
// │   ① Map: 키-값 저장소                                                  │
// │   ② string: 키의 타입                                                  │
// │   ③ bigint: 값의 타입                                                  │
// │                                                                         │
// │ [주의사항]                                                              │
// │   - get()의 반환 타입은 "타입 | undefined"다. 키가 없으면 undefined   │
// │     → ?? 로 기본값을 설정하거나 has()로 먼저 확인해야 한다.           │
// │   - 일반 객체({}): 키가 string/symbol만 가능                          │
// │     Map: 키가 어떤 타입이든 가능 (숫자, 객체도 키 가능)               │
// └─────────────────────────────────────────────────────────────────────────┘

const balanceMap = new Map<string, bigint>();          // key: string, value: bigint

balanceMap.set('0xAAA', 1000n);    // 키-값 쌍 추가
balanceMap.set('0xBBB', 500n);

const bal = balanceMap.get('0xAAA');                   // bigint | undefined (없을 수도 있음)
const safe = balanceMap.get('0xAAA') ?? 0n;            // undefined면 0n으로 대체

console.log('has 0xAAA:', balanceMap.has('0xAAA'));    // true: 키 존재 여부 확인
console.log('has 0xCCC:', balanceMap.has('0xCCC'));    // false

balanceMap.delete('0xBBB');   // 키-값 쌍 제거

// 순회: for...of로 [키, 값] 구조 분해하여 반복
// Map은 삽입 순서를 보장하므로 추가한 순서대로 나온다
for (const [addr, amount] of balanceMap) {
  console.log(`${addr}: ${amount}`);
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 강의 패턴: IdempotencyGuard                                             │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   동일한 키로 중복 실행을 차단하는 패턴. 블록체인 트랜잭션에서         │
// │   네트워크 재시도로 인한 이중 실행을 막는 데 필수적이다.              │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   "mint:token-1" 같은 고유 키로 실행 여부를 기록해 두고,              │
// │   같은 키가 다시 오면 차단한다. 이를 idempotency(멱등성)라고 한다:    │
// │   같은 작업을 몇 번 해도 결과가 한 번 한 것과 같아야 한다는 원칙.    │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   private readonly store = new Map<string, boolean>();                  │
// │   → private: 클래스 외부에서 접근 불가                                │
// │   → readonly: store 변수 자체는 재할당 불가. Map 내용은 변경 가능.   │
// │   → Map<string, boolean>: 키는 string, 값은 boolean(실행 여부)        │
// └─────────────────────────────────────────────────────────────────────────┘

class IdempotencyGuard {
  // store: 실행된 키를 기억하는 Map. 클래스 외부에서는 접근 불가
  private readonly store = new Map<string, boolean>();

  // run: key가 이미 있으면 fn 실행을 차단. 없으면 기록하고 실행.
  // fn: () => Promise<void> → 매개변수 없이 Promise를 반환하는 함수
  async run(key: string, fn: () => Promise<void>): Promise<void> {
    if (this.store.has(key)) {
      console.log(`중복 실행 차단: ${key}`);
      return;  // 여기서 함수를 종료. fn은 호출되지 않는다.
    }
    this.store.set(key, true);  // 실행 전에 먼저 기록 (재진입 방지)
    await fn();                  // 실제 작업 실행
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

  // processor.eventTypes 배열에 메시지 이벤트 타입이 있을 때만 process 호출
  // 이 패턴이 강의 코드 이벤트 라우팅의 핵심이다
  if (mockProcessor.eventTypes.includes(msg.fields['eventType'])) {
    await mockProcessor.process(msg);
  }

  // Result 타입 활용
  // ok: true이면 TypeScript가 data 필드 존재를 보장한다 (타입 좁히기)
  const result: Result<MintRequest> = {
    ok: true,
    data: { id: 'req-001', chainId: 1, toAddress: '0xAAA', tokenId: 'token-1' },
  };

  if (result.ok) {
    console.log('mint request id:', result.data.id);  // data 접근 안전
  }

  // Map
  console.log('balanceMap get 0xAAA:', safe);

  // IdempotencyGuard: 두 번째 호출은 차단된다
  const guard = new IdempotencyGuard();
  await guard.run('mint:token-1', async () => { console.log('실행됨'); });
  await guard.run('mint:token-1', async () => { console.log('이건 안 실행됨'); });
}

main();

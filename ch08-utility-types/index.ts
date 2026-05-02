// ─── CH08: 유틸리티 타입 + 타입 가드 ───────────────────────────────────────
//
// 유틸리티 타입 = TS 내장 타입 변환 도구
// 강의 코드에서 자주 등장하는 것만 추린다

// ─ 기본 타입 정의 ─
// 아래 예제들의 기반이 되는 MintRequest. 각 유틸리티 타입이 이를 어떻게
// 변환하는지 비교하면서 보면 이해가 빠르다.
interface MintRequest {
  id: string;
  toAddress: string;
  tokenId: string;
  chainId: number;
  memo: string;
  createdAt: Date;
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 1. Partial<T> — 모든 필드를 optional로                                 │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   T의 모든 필드를 선택적(?)으로 만든 새 타입을 반환한다.               │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   업데이트(PATCH) API에서 사용자가 변경하고 싶은 필드만 보낼 때.       │
// │   MintRequest 전체가 아니라 toAddress 하나만 바꾸고 싶을 때,          │
// │   Partial<MintRequest>로 선언하면 나머지는 없어도 된다.                │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   Partial<MintRequest>                                                  │
// │   → { id?: string; toAddress?: string; tokenId?: string; ... }         │
// │   → 모든 필드에 ? 가 붙는다                                            │
// │                                                                         │
// │ [주의사항]                                                              │
// │   Partial은 얕다(shallow). 중첩 객체 안의 필드는 optional이 되지 않는다│
// │   깊은 Partial은 라이브러리(deep-partial 등)가 필요하다.              │
// └─────────────────────────────────────────────────────────────────────────┘

// Partial<MintRequest>: 모든 필드가 optional
// { id?: string; toAddress?: string; tokenId?: string; chainId?: number; ... }
type MintRequestUpdate = Partial<MintRequest>;

// patch에는 변경하고 싶은 필드만 넘기면 된다. 나머지는 없어도 컴파일 통과.
async function updateRequest(id: string, patch: Partial<MintRequest>): Promise<void> {
  console.log(`업데이트: id=${id}, patch=`, patch);
  // patch에는 변경할 필드만 있으면 됨
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 2. Required<T> — 모든 optional을 필수로                                │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   Partial의 반대. T의 모든 필드에서 ?를 제거해 전부 필수로 만든다.    │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   설정 객체를 기본값 적용 후 완전한 상태로 다루고 싶을 때.             │
// │   Config는 모두 optional이지만, 기본값 채운 후에는 모두 존재한다고     │
// │   보장하고 싶을 때 Required<Config>로 타입을 표현한다.                 │
// └─────────────────────────────────────────────────────────────────────────┘

interface Config {
  host?: string;
  port?: number;
  timeout?: number;
}

// Required<Config>: 모든 필드의 ? 제거
// { host: string; port: number; timeout: number }
type FullConfig = Required<Config>;

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 3. Pick<T, K> — 필드 선택                                               │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   T에서 K로 지정한 필드만 골라서 새 타입을 만든다.                     │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   API 응답에서 일부 필드만 보여주거나, 함수에서 필요한 필드만 받고     │
// │   싶을 때. MintRequest 전체 대신 요약 정보만 담은 타입을 만들 때.     │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   Pick<MintRequest, 'id' | 'tokenId' | 'toAddress'>                    │
// │        ①            ②                                                  │
// │   ① 원본 타입                                                           │
// │   ② 선택할 필드 이름 목록 (union string literal)                       │
// │   → { id: string; tokenId: string; toAddress: string }                 │
// │                                                                         │
// │ [Omit과의 차이]                                                         │
// │   필드 수가 많을 때는 필요한 것만 고르는 Pick보다                      │
// │   제거할 것만 고르는 Omit이 더 간결할 수 있다.                         │
// └─────────────────────────────────────────────────────────────────────────┘

// MintRequest에서 id, tokenId, toAddress 세 필드만 골라서 새 타입 생성
// 결과: { id: string; tokenId: string; toAddress: string }
type MintSummary = Pick<MintRequest, 'id' | 'tokenId' | 'toAddress'>;

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 4. Omit<T, K> — 필드 제거                                               │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   Pick의 반대. T에서 K로 지정한 필드를 제거한 나머지로 새 타입을 만든다│
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   생성(CREATE) 요청 시 id와 createdAt은 서버가 생성하므로 클라이언트가 │
// │   보내면 안 된다. Omit으로 이 두 필드를 제거한 타입을 요청 타입으로.  │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   Omit<MintRequest, 'id' | 'createdAt'>                                 │
// │   → MintRequest에서 id와 createdAt을 뺀 나머지                         │
// │   → { toAddress: string; tokenId: string; chainId: number; memo: string}│
// │                                                                         │
// │ [실전 패턴]                                                             │
// │   createRequest 함수: Omit 타입의 데이터를 받아 id와 createdAt을 추가해│
// │   완전한 MintRequest를 반환한다. DB INSERT 시 자주 쓰이는 패턴.        │
// └─────────────────────────────────────────────────────────────────────────┘

// id와 createdAt을 제외한 나머지 필드만으로 구성된 타입
// 결과: { toAddress: string; tokenId: string; chainId: number; memo: string }
type MintRequestCreate = Omit<MintRequest, 'id' | 'createdAt'>;

// data: MintRequestCreate → 사용자가 보내는 필드 (id, createdAt 없음)
// 반환: MintRequest → 서버가 id, createdAt을 추가한 완전한 객체
function createRequest(data: MintRequestCreate): MintRequest {
  return {
    id: `req-${Date.now()}`,    // 서버가 생성하는 고유 ID
    createdAt: new Date(),       // 서버가 기록하는 생성 시각
    ...data,                     // 나머지 필드는 그대로 전개
  };
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 5. Record<K, V> — 심화                                                  │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   K 타입의 키와 V 타입의 값을 갖는 객체 타입.                          │
// │   { [key in K]: V } 와 동일하다.                                        │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   특정 집합(union 타입)의 모든 값을 키로 갖는 완전한 맵을 만들 때.    │
// │   Record<TxStatus, TxStatus[]>는 TxStatus의 모든 상태가 키로 있어야 함 │
// │   → 하나라도 빠지면 컴파일 에러 → 상태 빠뜨림 방지 효과              │
// │                                                                         │
// │ [일반 객체 {}와의 차이]                                                 │
// │   {}는 키 타입이 암묵적이고 완전성을 강제하지 않는다.                  │
// │   Record<TxStatus, ...>는 TxStatus의 모든 값을 반드시 키로 포함해야   │
// │   컴파일이 통과된다.                                                    │
// └─────────────────────────────────────────────────────────────────────────┘

type TxStatus = 'REQUESTED' | 'SUBMITTED' | 'PENDING' | 'CONFIRMED' | 'FAILED';

// Record<TxStatus, TxStatus[]>: TxStatus의 5가지 값이 모두 키여야 함
// 하나라도 빠지면 에러 → 누락된 상태 전이 방지
const TRANSITIONS: Record<TxStatus, TxStatus[]> = {
  REQUESTED: ['SUBMITTED', 'FAILED'],
  SUBMITTED: ['PENDING', 'FAILED'],
  PENDING:   ['CONFIRMED', 'FAILED'],
  CONFIRMED: [],
  FAILED:    [],
};

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 6. ReturnType<T> — 함수 리턴 타입 추출                                  │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   함수의 반환 타입을 추출하는 유틸리티.                                 │
// │   함수 정의를 바꾸면 ReturnType도 자동으로 따라 바뀐다.               │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   함수 반환 타입을 별도로 interface를 만들지 않고 함수 정의에서         │
// │   직접 추출할 때. 함수가 변경되면 타입도 자동 갱신되어 동기화 문제가   │
// │   없다.                                                                 │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   ReturnType<typeof getTokenInfo>                                        │
// │             ①                                                           │
// │   ① typeof getTokenInfo: 함수 자체의 타입. 타입 공간에서 함수를 참조  │
// │     할 때 typeof를 쓴다. ReturnType<getTokenInfo>는 에러.              │
// └─────────────────────────────────────────────────────────────────────────┘

function getTokenInfo() {
  return { tokenId: 'token-1', supply: 1000, paused: false };
}

// getTokenInfo의 반환 타입을 직접 추출
// 결과: { tokenId: string; supply: number; paused: boolean }
// getTokenInfo의 반환값이 바뀌면 TokenInfo 타입도 자동으로 바뀐다
type TokenInfo = ReturnType<typeof getTokenInfo>;

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 7. Awaited<T> — Promise 안의 타입 추출                                  │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   Promise<T>에서 T를 추출한다. 중첩된 Promise도 재귀적으로 벗긴다.    │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   async 함수의 반환값 타입을 Promise 없이 얻고 싶을 때.                │
// │   ReturnType만 쓰면 Promise<{...}>가 되는데, Awaited를 함께 쓰면      │
// │   Promise를 벗긴 실제 값 타입을 얻는다.                                │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   Awaited<ReturnType<typeof fetchUser>>                                  │
// │   ①       ②                                                            │
// │   ② ReturnType<typeof fetchUser> → Promise<{ id: string; name: string }>│
// │   ① Awaited<Promise<...>> → { id: string; name: string }              │
// └─────────────────────────────────────────────────────────────────────────┘

async function fetchUser() {
  return { id: 'user-001', name: 'Sharon' };
}

// ReturnType만 쓰면: Promise<{ id: string; name: string }>
// Awaited 추가하면: { id: string; name: string }  (Promise 벗겨냄)
type User = Awaited<ReturnType<typeof fetchUser>>;

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 8. 타입 가드 — 타입 좁히기 (Type Narrowing)                            │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   런타임에 값의 타입을 확인해서 TypeScript가 해당 블록 안에서 구체적인 │
// │   타입으로 인식하게 만드는 것.                                          │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   catch 블록의 err는 unknown 타입이라 바로 .message에 접근할 수 없다. │
// │   instanceof로 Error임을 확인하면 그 블록 안에서 err.message 사용 가능.│
// │   이것이 "타입 좁히기(narrowing)"다.                                   │
// │                                                                         │
// │ [3가지 타입 가드 방법]                                                  │
// │   ① instanceof: 클래스 인스턴스 여부 확인                              │
// │   ② typeof: 원시 타입(string, number, boolean 등) 확인                │
// │   ③ 사용자 정의 타입 가드(is 키워드): 커스텀 검사 함수               │
// └─────────────────────────────────────────────────────────────────────────┘

// instanceof 가드 (강의 M3_S17 패턴)
class DeferredError extends Error {
  constructor(msg: string) { super(msg); this.name = 'DeferredError'; }
}

// err: unknown → instanceof로 타입 좁히기
// 순서 중요: 더 구체적인 타입(DeferredError)을 먼저 체크
function handleError(err: unknown): void {
  if (err instanceof DeferredError) {
    // 이 블록 안에서 err는 DeferredError 타입으로 좁혀짐
    // err.message, err.name 등 DeferredError/Error의 멤버 사용 가능
    console.log('Deferred → 큐로:', err.message);
    return;
  }
  if (err instanceof Error) {
    // DeferredError가 아닌 일반 Error
    // DeferredError도 Error를 상속하므로 위에서 먼저 걸러야 함
    console.log('일반 에러:', err.message);
    return;
  }
  // Error도 아닌 경우 (문자열, 숫자 등이 throw 된 경우)
  console.log('알 수 없는 에러:', String(err));
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ typeof 가드                                                             │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   typeof 연산자로 원시 타입을 확인해서 타입을 좁힌다.                  │
// │   'string' | 'number' | 'boolean' | 'object' | 'undefined' 등을 반환.  │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   if (typeof input === 'number') { ... }                                │
// │   이 if 블록 안에서 input은 number 타입으로 좁혀진다.                 │
// │   input.toFixed() 같은 number 메서드 사용 가능.                        │
// └─────────────────────────────────────────────────────────────────────────┘

function formatInput(input: string | number): string {
  if (typeof input === 'number') {
    // 이 블록: input이 number로 좁혀짐 → toFixed() 사용 가능
    return `숫자: ${input.toFixed(2)}`;
  }
  // 여기서는 number가 아니므로 string으로 자동 좁혀짐 → toUpperCase() 사용 가능
  return `문자열: ${input.toUpperCase()}`;
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 사용자 정의 타입 가드 (is 키워드)                                       │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   instanceof나 typeof로 처리할 수 없는 복잡한 타입 확인을 함수로       │
// │   만드는 방법. 반환 타입에 "val is 타입"을 쓴다.                       │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   function isStreamMessage(val: unknown): val is StreamMessage          │
// │                                           ①                            │
// │   ① val is StreamMessage: 이 함수가 true를 반환하면 TypeScript가       │
// │      val을 StreamMessage 타입으로 간주하도록 알려주는 타입 술어.       │
// │      일반 boolean 반환과 달리 타입 좁히기 효과가 있다.                 │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   외부에서 오는 데이터(API 응답, 이벤트 메시지 등)의 형태를 검사할 때. │
// │   런타임에 실제로 구조를 확인하면서 타입 안전성도 얻을 수 있다.        │
// └─────────────────────────────────────────────────────────────────────────┘

interface StreamMessage {
  id: string;
  fields: Record<string, string>;
}

// val is StreamMessage: 이 함수가 true를 반환하면 val을 StreamMessage로 간주
function isStreamMessage(val: unknown): val is StreamMessage {
  return (
    typeof val === 'object' &&   // null이 아닌 객체인지
    val !== null &&              // null 명시적 제외 (typeof null === 'object' 이므로)
    'id' in val &&               // id 필드가 있는지
    'fields' in val              // fields 필드가 있는지
  );
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 9. 실전 패턴 — 에러 안전 추출                                           │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   catch(err)의 err: unknown을 항상 Error 타입으로 변환하는 헬퍼.       │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   catch 블록마다 "err instanceof Error ? err : new Error(String(err))" │
// │   를 반복하는 대신 이 함수 하나로 통일한다.                             │
// │   강의 코드에서 에러 처리 유틸리티로 자주 등장한다.                    │
// └─────────────────────────────────────────────────────────────────────────┘

// toError: unknown 타입의 에러를 Error 타입으로 안전하게 변환
// throw할 수 있는 값은 어떤 타입이든 가능하므로 (throw 42; 도 유효)
// catch 블록에서 항상 이 함수를 통해 Error로 통일하면 .message 접근이 안전하다
function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  return new Error(String(err));
  // catch (err) 블록에서 err는 unknown → 이렇게 변환
}

// ─── 실행 확인 ───────────────────────────────────────────────────────────────
async function main() {
  console.log('=== CH08 유틸리티 타입 + 타입 가드 ===');

  // Partial: 일부 필드만 업데이트
  await updateRequest('req-001', { toAddress: '0xBBB', memo: '수정됨' });
  // chainId, tokenId, id, createdAt은 없어도 됨

  // Omit + createRequest: id, createdAt 없이 생성, 서버가 추가해 반환
  const newReq = createRequest({ toAddress: '0xCCC', tokenId: 'token-5', chainId: 1, memo: '' });
  console.log('newReq:', newReq);

  // Record 상태 전이
  const next = TRANSITIONS['SUBMITTED'];
  console.log('SUBMITTED → 가능한 다음 상태:', next);  // ['PENDING', 'FAILED']

  // instanceof 타입 가드: 에러 종류별 분기
  handleError(new DeferredError('나중에 처리'));  // Deferred 블록
  handleError(new Error('일반 오류'));            // Error 블록
  handleError('문자열 에러');                     // 알 수 없는 에러 블록

  // typeof 타입 가드
  console.log('formatInput(42.567):', formatInput(42.567));
  console.log('formatInput("hello"):', formatInput('hello'));

  // 사용자 정의 타입 가드 (is 키워드)
  const rawData: unknown = { id: 'msg-001', fields: { eventType: 'NFT_ISSUED' } };
  if (isStreamMessage(rawData)) {
    // isStreamMessage가 true를 반환했으므로 이 블록에서 rawData는 StreamMessage 타입
    // rawData.fields['eventType'] 접근이 타입 안전하게 가능
    console.log('StreamMessage 확인됨:', rawData.fields['eventType']);
  }

  // Awaited: async 함수의 실제 반환값 타입으로 변수 선언
  // User = { id: string; name: string } (Promise 없이 실제 값 타입)
  const user: User = await fetchUser();
  console.log('user:', user);
}

main();

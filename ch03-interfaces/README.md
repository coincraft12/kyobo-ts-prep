# CH03 — 인터페이스와 타입

## 핵심 한 줄
> interface = "이 객체는 이런 형태여야 한다"는 약속. 런타임에는 사라지고 컴파일 시점에만 존재한다.

---

## 1. interface 기본

### 코드

```typescript
interface MintRequest {
  id: string;
  toAddress: string;
  tokenId: string;
  memo?: string;       // ?: 선택적 필드 — 없어도 됨
}
```

### 왜 이렇게 쓰는가

TypeScript에서 `interface`는 "이 변수에 넣을 수 있는 객체가 갖춰야 할 조건"을 명시하는 도구다.  
`MintRequest`라고 이름 붙인 순간, 이 이름을 타입으로 쓰는 모든 곳에서 컴파일러가 조건을 자동으로 검사해준다.

런타임(실제 실행 시점)에는 interface가 완전히 사라진다. 즉, interface는 코드가 실행될 때 아무런 역할을 하지 않는다. 오직 코드를 작성하는 시점(컴파일 시점)에만 "이 객체 맞아?" 하고 검사하는 용도다.

### 단계별 분해

```typescript
// 1단계: interface 키워드로 시작. 이름은 관례적으로 대문자로 시작
interface MintRequest {

  // 2단계: 필드명: 타입 형식으로 "이 필드가 있어야 한다"는 조건을 나열
  id: string;          // id 필드는 string이어야 한다
  toAddress: string;   // toAddress 필드는 string이어야 한다
  tokenId: string;     // tokenId 필드는 string이어야 한다

  // 3단계: ? 가 붙으면 "선택적" — 없어도 에러 아님
  memo?: string;       // memo는 있으면 string, 없어도 됨
}
```

### 사용 예시: 조건을 만족하는 객체

```typescript
const req: MintRequest = {
  id: 'req-001',
  toAddress: '0xAAA',
  tokenId: 'token-1',
  // memo 없어도 OK — ?가 붙었으니까
};
```

### 사용 예시: 조건을 만족하지 않는 객체 → 에러

```typescript
const req: MintRequest = {
  id: 'req-001',
  // toAddress 빠짐 → 에러
  // 에러 메시지: Property 'toAddress' is missing in type ...
  tokenId: 'token-1',
};
```

> **처음 보면 낯선 부분**: interface는 "클래스를 만드는 도구"가 아니다. 그냥 객체의 형태를 설명하는 계약서다. `{}` 중괄호 안에 필드와 타입만 적고, 실제 값은 없다.

---

## 2. readonly — 필드 변경 금지

### 코드

```typescript
interface MintRequest {
  readonly id: string;    // 할당 후 변경 불가
  toAddress: string;
}

const req: MintRequest = { id: 'req-001', toAddress: '0xAAA' };
req.toAddress = '0xBBB';  // OK — readonly가 없으므로 변경 가능
req.id = 'req-002';       // 에러: Cannot assign to 'id' because it is a read-only property
```

### 왜 쓰는가

`id`처럼 처음 정해지면 절대 바뀌면 안 되는 값에 붙인다. 누군가 실수로 `req.id = '다른값'`을 써도 컴파일러가 즉시 잡아준다.

비유로 이해하기: `readonly`는 계약서에 도장 찍은 것과 같다. 계약서를 읽는 것(get)은 언제든 가능하지만, 내용을 고치는 것(set)은 불가능하다.

### 실수하기 쉬운 부분

`readonly`는 interface 또는 class의 필드에 붙이는 것이고, `const`는 변수에 붙이는 것이다. 헷갈리기 쉽다.

```typescript
const req = { id: 'req-001' };
req = { id: 'req-002' };  // 에러: const 변수 자체를 교체 불가
req.id = 'req-002';       // OK: const는 내부 필드 변경은 막지 않는다!

interface Req { readonly id: string; }
const req: Req = { id: 'req-001' };
req.id = 'req-002';       // 에러: readonly가 필드 변경을 막는다
```

---

## 3. 메서드 시그니처

### 코드

```typescript
interface TxRepository {
  findById(id: string): Promise<MintRequest | null>;
  save(req: MintRequest): Promise<void>;
}
```

### 왜 이렇게 쓰는가

interface에 메서드를 선언하면 "이 interface를 따르는 클래스는 이 메서드를 반드시 구현해야 한다"는 약속이 된다. 구현 내용(함수 본문)은 없고, 입력과 출력의 형태만 적는다.

### 단계별 분해

```typescript
interface TxRepository {

  // findById 라는 이름의 메서드
  //   매개변수: id — string 타입
  //   반환값:   Promise<MintRequest | null>
  //             = 나중에(비동기) MintRequest 또는 null을 돌려줌
  findById(id: string): Promise<MintRequest | null>;

  // save 라는 이름의 메서드
  //   매개변수: req — MintRequest 타입 객체
  //   반환값:   Promise<void>
  //             = 나중에(비동기) 완료되지만 돌려줄 값은 없음
  save(req: MintRequest): Promise<void>;
}
```

### 읽는 법 (한국어로 풀이)

`findById(id: string): Promise<MintRequest | null>`
→ "id라는 string을 받아서, 나중에 MintRequest 객체 또는 null을 돌려주는 메서드"

`save(req: MintRequest): Promise<void>`
→ "MintRequest 객체를 받아서, 저장하고 완료되면 아무것도 돌려주지 않는 메서드"

---

## 4. 강의 핵심 인터페이스 패턴

### 코드

```typescript
interface EventProcessor {
  eventTypes: string[];                                  // 처리할 이벤트 타입 목록
  process(message: StreamMessage): Promise<void>;        // 처리 메서드
}
```

### 왜 이렇게 쓰는가

강의 코드에서 NFT 발행 처리기, NFT 소각 처리기, 전송 처리기 등 여러 처리기를 만든다. 이 처리기들은 내부 구현이 제각각이지만, 모두 같은 interface를 만족하도록 설계한다. 그러면 사용하는 쪽에서는 내부 구현이 뭔지 신경 쓸 필요 없이 `EventProcessor`라는 이름 하나로 모두 같은 방식으로 다룰 수 있다.

### 이게 가능한 이유 — 코드로 확인

```typescript
// 처리기들을 하나의 배열에 넣을 수 있다
// — 전부 EventProcessor를 만족하므로
const processors: EventProcessor[] = [processorA, processorB, processorC];

// 각 처리기의 내부 구현이 뭔지 몰라도 동일하게 사용 가능
const matched = processors.filter(p => p.eventTypes.includes(eventType));
await Promise.all(matched.map(p => p.process(msg)));
```

### 구체 예시 — 'NFT_ISSUED' 메시지가 들어왔을 때

```
processors 배열 구성:
  발행처리자      { eventTypes: ['NFT_ISSUED'] }
  감사로그처리자  { eventTypes: ['NFT_ISSUED', 'NFT_BURNED'] }
  알림발송처리자  { eventTypes: ['NFT_ISSUED'] }
  소각처리자      { eventTypes: ['NFT_BURNED'] }

① filter 실행 — 'NFT_ISSUED'를 처리할 수 있는 것만 추림
   → [발행처리자, 감사로그처리자, 알림발송처리자]
   (소각처리자는 eventTypes에 'NFT_ISSUED'가 없으므로 제외)

② map 실행 — 각각 process(msg) 호출
   → [
       발행처리자.process(msg),      // 원장 +1
       감사로그처리자.process(msg),  // 로그 기록
       알림발송처리자.process(msg),  // 사용자 알림
     ]

③ Promise.all — 셋 동시 실행
```

> **핵심 포인트**: `processorA.process(msg)`를 호출할 수 있는 이유는 `processorA`가 `EventProcessor`를 만족하기 때문이다. 실제 클래스가 무엇인지는 중요하지 않다.

---

## 5. union 타입 — 여러 타입 중 하나

### 기본 union

```typescript
let x: string | number;
x = 'hello';  // OK — string이므로
x = 42;       // OK — number이므로
x = true;     // 에러 — boolean은 허용 목록에 없음
```

`|` 기호는 "또는"을 의미한다. `string | number`는 "string이거나 number인 값"이다.

### 문자열 리터럴 union — 상태 머신에서 핵심 패턴

```typescript
type TxStatus =
  | 'REQUESTED'
  | 'SUBMITTED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'FAILED';
```

### 왜 단순 `string` 대신 이걸 쓰는가

```typescript
// 단순 string이면:
let status: string = 'REQESTED';  // 오타가 있어도 에러 없음 — 그냥 string이니까

// TxStatus이면:
let status: TxStatus = 'REQESTED';  // 에러!
// 에러: Type '"REQESTED"' is not assignable to type 'TxStatus'
// → 'REQUESTED'를 'REQESTED'로 오타냈다는 걸 컴파일러가 즉시 알려준다
```

비유로 이해하기: 단순 `string`은 "아무 내용이나 적을 수 있는 빈 종이", 문자열 리터럴 union은 "정해진 항목 중 하나만 고를 수 있는 체크박스 목록"이다.

강의에서 상태값(`TxStatus`), 이벤트 타입(`'NFT_ISSUED' | 'NFT_BURNED'`), 체인 종류(`'ETHEREUM' | 'POLYGON'`) 등에 사용한다.

---

## 6. Record\<K, V\> — 객체 타입 단축

### 기본 개념

```typescript
// 길게 쓰면 — "키가 string이고 값도 string인 객체"
const fields: { [key: string]: string } = {};

// Record로 단축 — 완전히 동일한 의미
const fields: Record<string, string> = {};
```

`Record<K, V>`를 분해하면:
- `K` = 키(key)의 타입
- `V` = 값(value)의 타입
- 즉 "키가 K 타입이고 값이 V 타입인 객체"

### 강의 코드 빈출 예시

```typescript
interface StreamMessage {
  id: string;
  fields: Record<string, string>;  // 어떤 문자열 키든 → 문자열 값
}
```

실제로 이런 객체가 된다:

```typescript
const msg: StreamMessage = {
  id: 'msg-001',
  fields: {
    txId: 'tx-abc',           // string → string
    amount: '1000',           // string → string
    fromAddress: '0xAAA',     // string → string
  }
};
```

---

### Record\<TxStatus, TxStatus[]\> — 상태 전이 맵 심층 분석

강의에서 가장 중요한 `Record` 활용 패턴이다. 처음 보면 마법처럼 보이지만, 단계별로 분해하면 이해할 수 있다.

#### 1단계: TxStatus를 key로 쓴다는 것의 의미

```typescript
type TxStatus = 'REQUESTED' | 'SUBMITTED' | 'PENDING' | 'CONFIRMED' | 'FAILED';

// Record<TxStatus, ...> 라고 하면:
// → TxStatus의 모든 값(REQUESTED, SUBMITTED, PENDING, CONFIRMED, FAILED)이
//   반드시 key로 존재해야 한다
// → 하나라도 빠지면 컴파일 에러
```

이게 단순 `Record<string, ...>`과 다른 핵심 차이다. `Record<string, ...>`이면 아무 키나 써도 되고, 어떤 키가 있어야 한다는 보장이 없다. `Record<TxStatus, ...>`이면 정확히 다섯 개의 키(`REQUESTED`, `SUBMITTED`, `PENDING`, `CONFIRMED`, `FAILED`)가 전부 있어야 한다.

#### 2단계: TxStatus[]를 value로 쓴다는 것의 의미

```typescript
// Record<TxStatus, TxStatus[]>
//                  ^^^^^^^^^^
//                  값은 TxStatus의 배열
//                  = 이 상태에서 전이 가능한 다음 상태들의 목록
```

예를 들어 `REQUESTED`의 값이 `['SUBMITTED', 'FAILED']`라면:
→ REQUESTED 상태에서는 SUBMITTED 또는 FAILED로만 전이할 수 있다는 뜻

#### 3단계: 전체 상태 전이 맵

```typescript
const VALID_TRANSITIONS: Record<TxStatus, TxStatus[]> = {
  //  현재 상태         →  전이 가능한 다음 상태들
  REQUESTED:  ['SUBMITTED', 'FAILED'],   // 요청됨 → 제출됨 또는 실패
  SUBMITTED:  ['PENDING',   'FAILED'],   // 제출됨 → 대기중 또는 실패
  PENDING:    ['CONFIRMED', 'FAILED'],   // 대기중 → 확정됨 또는 실패
  CONFIRMED:  [],                        // 확정됨 → 더 이상 이동 불가 (종료 상태)
  FAILED:     [],                        // 실패   → 더 이상 이동 불가 (종료 상태)
  // ↑ 다섯 개 키 전부 있어야 함. 하나라도 빠지면:
  // 에러: Property 'FAILED' is missing in type ...
};
```

#### 4단계: 이 구조를 실제로 어떻게 쓰는가 — validate 함수

```typescript
function canTransition(from: TxStatus, to: TxStatus): boolean {
  // VALID_TRANSITIONS[from] 으로 "from 상태에서 갈 수 있는 목록"을 꺼낸다
  const allowed = VALID_TRANSITIONS[from];

  // 목록 안에 to가 있는지 확인
  return allowed.includes(to);
}

// 사용 예:
canTransition('REQUESTED', 'SUBMITTED');  // true  — 허용된 전이
canTransition('REQUESTED', 'CONFIRMED'); // false — 허용되지 않은 전이
canTransition('CONFIRMED', 'FAILED');    // false — 종료 상태에서는 이동 불가

function validateAndTransition(current: TxStatus, next: TxStatus): TxStatus {
  if (!canTransition(current, next)) {
    throw new Error(`Invalid transition: ${current} → ${next}`);
  }
  return next;
}
```

#### 왜 이 구조가 강력한가

단순히 if문으로 "REQUESTED면 SUBMITTED로 갈 수 있다"고 적는 것과 비교해보자:

```typescript
// 방법 1: if문 나열 (나쁜 예)
function canTransition(from: TxStatus, to: TxStatus): boolean {
  if (from === 'REQUESTED') return to === 'SUBMITTED' || to === 'FAILED';
  if (from === 'SUBMITTED') return to === 'PENDING' || to === 'FAILED';
  // ... 계속 반복
}

// 방법 2: Record 상태 전이 맵 (좋은 예)
function canTransition(from: TxStatus, to: TxStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
  // 단 한 줄. 상태가 10개로 늘어나도 맵만 수정하면 됨
}
```

또한 새 상태(`'REFUNDED'`)를 `TxStatus`에 추가하면, `VALID_TRANSITIONS`에도 `REFUNDED` 키를 추가하지 않으면 컴파일 에러가 난다. 실수로 빠뜨리는 것을 컴파일러가 잡아준다.

---

## 7. type vs interface

```typescript
// interface — 객체 형태 정의. 클래스에서 implements 가능
interface User { name: string; }

// type alias — 어떤 타입이든 이름을 붙일 수 있음
type UserId = string;                          // 단순 별칭
type Status = 'A' | 'B' | 'C';               // union
type Result<T> = { ok: true; data: T }        // 제네릭 + union
               | { ok: false; error: string };
```

### 언제 어떤 것을 쓰는가

| 상황 | 권장 |
|------|------|
| 객체의 형태 정의 | `interface` |
| 클래스가 구현해야 할 계약 | `interface` |
| union 타입 (`A \| B`) | `type` |
| 단순 별칭 (`type Id = string`) | `type` |
| 복잡한 조합, 조건부 타입 | `type` |

강의 코드에서는 둘이 섞여 나온다. 차이에 집착하기보다 코드 흐름 읽기에 집중하면 된다.

---

## 8. Map\<K, V\> — 타입 안전한 key-value 저장소

### 왜 일반 객체가 아닌 Map을 쓰는가

일반 객체(`{}`)는 키를 정적으로 정의할 때 적합하다. 키가 실행 중에 계속 추가/삭제되는 경우에는 `Map`이 더 적합하다. 강의 코드에서 idempotency 키 관리(중복 처리 방지), 정책 캐시 등에 등장한다.

### 코드와 각 메서드 설명

```typescript
// Map<string, bigint> 선언
// = 키는 string, 값은 bigint(큰 정수)인 Map
const store = new Map<string, bigint>();

store.set('0xAAA', 1000n);   // 추가 또는 수정. 키 '0xAAA'에 값 1000n 저장
store.get('0xAAA');           // 가져오기. 반환 타입: bigint | undefined
store.has('0xAAA');           // 존재 여부 확인. 반환 타입: boolean
store.delete('0xAAA');        // 삭제
store.size;                   // 현재 저장된 항목 수
```

### `.get()`이 항상 `T | undefined`를 반환하는 이유

```typescript
const bal = store.get('0xAAA');  // 반환 타입: bigint | undefined
```

TypeScript는 `'0xAAA'`라는 키가 실제로 Map에 들어있는지 실행 전에 알 수 없다. 그래서 항상 "값이 있을 수도 있고(bigint), 없을 수도 있다(undefined)"는 의미로 `bigint | undefined`를 반환한다.

### undefined를 처리하는 두 가지 방법

```typescript
// 방법 1: ?? (nullish coalescing) — 없으면 기본값 사용
const bal = store.get('0xAAA') ?? 0n;  // 없으면 0n
bal + 100n;  // OK — bal은 반드시 bigint

// 방법 2: ! (non-null assertion) — "나는 반드시 있다고 확신한다"고 선언
const bal = store.get('0xAAA')!;  // bigint로 취급
bal + 100n;  // OK — 하지만 실제로 없으면 런타임 에러!
// 확실히 있다는 보장이 있을 때만 사용할 것

// 잘못된 예:
const bal = store.get('0xAAA');  // bigint | undefined
bal + 100n;  // 에러: Object is possibly 'undefined'
```

### 순회

```typescript
// [key, value] 구조분해로 순회
for (const [key, value] of store) {
  console.log(key, value);
}
```

### 실수하기 쉬운 부분: Map을 객체처럼 접근

```typescript
const store = new Map<string, number>();
store.set('key', 1);

store['key'];      // undefined — Map은 대괄호 접근이 안 된다
store.get('key');  // 1 — Map은 반드시 .get()을 써야 한다
```

---

## 자주 하는 실수

### 실수 1 — optional(`?:`)과 `| undefined` union 혼동

```typescript
interface Req {
  memo?: string;            // memo 필드 자체가 없어도 됨
  note: string | undefined; // note 필드는 반드시 있어야 함. 단 값이 undefined일 수 있음
}

const a: Req = { memo: undefined };  // OK — memo는 선택적
const b: Req = {};                    // 에러 — note 필드가 아예 없음
const c: Req = { note: undefined };  // OK — note는 있고, 값이 undefined
```

실무에서는 대부분 `?:`로 처리한다. `| undefined`는 "필드는 있는데 값이 없는" 특수한 경우에만 쓴다.

### 실수 2 — Record 키 타입 일부 누락

```typescript
type TxStatus = 'REQUESTED' | 'SUBMITTED' | 'PENDING' | 'CONFIRMED' | 'FAILED';

// 잘못된 예:
const map: Record<TxStatus, string> = {
  REQUESTED: 'a',
  SUBMITTED: 'b',
  // PENDING, CONFIRMED, FAILED 빠짐 → 컴파일 에러
  // 에러: Property 'PENDING' is missing in type ...
};

// 올바른 예:
const map: Record<TxStatus, string> = {
  REQUESTED: 'a',
  SUBMITTED: 'b',
  PENDING:   'c',
  CONFIRMED: 'd',
  FAILED:    'e',
};
```

### 실수 3 — Map을 객체처럼 접근

```typescript
const store = new Map<string, number>();
store.set('key', 1);

store['key'];        // undefined (Map은 이렇게 못 씀)
store.get('key');    // 1 (올바른 방법)
```

---

## 체크리스트

- [ ] interface 선언을 보고 어떤 객체가 만족하는지 알 수 있다
- [ ] `readonly`가 왜 필요한지, `const`와 어떻게 다른지 설명할 수 있다
- [ ] `string | number` 같은 union을 읽을 수 있다
- [ ] 문자열 리터럴 union으로 상태값을 표현하는 이유를 설명할 수 있다
- [ ] `Record<K, V>`에서 K가 `TxStatus`이면 모든 상태가 반드시 key로 있어야 하는 이유를 설명할 수 있다
- [ ] `Record<TxStatus, TxStatus[]>` 상태 전이 맵을 보고 canTransition 함수를 직접 작성할 수 있다
- [ ] 메서드 시그니처 `foo(x: T): Promise<U>`를 한국어로 풀이할 수 있다
- [ ] `Map<K, V>`에서 `.get()`이 `T | undefined`를 반환하는 이유를 안다
- [ ] `??`와 `!`로 undefined를 처리하는 방법의 차이를 설명할 수 있다

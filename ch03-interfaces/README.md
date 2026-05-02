# CH03 — 인터페이스와 타입

## 핵심 한 줄
> interface = "이 객체는 이런 형태여야 한다"는 계약서. 런타임에는 사라지고 컴파일 시점에만 존재한다.

---

## 1. interface 기본 구조

### interface가 class와 다른 점: 런타임에 존재하지 않는다

```typescript
// class는 런타임에 살아있다 — 실제로 인스턴스를 만들 수 있음
class MintRequestClass {
  id: string;
  toAddress: string;
  constructor(id: string, toAddress: string) {
    this.id = id;
    this.toAddress = toAddress;
  }
}

// interface는 컴파일 후 사라진다 — 값이 없고 타입 정보만 있음
interface MintRequest {
  id: string;
  toAddress: string;
}
```

TypeScript를 JavaScript로 컴파일하면:

```javascript
// class는 JavaScript에 그대로 남는다
class MintRequestClass { ... }

// interface는 흔적도 없이 사라진다
// (아무것도 없음)
```

`interface`는 "이 변수에 들어오는 객체가 갖춰야 할 조건"을 컴파일러에게 알려주는 도구다.  
컴파일러가 검사를 마치면 interface는 JavaScript 파일에 아무 흔적도 남기지 않는다.

---

### 세미콜론(`;`) vs 쉼표(`,`) — interface는 세미콜론이 표준인 이유

```typescript
// ✅ interface — 세미콜론이 표준
interface MintRequest {
  id: string;          // ← 세미콜론
  toAddress: string;
  tokenId: string;
}

// ✅ 객체 리터럴 — 쉼표가 표준
const req = {
  id: 'req-001',       // ← 쉼표
  toAddress: '0xAAA',
  tokenId: 'token-1',
};
```

| 위치 | 구분자 | 이유 |
|---|---|---|
| `interface` 선언 | `;` 세미콜론 | 각 줄이 "필드 선언"이라는 신호. 쉼표도 동작하지만 세미콜론이 관례 |
| 객체 리터럴 `{}` | `,` 쉼표 | 각 줄이 "값"이라는 신호. JavaScript 객체 문법 그대로 |

처음에 헷갈리면 이렇게 외우자: **interface는 선언, 객체는 값. 선언엔 `;`, 값엔 `,`.**

---

### 단계별 분해: interface 선언 → 객체 리터럴로 만족시키기

```typescript
// 1단계: interface 키워드로 시작
//         이름은 관례적으로 대문자로 시작 (PascalCase)
interface MintRequest {

  // 2단계: 필드명: 타입; 형식으로 "이 필드가 있어야 한다"는 조건 나열
  id: string;          // id 필드는 반드시 있어야 하고, string 타입이어야 한다
  toAddress: string;   // toAddress 필드는 반드시 있어야 하고, string 타입이어야 한다
  tokenId: string;     // tokenId 필드는 반드시 있어야 하고, string 타입이어야 한다

  // 3단계: ? 가 붙으면 "선택적(optional)" — 없어도 에러가 아님
  memo?: string;       // memo는 있으면 string, 없어도 됨
}
```

```typescript
// 4단계: 변수에 타입 annotation을 붙이면 컴파일러가 자동으로 조건 검사

// ✅ 조건을 만족하는 객체 — 필수 필드 3개 전부 있음
const req: MintRequest = {
  id: 'req-001',
  toAddress: '0xAAA',
  tokenId: 'token-1',
  // memo 없어도 OK — ?가 붙어 있으니까
};

// ❌ 조건을 만족하지 않는 객체 — 필수 필드 하나 빠짐
const req: MintRequest = {
  id: 'req-001',
  // toAddress 빠짐!
  tokenId: 'token-1',
  // 에러: Property 'toAddress' is missing in type
  //       '{ id: string; tokenId: string; }' but required in type 'MintRequest'
};
```

> 핵심: `interface`는 클래스를 만드는 도구가 아니다. 그냥 객체의 형태를 설명하는 계약서다. `{}` 안에 필드와 타입만 적고, 실제 값은 없다.

---

## 2. `readonly` 필드 — const와 혼동하지 말 것

`const`와 `readonly`는 모두 "변경 금지"를 뜻하지만, 적용 대상이 완전히 다르다.

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// const: 변수 자체를 다른 값으로 교체 금지
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const req = { id: 'req-001', toAddress: '0xAAA' };

req = { id: 'req-002', toAddress: '0xBBB' }; // ❌ 에러: const 변수 자체를 교체 불가
req.id = 'req-002';                           // ✅ OK: const는 내부 필드 변경은 막지 않는다!

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// readonly: 객체의 특정 필드 변경 금지
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface MintRequest {
  readonly id: string;  // ← readonly: 이 필드는 처음 할당 후 변경 불가
  toAddress: string;    // ← readonly 없음: 변경 가능
}

const req: MintRequest = { id: 'req-001', toAddress: '0xAAA' };

req.toAddress = '0xBBB'; // ✅ OK — readonly가 없으므로 변경 가능
req.id = 'req-002';      // ❌ 에러: Cannot assign to 'id' because it is a read-only property
```

| | `const` | `readonly` |
|---|---|---|
| 적용 대상 | 변수 | 객체의 필드 |
| 막는 것 | 변수 자체를 다른 값으로 교체 | 특정 필드에 값 재할당 |
| 내부 필드 변경 | 막지 않음 | 해당 필드만 막음 |
| 쓰는 곳 | 변수 선언 앞 | `interface`, `class`, 배열(`readonly T[]`) |

`readonly`는 `id`처럼 처음 정해지면 절대 바뀌면 안 되는 값에 붙인다.  
누군가 실수로 `req.id = '다른값'`을 써도 컴파일러가 즉시 잡아준다.

> 핵심: `const req = { ... }` 는 `req` 변수의 교체를 막는다. `readonly id`는 `req.id` 필드의 재할당을 막는다. 둘 다 써야 완전한 불변이다.

---

## 3. 메서드 시그니처 읽는 법

interface 안에 메서드를 선언하면 "이 interface를 따르는 클래스는 이 메서드를 반드시 구현해야 한다"는 약속이 된다.  
구현 내용(함수 본문)은 없고, **입력과 출력의 형태만** 적는다.

```typescript
interface TxRepository {
  findById(id: string): Promise<MintRequest | null>;
  save(req: MintRequest): Promise<void>;
}
```

토큰 단위로 분해한다:

```
findById  (  id: string  )  :  Promise<MintRequest | null>
   ①          ②    ③        ④         ⑤
```

| 번호 | 토큰 | 의미 |
|---|---|---|
| ① `findById` | 메서드 이름 | 이 메서드를 부를 때 쓰는 이름 |
| ② `id` | 매개변수 이름 | 함수 본문에서 사용할 변수명 |
| ③ `string` | 매개변수 타입 | 이 자리에 string만 들어올 수 있음 |
| ④ `:` | 구분자 | "반환 타입은..." 이라는 구분 기호 |
| ⑤ `Promise<MintRequest \| null>` | 반환 타입 | 비동기로 MintRequest 또는 null을 돌려줌 |

```
save  (  req: MintRequest  )  :  Promise<void>
  ①          ②    ③           ④       ⑤
```

| 토큰 | 의미 |
|---|---|
| `save` | 메서드 이름 |
| `req` | 매개변수 이름 |
| `MintRequest` | 매개변수 타입: MintRequest 형태의 객체만 받음 |
| `Promise<void>` | 반환 타입: 비동기로 완료되지만 돌려줄 값이 없음 |

---

### `| null`이 붙는 이유

```typescript
findById(id: string): Promise<MintRequest | null>;
//                                       ^^^^^^
```

"id로 조회했는데 그 id가 DB에 없으면?" → 돌려줄 것이 없다.  
이런 경우 두 가지 선택지가 있다:

```typescript
// 선택 1: 에러를 던진다 — 없으면 반드시 에러 처리가 필요
findById(id: string): Promise<MintRequest>;  // 없으면 throw Error

// 선택 2: null을 돌려준다 — 호출한 쪽에서 null 체크 후 처리
findById(id: string): Promise<MintRequest | null>;  // 없으면 null
```

`| null`이 붙어 있으면 "있을 수도 있고 없을 수도 있으니 호출한 쪽에서 반드시 확인하라"는 신호다.  
TypeScript는 `| null`이 붙은 값을 null 체크 없이 바로 쓰면 에러를 낸다.

```typescript
const req = await repo.findById('req-001');
// req의 타입: MintRequest | null

req.id;                  // ❌ 에러: Object is possibly 'null'

if (req !== null) {
  req.id;                // ✅ OK — null이 아님을 확인했으므로 사용 가능
}

const id = req?.id;      // ✅ OK — 옵셔널 체이닝: req가 null이면 undefined 반환
```

> 핵심: `| null`은 "이 값은 없을 수도 있다"는 신호다. TypeScript는 이걸 보고 null 체크 없이 쓰면 에러를 낸다. 런타임 NPE(null pointer exception)를 컴파일 시점에 방지하는 장치다.

---

## 4. union 타입 — "이것 또는 저것"

### 기본 union

```typescript
let x: string | number;
x = 'hello'; // ✅ OK — string이므로
x = 42;      // ✅ OK — number이므로
x = true;    // ❌ 에러 — boolean은 허용 목록에 없음
```

`|` 기호는 "또는"을 의미한다. `string | number`는 "string이거나 number인 값"이다.

TypeScript가 union을 받았을 때 내부적으로 하는 일:

```typescript
function printId(id: string | number) {
  // 이 시점에서 id는 string일 수도, number일 수도 있다
  // TypeScript는 두 타입 모두에서 사용 가능한 연산만 허용한다

  id.toUpperCase(); // ❌ 에러 — number에는 toUpperCase가 없다
  id + 1;           // ❌ 에러 — string에 + 1은 의도가 불분명하다

  // 타입 좁히기(type narrowing)를 해야 각 타입에 맞는 연산이 가능하다
  if (typeof id === 'string') {
    id.toUpperCase(); // ✅ OK — 이 블록 안에서 id는 string으로 확정
  } else {
    id + 1;           // ✅ OK — 이 블록 안에서 id는 number로 확정
  }
}
```

---

### 문자열 리터럴 union — 상태 머신의 핵심 패턴

```typescript
type TxStatus =
  | 'REQUESTED'
  | 'SUBMITTED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'FAILED';
```

왜 단순 `string` 대신 이걸 쓰는가:

```typescript
// ❌ 단순 string이면: 오타가 있어도 에러 없음
let status: string = 'REQESTED';  // 'REQUESTED'를 잘못 적었지만 그냥 통과

// ✅ TxStatus이면: 오타 시 컴파일 에러
let status: TxStatus = 'REQESTED';
// 에러: Type '"REQESTED"' is not assignable to type 'TxStatus'.
//       Did you mean '"REQUESTED"'?
//       → 오타를 컴파일러가 즉시 잡아준다
```

```typescript
// ❌ 단순 string이면: 유효하지 않은 상태값도 통과
function updateStatus(id: string, status: string) { ... }
updateStatus('req-001', 'PROCESSING'); // 에러 없음 — 이 상태는 실제로 없는데도

// ✅ TxStatus이면: 정의된 상태값만 허용
function updateStatus(id: string, status: TxStatus) { ... }
updateStatus('req-001', 'PROCESSING'); // ❌ 에러 — TxStatus에 없는 값
updateStatus('req-001', 'CONFIRMED');  // ✅ OK
```

왜 enum 대신 문자열 리터럴 union을 쓰는가:

```typescript
// enum 방식
enum TxStatusEnum {
  REQUESTED = 'REQUESTED',
  SUBMITTED = 'SUBMITTED',
}
// → JavaScript로 컴파일 시 객체가 런타임에 남는다 (번들 크기 증가)
// → tree-shaking이 잘 안 된다
// → 일반 string과 직접 비교할 때 예상치 못한 동작이 생기기도 한다

// 문자열 리터럴 union 방식
type TxStatus = 'REQUESTED' | 'SUBMITTED';
// → 컴파일 후 완전히 사라진다 (런타임 비용 없음)
// → 일반 string으로 바로 쓸 수 있다
// → 요즘 TypeScript 커뮤니티에서 더 선호하는 방식
```

> 핵심: 문자열 리터럴 union은 "이 변수에는 딱 이 값들만 들어올 수 있다"는 체크박스 목록이다. enum보다 가볍고, 런타임에 아무 흔적도 남기지 않는다.

---

## 5. `Record<TxStatus, TxStatus[]>` 상태 전이 맵 — 4단계 완전 분해

처음 보면 마법처럼 느껴지는 패턴이다. 단계별로 분해한다.

### 1단계: `Record<K, V>`가 뭔지

```typescript
// 길게 쓰면 — "키가 string이고 값도 string인 객체"
const fields: { [key: string]: string } = {};

// Record로 단축 — 완전히 동일한 의미
const fields: Record<string, string> = {};
```

`Record<K, V>`를 분해하면:
- `K` = 키(key)의 타입
- `V` = 값(value)의 타입
- 즉 "K 타입의 키를 모두 가져야 하고, 각 값은 V 타입인 객체"

K가 string처럼 넓은 타입이면 어떤 키든 쓸 수 있다:

```typescript
const fields: Record<string, string> = {
  txId: 'tx-abc',       // 어떤 키든 OK
  amount: '1000',       // 어떤 키든 OK
  아무거나: '값',        // 어떤 키든 OK
};
```

---

### 2단계: K가 TxStatus union이면 → 모든 상태가 반드시 키로 존재해야 한다

```typescript
type TxStatus = 'REQUESTED' | 'SUBMITTED' | 'PENDING' | 'CONFIRMED' | 'FAILED';

// Record<TxStatus, string>라고 하면:
// → TxStatus의 모든 값이 반드시 키로 존재해야 한다
// → 하나라도 빠지면 컴파일 에러

const labels: Record<TxStatus, string> = {
  REQUESTED: '요청됨',
  SUBMITTED: '제출됨',
  PENDING:   '대기중',
  CONFIRMED: '확정됨',
  // FAILED 빠짐!
  // ❌ 에러: Property 'FAILED' is missing in type
  //          '{ REQUESTED: string; ... }' but required in type 'Record<TxStatus, string>'
};
```

이게 `Record<string, string>`과 다른 핵심 차이다:

```typescript
// Record<string, string> — 어떤 키든 써도 되고, 빠져도 에러 없음
const a: Record<string, string> = { REQUESTED: '요청됨' };  // ✅ OK

// Record<TxStatus, string> — 5개 키 전부 있어야 함
const b: Record<TxStatus, string> = { REQUESTED: '요청됨' };  // ❌ 에러: 4개 빠짐
```

---

### 3단계: V가 `TxStatus[]`이면 → 이 상태에서 전이 가능한 다음 상태 목록

```typescript
// Record<TxStatus, TxStatus[]>
//                  ^^^^^^^^^^
// 값의 타입이 TxStatus의 배열
// = 이 상태에서 전이 가능한 다음 상태들의 목록

// 예: REQUESTED의 값이 ['SUBMITTED', 'FAILED']라면
// → REQUESTED 상태에서는 SUBMITTED 또는 FAILED로만 갈 수 있다는 뜻
```

---

### 4단계: 전체 상태 전이 맵 + `canTransition` 함수 구현

```typescript
const VALID_TRANSITIONS: Record<TxStatus, TxStatus[]> = {
  //  현재 상태         →  전이 가능한 다음 상태들
  REQUESTED:  ['SUBMITTED', 'FAILED'],   // 요청됨  → 제출됨 또는 실패
  SUBMITTED:  ['PENDING',   'FAILED'],   // 제출됨  → 대기중 또는 실패
  PENDING:    ['CONFIRMED', 'FAILED'],   // 대기중  → 확정됨 또는 실패
  CONFIRMED:  [],                        // 확정됨  → 더 이상 이동 불가 (종료 상태)
  FAILED:     [],                        // 실패    → 더 이상 이동 불가 (종료 상태)
  // 다섯 개 키 전부 있어야 함. 하나라도 빠지면:
  // 에러: Property 'PENDING' is missing in type ...
};

function canTransition(from: TxStatus, to: TxStatus): boolean {
  // VALID_TRANSITIONS[from] 으로 "from 상태에서 갈 수 있는 목록"을 꺼낸다
  const allowed = VALID_TRANSITIONS[from];
  // 목록 안에 to가 있는지 확인
  return allowed.includes(to);
}

// 사용 예:
canTransition('REQUESTED', 'SUBMITTED');  // true  — 허용된 전이
canTransition('REQUESTED', 'CONFIRMED'); // false — 허용되지 않은 전이 (단계 건너뜀)
canTransition('CONFIRMED', 'FAILED');    // false — 종료 상태에서는 이동 불가

function validateAndTransition(current: TxStatus, next: TxStatus): TxStatus {
  if (!canTransition(current, next)) {
    throw new Error(`Invalid transition: ${current} → ${next}`);
  }
  return next;
}
```

---

### 왜 if문 나열 대신 이 패턴을 쓰는가

```typescript
// ❌ 방법 1: if문 나열
function canTransition(from: TxStatus, to: TxStatus): boolean {
  if (from === 'REQUESTED') return to === 'SUBMITTED' || to === 'FAILED';
  if (from === 'SUBMITTED') return to === 'PENDING' || to === 'FAILED';
  if (from === 'PENDING')   return to === 'CONFIRMED' || to === 'FAILED';
  if (from === 'CONFIRMED') return false;
  if (from === 'FAILED')    return false;
  return false;
}
// 문제 1: 상태가 10개로 늘면 if문도 10개로 늘어남
// 문제 2: 새 상태 추가 시 if문을 빠뜨려도 컴파일러가 못 잡아줌

// ✅ 방법 2: Record 상태 전이 맵
function canTransition(from: TxStatus, to: TxStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
  // 단 한 줄. 상태가 10개로 늘어나도 맵만 수정하면 됨
}
// 장점 1: 로직이 한 줄
// 장점 2: 새 상태('REFUNDED')를 TxStatus에 추가하면
//          VALID_TRANSITIONS에도 REFUNDED 키를 추가하지 않으면 컴파일 에러
//          → 빠뜨리는 실수를 컴파일러가 강제로 잡아준다
```

> 핵심: `Record<union타입, V>`는 "union의 모든 케이스를 빠짐없이 다뤄라"고 컴파일러가 강제한다. 상태 전이 맵, 에러 메시지 맵, 라벨 맵 등 "정해진 키 집합에 각각 값을 매핑하는" 모든 곳에 쓰는 표준 패턴이다.

---

## 6. `type` vs `interface` — 언제 어떤 걸 쓰는가

```typescript
// interface — 객체 형태 정의. extends로 확장 가능. implements로 구현 가능
interface User {
  name: string;
  email: string;
}

// type alias — 어떤 타입이든 이름을 붙일 수 있음
type UserId = string;                            // 단순 별칭
type TxStatus = 'REQUESTED' | 'CONFIRMED';      // union
type Result<T> = { ok: true; data: T }           // 제네릭 + union
               | { ok: false; error: string };
```

---

### 판단 기준을 코드 예시로

**interface를 쓰는 경우**

```typescript
// 1. 객체의 형태를 정의할 때
interface MintRequest {
  id: string;
  toAddress: string;
}

// 2. class가 구현해야 할 계약을 정의할 때
interface TxRepository {
  findById(id: string): Promise<MintRequest | null>;
  save(req: MintRequest): Promise<void>;
}

class InMemoryTxRepository implements TxRepository {
  // implements를 쓰면 컴파일러가 메서드 구현 여부를 검사한다
  async findById(id: string) { ... }
  async save(req: MintRequest) { ... }
}

// 3. 확장(상속)이 필요할 때
interface BaseEvent {
  id: string;
  createdAt: Date;
}

interface MintEvent extends BaseEvent {
  tokenId: string;  // BaseEvent의 필드도 전부 포함
  toAddress: string;
}
```

**type을 쓰는 경우**

```typescript
// 1. union 타입
type TxStatus = 'REQUESTED' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED';
// interface로는 union을 만들 수 없다

// 2. 단순 별칭
type UserId = string;
type Amount = bigint;

// 3. 복잡한 조합
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: number };
```

---

### 교차 타입(`&`) vs interface extends

두 타입을 합치는 방법은 두 가지다:

```typescript
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// interface extends — interface 확장
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface Animal {
  name: string;
}

interface Dog extends Animal {
  breed: string;
}
// Dog = { name: string; breed: string; }
// — Animal의 모든 필드를 포함하고, breed를 추가

const d: Dog = { name: '뭉치', breed: '진돗개' }; // ✅ OK

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 교차 타입 & — type 합치기
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type Animal = { name: string };
type Domestic = { owner: string };

type Pet = Animal & Domestic;
// Pet = { name: string; owner: string; }
// — 두 타입의 필드를 모두 합친 타입

const p: Pet = { name: '뭉치', owner: '김철수' }; // ✅ OK
```

| 방식 | 문법 | 쓰는 경우 |
|---|---|---|
| `interface extends` | `interface B extends A { ... }` | 클래스 계층 구조, OOP 스타일 설계 |
| 교차 타입 `&` | `type C = A & B` | 여러 타입을 조합할 때, type alias에서 |

실무 판단 기준:

| 상황 | 권장 |
|---|---|
| 객체의 형태 정의 | `interface` |
| 클래스가 구현해야 할 계약 | `interface` |
| union 타입 (`A \| B`) | `type` |
| 단순 별칭 (`type Id = string`) | `type` |
| 복잡한 조합, 조건부 타입 | `type` |
| 라이브러리 공개 API (확장성 필요) | `interface` (선언 병합 가능) |

> 핵심: "객체 형태 + 클래스 계약"이면 interface, "union이나 별칭이나 복잡한 조합"이면 type. 둘 다 가능한 경우엔 팀 컨벤션을 따른다. 차이에 집착하기보다 코드 흐름 읽기에 집중하면 된다.

---

## 7. EventProcessor 패턴 — interface로 여러 구현체를 하나로 다루기

```typescript
interface EventProcessor {
  eventTypes: string[];                           // 처리할 이벤트 타입 목록
  process(message: StreamMessage): Promise<void>; // 처리 메서드
}
```

이 interface를 따르는 처리기들을 배열에 모아서 한 번에 다룬다:

```typescript
const processors: EventProcessor[] = [
  mintProcessor,    // NFT 발행 처리기
  auditProcessor,   // 감사 로그 처리기
  alertProcessor,   // 알림 발송 처리기
  burnProcessor,    // NFT 소각 처리기
];

// 'NFT_ISSUED' 메시지가 들어왔을 때
const eventType = 'NFT_ISSUED';

// ① 이 이벤트를 처리할 수 있는 처리기만 추린다
const matched = processors.filter(p => p.eventTypes.includes(eventType));
// → [mintProcessor, auditProcessor, alertProcessor]
// (burnProcessor는 eventTypes에 'NFT_ISSUED'가 없으므로 제외)

// ② 추린 처리기들을 동시에 실행한다
await Promise.all(matched.map(p => p.process(msg)));
```

`processorA.process(msg)`를 호출할 수 있는 이유는 `processorA`가 `EventProcessor`를 만족하기 때문이다.  
실제 클래스가 `MintProcessor`인지 `AuditProcessor`인지는 사용하는 쪽에서 알 필요가 없다.

---

## 자주 하는 실수

**실수 1 — optional(`?:`)과 `| undefined` union 혼동**

```typescript
interface Req {
  memo?: string;            // ✅ memo 필드 자체가 없어도 됨 (선택적 필드)
  note: string | undefined; // note 필드는 반드시 있어야 함. 단 값이 undefined일 수 있음
}

const a: Req = { memo: undefined }; // ✅ OK — note 빠졌지만... 잠깐, 에러!
// ❌ 에러: Property 'note' is missing

const b: Req = { note: undefined }; // ✅ OK — note는 있고, 값이 undefined
const c: Req = {};                   // ❌ 에러 — note 필드가 아예 없음
const d: Req = { note: '내용' };    // ✅ OK
```

실무에서는 대부분 `?:`로 처리한다. `| undefined`는 "필드는 반드시 있는데 값이 없는" 특수한 경우에만 쓴다.

**실수 2 — `readonly`를 const로 해결하려는 시도**

```typescript
// ❌ const는 객체 내부 필드를 보호하지 않는다
const req = { id: 'req-001' };
req.id = 'changed'; // ✅ OK — const인데도 변경된다!

// ✅ 필드 보호는 readonly를 써야 한다
interface SafeReq { readonly id: string; }
const req: SafeReq = { id: 'req-001' };
req.id = 'changed'; // ❌ 에러: Cannot assign to 'id' because it is a read-only property
```

**실수 3 — Record 키 타입 일부 누락**

```typescript
type TxStatus = 'REQUESTED' | 'SUBMITTED' | 'PENDING' | 'CONFIRMED' | 'FAILED';

// ❌ 잘못된 예: 3개 키 빠짐
const map: Record<TxStatus, string> = {
  REQUESTED: '요청됨',
  SUBMITTED: '제출됨',
  // PENDING, CONFIRMED, FAILED 빠짐
  // 에러: Property 'PENDING' is missing in type ...
};

// ✅ 올바른 예: 5개 키 전부
const map: Record<TxStatus, string> = {
  REQUESTED: '요청됨',
  SUBMITTED: '제출됨',
  PENDING:   '대기중',
  CONFIRMED: '확정됨',
  FAILED:    '실패',
};
```

**실수 4 — union 타입에서 타입 좁히기 없이 각 타입 고유 메서드 사용**

```typescript
function process(id: string | number) {
  id.toUpperCase(); // ❌ 에러 — number에는 toUpperCase가 없다

  // ✅ 타입 좁히기 후 사용
  if (typeof id === 'string') {
    id.toUpperCase(); // OK
  }
}
```

---

## 체크리스트

- [ ] interface가 런타임에 사라진다는 것을, class와 비교해서 설명할 수 있다
- [ ] interface 안에 `;`를 쓰고 객체 리터럴에 `,`를 쓰는 이유를 안다
- [ ] `readonly`와 `const`가 어떻게 다른지, 코드 예시로 설명할 수 있다
- [ ] 메서드 시그니처 `findById(id: string): Promise<MintRequest | null>`를 토큰 단위로 분해해서 설명할 수 있다
- [ ] `| null`이 붙은 이유와, TypeScript가 이를 null 체크 없이 쓰면 에러를 내는 이유를 안다
- [ ] `string | number` union을 받은 함수에서 타입 좁히기(typeof 체크)가 필요한 이유를 설명할 수 있다
- [ ] 문자열 리터럴 union(`'REQUESTED' | 'SUBMITTED' | ...`)이 enum보다 선호되는 이유를 안다
- [ ] `Record<TxStatus, TxStatus[]>` 에서 TxStatus 키를 하나 빠뜨리면 컴파일 에러가 나는 이유를 설명할 수 있다
- [ ] if문 나열 대신 Record 상태 전이 맵을 쓰는 이유를 두 가지 이상 말할 수 있다
- [ ] `canTransition(from, to)` 함수를 보지 않고 직접 작성할 수 있다
- [ ] 언제 `interface`를, 언제 `type`을 쓰는지 판단할 수 있다
- [ ] `interface extends`와 교차 타입 `&`의 차이를 설명할 수 있다

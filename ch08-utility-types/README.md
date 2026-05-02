# CH08 — 유틸리티 타입 + 타입 가드

## 핵심 한 줄
> 유틸리티 타입 = 기존 타입을 변형하는 TS 내장 도구. 내부 동작까지 이해하면 어떤 변형도 직접 만들 수 있다.

---

## 1. Partial\<T\> — 모든 필드를 선택적으로

### 먼저 문제부터

```typescript
interface MintRequest {
  id: string;
  toAddress: string;
  tokenId: string;
  memo: string;
}

// ❌ 업데이트에 원본 타입을 그대로 쓰면?
async function updateRequest(id: string, patch: MintRequest): Promise<void> {
  // toAddress 하나만 바꾸고 싶어도
  // id, tokenId, memo까지 전부 넘겨야 컴파일이 된다 → 불편하고 실수 유발
}

// ✅ Partial을 쓰면
async function updateRequest(id: string, patch: Partial<MintRequest>): Promise<void> {
  // 바꿀 필드만 넣으면 된다
}

await updateRequest('req-001', { toAddress: '0xBBB' });           // toAddress만 → OK
await updateRequest('req-001', { memo: '변경된 메모' });            // memo만 → OK
await updateRequest('req-001', { toAddress: '0xBBB', memo: '변경' }); // 둘 다 → OK
```

### 내부에서 어떻게 동작하는가 (mapped type 분해)

`Partial<T>`는 TS 내장이지만, 내부 구현을 그대로 풀어 쓰면 이렇다:

```typescript
type Partial<T> = {
  [K in keyof T]?: T[K];
//  ↑     ↑      ↑   ↑
//  |     |      |   T에서 K라는 키의 값 타입
//  |     |      ? → 이 키를 선택적(optional)으로 만든다
//  |     T의 모든 키를 하나씩 순회한다 (for...in 루프 개념)
//  K는 현재 순회 중인 키 이름을 담는 타입 변수
};
```

`T = MintRequest`일 때 단계별로 펼쳐보면:

```
keyof MintRequest = 'id' | 'toAddress' | 'tokenId' | 'memo'
                    ↓ K가 순서대로 순회
K = 'id'       → id?:       MintRequest['id']       = id?: string
K = 'toAddress' → toAddress?: MintRequest['toAddress'] = toAddress?: string
K = 'tokenId'  → tokenId?:  MintRequest['tokenId']  = tokenId?: string
K = 'memo'     → memo?:     MintRequest['memo']     = memo?: string
                    ↓ 결과
{ id?: string; toAddress?: string; tokenId?: string; memo?: string }
```

> **핵심:** `[K in keyof T]`는 "T의 모든 키를 반복하면서 새 타입을 만든다"는 뜻. `?`를 붙이면 모든 키가 optional이 된다.

### 주의 — Partial의 한계

```typescript
// Partial을 쓰면 빈 객체도 허용된다
await updateRequest('req-001', {}); // ✅ 컴파일은 된다 — 하지만 아무것도 안 바뀜

// "적어도 하나는 있어야 한다"는 제약은 Partial만으로는 걸 수 없다.
// 그런 제약이 필요하면 별도의 타입 로직이 필요함.
```

---

## 2. Pick\<T, K\> — 원하는 필드만 선택

### 기본 사용

```typescript
// MintRequest 전체 대신, 목록에는 요약 정보만 필요하다
type MintSummary = Pick<MintRequest, 'id' | 'tokenId' | 'toAddress'>;
// = { id: string; tokenId: string; toAddress: string }
// memo는 없다. 명시한 필드만 남는다.
```

### 내부에서 어떻게 동작하는가 (mapped type 분해)

```typescript
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
//  ↑    ↑    ↑
//  |    |    T에서 P라는 키의 값 타입 그대로
//  |    K 안의 키들만 순회 (전체 keyof T가 아님)
//  P는 현재 순회 중인 키
};
// K extends keyof T → K는 반드시 T의 키 중에서만 골라야 함
// 존재하지 않는 필드를 Pick하려 하면 컴파일 에러
```

`T = MintRequest, K = 'id' | 'tokenId' | 'toAddress'`일 때:

```
K에 있는 키만 순회 → 'id', 'tokenId', 'toAddress'
  (memo는 K에 없으므로 포함되지 않음)

P = 'id'        → id:        MintRequest['id']        = id: string
P = 'tokenId'   → tokenId:   MintRequest['tokenId']   = tokenId: string
P = 'toAddress' → toAddress: MintRequest['toAddress'] = toAddress: string

결과: { id: string; tokenId: string; toAddress: string }
```

> **핵심:** Pick은 "남길 것을 명시"한다. Partial과 달리 `?`가 없으므로 선택한 필드는 모두 필수로 유지된다.

### 언제 쓰는가 — 목록 응답, 요약 정보

```typescript
// ❌ 전체 MintRequest를 목록에 보내면 불필요한 데이터까지 전송됨
async function listMints(): Promise<MintRequest[]> { ... }

// ✅ Pick으로 목록에서 필요한 필드만 추려서 반환
type MintSummary = Pick<MintRequest, 'id' | 'tokenId' | 'toAddress'>;

async function listMints(): Promise<MintSummary[]> {
  // id, tokenId, toAddress만 반환 — 상세 조회는 별도 엔드포인트에서
}
```

---

## 3. Omit\<T, K\> — 특정 필드를 제거

### 기본 사용

```typescript
// 생성 시점에는 서버가 자동으로 채워줄 필드가 있다
// id → 서버가 UUID 생성, createdAt → 서버가 현재 시각 기록
// 클라이언트가 이걸 직접 넣으면 오히려 문제

type MintRequestCreate = Omit<MintRequest, 'id' | 'createdAt'>;
// = { toAddress: string; tokenId: string; memo: string }
```

### 내부에서 어떻게 동작하는가 — Pick + Exclude 조합

Omit은 독립적으로 구현된 게 아니라 Pick과 Exclude를 조합한 것이다:

```typescript
// Omit<T, K>의 실제 구현
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
//                                          ↑
//                  "T의 키 전체에서 K에 해당하는 것들을 빼라"
```

`T = MintRequest, K = 'id' | 'createdAt'`일 때 단계별로:

```
1단계: keyof MintRequest
       = 'id' | 'toAddress' | 'tokenId' | 'memo' | 'createdAt'

2단계: Exclude<'id' | 'toAddress' | 'tokenId' | 'memo' | 'createdAt', 'id' | 'createdAt'>
       = 'toAddress' | 'tokenId' | 'memo'
       (제거할 'id', 'createdAt'이 빠졌다)

3단계: Pick<MintRequest, 'toAddress' | 'tokenId' | 'memo'>
       = { toAddress: string; tokenId: string; memo: string }
```

즉, Omit은 "제거할 것을 제외한 나머지로 Pick한다"는 로직이다.

> **핵심:** Omit = Pick(나머지) = Pick + Exclude. 직접 구현도 할 수 있다는 것을 이해하면 조합 타입을 만들 때도 당황하지 않는다.

### Pick vs Omit 선택 기준

```
전체 필드: id, toAddress, tokenId, memo, chainId, createdAt, status (7개)

남기고 싶은 게 2개 → Pick<T, 'id' | 'tokenId'>            (2개 나열)
제거하고 싶은 게 2개 → Omit<T, 'id' | 'createdAt'>         (2개 나열)

남길 게 적으면 Pick (남길 것만 나열 → 짧다)
제거할 게 적으면 Omit (제거할 것만 나열 → 짧다)
```

---

## 4. Required\<T\> — optional을 전부 필수로

### 기본 사용

```typescript
interface Config {
  host?: string;   // optional
  port?: number;   // optional
  debug?: boolean; // optional
}

type FullConfig = Required<Config>;
// = { host: string; port: number; debug: boolean }
//   ↑ ?가 전부 사라짐. 모두 필수가 됨.
```

### 내부에서 어떻게 동작하는가 — `-?` 문법

```typescript
// Required<T>의 실제 구현
type Required<T> = {
  [K in keyof T]-?: T[K];
//               ↑
//               -? = "?를 제거한다"
//               Partial의 ?와 정반대
};
```

`Partial`과 대칭 구조다:

| 유틸리티 | 내부 | 효과 |
|---|---|---|
| `Partial<T>` | `[K in keyof T]?: T[K]` | 모든 키에 `?` 추가 |
| `Required<T>` | `[K in keyof T]-?: T[K]` | 모든 키에서 `?` 제거 |

`-?`는 TypeScript의 매핑 수식어(mapping modifier)다. `+?`도 있지만 보통 생략해서 `?`로만 씀.

### 언제 쓰는가 — 설정 유효성 검사

```typescript
// 설정은 처음에 모두 optional로 받는다 (일부만 지정 가능)
// 기본값 채우는 단계 이후에는 모든 필드가 확정적으로 있음을 보장

function createConfig(partial: Config): FullConfig {
  return {
    host: partial.host ?? 'localhost',
    port: partial.port ?? 8080,
    debug: partial.debug ?? false,
  };
  // 리턴 타입 FullConfig → 이후 코드에서 host?.toUpperCase() 같은 방어 코드 불필요
}

// 이후 FullConfig를 쓰면 undefined 체크 없이 필드에 바로 접근 가능
const cfg = createConfig({ port: 3000 });
cfg.host.toUpperCase(); // OK (FullConfig에서 host는 string, undefined 아님)
```

---

## 5. ReturnType\<T\> — 함수 리턴 타입 추출

### 최종 목표부터 — 왜 필요한가

```typescript
// ❌ 문제: 별도 interface로 리턴 타입을 정의하면
interface TokenInfo {
  tokenId: string;
  supply: number;
  paused: boolean;
}
function getTokenInfo(): TokenInfo {
  return { tokenId: 'token-1', supply: 1000, paused: false };
}
// → getTokenInfo에 새 필드 추가하면 TokenInfo도 직접 수동으로 수정해야 함
// → 까먹으면 타입과 실제 반환값이 어긋남

// ✅ 해결: 함수에서 리턴 타입을 추출 → 항상 자동으로 동기화됨
function getTokenInfo() {
  return { tokenId: 'token-1', supply: 1000, paused: false };
}
type TokenInfo = ReturnType<typeof getTokenInfo>;
// → getTokenInfo에 locked: boolean을 추가하면
//   TokenInfo도 자동으로 { ..., locked: boolean }이 됨
```

### `typeof`가 왜 필요한가 — "값의 세계" vs "타입의 세계"

이게 처음 보면 가장 헷갈리는 부분이다. 핵심은 TypeScript에 두 세계가 있다는 것:

| 세계 | 존재 시점 | 예시 |
|---|---|---|
| **값(value)의 세계** | 런타임 | 변수, 함수, 객체, 클래스 인스턴스 |
| **타입(type)의 세계** | 컴파일 타임만 | `interface`, `type`, 제네릭 파라미터 |

`ReturnType<T>`에서 T 자리에는 반드시 **타입**이 들어가야 한다.  
그런데 `getTokenInfo`는 **값**이다 (함수 그 자체).

```typescript
ReturnType<getTokenInfo>        // ❌ 에러! getTokenInfo는 값이지 타입이 아님
ReturnType<typeof getTokenInfo> // ✅ typeof로 값에서 타입을 추출한 뒤 넣음
```

### 3단계로 분해

```typescript
function fetchBalance(address: string): Promise<number> {
  return Promise.resolve(1000);
}
```

```
1단계: fetchBalance
       → 값 (런타임에 존재하는 함수 그 자체)

2단계: typeof fetchBalance
       → 타입: (address: string) => Promise<number>
         "string을 받아서 Promise<number>를 리턴하는 함수" 라는 타입
         (런타임에는 사라짐. 컴파일 타임에만 있음)

3단계: ReturnType<typeof fetchBalance>
       → 타입: Promise<number>
         "그 함수가 리턴하는 것의 타입"
```

실제 코드 확인:

```typescript
// typeof fetchBalance → 함수 자체의 타입
type FnType = typeof fetchBalance;
// = (address: string) => Promise<number>

// ReturnType<typeof fetchBalance> → 그 함수가 리턴하는 타입
type Result = ReturnType<typeof fetchBalance>;
// = Promise<number>
```

> **핵심:** `typeof`는 두 곳에서 쓰인다. `typeof x === 'string'`은 JS 런타임 연산자. `type T = typeof x`는 TS 컴파일러에게 "이 값의 타입이 뭔지 알려줘"라고 묻는 것. 여기서는 후자.

---

## 6. Awaited\<T\> — Promise를 재귀적으로 벗기기

### 문제 — async 함수의 ReturnType은 항상 Promise로 싸여 있다

```typescript
async function fetchUser() {
  return { id: 'user-001', name: 'Sharon' };
}

// ReturnType만 쓰면 Promise가 남아 있다
type Step1 = ReturnType<typeof fetchUser>;
// = Promise<{ id: string; name: string }>
//    ↑ async 함수는 항상 Promise<X>를 리턴하기 때문

// 실제로 await 하면 나오는 타입을 원한다면 Awaited를 추가한다
type User = Awaited<ReturnType<typeof fetchUser>>;
// = { id: string; name: string }
```

### 단계별 분해

```
fetchUser
  → async 함수 (값)

typeof fetchUser
  → () => Promise<{ id: string; name: string }> (타입)

ReturnType<typeof fetchUser>
  → Promise<{ id: string; name: string }> (타입 — Promise가 아직 있음)

Awaited<ReturnType<typeof fetchUser>>
  → { id: string; name: string } (타입 — Promise가 벗겨짐)
```

### Awaited는 중첩 Promise도 재귀적으로 벗긴다

```typescript
type A = Awaited<Promise<string>>;                    // = string
type B = Awaited<Promise<Promise<string>>>;           // = string (두 겹 벗김)
type C = Awaited<Promise<Promise<Promise<number>>>>;  // = number (세 겹 벗김)

// 왜? Awaited의 내부 구현은 재귀 조건부 타입이다:
// Promise<infer U>이면 Awaited<U>를 다시 계산 → Promise가 없을 때까지 반복
```

### 실전 조합

```typescript
// API 응답 타입을 함수에서 자동 추출하는 패턴
async function getTokenBalance(address: string) {
  const result = await fetchFromChain(address);
  return { balance: result.amount, symbol: result.token };
}

// 이 함수가 실제로 resolve되면 나오는 타입
type TokenBalance = Awaited<ReturnType<typeof getTokenBalance>>;
// = { balance: number; symbol: string }

// 다른 함수에서 이 타입을 그대로 사용
function displayBalance(data: TokenBalance): string {
  return `${data.balance} ${data.symbol}`;
}
// → getTokenBalance 구현이 바뀌면 TokenBalance도, displayBalance의 파라미터 타입도 자동 반영
```

> **핵심:** `Awaited<ReturnType<typeof fn>>`은 "이 async 함수를 await하면 실제로 나오는 값의 타입"을 추출하는 표준 패턴이다.

---

## 7. 타입 가드 — 타입 좁히기 기초

TypeScript는 조건문 안에서 타입을 자동으로 좁힌다(narrow). 이걸 타입 가드라고 한다.

### typeof 가드 — 원시 타입 구분

```typescript
function formatInput(input: string | number): string {
  if (typeof input === 'number') {
    // 이 블록 안에서 input: number (string이 아님이 좁혀짐)
    return input.toFixed(2);    // toFixed는 number의 메서드 → OK
  }
  // 여기서 input: string (위에서 number를 처리했으니 남은 건 string뿐)
  return input.toUpperCase();   // toUpperCase는 string의 메서드 → OK
}
```

### instanceof 가드 — 클래스 인스턴스 구분

```typescript
function handleError(err: unknown): void {
  // err: unknown → .message 접근도 에러. 아무것도 할 수 없다.

  if (err instanceof DeferredError) {
    // 이 블록 안에서 err: DeferredError
    // DeferredError의 모든 필드, 메서드 사용 가능
    console.log(err.message);
    return;
  }

  if (err instanceof Error) {
    // 이 블록 안에서 err: Error
    console.log(err.message);
    return;
  }

  // 여기서 err는 여전히 unknown (위 instanceof 체크를 모두 통과 못 했으므로)
  console.log(String(err));
}
```

강의 코드 catch 블록 표준 패턴:

```typescript
catch (err) {
  // TypeScript 4.0 이후 catch의 err는 unknown
  if (err instanceof DeferredProcessingError) {
    // 재시도 없이 큐로 → DeferredProcessingError 전용 처리
  } else {
    // 일반 재시도 → err가 DeferredProcessingError가 아닌 모든 경우
  }
}
```

**instanceof의 한계:** 클래스 인스턴스에만 쓸 수 있다. 일반 객체 리터럴 `{ id: '...', fields: {} }`에는 사용 불가.

---

## 8. 사용자 정의 타입 가드 (`is` 키워드) — 가장 중요

### 최종 목표부터

외부에서 받은 `unknown` 타입의 값이 특정 인터페이스를 만족하는지 확인하고 싶다.  
`instanceof`는 클래스에만 쓸 수 있어서 일반 객체에는 안 된다.  
`typeof`는 원시 타입(string, number 등)에만 쓸 수 있어서 객체 구조 확인에는 안 된다.

```typescript
interface StreamMessage {
  id: string;
  fields: Record<string, string>;
}

const data: unknown = JSON.parse(rawInput);  // 외부 데이터 → unknown

// data가 StreamMessage인지 확인한 뒤에야 data.id, data.fields에 접근 가능
```

### boolean만 반환하면 TS가 타입을 좁히지 않는다

```typescript
// ❌ boolean만 반환하는 일반 함수
function check(val: unknown): boolean {
  return typeof val === 'object' && val !== null && 'id' in val;
}

if (check(data)) {
  // data는 여전히 unknown!
  console.log(data.id);  // 에러: Object is of type 'unknown'
  //          ↑ TS는 check가 내부에서 무엇을 확인했는지 모른다.
  //            함수 리턴 타입이 boolean이면 "true일 때 val이 어떤 타입이다"라는 정보가 없다.
}
```

이유: TS 컴파일러는 함수 내부를 분석해서 타입을 좁혀주지 않는다. 함수 경계를 넘으면 리턴 타입 선언만 본다.

### `val is T` — 타입 좁히기 정보를 명시한다

```typescript
// ✅ val is StreamMessage → "이 함수가 true를 리턴하면, val은 StreamMessage다"라고 TS에게 알림
function isStreamMessage(val: unknown): val is StreamMessage {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'fields' in val
  );
}

if (isStreamMessage(data)) {
  // data는 StreamMessage 타입으로 좁혀짐!
  console.log(data.id);               // OK
  console.log(data.fields['eventType']); // OK
}
```

리턴 타입 `val is StreamMessage`의 구조:

```
val is StreamMessage
↑       ↑
|       TS에게 알리는 타입:
|       "이 함수가 true를 리턴하면, 이 파라미터는 이 타입이야"
|
함수 파라미터 이름 (반드시 파라미터 이름과 일치해야 함)
```

이건 런타임에는 그냥 `boolean`이다. 컴파일 타임에 TS가 타입 좁히기에 사용하는 메타 정보일 뿐이다.

### before / after 코드로 나란히 비교

```typescript
// ❌ boolean만 반환 → TS가 타입 좁히기 안 함
function check(val: unknown): boolean {
  return typeof val === 'object' && val !== null && 'id' in val;
}

if (check(data)) {
  data.id  // 에러: data는 여전히 unknown
}
```

```typescript
// ✅ val is StreamMessage → TS가 타입 좁혀줌
function isStreamMessage(val: unknown): val is StreamMessage {
  return typeof val === 'object' && val !== null && 'id' in val && 'fields' in val;
}

if (isStreamMessage(data)) {
  data.id  // OK: StreamMessage로 좁혀짐
}
```

런타임 동작은 완전히 동일하다. 차이는 오직 TS에게 "이 조건이 true이면 타입이 뭐다"를 알려주는지 여부다.

### 구현 4단계 분해

```typescript
function isStreamMessage(val: unknown): val is StreamMessage {
  return (
    typeof val === 'object' &&  // 1단계
    val !== null &&              // 2단계
    'id' in val &&               // 3단계
    'fields' in val              // 4단계
  );
}
```

**1단계: `typeof val === 'object'`**

```
val: unknown → string, number, boolean, object, null, undefined 등 무엇이든 될 수 있음

typeof val === 'object' → 객체 범주인지 먼저 확인

  typeof 'abc'      → "string"  → false
  typeof 42         → "number"  → false
  typeof true       → "boolean" → false
  typeof {}         → "object"  → true  ← 원하는 것
  typeof []         → "object"  → true  (배열도 typeof로 보면 "object")
  typeof null       → "object"  → true  ← JS의 유명한 버그 (다음 단계에서 처리)
  typeof undefined  → "undefined" → false

이 체크가 없으면 다음 단계의 'id' in val에서 val이 객체가 아닐 때 런타임 에러!
"in 연산자는 객체에만 쓸 수 있다"
```

**2단계: `val !== null`**

```
1단계에서 typeof val === 'object'가 true여도 val이 null일 수 있다.
null은 객체가 아닌데 typeof null === "object"라는 JS 버그 때문에 1단계를 통과한다.

'id' in null → TypeError: Cannot use 'in' operator to search for 'id' in null
              → 런타임 에러!

val !== null → null이면 false → && 단락평가로 함수 전체가 false → 안전하게 처리됨

빠뜨리면 어떻게 되는지:
  const val = null;
  typeof val === 'object'  → true  (JS 버그)
  'id' in val              → TypeError ← 크래시
```

왜 `val.id !== undefined`로 대신하면 안 되는가:

```typescript
// ❌ 이렇게 하면 에러
function isStreamMessage(val: unknown): val is StreamMessage {
  return val.id !== undefined;
  //     ↑ Property 'id' does not exist on type 'unknown'
  // TS는 val이 unknown인 상태에서 .id 접근 자체를 허용하지 않는다.
  // 타입을 좁히기 전에는 어떤 프로퍼티에도 접근 불가.
}

// 그래서 in 연산자를 쓴다:
// 'id' in val → val 안에 'id'라는 키가 있는지 확인
//              val이 unknown이어도 타입을 먼저 좁히지 않고 사용 가능
```

**3단계: `'id' in val`**

```
in 연산자: "이 객체에 이 키가 존재하는가?" → boolean 반환

'id' in { id: 'abc', name: 'Sharon' }  → true
'id' in { name: 'Sharon' }             → false
'id' in {}                              → false

1단계 + 2단계 덕분에 val이 null이 아닌 객체임이 보장됨.
그래서 in 연산자를 안전하게 쓸 수 있음.

주의: 'id' in val은 id 키가 있는지만 확인한다.
      id의 값이 string인지는 확인하지 않는다.
      → 완벽한 타입 검사가 아니라, JS 런타임에서 가능한 수준의 구조 확인이다.
      → 실전에서는 이 수준으로 충분한 경우가 많다.
```

**4단계: `'fields' in val`**

3단계와 동일한 원리. `StreamMessage`에 `fields` 필드도 있으므로 추가로 확인한다.

### 타입 가드가 true를 리턴할 때 TS가 어떻게 타입을 좁히는가

```typescript
function isStreamMessage(val: unknown): val is StreamMessage { ... }

const data: unknown = JSON.parse(rawInput);
//    ↑ unknown

if (isStreamMessage(data)) {
  // TS 컴파일러가 하는 일:
  // "isStreamMessage가 true를 리턴했다"
  // "리턴 타입 선언이 val is StreamMessage이다"
  // "따라서 이 블록 안에서 data는 StreamMessage다"
  // → data의 타입을 unknown에서 StreamMessage로 좁힌다

  data.id     // OK: StreamMessage에 id가 있음
  data.fields // OK: StreamMessage에 fields가 있음
}

// if 블록 밖에서는 data는 여전히 unknown
data.id // 에러: unknown
```

---

## 9. 에러 안전 추출 패턴 — `toError`

### 왜 catch 블록에서 `err`가 `unknown`인가

JavaScript에서는 어떤 값이든 throw할 수 있다:

```typescript
throw 'string error'    // → catch에서 err: string
throw 42                // → catch에서 err: number
throw { code: 500 }     // → catch에서 err: 일반 객체
throw new Error('msg')  // → catch에서 err: Error
throw null              // → catch에서 err: null
```

그래서 TypeScript 4.0 이후 catch 블록의 `err`는 `unknown`으로 처리된다.  
`unknown`이므로 `.message`에 직접 접근하면 에러가 난다.

### before / after 비교

```typescript
// ❌ err를 Error로 가정하면
try {
  await riskyOperation();
} catch (err) {
  console.log(err.message);  // 에러: err is unknown. .message 접근 불가
}
```

```typescript
// ✅ toError 패턴으로 안전하게 변환
function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  // err가 이미 Error 인스턴스이면 그대로 반환

  return new Error(String(err));
  // 아니면 문자열로 변환해서 Error 객체로 감쌈
  // String(null)      = "null"
  // String(42)        = "42"
  // String({})        = "[object Object]"
  // String('msg')     = "msg"
}

try {
  await riskyOperation();
} catch (err) {
  const error = toError(err);     // 항상 Error 타입으로 변환됨
  logger.error(error.message);    // OK: error는 Error 타입이 보장됨
}
```

### 흐름 정리

```
throw X (어떤 값이든 가능)
  ↓
catch (err) → err: unknown
  ↓
toError(err)
  ├─ err instanceof Error → 그대로 리턴
  └─ 아니면 → new Error(String(err)) → Error로 포장
  ↓
error: Error → .message 안전하게 접근 가능
```

> **핵심:** catch 블록의 err는 항상 unknown으로 다뤄야 한다. toError 같은 헬퍼로 Error 타입으로 통일하는 것이 표준 패턴이다.

---

## 유틸리티 타입 요약표

| 유틸리티 | 내부 구현 핵심 | 효과 | 핵심 사용 사례 |
|---|---|---|---|
| `Partial<T>` | `[K in keyof T]?: T[K]` | 모든 필드 optional | PATCH 업데이트 요청 타입 |
| `Required<T>` | `[K in keyof T]-?: T[K]` | 모든 optional 제거 | 설정값 완성 후 보장 |
| `Pick<T, K>` | `[P in K]: T[P]` | 지정 필드만 선택 | 목록/요약 응답 타입 |
| `Omit<T, K>` | `Pick<T, Exclude<keyof T, K>>` | 지정 필드 제거 | 생성 요청 타입 (id, createdAt 제외) |
| `ReturnType<T>` | 내장 (infer R 사용) | 함수 리턴 타입 추출 | 함수 기반 타입 재사용 |
| `Awaited<T>` | 재귀적 Promise 언래핑 | Promise 내부 타입 | async 함수의 실제 값 타입 |

> **핵심:** Partial/Required/Pick은 모두 mapped type(`[K in keyof T]`) 기반. 패턴을 이해하면 직접 커스텀 변형 타입도 만들 수 있다.

---

## 체크리스트

- [ ] `Partial<T>`의 내부 `[K in keyof T]?:` 가 무슨 뜻인지 토큰 단위로 설명할 수 있다
- [ ] `Required<T>`의 `-?`가 Partial의 `?`와 어떻게 반대인지 설명할 수 있다
- [ ] `Omit<T, K>`이 `Pick + Exclude`로 구현되는 것을 단계별로 풀 수 있다
- [ ] `Pick`과 `Omit`의 선택 기준을 설명할 수 있다
- [ ] `ReturnType<typeof fn>`에서 `typeof`가 왜 필요한지, "값의 세계 vs 타입의 세계" 개념으로 설명할 수 있다
- [ ] `fetchBalance → typeof fetchBalance → ReturnType<typeof fetchBalance>` 3단계를 각각 설명할 수 있다
- [ ] `Awaited<ReturnType<typeof fn>>`이 무엇을 추출하는지 설명할 수 있다
- [ ] `Promise<Promise<string>>`에서 `Awaited`가 왜 `string`을 돌려주는지 설명할 수 있다
- [ ] `boolean` 반환 함수와 `val is T` 반환 함수의 차이를 코드로 보여줄 수 있다
- [ ] `isStreamMessage` 구현의 4단계(typeof, null, in id, in fields)가 각각 왜 필요한지 설명할 수 있다
- [ ] `typeof null === 'object'`가 JS 버그이고, 이 때문에 `val !== null` 체크가 필요한 이유를 안다
- [ ] `'id' in val`이 `val.id !== undefined`보다 왜 안전한지 (unknown 상태의 프로퍼티 접근 불가) 설명할 수 있다
- [ ] catch 블록에서 err가 unknown인 이유와 toError 패턴이 왜 필요한지 설명할 수 있다

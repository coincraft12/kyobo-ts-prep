# CH08 — 유틸리티 타입 + 타입 가드

## 핵심 한 줄
> 유틸리티 타입 = 기존 타입을 변형하는 TS 내장 도구. 직접 쓰기보다 강의 코드에서 읽을 수 있으면 된다.

---

## 1. Partial\<T\> — 모든 필드를 선택적으로

### 기본 사용

```typescript
interface MintRequest {
  id: string;
  toAddress: string;
  tokenId: string;
  memo: string;
}

type MintRequestUpdate = Partial<MintRequest>;
// = { id?: string; toAddress?: string; tokenId?: string; memo?: string }
//       ↑ 모든 필드에 ?가 붙었다. 즉, 있어도 되고 없어도 된다.
```

### 내부에서 어떻게 동작하는가 (mapped type)

`Partial<T>`는 TS 내장이지만, 내부 구현을 풀어 쓰면 이렇다:

```typescript
// Partial<T>의 실제 구현
type Partial<T> = {
  [K in keyof T]?: T[K];
  // ↑ "T의 모든 키(K)에 대해, 선택적(?) 필드로 만들고, 값 타입은 T[K]"
};

// 예시: T = MintRequest 일 때
// keyof MintRequest = 'id' | 'toAddress' | 'tokenId' | 'memo'
// 각 키에 ?를 붙이면:
// { id?: string; toAddress?: string; tokenId?: string; memo?: string }
```

`[K in keyof T]`는 "T의 모든 키를 순회한다"는 뜻이다. `?`는 선택적으로 만들고, `T[K]`는 "T에서 K라는 키의 값 타입"을 뜻한다.

### 언제 쓰는가 — PATCH 요청 패턴

```typescript
// 잘못된 방법: 업데이트에 MintRequest를 그대로 쓰면?
async function updateRequest(id: string, patch: MintRequest): Promise<void> {
  // MintRequest의 모든 필드가 필수 → toAddress만 바꾸고 싶어도
  // id, tokenId, memo 전부 넘겨야 함 → 불편하고 실수 가능성 높음
}

// 올바른 방법: Partial<MintRequest>
async function updateRequest(id: string, patch: Partial<MintRequest>): Promise<void> {
  // patch에는 바꿀 필드만 있으면 됨
}

await updateRequest('req-001', { toAddress: '0xBBB' });        // toAddress만 변경 → OK
await updateRequest('req-001', { memo: '변경된 메모' });         // memo만 변경 → OK
await updateRequest('req-001', { toAddress: '0xBBB', memo: '변경' }); // 둘 다 → OK
```

실수하기 쉬운 부분: `Partial`을 쓰면 모든 필드가 optional이 되므로, "적어도 하나는 있어야 한다"는 제약을 걸 수 없다. 빈 객체 `{}`도 허용된다.

---

## 2. Pick\<T, K\> — 필드 선택

### 기본 사용

```typescript
type MintSummary = Pick<MintRequest, 'id' | 'tokenId' | 'toAddress'>;
// = { id: string; tokenId: string; toAddress: string }
// memo는 없다. 명시한 필드만 남는다.
```

### 내부에서 어떻게 동작하는가 (mapped type)

```typescript
// Pick<T, K>의 실제 구현
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
  // ↑ "K에 있는 키(P)에 대해서만, 값 타입은 T[P]"
};

// 예시: T = MintRequest, K = 'id' | 'tokenId' | 'toAddress'
// K에 있는 키만 순회 → id, tokenId, toAddress
// 각각 MintRequest에서의 타입 그대로 → string, string, string
// 결과: { id: string; tokenId: string; toAddress: string }
```

`K extends keyof T`는 "K는 반드시 T의 키 중에서만 골라야 한다"는 제약이다. 존재하지 않는 필드를 Pick하려 하면 에러가 난다.

### 언제 쓰는가 — 목록 응답, 요약 정보

```typescript
// 전체 MintRequest를 목록에 보여주면 불필요한 데이터까지 전송됨
// → 목록에서는 요약 정보만 필요

type MintSummary = Pick<MintRequest, 'id' | 'tokenId' | 'toAddress'>;

async function listMints(): Promise<MintSummary[]> {
  // id, tokenId, toAddress만 반환 — 나머지 필드는 상세 조회에서만
}
```

---

## 3. Omit\<T, K\> — 필드 제거

### 기본 사용

```typescript
type MintRequestCreate = Omit<MintRequest, 'id' | 'createdAt'>;
// = { toAddress: string; tokenId: string; memo: string }
// id, createdAt만 빠지고 나머지는 그대로 남는다.
```

### 내부에서 어떻게 동작하는가

`Omit`은 `Pick`과 `Exclude`를 조합한 것이다:

```typescript
// Omit<T, K>의 실제 구현
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
// "T의 키에서 K를 제외한 나머지를 Pick한다"

// 예시: T = MintRequest, K = 'id' | 'createdAt'
// keyof MintRequest = 'id' | 'toAddress' | 'tokenId' | 'memo' | 'createdAt'
// Exclude<..., 'id' | 'createdAt'> = 'toAddress' | 'tokenId' | 'memo'
// Pick<MintRequest, 'toAddress' | 'tokenId' | 'memo'>
// = { toAddress: string; tokenId: string; memo: string }
```

### 언제 쓰는가 — 생성 요청 타입

```typescript
// 생성 시점에는 서버가 자동으로 채워주는 필드가 있다.
// id → 서버가 UUID 생성
// createdAt → 서버가 현재 시각 기록
// 클라이언트가 이걸 직접 넣으면 오히려 문제

type MintRequestCreate = Omit<MintRequest, 'id' | 'createdAt'>;

async function createMintRequest(data: MintRequestCreate): Promise<MintRequest> {
  // 서버에서 id, createdAt을 붙여서 완성된 MintRequest를 리턴
}

// 호출 시 id, createdAt을 넣을 필요 없음 (넣으면 타입 에러)
createMintRequest({
  toAddress: '0xAAA',
  tokenId: 'token-001',
  memo: '최초 발행',
}); // OK
```

### Pick vs Omit 선택 기준

```
전체 필드: id, toAddress, tokenId, memo, chainId, createdAt, status (7개)

남기고 싶은 게 2개 → Pick<T, 'id' | 'tokenId'>   (2개 나열)
제거하고 싶은 게 2개 → Omit<T, 'id' | 'createdAt'>  (2개 나열)

남길 게 많으면 Omit (제거할 것을 나열 → 더 짧음)
남길 게 적으면 Pick (남길 것을 나열 → 더 짧음)
```

---

## 4. Required\<T\> — 모든 optional을 필수로

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

### 내부에서 어떻게 동작하는가

```typescript
// Required<T>의 실제 구현
type Required<T> = {
  [K in keyof T]-?: T[K];
  //             ↑ -? 는 "?를 제거한다"는 의미 (Partial의 ?와 반대)
};
```

`Partial`의 반대다.

### 언제 쓰는가 — 설정 유효성 검사

```typescript
// 설정은 처음에 모두 optional로 받는다 (일부만 지정 가능)
function createConfig(partial: Config): FullConfig {
  return {
    host: partial.host ?? 'localhost',
    port: partial.port ?? 8080,
    debug: partial.debug ?? false,
  };
  // 리턴 타입 FullConfig → 모든 필드가 확정적으로 있음이 보장됨
}

// 이후로는 FullConfig를 쓴다 → host, port, debug가 반드시 있음을 TS가 안다
```

---

## 5. ReturnType\<T\> — 함수 리턴 타입 추출

### 기본 사용

```typescript
function getTokenInfo() {
  return { tokenId: 'token-1', supply: 1000, paused: false };
}

type TokenInfo = ReturnType<typeof getTokenInfo>;
// = { tokenId: string; supply: number; paused: boolean }
```

### `typeof`가 여기서 왜 필요한가

이게 처음 보면 헷갈리는 부분이다. `typeof`의 역할을 이해해야 한다.

TypeScript에는 두 세계가 있다:
- **값(value)의 세계**: 런타임에 실제로 존재하는 것. 변수, 함수, 객체 등.
- **타입(type)의 세계**: 컴파일 타임에만 존재하는 것. `interface`, `type`, 제네릭 등.

`ReturnType<T>`에서 T 자리에는 **타입**이 들어가야 한다.  
그런데 `getTokenInfo`는 **값**이다 (함수 자체).

```typescript
ReturnType<getTokenInfo>        // 에러! getTokenInfo는 값이지 타입이 아님
ReturnType<typeof getTokenInfo> // OK! typeof로 값에서 타입을 추출함
```

**`typeof fn`과 `ReturnType<typeof fn>`의 차이:**

```typescript
function fetchBalance(address: string): Promise<number> {
  return Promise.resolve(1000);
}

// typeof fetchBalance → 함수 자체의 타입
// = (address: string) => Promise<number>
// "인자로 string 받고, Promise<number> 리턴하는 함수"라는 타입

// ReturnType<typeof fetchBalance> → 그 함수가 리턴하는 타입
// = Promise<number>
// "이 함수가 리턴하는 것의 타입"
```

정리:
```
fetchBalance          → 값 (함수 그 자체)
typeof fetchBalance   → 타입 (함수의 타입: (address: string) => Promise<number>)
ReturnType<typeof fetchBalance> → 타입 (리턴 타입: Promise<number>)
```

### 언제 쓰는가 — 함수와 타입 정의를 동기화

```typescript
// 문제: 별도 interface로 리턴 타입을 정의하면 함수 수정 시 둘 다 바꿔야 함
interface TokenInfo {
  tokenId: string;
  supply: number;
  paused: boolean;
}
function getTokenInfo(): TokenInfo { ... }
// → getTokenInfo에 필드 추가하면 TokenInfo도 직접 수정해야 함

// 해결: 함수에서 리턴 타입을 추출 → 항상 동기화됨
function getTokenInfo() {
  return { tokenId: 'token-1', supply: 1000, paused: false };
}
type TokenInfo = ReturnType<typeof getTokenInfo>;
// → getTokenInfo에 필드 추가하면 TokenInfo도 자동으로 반영됨
```

---

## 6. Awaited\<T\> — Promise 안의 타입

```typescript
async function fetchUser() {
  return { id: 'user-001', name: 'Sharon' };
}

// ReturnType만 쓰면:
type Step1 = ReturnType<typeof fetchUser>;
// = Promise<{ id: string; name: string }>
// async 함수의 리턴 타입은 항상 Promise<X>임

// Awaited로 Promise를 벗기면:
type User = Awaited<ReturnType<typeof fetchUser>>;
// = { id: string; name: string }
// Promise가 벗겨지고 실제 값의 타입만 남음
```

**단계별 분해:**

```
fetchUser                           → async 함수 (값)
typeof fetchUser                    → () => Promise<{ id: string; name: string }> (타입)
ReturnType<typeof fetchUser>        → Promise<{ id: string; name: string }> (타입)
Awaited<ReturnType<typeof fetchUser>> → { id: string; name: string } (타입)
```

`Awaited`는 `Promise<T>`에서 `T`를 꺼낸다. 중첩된 Promise도 처리한다:

```typescript
type A = Awaited<Promise<string>>;           // = string
type B = Awaited<Promise<Promise<string>>>;  // = string (중첩도 처리)
```

---

## 7. 타입 가드 — 타입 좁히기

TS는 조건문 안에서 타입을 자동으로 좁힌다(narrow). 이걸 타입 가드라고 한다.

### instanceof 가드

클래스 인스턴스인지 확인할 때 사용한다.

```typescript
function handleError(err: unknown): void {
  // err: unknown → 아무것도 모름. .message 접근도 에러
  
  if (err instanceof DeferredError) {
    // 이 블록 안에서 err: DeferredError
    // → DeferredError의 모든 필드, 메서드 사용 가능
    console.log(err.message);
    return;
  }
  
  if (err instanceof Error) {
    // 이 블록 안에서 err: Error
    console.log(err.message);
    return;
  }
  
  // 여기서 err는 여전히 unknown
  // (위의 instanceof 체크를 통과 못 했으므로)
  console.log(String(err));
}
```

**instanceof의 한계:** 클래스 인스턴스에만 쓸 수 있다. 일반 객체 리터럴에는 사용 불가.

강의 코드에서 catch 블록의 표준 패턴:

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

### typeof 가드

원시 타입(string, number, boolean 등)을 구분할 때 사용한다.

```typescript
function formatInput(input: string | number): string {
  if (typeof input === 'number') {
    // 이 블록 안에서 input: number
    return input.toFixed(2);    // toFixed는 number의 메서드 → OK
  }
  // 여기서 input: string (number를 위에서 처리했으니)
  return input.toUpperCase();   // toUpperCase는 string의 메서드 → OK
}
```

---

## 8. 사용자 정의 타입 가드 (is 키워드) — 핵심

`instanceof`와 `typeof`로 커버 안 되는 경우가 있다. 특히 **외부에서 받은 `unknown` 값이 특정 인터페이스를 만족하는지 확인**할 때.

### 문제: boolean만 반환하면 TS가 타입을 좁히지 않는다

```typescript
// boolean만 반환하는 일반 함수
function check(val: unknown): boolean {
  return typeof val === 'object' && val !== null && 'id' in val;
}

const data: unknown = JSON.parse(rawInput);

if (check(data)) {
  // data는 여전히 unknown!
  console.log(data.id);  // 에러: Object is of type 'unknown'
  //          ↑ TS가 "check가 true이면 data가 뭔 타입이다"를 모름
}
```

이유: TS는 `check` 함수가 내부적으로 무엇을 확인하는지 알 수 없다. 함수의 리턴 타입이 `boolean`이면, "true가 반환됐을 때 val이 어떤 타입이다"라는 정보가 없다.

### 해결: `val is T` — 타입 좁히기 정보를 명시한다

```typescript
// val is StreamMessage → "이 함수가 true를 리턴하면, val은 StreamMessage다"
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
  console.log(data.id);              // OK: StreamMessage에 id가 있음
  console.log(data.fields['eventType']); // OK
}
```

**리턴 타입 `val is StreamMessage`의 의미:**

```
val is StreamMessage
↑    ↑
|    TS에게 알리는 타입: "이 함수가 true를 리턴하면, val은 이 타입이야"
|
함수 파라미터 이름 (val)과 일치해야 함
```

이건 런타임에는 그냥 boolean이다. 컴파일 타임에 TS가 타입 좁히기에 사용하는 정보일 뿐이다.

### 두 버전의 비교

```typescript
// 버전 1: boolean만 반환 → TS가 타입 좁히기 안 함
function check(val: unknown): boolean {
  return typeof val === 'object' && val !== null && 'id' in val;
}

if (check(data)) {
  data.id // 에러: data는 여전히 unknown
}

// 버전 2: val is StreamMessage → TS가 타입 좁혀줌
function isStreamMessage(val: unknown): val is StreamMessage {
  return typeof val === 'object' && val !== null && 'id' in val && 'fields' in val;
}

if (isStreamMessage(data)) {
  data.id // OK: StreamMessage로 좁혀짐
}
```

런타임 동작은 완전히 동일하다. 차이는 오직 TS에게 "이 조건이 true이면 타입이 뭐다"를 알려주는지 여부다.

### 구현 단계별 분해

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

typeof val === 'object' → 객체인지 확인
→ string이면 false (typeof "abc" === "string")
→ number이면 false
→ {}이면 true
→ []이면 true (배열도 typeof로 보면 "object")
→ null이면 true (자바스크립트의 유명한 버그: typeof null === "object")

이 체크가 없으면 다음 단계에서 문제 발생.
특히 3단계의 'id' in val 에서 val이 객체가 아니면 런타임 에러!
```

**2단계: `val !== null`**

```
1단계에서 typeof val === 'object'가 true여도 val이 null일 수 있다.
null은 객체가 아닌데 typeof null === "object"라는 JS의 버그 때문.

'id' in null → 런타임 에러 (null에는 in 연산자 사용 불가)

그래서 null을 명시적으로 걸러내야 한다.
val !== null → null이면 false → 함수 전체가 false → 문제 없음

이 체크를 빠뜨리면:
  const val = null;
  typeof val === 'object'  → true (버그)
  'id' in val              → TypeError: Cannot use 'in' operator to search for 'id' in null
```

왜 단순히 `val.id !== undefined`로 안 하는가:

```typescript
// 이렇게 하면 안 되는 이유
function isStreamMessage(val: unknown): val is StreamMessage {
  return val.id !== undefined;  // 에러! val이 unknown이라 .id 접근 자체가 에러
  //     ↑ Property 'id' does not exist on type 'unknown'
}
```

`val`이 `unknown`인 상태에서는 `.id` 접근 자체를 TS가 허용하지 않는다. 타입이 확정되지 않은 값의 프로퍼티에 접근하려면 먼저 타입을 좁혀야 한다.

**3단계: `'id' in val`**

```
in 연산자: 객체에 해당 키가 존재하는지 boolean을 반환한다.

'id' in val → val 객체에 'id'라는 키가 있으면 true

예시:
'id' in { id: 'abc', name: 'Sharon' }  → true
'id' in { name: 'Sharon' }             → false
'id' in {}                              → false

1단계와 2단계 덕분에 val이 null이 아닌 객체임이 보장됨.
그래서 in 연산자를 안전하게 쓸 수 있음.

주의: 'id' in val은 id 키가 있는지만 확인한다. id의 값이 string인지는 확인하지 않는다.
→ 완벽한 타입 검사가 아니라, 런타임에서 가능한 선에서의 구조 확인이다.
```

**4단계: `'fields' in val`**

3단계와 동일한 원리. `StreamMessage`에 `fields` 필드도 있으므로 확인한다.

---

## 9. 에러 안전 추출 패턴

catch 블록에서 `err`는 TypeScript 4.0 이후 `unknown`이다.

```typescript
// 잘못된 코드: catch(err)에서 err를 Error로 가정
try {
  await riskyOperation();
} catch (err) {
  console.log(err.message);  // 에러: err is unknown. .message 접근 불가
}

// 올바른 패턴: toError로 안전하게 변환
function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  // err가 이미 Error 인스턴스이면 그대로 반환

  return new Error(String(err));
  // 아니면 문자열로 변환해서 Error 객체로 감쌈
  // String(null) = "null", String(42) = "42", String({}) = "[object Object]"
}

try {
  await riskyOperation();
} catch (err) {
  const error = toError(err);  // 항상 Error 타입으로 변환
  logger.error(error.message); // OK: error는 Error 타입이 보장됨
}
```

이 패턴이 필요한 이유:

```
try/catch에서 던질 수 있는 것은 어떤 값이든 가능:
throw 'string error'   → err: string
throw 42               → err: number
throw { code: 500 }    → err: 객체
throw new Error('msg') → err: Error

TS는 이를 반영해서 err를 unknown으로 처리.
→ toError로 모든 케이스를 Error로 통일.
```

---

## 유틸리티 타입 요약표

| 유틸리티 | 설명 | 핵심 사용 사례 |
|---------|------|--------------|
| `Partial<T>` | 모든 필드 optional | PATCH 업데이트 요청 타입 |
| `Required<T>` | 모든 optional 제거 | 설정값 완성 후 보장 |
| `Pick<T, K>` | 일부 필드만 선택 | 목록/요약 응답 타입 |
| `Omit<T, K>` | 일부 필드 제거 | 생성 요청 타입 (id, createdAt 제외) |
| `Record<K, V>` | key-value 객체 | 상태 전이 맵, 딕셔너리 |
| `ReturnType<T>` | 함수 리턴 타입 추출 | 함수 기반 타입 재사용 |
| `Awaited<T>` | Promise 내부 타입 | async 함수의 실제 값 타입 |

---

## 체크리스트

- [ ] `Partial<T>`가 왜 업데이트 요청에 쓰이는지 설명할 수 있다
- [ ] `Partial<T>` 내부가 mapped type으로 동작함을 안다
- [ ] `Pick`과 `Omit`의 차이를 설명할 수 있다. 언제 Pick, 언제 Omit을 쓰는지 안다
- [ ] `ReturnType<typeof fn>`에서 `typeof`가 왜 필요한지 설명할 수 있다
- [ ] `typeof fn`과 `ReturnType<typeof fn>`의 차이를 안다
- [ ] `instanceof` 타입 가드가 catch 블록에서 왜 필요한지 안다
- [ ] `typeof`로 타입을 좁히는 원리를 안다
- [ ] `val is StreamMessage`가 boolean 리턴과 다른 점을 설명할 수 있다
- [ ] `isStreamMessage` 구현에서 각 체크(typeof, null, in)가 왜 그 순서로 있는지 설명할 수 있다
- [ ] `'id' in val`이 `val.id !== undefined`보다 왜 안전한지 설명할 수 있다

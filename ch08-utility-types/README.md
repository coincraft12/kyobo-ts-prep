# CH08 — 유틸리티 타입 + 타입 가드

## 핵심 한 줄
> 유틸리티 타입 = 기존 타입을 변형하는 TS 내장 도구. 직접 쓰기보다 강의 코드에서 읽을 수 있으면 된다.

---

## 1. Partial\<T\> — 모든 필드를 선택적으로

```typescript
interface MintRequest {
  id: string;
  toAddress: string;
  tokenId: string;
  memo: string;
}

type MintRequestUpdate = Partial<MintRequest>;
// = { id?: string; toAddress?: string; tokenId?: string; memo?: string }
```

왜 쓰나: 업데이트할 때 변경할 필드만 받고 싶을 때.

```typescript
async function updateRequest(id: string, patch: Partial<MintRequest>): Promise<void> {
  // patch에는 바꿀 필드만 있으면 됨
}

await updateRequest('req-001', { toAddress: '0xBBB' });  // toAddress만 변경
```

---

## 2. Pick\<T, K\> — 필드 선택

```typescript
type MintSummary = Pick<MintRequest, 'id' | 'tokenId' | 'toAddress'>;
// = { id: string; tokenId: string; toAddress: string }
// memo, chainId 등 나머지는 없음
```

왜 쓰나: 전체 타입 중 일부 필드만 필요한 경우.

---

## 3. Omit\<T, K\> — 필드 제거

```typescript
type MintRequestCreate = Omit<MintRequest, 'id' | 'createdAt'>;
// = { toAddress: string; tokenId: string; chainId: number; memo: string }
// id, createdAt만 빠짐
```

왜 쓰나: 생성 시점에는 서버가 자동 채우는 필드(id, createdAt 등)를 제외할 때.

Pick vs Omit:
- `Pick` — 남길 것을 나열
- `Omit` — 제거할 것을 나열
- 남길 게 많으면 Omit, 남길 게 적으면 Pick

---

## 4. Required\<T\> — 모든 optional을 필수로

```typescript
interface Config {
  host?: string;
  port?: number;
}

type FullConfig = Required<Config>;
// = { host: string; port: number }  (? 가 사라짐)
```

`Partial`의 반대. 설정 유효성 검사 등에 사용.

---

## 5. ReturnType\<T\> — 함수 리턴 타입 추출

```typescript
function getTokenInfo() {
  return { tokenId: 'token-1', supply: 1000, paused: false };
}

type TokenInfo = ReturnType<typeof getTokenInfo>;
// = { tokenId: string; supply: number; paused: boolean }
```

왜 쓰나: 함수 리턴 타입을 별도 interface로 정의하지 않고, 함수 자체에서 뽑아낼 때.

`typeof`와 함께 사용: `typeof getTokenInfo`는 "함수 자체의 타입"을 가리킴.

---

## 6. Awaited\<T\> — Promise 안의 타입

```typescript
async function fetchUser() {
  return { id: 'user-001', name: 'Sharon' };
}

type User = Awaited<ReturnType<typeof fetchUser>>;
// ReturnType → Promise<{ id: string; name: string }>
// Awaited → { id: string; name: string }
```

`ReturnType`과 `Awaited`를 조합하면 async 함수의 실제 값 타입을 뽑을 수 있다.

---

## 7. 타입 가드 — 타입 좁히기

TS는 조건문 안에서 타입을 자동으로 좁힌다.

### instanceof 가드

```typescript
function handleError(err: unknown): void {
  if (err instanceof DeferredError) {
    // 여기서 err는 DeferredError 타입
    console.log(err.message);
    return;
  }
  if (err instanceof Error) {
    // 여기서 err는 Error 타입
    console.log(err.message);
    return;
  }
  // 여기서 err는 여전히 unknown
  console.log(String(err));
}
```

강의 코드에서 catch 블록의 표준 패턴:
```typescript
catch (err) {
  if (err instanceof DeferredProcessingError) {
    // 재시도 없이 큐로
  } else {
    // 일반 재시도
  }
}
```

### typeof 가드

```typescript
function formatInput(input: string | number): string {
  if (typeof input === 'number') {
    return input.toFixed(2);    // 여기서 input은 number
  }
  return input.toUpperCase();   // 여기서 input은 string
}
```

### 사용자 정의 타입 가드 (is 키워드)

외부에서 받은 unknown 값이 특정 타입인지 확인할 때:

```typescript
function isStreamMessage(val: unknown): val is StreamMessage {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'fields' in val
  );
}

// 사용
if (isStreamMessage(rawData)) {
  // 여기서 rawData는 StreamMessage 타입으로 좁혀짐
  console.log(rawData.fields['eventType']);
}
```

`val is StreamMessage` — "이 함수가 true를 리턴하면, val은 StreamMessage다"를 TS에게 알려주는 것.

---

## 8. 에러 안전 추출 패턴

catch 블록에서 err는 unknown. 안전하게 Error로 변환하는 표준 패턴:

```typescript
function toError(err: unknown): Error {
  if (err instanceof Error) return err;
  return new Error(String(err));
}

try {
  await riskyOperation();
} catch (err) {
  const error = toError(err);
  logger.error(error.message);
}
```

---

---

## 생소한 문법 해설

### `val is StreamMessage` — 타입 서술어(type predicate) 상세

```typescript
function isStreamMessage(val: unknown): val is StreamMessage {
  return (
    typeof val === 'object' &&
    val !== null &&
    'id' in val &&
    'fields' in val
  );
}
```

반환 타입 `val is StreamMessage`의 의미: "이 함수가 `true`를 반환하면, 호출한 쪽에서 `val`을 `StreamMessage` 타입으로 취급해라"는 TS 컴파일러에 대한 약속이다.

```typescript
const rawData: unknown = { id: 'msg-001', fields: {} };

if (isStreamMessage(rawData)) {
  rawData.fields['eventType'];  // OK — TS가 StreamMessage로 인식
} else {
  rawData.fields;               // 에러 — 여기선 여전히 unknown
}
```

`'id' in val` — `in` 연산자: 객체에 해당 키가 존재하는지 확인. `val !== null` 체크가 앞에 있어야 안전하다 (null도 `object`이기 때문).

### `Awaited<ReturnType<typeof fetchUser>>` — 단계별 분해

```typescript
async function fetchUser() {
  return { id: 'user-001', name: 'Sharon' };
}

type User = Awaited<ReturnType<typeof fetchUser>>;
```

**1단계 — `typeof fetchUser`**
```typescript
// 함수 자체의 타입
() => Promise<{ id: string; name: string }>
```

**2단계 — `ReturnType<typeof fetchUser>`**
```typescript
// 함수의 반환 타입
Promise<{ id: string; name: string }>
```

**3단계 — `Awaited<Promise<{ id: string; name: string }>>`**
```typescript
// Promise 안의 실제 값 타입
{ id: string; name: string }
```

`async` 함수는 항상 `Promise<T>`를 반환한다. `Awaited`로 감싸면 `await`했을 때 얻는 타입 `T`를 뽑아낼 수 있다.

### `{ ...data }` — spread로 Omit 타입 채우기

```typescript
type MintRequestCreate = Omit<MintRequest, 'id' | 'createdAt'>;

function createRequest(data: MintRequestCreate): MintRequest {
  return {
    id: `req-${Date.now()}`,
    createdAt: new Date(),
    ...data,           // 나머지 필드를 그대로 복사
  };
}
```

`Omit<MintRequest, 'id' | 'createdAt'>`은 `id`와 `createdAt`을 제외한 나머지 필드다.  
`...data`로 펼치면 `toAddress`, `tokenId` 등 나머지 필드가 자동으로 채워진다.

### `'id' in val` — in 연산자

```typescript
typeof val === 'object' &&
val !== null &&
'id' in val &&      // val 객체에 'id' 키가 있는지 확인
'fields' in val
```

`'키' in 객체` — 해당 키가 객체에 존재하면 `true`. 값이 `undefined`여도 키가 있으면 `true`다.  
타입 가드에서 인터페이스의 필수 필드 존재 여부를 확인할 때 사용한다.

---

## 유틸리티 타입 요약표

| 유틸리티 | 설명 | 예 |
|---------|------|-----|
| `Partial<T>` | 모든 필드 optional | 업데이트 요청 타입 |
| `Required<T>` | 모든 optional 제거 | 완성된 설정 타입 |
| `Pick<T, K>` | 일부 필드만 선택 | 요약 정보 타입 |
| `Omit<T, K>` | 일부 필드 제거 | 생성 요청 타입 |
| `Record<K, V>` | key-value 객체 | 상태 전이 맵 |
| `ReturnType<T>` | 함수 리턴 타입 추출 | 함수 결과 타입 재사용 |
| `Awaited<T>` | Promise 내부 타입 | async 함수 값 타입 |

---

## 체크리스트

- [ ] `Partial<T>`가 왜 업데이트 요청에 쓰이는지 설명할 수 있다
- [ ] `Pick`과 `Omit`의 차이를 설명할 수 있다
- [ ] `instanceof` 타입 가드가 catch 블록에서 왜 필요한지 안다
- [ ] `typeof`로 타입을 좁히는 원리를 안다
- [ ] `ReturnType<typeof fn>`이 뭘 하는지 설명할 수 있다
- [ ] `val is T` 타입 서술어가 일반 boolean 반환과 무엇이 다른지 설명할 수 있다
- [ ] `Awaited<ReturnType<typeof fn>>`을 단계별로 풀이할 수 있다

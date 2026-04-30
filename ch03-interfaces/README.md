# CH03 — 인터페이스와 타입

## 핵심 한 줄
> interface = "이 객체는 이런 형태여야 한다"는 약속. 런타임에는 사라지고 컴파일 시점에만 존재한다.

---

## 1. interface 기본

```typescript
interface MintRequest {
  id: string;
  toAddress: string;
  tokenId: string;
  memo?: string;       // ?: 선택적 필드 — 없어도 됨
}
```

이 interface를 만족하는 객체:
```typescript
const req: MintRequest = {
  id: 'req-001',
  toAddress: '0xAAA',
  tokenId: 'token-1',
  // memo 없어도 OK
};
```

interface를 만족하지 않으면 컴파일 에러:
```typescript
const req: MintRequest = {
  id: 'req-001',
  // toAddress 빠짐 → 에러
  tokenId: 'token-1',
};
```

---

## 2. readonly — 필드 변경 금지

```typescript
interface MintRequest {
  readonly id: string;    // 할당 후 변경 불가
  toAddress: string;
}

const req: MintRequest = { id: 'req-001', toAddress: '0xAAA' };
req.toAddress = '0xBBB';  // OK
req.id = 'req-002';       // 에러: readonly 필드는 변경 불가
```

왜 쓰나: 한 번 정해진 값이 바뀌면 안 될 때 (ID, 생성 시각 등).

---

## 3. 메서드 시그니처

interface 안에 메서드를 정의하면 "이 메서드를 구현해야 한다"는 약속이 된다:

```typescript
interface TxRepository {
  findById(id: string): Promise<MintRequest | null>;
  save(req: MintRequest): Promise<void>;
}
```

읽는 법:
- `findById(id: string)` — id라는 string 매개변수를 받고
- `: Promise<MintRequest | null>` — MintRequest 또는 null을 나중에 반환하겠다

---

## 4. 강의 핵심 인터페이스 패턴

```typescript
interface EventProcessor {
  eventTypes: string[];                                  // 처리할 이벤트 타입 목록
  process(message: StreamMessage): Promise<void>;        // 처리 메서드
}
```

이 interface 덕분에 가능한 것:
```typescript
const processors: EventProcessor[] = [processorA, processorB, processorC];

// 타입을 몰라도 같은 방식으로 사용 가능
const matched = processors.filter(p => p.eventTypes.includes(eventType));
await Promise.all(matched.map(p => p.process(msg)));
```

processorA, processorB, processorC가 서로 달라도 `EventProcessor`를 만족하면 배열에 함께 넣고 같은 방식으로 쓸 수 있다.

---

## 5. union 타입 — 여러 타입 중 하나

```typescript
let x: string | number;
x = 'hello';  // OK
x = 42;       // OK
x = true;     // 에러
```

### 문자열 리터럴 union — 상태 머신에서 핵심 패턴

```typescript
type TxStatus =
  | 'REQUESTED'
  | 'SUBMITTED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'FAILED';
```

이렇게 하면:
```typescript
let status: TxStatus = 'SUBMITTED';  // OK
let status: TxStatus = 'PROCESSING'; // 에러: 목록에 없음
```

단순 `string`과 달리 **정해진 값만 허용**된다. 강의에서 상태값, 이벤트 타입, 체인 종류 등에 사용.

---

## 6. Record<K, V> — 객체 타입 단축

```typescript
// 길게 쓰면
const fields: { [key: string]: string } = {};

// 단축
const fields: Record<string, string> = {};
```

`Record<K, V>` = "키가 K 타입이고 값이 V 타입인 객체".

강의 코드 빈출:
```typescript
interface StreamMessage {
  id: string;
  fields: Record<string, string>;  // 문자열 키 → 문자열 값
}
```

**상태 전이 맵에서 강력하다:**
```typescript
const VALID_TRANSITIONS: Record<TxStatus, TxStatus[]> = {
  REQUESTED: ['SUBMITTED', 'FAILED'],
  SUBMITTED: ['PENDING', 'FAILED'],
  // TxStatus의 모든 키를 빠짐없이 채워야 함 → 하나라도 빠지면 에러
};
```

---

## 7. type vs interface

```typescript
// interface — 객체 형태, 클래스 implements 가능
interface User { name: string; }

// type alias — 뭐든 이름 붙이기 가능
type UserId = string;                          // 단순 alias
type Status = 'A' | 'B' | 'C';               // union
type Result<T> = { ok: true; data: T }        // 제네릭 + union
               | { ok: false; error: string };
```

**기준:**
- 객체 형태 정의 → `interface`
- union, 단순 alias, 복잡한 조합 → `type`
- 강의 코드는 둘 다 섞어 씀. 차이보다 읽기에 집중.

---

## 8. Map\<K, V\> — 타입 안전한 key-value 저장소

일반 객체(`{}`)와 달리 키를 동적으로 관리할 때 쓴다. 강의 코드에서 idempotency 키 관리, 정책 캐시 등에 등장.

```typescript
const store = new Map<string, bigint>();

store.set('0xAAA', 1000n);          // 추가/수정
store.get('0xAAA');                  // bigint | undefined  ← undefined 가능
store.has('0xAAA');                  // boolean
store.delete('0xAAA');               // 삭제
store.size;                          // 개수
```

**객체와 결정적 차이**: `.get()`은 항상 `T | undefined`를 반환한다. 값이 있다고 확신해도 TS는 모른다.

```typescript
const bal = store.get('0xAAA');      // bigint | undefined
bal + 100n;                          // 에러: undefined일 수 있음

const bal = store.get('0xAAA') ?? 0n;  // OK: 없으면 0n으로 처리
const bal = store.get('0xAAA')!;        // OK: 있다고 단언 (확실할 때만)
```

순회:
```typescript
for (const [key, value] of store) {
  console.log(key, value);
}
```

---

## 자주 하는 실수

**실수 1 — optional과 union 혼동**
```typescript
// memo?: string  →  memo가 없거나, 있으면 string
// memo: string | undefined  →  memo는 반드시 있어야 하는데 값이 undefined일 수 있음
// 실무에서 대부분 ?: 로 처리
```

**실수 2 — Record 키 타입 누락**
```typescript
const map: Record<TxStatus, string> = {
  REQUESTED: 'a',
  SUBMITTED: 'b',
  // PENDING, CONFIRMED, FAILED 빠짐 → 에러
};
```

---

**실수 3 — Map을 객체처럼 접근**
```typescript
const store = new Map<string, number>();
store.set('key', 1);

store['key'];        // undefined (Map은 이렇게 못 씀)
store.get('key');    // 1 (올바른 방법)
```

---

## 체크리스트

- [ ] interface 선언을 보고 어떤 객체가 만족하는지 알 수 있다
- [ ] `readonly`가 왜 필요한지 설명할 수 있다
- [ ] `string | number` 같은 union을 읽을 수 있다
- [ ] 문자열 리터럴 union으로 상태값을 표현하는 이유를 설명할 수 있다
- [ ] `Record<string, string>`의 의미를 설명할 수 있다
- [ ] 메서드 시그니처 `foo(x: T): Promise<U>`를 한국어로 풀이할 수 있다
- [ ] `Map<K, V>`에서 `.get()`이 `T | undefined`를 반환하는 이유를 안다

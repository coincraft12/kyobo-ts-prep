# CH07 — 제네릭

## 핵심 한 줄
> 제네릭 = "타입을 매개변수처럼 넘기는 것". `Promise<string>`, `Array<number>`, `Record<string, number>` 모두 제네릭이다. 이미 쓰고 있었다.

---

## 1. 왜 제네릭이 필요한가

같은 로직인데 타입만 다르면, 타입마다 함수를 따로 만들어야 한다:

```typescript
function findString(items: string[], target: string): string | undefined {
  return items.find(x => x === target);
}

function findNumber(items: number[], target: number): number | undefined {
  return items.find(x => x === target);
}
```

제네릭으로 하나로 합친다:

```typescript
function find<T>(items: T[], target: T): T | undefined {
  return items.find(x => x === target);
}

find(['a', 'b', 'c'], 'b');   // T = string 으로 추론
find([1, 2, 3], 2);           // T = number 로 추론
```

`<T>`는 "이 자리에 타입을 넣어라"는 자리 표시자. 실제 사용할 때 구체 타입으로 채워진다.

---

## 2. extends — 제네릭 제약

`<T>`만 쓰면 T에 어떤 타입이든 들어올 수 있다. 제약을 걸려면 `extends` 사용.

```typescript
// 제약 없음 — T가 뭔지 몰라서 id에 접근 불가
function findById<T>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);  // 에러: T에 id 없을 수 있음
}

// extends로 제약 — T는 반드시 id 필드가 있어야 함
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);  // OK: id가 보장됨
}
```

강의 코드에서:
```typescript
async retryWithBackoff<T>(
  fn: () => Promise<T>,   // T를 리턴하는 함수를 받아서
  maxAttempts: number,
): Promise<T> {           // 같은 T 타입으로 리턴
  return await fn();
}

// 사용
const balance = await retryWithBackoff(() => fetchBalance('0xAAA'), 3);
// T = number 로 추론됨, balance 타입도 number
```

---

## 3. 제네릭 인터페이스

인터페이스도 제네릭으로 만들 수 있다.

```typescript
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  findAll(): Promise<T[]>;
}
```

사용할 때 구체 타입을 채운다:

```typescript
// MintRequest 전용 저장소
const mintRepo: Repository<MintRequest> = new InMemoryRepository<MintRequest>();

// WalletRecord 전용 저장소
const walletRepo: Repository<WalletRecord> = new InMemoryRepository<WalletRecord>();
```

findById 등 메서드 구현은 동일한데 다루는 타입만 다르다.

---

## 4. 제네릭 클래스

클래스도 제네릭 사용 가능:

```typescript
class InMemoryRepository<T extends { id: string }> implements Repository<T> {
  private store = new Map<string, T>();

  async findById(id: string): Promise<T | null> {
    return this.store.get(id) ?? null;
  }

  async save(entity: T): Promise<void> {
    this.store.set(entity.id, entity);
  }

  async findAll(): Promise<T[]> {
    return [...this.store.values()];
  }
}
```

`T extends { id: string }` — T는 반드시 id 필드가 있어야 한다는 제약.

---

## 5. 이미 쓰고 있는 제네릭들

사실 이전 챕터에서 이미 제네릭을 사용하고 있었다:

| 표현 | 해석 |
|------|------|
| `Promise<number>` | number를 담은 Promise |
| `Array<string>` = `string[]` | string을 담은 배열 |
| `Record<string, number>` | string 키, number 값인 객체 |
| `Map<string, number>` | string 키, number 값인 Map |
| `T \| null` | T 또는 null |

---

## 6. 타입 추론 — 직접 안 써도 됨

제네릭은 대부분 자동으로 추론된다:

```typescript
function wrap<T>(value: T): T[] {
  return [value];
}

// T를 명시적으로 쓸 때
const result = wrap<number>(42);

// 추론으로 — 실무에선 이렇게
const result = wrap(42);    // T = number 로 자동 추론
const result = wrap('hi'); // T = string 으로 자동 추론
```

강의 코드에서 `<T>` 표시가 없어도 제네릭이 동작하는 이유가 이것.

---

## 자주 하는 실수

**실수 1 — 제약 없이 타입 멤버 접근**
```typescript
function getName<T>(item: T): string {
  return item.name;  // 에러: T에 name이 있다는 보장 없음
}

function getName<T extends { name: string }>(item: T): string {
  return item.name;  // OK
}
```

**실수 2 — 제네릭 필요 없는 곳에 사용**
```typescript
// 이건 제네릭 필요 없음 — 항상 string을 받고 string을 리턴
function greet<T extends string>(name: T): T {
  return `Hello ${name}` as T;  // 억지
}

// 그냥 이렇게
function greet(name: string): string {
  return `Hello ${name}`;
}
```

---

---

## 생소한 문법 해설

### `get size(): number` — getter (접근자 프로퍼티)

```typescript
class RetryQueue<T> {
  private items: Array<{ item: T; attempts: number }> = [];

  get size(): number {     // 메서드처럼 정의하지만
    return this.items.length;
  }
}

const queue = new RetryQueue<string>();
queue.size;  // () 없이 프로퍼티처럼 접근
```

`get`을 붙이면 호출할 때 괄호 없이 `queue.size`처럼 쓸 수 있다.  
내부 상태를 외부에 노출하되 직접 수정은 막을 때 유용하다 (`private items`는 숨기면서 `size`만 공개).

### `[...this.store.values()]` — Map을 배열로 변환

```typescript
async findAll(): Promise<T[]> {
  return [...this.store.values()];
}
```

- `this.store.values()` — `Map`의 모든 값을 순서대로 반환하는 **이터러블(iterable)** 객체 (배열이 아님)
- `[...이터러블]` — spread로 펼쳐서 일반 배열로 변환

`Array.from(this.store.values())`와 동일하다. 이터러블을 배열이 필요한 곳에 넘길 때 자주 사용하는 패턴.

### `<T extends HasId & HasTimestamp>` — 교차 타입 제약

```typescript
function getLatest<T extends HasId & HasTimestamp>(items: T[]): T | undefined {
```

- `HasId & HasTimestamp` — 교차 타입(intersection). "두 인터페이스를 모두 만족하는 타입"
- T는 `id: string` **과** `createdAt: Date` 둘 다 가져야 한다

```typescript
interface HasId       { id: string; }
interface HasTimestamp { createdAt: Date; }

// 두 조건을 모두 만족하는 타입만 넘길 수 있음
getLatest([{ id: 'a', createdAt: new Date() }]);  // OK
getLatest([{ id: 'a' }]);                          // 에러: createdAt 없음
```

### `items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]`

```typescript
return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
```

- `.sort(비교함수)` — 비교함수가 **음수** 반환 → a가 b 앞. **양수** → b가 a 앞.
- `b.getTime() - a.getTime()` — 새로운 날짜(`b`)가 앞에 오도록 내림차순 정렬
- `[0]` — 정렬 후 첫 번째 요소 (= 가장 최신)

`Date.getTime()`은 1970년 1월 1일 기준 밀리초를 반환한다. 날짜끼리 빼면 시간 차이가 나온다.

### `private store = new Map<string, T>()` — 필드 즉시 초기화

```typescript
class InMemoryRepository<T extends { id: string }> {
  private store = new Map<string, T>();
```

클래스 제네릭 `T`를 필드 타입에 바로 사용할 수 있다.  
생성자 없이도 필드 선언 시점에 초기화할 수 있으며, 클래스 인스턴스마다 독립된 Map이 생성된다.

---

## 체크리스트

- [ ] `<T>`가 "타입 자리 표시자"라는 것을 안다
- [ ] `Promise<string>`, `Array<number>` 가 제네릭임을 안다
- [ ] `<T extends { id: string }>`가 T에 id 필드를 요구하는 제약임을 안다
- [ ] `Repository<MintRequest>`처럼 구체 타입을 채워서 쓰는 방식을 안다
- [ ] `retryWithBackoff<T>(fn: () => Promise<T>): Promise<T>` 를 한국어로 풀이할 수 있다
- [ ] `get size()` getter와 일반 메서드의 차이를 설명할 수 있다
- [ ] `[...this.store.values()]`가 이터러블을 배열로 변환하는 이유를 안다

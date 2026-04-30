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

## 체크리스트

- [ ] `<T>`가 "타입 자리 표시자"라는 것을 안다
- [ ] `Promise<string>`, `Array<number>` 가 제네릭임을 안다
- [ ] `<T extends { id: string }>`가 T에 id 필드를 요구하는 제약임을 안다
- [ ] `Repository<MintRequest>`처럼 구체 타입을 채워서 쓰는 방식을 안다
- [ ] `retryWithBackoff<T>(fn: () => Promise<T>): Promise<T>` 를 한국어로 풀이할 수 있다

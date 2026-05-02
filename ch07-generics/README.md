# CH07 — 제네릭

## 핵심 한 줄
> 제네릭 = "타입을 매개변수처럼 넘기는 것". `Promise<string>`, `Array<number>`, `Record<string, number>` 모두 제네릭이다. 이미 쓰고 있었다.

---

## 1. 왜 제네릭이 필요한가

### 문제: 같은 로직인데 타입만 다르면 함수를 따로 만들어야 한다

```typescript
function findString(items: string[], target: string): string | undefined {
  return items.find(x => x === target);
}

function findNumber(items: number[], target: number): number | undefined {
  return items.find(x => x === target);
}
```

이 두 함수는 로직이 완전히 동일하다. `items.find(x => x === target)` 한 줄짜리인데, 타입만 다르다는 이유로 함수를 두 개 만들고 있다. 내일 `boolean` 배열이 필요해지면 세 번째 함수를 또 만들어야 한다.

**`any`로 해결하면 안 되나?** — 안 된다.

```typescript
function find(items: any[], target: any): any {
  return items.find(x => x === target);
}

const result = find([1, 2, 3], 2);
result.toFixed(2);  // 런타임 에러 가능성 — TS가 result가 number인지 모름
```

`any`를 쓰면 타입 정보가 사라진다. 함수 안에 뭘 넣든, 뭐가 나오든 TS가 알 수 없다.

### 해결: 제네릭 — 타입을 인자처럼 넘긴다

```typescript
function find<T>(items: T[], target: T): T | undefined {
  return items.find(x => x === target);
}

find(['a', 'b', 'c'], 'b');   // T = string 으로 추론됨
find([1, 2, 3], 2);           // T = number 로 추론됨
```

### `<T>`를 직관적으로 이해하는 방법

함수는 보통 값을 인자로 받는다:

```
function add(x: number, y: number): number { ... }
             ↑ 값 인자
```

제네릭 함수는 **타입도 인자로 받는다**:

```
function find<T>(items: T[], target: T): T | undefined { ... }
          ↑ 타입 인자
```

`<T>`는 "이 함수는 타입 인자를 하나 받는다"는 선언이다.  
`T`는 이름일 뿐이다. `T` 대신 `Item`, `Element`, `Whatever`를 써도 동작은 같다.  
관례적으로 단일 타입 파라미터는 `T`, 두 개면 `T, U` 또는 `K, V`를 쓴다.

**호출 시점에 T가 결정된다:**

```typescript
find([1, 2, 3], 2);
//   ↑ items가 number[] → T = number로 추론
//          ↑ target도 T = number여야 하므로 number
//   리턴 타입도 T | undefined = number | undefined
```

이게 핵심이다. `find`를 정의할 때는 T가 뭔지 모른다. 호출할 때 넣는 값을 보고 TS가 T를 결정한다.

---

## 2. extends — 제네릭 제약

### extends가 없으면 T에 대해 아무것도 모른다

```typescript
// 제약 없음 — T가 뭔지 몰라서 id에 접근 불가
function findById<T>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
  //                        ↑ 에러! Property 'id' does not exist on type 'T'
}
```

TS 입장에서 T는 `string`일 수도, `number`일 수도, `boolean`일 수도 있다. `string`에는 `.id`가 없다. 그래서 에러가 난다.

"T에는 id 필드가 있을 거야"라고 말해야 한다. 그게 `extends`다.

### `extends`가 여기서 의미하는 것

> **클래스 상속의 `extends`와 다르다.**

클래스 상속에서 `extends`는 "A는 B를 상속한다"는 뜻이다:

```typescript
class Dog extends Animal { ... }  // Dog는 Animal의 하위 클래스
```

제네릭 제약에서 `extends`는 **"T는 최소한 이 형태를 만족해야 한다"** 는 뜻이다:

```typescript
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  //              ↑ "T는 최소한 { id: string } 형태여야 해"
  return items.find(item => item.id === id);  // OK: id가 보장됨
}
```

"최소한"이 중요하다. `{ id: string }` 외에 다른 필드가 있어도 된다:

```typescript
interface User { id: string; name: string; age: number }
interface Token { id: string; value: string }

findById([user1, user2], 'u-001');    // OK: User는 id: string 가짐
findById([token1, token2], 't-001'); // OK: Token도 id: string 가짐
findById([1, 2, 3], '1');            // 에러: number에는 id가 없음
```

### 왜 `item.id`에 접근하려면 제약이 필요한가 — 단계별 분해

```
1단계: function findById<T>(...)
       → T는 어떤 타입이든 될 수 있음
       → string, number, boolean, { name: string }, 뭐든 가능

2단계: item.id에 접근하려 함
       → string에 .id? 없음
       → number에 .id? 없음
       → { name: string }에 .id? 없음
       → TS는 "이 T가 .id를 가진다는 보장이 없다" → 에러

3단계: <T extends { id: string }> 추가
       → T는 이제 반드시 id: string 필드를 가져야 함
       → string은 id가 없으니 T로 사용 불가
       → { id: string; name: string }은 id가 있으니 T로 사용 가능
       → item.id → OK, id: string이 보장됨
```

### 실전 코드: `retryWithBackoff<T>`

강의 코드에서 나오는 패턴이다:

```typescript
async retryWithBackoff<T>(
  fn: () => Promise<T>,   // T를 리턴하는 비동기 함수를 받아서
  maxAttempts: number,
): Promise<T> {           // 같은 T 타입으로 리턴한다
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();  // fn()을 실행하면 Promise<T>가 나옴 → await하면 T
    } catch (err) {
      lastError = err;
      // 실패하면 기다렸다가 재시도
      await sleep(attempt * 1000);
    }
  }

  throw lastError;
}
```

**T가 어디서 결정되는가?**

```typescript
// 1. fetchBalance는 () => Promise<number> 타입의 함수
async function fetchBalance(address: string): Promise<number> {
  // ...
  return 1000;
}

// 2. retryWithBackoff를 호출할 때
const balance = await retryWithBackoff(() => fetchBalance('0xAAA'), 3);
//                                     ↑ fn = () => Promise<number>
//                                       → T = number 로 추론됨
//              ↑ balance의 타입은 T = number
```

**T가 추론되는 흐름:**

```
() => fetchBalance('0xAAA')  의 타입은  () => Promise<number>
fn: () => Promise<T>  와 매칭
→ Promise<T> = Promise<number>
→ T = number

retryWithBackoff의 리턴 타입은 Promise<T> = Promise<number>
await하면 number
→ balance: number
```

**T를 명시적으로 쓸 수도 있다:**

```typescript
// 명시적으로 타입 인자 전달
const balance = await retryWithBackoff<number>(() => fetchBalance('0xAAA'), 3);

// 추론으로 (실무에서는 이게 일반적)
const balance = await retryWithBackoff(() => fetchBalance('0xAAA'), 3);
```

둘 다 동작한다. 추론이 가능하면 명시하지 않아도 된다.

---

## 3. 제네릭 인터페이스

인터페이스도 제네릭으로 만들 수 있다. "어떤 타입이든 저장할 수 있는 저장소"를 표현할 때 유용하다:

```typescript
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  findAll(): Promise<T[]>;
}
```

**이 인터페이스만 보면 T가 뭔지 모른다.** T는 사용하는 시점에 결정된다.

```typescript
// MintRequest 전용 저장소
const mintRepo: Repository<MintRequest> = new InMemoryRepository<MintRequest>();
// → findById(id): Promise<MintRequest | null>
// → save(entity: MintRequest): Promise<void>
// → findAll(): Promise<MintRequest[]>

// WalletRecord 전용 저장소
const walletRepo: Repository<WalletRecord> = new InMemoryRepository<WalletRecord>();
// → findById(id): Promise<WalletRecord | null>
// → save(entity: WalletRecord): Promise<void>
// → findAll(): Promise<WalletRecord[]>
```

같은 인터페이스인데, T에 뭘 채우느냐에 따라 완전히 다른 타입의 저장소가 된다.  
findById 등 메서드 구현 로직은 동일하고, 다루는 타입만 다르다.

---

## 4. 제네릭 클래스

클래스도 제네릭으로 정의할 수 있다. `Repository<T>` 인터페이스를 구현하는 클래스:

```typescript
class InMemoryRepository<T extends { id: string }> implements Repository<T> {
  //                     ↑ T는 반드시 id: string 필드가 있어야 함
  //                       (Map의 키로 id를 쓰기 때문)

  private store = new Map<string, T>();
  //      ↑ "string → T" 맵. id로 T를 저장

  async findById(id: string): Promise<T | null> {
    return this.store.get(id) ?? null;
    //                          ↑ undefined이면 null로 바꿈
  }

  async save(entity: T): Promise<void> {
    this.store.set(entity.id, entity);
    //              ↑ T extends { id: string } 덕분에 entity.id 접근 가능
  }

  async findAll(): Promise<T[]> {
    return [...this.store.values()];
    //      ↑ Map의 모든 값을 배열로 변환
  }
}
```

**`T extends { id: string }` 제약이 왜 클래스에 필요한가?**

```
save(entity: T) 안에서 this.store.set(entity.id, entity)를 한다.
→ entity.id를 쓰려면 T에 id: string이 있어야 한다.
→ 제약이 없으면 "T에 id가 있는지 모른다" → 에러
→ T extends { id: string } → entity.id 접근 가능
```

**인스턴스 생성 시 T를 채운다:**

```typescript
// T = MintRequest. MintRequest는 { id: string, ... } 를 가지므로 OK
const mintRepo = new InMemoryRepository<MintRequest>();

// T = number. number에는 id가 없으므로 에러
const badRepo = new InMemoryRepository<number>();  // 에러!
```

---

## 5. 이미 쓰고 있는 제네릭들

사실 이전 챕터에서 이미 제네릭을 사용하고 있었다:

| 표현 | T 자리에 들어간 것 | 의미 |
|------|--------------------|------|
| `Promise<number>` | `number` | number를 담은 Promise |
| `Array<string>` = `string[]` | `string` | string을 담은 배열 |
| `Record<string, number>` | K=`string`, V=`number` | string 키, number 값인 객체 |
| `Map<string, number>` | K=`string`, V=`number` | string 키, number 값인 Map |
| `T \| null` | 사용자 정의 T | T 또는 null |

`Promise<number>`에서 `Promise`가 제네릭이고, `number`가 T 자리에 들어간 것이다.  
우리가 `await`로 `number`를 꺼낼 수 있는 이유가 `Promise<number>`라는 타입 정보 덕분이다.

---

## 6. 타입 추론 — 직접 안 써도 됨

제네릭 타입 인자는 대부분 자동으로 추론된다:

```typescript
function wrap<T>(value: T): T[] {
  return [value];
}

// T를 명시적으로 쓸 때
const result1 = wrap<number>(42);    // T = number

// 추론으로 — 실무에선 이렇게
const result2 = wrap(42);    // T = number 로 자동 추론. result2: number[]
const result3 = wrap('hi'); // T = string 으로 자동 추론. result3: string[]
```

**추론의 원리:**

```
wrap(42) 호출
→ value 인자에 42(number)가 들어옴
→ value: T 에서 T = number로 추론
→ 리턴 타입 T[] = number[]
→ result2: number[]
```

강의 코드에서 `<T>` 표시가 없어도 제네릭이 동작하는 이유가 이것이다.

**추론이 안 되는 경우엔 명시한다:**

```typescript
// 빈 배열은 추론할 정보가 없음
const arr1 = [];         // TS: any[]로 추론됨 (경고 가능성)
const arr2 = [] as number[];  // 명시적으로 지정
const arr3: number[] = [];    // 또는 이렇게

// 제네릭 함수에서 인자가 없어 추론이 불가한 경우
function createEmpty<T>(): T[] {
  return [];
}
const nums = createEmpty<number>();  // T를 명시해야 함
```

---

## 자주 하는 실수

### 실수 1 — 제약 없이 타입 멤버에 접근

```typescript
// 잘못된 코드
function getName<T>(item: T): string {
  return item.name;  // 에러: Property 'name' does not exist on type 'T'
  // T가 string인지, number인지, { age: number }인지 TS는 알 수 없음
}

// 올바른 코드
function getName<T extends { name: string }>(item: T): string {
  return item.name;  // OK: T에는 반드시 name: string이 있음
}
```

### 실수 2 — 제네릭 필요 없는 곳에 억지로 사용

```typescript
// 잘못된 코드 — 항상 string을 받고 string을 리턴하는데 제네릭 사용
function greet<T extends string>(name: T): T {
  return `Hello ${name}` as T;  // as T 캐스팅까지 필요해짐 → 코드 복잡
}

// 올바른 코드 — 그냥 string 쓰면 됨
function greet(name: string): string {
  return `Hello ${name}`;
}
```

제네릭은 "타입이 달라지는 경우에 동일한 로직을 재사용"할 때 쓴다.  
타입이 고정되어 있으면 그냥 그 타입을 쓰면 된다.

### 실수 3 — T와 상관없는 타입을 리턴하면서 제네릭 사용

```typescript
// 잘못된 코드 — T를 받지만 리턴과 무관
function log<T>(value: T): void {
  console.log(value);
  // T가 리턴에 영향을 안 줌. 여기선 T 필요 없음
}

// 올바른 코드
function log(value: unknown): void {
  console.log(value);
}
```

제네릭은 "입력 타입과 출력 타입 사이에 관계가 있을 때" 필요하다.

---

## 체크리스트

- [ ] `<T>`가 "타입을 인자로 받는 자리"라는 것을 안다
- [ ] `Promise<string>`, `Array<number>`, `Map<string, number>` 가 제네릭임을 안다
- [ ] `<T extends { id: string }>`가 "T는 최소한 id: string 필드가 있어야 한다"는 제약임을 안다
- [ ] 제약이 없으면 T의 멤버에 접근할 수 없는 이유를 설명할 수 있다
- [ ] `Repository<MintRequest>`처럼 구체 타입을 채워서 쓰는 방식을 안다
- [ ] `retryWithBackoff<T>(fn: () => Promise<T>): Promise<T>` 에서 T가 언제 어떻게 결정되는지 설명할 수 있다
- [ ] 타입 추론으로 `<T>`를 생략할 수 있는 상황을 안다

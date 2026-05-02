# CH07 — 제네릭

## 핵심 한 줄
> 제네릭 = "타입을 매개변수처럼 넘기는 것". `Promise<string>`, `Array<number>`, `Map<string, number>` — 이미 쓰고 있었다.

---

## 1. 제네릭이 없으면 무슨 문제가 생기는가 — 먼저 보여주기

제네릭의 필요성을 느끼려면, 없을 때 어떤 일이 벌어지는지부터 봐야 한다.

### 문제 1: 타입별로 함수를 따로 만들어야 한다

```typescript
// ❌ 타입만 다르고 로직이 완전히 동일한 함수 두 개
function findString(items: string[], target: string): string | undefined {
  return items.find(x => x === target);
}

function findNumber(items: number[], target: number): number | undefined {
  return items.find(x => x === target);
}

// boolean 배열이 필요해지면 세 번째 함수를 또 만들어야 한다
function findBoolean(items: boolean[], target: boolean): boolean | undefined {
  return items.find(x => x === target);
}
```

내용이 `items.find(x => x === target)` 한 줄짜리인데, 타입만 다르다는 이유로 함수를 계속 복사하고 있다.

---

### 문제 2: `any`로 해결하면 타입 안전성이 사라진다

```typescript
// ❌ any를 쓰면 타입 정보가 통째로 사라짐
function find(items: any[], target: any): any {
  return items.find(x => x === target);
}

const result = find([1, 2, 3], 2);
//    ^^^^^^ 타입: any
result.toFixed(2);     // 컴파일은 통과 — 하지만 result가 number인지 TS가 모름
result.toUpperCase();  // 컴파일은 통과 — 런타임에 터질 수 있음
```

`any`를 쓰면 "함수에 뭘 넣든, 뭐가 나오든 TypeScript가 알 수 없다". 타입 검사가 꺼지는 것과 같다.

---

### 해결: 제네릭 — 타입도 인자로 받는다

```typescript
// ✅ 타입 인자 T를 받아서, 입력과 출력에 같은 T를 쓴다
function find<T>(items: T[], target: T): T | undefined {
  return items.find(x => x === target);
}

find(['a', 'b', 'c'], 'b');  // T = string 으로 추론됨, 리턴: string | undefined
find([1, 2, 3], 2);          // T = number 로 추론됨, 리턴: number | undefined
find([true, false], true);   // T = boolean 으로 추론됨
```

함수 하나로 모든 타입을 처리한다. 타입 안전성도 유지된다.

---

## 2. `<T>`가 뭔지 — 직관부터

### "값을 인자로 받는 함수" vs "타입도 인자로 받는 함수"

```
일반 함수:
function add(x: number, y: number): number { ... }
             ↑ 값 인자. 호출 시점에 구체적인 값이 들어옴.

제네릭 함수:
function find<T>(items: T[], target: T): T | undefined { ... }
          ↑ 타입 인자. 호출 시점에 구체적인 타입이 결정됨.
```

`<T>`는 "이 함수는 타입 인자를 하나 받는다"는 선언이다.

**T는 이름일 뿐이다.** `T` 대신 무엇을 써도 동작은 같다.

```typescript
function find<Item>(items: Item[], target: Item): Item | undefined { ... }
function find<Whatever>(items: Whatever[], target: Whatever): Whatever | undefined { ... }
// 셋 다 완전히 동일
```

관례적으로 단일 타입 파라미터는 `T`, 두 개면 `T, U` 또는 `K, V`(Key, Value)를 쓴다.

---

### 호출 시점에 T가 결정되는 과정 — 단계별 추론

```typescript
find([1, 2, 3], 2)
```

TypeScript가 T를 결정하는 과정:

```
1단계: 첫 번째 인자 [1, 2, 3]을 본다
       배열 리터럴 → 각 원소가 number
       → items의 타입 = number[]
       → T[] = number[] → T = number

2단계: 두 번째 인자 2를 본다
       target의 타입은 T = number여야 함
       → 2는 number → OK, 일치

3단계: 리턴 타입 T | undefined 계산
       T = number → 리턴 타입 = number | undefined

결과: find([1, 2, 3], 2)의 타입은 number | undefined
```

`find`를 정의할 때는 T가 뭔지 모른다. 호출할 때 넣는 값을 보고 TS가 T를 결정한다. 이것이 타입 추론(type inference)이다.

---

## 3. 제네릭 제약 — `<T extends ...>`

### 제약이 없으면 T에 대해 아무것도 모른다

```typescript
// ❌ 제약 없음 — item.id에 접근 불가
function findById<T>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
  //                        ^^^^^^^ 에러!
  //  Property 'id' does not exist on type 'T'
}
```

TypeScript 입장에서 T는 `string`일 수도, `number`일 수도, `boolean`일 수도 있다. `string`에는 `.id`가 없다. 그래서 "T에 `.id`가 있다는 보장이 없다"고 에러를 낸다.

---

### `extends`가 여기서 의미하는 것 — 클래스 상속과 다르다

> **클래스 상속의 `extends`와 헷갈리지 말 것.**

```typescript
// 클래스 상속에서의 extends — "A는 B를 상속한다"
class Dog extends Animal { ... }  // Dog는 Animal의 하위 클래스

// 제네릭 제약에서의 extends — "T는 최소한 이 형태를 만족해야 한다"
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
```

제네릭 `extends`는 상속이 아니다. **"최소 조건"** 이다.

---

### 제약이 있으면 TS가 어떻게 보장하는가 — 단계별 분해

```
1단계: function findById<T>(...)
       → T는 string, number, boolean, { name: string } 뭐든 가능
       → item.id 접근 불가 — T가 .id를 가진다는 보장 없음

2단계: function findById<T extends { id: string }>(...)
       → T는 이제 반드시 { id: string } 형태를 포함해야 함
       → string(id 없음) → T로 쓸 수 없음
       → number(id 없음) → T로 쓸 수 없음
       → { id: string; name: string }(id 있음) → T로 쓸 수 있음

3단계: item.id 접근
       → T에 id: string이 보장됨 → OK
```

---

### "최소한 이 형태" — 구조적 타이핑 개념

`{ id: string }` 외에 다른 필드가 있어도 된다. TypeScript는 "구조적으로 일치하는가"만 본다.

```typescript
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

interface User   { id: string; name: string; age: number }
interface Token  { id: string; value: string }

findById([user1, user2], 'u-001');    // ✅ User는 id: string 가짐
findById([token1, token2], 't-001'); // ✅ Token도 id: string 가짐
findById([1, 2, 3], '1');            // ❌ number에는 id가 없음 — 컴파일 에러
```

"T는 `{ id: string }`을 포함하기만 하면 된다"는 것이 구조적 타이핑이다. 딱 그 형태여야 하는 게 아니라, 최소한 그 필드가 있으면 된다.

> **핵심:** 제네릭 `extends`는 상속이 아니라 "최소 조건" 선언이다. "T는 적어도 이것을 갖춰야 한다."

---

### 강의 코드: `retryWithBackoff<T>`에서 T 추론 흐름

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,  // T를 리턴하는 비동기 함수를 받아서
  maxAttempts: number,
): Promise<T> {          // 같은 T 타입으로 리턴
  // ...
}
```

**T가 언제 결정되는가:**

```typescript
// fetchBalance는 () => Promise<number> 타입
async function fetchBalance(address: string): Promise<number> {
  return 1000;
}

// retryWithBackoff 호출
const balance = await retryWithBackoff(() => fetchBalance('0xAAA'), 3);
```

TypeScript의 추론 과정:

```
() => fetchBalance('0xAAA') 의 타입 = () => Promise<number>
fn: () => Promise<T>  와 매칭
→ Promise<T> = Promise<number>
→ T = number

retryWithBackoff의 리턴 타입 = Promise<T> = Promise<number>
await 하면 → number

∴ balance: number
```

**T를 명시적으로 쓸 수도 있다:**

```typescript
// 명시적으로
const balance = await retryWithBackoff<number>(() => fetchBalance('0xAAA'), 3);

// 추론으로 (실무에서는 이게 일반적)
const balance = await retryWithBackoff(() => fetchBalance('0xAAA'), 3);
```

추론이 가능하면 명시하지 않아도 된다.

---

## 4. 제네릭 인터페이스

인터페이스도 제네릭으로 만들 수 있다.

```typescript
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  findAll(): Promise<T[]>;
}
```

**이 인터페이스만 보면 T가 뭔지 모른다.** T는 사용하는 시점에 결정된다.

### T를 채웠을 때 어떻게 구체화되는가

```typescript
// Repository<MintRequest>로 쓰면:
Repository<MintRequest>
→ findById(id: string): Promise<MintRequest | null>
→ save(entity: MintRequest): Promise<void>
→ findAll(): Promise<MintRequest[]>

// Repository<WalletRecord>로 쓰면:
Repository<WalletRecord>
→ findById(id: string): Promise<WalletRecord | null>
→ save(entity: WalletRecord): Promise<void>
→ findAll(): Promise<WalletRecord[]>
```

같은 인터페이스인데, T에 뭘 채우느냐에 따라 완전히 다른 타입의 저장소가 된다. findById 등 메서드 구현 로직은 동일하고, 다루는 타입만 다르다.

---

## 5. 제네릭 클래스

클래스도 제네릭으로 정의할 수 있다. `Repository<T>` 인터페이스를 구현하는 클래스:

```typescript
class InMemoryRepository<T extends { id: string }> implements Repository<T> {
  //                     ↑ 제약: T는 반드시 id: string 필드가 있어야 함
  //                       왜? 아래 save()에서 entity.id를 Map 키로 쓰기 때문

  private store = new Map<string, T>();
  //      ↑ "string(id) → T(엔티티)" 맵

  async findById(id: string): Promise<T | null> {
    return this.store.get(id) ?? null;
    //                          ↑ Map.get()은 없으면 undefined를 리턴 → null로 바꿈
  }

  async save(entity: T): Promise<void> {
    this.store.set(entity.id, entity);
    //              ↑ T extends { id: string } 덕분에 entity.id 접근 가능
  }

  async findAll(): Promise<T[]> {
    return [...this.store.values()];
    //      ↑ Map의 모든 값을 배열로 변환 (spread + iterator)
  }
}
```

**`T extends { id: string }` 제약이 왜 클래스에도 필요한가:**

```
save(entity: T) 안에서 this.store.set(entity.id, entity)를 한다.
→ entity.id를 쓰려면 T에 id: string이 있어야 한다.
→ 제약이 없으면: "T에 id가 있는지 모른다" → 컴파일 에러
→ 제약이 있으면: entity.id 접근 가능
```

---

### `InMemoryRepository<MintRequest>` vs `InMemoryRepository<WalletRecord>` 비교

```typescript
// T = MintRequest. MintRequest는 { id: string, ... } 를 가지므로 OK
const mintRepo = new InMemoryRepository<MintRequest>();
mintRepo.save(mintRequest);                    // ✅ MintRequest만 저장 가능
mintRepo.save(walletRecord);                   // ❌ 컴파일 에러 — 타입 불일치

// T = WalletRecord
const walletRepo = new InMemoryRepository<WalletRecord>();
walletRepo.save(walletRecord);                 // ✅ WalletRecord만 저장 가능

// T = number. number에는 id가 없으므로 에러
const badRepo = new InMemoryRepository<number>();  // ❌ 컴파일 에러
```

각 repo 인스턴스는 딱 자기 타입만 받는다. 타입 혼용을 컴파일 시점에 막아준다.

---

## 6. 이미 쓰고 있는 제네릭들

사실 이전 챕터에서 이미 제네릭을 사용하고 있었다.

| 표현 | 제네릭 파라미터 | 의미 |
|------|----------------|------|
| `Promise<number>` | T = `number` | number를 담은 Promise |
| `Array<string>` = `string[]` | T = `string` | string을 담은 배열 |
| `Record<string, number>` | K = `string`, V = `number` | string 키, number 값인 객체 |
| `Map<string, number>` | K = `string`, V = `number` | string 키, number 값인 Map |
| `Promise<T \| null>` | T = 사용자 정의 | T 또는 null을 담은 Promise |

`Promise<number>`에서 `Promise`가 제네릭이고, `number`가 T 자리에 들어간 것이다. `await`로 `number`를 꺼낼 수 있는 이유가 `Promise<number>`라는 타입 정보 덕분이다.

---

## 7. 타입 추론 — 직접 안 써도 되는 이유

제네릭 타입 인자는 대부분 자동으로 추론된다.

```typescript
function wrap<T>(value: T): T[] {
  return [value];
}

// T를 명시적으로 쓸 때
const result1 = wrap<number>(42);   // T = number, result1: number[]

// 추론으로 — 실무에선 이렇게
const result2 = wrap(42);    // T = number 자동 추론, result2: number[]
const result3 = wrap('hi'); // T = string 자동 추론, result3: string[]
```

**추론의 원리 — 단계별:**

```
wrap(42) 호출
1단계: 인자 42가 value 파라미터로 들어옴
2단계: value: T 에서 42(number)를 보고 T = number로 결정
3단계: 리턴 타입 T[] = number[]
4단계: result2: number[]
```

강의 코드에서 `<T>` 표시가 없어도 제네릭이 동작하는 이유가 이것이다.

---

### 추론이 안 되는 케이스 — 명시해야 하는 상황

```typescript
// ❌ 빈 배열 — 원소가 없으니 타입을 추론할 정보가 없음
const arr1 = [];         // TS: any[]로 추론됨 (경고 가능성)

// ✅ 명시적으로 지정
const arr2 = [] as number[];  // 타입 단언으로 지정
const arr3: number[] = [];    // 변수 타입 선언으로 지정

// ❌ 인자가 없어 추론이 불가한 경우
function createEmpty<T>(): T[] {
  return [];
}
const nums = createEmpty();          // T를 추론할 근거 없음 → unknown[] 또는 에러
const nums = createEmpty<number>();  // ✅ T를 명시해야 함
```

**언제 명시하는가:**

```
추론 가능 → 명시 생략 (실무 99%)
빈 배열, 인자 없는 제네릭 함수 → 명시 필요
타입이 복잡해서 추론이 의도와 다를 때 → 명시로 강제
```

> **핵심:** TypeScript가 T를 추론할 수 있으면 쓸 필요 없다. 추론이 안 되거나 의도를 명확히 해야 할 때만 쓴다.

---

## 자주 하는 실수

### 실수 1 — 제약 없이 타입 멤버에 접근

```typescript
// ❌ T가 .name을 가진다는 보장 없음
function getName<T>(item: T): string {
  return item.name;  // 에러: Property 'name' does not exist on type 'T'
}

// ✅ 제약을 추가해야 접근 가능
function getName<T extends { name: string }>(item: T): string {
  return item.name;  // OK: name: string 보장됨
}
```

---

### 실수 2 — 제네릭이 필요 없는 곳에 억지로 사용

```typescript
// ❌ 항상 string을 받고 string을 리턴하는데 제네릭 사용
function greet<T extends string>(name: T): T {
  return `Hello ${name}` as T;  // as T 캐스팅까지 필요해짐 → 불필요하게 복잡
}

// ✅ 그냥 string 쓰면 됨
function greet(name: string): string {
  return `Hello ${name}`;
}
```

제네릭은 "타입이 달라지는 경우에 동일한 로직을 재사용"할 때 쓴다. 타입이 고정되어 있으면 그냥 그 타입을 쓰면 된다.

---

### 실수 3 — T와 상관없는 타입을 리턴하면서 제네릭 사용

```typescript
// ❌ T를 받지만 리턴에 영향을 안 줌
function log<T>(value: T): void {
  console.log(value);
  // T가 리턴에 영향을 주지 않음 → T 필요 없음
}

// ✅ unknown 쓰면 됨
function log(value: unknown): void {
  console.log(value);
}
```

제네릭은 "입력 타입과 출력 타입 사이에 관계가 있을 때" 필요하다. T를 받아서 T를 리턴하거나, T[]를 받아서 T를 리턴하는 식으로 타입이 연결되어야 제네릭이 의미 있다.

---

## 체크리스트

- [ ] `<T>`가 "타입을 인자로 받는 자리"라는 것을 안다
- [ ] "값 인자" vs "타입 인자"의 차이를 도식으로 설명할 수 있다
- [ ] `find([1,2,3], 2)` 호출에서 T=number로 추론되는 과정을 단계별로 설명할 수 있다
- [ ] 제네릭이 없으면 어떤 문제(`findString`, `findNumber` 중복)가 생기는지 안다
- [ ] `any`로 해결하면 왜 안 되는지(타입 안전성 사라짐)를 설명할 수 있다
- [ ] 제네릭 `extends`가 클래스 상속 `extends`와 다름을 설명할 수 있다
- [ ] `<T extends { id: string }>`가 없으면 왜 `.id` 접근이 에러인지 단계별로 설명할 수 있다
- [ ] "최소한 이 형태를 만족해야 한다"는 구조적 타이핑 개념을 안다
- [ ] `Repository<MintRequest>`와 `Repository<WalletRecord>`가 어떻게 다른 타입으로 구체화되는지 안다
- [ ] `Promise<string>`, `Array<number>`, `Map<string, number>`가 제네릭임을 안다
- [ ] TS가 T를 추론하는 과정을 단계별로 설명할 수 있다
- [ ] 추론이 안 되는 케이스(빈 배열, 인자 없는 함수)를 안다
- [ ] `retryWithBackoff(() => fetchBalance(...), 3)` 에서 T=number로 추론되는 흐름을 설명할 수 있다

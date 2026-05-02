# CH04 — 클래스

## 핵심 한 줄
> 클래스 = 데이터(필드) + 동작(메서드)을 묶은 틀. 강의 코드에서 서비스, 처리기, 저장소가 전부 클래스로 구현된다.

---

## 1. 클래스 기본 구조

### 세 가지 구성요소

클래스는 딱 세 가지로 이루어진다.

```typescript
class User {
  // ① 필드 — 이 클래스가 저장하는 데이터
  name: string;
  age: number;

  // ② 생성자 — new 할 때 자동으로 실행되는 초기화 함수
  constructor(name: string, age: number) {
    this.name = name;  // 매개변수 name → 이 객체의 필드 name에 저장
    this.age = age;
  }

  // ③ 메서드 — 이 클래스가 할 수 있는 동작
  greet(): string {
    return `Hi, ${this.name}`;
  }
}

const u = new User('Sharon', 40);  // 생성자 호출 → name='Sharon', age=40 저장
u.greet();  // 'Hi, Sharon'
```

각 부분이 하는 일:

| 구성요소 | 역할 | 없으면 |
|---|---|---|
| 필드 (`name: string`) | 객체가 기억해야 하는 데이터를 선언 | TS 에러: `Property 'name' does not exist` |
| 생성자 (`constructor`) | `new` 할 때 초기값 설정 | 모든 필드가 `undefined`로 시작 |
| 메서드 (`greet()`) | 데이터를 이용해 동작 수행 | 그냥 없는 기능 |

---

### 왜 TypeScript에서는 필드를 class body에 미리 선언해야 하는가

JavaScript에서는 constructor 안에서 `this.name = name`만 써도 동작한다. TypeScript는 그것만으로 부족하다.

```typescript
// ❌ JavaScript 방식 — TypeScript에서 에러
class User {
  constructor(name: string) {
    this.name = name;  // 에러: Property 'name' does not exist on type 'User'
  }
}
```

TypeScript 컴파일러는 **클래스가 어떤 필드를 가지는지 class body를 보고 판단**한다. constructor 안의 할당문만으로는 "이 클래스에 name이라는 필드가 있다"를 인식하지 못한다.

```typescript
// ✅ TypeScript 방식 — 필드를 class body에 선언
class User {
  name: string;   // ← "이 클래스에 name이라는 string 필드가 있다"고 선언

  constructor(name: string) {
    this.name = name;  // 이제 에러 없음
  }
}
```

> **핵심**: TypeScript에서 필드 선언은 컴파일러에게 "이 클래스의 형태"를 알려주는 것이다. constructor 안의 할당만으로는 그 역할을 할 수 없다.

---

### `this`가 하는 일

`this`는 "지금 이 코드를 실행하고 있는 바로 그 객체"를 가리킨다.

```typescript
constructor(name: string, age: number) {
  //  name → 생성자 매개변수 (외부에서 전달된 값)
  // this.name → 이 객체의 name 필드

  this.name = name;
  // 풀이: "이 객체의 name 필드에, 매개변수로 받은 name 값을 저장해라"
}
```

`new User('Sharon', 40)`이 호출되면:
1. 빈 User 객체가 만들어짐
2. constructor가 그 객체를 `this`로 받아 실행됨
3. `this.name = 'Sharon'`, `this.age = 40` 저장됨
4. 완성된 객체가 `u`에 할당됨

같은 클래스에서 만든 객체가 여러 개여도 각자의 `this`는 자기 자신을 가리킨다:

```typescript
const u1 = new User('Sharon', 40);
const u2 = new User('Alice', 30);

u1.greet();  // 'Hi, Sharon' — u1의 name
u2.greet();  // 'Hi, Alice'  — u2의 name
// 같은 greet() 메서드지만 this가 다르므로 결과가 다름
```

---

## 2. 생성자 단축 문법 — 강의 코드 표준

강의 코드에서 가장 많이 보이는 패턴이다. 처음 보면 "constructor 괄호 안에 왜 `private readonly`가 있지?"라고 당황한다. 이건 TypeScript의 단축 문법이다. 단계별로 분해한다.

---

### 단계 1: 의존성 주입을 풀어쓰면 이렇다

서비스 클래스는 보통 "외부에서 만들어진 객체(의존성)를 받아서 내부에서 쓴다".

```typescript
// 풀어 쓴 형태 — 4가지를 각각 따로 처리
class MintService {
  // ① 필드 선언 (class body)
  private redis: RedisClient;
  private logger: Logger;

  constructor(redis: RedisClient, logger: Logger) {
    // ② 매개변수 수신
    // ③ this.필드에 할당
    this.redis = redis;
    this.logger = logger;
  }
  // 의존성이 5개면 이 패턴을 5번 반복해야 함
}
```

의존성이 늘어날수록 코드가 3배씩 늘어난다. 필드 선언 1줄 + 할당 1줄 + 매개변수 1개. TypeScript는 이 반복을 없애는 단축 문법을 제공한다.

---

### 단계 2: 단축 문법 — constructor 매개변수에 접근 제어자 붙이기

```typescript
// 단축 문법 — 위와 완전히 동일한 코드
class MintService {
  constructor(
    private redis: RedisClient,   // ①②③ 한 번에
    private logger: Logger,       // ①②③ 한 번에
  ) {}
  // class body에 필드 선언 없음 — 이미 constructor에서 처리됨
  // {} — 본문이 비어 있어도 됨
}
```

`private redis: RedisClient`라고 쓰는 순간 TypeScript가 자동으로:
1. `private redis: RedisClient;` 필드 선언 생성
2. 매개변수로 `redis: RedisClient` 수신
3. `this.redis = redis;` 할당 실행

이 세 가지를 한 번에 처리한다.

---

### 단계 3: `readonly`까지 더하기

`private`만으로는 외부 접근만 막는다. 내부에서 실수로 `this.redis = 다른값`으로 덮어쓰는 것은 막지 못한다. `readonly`를 더하면 생성자 할당 이후 재할당 자체를 막는다.

```typescript
class MintService {
  constructor(
    private readonly redis: RedisClient,
    //^^^^^^^ ^^^^^^^^
    //   |        |
    //   |        +-- readonly: 생성자 할당 이후 this.redis = X 불가
    //   +----------- private: 클래스 외부에서 service.redis 접근 불가
    private readonly logger: Logger,
  ) {}
}
```

```typescript
// 내부에서 시도해도 막힘
class MintService {
  constructor(private readonly redis: RedisClient) {}

  reset(): void {
    this.redis = new RedisClient();  // ❌ 에러: Cannot assign to 'redis' because it is a read-only property
  }
}
```

---

### 정리: 세 단계를 나란히

```typescript
// 단계 1: 필드만 선언 (class body)
class A {
  private redis: RedisClient;  // 선언만, 값 없음
}

// 단계 2: constructor에서 받아서 할당
class B {
  private redis: RedisClient;
  constructor(redis: RedisClient) {
    this.redis = redis;  // 수동으로 할당
  }
}

// 단계 3: 매개변수에 접근 제어자 — 단계 1+2 통합
class C {
  constructor(private readonly redis: RedisClient) {}
  // class body 필드 선언 없음, 본문 {} 비어 있음 — 동일한 결과
}
```

강의 코드를 읽을 때 `constructor(private readonly X: Y)` 패턴이 나오면 한 문장으로 읽는다:

> "외부에서 Y 타입의 X를 받아서, 이 클래스 내부에서만 쓸 수 있는 변경 불가 필드로 저장한다."

---

## 3. 접근 제어자

### 네 가지 키워드

| 키워드 | 어디서 접근 가능한가 | 재할당 가능한가 |
|---|---|---|
| `public` | 어디서든 (기본값, 생략해도 동일) | 가능 |
| `private` | 클래스 내부에서만 | 가능 |
| `protected` | 클래스 내부 + 자식 클래스 | 가능 |
| `readonly` | 어디서든 읽기 가능 | 불가 (생성자에서만 할당 허용) |

```typescript
class TxService {
  public readonly id: string;     // 외부에서 읽기 OK, 쓰기 불가
  private db: Database;           // 외부에서 읽기도 쓰기도 불가
  protected logger: Logger;       // 자식 클래스까지만 접근 가능

  constructor(id: string, db: Database, logger: Logger) {
    this.id = id;
    this.db = db;
    this.logger = logger;
  }
}

const svc = new TxService('svc-1', db, logger);

svc.id;             // ✅ public readonly — 읽기 가능
svc.id = 'svc-2';  // ❌ readonly — 재할당 불가
svc.db;             // ❌ private — 외부 접근 불가
svc.logger;         // ❌ protected — 클래스/자식 클래스 내부에서만 접근
```

### `protected`는 언제 쓰는가

```typescript
class BaseProcessor {
  protected logger: Logger;  // 자식이 쓸 수 있게 protected

  constructor(logger: Logger) {
    this.logger = logger;
  }
}

class AuditProcessor extends BaseProcessor {
  process(): void {
    this.logger.info('처리 시작');  // ✅ 자식 클래스에서 접근 가능
  }
}

const audit = new AuditProcessor(logger);
audit.logger;  // ❌ 외부에서는 접근 불가 — protected이므로
```

`private`이면 자식 클래스도 쓰지 못하고, `public`이면 외부에서 마음대로 건드릴 수 있다. `protected`는 그 중간이다.

---

### 주의: TypeScript 접근 제어는 컴파일 타임에만 동작한다

```typescript
class Secret {
  private password: string = '1234';
}

const s = new Secret();
console.log((s as any).password);  // '1234' — 런타임에서는 막지 못함
```

TypeScript의 `private`, `protected`는 **컴파일러가 코드를 검사할 때만** 접근을 막는다. 컴파일된 JavaScript에는 이 제약이 없다. 런타임까지 진짜로 숨기려면 JavaScript의 `#` 문법(Private Fields)을 써야 한다.

```typescript
class Secret {
  #password: string = '1234';  // JS 런타임에서도 접근 불가
}
```

강의 코드에서는 주로 TS `private`를 쓴다. 목적은 "실수 방지와 코드 의도 표현"이지, 런타임 보안이 아니다.

> **핵심**: TypeScript 접근 제어자는 코드 구조를 명확히 하고 실수를 컴파일 단계에서 잡는 도구다. 런타임 보안 수단이 아니다.

---

## 4. `implements` vs `extends` — 핵심 비교

이 둘은 생김새가 비슷해서 자주 혼동된다. 차이는 하나다: **코드를 물려받는가, 아닌가**.

---

### `implements` — "이 형태를 지키겠다"는 선언

인터페이스는 "어떤 필드와 메서드가 있어야 한다"는 약속만 정의한다. 구현 코드는 없다.

```typescript
interface EventProcessor {
  eventTypes: string[];                              // 이 필드가 있어야 함
  process(message: StreamMessage): Promise<void>;   // 이 메서드가 있어야 함
}
```

`implements EventProcessor`를 붙이면 컴파일러가 "이 클래스가 약속을 지키고 있는가?" 감시한다.

```typescript
// ✅ 약속을 지킴
class NFTIssuedProcessor implements EventProcessor {
  readonly eventTypes = ['NFT_ISSUED'];              // 인터페이스가 요구하는 필드

  async process(message: StreamMessage): Promise<void> {  // 인터페이스가 요구하는 메서드
    // 구체적인 구현은 이 클래스가 직접 작성
  }
}

// ❌ 약속을 어김 — process 메서드 누락
class BadProcessor implements EventProcessor {
  readonly eventTypes = ['NFT_ISSUED'];
  // process 없음!
  // 에러: Class 'BadProcessor' incorrectly implements interface 'EventProcessor'.
  //        Property 'process' is missing in type 'BadProcessor'.
}
```

`implements`는 코드를 물려주지 않는다. NFTIssuedProcessor와 TransferProcessor가 둘 다 EventProcessor를 implements해도, 서로의 코드를 공유하지 않는다. 각자 전부 직접 구현해야 한다.

---

### `extends` — "부모 클래스의 코드를 가져다 쓴다"

```typescript
class BaseProcessor implements EventProcessor {
  readonly eventTypes: string[] = [];

  async process(message: StreamMessage): Promise<void> {
    console.log('기본 처리');
  }

  protected log(msg: string): void {
    console.log(`[LOG] ${msg}`);
  }
}

class AuditProcessor extends BaseProcessor {
  // 부모의 eventTypes를 덮어씀
  readonly eventTypes = ['NFT_ISSUED', 'TRANSFER'];

  // 부모의 process를 덮어씀 (override)
  async process(message: StreamMessage): Promise<void> {
    await super.process(message);   // ← 부모의 process를 먼저 실행
    this.log('감사 로그 기록');     // ← 부모의 log() 메서드를 그대로 사용
  }
}
```

`super.process(message)`는 "부모 클래스의 process 메서드를 실행해라"는 의미다. 부모의 기존 동작을 유지하면서 추가 동작을 붙일 때 쓴다.

---

### `super()`를 왜 호출해야 하는가

`extends`로 자식 클래스를 만들고 자식의 constructor를 정의할 때는 반드시 `super()`를 먼저 호출해야 한다.

```typescript
class Animal {
  constructor(public name: string) {}
}

class Dog extends Animal {
  constructor(name: string, public breed: string) {
    super(name);  // ← 반드시 첫 줄에. 부모의 constructor를 실행
    // super() 없으면: 에러 — Constructors for subclasses must contain a 'super' call.
  }
}
```

이유: 자식 객체는 부모 객체 위에 만들어진다. 부모의 constructor가 먼저 실행돼야 부모의 필드가 초기화되고, 그 이후에 자식의 필드를 추가할 수 있다. `super()`는 "부모를 먼저 초기화해라"는 명령이다.

```
super(name) 호출
    ↓
Animal constructor 실행 → this.name = name 저장
    ↓
Dog constructor 나머지 실행 → this.breed = breed 저장
    ↓
완성된 Dog 객체
```

---

### 비교 표

| | `implements` | `extends` |
|---|---|---|
| 대상 | 인터페이스 (`interface`) | 클래스 (`class`) |
| 코드 재사용 | 없음 — 전부 직접 구현 | 있음 — 부모 코드를 물려받음 |
| 목적 | "이 약속을 지킬게" 선언 | "부모 코드를 가져와서 쓸게" |
| 컴파일러 검사 | 인터페이스의 모든 멤버를 구현했는지 | 부모 constructor 호출(`super`) 여부 |

---

### 판단 기준: 언제 어느 것을 쓰는가

**`implements`를 쓸 때**: 여러 클래스를 같은 방식으로 다루고 싶지만, 각 클래스의 내부 구현은 완전히 다를 때.

```typescript
// NFTIssuedProcessor와 TransferProcessor는 내부 로직이 전혀 다름
// 그러나 둘 다 EventProcessor로 취급할 수 있어야 함
class NFTIssuedProcessor implements EventProcessor { /* 민팅 로직 */ }
class TransferProcessor implements EventProcessor { /* 전송 로직 */ }

// 이렇게 하나의 배열로 다룰 수 있게 됨
const processors: EventProcessor[] = [
  new NFTIssuedProcessor(...),
  new TransferProcessor(...),
];
```

**`extends`를 쓸 때**: 공통 로직이 있어서 중복을 없애고 싶을 때.

```typescript
// 모든 처리기가 공통으로 갖는 로직을 BaseProcessor에 구현
class BaseProcessor implements EventProcessor {
  async process(message: StreamMessage): Promise<void> {
    // 공통 전처리, 에러 핸들링 등
  }
}

// 자식은 공통 로직은 그대로 쓰고, 특화된 부분만 추가
class AuditProcessor extends BaseProcessor { /* 감사 로그만 추가 */ }
class MetricsProcessor extends BaseProcessor { /* 지표 수집만 추가 */ }
```

**함께 쓰는 경우**:

```typescript
// BaseProcessor가 EventProcessor를 implements → 약속 선언
class BaseProcessor implements EventProcessor { ... }

// AuditProcessor는 BaseProcessor를 extends → 코드 상속
// BaseProcessor가 EventProcessor를 구현했으므로 AuditProcessor도 자동으로 EventProcessor 만족
class AuditProcessor extends BaseProcessor { ... }

const processors: EventProcessor[] = [new AuditProcessor(...)];  // ✅
```

> **핵심**: `implements`는 형태(what)를 강제하고, `extends`는 코드(how)를 공유한다.

---

## 5. `static` 멤버

### 인스턴스 멤버 vs static 멤버

일반 멤버는 `new`로 만든 객체(인스턴스)에 속한다. `static` 멤버는 클래스 자체에 속한다.

```typescript
class RetryPolicy {
  // static 멤버 — 클래스 자체에 속함
  static readonly DEFAULT_MAX_ATTEMPTS = 3;
  static readonly DEFAULT_BASE_DELAY_MS = 1000;

  static create(): RetryPolicy {
    return new RetryPolicy(
      RetryPolicy.DEFAULT_MAX_ATTEMPTS,    // 클래스명으로 접근
      RetryPolicy.DEFAULT_BASE_DELAY_MS,
    );
  }

  // 인스턴스 멤버 — new로 만든 객체에 속함
  constructor(
    readonly maxAttempts: number,
    readonly baseDelayMs: number,
  ) {}
}

// static: new 없이 클래스명으로 직접 접근
RetryPolicy.DEFAULT_MAX_ATTEMPTS;  // 3
const policy = RetryPolicy.create();

// 인스턴스: new로 만든 후 접근
const p = new RetryPolicy(5, 2000);
p.maxAttempts;   // 5
p.baseDelayMs;   // 2000
```

```
RetryPolicy (클래스 자체)
  ├── DEFAULT_MAX_ATTEMPTS = 3     ← static
  ├── DEFAULT_BASE_DELAY_MS = 1000 ← static
  └── create()                     ← static

new RetryPolicy(3, 1000) (인스턴스 A)
  ├── maxAttempts = 3
  └── baseDelayMs = 1000

new RetryPolicy(5, 2000) (인스턴스 B)
  ├── maxAttempts = 5
  └── baseDelayMs = 2000
```

static 멤버는 인스턴스가 몇 개든 하나만 존재한다. 모든 인스턴스가 공유한다.

---

### 왜 강의 코드에서 `static readonly`를 자주 쓰는가

```typescript
// ❌ 전역 상수 — 어느 클래스와 관련 있는지 알 수 없음
const GAS_BUMP_PERCENT = 10;
const REORG_WAIT_BLOCKS = 12;

class GasManager {
  bumpGas(currentGas: bigint): bigint {
    return currentGas * BigInt(GAS_BUMP_PERCENT) / 100n;
  }
}
```

```typescript
// ✅ static 상수 — GasManager와 관련 있음이 코드 구조에서 명확
class GasManager {
  private static readonly GAS_BUMP_PERCENT = 10;
  private static readonly REORG_WAIT_BLOCKS = 12;

  bumpGas(currentGas: bigint): bigint {
    return currentGas * BigInt(GasManager.GAS_BUMP_PERCENT) / 100n;
    // GasManager.GAS_BUMP_PERCENT → "이 상수는 GasManager의 것"이 명확
  }
}
```

두 가지 이유:
1. **소속 명확화**: 상수가 어느 클래스에 속하는지 코드 구조로 표현
2. **전역 오염 방지**: 관련 없는 곳에서 실수로 쓰는 것을 막음 (`private static`이면 외부 접근 불가)

`static readonly`는 "이 값은 인스턴스와 무관하고, 한 번 정해지면 바뀌지 않는 클래스 수준의 상수"다.

> **핵심**: `static readonly DEFAULT_MAX_ATTEMPTS = 3`은 "어느 인스턴스를 만들든 상관없이, 이 클래스의 기본값은 3이고 절대 바뀌지 않는다"는 선언이다.

---

## 6. 다형성 — 여러 구현체를 하나의 배열로 다루기

### 다형성이 뭔가

같은 인터페이스를 구현한 클래스들을 동일한 방식으로 다룰 수 있는 것. "형태가 같으면 내부가 달라도 같은 코드로 처리한다."

```typescript
interface EventProcessor {
  eventTypes: string[];
  process(message: StreamMessage): Promise<void>;
}

class NFTIssuedProcessor implements EventProcessor {
  readonly eventTypes = ['NFT_ISSUED'];
  async process(message: StreamMessage): Promise<void> { /* 민팅 처리 */ }
}

class TransferProcessor implements EventProcessor {
  readonly eventTypes = ['TRANSFER'];
  async process(message: StreamMessage): Promise<void> { /* 전송 처리 */ }
}

class BurnProcessor implements EventProcessor {
  readonly eventTypes = ['BURN'];
  async process(message: StreamMessage): Promise<void> { /* 소각 처리 */ }
}
```

세 클래스는 내부 구현이 완전히 다르다. 그러나 모두 `EventProcessor`를 implements했으므로 하나의 배열에 담을 수 있다.

```typescript
// EventProcessor[] 배열에 세 종류를 모두 담을 수 있는 이유:
// 셋 모두 EventProcessor가 요구하는 형태를 만족하기 때문
const processors: EventProcessor[] = [
  new NFTIssuedProcessor(idempotency, ledger),
  new TransferProcessor(idempotency, ledger),
  new BurnProcessor(idempotency, ledger),
];
```

---

### `filter → map → Promise.all` 흐름 분해

강의 코드에서 자주 보이는 패턴:

```typescript
await Promise.all(
  processors
    .filter(p => p.eventTypes.includes(eventType))
    .map(p => p.process(msg))
);
```

처음 보면 한 줄처럼 보이지만, 세 단계다. 단계별로 분해한다.

---

**단계 1: `filter` — 해당 이벤트를 처리할 수 있는 것만 남기기**

```typescript
const matched = processors.filter(p => p.eventTypes.includes(eventType));
// eventType = 'NFT_ISSUED'이면:
//   NFTIssuedProcessor: eventTypes = ['NFT_ISSUED'] → includes('NFT_ISSUED') = true → 남김
//   TransferProcessor:  eventTypes = ['TRANSFER']   → includes('NFT_ISSUED') = false → 제외
//   BurnProcessor:      eventTypes = ['BURN']        → includes('NFT_ISSUED') = false → 제외
// matched = [NFTIssuedProcessor]
```

---

**단계 2: `map` — 각 처리기에 process 호출, Promise 배열 만들기**

```typescript
const promises = matched.map(p => p.process(msg));
// p.process(msg)는 Promise<void>를 반환 (async 메서드이므로)
// map은 각 처리기에 대해 process를 호출하고, 반환된 Promise들을 배열로 모음
// promises = [Promise<void>, Promise<void>, ...]
```

여기서 `await`가 없다는 점이 중요하다. `map`은 Promise를 기다리지 않고 배열로 수집만 한다.

---

**단계 3: `Promise.all` — 모든 Promise를 동시에 실행하고 전부 완료될 때까지 대기**

```typescript
await Promise.all(promises);
// 모든 process()를 동시에 시작하고, 전부 끝날 때까지 기다림
// 하나라도 실패하면 즉시 에러 (fail-fast)
```

순서대로 기다리는 것과의 차이:

```typescript
// ❌ 순서대로 — 처리기 3개면 3번 기다림 (직렬)
for (const p of matched) {
  await p.process(msg);
}

// ✅ 동시에 — 처리기 3개가 동시에 실행 (병렬)
await Promise.all(matched.map(p => p.process(msg)));
```

---

**전체 흐름을 한 번에**

```typescript
await Promise.all(
  processors                                    // EventProcessor[] 전체
    .filter(p => p.eventTypes.includes(type))  // 이 이벤트를 처리할 수 있는 것만
    .map(p => p.process(msg))                  // 각각 process() 호출 → Promise[] 수집
);                                              // 모든 Promise 병렬 실행 + 완료 대기
```

다형성이 없다면 이 코드를 쓸 수 없다. processors 배열에 담으려면 모든 요소가 같은 타입이어야 하고, 그 타입이 `eventTypes`와 `process`를 갖고 있어야 한다. `implements EventProcessor`가 그것을 보장한다.

> **핵심**: 다형성은 "내부가 다른 여러 구현체를 같은 코드로 처리"할 수 있게 한다. `implements`가 그 보장을 컴파일 타임에 제공한다.

---

## 강의 코드 전체 해독

```typescript
export class NFTIssuedProcessor implements EventProcessor {
  readonly eventTypes = ['NFT_ISSUED'];

  constructor(
    private readonly idempotency: IdempotencyGuard,
    private readonly ledger: LedgerService,
  ) {}

  async process(message: StreamMessage): Promise<void> {
    const key = `nft-issued:${message.id}`;
    await this.idempotency.run(key, async () => {
      await this.ledger.credit(...);
    });
  }
}
```

줄별 완전 해독:

```
export class NFTIssuedProcessor implements EventProcessor {
│                               └── EventProcessor 약속 반드시 만족해야 함
│                                   (eventTypes, process 둘 다 있어야 컴파일됨)
└── 외부 파일에서 import 가능

  readonly eventTypes = ['NFT_ISSUED'];
  │        └── 값 변경 불가
  └── 인스턴스 필드. EventProcessor가 요구. 이 처리기는 NFT_ISSUED만 처리함

  constructor(
    private readonly idempotency: IdempotencyGuard,
    //^^^^^^^ ^^^^^^^^
    //   |        +-- 생성 후 this.idempotency = 다른값 불가
    //   +----------- 외부에서 service.idempotency 접근 불가
    private readonly ledger: LedgerService,
  ) {}
  //  본문 비어있음 — 단축 문법으로 필드 선언+할당 이미 완료

  async process(message: StreamMessage): Promise<void> {
  //^^^^ 비동기 메서드 — 내부에서 await 사용 가능, 반환값은 Promise<void>

    const key = `nft-issued:${message.id}`;
    // message.id = 'msg-123'이면 key = 'nft-issued:msg-123'
    // 이 key로 "이미 처리한 메시지인가" 확인 (중복 처리 방지)

    await this.idempotency.run(key, async () => {
    // this.idempotency = 생성자에서 받은 IdempotencyGuard 필드
    // key로 이미 처리됐으면 콜백 건너뜀, 처음이면 콜백 실행

      await this.ledger.credit(...);
      // this.ledger = 생성자에서 받은 LedgerService 필드
      // 원장에 금액 기록 (실제 비즈니스 로직)
    });
  }
}
```

한 문단 요약: `NFTIssuedProcessor`는 `EventProcessor` 약속을 지키는 클래스다. `NFT_ISSUED` 이벤트만 처리하며, 중복 처리 방지(`idempotency`)와 원장 기록(`ledger`) 두 의존성을 생성자 단축 문법으로 내부 전용 변경 불가 필드에 저장한다. `process`가 호출되면 메시지 id로 유일한 키를 만들어 중복 여부를 확인하고, 처음이면 원장에 기록한다.

---

## 자주 하는 실수

**실수 1 — TypeScript에서 필드 선언 없이 constructor만 쓰기**

```typescript
// ❌ JS 방식 — TS에서 에러
class User {
  constructor(name: string) {
    this.name = name;  // 에러: Property 'name' does not exist on type 'User'
  }
}

// ✅ 필드를 class body에 선언하거나
class User {
  name: string;
  constructor(name: string) { this.name = name; }
}

// ✅ 단축 문법으로 한 번에
class User {
  constructor(public name: string) {}
}
```

**실수 2 — `implements`에 클래스를, `extends`에 인터페이스를 쓰기**

```typescript
interface IProcessor { process(): void; }
class BaseProcessor { process(): void {} }

// ❌ 인터페이스를 extends로
class A extends IProcessor {}  // 에러: Cannot extend an interface

// ❌ 클래스를 implements로 (동작하긴 하지만 의도가 다름)
// implements는 형태만 보장, 코드 재사용 없음

// ✅
class A implements IProcessor { process(): void {} }  // 인터페이스는 implements
class B extends BaseProcessor {}                       // 클래스는 extends
```

**실수 3 — static 멤버를 `this`로 접근하기**

```typescript
class Config {
  static readonly MAX = 10;

  check(): void {
    console.log(this.MAX);    // ❌ 에러: Property 'MAX' does not exist on type 'Config'
    console.log(Config.MAX);  // ✅ static은 클래스명으로 접근
  }
}
```

**실수 4 — `extends`에서 constructor 정의 시 `super()` 빠뜨리기**

```typescript
class Animal {
  constructor(public name: string) {}
}

// ❌ super() 없음
class Dog extends Animal {
  constructor(name: string, public breed: string) {
    // 에러: Constructors for subclasses must contain a 'super' call.
    this.breed = breed;
  }
}

// ✅ super() 첫 줄에
class Dog extends Animal {
  constructor(name: string, public breed: string) {
    super(name);  // 부모 constructor 먼저
    // this.breed는 단축 문법으로 이미 처리됨
  }
}
```

---

## 체크리스트

- [ ] `class`가 "틀", `new`가 "인스턴스 생성"임을 안다
- [ ] TypeScript에서 필드를 class body에 미리 선언해야 하는 이유를 설명할 수 있다
- [ ] `this`가 "지금 이 코드를 실행 중인 객체"를 가리킨다는 것을 안다
- [ ] 풀어 쓴 형태(필드 선언 + 매개변수 + this 할당)를 단축 문법 한 줄로 바꿀 수 있다
- [ ] `private`은 외부 접근 차단, `readonly`는 재할당 차단임을 구분해서 설명할 수 있다
- [ ] TypeScript 접근 제어자는 컴파일 타임에만 동작하고 런타임에는 효과 없음을 안다
- [ ] `implements`는 인터페이스와(약속), `extends`는 클래스와(상속) 쓰는 것을 안다
- [ ] `super()`를 왜 호출해야 하는지 설명할 수 있다
- [ ] `static readonly`가 인스턴스가 아닌 클래스 자체에 속한다는 것을 안다
- [ ] `filter → map → Promise.all` 패턴을 세 단계로 분해해서 설명할 수 있다
- [ ] 다형성이 없으면 `filter → map → Promise.all` 패턴을 쓸 수 없는 이유를 설명할 수 있다

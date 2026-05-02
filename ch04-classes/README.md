# CH04 — 클래스

## 핵심 한 줄
> 클래스 = 데이터(필드) + 동작(메서드)을 묶은 틀. 강의 코드에서 서비스, 처리기, 저장소가 전부 클래스로 구현된다.

---

## 1. 기본 구조

### 코드

```typescript
class User {
  name: string;     // 필드 — 이 클래스가 저장하는 데이터
  age: number;

  constructor(name: string, age: number) {  // 생성자 — new 할 때 자동으로 실행
    this.name = name;  // 외부에서 받은 name을 이 객체의 name 필드에 저장
    this.age = age;
  }

  greet(): string {  // 메서드 — 이 클래스가 할 수 있는 동작
    return `Hi, ${this.name}`;
  }
}

const u = new User('Sharon', 40);  // 생성자 호출 → name='Sharon', age=40 저장
u.greet();  // 'Hi, Sharon'
```

### 단계별 분해

클래스를 이해하는 가장 쉬운 방법은 "붕어빵 틀"로 생각하는 것이다.

```
class User = 붕어빵 틀 (형태를 정의)
           ↓
new User('Sharon', 40) = 틀에서 붕어빵 하나 찍어냄 (인스턴스 생성)
           ↓
u = 만들어진 붕어빵 하나 (인스턴스)
           ↓
u.greet() = 그 붕어빵(u)에게 greet 동작을 시킴
```

클래스는 틀이고, `new`로 만드는 것이 실제 객체(인스턴스)다. 틀 하나로 수십 개의 객체를 찍어낼 수 있다.

### `this`가 하는 역할

`constructor` 안의 `this`는 "지금 만들어지고 있는 이 객체"를 가리킨다.

```typescript
constructor(name: string, age: number) {
  // name은 외부에서 받은 매개변수
  // this.name은 이 객체의 필드
  // 아래 줄: "이 객체의 name 필드에 매개변수 name을 저장"
  this.name = name;
}
```

---

## 2. 접근 제어자

| 키워드 | 접근 가능 범위 |
|--------|----------------|
| `public` | 어디서든 접근 가능 (기본값, 생략해도 됨) |
| `private` | 클래스 내부에서만 |
| `protected` | 클래스 내부 + 자식 클래스까지 |
| `readonly` | 어디서든 읽기는 되지만 변경 불가 |

### 코드

```typescript
class TxService {
  public readonly id: string;      // 외부에서 읽기 가능, 변경 불가
  private db: Database;            // 외부에서 접근 불가
  protected logger: Logger;        // 자식 클래스에서 접근 가능

  constructor(id: string, db: Database, logger: Logger) {
    this.id = id;
    this.db = db;
    this.logger = logger;
  }
}
```

### 각 제어자를 쓰는 이유

**`private`**: 외부에서 직접 건드리면 안 되는 내부 구현 세부사항을 숨긴다. 예를 들어 `db`(데이터베이스 연결)는 클래스 내부 메서드를 통해서만 써야 하고, 외부에서 직접 건드리면 위험하다.

**`readonly`**: 한 번 정해지면 절대 바뀌면 안 되는 값에 붙인다. `id`는 객체가 만들어질 때 정해지고 이후 변경되면 안 된다.

**`protected`**: 부모 클래스의 내부 구현이지만, 자식 클래스가 상속받아 사용해야 할 필요가 있을 때 쓴다. `private`이면 자식도 못 쓰고, `public`이면 너무 열려 있다.

### 실수하기 쉬운 부분

```typescript
const service = new TxService('id-1', db, logger);

service.id;           // OK — public readonly
service.id = 'id-2'; // 에러 — readonly, 변경 불가
service.db;           // 에러 — private, 외부 접근 불가
service.logger;       // 에러 — protected, 클래스/자식 클래스 내부에서만 접근 가능
```

---

## 3. 생성자 단축 문법 — 강의 코드 표준

### 핵심: "단축"이란 무엇인가

TypeScript 없이 클래스에 의존성을 주입하려면 아래처럼 써야 한다:

```typescript
// 풀어 쓴 것 — 4단계 반복 작업
class Service {
  // 1단계: 필드를 선언하고
  private readonly redis: RedisClient;
  private readonly logger: Logger;

  constructor(redis: RedisClient, logger: Logger) {
    // 2단계: 매개변수를 받고
    // 3단계: this.필드에 매개변수를 할당하고
    this.redis = redis;
    this.logger = logger;
    // 4단계: 반복. 의존성이 5개면 이 패턴을 5번
  }
}
```

TypeScript의 단축 문법은 이 반복을 하나로 압축한다:

```typescript
// 단축 문법 — 완전히 동일한 코드
class Service {
  constructor(
    private readonly redis: RedisClient,   // 필드 선언 + 할당 동시에
    private readonly logger: Logger,       // 필드 선언 + 할당 동시에
  ) {}
  // 본문이 비어 있어도 된다 — 이미 생성자 매개변수에서 다 처리됐으니
}
```

결론: `constructor(private readonly redis: RedisClient)`는 아래 세 줄을 한 번에 처리한다.
1. `private readonly redis: RedisClient;` — 필드 선언
2. 생성자 매개변수 `redis: RedisClient` 수신
3. `this.redis = redis;` — 필드에 할당

### `private`와 `readonly` 각각의 역할

```typescript
constructor(
  private readonly redis: RedisClient,
  //^^^^^^^ ^^^^^^^^
  //   |        |
  //   |        +-- readonly: 생성 후 이 필드를 변경 불가
  //   +----------- private: 클래스 외부에서 이 필드에 접근 불가
)
```

- `private`: 외부에서 `service.redis`처럼 직접 접근하지 못하게 막는다. redis 연결은 내부 구현 세부사항이고, 외부에서 건드리면 안 된다.
- `readonly`: 생성자에서 할당된 이후 `this.redis = 다른값`처럼 바꾸지 못하게 막는다. 한 번 주입된 의존성은 교체되면 안 된다.

### 강의 코드 읽는 법

강의 코드에서 아래 패턴이 나오면:

```typescript
constructor(
  private readonly idempotency: IdempotencyGuard,
  private readonly ledger: LedgerService,
) {}
```

한 문장으로 읽는다: "외부에서 `IdempotencyGuard`와 `LedgerService`를 받아서, 이 클래스 내부에서만 쓸 수 있는 변경 불가 필드로 저장한다."

---

## 4. implements — 인터페이스 약속

### 코드

```typescript
interface EventProcessor {
  eventTypes: string[];
  process(message: StreamMessage): Promise<void>;
}

class NFTIssuedProcessor implements EventProcessor {
  readonly eventTypes = ['NFT_ISSUED'];  // 인터페이스가 요구하는 필드

  constructor(
    private readonly idempotency: IdempotencyGuard,
    private readonly ledger: LedgerService,
  ) {}

  async process(message: StreamMessage): Promise<void> {  // 인터페이스가 요구하는 메서드
    // ...
  }
}
```

### `implements`가 하는 일

`implements EventProcessor`를 붙이면 TypeScript 컴파일러가 "이 클래스가 `EventProcessor` 인터페이스를 완전히 구현했는가?"를 검사한다. 인터페이스가 요구하는 필드나 메서드를 하나라도 빠뜨리면 즉시 컴파일 에러가 난다.

```typescript
// 잘못된 예 — process 메서드를 빠뜨리면:
class BadProcessor implements EventProcessor {
  readonly eventTypes = ['NFT_ISSUED'];
  // process 메서드 없음!
  // 에러: Class 'BadProcessor' incorrectly implements interface 'EventProcessor'.
  //        Property 'process' is missing in type 'BadProcessor'
}
```

### 왜 이렇게 쓰는가 — 핵심 이유

`implements`를 사용하는 핵심 이유는 "여러 다른 클래스를 같은 방식으로 다루기 위해서"다.

```typescript
// NFTIssuedProcessor, NFTBurnedProcessor, TransferProcessor 모두
// EventProcessor를 implements 하므로
const processors: EventProcessor[] = [
  new NFTIssuedProcessor(idempotency, ledger),
  new NFTBurnedProcessor(idempotency, ledger),
  new TransferProcessor(idempotency, ledger),
];

// 각 처리기의 내부 구현이 뭔지 몰라도 동일하게 사용 가능
await Promise.all(
  processors
    .filter(p => p.eventTypes.includes(eventType))
    .map(p => p.process(msg))
);
```

비유로 이해하기: `EventProcessor`는 "이 회사에서 일하려면 한국어와 영어를 할 수 있어야 한다"는 채용 조건이다. 실제로 어느 대학 출신인지, 무슨 경력이 있는지(내부 구현)는 상관없다. 조건만 만족하면 같은 방식으로 일을 시킬 수 있다.

---

## 5. extends — 클래스 상속

### 코드

```typescript
class BaseProcessor implements EventProcessor {
  readonly eventTypes: string[] = [];

  async process(message: StreamMessage): Promise<void> {
    console.log('기본 처리');
  }
}

class AuditProcessor extends BaseProcessor {
  // 부모의 eventTypes를 덮어씀
  readonly eventTypes = ['NFT_ISSUED', 'TRANSFER'];

  async process(message: StreamMessage): Promise<void> {
    await super.process(message);   // 부모 메서드 먼저 실행
    console.log('감사 로그 기록');  // 그 다음 추가 동작
  }
}
```

### 단계별 분해

`extends`는 부모 클래스의 모든 것(필드, 메서드)을 물려받은 뒤, 필요한 부분만 덮어쓰거나 추가할 수 있게 해준다.

```
BaseProcessor (부모)
  - eventTypes: []
  - process(): console.log('기본 처리')

AuditProcessor extends BaseProcessor (자식)
  - eventTypes: ['NFT_ISSUED', 'TRANSFER']  ← 덮어씀
  - process():
      super.process()          ← 부모 메서드를 먼저 실행 (console.log('기본 처리'))
      console.log('감사 로그') ← 그 다음 추가 동작
```

`super.process(message)`는 "부모 클래스의 `process` 메서드를 실행해라"는 의미다. 부모의 기존 동작을 유지하면서 추가 동작을 붙일 때 쓴다.

---

## `implements` vs `extends` — 명확한 구분

이 둘은 생김새가 비슷해서 자주 혼동된다. 핵심 차이는 하나다.

| | `implements` | `extends` |
|---|---|---|
| 대상 | 인터페이스(interface) | 클래스(class) |
| 코드 재사용 | 없음 (형태만 맞춤) | 있음 (부모 코드를 물려받음) |
| 목적 | "이 약속을 지킬게" 선언 | "부모 코드를 가져와서 쓸게" |
| 구현 의무 | 모든 멤버를 직접 구현해야 함 | 부모 것을 그대로 쓰거나 덮어씀 |

### 언제 implements, 언제 extends를 쓰는가

**`implements`를 쓰는 경우**: 여러 다른 클래스들이 같은 방식으로 사용될 수 있다는 것을 보장하고 싶을 때. 코드를 공유할 필요 없이 "형태"만 통일하면 될 때.

```typescript
// NFTIssuedProcessor와 TransferProcessor는
// 구현 내용이 완전히 다르지만, 둘 다 EventProcessor로 쓸 수 있다
class NFTIssuedProcessor implements EventProcessor { ... }
class TransferProcessor implements EventProcessor { ... }
```

**`extends`를 쓰는 경우**: 공통 로직이 있어서 코드를 재사용하고 싶을 때. 여러 클래스가 공통 동작을 가질 때 중복을 없애기 위해.

```typescript
// AuditProcessor는 BaseProcessor의 기본 로직을 재사용하면서
// 감사 로그 기능만 추가
class AuditProcessor extends BaseProcessor { ... }
```

### 함께 쓰는 경우

```typescript
// BaseProcessor가 EventProcessor를 implements하고 (약속 선언)
class BaseProcessor implements EventProcessor { ... }

// AuditProcessor는 BaseProcessor를 extends하므로 (코드 상속)
// 자동으로 EventProcessor도 만족한다
class AuditProcessor extends BaseProcessor { ... }
```

---

## 6. static 멤버

### 코드

```typescript
class RetryPolicy {
  static readonly DEFAULT_MAX_ATTEMPTS = 3;    // 클래스 자체의 상수
  static readonly DEFAULT_BASE_DELAY_MS = 1000;

  static create(): RetryPolicy {               // 인스턴스 없이 호출 가능한 메서드
    return new RetryPolicy(
      RetryPolicy.DEFAULT_MAX_ATTEMPTS,
      RetryPolicy.DEFAULT_BASE_DELAY_MS,
    );
  }

  constructor(
    readonly maxAttempts: number,
    readonly baseDelayMs: number,
  ) {}
}

// 사용 — new 없이 클래스명으로 직접 접근
RetryPolicy.DEFAULT_MAX_ATTEMPTS;  // 3
const policy = RetryPolicy.create();
```

### `static`이 뭔가

`static`이 없는 일반 멤버는 인스턴스(new로 만든 객체)에 속한다. `static`이 붙은 멤버는 클래스 자체에 속한다.

```
RetryPolicy (클래스 자체)
  ├── DEFAULT_MAX_ATTEMPTS = 3     ← static: 클래스에 속함
  ├── DEFAULT_BASE_DELAY_MS = 1000 ← static: 클래스에 속함
  └── create()                     ← static: 클래스에 속함

new RetryPolicy(3, 1000) (인스턴스)
  ├── maxAttempts = 3    ← 인스턴스에 속함
  └── baseDelayMs = 1000 ← 인스턴스에 속함
```

비유로 이해하기: `static`은 클래스의 "공용 정보"다. 예를 들어 "이 회사(클래스)의 전화번호(static)"는 직원 개개인(인스턴스)의 것이 아니라 회사 자체의 것이다. 직원이 몇 명이든 상관없이 항상 같다.

### 왜 강의 코드에서 자주 쓰는가

```typescript
class GasManager {
  // 상수를 클래스 밖 전역에 두지 않고, 관련 클래스 안에 묶어두는 패턴
  private static readonly GAS_BUMP_PERCENT = 10;
  private static readonly REORG_WAIT_BLOCKS = 12;

  bumpGas(currentGas: bigint): bigint {
    // this.GAS_BUMP_PERCENT가 아니라 GasManager.GAS_BUMP_PERCENT
    return currentGas * BigInt(GasManager.GAS_BUMP_PERCENT) / 100n;
  }
}
```

이렇게 하면 `GAS_BUMP_PERCENT`라는 상수가 `GasManager`와 관련이 있다는 것이 코드 구조에서 명확히 드러난다. 전역 변수로 떠돌지 않는다.

---

## 강의 코드 해독 연습

### 코드

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

### 줄별 완전 해독

```
export class NFTIssuedProcessor implements EventProcessor {
│                               │
│                               └── EventProcessor 인터페이스를 반드시 만족해야 함
└── 외부 파일에서 import 가능

  readonly eventTypes = ['NFT_ISSUED'];
  │        │             │
  │        │             └── 이 처리기는 'NFT_ISSUED' 타입만 처리함
  │        └── 값 변경 불가
  └── 인스턴스 필드 (EventProcessor가 요구)

  constructor(
    private readonly idempotency: IdempotencyGuard,
    //^^^^^^^ ^^^^^^^^ ^^^^^^^^^^
    //   |        |       └── 타입: IdempotencyGuard
    //   |        └── 생성 후 변경 불가
    //   └── 외부 접근 불가, 내부 전용
    private readonly ledger: LedgerService,
  ) {}
  // 본문 비어있음 — 단축 문법으로 필드 선언+할당 이미 완료

  async process(message: StreamMessage): Promise<void> {
  //^^^^ 비동기 메서드. await 사용 가능
    const key = `nft-issued:${message.id}`;
    // 예: message.id가 'msg-123'이면 key = 'nft-issued:msg-123'
    // 이 key는 중복 처리 방지(idempotency)에 사용

    await this.idempotency.run(key, async () => {
    // this.idempotency = 생성자에서 받은 IdempotencyGuard 필드
    // key로 "이미 처리했는지" 확인하고, 처음이면 콜백 실행, 중복이면 건너뜀

      await this.ledger.credit(...);
      // this.ledger = 생성자에서 받은 LedgerService 필드
      // 원장(ledger)에 금액 기록
    });
  }
}
```

### 한 문단으로 요약

"`NFTIssuedProcessor`는 `EventProcessor` 약속을 지키는 클래스다. `NFT_ISSUED` 이벤트만 처리하며, 중복 처리 방지(idempotency)와 원장 기록(ledger) 두 개의 외부 의존성을 생성자로 주입받아 내부 전용 필드로 저장한다. `process`가 호출되면 메시지 id로 유일한 키를 만들어 idempotency를 확인하고, 처음 처리하는 경우에만 ledger에 기록한다."

---

## 체크리스트

- [ ] `class`가 "틀(붕어빵 틀)", `new`가 "인스턴스 생성(붕어빵 찍기)"임을 안다
- [ ] `this`가 "지금 이 객체"를 가리킨다는 것을 안다
- [ ] `private readonly`가 생성자 매개변수에 붙으면 필드 선언 + 할당을 동시에 처리함을 안다
- [ ] 단축 문법을 풀어 쓰면 몇 줄인지 직접 써볼 수 있다
- [ ] `implements`는 인터페이스와 쓰고 (약속), `extends`는 클래스와 쓴다 (상속)는 것을 안다
- [ ] `implements`와 `extends` 중 어느 것을 쓸지 판단 기준을 설명할 수 있다
- [ ] `static readonly`가 인스턴스가 아닌 클래스 자체에 속한다는 것을 안다
- [ ] 강의 코드의 클래스 선언 첫 줄을 한 문장으로 풀이할 수 있다

# CH04 — 클래스

## 핵심 한 줄
> 클래스 = 데이터(필드) + 동작(메서드)을 묶은 틀. 강의 코드에서 서비스, 처리기, 저장소가 전부 클래스로 구현된다.

---

## 1. 기본 구조

```typescript
class User {
  name: string;     // 필드
  age: number;

  constructor(name: string, age: number) {  // 생성자 — new 할 때 실행
    this.name = name;
    this.age = age;
  }

  greet(): string {  // 메서드
    return `Hi, ${this.name}`;
  }
}

const u = new User('Sharon', 40);
u.greet();  // 'Hi, Sharon'
```

---

## 2. 접근 제어자

| 키워드 | 접근 가능 범위 |
|--------|----------------|
| `public` | 어디서든 접근 가능 (기본값, 생략해도 됨) |
| `private` | 클래스 내부에서만 |
| `protected` | 클래스 내부 + 자식 클래스까지 |
| `readonly` | 어디서든 읽기는 되지만 변경 불가 |

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

---

## 3. 생성자 단축 문법 — 강의 코드 표준

매개변수 앞에 접근 제어자를 붙이면 필드 선언 + 할당을 한 번에 처리한다.

```typescript
// 풀어 쓴 것
class Service {
  private readonly redis: RedisClient;
  private readonly logger: Logger;

  constructor(redis: RedisClient, logger: Logger) {
    this.redis = redis;
    this.logger = logger;
  }
}

// 단축 문법 (완전히 동일한 코드)
class Service {
  constructor(
    private readonly redis: RedisClient,
    private readonly logger: Logger,
  ) {}
}
```

강의 코드에서 이 패턴이 나오면 "외부에서 의존성을 받아 내부 필드로 저장한다"고 읽으면 된다.

---

## 4. implements — 인터페이스 약속

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

`implements`를 붙이면 인터페이스가 요구하는 필드/메서드를 하나라도 빠뜨리면 컴파일 에러.

**왜 이렇게 쓰나:**
- NFTIssuedProcessor, NFTBurnedProcessor, TransferProcessor 등 여러 처리기를 만들어도
- 전부 `EventProcessor`라는 이름으로 묶어서 같은 방식으로 사용할 수 있다

```typescript
const processors: EventProcessor[] = [
  new NFTIssuedProcessor(idempotency, ledger),
  new NFTBurnedProcessor(idempotency, ledger),
];

// 각 처리기가 뭔지 몰라도 동일하게 사용 가능
await Promise.all(
  processors
    .filter(p => p.eventTypes.includes(eventType))
    .map(p => p.process(msg))
);
```

---

## 5. extends — 클래스 상속

```typescript
class BaseProcessor implements EventProcessor {
  readonly eventTypes: string[] = [];

  async process(message: StreamMessage): Promise<void> {
    console.log('기본 처리');
  }
}

class AuditProcessor extends BaseProcessor {
  readonly eventTypes = ['NFT_ISSUED', 'TRANSFER'];

  async process(message: StreamMessage): Promise<void> {
    await super.process(message);   // 부모 메서드 먼저 실행
    console.log('감사 로그 기록');  // 그 다음 추가 동작
  }
}
```

`extends` vs `implements`:
- `extends` — 부모 클래스의 코드를 물려받음 (코드 재사용)
- `implements` — 인터페이스의 형태만 맞춤 (코드 재사용 없음, 약속만)

---

## 6. static 멤버

인스턴스(new로 만든 객체)가 아닌 클래스 자체에 속하는 값/메서드:

```typescript
class RetryPolicy {
  static readonly DEFAULT_MAX_ATTEMPTS = 3;    // 클래스 자체의 상수
  static readonly DEFAULT_BASE_DELAY_MS = 1000;

  static create(): RetryPolicy {               // 인스턴스 없이 호출 가능
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

// 사용
RetryPolicy.DEFAULT_MAX_ATTEMPTS;  // 클래스명으로 접근
const policy = RetryPolicy.create();
```

강의 코드에서 상수(GAS_BUMP_PERCENT, REORG_WAIT_BLOCKS 등)를 `private static readonly`로 클래스 안에 넣는 패턴이 자주 등장한다.

---

## 강의 코드 해독 연습

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

줄별 해석:
1. `EventProcessor` 인터페이스를 만족하는 클래스
2. `eventTypes`는 `['NFT_ISSUED']` 고정 (변경 불가)
3. 생성자로 idempotency, ledger 두 의존성을 받아 내부 필드로 저장
4. `process`는 idempotency 키를 만들고, 해당 키로 idempotency 처리 후 ledger에 기록

---

---

## 생소한 문법 해설

### `const { tokenId, toAddress } = message.fields as Record<string, string>`

```typescript
async process(message: StreamMessage): Promise<void> {
  const { tokenId, toAddress } = message.fields as Record<string, string>;
```

두 가지 문법이 합쳐져 있다:

1. **`as Record<string, string>`** — 타입 단언. `message.fields`의 실제 타입이 이미 `Record<string, string>`인데, 구조 분해 직전에 명시적으로 타입을 알려주는 것이다.
2. **`const { tokenId, toAddress } = ...`** — 객체 구조 분해. `message.fields['tokenId']`, `message.fields['toAddress']`를 각각 변수로 꺼내는 축약 문법이다.

풀어 쓰면:
```typescript
const tokenId   = (message.fields as Record<string, string>)['tokenId'];
const toAddress = (message.fields as Record<string, string>)['toAddress'];
```

### 생성자 단축 문법 — `constructor(private readonly ...)` 자세히

```typescript
// 단축 전 (명시적)
class TxService {
  private readonly ledger: LedgerService;

  constructor(ledger: LedgerService) {
    this.ledger = ledger;   // ① 선언  ② 할당
  }
}

// 단축 후 (동일 결과)
class TxService {
  constructor(
    private readonly ledger: LedgerService,  // ① + ② 한 번에
  ) {}
}
```

`private readonly`를 **생성자 매개변수 앞에** 붙이면 TypeScript가 자동으로:
1. `this.ledger: LedgerService` 필드를 선언하고  
2. `this.ledger = ledger` 할당을 생성자 본문에 삽입한다.

강의 코드에서 이 패턴이 나오면 "외부에서 의존성을 받아 내부에 저장한다"고 읽으면 된다.

### `if (processor.eventTypes.includes(msg.fields['eventType']))` 패턴

```typescript
if (processor.eventTypes.includes(msg.fields['eventType'])) {
  await processor.process(msg);
}
```

- `msg.fields['eventType']` — `Record<string, string>` 객체에서 키로 값을 꺼냄. `msg.fields.eventType`과 동일하지만 키가 동적일 때 대괄호 표기법을 쓴다.
- `.includes(값)` — 배열에 해당 값이 있으면 `true`.
- 결합하면: "이 processor가 처리할 이벤트 타입 목록에 메시지의 이벤트 타입이 포함되어 있는가?"

### `await super.process(message)` — 부모 메서드 호출

```typescript
class AuditProcessor extends BaseProcessor {
  async process(message: StreamMessage): Promise<void> {
    await super.process(message);  // 부모 클래스의 process 실행
    console.log('감사 로그 기록');
  }
}
```

`super.메서드명()`으로 부모 클래스의 메서드를 호출한다. 부모 메서드가 `async`이므로 `await`을 붙여야 완료를 기다릴 수 있다.

---

## 체크리스트

- [ ] `private readonly`가 생성자 매개변수에 붙으면 자동으로 필드가 생성됨을 안다
- [ ] `implements`와 `extends`의 차이를 설명할 수 있다
- [ ] 강의 코드의 클래스 선언 첫 줄을 한 문장으로 풀이할 수 있다
- [ ] `static readonly`가 인스턴스가 아닌 클래스 자체에 속한다는 것을 안다

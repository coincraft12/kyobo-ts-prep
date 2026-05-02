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

### 구체 예시  

**메시지 종류: 'NFT_ISSUED'**

processors = [
  발행처리자       { eventTypes: ['NFT_ISSUED'] }
  감사로그처리자    { eventTypes: ['NFT_ISSUED', 'NFT_BURNED'] }
  알림발송처리자    { eventTypes: ['NFT_ISSUED'] }
  소각처리자       { eventTypes: ['NFT_BURNED'] }
]

① filter 후 → [발행처리자, 감사로그처리자, 알림발송처리자]
              (소각처리자는 NFT_ISSUED 처리 못 해서 빠짐)

② map 후 → [
    발행처리자.process(msg),       ← 원장 +1
    감사로그처리자.process(msg),    ← 로그 기록
    알림발송처리자.process(msg),    ← 사용자 알림
  ]
  (셋 다 동시에 실행 시작)

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

## 체크리스트

- [ ] `private readonly`가 생성자 매개변수에 붙으면 자동으로 필드가 생성됨을 안다
- [ ] `implements`와 `extends`의 차이를 설명할 수 있다
- [ ] 강의 코드의 클래스 선언 첫 줄을 한 문장으로 풀이할 수 있다
- [ ] `static readonly`가 인스턴스가 아닌 클래스 자체에 속한다는 것을 안다

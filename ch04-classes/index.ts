// ─── CH04: 클래스 ────────────────────────────────────────────────────────────

// ─ 인터페이스 정의 ─
// 이 파일에서 사용할 인터페이스들. 실제 강의 코드의 구조를 그대로 반영.
interface StreamMessage {
  id: string;
  fields: Record<string, string>;
}

interface EventProcessor {
  eventTypes: string[];
  process(message: StreamMessage): Promise<void>;
}

interface LedgerService {
  credit(toAddress: string, tokenId: string, amount: number): Promise<void>;
}

interface IdempotencyGuard {
  run(key: string, fn: () => Promise<void>): Promise<void>;
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 1. 기본 클래스 구조                                                     │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   TypeScript 클래스. JavaScript 클래스와 동일하지만, 멤버 변수의 타입  │
// │   선언과 접근 제어자(public/private/protected)를 명시할 수 있다.       │
// │                                                                         │
// │ [JS와의 차이]                                                           │
// │   JS 클래스도 비슷하지만, TS는:                                        │
// │   - 필드 타입을 미리 선언해야 한다                                     │
// │   - private/public/readonly 등 접근 제어가 컴파일 타임에 적용된다     │
// │   - 인터페이스를 implements 해서 계약을 강제할 수 있다                 │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   public readonly address: string;                                      │
// │   ①      ②        ③       ④                                           │
// │   ① public: 클래스 외부에서도 접근 가능 (기본값이므로 보통 생략)     │
// │   ② readonly: 생성자에서 한 번만 값 설정. 이후 변경 불가.            │
// │   ③ address: 필드 이름                                                 │
// │   ④ string: 필드 타입                                                  │
// │                                                                         │
// │   private: 클래스 내부에서만 접근 가능. 외부에서 .chainId 접근 시 에러│
// │                                                                         │
// │ [주의사항]                                                              │
// │   - TypeScript의 private는 컴파일 타임 체크. 런타임에는 실제로         │
// │     막히지 않는다. 진짜 런타임 캡슐화는 JS의 #prefix 문법을 쓴다.    │
// │   - readonly 필드는 constructor 안에서만 할당 가능.                    │
// └─────────────────────────────────────────────────────────────────────────┘

class WalletAddress {
  public readonly address: string;    // 외부 접근 가능, 생성 후 변경 불가
  private readonly chainId: number;   // 클래스 내부에서만 접근 가능

  // constructor: 클래스 인스턴스를 생성할 때 호출되는 초기화 함수
  // this.필드 = 값 으로 필드에 초기값을 할당한다
  constructor(address: string, chainId: number) {
    this.address = address;    // 매개변수 → 필드 할당
    this.chainId = chainId;
  }

  // 메서드: this로 자신의 필드에 접근
  display(): string {
    return `chain=${this.chainId} addr=${this.address}`;
  }
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 2. 생성자 단축 문법 (Parameter Properties)                              │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   TypeScript 전용 문법. 생성자 매개변수에 접근 제어자를 붙이면         │
// │   필드 선언 + this 할당을 동시에 처리해준다.                            │
// │   강의 코드에서 가장 자주 보이는 클래스 패턴이다.                      │
// │                                                                         │
// │ [JS와의 차이]                                                           │
// │   JavaScript에는 이 문법이 없다. TS 전용.                              │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   constructor(private readonly ledger: LedgerService) {}               │
// │               ①       ②        ③      ④                               │
// │   ① private: 접근 제어자. 필드로 자동 선언됨                           │
// │   ② readonly: 재할당 불가                                              │
// │   ③ ledger: 필드 이름 (this.ledger로 접근 가능)                        │
// │   ④ LedgerService: 타입                                                │
// │                                                                         │
// │   WalletAddress 클래스의 6줄짜리 선언+할당을 이 방식으로 쓰면         │
// │   constructor 한 줄로 끝난다. 위 WalletAddress와 동일한 결과.         │
// │                                                                         │
// │ [주의사항]                                                              │
// │   접근 제어자 없이 매개변수만 쓰면 필드로 선언되지 않는다.             │
// │   constructor(ledger: LedgerService)   → 그냥 매개변수                │
// │   constructor(private ledger: ...)     → 필드로 자동 선언             │
// └─────────────────────────────────────────────────────────────────────────┘

// TxService: 트랜잭션 처리 서비스
// ledger와 idempotency는 생성자 단축 문법으로 자동 필드화
class TxService {
  constructor(
    private readonly ledger: LedgerService,          // this.ledger로 접근 가능
    private readonly idempotency: IdempotencyGuard,  // this.idempotency로 접근 가능
  ) {}  // 빈 생성자 본문: 필드 할당은 단축 문법이 처리함

  async mintNFT(toAddress: string, tokenId: string): Promise<void> {
    // 멱등성 키: 같은 주소+토큰 조합이면 중복 실행 차단
    const key = `mint:${toAddress}:${tokenId}`;
    await this.idempotency.run(key, async () => {
      // this.ledger: 생성자에서 주입받은 LedgerService 사용
      await this.ledger.credit(toAddress, tokenId, 1);
    });
  }
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 3. implements — 인터페이스 약속 이행                                    │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   클래스가 특정 인터페이스를 반드시 구현하도록 강제하는 키워드.         │
// │   interface에 선언된 모든 필드와 메서드를 구현하지 않으면 에러.        │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   강의 코드에서 EventProcessor를 구현하는 클래스가 여럿 있다.          │
// │   implements 없이 구현하면 eventTypes나 process를 빠뜨려도 에러가 안   │
// │   난다. implements를 붙이면 빠뜨린 즉시 컴파일 에러로 알려준다.       │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   class NFTIssuedProcessor implements EventProcessor                    │
// │   ①                        ②         ③                                │
// │   ① class 이름                                                         │
// │   ② implements 키워드                                                  │
// │   ③ 구현할 인터페이스 이름                                              │
// │                                                                         │
// │   여러 인터페이스를 동시에 구현할 수 있다:                              │
// │   class A implements InterfaceB, InterfaceC { ... }                    │
// └─────────────────────────────────────────────────────────────────────────┘

class NFTIssuedProcessor implements EventProcessor {
  // EventProcessor가 요구하는 eventTypes 필드. 이 processor가 처리할 이벤트 타입.
  readonly eventTypes = ['NFT_ISSUED'];  // readonly: 배열 자체 재할당 불가

  constructor(
    private readonly idempotency: IdempotencyGuard,
    private readonly ledger: LedgerService,
  ) {}

  // EventProcessor가 요구하는 process 메서드. 없으면 컴파일 에러.
  async process(message: StreamMessage): Promise<void> {
    // message.fields는 Record<string, string>이므로 as로 타입을 확인
    // (이미 Record<string, string>이므로 사실 as는 불필요하지만 명시적으로 쓴 예)
    const { tokenId, toAddress } = message.fields as Record<string, string>;

    // 메시지 ID를 멱등성 키로 사용 → 같은 메시지가 두 번 와도 한 번만 처리
    const key = `nft-issued:${message.id}`;

    await this.idempotency.run(key, async () => {
      await this.ledger.credit(toAddress, tokenId, 1);
      console.log(`NFT 발행 완료: ${tokenId} → ${toAddress}`);
    });
  }
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 4. extends — 클래스 상속                                               │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   부모 클래스의 필드와 메서드를 자식 클래스가 물려받는 것.             │
// │   자식 클래스에서 부모 메서드를 재정의(오버라이드)할 수 있고,          │
// │   super.메서드()로 부모 구현을 호출할 수 있다.                         │
// │                                                                         │
// │ [implements vs extends]                                                  │
// │   implements: 인터페이스(계약)를 이행. 구현 코드 없음.                │
// │   extends: 다른 클래스를 상속. 부모의 실제 구현 코드를 물려받음.      │
// │   동시에 쓸 수 있다: class A extends B implements C { ... }            │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   super.process(message)                                                │
// │   ① super: 부모 클래스를 가리킴                                        │
// │   ② .process(message): 부모 클래스의 process 메서드 호출              │
// │                                                                         │
// │ [주의사항]                                                              │
// │   자식 클래스에서 constructor를 정의하면 반드시 super()를 먼저 호출   │
// │   해야 한다. 그렇지 않으면 에러.                                       │
// └─────────────────────────────────────────────────────────────────────────┘

// BaseProcessor: 공통 로직을 담은 부모 클래스
class BaseProcessor implements EventProcessor {
  readonly eventTypes: string[] = [];  // 자식이 재정의해서 채운다

  async process(message: StreamMessage): Promise<void> {
    const eventType = message.fields['eventType'] ?? 'UNKNOWN';
    console.log(`[BaseProcessor] eventType: ${eventType}`);
  }
}

// AuditProcessor: BaseProcessor를 상속받아 감사 로그 기능 추가
class AuditProcessor extends BaseProcessor {
  // eventTypes 재정의: 부모의 빈 배열 대신 자신의 처리 대상 설정
  readonly eventTypes = ['NFT_ISSUED', 'NFT_BURNED', 'TRANSFER'];

  // process 재정의(오버라이드): 부모 로직 + 추가 로직
  async process(message: StreamMessage): Promise<void> {
    await super.process(message);  // 먼저 부모의 process 실행 (공통 로그)
    // 그 다음 자신만의 추가 로직
    console.log(`[AuditProcessor] audit log 기록: msgId=${message.id}`);
  }
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 5. static 멤버                                                          │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   인스턴스(new로 만든 객체)가 아닌 클래스 자체에 속하는 필드/메서드.  │
// │   new 없이 클래스명.필드 또는 클래스명.메서드() 로 접근한다.           │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   - 상수 값: 모든 인스턴스가 공유하는 설정값 (DEFAULT_MAX_ATTEMPTS 등) │
// │   - 팩토리 메서드: new 대신 의미 있는 이름으로 인스턴스를 만들 때     │
// │   - 강의 코드에서 RetryPolicy.create()처럼 나타남                      │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   static readonly DEFAULT_MAX_ATTEMPTS = 3;                             │
// │   ①      ②        ③                                                   │
// │   ① static: 클래스 자체에 속함. 인스턴스 공유 불가.                   │
// │   ② readonly: 값 변경 불가                                             │
// │   ③ 필드 이름: 대문자로 상수임을 표시하는 관례                         │
// │                                                                         │
// │ [주의사항]                                                              │
// │   static 멤버는 this.필드로 접근할 수 없다.                            │
// │   클래스명.필드 (RetryPolicy.DEFAULT_MAX_ATTEMPTS)로 접근해야 한다.   │
// └─────────────────────────────────────────────────────────────────────────┘

class RetryPolicy {
  // 클래스 자체에 속하는 상수. 인스턴스 없이 RetryPolicy.DEFAULT_MAX_ATTEMPTS 로 접근
  static readonly DEFAULT_MAX_ATTEMPTS = 3;
  static readonly DEFAULT_BASE_DELAY_MS = 1000;

  // static 팩토리 메서드: 기본값으로 RetryPolicy 인스턴스를 만드는 정적 메서드
  // new RetryPolicy(3, 1000) 대신 RetryPolicy.create() 로 의도를 명확히 표현
  static create(): RetryPolicy {
    return new RetryPolicy(
      RetryPolicy.DEFAULT_MAX_ATTEMPTS,   // static 필드를 클래스명으로 접근
      RetryPolicy.DEFAULT_BASE_DELAY_MS,
    );
  }

  // 인스턴스 필드 (readonly: 생성 후 변경 불가)
  constructor(
    readonly maxAttempts: number,    // public readonly maxAttempts: number 와 동일
    readonly baseDelayMs: number,
  ) {}
}

// ─── 실행 확인 ───────────────────────────────────────────────────────────────
async function main() {
  console.log('=== CH04 클래스 ===');

  // new: 클래스 인스턴스 생성. constructor가 호출된다.
  const wallet = new WalletAddress('0xAAA', 1);
  console.log(wallet.display());  // display(): 메서드 호출

  // 가짜 의존성 구현 (인터페이스 만족하는 객체 리터럴)
  // 클래스를 만들지 않고 인터페이스 형태만 맞춘 객체를 넘길 수 있다
  // → 테스트에서 실제 DB/블록체인 없이도 로직 검증 가능
  const fakeLedger: LedgerService = {
    async credit(toAddress, tokenId, amount) {
      console.log(`  [Ledger] credit: ${tokenId} x${amount} → ${toAddress}`);
    },
  };

  const fakeIdempotency: IdempotencyGuard = {
    async run(key, fn) {
      console.log(`  [Idempotency] key=${key}`);
      await fn();  // 여기서는 차단 없이 항상 실행
    },
  };

  // NFTIssuedProcessor: fakeLedger와 fakeIdempotency를 주입받아 생성
  const processor = new NFTIssuedProcessor(fakeIdempotency, fakeLedger);
  const msg: StreamMessage = {
    id: 'msg-001',
    fields: { eventType: 'NFT_ISSUED', tokenId: 'token-1', toAddress: '0xBBB' },
  };

  // processor가 이 이벤트 타입을 처리하는지 확인 후 process 호출
  if (processor.eventTypes.includes(msg.fields['eventType'])) {
    await processor.process(msg);
  }

  // AuditProcessor: 부모(BaseProcessor) 로직 + 감사 로그
  const auditProcessor = new AuditProcessor();
  await auditProcessor.process(msg);  // super.process() 후 audit log 출력

  // static 멤버: new 없이 클래스명으로 직접 접근
  console.log('RetryPolicy.DEFAULT_MAX_ATTEMPTS:', RetryPolicy.DEFAULT_MAX_ATTEMPTS);
  // static 팩토리 메서드로 인스턴스 생성
  const policy = RetryPolicy.create();
  console.log('policy:', policy);
}

main();

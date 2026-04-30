// ─── CH04: 클래스 ────────────────────────────────────────────────────────────

// ─ 인터페이스 정의 ─
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

// ─ 1. 기본 클래스 ─
class WalletAddress {
  public readonly address: string;
  private readonly chainId: number;

  constructor(address: string, chainId: number) {
    this.address = address;
    this.chainId = chainId;
  }

  display(): string {
    return `chain=${this.chainId} addr=${this.address}`;
  }
}

// ─ 2. 생성자 단축 문법 (강의 코드 표준) ─
// 위 클래스와 정확히 같은 결과, 타이핑만 줄어듦
class TxService {
  constructor(
    private readonly ledger: LedgerService,
    private readonly idempotency: IdempotencyGuard,
  ) {}

  async mintNFT(toAddress: string, tokenId: string): Promise<void> {
    const key = `mint:${toAddress}:${tokenId}`;
    await this.idempotency.run(key, async () => {
      await this.ledger.credit(toAddress, tokenId, 1);
    });
  }
}

// ─ 3. implements — 인터페이스 약속 ─
class NFTIssuedProcessor implements EventProcessor {
  readonly eventTypes = ['NFT_ISSUED'];

  constructor(
    private readonly idempotency: IdempotencyGuard,
    private readonly ledger: LedgerService,
  ) {}

  async process(message: StreamMessage): Promise<void> {
    const { tokenId, toAddress } = message.fields as Record<string, string>;
    const key = `nft-issued:${message.id}`;

    await this.idempotency.run(key, async () => {
      await this.ledger.credit(toAddress, tokenId, 1);
      console.log(`NFT 발행 완료: ${tokenId} → ${toAddress}`);
    });
  }
}

// ─ 4. extends — 클래스 상속 ─
class BaseProcessor implements EventProcessor {
  readonly eventTypes: string[] = [];

  async process(message: StreamMessage): Promise<void> {
    const eventType = message.fields['eventType'] ?? 'UNKNOWN';
    console.log(`[BaseProcessor] eventType: ${eventType}`);
  }
}

class AuditProcessor extends BaseProcessor {
  readonly eventTypes = ['NFT_ISSUED', 'NFT_BURNED', 'TRANSFER'];

  async process(message: StreamMessage): Promise<void> {
    await super.process(message);           // 부모 process 먼저 호출
    console.log(`[AuditProcessor] audit log 기록: msgId=${message.id}`);
  }
}

// ─ 5. static 멤버 ─
class RetryPolicy {
  static readonly DEFAULT_MAX_ATTEMPTS = 3;
  static readonly DEFAULT_BASE_DELAY_MS = 1000;

  static create(): RetryPolicy {
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

// ─── 실행 확인 ───────────────────────────────────────────────────────────────
async function main() {
  console.log('=== CH04 클래스 ===');

  const wallet = new WalletAddress('0xAAA', 1);
  console.log(wallet.display());

  // 가짜 의존성 구현 (인터페이스 만족하는 객체)
  const fakeLedger: LedgerService = {
    async credit(toAddress, tokenId, amount) {
      console.log(`  [Ledger] credit: ${tokenId} x${amount} → ${toAddress}`);
    },
  };

  const fakeIdempotency: IdempotencyGuard = {
    async run(key, fn) {
      console.log(`  [Idempotency] key=${key}`);
      await fn();
    },
  };

  const processor = new NFTIssuedProcessor(fakeIdempotency, fakeLedger);
  const msg: StreamMessage = {
    id: 'msg-001',
    fields: { eventType: 'NFT_ISSUED', tokenId: 'token-1', toAddress: '0xBBB' },
  };

  if (processor.eventTypes.includes(msg.fields['eventType'])) {
    await processor.process(msg);
  }

  const auditProcessor = new AuditProcessor();
  await auditProcessor.process(msg);

  console.log('RetryPolicy.DEFAULT_MAX_ATTEMPTS:', RetryPolicy.DEFAULT_MAX_ATTEMPTS);
  const policy = RetryPolicy.create();
  console.log('policy:', policy);
}

main();

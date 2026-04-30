// ─── CH02: 함수와 화살표 ─────────────────────────────────────────────────────

// 1. 함수 선언 3가지 방식 (셋 다 동일 동작)
function addV1(a: number, b: number): number {
  return a + b;
}

const addV2 = function (a: number, b: number): number {
  return a + b;
};

const addV3 = (a: number, b: number): number => a + b;  // 실무 표준

// 2. 화살표 함수 축약 단계
const greetFull = (name: string): string => {
  return `Hello, ${name}`;
};

const greetShort = (name: string): string => `Hello, ${name}`;  // 한 줄이면 return 생략

// 3. 매개변수 종류
function createTx(
  from: string,             // 필수
  amount: number,           // 필수
  memo?: string,            // 선택적 (없으면 undefined)
  fee: number = 0,          // 기본값 (없으면 0)
): string {
  return `${from} → ${amount} (fee: ${fee}) ${memo ?? ''}`;
}

// 4. 콜백 함수 — 강의에서 자주 등장하는 패턴
const txIds = ['tx-001', 'tx-002', 'tx-003', 'tx-004'];

const pendingTxs = txIds.filter(id => id.startsWith('tx-00'));  // ['tx-001', 'tx-002', 'tx-003', 'tx-004']
const upperIds   = txIds.map(id => id.toUpperCase());           // ['TX-001', 'TX-002', ...]

txIds.forEach(id => console.log('processing:', id));

// 5. async / await
async function fetchBalance(address: string): Promise<number> {
  // 실제론 API 호출 — 여기선 가짜 지연으로 시뮬
  await new Promise(resolve => setTimeout(resolve, 10));
  return address === '0xAAA' ? 1000 : 500;
}

// 6. 함수 타입 — 함수를 변수로 넘길 때 타입 표기
type Handler = (eventType: string) => Promise<void>;

async function runHandler(eventType: string, handler: Handler): Promise<void> {
  console.log('Running handler for:', eventType);
  await handler(eventType);
}

// ─── 실행 확인 ───────────────────────────────────────────────────────────────
async function main() {
  console.log('=== CH02 함수와 화살표 ===');
  console.log('add:', addV3(3, 4));
  console.log('greet:', greetShort('Sharon'));
  console.log('createTx:', createTx('0xAAA', 100, 'NFT 구매'));
  console.log('pendingTxs:', pendingTxs);
  console.log('upperIds:', upperIds);

  const balance = await fetchBalance('0xAAA');
  console.log('balance:', balance);

  await runHandler('NFT_ISSUED', async (type) => {
    console.log('handler called with:', type);
  });
}

main();

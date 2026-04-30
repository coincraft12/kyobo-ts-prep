// ─── CH01: 변수와 타입 ───────────────────────────────────────────────────────

// 1. 변수 선언
const name = 'Sharon';   // 재할당 불가 → 대부분 이거
let count = 0;           // 재할당 필요할 때만
// var x = 1;            // 절대 안 씀

// 2. 타입 어노테이션
const userId: string = 'user-001';
const age: number = 40;
const isActive: boolean = true;

// 추론 활용 (어노테이션 생략해도 TS가 알아서 파악)
const platform = 'coincraft';  // 타입: string (추론됨)
const tokenCount = 5;          // 타입: number (추론됨)

// 3. 배열
const walletIds: string[] = ['0xAAA', '0xBBB', '0xCCC'];
const balances: number[] = [100, 200, 300];

// 4. 객체
const user: { name: string; age: number; email?: string } = {
  name: 'Sharon',
  age: 40,
  // email 없어도 OK (?:는 선택적)
};

// 5. 특수 타입
let payload: unknown = '{"tokenId": "1"}';   // 쓰기 전에 타입 검사 강제
// let bad: any = 1;                          // any = TS 포기 선언, 쓰지 마라

function throwAlways(): never {
  throw new Error('항상 에러');               // never: 절대 정상 리턴 안 함
}

function doNothing(): void {
  console.log('리턴값 없음');                 // void: 리턴 없는 함수
}

// 6. bigint — 블록체인 필수 타입
// number는 2^53 이상의 정수를 정확히 표현 못함 → 토큰 ID, 금액에 bigint 사용

const tokenId: bigint = 1234567890123456789n;   // 숫자 뒤에 n 붙이면 bigint 리터럴
const amount = 50_000_000n;                       // _는 가독성용 구분자 (값에 영향 없음)
const fee = BigInt('1000000000000000');            // 문자열에서 변환

// bigint 연산
const total = amount + fee;                       // + - * / % ** 가능
const half  = amount / 2n;                        // 나누는 쪽도 반드시 bigint (2n, 숫자 아님)
// const wrong = amount + 1;                      // 에러: bigint와 number 혼용 불가

// number → bigint 변환
const price = 100;
const priceBig = BigInt(price);                   // BigInt()로 변환

// bigint → string (로그, DB 저장 시)
const stored = tokenId.toString();
const display = String(amount);

// ─── 실행 확인 ───────────────────────────────────────────────────────────────
console.log('=== CH01 변수와 타입 ===');
console.log('name:', name);
console.log('walletIds:', walletIds);
console.log('user:', user);

// unknown 사용 예 — 타입 검사 후 사용
if (typeof payload === 'string') {
  const parsed = JSON.parse(payload);         // string임이 확인된 후 사용
  console.log('parsed:', parsed);
}

// bigint 확인
console.log('tokenId:', tokenId);
console.log('amount:', amount);
console.log('total:', total);
console.log('half:', half);
console.log('stored (string):', stored);

// ─── CH00: TypeScript 배경과 작동 원리 ──────────────────────────────────────
//
// 이 파일은 "TypeScript vs JavaScript" 차이를 실행 가능한 코드로 보여준다.
// README.md를 먼저 읽고, 여기서 직접 실행해서 확인하자.

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 1. TypeScript는 JavaScript의 Superset                                   │
// │                                                                         │
// │ 아래 코드는 완전히 유효한 JavaScript이고, TypeScript에서도 그대로 동작. │
// └─────────────────────────────────────────────────────────────────────────┘

const message = 'Hello TypeScript';   // JS와 동일한 문법
console.log(message);                 // Hello TypeScript

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 2. 타입 어노테이션 — TypeScript만의 문법                                │
// │                                                                         │
// │ 이 부분은 JavaScript에 없는 TypeScript 전용 문법이다.                  │
// │ tsc로 컴파일하면 ': string', ': number' 부분이 전부 사라진다.           │
// └─────────────────────────────────────────────────────────────────────────┘

const userId: string = 'user-001';
const tokenId: bigint = 1234567890123456789n;
const amount: number = 50;

console.log(`userId  : ${userId}`);
console.log(`tokenId : ${tokenId}`);  // bigint도 string 템플릿에서는 자동 변환
console.log(`amount  : ${amount}`);

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 3. 컴파일 타임 에러 vs 런타임 에러                                      │
// │                                                                         │
// │ 아래 주석을 해제하면 ts-node 실행 자체가 안 된다 — 컴파일 에러.        │
// │ JavaScript라면 런타임에서야 에러가 났을 것이다.                         │
// └─────────────────────────────────────────────────────────────────────────┘

// const wrong: number = 'hello';
// ❌ 컴파일 에러: Type 'string' is not assignable to type 'number'.
// → 이 파일을 실행하기 전에 에러를 잡는다.

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 4. 함수 타입 — 계약을 명시한다                                          │
// │                                                                         │
// │ JavaScript: function add(a, b) — a, b가 뭔지 모름                      │
// │ TypeScript: function add(a: number, b: number): number — 완전한 계약   │
// └─────────────────────────────────────────────────────────────────────────┘

function add(a: number, b: number): number {
  return a + b;
}

console.log(`\n--- 함수 타입 ---`);
console.log(`add(1, 2) = ${add(1, 2)}`);

// 잘못된 호출 — 주석 해제 시 컴파일 에러 (실행 전에 잡힘)
// add('1', 2);
// ❌ Argument of type 'string' is not assignable to parameter of type 'number'.

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 5. 타입은 런타임에 사라진다                                              │
// │                                                                         │
// │ TypeScript 타입을 런타임에서 확인하려면 JS 수단(typeof)을 써야 한다.   │
// └─────────────────────────────────────────────────────────────────────────┘

function describe(value: string | number): void {
  // TypeScript 타입이 런타임에 남아있지 않으므로,
  // 런타임 분기는 JavaScript의 typeof를 사용해야 한다.
  if (typeof value === 'string') {
    console.log(`문자열: "${value}" (길이: ${value.length})`);
  } else {
    console.log(`숫자: ${value} (2배: ${value * 2})`);
  }
}

console.log(`\n--- 타입은 런타임에 없다 ---`);
describe('hello');
describe(42);

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 6. JavaScript: 에러가 런타임까지 숨어있다                               │
// │                                                                         │
// │ TypeScript 없이 같은 실수를 하면 어떻게 됐을지 보자.                   │
// └─────────────────────────────────────────────────────────────────────────┘

// JavaScript 시뮬레이션 — 타입 검사 없이 잘못된 값이 깊숙이 들어가는 과정
function getTokenInfo(token: { id: bigint; owner: string }) {
  return `Token #${token.id} owned by ${token.owner}`;
}

console.log(`\n--- TypeScript가 막아주는 것 ---`);
console.log(getTokenInfo({ id: 1n, owner: 'alice' }));

// 잘못된 호출 시도 — 주석 해제하면 실행 전에 에러
// getTokenInfo({ id: '1', owner: 'alice' });
// ❌ Type 'string' is not assignable to type 'bigint'.
// JavaScript였다면: 실행은 되지만 token.id가 bigint로 처리돼야 하는 곳에서 예상 밖 동작

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 7. bigint — 블록체인에서 왜 필수인가                                    │
// │                                                                         │
// │ number는 2^53 이상의 정수를 정확히 표현하지 못한다.                     │
// └─────────────────────────────────────────────────────────────────────────┘

console.log(`\n--- number의 한계 ---`);

// 컴파일러가 리터럴 상수 비교를 정적으로 막으므로, Number/BigInt 생성자로 동적 생성
const unsafe = Number('9007199254740993');   // 2^53 + 1 을 number로
const safe   = BigInt('9007199254740993');   // 2^53 + 1 을 bigint로

console.log(`number: 9007199254740993 === 9007199254740992 → ${unsafe === 9007199254740992}`);
// true — 값이 다른데 같다고 나옴! 정밀도 손실
console.log(`bigint: 9007199254740993n === 9007199254740992n → ${safe === BigInt('9007199254740992')}`);
// false — 정확하게 구분됨

// 실제 블록체인 금액 예시 (1 ETH = 10^18 wei)
const ONE_ETH_IN_WEI = 1_000_000_000_000_000_000n;
console.log(`1 ETH in wei: ${ONE_ETH_IN_WEI}`);
console.log(`(이 숫자를 number로 다루면 정밀도 손실 발생)`);

console.log(`\n✅ CH00 완료 — TypeScript 배경과 작동 원리`);

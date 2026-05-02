// ─── CH02: 함수와 화살표 ─────────────────────────────────────────────────────

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 1. 함수 선언 3가지 방식                                                 │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   TypeScript에서 함수를 정의하는 세 가지 방법. 동작은 동일하지만       │
// │   표기 방식과 일부 동작(this 바인딩)이 다르다.                         │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   function 이름(매개변수: 타입): 리턴타입 { ... }                       │
// │     → 전통적인 함수 선언. 호이스팅됨 (선언 전에 호출 가능).           │
// │                                                                         │
// │   const 이름 = function(매개변수: 타입): 리턴타입 { ... };              │
// │     → 함수를 변수에 담는 방식. 호이스팅 안 됨.                        │
// │                                                                         │
// │   const 이름 = (매개변수: 타입): 리턴타입 => 표현식;                   │
// │     → 화살표 함수. 실무 표준. this가 자신만의 this를 갖지 않는다.     │
// │       클래스 내부 메서드나 콜백에 유리.                                │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   강의 코드의 거의 모든 함수가 화살표 함수 형태(V3)로 작성된다.        │
// │   특히 async 함수, 콜백, 클래스 메서드에 압도적으로 많이 나온다.       │
// │                                                                         │
// │ [주의사항]                                                              │
// │   세 가지 모두 동일한 결과를 내지만, 강의 코드 패턴을 읽기 위해서는   │
// │   화살표 함수 형태(V3)에 익숙해지는 것이 최우선이다.                  │
// └─────────────────────────────────────────────────────────────────────────┘

// V1: 전통적인 function 선언
// (a: number, b: number) → 매개변수 a, b 모두 number 타입
// : number (오른쪽 끝) → 함수의 반환값이 number 타입임을 선언
function addV1(a: number, b: number): number {
  return a + b;
}

// V2: 변수에 담는 함수 표현식
const addV2 = function (a: number, b: number): number {
  return a + b;
};

// V3: 화살표 함수 — 한 줄이면 중괄호와 return 모두 생략 가능
// (a: number, b: number): number => a + b
// ① 매개변수 목록    ② 리턴 타입   ③ => 화살표  ④ 반환 표현식
const addV3 = (a: number, b: number): number => a + b;  // 실무 표준

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 2. 화살표 함수 축약 단계                                                │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   화살표 함수는 본문이 단일 표현식일 때 중괄호와 return을 생략할 수   │
// │   있다. 강의 코드에서는 두 형태가 모두 등장한다.                       │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   전체 형태: (name: string): string => { return `Hello, ${name}`; }    │
// │   축약 형태: (name: string): string => `Hello, ${name}`                │
// │                                                                         │
// │   주의: 반환값이 객체 리터럴이면 소괄호로 감싸야 한다.                │
// │     () => ({ id: 1, name: 'A' })   ← 소괄호 필요                      │
// │     () => { id: 1, name: 'A' }     ← 에러! {}를 함수 본문으로 해석   │
// └─────────────────────────────────────────────────────────────────────────┘

// 블록 형태: 여러 줄 로직이 있을 때
const greetFull = (name: string): string => {
  return `Hello, ${name}`;
};

// 축약 형태: 단일 표현식 반환. 백틱(``) 안의 ${name}은 템플릿 리터럴 보간
const greetShort = (name: string): string => `Hello, ${name}`;  // 한 줄이면 return 생략

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 3. 매개변수 종류: 필수 / 선택적 / 기본값                               │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   TypeScript 함수의 매개변수는 세 종류로 나뉜다.                       │
// │   필수 / 선택적(?) / 기본값(=) 이 세 가지를 섞어 쓸 수 있다.         │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   from: string     → 필수. 호출 시 반드시 값을 줘야 함.               │
// │   memo?: string    → 선택적. 없으면 undefined가 된다.                 │
// │   fee: number = 0  → 기본값. 없으면 0으로 대신한다.                   │
// │                                                                         │
// │ [주의사항]                                                              │
// │   - 선택적(?) 매개변수와 기본값(=) 매개변수는 필수 매개변수 뒤에       │
// │     와야 한다. 필수 앞에 선택적을 쓰면 에러.                           │
// │   - memo? 와 fee=0 의 차이: memo는 undefined일 수 있지만, fee는        │
// │     undefined를 넘겨도 기본값 0으로 대체된다.                          │
// │   - memo ?? '' 는 nullish 연산자: memo가 null/undefined이면 빈 문자열 │
// │     (ch06에서 자세히 다룬다)                                            │
// └─────────────────────────────────────────────────────────────────────────┘

function createTx(
  from: string,             // 필수 — 없으면 컴파일 에러
  amount: number,           // 필수
  memo?: string,            // 선택적: 없으면 undefined, 있으면 string
  fee: number = 0,          // 기본값: 없으면 자동으로 0
): string {
  return `${from} → ${amount} (fee: ${fee}) ${memo ?? ''}`;
  //  memo ?? '' → memo가 undefined이면 빈 문자열로 대체
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 4. 콜백 함수                                                            │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   다른 함수의 매개변수로 전달되는 함수. 배열 메서드(filter, map,       │
// │   forEach)에서 각 원소를 처리할 로직을 넘길 때 주로 사용한다.          │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   강의 코드에서 이벤트 처리, 배열 변환, 비동기 작업 체이닝 등에        │
// │   콜백이 광범위하게 사용된다. 이 패턴을 읽지 못하면 코드 흐름이        │
// │   막힌다.                                                               │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   txIds.filter(id => id.startsWith('tx-00'))                           │
// │          ↑      ↑    ↑                                                 │
// │          메서드  콜백  콜백 내부 로직                                  │
// │   - filter: 콜백이 true를 반환한 원소만 남긴다                         │
// │   - map: 콜백의 반환값으로 새 배열을 만든다                            │
// │   - forEach: 각 원소에 콜백을 실행하되, 반환값이 없다 (void)           │
// │                                                                         │
// │ [주의사항]                                                              │
// │   매개변수가 하나인 화살표 함수는 소괄호를 생략할 수 있다.             │
// │   id => ... 와 (id) => ... 는 완전히 동일하다.                         │
// └─────────────────────────────────────────────────────────────────────────┘

const txIds = ['tx-001', 'tx-002', 'tx-003', 'tx-004'];

// filter: 조건을 만족하는 원소만 남긴다. startsWith('tx-00') → 전부 해당
const pendingTxs = txIds.filter(id => id.startsWith('tx-00'));  // ['tx-001', 'tx-002', 'tx-003', 'tx-004']

// map: 각 원소를 변환한다. toUpperCase()로 소문자 → 대문자
const upperIds   = txIds.map(id => id.toUpperCase());           // ['TX-001', 'TX-002', ...]

// forEach: 반환값 없이 사이드이펙트(출력, 저장 등)만 수행
txIds.forEach(id => console.log('processing:', id));

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 5. async / await                                                        │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   비동기(네트워크 요청, DB 접근, 타이머 등)를 마치 동기 코드처럼 읽히  │
// │   게 작성하는 문법. async 함수는 항상 Promise를 반환한다.              │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   블록체인의 모든 연산(트랜잭션 제출, 이벤트 수신, 잔액 조회)은        │
// │   비동기다. Promise.then().catch() 체이닝보다 훨씬 읽기 쉽고           │
// │   에러 처리도 try/catch로 자연스럽게 된다.                             │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   async function fetchBalance(address: string): Promise<number>         │
// │   ①                                             ②                      │
// │   ① async 키워드: 이 함수가 비동기임을 선언. 자동으로 Promise 반환.   │
// │   ② Promise<number>: 이 함수가 완료되면 number 값을 담은 Promise 반환 │
// │                                                                         │
// │   await: Promise가 완료될 때까지 "기다린다". async 함수 내부에서만    │
// │     사용 가능. await 없이 Promise를 그냥 받으면 pending 상태 객체가    │
// │     변수에 담긴다 (흔한 실수).                                         │
// │                                                                         │
// │ [주의사항]                                                              │
// │   - await를 빠뜨리면 Promise 객체 자체가 반환된다.                     │
// │     await fetchBalance('0xAAA') → 1000                                 │
// │     fetchBalance('0xAAA')       → Promise { <pending> }  ← 실수!      │
// │   - async 함수의 에러는 try/catch로 잡는다 (ch05에서 자세히 다룬다). │
// └─────────────────────────────────────────────────────────────────────────┘

// Promise<number>: 비동기로 처리하되, 완료 시 number 값을 준다는 계약
async function fetchBalance(address: string): Promise<number> {
  // 실제론 API 호출 — 여기선 가짜 지연으로 시뮬
  // new Promise(resolve => setTimeout(resolve, 10)) → 10ms 대기 후 resolve()
  await new Promise(resolve => setTimeout(resolve, 10));
  // 삼항 연산자: 조건 ? 참일 때 값 : 거짓일 때 값
  return address === '0xAAA' ? 1000 : 500;
}

// ┌─────────────────────────────────────────────────────────────────────────┐
// │ 6. 함수 타입                                                            │
// │                                                                         │
// │ [이게 뭔지]                                                             │
// │   함수 자체를 타입으로 정의하는 문법. 함수를 변수에 담거나 매개변수로  │
// │   넘길 때 그 함수의 "모양"을 타입으로 지정할 수 있다.                 │
// │                                                                         │
// │ [왜 쓰는지]                                                             │
// │   강의 코드에서 이벤트 처리 함수, 콜백, 의존성 주입 등에서            │
// │   "이 매개변수는 이런 모양의 함수여야 한다"를 명시하기 위해 쓴다.     │
// │                                                                         │
// │ [문법 해부]                                                             │
// │   type Handler = (eventType: string) => Promise<void>;                  │
// │         ①          ②                    ③                              │
// │   ① Handler: 이 함수 타입의 이름                                       │
// │   ② (eventType: string): 이 함수는 string 매개변수 하나를 받는다      │
// │   ③ => Promise<void>: 이 함수는 Promise를 반환하되 완료값은 없다      │
// │                                                                         │
// │ [주의사항]                                                              │
// │   타입 정의의 => 와 화살표 함수의 => 는 모양이 같지만 다른 용도다.    │
// │   type에서는 "이 함수가 무엇을 받아 무엇을 반환하는지 선언",          │
// │   실제 함수에서는 "이 매개변수를 받아 이 값을 반환하는 함수 구현"이다. │
// └─────────────────────────────────────────────────────────────────────────┘

// Handler 타입: "string 하나를 받아 Promise<void>를 반환하는 함수"
type Handler = (eventType: string) => Promise<void>;

// handler 매개변수는 반드시 Handler 타입 형태의 함수여야 한다
async function runHandler(eventType: string, handler: Handler): Promise<void> {
  console.log('Running handler for:', eventType);
  await handler(eventType);  // 넘겨받은 함수를 실행
}

// ─── 실행 확인 ───────────────────────────────────────────────────────────────
// async 함수들을 모아서 한 번에 실행하기 위해 main()으로 감싼다.
// 최상위 레벨에서 await를 쓰려면 "top-level await" 지원이 필요하지만
// Node.js 구버전이나 CommonJS 환경에서는 지원이 안 되므로 이렇게 래핑한다.
async function main() {
  console.log('=== CH02 함수와 화살표 ===');
  console.log('add:', addV3(3, 4));
  console.log('greet:', greetShort('Sharon'));
  console.log('createTx:', createTx('0xAAA', 100, 'NFT 구매'));
  console.log('pendingTxs:', pendingTxs);
  console.log('upperIds:', upperIds);

  const balance = await fetchBalance('0xAAA');
  console.log('balance:', balance);

  // async 함수를 람다로 즉석에서 만들어 Handler 타입에 맞게 넘긴다
  await runHandler('NFT_ISSUED', async (type) => {
    console.log('handler called with:', type);
  });
}

main();

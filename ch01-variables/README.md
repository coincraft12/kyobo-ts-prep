# CH01 — 변수와 타입

## 핵심 한 줄
> TypeScript = JavaScript + 타입 검사. 타입은 "이 변수에 뭘 넣을 수 있는지"를 컴파일 시점에 확인해주는 도구.

---

## 1. 변수 선언 — const vs let

```typescript
const x = 10;   // 재할당 불가
let y = 20;     // 재할당 가능
```

### 왜 이렇게 구분하나?

`const`는 "한 번 정하면 바꾸지 않겠다"는 선언이다. 컴파일러와 다음 사람이 코드를 읽을 때 "이 값은 변하지 않는다"는 신호를 준다. 실수로 덮어쓰는 버그를 원천 차단할 수도 있다.

`let`은 "나중에 바꿀 수도 있다"는 선언이다. 루프 카운터나 누적 합산처럼 값이 변해야 할 때만 쓴다.

```typescript
// 잘못된 사용 예 — 에러 발생
const x = 10;
x = 20;  // 컴파일 에러: Cannot assign to 'x' because it is a constant.

// 올바른 사용 예
let count = 0;
count = count + 1;  // OK
```

**규칙: const 기본, 어쩔 수 없을 때만 let.**

### var는 왜 안 쓰나?

`var`는 블록 스코프(`{}`)를 무시하고 함수 전체 또는 전역에서 살아남는다. 이 특성이 예측하기 어려운 버그를 만든다.

```typescript
// var의 문제점 — 블록을 벗어나도 살아있음
if (true) {
  var leaked = 'outside';
}
console.log(leaked);  // 'outside' — 블록 밖인데 접근됨, 버그 원인

// let은 블록을 벗어나면 사라짐
if (true) {
  let safe = 'inside';
}
console.log(safe);  // 컴파일 에러 — 블록 밖에서 접근 불가, 안전
```

`var`는 절대 안 쓴다.

---

## 2. 타입 어노테이션

변수명 뒤에 `: 타입`을 붙이면 해당 타입 외 값은 컴파일 에러가 난다.

```typescript
const name: string = 'Sharon';
const age: number = 40;
const isActive: boolean = true;
```

### 이 `:` 기호가 의미하는 것

여기서 `:`는 "이 변수의 타입은 ~이다"를 선언하는 기호다. 타입 어노테이션 전용 문법이다.

> 주의: 나중에 나오는 `const { id: requestId } = obj` 같은 구조 분해의 `:`는 전혀 다른 의미다. 그건 "이름을 바꿔서 꺼내겠다"는 뜻이다. 같은 기호지만 문맥이 완전히 다르다.

### 어노테이션을 생략해도 되는 경우

대부분은 생략해도 된다. TypeScript가 초기값을 보고 타입을 자동으로 추론하기 때문이다.

```typescript
const name = 'Sharon';  // TS가 string으로 추론 — 어노테이션 없어도 됨
const age = 40;         // TS가 number로 추론
const isActive = true;  // TS가 boolean으로 추론
```

내부적으로는 어노테이션을 쓴 것과 똑같이 동작한다. 타입 추론이 정확히 작동하는 한 어노테이션을 생략하면 코드가 짧고 읽기 좋아진다.

### 어노테이션을 반드시 써야 하는 곳

TypeScript가 스스로 추론할 수 없는 경우에는 반드시 써야 한다.

```typescript
// 함수 매개변수 — 값이 없으니 추론 불가, 반드시 명시
function greet(name: string): string {
  return `Hello, ${name}`;
}

// 함수 리턴 타입 — 명시하면 "의도와 다른 리턴"을 컴파일러가 잡아줌
function getAge(): number {
  return 'forty';  // 에러: string은 number 자리에 못 들어감
}

// 초기값 없이 선언만 할 때
let result: string;  // 나중에 할당할 예정임을 명시
```

---

## 3. 배열과 객체

### 배열

```typescript
const ids: string[] = ['a', 'b', 'c'];
const nums: number[] = [1, 2, 3];
```

`string[]`은 "string들의 배열"이라고 읽는다. `[]`가 "복수"를 나타낸다.

`Array<string>`이라고 써도 완전히 동일하다. 꺾쇠 괄호 안에 타입을 넣는 방식이다. 강의에서는 `string[]` 형태를 주로 쓴다.

```typescript
// 이 둘은 완전히 같다
const a: string[] = ['x', 'y'];
const b: Array<string> = ['x', 'y'];
```

배열에 잘못된 타입의 값을 넣으면 에러가 난다:

```typescript
const ids: string[] = ['a', 'b'];
ids.push(42);  // 에러: number는 string[] 배열에 못 들어감
ids.push('c'); // OK
```

### 객체

객체 타입은 중괄호 안에 각 프로퍼티 이름과 타입을 나열해서 정의한다:

```typescript
const user: { name: string; age: number } = {
  name: 'Sharon',
  age: 40,
};
```

분해하면 이렇다:

- `{ name: string; age: number }` — 이 객체는 반드시 `name`(string)과 `age`(number)를 가져야 한다
- `;` 로 프로퍼티를 구분한다 (`,`도 허용되지만 `;`가 관습)
- 정의에 없는 프로퍼티를 넣으면 컴파일 에러가 난다

```typescript
const user: { name: string; age: number } = {
  name: 'Sharon',
  age: 40,
  email: 'x@x.com',  // 에러: 타입 정의에 email 없음
};
```

실무에서 객체 형태는 `interface`나 `type`으로 따로 빼서 이름을 붙인다 (→ CH03에서 다룸). 매번 `{ name: string; age: number }` 전체를 쓰는 건 비효율적이기 때문이다.

---

## 4. 특수 타입

| 타입 | 의미 | 언제 쓰나 |
|------|------|-----------|
| `any` | 타입 검사 포기 | **쓰지 마라** |
| `unknown` | 뭔지 모르지만, 쓰기 전에 검사 강제 | 외부 입력, catch 블록 |
| `void` | 리턴값 없음 | 리턴이 없는 함수 |
| `never` | 이 지점에 절대 도달 안 함 | 항상 throw하는 함수 |

### any vs unknown — 핵심 차이

두 타입 모두 "어떤 값이든 받을 수 있다"는 공통점이 있다. 하지만 이후 사용 방식이 완전히 다르다.

```typescript
// any — TS가 타입 검사를 완전히 포기
let a: any = '{"id":1}';
a.toFixed();          // 에러가 안 남 — string에 toFixed() 없는데도 통과
a.nonExistentMethod() // 에러가 안 남 — 완전히 맹목적으로 허용
JSON.parse(a);        // 물론 통과

// unknown — 받을 수는 있지만, 쓰기 전에 반드시 타입을 확인해야 함
let u: unknown = '{"id":1}';
u.toFixed();          // 컴파일 에러 — unknown 상태에서는 아무것도 못 함
if (typeof u === 'string') {
  JSON.parse(u);      // OK — 이 블록 안에서는 string임이 확인됨
  u.toUpperCase();    // OK
}
```

`any`는 TypeScript를 끄는 것과 같다. 타입 오류가 있어도 컴파일러가 그냥 통과시키기 때문에 런타임에서 예상치 못한 에러가 터진다.

`unknown`은 "모르는 값이지만, 쓰기 전에 반드시 뭔지 확인해라"고 강제한다. 외부 API 응답, `catch` 블록의 에러 객체처럼 타입을 미리 알 수 없는 값을 안전하게 다루는 방법이다.

```typescript
// catch 블록에서 unknown 사용 예
try {
  await someApi();
} catch (err: unknown) {
  // err가 Error 객체인지 확인하고 나서 사용
  if (err instanceof Error) {
    console.log(err.message);  // OK — Error임이 확인됨
  }
}
```

### void — 리턴값이 없다는 명시

```typescript
function logMessage(msg: string): void {
  console.log(msg);
  // return 없음 — 또는 return; 만 있음
}
```

`void`는 "이 함수는 아무것도 돌려주지 않는다"는 선언이다. 함수를 호출한 쪽에서 리턴값을 사용하려 하면 컴파일 에러가 난다. 나중에 `Promise<void>`라는 형태로 자주 등장한다.

### never — 코드가 절대 이 지점에 도달하지 않는다

```typescript
function throwError(message: string): never {
  throw new Error(message);
  // 이 함수는 항상 예외를 던지고 종료 — 리턴 자체가 없음
}
```

`void`는 "리턴은 하되 값이 없다", `never`는 "리턴 자체를 하지 않는다"는 차이가 있다. 항상 예외를 던지는 함수, 무한 루프 함수에 붙는다. 처음엔 잘 안 보이지만 타입 시스템의 완결성을 위해 존재한다.

---

## 5. bigint — 블록체인 필수 타입

`number`는 64비트 부동소수점이라 2⁵³(약 9000조)보다 큰 정수를 정확히 표현하지 못한다. 블록체인에서 토큰 ID나 wei 단위 금액은 이 한계를 훌쩍 넘는다. 그래서 `bigint`가 필요하다.

```typescript
// number로 큰 정수를 다루면 정밀도 손실 발생
const unsafe = 9007199254740993;      // 2^53 + 1
console.log(unsafe === 9007199254740992); // true — 값이 바뀌어버림!

// bigint는 정확히 표현
const safe = 9007199254740993n;       // n을 붙이면 bigint 리터럴
console.log(safe === 9007199254740992n); // false — 정확히 구분됨
```

### bigint 리터럴 만드는 3가지 방법

```typescript
const tokenId = 1234567890123456789n;        // 숫자 뒤에 n — 가장 간단
const amount  = 50_000_000n;                 // _ 는 가독성용 구분자, 실제 값에는 영향 없음
                                             // 50_000_000n == 50000000n
const fee     = BigInt('1000000000000000');  // 문자열에서 변환 — API 응답이 문자열일 때
const fee2    = BigInt(1000);               // number에서 변환 — 2^53 이하만 안전
```

`_` 구분자는 큰 숫자를 읽기 쉽게 만드는 문법이다. `50_000_000`은 5천만으로 한눈에 보인다. 없어도 동작은 같다.

### bigint 연산 — 양쪽이 모두 bigint여야 함

```typescript
const total = amount + fee;    // OK: bigint + bigint
const half  = amount / 2n;    // OK: 2n 도 bigint 리터럴
const wrong = amount + 1;     // 에러: bigint + number 혼용 불가
// 에러 메시지: Operator '+' cannot be applied to types 'bigint' and 'number'.
```

왜 혼용이 안 될까? bigint와 number는 내부 표현 방식 자체가 다르다. 자동 변환 시 정밀도 손실이 생길 수 있기 때문에 TypeScript가 명시적 변환을 강제한다.

```typescript
const fee = 5;                           // number
const total = amount + BigInt(fee);      // number → bigint로 명시 변환 후 연산
```

### 출력·저장 시 문자열 변환

DB, JSON, 로그 출력 시 bigint를 그대로 쓸 수 없는 경우가 많다. 문자열로 변환해야 한다.

```typescript
const tokenId = 1234567890123456789n;
const s1 = tokenId.toString();   // '1234567890123456789' — 메서드 방식
const s2 = String(tokenId);      // '1234567890123456789' — 전역 함수 방식
// JSON.stringify(tokenId)는 에러 — bigint는 JSON 직렬화 불가
```

강의 코드에서 bigint가 보이는 곳: 토큰 ID 계산, 이체 금액, 보유 한도, EIP-191 서명값 등.

---

## 자주 하는 실수

**실수 1 — 잘못된 타입 할당**
```typescript
const name: string = 42;  // 에러: number는 string에 못 들어감
// Type 'number' is not assignable to type 'string'.
```

**실수 2 — any 남발**
```typescript
function parse(input: any) { ... }     // 타입 정보가 사라짐 — 이후 코드에서 모든 타입 검사 무력화
function parse(input: unknown) { ... } // 이렇게 써야 안전 — 쓰기 전에 타입 확인 강제됨
```

**실수 3 — bigint와 number 혼용**
```typescript
const amount = 100n;        // bigint
const fee = 5;              // number
const total = amount + fee; // 에러: 혼용 불가
const total = amount + BigInt(fee);  // OK — 명시적으로 변환
```

**실수 4 — 타입 어노테이션의 `:` 와 구조 분해의 `:` 혼동**
```typescript
const age: number = 40;          // 여기 ':'는 "타입은 number다"
const { age: userAge } = person; // 여기 ':'는 "age를 꺼내서 userAge라는 이름으로 쓰겠다"
// 문법은 같아 보이지만 전혀 다른 의미 — 문맥으로 구분해야 한다
```

---

## 체크리스트

- [ ] `const`와 `let`의 차이를 설명할 수 있다
- [ ] `var`를 안 쓰는 이유를 블록 스코프 개념으로 설명할 수 있다
- [ ] `: string`, `: number[]` 같은 어노테이션을 읽을 수 있다
- [ ] 타입 추론 덕분에 어노테이션을 생략해도 되는 상황을 안다
- [ ] `any`가 왜 위험한지 설명할 수 있다
- [ ] `unknown`을 쓸 때 왜 타입 검사가 필요한지 설명할 수 있다
- [ ] `void`와 `never`의 차이를 설명할 수 있다
- [ ] `50_000_000n`이 bigint 리터럴임을 알고, `number`와 혼용할 수 없다는 것을 안다
- [ ] bigint를 문자열로 변환하는 방법을 안다

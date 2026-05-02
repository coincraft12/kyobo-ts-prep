# CH01 — 변수와 타입

## 핵심 한 줄
> TypeScript = JavaScript + 타입 검사. 타입은 "이 변수에 뭘 넣을 수 있는지"를 컴파일 시점에 확인해주는 도구.

---

## 1. 변수 선언 — const vs let

```typescript
const x = 10;   // 재할당 불가
let y = 20;     // 재할당 가능
```

두 줄 보고 "아, 하나는 못 바꾸고 하나는 바꿀 수 있구나" 하고 넘어가면 충분히 이해한 게 아니다. 핵심은 **"왜 const를 기본으로 써야 하는가"** 다.

---

### const는 "값"이 아니라 "바인딩"을 고정한다

이 말이 처음엔 와닿지 않는다. 예시로 보자.

```typescript
const x = 10;
x = 20;  // ❌ 컴파일 에러: Cannot assign to 'x' because it is a constant.
```

여기까지는 직관적이다. 그런데:

```typescript
const user = { name: 'Sharon', age: 40 };
user.name = 'Alice';  // ✅ 에러가 안 남!
user = { name: 'Alice', age: 30 };  // ❌ 에러
```

왜 `user.name = 'Alice'`는 되고 `user = ...`는 안 될까?

`const`가 고정하는 건 **변수와 값 사이의 연결(바인딩)** 이다. `user`라는 이름이 가리키는 "메모리 주소"가 고정되는 것이지, 그 주소 안에 있는 내용까지 동결되는 건 아니다.

```
const user = { name: 'Sharon' }
         ↑           ↑
     바인딩 고정    내용은 변경 가능
(user가 다른 객체를    (user.name = '...'
 가리키는 건 불가)      이건 가능)
```

객체 내부까지 완전히 고정하고 싶으면 `Object.freeze()`나 `as const`(→ CH06)를 써야 한다.

---

### 그러면 왜 const를 기본으로 써야 하나?

두 가지 이유다.

**1. 의도를 명확히 전달한다.**

```typescript
// before — let을 썼을 때
let userId = 'user-001';

// 읽는 사람 입장: "나중에 이 값이 바뀔 수도 있나? 아래 코드를 다 읽어야 알겠네."
```

```typescript
// after — const를 썼을 때
const userId = 'user-001';

// 읽는 사람 입장: "이 값은 이 함수 안에서 절대 안 바뀐다. 안심하고 넘어가도 된다."
```

코드는 실행하는 것보다 읽는 시간이 훨씬 길다. `const`는 "이 변수는 추적하지 않아도 된다"는 신호를 준다.

**2. 실수로 덮어쓰는 버그를 원천 차단한다.**

```typescript
// let이면 이런 버그가 가능
let total = 0;
// ... 200줄 뒤 ...
total = getDiscount();  // 실수로 += 대신 = 을 써서 총합을 덮어씀
```

`const`였다면 컴파일 시점에 에러가 나서 실행도 못 했다.

> **규칙: const를 기본으로. 루프 카운터, 누적 합산처럼 명확히 변해야 할 때만 let.**

---

### var는 왜 완전히 쓰지 않나?

`var`는 블록 스코프(`{}`)를 무시한다. 이게 예측 불가능한 버그의 원인이 된다.

```typescript
// ❌ var — 블록을 벗어나도 살아있음
if (true) {
  var leaked = 'outside';
}
console.log(leaked);  // 'outside' — if 블록 밖인데 접근됨

// ✅ let — 블록을 벗어나면 사라짐
if (true) {
  let safe = 'inside';
}
console.log(safe);  // 컴파일 에러 — 블록 밖에서 접근 불가
```

`var`는 절대 쓰지 않는다. TypeScript 코드에서 `var`가 보이면 레거시 코드라는 신호다.

---

## 2. 타입 어노테이션 — `:` 기호의 두 얼굴

변수명 뒤에 `: 타입`을 붙이면 해당 타입 외 값은 컴파일 에러가 난다.

```typescript
const name: string = 'Sharon';
const age: number = 40;
const isActive: boolean = true;
```

---

### 같은 `:` 기호, 완전히 다른 의미

이 `:`가 나중에 구조 분해 문법에서도 나온다. 같은 기호인데 의미가 전혀 다르다. 나란히 놓고 보자.

```typescript
// 타입 어노테이션의 ':'
const age: number = 40;
//        ↑
//     "age의 타입은 number다"

// 구조 분해의 ':'
const { age: userAge } = person;
//         ↑
//     "age 필드를 꺼내서 userAge라는 이름으로 쓰겠다"
```

| 위치 | 기호 | 의미 |
|---|---|---|
| `변수명: 타입` | `:` | "이 변수의 타입은 ~이다" |
| `{ 필드명: 새이름 }` | `:` | "이 필드를 꺼내서 새 이름으로" |

같은 기호지만 문맥이 완전히 다르다. 처음엔 헷갈리는 게 정상이다. 코드를 읽을 때 "지금 타입 자리인가, 구조 분해 자리인가"를 보면 된다.

---

### 어노테이션을 생략해도 되는 경우 — 타입 추론

TypeScript는 초기값을 보고 타입을 자동으로 추론한다.

```typescript
// 어노테이션 있음
const name: string = 'Sharon';

// 어노테이션 없음 — 완전히 동일하게 동작
const name = 'Sharon';  // TS가 'Sharon'을 보고 string으로 추론
```

내부적으로 타입 정보가 사라지는 게 아니다. 컴파일러가 알아서 `string`을 붙여준다고 생각하면 된다. 그래서 이렇게 써도 에러가 난다:

```typescript
const name = 'Sharon';
name.toFixed();  // ❌ 에러: 'toFixed'는 number 메서드, string에 없음
```

추론이 제대로 작동하는 한 어노테이션을 생략하면 코드가 짧고 읽기 좋아진다.

---

### 어노테이션을 반드시 써야 하는 곳

TypeScript가 스스로 추론할 수 없는 경우에는 반드시 써야 한다.

```typescript
// ✅ 함수 매개변수 — 호출 전까지 값이 없으니 추론 불가
function greet(name: string): string {
  return `Hello, ${name}`;
}

// 위에서 반환 타입 :string 을 명시했기 때문에
// 실수로 다른 타입을 반환하면 컴파일러가 잡아준다
function getAge(): number {
  return 'forty';  // ❌ 에러: string은 number 자리에 못 들어감
}

// ✅ 초기값 없이 선언만 할 때
let result: string;  // 나중에 할당할 예정임을 명시
result = 42;  // ❌ 에러: number는 string에 못 들어감
```

| 상황 | 어노테이션 | 이유 |
|---|---|---|
| `const x = 'hello'` | 생략 가능 | 초기값으로 추론 가능 |
| `function f(x)` | **필수** | 매개변수는 추론 불가 |
| `function f(): T` | 권장 | 의도와 다른 리턴을 컴파일러가 검사 |
| `let x;` | **필수** | 초기값 없으면 추론 불가 |

---

## 3. 배열 타입 — `string[]` vs `Array<string>`

```typescript
const ids: string[] = ['a', 'b', 'c'];
const nums: number[] = [1, 2, 3];
```

`string[]`은 "string들의 배열"이라고 읽는다. `[]`가 "복수"를 나타낸다.

---

### 왜 문법이 두 가지인가?

```typescript
// 방식 1: 후위 표기
const a: string[] = ['x', 'y'];

// 방식 2: 제네릭 표기
const b: Array<string> = ['x', 'y'];
```

두 가지는 **완전히 동일하다.** 컴파일 결과도 같고 동작도 같다. 그러면 왜 두 가지가 존재할까?

- `string[]` — 짧고 직관적. JavaScript 배열 문법과 비슷.
- `Array<string>` — 제네릭 문법의 일관성. `Map<string, number>`, `Promise<string>` 같은 패턴과 통일감이 있음.

강의에서는 `string[]` 형태를 기본으로 쓴다. 단, 중첩 배열에서는 `Array<string[]>`이 `string[][]`보다 읽기 쉬울 때가 있다.

---

### 타입이 다르면 즉시 에러

```typescript
const ids: string[] = ['a', 'b'];
ids.push(42);   // ❌ 에러: Argument of type 'number' is not assignable to parameter of type 'string'.
ids.push('c');  // ✅ OK
```

배열을 선언할 때 타입을 지정하면 이후 모든 추가/수정에서 타입이 일치하는지 컴파일러가 검사한다.

> **핵심:** `string[]`와 `Array<string>`은 완전히 동일. 강의에서는 `string[]`를 기본으로 쓴다.

---

## 4. 특수 타입 — any, unknown, void, never

| 타입 | 의미 | 언제 쓰나 |
|---|---|---|
| `any` | 타입 검사 포기 | **쓰지 않는다** |
| `unknown` | 뭔지 모르지만, 쓰기 전에 검사 강제 | 외부 입력, catch 블록 |
| `void` | 리턴은 하지만 값이 없음 | 리턴이 없는 함수 |
| `never` | 리턴 자체를 하지 않음 | 항상 throw하는 함수, 무한 루프 |

---

### any vs unknown — TypeScript를 끄는 것 vs 안전하게 모르는 것

핵심 차이를 한 줄로 먼저:

- `any` — TypeScript를 **끈다.** 타입 검사 없이 뭐든 할 수 있다.
- `unknown` — "모르지만 안전하게." 쓰기 전에 반드시 타입을 좁혀야 한다.

코드로 직접 비교하자.

```typescript
// ❌ any — TS가 타입 검사를 완전히 포기
let a: any = '{"id":1}';
a.toFixed();           // 에러가 안 남 — string에 toFixed()는 없는데도 통과
a.nonExistent();       // 에러가 안 남 — 존재하지 않는 메서드도 통과
a.length;              // 에러가 안 남 — 실제론 맞지만 이유는 모름

// ✅ unknown — 받을 수는 있지만, 쓰기 전에 반드시 확인
let u: unknown = '{"id":1}';
u.toFixed();           // ❌ 컴파일 에러 — unknown 상태에서는 아무것도 못 함
u.length;              // ❌ 컴파일 에러 — .length 접근도 불가
if (typeof u === 'string') {
  u.length;            // ✅ 이 블록 안에서는 string임이 확인됨
  JSON.parse(u);       // ✅
  u.toUpperCase();     // ✅
}
```

`any`를 쓰는 순간 그 변수에서 타입 에러는 다시는 나지 않는다. 컴파일은 통과하지만 런타임에서 예상치 못한 에러가 터진다. **TypeScript를 쓰는 이유가 사라지는 것이다.**

`unknown`은 "모르는 값을 받되, 쓸 때는 확인하고 써라"고 강제한다. 불편하게 느껴지지만 그 불편함이 런타임 에러를 막는다.

#### unknown 실전 예: catch 블록

```typescript
try {
  await callExternalApi();
} catch (err) {
  // TypeScript 4.0부터 catch의 err는 unknown 타입
  console.log(err.message);  // ❌ 에러: unknown 타입엔 .message 없음

  if (err instanceof Error) {
    console.log(err.message);  // ✅ Error 타입임이 확인됨
  }
}
```

외부 API 응답이나 `catch` 블록의 에러 객체는 타입을 미리 알 수 없다. `unknown`이 이런 상황에서 타입 안전성을 제공한다.

> **핵심:** `any`는 TypeScript를 끄는 것. `unknown`은 쓰기 전에 반드시 타입을 좁혀야 하는 안전한 "모름".

---

### void vs never — 리턴의 두 가지 형태

두 타입 모두 함수의 반환 타입에 쓰이지만, 의미가 다르다.

```typescript
// void — 리턴은 하지만 값이 없다
function logMessage(msg: string): void {
  console.log(msg);
  // return; 또는 return 없음
  // 함수가 정상적으로 끝난다
}

// never — 리턴 자체를 하지 않는다
function throwError(message: string): never {
  throw new Error(message);
  // 이 줄 아래는 절대 실행되지 않음
  // 함수가 "정상 종료"하는 경우가 없다
}
```

`void`는 "빈손으로 돌아온다", `never`는 "돌아오지 않는다"의 차이다.

`never`가 실제로 쓰이는 곳:

```typescript
// 1. 항상 예외를 던지는 유틸 함수
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

// 2. 무한 루프 — 절대 리턴하지 않음
function runForever(): never {
  while (true) {
    processQueue();
  }
}

// 3. 타입 좁히기가 완전히 끝난 지점
function handleStatus(status: 'active' | 'inactive') {
  if (status === 'active') {
    // ...
  } else if (status === 'inactive') {
    // ...
  } else {
    // 여기서 status의 타입은 never — 가능한 모든 케이스를 처리했으므로
    assertNever(status);
  }
}
```

`never`는 처음엔 잘 안 보이지만, 타입 시스템이 "이 코드는 절대 실행되지 않는다"를 보장할 때 등장한다.

| 타입 | 리턴 동작 | 예시 |
|---|---|---|
| `void` | 리턴하되 값 없음 | `console.log()` 호출만 하는 함수 |
| `never` | 리턴 자체 없음 | 항상 `throw`, 무한 루프 |

> **핵심:** `void`는 "빈손으로 돌아옴", `never`는 "돌아오지 않음". `never`는 타입 완결성을 위해 존재한다.

---

## 5. bigint — 블록체인 필수 타입

블록체인 코드를 쓰다 보면 이런 코드를 만난다:

```typescript
const tokenId = 1234567890123456789n;
const amount = 50_000_000_000_000_000n;
```

`n`이 뭔지, 왜 `number`를 안 쓰는지, 이 두 가지를 이해해야 한다.

---

### 왜 number로는 안 되나 — IEEE 754 정밀도 한계

JavaScript의 `number`는 IEEE 754 64비트 부동소수점이다. 이 형식으로는 2⁵³ = 9,007,199,254,740,992 보다 큰 정수를 **정확히** 표현하지 못한다.

눈으로 확인해보자:

```typescript
// 2^53 + 1 을 number로 표현하면
const unsafe = 9007199254740993;
console.log(unsafe === 9007199254740992);  // true — 값이 달라졌는데 같다고 나옴!

// bigint는 정확히 구분
const safe = 9007199254740993n;
console.log(safe === 9007199254740992n);  // false — 올바르게 다른 값으로 구분됨
```

블록체인에서 토큰 ID나 wei 단위 이더 금액은 이 한계를 훌쩍 넘는다. 1 ETH = 10¹⁸ wei인데, 이건 2⁵³보다 몇 배나 크다. `number`로 다루면 금액이 조용히 틀려진다.

---

### `n` 리터럴이 뭔가

숫자 뒤에 `n`을 붙이면 bigint 리터럴이 된다. 이 `n`은 JavaScript 엔진에게 "이 숫자는 number가 아니라 bigint로 처리해라"고 알리는 접미사다.

```typescript
const a = 1234;   // 타입: number
const b = 1234n;  // 타입: bigint — n을 붙이면 bigint
```

bigint를 만드는 방법 세 가지:

```typescript
// 1. 리터럴 — n 접미사
const tokenId = 1234567890123456789n;

// 2. _ 구분자 — 큰 숫자를 읽기 쉽게 (값에는 영향 없음)
const amount = 50_000_000n;   // 5천만 — 50000000n과 완전히 같다

// 3. BigInt() 변환 — 외부 입력이 문자열로 올 때
const fromApi = BigInt('1000000000000000000');   // API 응답이 문자열인 경우
const fromNum = BigInt(1000);                    // number에서 변환 (2^53 이하만 안전)
```

`_` 구분자는 순전히 가독성을 위한 문법이다. `50_000_000`과 `50000000`은 완전히 같은 값이다.

---

### bigint + number 혼용은 왜 에러인가

```typescript
const amount = 100n;   // bigint
const fee = 5;         // number

const total = amount + fee;  // ❌ 에러: Operator '+' cannot be applied to types 'bigint' and 'number'.
```

bigint와 number는 내부 표현 방식 자체가 다르다. 자동으로 변환하면 정밀도 손실이 생길 수 있다. 그래서 TypeScript가 명시적 변환을 강제한다.

```typescript
// ✅ 명시적으로 변환 후 연산
const total = amount + BigInt(fee);   // number → bigint 변환 후 연산
```

---

### 출력·저장 시 문자열 변환

DB나 JSON에는 bigint를 그대로 넣을 수 없는 경우가 많다.

```typescript
const tokenId = 1234567890123456789n;

const s1 = tokenId.toString();   // '1234567890123456789'
const s2 = String(tokenId);      // '1234567890123456789' — 같은 결과

JSON.stringify(tokenId);  // ❌ 에러: bigint는 JSON 직렬화 불가
```

강의 코드에서 bigint가 나오는 곳: 토큰 ID 계산, 이체 금액(wei), 보유 한도, EIP-191 서명값 등.

> **핵심:** `number`는 2⁵³ 이상의 정수를 정확히 표현 못 한다. 블록체인 금액·ID에는 bigint를 써라. `1234n`의 `n`은 "bigint 리터럴"을 알리는 접미사다.

---

## 자주 하는 실수

**실수 1 — const의 "immutable"을 오해**
```typescript
// ❌ 착각: const면 객체 내부도 못 바꾼다
const user = { name: 'Sharon' };
user.name = 'Alice';  // ✅ 실제로는 된다 — const는 바인딩만 고정

// ❌ 이건 에러: 바인딩(변수가 가리키는 대상)을 바꾸는 것
user = { name: 'Alice' };  // Cannot assign to 'user' because it is a constant.
```

**실수 2 — 타입 어노테이션의 `:` vs 구조 분해의 `:`**
```typescript
const age: number = 40;          // ':' = "타입은 number다"
const { age: userAge } = person; // ':' = "age를 꺼내서 userAge로"
// 문법은 같아 보이지만 전혀 다른 의미. 문맥으로 구분해야 한다.
```

**실수 3 — any 남발**
```typescript
// ❌ any — 이후 모든 타입 검사 무력화
function parse(input: any) {
  return input.data.id;  // 런타임에서 에러날 수 있는데 컴파일 통과
}

// ✅ unknown — 쓰기 전에 타입 확인 강제
function parse(input: unknown) {
  if (typeof input === 'object' && input !== null && 'data' in input) {
    // 여기서야 input.data에 접근 가능
  }
}
```

**실수 4 — bigint와 number 혼용**
```typescript
// ❌ 혼용 불가
const amount = 100n;
const fee = 5;
const total = amount + fee;  // 에러

// ✅ 명시적 변환
const total = amount + BigInt(fee);  // OK
// 또는 처음부터 bigint로
const fee2 = 5n;
const total2 = amount + fee2;  // OK
```

**실수 5 — void를 반환값 없는 모든 상황에 쓰는 것**
```typescript
// ❌ 착각: 항상 throw하는 함수에 void
function fail(msg: string): void {  // 틀림 — 이 함수는 절대 리턴하지 않음
  throw new Error(msg);
}

// ✅ 항상 throw하면 never
function fail(msg: string): never {
  throw new Error(msg);
}
```

---

## 체크리스트

- [ ] `const`가 바인딩을 고정하는 것이지 객체 내부까지 동결하는 게 아님을 안다
- [ ] `const`를 기본으로 쓰는 이유를 "의도 전달"과 "실수 방지" 두 가지로 설명할 수 있다
- [ ] `var`를 안 쓰는 이유를 블록 스코프 개념으로 설명할 수 있다
- [ ] 타입 어노테이션의 `:`와 구조 분해의 `:`가 다른 의미임을 안다
- [ ] 타입 추론 덕분에 어노테이션을 생략해도 되는 상황과 반드시 써야 하는 상황을 구분한다
- [ ] `string[]`과 `Array<string>`이 동일하다는 걸 알고, 강의에서는 `string[]`를 쓴다는 걸 안다
- [ ] `any`가 TypeScript를 끄는 것이라는 관점을 이해하고, 쓰지 않는다
- [ ] `unknown`을 쓸 때 왜 타입 좁히기가 필요한지, `.length` 예시로 설명할 수 있다
- [ ] `void`는 "빈손으로 리턴", `never`는 "리턴 자체 없음"의 차이를 설명할 수 있다
- [ ] `never`가 쓰이는 실제 상황(항상 throw, 무한 루프)을 안다
- [ ] `number`의 2⁵³ 정밀도 한계를 이해하고 왜 bigint가 필요한지 설명할 수 있다
- [ ] `1234n`의 `n`이 bigint 리터럴 접미사임을 안다
- [ ] bigint와 number를 혼용하면 에러가 나고, 명시적으로 `BigInt()`로 변환해야 함을 안다
- [ ] bigint를 JSON에 직렬화하려면 `toString()`으로 변환해야 함을 안다

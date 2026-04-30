# CH01 — 변수와 타입

## 핵심 한 줄
> TypeScript = JavaScript + 타입 검사. 타입은 "이 변수에 뭘 넣을 수 있는지"를 컴파일 시점에 확인해주는 도구.

---

## 1. 변수 선언 — const vs let

```typescript
const x = 10;   // 재할당 불가
let y = 20;     // 재할당 가능
```

**규칙: const 기본, 어쩔 수 없을 때만 let.**

`var`는 절대 안 쓴다. 블록 스코프가 없어서 버그 원인이 된다.

---

## 2. 타입 어노테이션

변수명 뒤에 `: 타입`을 붙이면 해당 타입 외 값은 컴파일 에러.

```typescript
const name: string = 'Sharon';
const age: number = 40;
const isActive: boolean = true;
```

**그런데 대부분은 생략해도 된다.** TS가 초기값을 보고 자동 추론하기 때문.

```typescript
const name = 'Sharon';  // TS가 string으로 추론
const age = 40;         // TS가 number로 추론
```

어노테이션을 **꼭 써야 하는 곳**: 함수 매개변수, 함수 리턴 타입, 타입이 모호한 경우.

---

## 3. 배열과 객체

```typescript
const ids: string[] = ['a', 'b', 'c'];
const nums: number[] = [1, 2, 3];
```

배열 타입은 `타입[]` 또는 `Array<타입>` 둘 다 쓴다. 강의에선 `타입[]` 형태가 주류.

객체는 중괄호로 형태를 정의한다:

```typescript
const user: { name: string; age: number } = {
  name: 'Sharon',
  age: 40,
};
```

실무에서 객체 형태는 보통 `interface`나 `type`으로 따로 빼서 이름을 붙인다 (→ CH03).

---

## 4. 특수 타입

| 타입 | 의미 | 언제 쓰나 |
|------|------|-----------|
| `any` | 타입 검사 포기 | **쓰지 마라** |
| `unknown` | 뭔지 모르지만, 쓰기 전에 검사 강제 | 외부 입력, catch 블록 |
| `void` | 리턴값 없음 | 리턴이 없는 함수 |
| `never` | 이 지점에 절대 도달 안 함 | 항상 throw하는 함수 |

### any vs unknown

```typescript
let a: any = '{"id":1}';
a.toFixed();          // 에러 안 남 — TS가 포기했으니까
JSON.parse(a);        // 그냥 통과

let u: unknown = '{"id":1}';
u.toFixed();          // 컴파일 에러 — 뭔지 모르니까 못 씀
if (typeof u === 'string') {
  JSON.parse(u);      // OK — string임이 확인된 후에만 사용 가능
}
```

**`any`는 TS를 끄는 것과 같다.** 강의 코드에선 `unknown`을 쓴다.

---

## 5. bigint — 블록체인 필수 타입

`number`는 2⁵³ 이상의 정수를 정확히 표현하지 못한다. 토큰 ID나 금액처럼 큰 정수를 다루는 블록체인 코드에서는 `bigint`를 쓴다.

```typescript
const tokenId = 1234567890123456789n;   // 숫자 뒤에 n → bigint 리터럴
const amount  = 50_000_000n;            // _ 는 가독성용 구분자, 값에 영향 없음
const fee     = BigInt('1000000000000000');  // 문자열에서 변환
```

연산할 때 양쪽이 모두 `bigint`여야 한다:

```typescript
const total = amount + fee;    // OK: bigint + bigint
const half  = amount / 2n;    // OK: 나누는 수도 2n (bigint)
const wrong = amount + 1;     // 에러: bigint + number 혼용 불가
```

로그 출력이나 DB 저장 시 문자열로 변환:

```typescript
const s = tokenId.toString();   // '1234567890123456789'
const s = String(amount);       // '50000000'
```

강의 코드에서 `bigint`가 보이는 곳: 토큰 ID 계산, 이체 금액, 보유 한도, EIP-191 서명값 등.

---

## 자주 하는 실수

**실수 1 — 잘못된 타입 할당**
```typescript
const name: string = 42;  // 에러: number는 string에 못 들어감
```

**실수 2 — any 남발**
```typescript
function parse(input: any) { ... }  // 타입 정보가 사라짐
function parse(input: unknown) { ... }  // 이렇게 써야 안전
```

---

## 자주 하는 실수 (bigint)

**실수 — number와 혼용**
```typescript
const amount = 100n;
const fee = 5;             // number
const total = amount + fee; // 에러: 혼용 불가
const total = amount + BigInt(fee);  // OK
```

---

## 체크리스트

- [ ] `const`와 `let`의 차이를 설명할 수 있다
- [ ] `: string`, `: number[]` 같은 어노테이션을 읽을 수 있다
- [ ] `any`가 왜 위험한지 설명할 수 있다
- [ ] `unknown`을 쓸 때 왜 타입 검사가 필요한지 설명할 수 있다
- [ ] `50_000_000n`이 bigint 리터럴임을 알고, number와 혼용할 수 없다는 것을 안다

# CH00 — TypeScript 배경과 작동 원리

## 핵심 한 줄
> TypeScript는 "JavaScript가 대규모 팀에서 무너지는 문제"를 해결하기 위해 Microsoft가 만든 언어다. JavaScript에 타입 검사를 더한 것이고, 실행 전 컴파일 단계에서 에러를 잡는다.

---

## 1. 왜 TypeScript가 생겨났는가

### JavaScript의 원래 목적

JavaScript는 1995년 Netscape에서 웹 페이지에 간단한 동작을 추가하기 위해 10일 만에 설계됐다. 폼 검증, 버튼 클릭 반응 — 그게 전부였다. 수백 줄짜리 스크립트를 한 명이 짜는 것이 당시 사용 시나리오였다.

문제는 세상이 달라졌다는 것이다. Node.js가 등장하면서 JavaScript는 서버에서도 쓰이기 시작했다. 웹 앱은 수십만 줄 규모로 커졌고, 수십 명의 개발자가 한 코드베이스를 동시에 건드리게 됐다.

그런데 JavaScript는 여전히 "동적 타입" 언어였다. 변수에 무엇이든 넣을 수 있고, 함수가 어떤 값을 받는지 명시하지 않아도 됐다. 10줄짜리 스크립트에서는 괜찮다. 10만 줄짜리 시스템에서는 재앙이다.

---

### JavaScript의 구체적인 문제

#### 문제 1. 에러가 실행 전까지 보이지 않는다

```javascript
// JavaScript — 이 코드는 문법적으로 완전히 유효하다
function getUserName(user) {
  return user.profile.name;  // user가 null이면? profile이 없으면?
}

// 호출하기 전까지 아무 에러도 없음
// 실제로 null을 넘겼을 때 서버가 죽는다
getUserName(null);
// 런타임 에러: Cannot read properties of null (reading 'profile')
```

JavaScript는 `getUserName(null)`이 잘못된 호출이라는 걸 실행하기 전까지 알지 못한다. 사용자가 직접 서비스를 쓰다가 에러를 만나거나, 운이 좋으면 테스트에서 발견된다.

#### 문제 2. 함수가 뭘 받고 뭘 돌려주는지 알 수 없다

```javascript
// JavaScript — 이 함수는 뭘 받나?
function processTransaction(tx, opts) {
  // tx가 객체? 문자열? opts는 필수? 선택?
  // 코드를 전부 읽거나 작성자에게 물어봐야 한다
}
```

팀이 커질수록 이 비용이 누적된다. 함수를 쓸 때마다 구현부를 들여다봐야 한다. 인자를 잘못 넘겨도 에러가 바로 나지 않는다. 잘못된 값이 시스템 깊숙이 들어간 뒤에야 예상치 못한 곳에서 터진다.

#### 문제 3. 리팩토링이 공포다

```javascript
// JavaScript — 함수 이름을 바꾸면?
function submitMintRequest(params) { ... }

// 수백 개 파일에서 이걸 호출하는데...
// 찾아서 다 바꿨는지 실행해봐야만 안다
```

JavaScript에서 함수 이름을 바꾸거나 인자 구조를 변경하면, 영향 받는 모든 곳을 수동으로 찾아야 한다. 하나라도 빠뜨리면 런타임에서 에러가 난다. 그래서 레거시 JavaScript 코드베이스는 "건드리면 뭔가 깨진다"는 공포감이 생긴다.

---

### 2012년, Microsoft의 답

Microsoft는 당시 자체적으로 거대한 JavaScript 애플리케이션(Visual Studio Online 등)을 개발하면서 이 문제를 정면으로 만났다. 2012년, Anders Hejlsberg(C# 설계자)가 이끄는 팀이 TypeScript를 오픈소스로 공개했다.

핵심 아이디어는 단순하다:

> **JavaScript에 타입을 추가하되, 최종 실행은 여전히 JavaScript로 한다.**

타입은 컴파일 시점에만 존재한다. 브라우저나 Node.js는 TypeScript를 모른다. TypeScript 코드를 JavaScript로 변환(컴파일)한 뒤에 실행한다.

---

## 2. TypeScript의 강점

### 강점 1. 에러를 실행 전에 잡는다

```typescript
// TypeScript — 같은 코드
function getUserName(user: { profile: { name: string } }): string {
  return user.profile.name;
}

getUserName(null);
// ❌ 컴파일 에러: Argument of type 'null' is not assignable to parameter
// → 코드 저장하는 순간 에디터가 빨간 줄로 알려줌. 실행 전에 발견.
```

에러가 런타임에서 컴파일 타임으로 이동한다. 사용자가 아니라 개발자가 먼저 만난다.

---

### 강점 2. 코드가 스스로 문서가 된다

```typescript
// TypeScript — 함수 시그니처만 봐도 계약이 보임
async function submitMintRequest(params: {
  userId: string;
  tokenId: bigint;
  amount: bigint;
}): Promise<string> {
  // 반환값은 UUID 문자열 (requestId)
}

// 이 함수를 호출하는 쪽은 구현을 안 봐도 된다:
// - userId: 문자열
// - tokenId: bigint (number 아님!)
// - amount: bigint
// - 반환: Promise<string> = 비동기로 string이 나옴
```

주석 없이도 인터페이스가 명확하다. 팀원이 바뀌어도, 6개월 뒤 자신이 돌아봐도 쉽게 이해할 수 있다.

---

### 강점 3. 자동완성과 즉각 피드백

```typescript
interface MintRequest {
  userId: string;
  tokenId: bigint;
  status: 'PENDING' | 'SUBMITTED' | 'CONFIRMED';
}

const req: MintRequest = { ... };
req.  // ← 여기서 점을 찍으면 에디터가 userId, tokenId, status 목록을 보여줌
req.stats  // ← 오타 → 에디터가 즉시 빨간 줄
```

에디터가 "이 객체에 어떤 필드가 있는지"를 알기 때문에 자동완성이 정확하게 동작한다. 오타도 저장하는 순간 표시된다.

---

### 강점 4. 리팩토링이 안전해진다

```typescript
// 함수 이름 변경 → 에디터가 모든 호출 위치를 한 번에 바꿔준다
// 인자 타입 변경 → 영향 받는 모든 곳에 컴파일 에러가 뜬다
// 필드 삭제 → 그 필드를 쓰는 코드가 전부 에러로 표시된다
```

TypeScript는 전체 코드베이스를 이해하고 있다. 바꾸면 어디가 깨지는지 실행 전에 알 수 있다.

---

## 3. TypeScript가 작동하는 방식

### 핵심: TypeScript는 JavaScript로 컴파일된다

브라우저도, Node.js도 TypeScript를 직접 실행하지 못한다. TypeScript로 작성한 코드는 반드시 JavaScript로 변환(컴파일)한 뒤에 실행된다.

```
TypeScript 코드 (.ts)
        ↓  tsc (TypeScript Compiler)
JavaScript 코드 (.js)
        ↓
Node.js / 브라우저 실행
```

이 변환 과정을 **트랜스파일(transpile)** 이라고 부른다. (컴파일과 거의 같은 의미로 쓰인다.)

---

### 타입 정보는 런타임에 사라진다

이 부분이 처음에 가장 많이 오해되는 지점이다.

```typescript
// TypeScript 소스 — 타입 어노테이션이 있음
function add(a: number, b: number): number {
  return a + b;
}

const result: number = add(1, 2);
```

컴파일하면:

```javascript
// JavaScript 출력 — 타입이 전부 사라짐
function add(a, b) {
  return a + b;
}

const result = add(1, 2);
```

`: number`, `: string` 같은 타입 어노테이션은 JavaScript에 존재하지 않는 개념이다. 컴파일러가 타입을 검사한 뒤, JavaScript로 변환할 때 전부 제거한다.

즉, **타입은 컴파일 시점의 도구**다. 실행 중에는 없다.

```typescript
// 런타임에 타입을 확인하려는 잘못된 시도
function process(value: string | number) {
  if (typeof value === 'string') { ... }   // ✅ 이건 JavaScript 문법 — 런타임에 동작
  if (value instanceof string) { ... }     // ❌ 에러 — string은 클래스가 아님
}
```

타입을 런타임에 확인하려면 JavaScript가 원래부터 제공하는 `typeof`, `instanceof` 같은 수단을 써야 한다. TypeScript 타입 자체가 런타임에 남아있지 않기 때문이다.

---

### TypeScript는 JavaScript의 Superset이다

"Superset"은 "상위 집합"이라는 뜻이다. 모든 JavaScript 코드는 그대로 TypeScript에서도 유효하다.

```
TypeScript
┌──────────────────────────────────────┐
│                                      │
│   JavaScript                         │
│   ┌──────────────────────────┐       │
│   │ const x = 1;             │       │
│   │ function add(a, b) {...} │       │
│   └──────────────────────────┘       │
│                                      │
│   + 타입 어노테이션                    │
│   + interface / type                 │
│   + 제네릭                            │
│   + 접근 제어자 (private, public)     │
│                                      │
└──────────────────────────────────────┘
```

`.js` 파일을 `.ts`로 이름만 바꿔도 컴파일이 된다. (타입 에러가 생길 수 있지만 구조 자체는 유효하다.)

반대로, TypeScript에서만 되는 것들(타입 어노테이션, interface 등)은 JavaScript에서 동작하지 않는다.

---

### tsc와 ts-node

TypeScript 도구 두 가지가 자주 등장한다.

| 도구 | 하는 일 | 사용 시점 |
|---|---|---|
| `tsc` | TypeScript → JavaScript 파일 변환. `.js` 파일을 디스크에 생성. | 배포용 빌드 |
| `ts-node` | 변환 없이 `.ts` 파일을 메모리에서 바로 실행. | 개발·실습 중 |

이 레포에서 `npm run ch01`은 내부적으로 `ts-node ch01-variables/index.ts`를 실행한다. 컴파일 결과 파일을 만들지 않고, 타입 검사 + 실행을 한 번에 처리한다.

---

### tsconfig.json — 컴파일러 설정

프로젝트 루트의 `tsconfig.json`이 TypeScript 컴파일러의 동작을 제어한다.

```json
{
  "compilerOptions": {
    "target": "ES2020",       // 어떤 버전의 JavaScript로 변환할지
    "strict": true,           // 엄격한 타입 검사 활성화 (권장)
    "module": "commonjs",     // 모듈 시스템 (Node.js용)
    "outDir": "./dist"        // 컴파일 결과를 저장할 폴더
  }
}
```

`strict: true`가 중요하다. 이걸 켜야 TypeScript가 제공하는 타입 검사가 제대로 작동한다. 끄면 많은 잠재적 버그를 그냥 통과시킨다.

---

## 4. JS vs TS — 나란히 비교

같은 기능을 JavaScript와 TypeScript로 작성했을 때 차이를 직접 보자.

```javascript
// JavaScript
class TxStateMachine {
  constructor(repo) {
    this.repo = repo;
  }

  async submit(userId, tokenId, amount) {
    // userId가 문자열인지, tokenId가 bigint인지 코드를 다 읽어야 안다
    // 잘못 호출해도 에러가 바로 안 남
    const id = generateId();
    await this.repo.save({ id, userId, tokenId, amount, status: 'REQUESTED' });
    return id;
  }
}
```

```typescript
// TypeScript
interface MintParams {
  userId: string;
  tokenId: bigint;
  amount: bigint;
}

class TxStateMachine {
  constructor(private repo: TxRepository) {}

  async submit(params: MintParams): Promise<string> {
    // 이 함수는 MintParams를 받고, 비동기로 string(requestId)을 반환한다
    // 잘못된 타입으로 호출 → 컴파일 에러
    const id = randomUUID();
    await this.repo.save({ id, ...params, status: 'REQUESTED' });
    return id;
  }
}

// 잘못 호출하는 순간 에디터에서 에러
const machine = new TxStateMachine(repo);
machine.submit({ userId: 'u-001', tokenId: 'not-bigint', amount: 1n });
//                                           ↑
//  ❌ 에러: Type 'string' is not assignable to type 'bigint'
```

---

## 5. "그냥 JavaScript 쓰면 안 되나?"

강의에서 TypeScript를 쓰는 직접적인 이유는 다음 세 가지다.

**1. 블록체인 금액은 bigint 강제가 필수다.**  
`number`로 ETH wei를 다루면 정밀도 손실로 금액이 틀려진다. TypeScript의 타입 시스템이 `bigint`와 `number`의 혼용을 컴파일 에러로 막아준다.

**2. 인터페이스가 계약서 역할을 한다.**  
`IBlockchainAdapter`, `TxRepository` 같은 인터페이스가 "이 컴포넌트는 이런 메서드를 반드시 갖는다"를 보장한다. JavaScript에서는 런타임까지 모른다.

**3. 강의 코드 자체가 TypeScript로 작성됐다.**  
읽고 따라가야 하니까.

---

## 자주 하는 질문

**Q. TypeScript를 배우면 JavaScript를 몰라도 되나?**  
A. 반대다. TypeScript는 JavaScript 위에 얹힌 것이다. JavaScript를 모르면 TypeScript도 모른다. 이 레포는 TypeScript 문법을 다루지만, 기저에는 항상 JavaScript가 있다.

**Q. 타입이 런타임에 사라지면 의미가 없는 거 아닌가?**  
A. 타입의 역할은 "실행 전 검사"다. 코드를 짤 때, 에디터에서 에디팅할 때, 빌드할 때 에러를 잡는다. 실행 중에는 이미 검증된 코드가 돌고 있는 것이다.

**Q. 모든 프로젝트에 TypeScript를 써야 하나?**  
A. 작은 스크립트, 혼자 쓰는 간단한 도구라면 JavaScript로 충분하다. 팀 협업, 장기 운영, 복잡한 도메인(금융, 블록체인)에서는 TypeScript의 가치가 분명하다.

---

## 체크리스트

- [ ] JavaScript가 동적 타입 언어라서 생기는 세 가지 문제(런타임 에러, 불명확한 인터페이스, 리팩토링 공포)를 설명할 수 있다
- [ ] TypeScript가 2012년 Microsoft에서 만들어진 배경을 안다
- [ ] TypeScript 코드는 JavaScript로 컴파일된 뒤 실행된다는 걸 안다
- [ ] 타입 어노테이션은 컴파일 시점에만 존재하고, 런타임에는 사라진다는 걸 안다
- [ ] TypeScript가 JavaScript의 Superset이라는 말의 의미를 안다 (모든 JS는 유효한 TS)
- [ ] `tsc`와 `ts-node`의 차이를 안다 (파일 생성 vs 메모리 실행)
- [ ] `strict: true`가 왜 중요한지 한 줄로 설명할 수 있다
- [ ] 강의에서 TypeScript를 쓰는 세 가지 직접적인 이유를 안다

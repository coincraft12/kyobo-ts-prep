# CH06 — 모던 문법

## 핵심 한 줄
> 강의 코드에서 처음 보면 낯선 문법들. 하나씩 알면 코드 읽는 속도가 2배 빨라진다.

---

## 1. 구조 분해 할당

객체나 배열에서 원하는 값만 꺼내는 문법.

### 객체 구조 분해

```typescript
const req = { id: 'req-001', toAddress: '0xAAA', tokenId: 'token-1', chainId: 1 };

// 기본 — 변수명이 필드명과 같아야 함
const { id, toAddress } = req;
// = const id = req.id; const toAddress = req.toAddress;

// 이름 바꾸기
const { id: requestId } = req;   // req.id를 requestId 변수에

// 기본값
const { memo = '없음' } = req;   // req.memo가 없으면 '없음'
```

강의 코드 빈출:
```typescript
// 메시지에서 필드 꺼내기
const { tokenId, toAddress } = message.fields as Record<string, string>;

// 함수 반환값에서 바로 꺼내기
const { messages } = await redis.xautoclaim(...);
```

### 배열 구조 분해

```typescript
const [first, second, ...rest] = ['a', 'b', 'c', 'd'];
// first = 'a', second = 'b', rest = ['c', 'd']
```

### for...of + Object.entries

객체를 키-값 쌍으로 순회할 때:
```typescript
const balances = { '0xAAA': 1000, '0xBBB': 500 };

for (const [address, amount] of Object.entries(balances)) {
  console.log(`${address}: ${amount}`);
}
```

---

## 2. nullish 연산자

### ?? (nullish coalescing)

왼쪽이 `null` 또는 `undefined`일 때만 오른쪽을 사용.

```typescript
const port = config.port ?? 3000;
// config.port가 null/undefined면 3000, 아니면 config.port 값
```

`||`와 차이:
```typescript
const a = 0 || 100;    // 100 — 0은 falsy이므로 오른쪽
const b = 0 ?? 100;    // 0 — 0은 null/undefined가 아니므로 왼쪽

const c = '' || '기본값';   // '기본값' — 빈 문자열도 falsy
const d = '' ?? '기본값';   // '' — 빈 문자열은 정상값
```

실제로 중요한 이유: 숫자 0이나 빈 문자열이 유효한 값일 때 `||` 쓰면 버그 발생.

### ?. (옵셔널 체이닝)

중간에 null/undefined가 있어도 에러 없이 undefined를 반환.

```typescript
const city = user?.address?.city;
// user가 null → undefined (에러 안 남)
// user.address가 null → undefined
// 둘 다 있으면 → city 값
```

콤보로 자주 사용:
```typescript
const city = user?.address?.city ?? '서울';  // undefined면 '서울'
```

---

## 3. spread / rest

### spread — 펼치기

```typescript
// 배열 펼치기
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];   // [1, 2, 3, 4, 5]

// 객체 펼치기 (얕은 복사 + 덮어쓰기)
const base = { chainId: 1, toAddress: '0xAAA' };
const updated = { ...base, toAddress: '0xBBB' };
// { chainId: 1, toAddress: '0xBBB' } — toAddress만 교체
```

### rest — 나머지 모으기

```typescript
function logAll(label: string, ...args: unknown[]): void {
  console.log(label, ...args);
}

logAll('결과:', 1, 2, 3);   // args = [1, 2, 3]
```

---

## 4. 템플릿 리터럴

백틱(`` ` ``)으로 감싸고 `${}`로 변수 삽입.

```typescript
const address = '0xAAA';
const tokenId = 'token-1';

const key = `mint:${address}:${tokenId}`;   // 'mint:0xAAA:token-1'
const url = `https://api.example.com/tx/${txHash}`;
```

강의 코드에서 Redis 키, 이벤트 키, 에러 메시지 등에 자주 등장.

---

## 5. as const — 리터럴 타입 고정

```typescript
const CHAIN_TYPE = 'EVM';         // 타입: string (바뀔 수 있다고 판단)
const CHAIN_TYPE = 'EVM' as const; // 타입: 'EVM' (이 값으로 고정)
```

객체에 쓰면 모든 필드가 readonly가 되고 값도 리터럴 타입으로 고정:

```typescript
const ROLES = {
  MINTER: 'MINTER_ROLE',
  PAUSER: 'PAUSER_ROLE',
} as const;

type Role = typeof ROLES[keyof typeof ROLES];
// = 'MINTER_ROLE' | 'PAUSER_ROLE'
// ROLES 객체에서 union 타입을 뽑아내는 패턴
```

왜 쓰나: enum 대신 사용 가능하고 런타임 값도 그대로 쓸 수 있어서.

---

## 6. 타입 단언 — as와 !

### as — "이 타입이라고 믿어"

```typescript
const raw: unknown = '{"tokenId":"token-1"}';
const str = raw as string;            // unknown을 string으로 단언
const parsed = JSON.parse(str) as { tokenId: string };  // 결과 타입 단언
```

주의: 컴파일러를 설득하는 것이지 실제 변환이 아님. 틀리면 런타임 에러.

```typescript
// 남용 예 — 피해야 함
const n = 'hello' as unknown as number;  // 컴파일은 되지만 런타임에 버그
```

### ! — "null/undefined가 아니라고 보장"

```typescript
const map = new Map<string, number>();
map.set('key', 100);

const val = map.get('key');    // 타입: number | undefined
const val = map.get('key')!;  // 타입: number (없을 리 없다고 단언)
```

`!`는 **확실히 값이 있다는 게 보장될 때만** 사용. 아니면 `?? 기본값` 패턴으로 대체.

---

## 자주 하는 실수

**실수 1 — 구조 분해에서 이름 바꾸기 문법 혼동**
```typescript
// 이건 기본값 설정
const { name = 'Anonymous' } = user;

// 이건 이름 바꾸기
const { name: userName } = user;

// 둘 다 조합
const { name: userName = 'Anonymous' } = user;
```

**실수 2 — as를 타입 변환으로 오해**
```typescript
const x = '123' as number;  // 컴파일 에러: string을 number로 직접 단언 불가
const x = Number('123');    // 실제 변환은 이렇게
```

---

## 체크리스트

- [ ] `const { x, y } = obj` 와 `const { x: newName } = obj` 차이를 안다
- [ ] `??`와 `||`의 차이를 빈 문자열/0 예시로 설명할 수 있다
- [ ] `?.`가 에러 없이 undefined를 반환하는 원리를 안다
- [ ] `...arr`가 context에 따라 spread/rest 두 가지 의미임을 안다
- [ ] `as const`가 왜 필요한지 설명할 수 있다
- [ ] `as`와 `!`를 언제 써야 하고 왜 남용하면 안 되는지 안다

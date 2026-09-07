import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Generates all valid candidate factors:
 * 1- or 2-digit positive integers (1-99) ending in 0, 2, 4, 6, 8.
 */
export function getValidEvenFactors() {
  const factors = [];
  for (let i = 1; i <= 99; i++) {
    const lastDigit = i % 10;
    if ([0, 2, 4, 6, 8].includes(lastDigit)) {
      factors.push(i);
    }
  }
  return factors;
}

/**
 * Validates whether a number is a valid factor:
 * - integer between 1 and 99
 * - ends with 0, 2, 4, 6, or 8
 */
export function isValidEvenFactor(n) {
  if (typeof n !== 'number' || !Number.isInteger(n)) return false;
  if (n < 1 || n > 99) return false;
  const lastDigit = n % 10;
  return [0, 2, 4, 6, 8].includes(lastDigit);
}

/**
 * Generates a random problem { a, b, product }
 * Supports optional difficulty modes if desired (e.g. 'all', '1-digit', '2-digit')
 */
export function generateProblem(mode = 'mixed') {
  const allCandidates = getValidEvenFactors();
  const singleDigit = allCandidates.filter(n => n < 10); // [2, 4, 6, 8]
  const doubleDigit = allCandidates.filter(n => n >= 10); // [10, 12, ... 98]

  let a, b;
  if (mode === '1-digit') {
    a = singleDigit[Math.floor(Math.random() * singleDigit.length)];
    b = singleDigit[Math.floor(Math.random() * singleDigit.length)];
  } else if (mode === '2-digit') {
    a = doubleDigit[Math.floor(Math.random() * doubleDigit.length)];
    b = doubleDigit[Math.floor(Math.random() * doubleDigit.length)];
  } else if (mode === '1x2') {
    const pickFirstSingle = Math.random() < 0.5;
    if (pickFirstSingle) {
      a = singleDigit[Math.floor(Math.random() * singleDigit.length)];
      b = doubleDigit[Math.floor(Math.random() * doubleDigit.length)];
    } else {
      a = doubleDigit[Math.floor(Math.random() * doubleDigit.length)];
      b = singleDigit[Math.floor(Math.random() * singleDigit.length)];
    }
  } else {
    // Mixed: balanced sampling so single digits aren't drowned out by 45 two-digit numbers
    const pickSingleA = Math.random() < 0.35;
    const pickSingleB = Math.random() < 0.35;
    a = pickSingleA
      ? singleDigit[Math.floor(Math.random() * singleDigit.length)]
      : doubleDigit[Math.floor(Math.random() * doubleDigit.length)];
    b = pickSingleB
      ? singleDigit[Math.floor(Math.random() * singleDigit.length)]
      : doubleDigit[Math.floor(Math.random() * doubleDigit.length)];
  }

  return {
    a,
    b,
    product: a * b
  };
}

// Tests
test('Factor Generation: Candidate List', () => {
  const list = getValidEvenFactors();
  
  // 1-digit: 2, 4, 6, 8 (4 numbers)
  // 2-digit: 10, 12..18 (5), 20..28 (5), ... 90..98 (5) -> 9 * 5 = 45 numbers
  // Total: 49 numbers
  assert.equal(list.length, 49, 'Should have exactly 49 valid candidate numbers in 1-99');

  for (const num of list) {
    assert.equal(num >= 1 && num <= 99, true, `Number ${num} must be in 1-99 range`);
    const lastDigit = num % 10;
    assert.equal([0, 2, 4, 6, 8].includes(lastDigit), true, `Number ${num} must end in an even digit`);
  }

  // Check specific inclusions & exclusions
  assert.equal(list.includes(2), true);
  assert.equal(list.includes(8), true);
  assert.equal(list.includes(10), true);
  assert.equal(list.includes(24), true);
  assert.equal(list.includes(50), true);
  assert.equal(list.includes(98), true);

  // Exclude odds & 0
  assert.equal(list.includes(0), false);
  assert.equal(list.includes(3), false);
  assert.equal(list.includes(15), false);
  assert.equal(list.includes(21), false);
  assert.equal(list.includes(99), false);
  assert.equal(list.includes(100), false);
});

test('Factor Validation: isValidEvenFactor', () => {
  assert.equal(isValidEvenFactor(2), true);
  assert.equal(isValidEvenFactor(10), true);
  assert.equal(isValidEvenFactor(98), true);
  assert.equal(isValidEvenFactor(0), false);
  assert.equal(isValidEvenFactor(1), false);
  assert.equal(isValidEvenFactor(3), false);
  assert.equal(isValidEvenFactor(15), false);
  assert.equal(isValidEvenFactor(100), false);
  assert.equal(isValidEvenFactor(24.5), false);
  assert.equal(isValidEvenFactor('24'), false);
});

test('Problem Generation: Generate 1000 problems and verify all factor constraints', () => {
  const modes = ['mixed', '1-digit', '2-digit', '1x2'];
  for (const mode of modes) {
    for (let i = 0; i < 250; i++) {
      const problem = generateProblem(mode);
      assert.ok(problem.a, 'Problem must have factor a');
      assert.ok(problem.b, 'Problem must have factor b');
      assert.equal(problem.product, problem.a * problem.b, 'Product must be exact');

      assert.equal(isValidEvenFactor(problem.a), true, `Factor a (${problem.a}) must be valid even-ending`);
      assert.equal(isValidEvenFactor(problem.b), true, `Factor b (${problem.b}) must be valid even-ending`);

      const aLast = problem.a % 10;
      const bLast = problem.b % 10;
      assert.equal([0, 2, 4, 6, 8].includes(aLast), true, `Factor a last digit ${aLast} must be even`);
      assert.equal([0, 2, 4, 6, 8].includes(bLast), true, `Factor b last digit ${bLast} must be even`);
    }
  }
});

test('Keypad Input Logic: digits, backspace, clear', () => {
  let input = '';
  
  function appendDigit(val) {
    if (input.length >= 6) return input; // max product length limit (e.g. 98*98 = 9604, 4 digits)
    if (input === '0' && val === '0') return input;
    if (input === '0' && val !== '0') {
      input = val;
    } else {
      input += val;
    }
    return input;
  }

  function backspace() {
    input = input.slice(0, -1);
    return input;
  }

  function clear() {
    input = '';
    return input;
  }

  assert.equal(appendDigit('1'), '1');
  assert.equal(appendDigit('2'), '12');
  assert.equal(appendDigit('0'), '120');
  assert.equal(appendDigit('0'), '1200');
  assert.equal(backspace(), '120');
  assert.equal(appendDigit('5'), '1205');
  assert.equal(clear(), '');
});

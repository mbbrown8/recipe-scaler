import { test } from 'node:test'
import assert from 'node:assert/strict'
import { decimalToFraction, formatFraction } from './fractions.js'

test('exact half prefers the coarser denominator over an equal finer one', () => {
  // 1/2 and 2/4 are numerically identical; 1/2 is the useful answer.
  assert.deepEqual(decimalToFraction(0.5), { whole: 0, numerator: 1, denominator: 2 })
})

test('thirds and sixths round to themselves instead of the nearest eighth', () => {
  assert.deepEqual(decimalToFraction(1 / 3), { whole: 0, numerator: 1, denominator: 3 })
  assert.deepEqual(decimalToFraction(2 / 3), { whole: 0, numerator: 2, denominator: 3 })
  assert.deepEqual(decimalToFraction(5 / 6), { whole: 0, numerator: 5, denominator: 6 })
})

test('eighths round correctly when no coarser denominator fits better', () => {
  assert.deepEqual(decimalToFraction(0.125), { whole: 0, numerator: 1, denominator: 8 })
  assert.deepEqual(decimalToFraction(3.375), { whole: 3, numerator: 3, denominator: 8 })
})

test('a remainder within floating point noise of zero collapses to a whole number', () => {
  assert.deepEqual(decimalToFraction(3 + 1e-10), { whole: 3, numerator: 0, denominator: 1 })
})

test('a remainder within floating point noise of one rounds up to the next whole number', () => {
  assert.deepEqual(decimalToFraction(2.999999999999), { whole: 3, numerator: 0, denominator: 1 })
})

test('an exact whole number needs no fraction part', () => {
  assert.deepEqual(decimalToFraction(4), { whole: 4, numerator: 0, denominator: 1 })
})

test('zero is a whole number, not a fraction with a zero numerator error', () => {
  assert.deepEqual(decimalToFraction(0), { whole: 0, numerator: 0, denominator: 1 })
})

test('a restricted denominator list rounds to the closest option it allows, even if coarse', () => {
  // Only whole units available: 0.6 is closer to 1 than to 0.
  assert.deepEqual(decimalToFraction(0.6, [1]), { whole: 1, numerator: 0, denominator: 1 })
})

test('rejects negative and non-finite input', () => {
  assert.throws(() => decimalToFraction(-0.5), RangeError)
  assert.throws(() => decimalToFraction(NaN), RangeError)
  assert.throws(() => decimalToFraction(Infinity), RangeError)
})

test('formatFraction renders whole, fraction-only, and mixed values', () => {
  assert.equal(formatFraction({ whole: 3, numerator: 0, denominator: 1 }), '3')
  assert.equal(formatFraction({ whole: 0, numerator: 1, denominator: 2 }), '1/2')
  assert.equal(formatFraction({ whole: 2, numerator: 1, denominator: 3 }), '2 1/3')
})

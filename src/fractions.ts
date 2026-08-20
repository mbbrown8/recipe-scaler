// Converting decimals to fractions is where scaled recipes tend to go wrong:
// 0.333... cups is technically correct and useless at the counter. Everything
// here is built to answer "what's the nearest thing I could actually measure".

export interface Fraction {
  whole: number
  numerator: number
  denominator: number
}

// Denominators a kitchen measuring set can actually produce. 8ths cover
// tablespoons and cups, 3rds and 6ths cover the common "a third of a cup"
// case that 8ths alone approximate poorly.
const KITCHEN_DENOMINATORS = [2, 3, 4, 6, 8]

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const remainder = x % y
    x = y
    y = remainder
  }
  return x
}

/**
 * Finds the closest fraction to `value` using only the given denominators.
 * Ties and near-ties favor the coarser (smaller) denominator, since "1/2"
 * is a more useful answer than "4/8" even though they're equal.
 */
export function decimalToFraction(
  value: number,
  denominators: readonly number[] = KITCHEN_DENOMINATORS,
): Fraction {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`decimalToFraction expects a finite, non-negative number, got ${value}`)
  }

  const whole = Math.floor(value)
  const remainder = value - whole

  if (remainder < 1e-9) {
    return { whole, numerator: 0, denominator: 1 }
  }

  let bestNumerator = 0
  let bestDenominator = 1
  let bestError = remainder

  for (const denominator of denominators) {
    const numerator = Math.round(remainder * denominator)
    const approximation = numerator / denominator
    const error = Math.abs(approximation - remainder)

    if (error < bestError - 1e-9) {
      bestError = error
      bestNumerator = numerator
      bestDenominator = denominator
    }
  }

  if (bestNumerator === 0) {
    return { whole, numerator: 0, denominator: 1 }
  }

  if (bestNumerator === bestDenominator) {
    return { whole: whole + 1, numerator: 0, denominator: 1 }
  }

  const divisor = gcd(bestNumerator, bestDenominator)
  return {
    whole,
    numerator: bestNumerator / divisor,
    denominator: bestDenominator / divisor,
  }
}

export function formatFraction(fraction: Fraction): string {
  const { whole, numerator, denominator } = fraction

  if (numerator === 0) {
    return String(whole)
  }

  const fractionPart = `${numerator}/${denominator}`
  return whole === 0 ? fractionPart : `${whole} ${fractionPart}`
}

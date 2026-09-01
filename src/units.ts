// Volume and weight are different physical quantities, not just different
// scales of the same thing: a cup of flour and a cup of water don't weigh
// the same. Conversions within a category (cup -> tbsp, g -> oz) are exact
// ratios. Conversions across categories need an ingredient's density, so
// those require the caller to supply one instead of us guessing.

export type UnitCategory = 'volume' | 'weight'

interface UnitDefinition {
  category: UnitCategory
  // how many base units (ml for volume, g for weight) one of this unit is
  toBase: number
}

// US customary volumes, since that's what most home recipes are written in.
const UNITS: Record<string, UnitDefinition> = {
  ml: { category: 'volume', toBase: 1 },
  l: { category: 'volume', toBase: 1000 },
  tsp: { category: 'volume', toBase: 4.92892 },
  tbsp: { category: 'volume', toBase: 14.7868 },
  floz: { category: 'volume', toBase: 29.5735 },
  cup: { category: 'volume', toBase: 236.588 },
  pint: { category: 'volume', toBase: 473.176 },
  quart: { category: 'volume', toBase: 946.353 },
  gallon: { category: 'volume', toBase: 3785.41 },
  g: { category: 'weight', toBase: 1 },
  kg: { category: 'weight', toBase: 1000 },
  oz: { category: 'weight', toBase: 28.3495 },
  lb: { category: 'weight', toBase: 453.592 },
}

// Spellings a recipe might use in place of the canonical key above.
const ALIASES: Record<string, string> = {
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tsps: 'tsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tbsps: 'tbsp',
  'fluid ounce': 'floz',
  'fluid ounces': 'floz',
  'fl oz': 'floz',
  cups: 'cup',
  pints: 'pint',
  quarts: 'quart',
  gallons: 'gallon',
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  ounce: 'oz',
  ounces: 'oz',
  pound: 'lb',
  pounds: 'lb',
  lbs: 'lb',
}

/** Maps a spelling variant (plural, alias, mixed case) to its canonical unit key. */
export function normalizeUnit(unit: string): string {
  const key = unit.trim().toLowerCase()
  return ALIASES[key] ?? key
}

/** Returns the unit's category, or undefined if the unit isn't recognized. */
export function unitCategory(unit: string): UnitCategory | undefined {
  return UNITS[normalizeUnit(unit)]?.category
}

export interface ConvertUnitOptions {
  // grams per milliliter of the ingredient being measured; required only
  // when fromUnit and toUnit aren't in the same category
  densityGramsPerMl?: number
}

/**
 * Converts a quantity from one unit to another. Same-category conversions
 * (cup -> tbsp, kg -> oz) work with no extra input. Crossing volume and
 * weight (cup -> g) requires `densityGramsPerMl`, since that ratio depends
 * on the ingredient, not the units.
 */
export function convertUnit(
  quantity: number,
  fromUnit: string,
  toUnit: string,
  options: ConvertUnitOptions = {},
): number {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new RangeError(`convertUnit expects a finite, non-negative quantity, got ${quantity}`)
  }

  const from = UNITS[normalizeUnit(fromUnit)]
  const to = UNITS[normalizeUnit(toUnit)]

  if (!from) {
    throw new RangeError(`unknown unit: ${fromUnit}`)
  }
  if (!to) {
    throw new RangeError(`unknown unit: ${toUnit}`)
  }

  if (from.category === to.category) {
    return (quantity * from.toBase) / to.toBase
  }

  const { densityGramsPerMl } = options
  if (densityGramsPerMl === undefined) {
    throw new RangeError(
      `converting ${fromUnit} to ${toUnit} crosses volume and weight; pass densityGramsPerMl`,
    )
  }
  if (!Number.isFinite(densityGramsPerMl) || densityGramsPerMl <= 0) {
    throw new RangeError(`densityGramsPerMl must be a positive number, got ${densityGramsPerMl}`)
  }

  const grams = from.category === 'volume' ? quantity * from.toBase * densityGramsPerMl : quantity * from.toBase

  return to.category === 'weight' ? grams / to.toBase : grams / densityGramsPerMl / to.toBase
}

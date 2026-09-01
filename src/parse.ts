// Recipe lines are written for humans, not parsers: "1 1/2 cups flour",
// "3 eggs", "1/4 tsp salt", "2 fl oz vodka". This turns that free text into
// the Ingredient shape the rest of the library works with. Anything without
// a recognized unit word falls back to 'whole' rather than failing, since
// "3 eggs" and "2 lemons" are as common as measured ingredients.

import type { Ingredient } from './scale.js'
import { normalizeUnit, unitCategory } from './units.js'

// Common vulgar fraction characters, since printed and copy-pasted recipes
// use them more often than "1/2".
const UNICODE_FRACTIONS: Record<string, number> = {
  '¼': 1 / 4,
  '½': 1 / 2,
  '¾': 3 / 4,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅕': 1 / 5,
  '⅖': 2 / 5,
  '⅗': 3 / 5,
  '⅘': 4 / 5,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 1 / 8,
  '⅜': 3 / 8,
  '⅝': 5 / 8,
  '⅞': 7 / 8,
}

const UNICODE_FRACTION_CLASS = `[${Object.keys(UNICODE_FRACTIONS).join('')}]`
const MIXED_UNICODE_FRACTION = new RegExp(`^(\\d+)\\s+(${UNICODE_FRACTION_CLASS})`)
const UNICODE_FRACTION_ALONE = new RegExp(`^(${UNICODE_FRACTION_CLASS})`)
const MIXED_ASCII_FRACTION = /^(\d+)\s+(\d+)\/(\d+)/
const ASCII_FRACTION = /^(\d+)\/(\d+)/
const PLAIN_NUMBER = /^(\d+(?:\.\d+)?)/

interface LeadingQuantity {
  value: number
  length: number
}

/** Reads the quantity token(s) at the start of a line, in longest-match-first order. */
function parseLeadingQuantity(text: string): LeadingQuantity | undefined {
  let match = MIXED_UNICODE_FRACTION.exec(text)
  if (match) {
    const whole = Number(match[1])
    const fraction = UNICODE_FRACTIONS[match[2]!]!
    return { value: whole + fraction, length: match[0].length }
  }

  match = MIXED_ASCII_FRACTION.exec(text)
  if (match) {
    const whole = Number(match[1])
    const numerator = Number(match[2])
    const denominator = Number(match[3])
    return { value: whole + numerator / denominator, length: match[0].length }
  }

  match = ASCII_FRACTION.exec(text)
  if (match) {
    const numerator = Number(match[1])
    const denominator = Number(match[2])
    return { value: numerator / denominator, length: match[0].length }
  }

  match = UNICODE_FRACTION_ALONE.exec(text)
  if (match) {
    return { value: UNICODE_FRACTIONS[match[1]!]!, length: match[0].length }
  }

  match = PLAIN_NUMBER.exec(text)
  if (match) {
    return { value: Number(match[1]), length: match[0].length }
  }

  return undefined
}

/**
 * Parses one free-text recipe line into an Ingredient, e.g.
 * "1 1/2 cups flour" -> { name: 'flour', quantity: 1.5, unit: 'cup' }.
 * Throws if the line doesn't start with a quantity or has no name left over.
 * A quantity with no recognized unit word (e.g. "3 eggs") gets unit 'whole'.
 */
export function parseIngredientLine(line: string): Ingredient {
  const trimmed = line.trim()
  if (trimmed.length === 0) {
    throw new RangeError('parseIngredientLine expects a non-empty line')
  }

  const quantity = parseLeadingQuantity(trimmed)
  if (!quantity) {
    throw new RangeError(`could not find a quantity at the start of: "${line}"`)
  }

  const rest = trimmed.slice(quantity.length).trim()
  if (rest.length === 0) {
    throw new RangeError(`missing ingredient name in: "${line}"`)
  }

  const words = rest.split(/\s+/)
  const firstWord = words[0]
  const secondWord = words[1]
  const twoWordUnit = secondWord !== undefined ? `${firstWord} ${secondWord}` : undefined

  let unit: string
  let nameWords: string[]

  if (twoWordUnit !== undefined && unitCategory(twoWordUnit) !== undefined) {
    unit = normalizeUnit(twoWordUnit)
    nameWords = words.slice(2)
  } else if (firstWord !== undefined && unitCategory(firstWord) !== undefined) {
    unit = normalizeUnit(firstWord)
    nameWords = words.slice(1)
  } else {
    unit = 'whole'
    nameWords = words
  }

  const name = nameWords.join(' ').trim()
  if (name.length === 0) {
    throw new RangeError(`missing ingredient name in: "${line}"`)
  }

  return { name, quantity: quantity.value, unit }
}

// Only ingredients counted as whole items ("egg", "onion") need pluralizing;
// this isn't a general-purpose English pluralizer, just enough for the nouns
// that show up in ingredient lists.

const IRREGULAR_PLURALS: Record<string, string> = {
  tomato: 'tomatoes',
  potato: 'potatoes',
  leaf: 'leaves',
  loaf: 'loaves',
  half: 'halves',
  shelf: 'shelves',
  knife: 'knives',
  life: 'lives',
  cactus: 'cacti',
  fungus: 'fungi',
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u'])

/**
 * Pluralizes an ingredient name, e.g. "egg" -> "eggs", "tomato" -> "tomatoes",
 * "cherry" -> "cherries". Multi-word names only pluralize the last word
 * ("green onion" -> "green onions"), since that's the noun being counted.
 */
export function pluralize(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return trimmed
  }

  const lastSpace = trimmed.lastIndexOf(' ')
  if (lastSpace === -1) {
    return pluralizeWord(trimmed)
  }

  return `${trimmed.slice(0, lastSpace)} ${pluralizeWord(trimmed.slice(lastSpace + 1))}`
}

function pluralizeWord(word: string): string {
  const lower = word.toLowerCase()

  const irregular = IRREGULAR_PLURALS[lower]
  if (irregular) {
    return applyCase(word, irregular)
  }

  if (/(?:s|x|z|ch|sh)$/.test(lower)) {
    return `${word}es`
  }

  if (lower.endsWith('y') && word.length > 1 && !VOWELS.has(lower[lower.length - 2]!)) {
    return `${word.slice(0, -1)}ies`
  }

  if (lower.endsWith('fe')) {
    return `${word.slice(0, -2)}ves`
  }

  return `${word}s`
}

/** Matches the capitalization style of `original` (all-caps or capitalized) on `pluralLower`. */
function applyCase(original: string, pluralLower: string): string {
  if (original.length > 1 && original === original.toUpperCase()) {
    return pluralLower.toUpperCase()
  }
  if (original[0] === original[0]?.toUpperCase()) {
    return pluralLower[0]!.toUpperCase() + pluralLower.slice(1)
  }
  return pluralLower
}

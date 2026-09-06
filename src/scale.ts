import { decimalToFraction, formatFraction } from './fractions.js'

export interface Ingredient {
  name: string
  quantity: number
  unit: string
}

export interface Recipe {
  name: string
  servings: number
  ingredients: Ingredient[]
}

/**
 * Scales a single numeric quantity from one serving count to another.
 * This is the one place the actual math happens; everything else in this
 * file is just this ratio applied to a shape (an ingredient, a recipe).
 */
export function scaleQuantity(quantity: number, fromServings: number, toServings: number): number {
  if (fromServings <= 0 || toServings <= 0) {
    throw new RangeError('servings must be a positive number')
  }
  if (quantity < 0) {
    throw new RangeError('quantity must not be negative')
  }
  return (quantity * toServings) / fromServings
}

export function scaleIngredient(
  ingredient: Ingredient,
  fromServings: number,
  toServings: number,
): Ingredient {
  return {
    ...ingredient,
    quantity: scaleQuantity(ingredient.quantity, fromServings, toServings),
  }
}

/**
 * Returns a new recipe scaled to `toServings`. The input recipe is never
 * mutated, so callers can keep the original around (e.g. to scale it again
 * to a different target) without cloning it themselves.
 */
export function scaleRecipe(recipe: Recipe, toServings: number): Recipe {
  return {
    ...recipe,
    servings: toServings,
    ingredients: recipe.ingredients.map((ingredient) =>
      scaleIngredient(ingredient, recipe.servings, toServings),
    ),
  }
}

/**
 * Scales a recipe so that one named ingredient ends up at `targetQuantity`,
 * instead of specifying a target serving count. Useful when you're working
 * backward from what's on hand ("I've got 3 eggs, how much flour do I need")
 * rather than from how many people you're feeding.
 *
 * The match is case-insensitive but otherwise exact, since guessing that
 * "egg" means "eggs" is exactly the kind of thing that's wrong the one time
 * it matters. If more than one ingredient shares the name, the first is used.
 */
export function scaleRecipeToIngredientAmount(
  recipe: Recipe,
  ingredientName: string,
  targetQuantity: number,
): Recipe {
  if (!Number.isFinite(targetQuantity) || targetQuantity < 0) {
    throw new RangeError(`targetQuantity must be a finite, non-negative number, got ${targetQuantity}`)
  }

  const needle = ingredientName.trim().toLowerCase()
  const match = recipe.ingredients.find((ingredient) => ingredient.name.toLowerCase() === needle)
  if (!match) {
    throw new RangeError(`no ingredient named "${ingredientName}" in recipe "${recipe.name}"`)
  }
  if (match.quantity <= 0) {
    throw new RangeError(`cannot scale from "${ingredientName}", which has a zero quantity`)
  }

  const ratio = targetQuantity / match.quantity
  return scaleRecipe(recipe, recipe.servings * ratio)
}

/**
 * Renders a quantity the way it would appear on a written recipe, e.g.
 * 0.333 -> "1/3", 2.5 -> "2 1/2". Pass a custom denominator set for units
 * that aren't measured in eighths (a kitchen scale in grams, say, doesn't
 * need this at all and should just use toFixed).
 */
export function formatQuantity(quantity: number, denominators?: readonly number[]): string {
  return formatFraction(decimalToFraction(quantity, denominators))
}

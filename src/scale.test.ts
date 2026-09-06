import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scaleQuantity, scaleRecipe, scaleRecipeToIngredientAmount } from './scale.js'
import type { Recipe } from './scale.js'

test('scaleQuantity applies the toServings/fromServings ratio', () => {
  assert.equal(scaleQuantity(2, 4, 10), 5)
  assert.equal(scaleQuantity(0, 4, 10), 0)
})

test('scaleQuantity rejects non-positive servings and negative quantities', () => {
  assert.throws(() => scaleQuantity(1, 0, 4), RangeError)
  assert.throws(() => scaleQuantity(1, 4, -1), RangeError)
  assert.throws(() => scaleQuantity(-1, 4, 4), RangeError)
})

const pancakes: Recipe = {
  name: 'Pancakes',
  servings: 4,
  ingredients: [
    { name: 'flour', quantity: 1.5, unit: 'cup' },
    { name: 'sugar', quantity: 2, unit: 'tbsp' },
    { name: 'Egg', quantity: 2, unit: 'whole' },
  ],
}

test('scaleRecipe scales every ingredient by the same servings ratio', () => {
  const scaled = scaleRecipe(pancakes, 10)
  assert.equal(scaled.servings, 10)
  assert.equal(scaled.ingredients[0]!.quantity, 3.75)
  assert.equal(scaled.ingredients[1]!.quantity, 5)
  assert.equal(scaled.ingredients[2]!.quantity, 5)
  assert.equal(pancakes.servings, 4, 'original recipe is left untouched')
})

test('scaleRecipeToIngredientAmount derives the ratio from a named ingredient', () => {
  const scaled = scaleRecipeToIngredientAmount(pancakes, 'egg', 5)
  assert.equal(scaled.ingredients[2]!.quantity, 5)
  assert.equal(scaled.ingredients[0]!.quantity, 3.75)
  assert.equal(scaled.servings, 10)
})

test('scaleRecipeToIngredientAmount matches ingredient names case-insensitively', () => {
  const scaled = scaleRecipeToIngredientAmount(pancakes, 'EGG', 1)
  assert.equal(scaled.ingredients[2]!.quantity, 1)
})

test('scaleRecipeToIngredientAmount throws for an unknown ingredient name', () => {
  assert.throws(() => scaleRecipeToIngredientAmount(pancakes, 'butter', 1), RangeError)
})

test('scaleRecipeToIngredientAmount throws for a negative or non-finite target', () => {
  assert.throws(() => scaleRecipeToIngredientAmount(pancakes, 'egg', -1), RangeError)
  assert.throws(() => scaleRecipeToIngredientAmount(pancakes, 'egg', NaN), RangeError)
})

test('scaleRecipeToIngredientAmount throws when scaling from a zero quantity', () => {
  const zeroed: Recipe = {
    ...pancakes,
    ingredients: [{ name: 'egg', quantity: 0, unit: 'whole' }],
  }
  assert.throws(() => scaleRecipeToIngredientAmount(zeroed, 'egg', 5), RangeError)
})

# recipe-scaler

A recipe written for 4 servings doesn't scale cleanly to 6 or to 10. The math
is trivial (multiply by a ratio) but the output usually isn't: 2/3 cup times
1.5 is 1 cup, but times 1.75 it's 1.1666... cups, which nobody wants to see
on a shopping list. This library does the ratio math and then converts the
result back into a fraction you'd actually use with measuring cups.

Every exported function is pure: no shared state, no I/O, same input always
produces the same output. Recipes and ingredients are never mutated - scaling
one returns a new object.

## Install

No package is published yet. Copy `src/` into your project or add this repo
as a git dependency once it has a tag.

## Usage

```ts
import { scaleRecipe, formatQuantity } from './src/index.js'

const pancakes = {
  name: 'Pancakes',
  servings: 4,
  ingredients: [
    { name: 'flour', quantity: 1.5, unit: 'cup' },
    { name: 'sugar', quantity: 2, unit: 'tbsp' },
    { name: 'milk', quantity: 1.25, unit: 'cup' },
    { name: 'egg', quantity: 1, unit: 'whole' },
  ],
}

const forTen = scaleRecipe(pancakes, 10)

for (const ingredient of forTen.ingredients) {
  console.log(`${formatQuantity(ingredient.quantity)} ${ingredient.unit} ${ingredient.name}`)
}
// 3 3/4 cup flour
// 5 tbsp sugar
// 3 1/8 cup milk
// 2 1/2 whole egg
```

`scaleRecipe` and `scaleIngredient` return new objects; `formatQuantity` turns
a scaled decimal (like `3.125`) into the fraction a person would actually
measure out (`"3 1/8"`), rounding to the nearest eighth, sixth, quarter,
third, or half - whichever is closest.

If you need a different rounding granularity (a scale that only reads whole
grams, say), pass your own denominator list:

```ts
formatQuantity(0.6, [1]) // "1"
```

## API

- `scaleQuantity(quantity, fromServings, toServings)` - scales a single number by the servings ratio.
- `scaleIngredient(ingredient, fromServings, toServings)` - scales one ingredient's quantity.
- `scaleRecipe(recipe, toServings)` - scales every ingredient in a recipe using its current `servings`.
- `decimalToFraction(value, denominators?)` - converts a decimal to the closest `{ whole, numerator, denominator }`.
- `formatQuantity(quantity, denominators?)` / `formatFraction(fraction)` - render a quantity or fraction as a string.
- `convertUnit(quantity, fromUnit, toUnit, options?)` - converts between volume units (tsp, tbsp, floz, cup, pint, quart, gallon, ml, l) or between weight units (g, kg, oz, lb).
- `unitCategory(unit)` - returns `'volume'` or `'weight'` for a recognized unit, or `undefined`.
- `normalizeUnit(unit)` - maps a spelling variant ("tablespoons", "Tbsp") to its canonical key ("tbsp").
- `parseIngredientLine(line)` - parses one free-text recipe line into an `Ingredient`.

Converting within a category is exact and needs nothing extra:

```ts
convertUnit(1.5, 'cup', 'tbsp') // 24
convertUnit(500, 'g', 'lb')     // 1.1023...
```

Converting between volume and weight depends on the ingredient (a cup of
flour and a cup of water don't weigh the same), so it takes an explicit
density in grams per milliliter:

```ts
convertUnit(1, 'cup', 'g', { densityGramsPerMl: 0.53 }) // ~125g of flour
convertUnit(1, 'cup', 'g') // throws - no density given
```

Parsing turns a recipe line into the same shape `scaleIngredient` expects:

```ts
import { parseIngredientLine } from './src/index.js'

parseIngredientLine('1 1/2 cups flour')
// { name: 'flour', quantity: 1.5, unit: 'cup' }

parseIngredientLine('3 eggs')
// { name: 'eggs', quantity: 3, unit: 'whole' }
```

It accepts whole numbers, decimals, ASCII fractions ("1/2", "1 1/2"), and
unicode vulgar fractions ("½", "1 ½"). A quantity with no recognized unit
word falls back to `'whole'` instead of failing, since "3 eggs" is at least
as common as a measured ingredient.

## Status

Scaling, fraction formatting, unit conversion, and free-text ingredient
parsing work, with rounding-edge-case tests for fraction formatting.
Scaling by a target ingredient amount instead of servings, and pluralizing
scaled ingredient names, don't exist yet.

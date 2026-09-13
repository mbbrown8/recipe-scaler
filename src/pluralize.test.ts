import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pluralize } from './pluralize.js'

test('pluralize adds s for regular nouns', () => {
  assert.equal(pluralize('egg'), 'eggs')
  assert.equal(pluralize('onion'), 'onions')
})

test('pluralize adds es after s, x, z, ch, sh', () => {
  assert.equal(pluralize('box'), 'boxes')
  assert.equal(pluralize('squash'), 'squashes')
  assert.equal(pluralize('peach'), 'peaches')
})

test('pluralize turns a trailing consonant + y into ies', () => {
  assert.equal(pluralize('cherry'), 'cherries')
  assert.equal(pluralize('strawberry'), 'strawberries')
})

test('pluralize leaves a trailing vowel + y alone', () => {
  assert.equal(pluralize('bay leaf'), 'bay leaves')
  assert.equal(pluralize('turkey'), 'turkeys')
})

test('pluralize uses irregular plurals when known', () => {
  assert.equal(pluralize('tomato'), 'tomatoes')
  assert.equal(pluralize('potato'), 'potatoes')
  assert.equal(pluralize('leaf'), 'leaves')
})

test('pluralize only changes the last word of a multi-word name', () => {
  assert.equal(pluralize('green onion'), 'green onions')
  assert.equal(pluralize('roma tomato'), 'roma tomatoes')
})

test('pluralize preserves capitalization style', () => {
  assert.equal(pluralize('Egg'), 'Eggs')
  assert.equal(pluralize('EGG'), 'EGGS')
  assert.equal(pluralize('Tomato'), 'Tomatoes')
})

test('pluralize returns an empty string unchanged', () => {
  assert.equal(pluralize(''), '')
  assert.equal(pluralize('   '), '')
})

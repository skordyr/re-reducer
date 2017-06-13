# re-reducer
[![badge:travis]][build-status]
[![badge:coveralls]][coverage-status]
[![badge:npm-version]][npm-re-reducer]
[![badge:npm-downloads]][npm-re-reducer]
[![badge:issues]][issues]
[![badge:license]][license]

a helper for create Flux Standard Action reducer

## Installation
To install the stable version:
```bash
npm install re-reducer --save
```
or
```
yarn add re-reducer
```

## Usage
```js

import { createReducer } from 're-reducer'

function handleIncrement (next) {
  return (state, action) => {
    const {
      payload,
      meta: {
        type
      } = {}
    } = action
    return type === 'increment' ? state + payload : next(state, action)
  }
}

function handleDecrement (next) {
  return (state, action) => {
    const {
      payload,
      meta: {
        type
      } = {}
    } = action
    return type === 'decrement' ? state - payload : next(state, action)
  }
}

const initialState = 1

const counterReducer = createReducer({
  prefix: 'counter',
  initialState
})

const {
  register
} = counterReducer

const change = register(
  'change',
  handleIncrement(handleDecrement((state, action) => {
    const {
      payload
    } = action
    return payload
  })),
  next => (payload, type) => next(
    payload,
    {
      meta: {
        type
      }
    }
  )
)

let nextState

nextState = counterReducer(initialState, change(10))
console.log('state change from %s to %s.', initialState, nextState)
// state change from 1 to 10.

nextState = counterReducer(initialState, change(10, 'increment'))
console.log('state increment from %s to %s.', initialState, nextState)
// state increment from 1 to 11.

nextState = counterReducer(initialState, change(10, 'decrement'))
console.log('state decrement from %s to %s.', initialState, nextState)
// state decrement from 1 to -9.

```

## Examples
+ [counter][example:counter]

[badge:issues]: https://img.shields.io/github/issues/skordyr/re-reducer.svg "Issues"
[badge:license]: https://img.shields.io/badge/license-MIT-blue.svg "License"
[badge:travis]: https://img.shields.io/travis/skordyr/re-reducer.svg "Build Status"
[badge:coveralls]: https://img.shields.io/coveralls/skordyr/re-reducer.svg "Coverage Status"
[badge:npm-version]: https://img.shields.io/npm/v/re-reducer.svg "NPM Version"
[badge:npm-downloads]: https://img.shields.io/npm/dm/re-reducer.svg "NPM Downloads"

[issues]: https://github.com/skordyr/re-reducer/issues "Issues"
[license]: https://raw.githubusercontent.com/skordyr/re-reducer/master/LICENSE "License"
[build-status]: https://travis-ci.org/skordyr/re-reducer "Build Status"
[coverage-status]: https://coveralls.io/github/skordyr/re-reducer "Coverage Status"
[npm-re-reducer]: https://www.npmjs.com/package/re-reducer "re-reducer"

[example:counter]: examples/counter.js "Counter example"

# re-reducer

[![badge:travis]][build-status]
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

``` bash
yarn add re-reducer
```

## Usage

```js
import { createReducer, compose } from 're-reducer'

function change(state, action) {
  return action.payload
}

function increment(state, action) {
  return state + action.payload
}

function decrement(state, action) {
  return state - action.payload
}

function incrementEnhancer(next) {
  return (state, action) => {
    const {
      meta: {
        type
      } = {}
    } = action

    return type === 'increment' ? increment(state, action) : next(state, action)
  }
}

function decrementEnhancer(next) {
  return (state, action) => {
    const {
      meta: {
        type
      } = {}
    } = action

    return type === 'decrement' ? decrement(state, action) : next(state, action)
  }
}

const counterReducer = createReducer({
  namespace: 'counter',
  initialState: 0,
  handles: {
    change,
    increment,
    decrement
  },
  actionEnhancer(next) {
    return (payload, type) => {
      return next(payload, undefined, type && {type})
    }
  },
  handleEnhancer: compose(incrementEnhancer, decrementEnhancer)
})

const initialState = 1
let nextState

nextState = counterReducer(initialState, counterReducer.actions.change(10))
console.log('state change from %s to %s.', initialState, nextState)
// state change from 1 to 10.

nextState = counterReducer(initialState, counterReducer.actions.increment(10))
console.log('state increment from %s to %s.', initialState, nextState)
// state increment from 1 to 11.

nextState = counterReducer(initialState, counterReducer.actions.change(10, 'increment'))
console.log('state increment from %s to %s.', initialState, nextState)
// state increment from 1 to 11.

nextState = counterReducer(initialState, counterReducer.actions.decrement(10))
console.log('state decrement from %s to %s.', initialState, nextState)
// state decrement from 1 to -9.

nextState = counterReducer(initialState, counterReducer.actions.change(10, 'decrement'))
console.log('state decrement from %s to %s.', initialState, nextState)
// state decrement from 1 to -9.
```

[badge:issues]: https://img.shields.io/github/issues/skordyr/re-reducer.svg "Issues"
[badge:license]: https://img.shields.io/badge/license-MIT-blue.svg "License"
[badge:travis]: https://img.shields.io/travis/skordyr/re-reducer.svg "Build Status"
[badge:npm-version]: https://img.shields.io/npm/v/re-reducer.svg "NPM Version"
[badge:npm-downloads]: https://img.shields.io/npm/dm/re-reducer.svg "NPM Downloads"

[issues]: https://github.com/skordyr/re-reducer/issues "Issues"
[license]: https://raw.githubusercontent.com/skordyr/re-reducer/master/LICENSE "License"
[build-status]: https://travis-ci.org/skordyr/re-reducer "Build Status"
[coverage-status]: https://coveralls.io/github/skordyr/re-reducer "Coverage Status"
[npm-re-reducer]: https://www.npmjs.com/package/re-reducer "re-reducer"

[example:counter]: examples/counter.js "Counter example"

# re-reducer
[![ci:build-status-img]][ci:build-status-link] [![ci:coverage-status-img]][ci:coverage-status-link]

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

[ci:build-status-img]: https://travis-ci.org/skordyr/re-reducer.svg?branch=master "Build Status"
[ci:build-status-link]: https://travis-ci.org/skordyr/re-reducer "re-reducer build status"
[ci:coverage-status-img]: https://coveralls.io/repos/github/skordyr/re-reducer/badge.svg?branch=master "Coverage Status"
[ci:coverage-status-link]: https://coveralls.io/github/skordyr/re-reducer?branch=master "re-reducer coverage status"
[example:counter]: examples/counter.js "Counter example"

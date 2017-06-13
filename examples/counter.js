/* eslint-disable no-console, import/no-unresolved, import/extensions */

import {
  createReducer
} from '..'

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

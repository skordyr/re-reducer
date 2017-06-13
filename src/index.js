/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments to provide
 * information about what broke and what you were expecting.
 *
 * The invariant message will be stripped in production, but the invariant will
 * remain to ensure logic does not differ in production.
 *
 * @param {any} condition
 * @param {string} format
 * @param {Array<any>} args
 * @returns {void}
 */

export function invariant (condition, format, ...args) {
  if (process.env.NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant(...): Second argument must be a string.')
    }
  }
  if (!condition) {
    let error
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      )
    } else {
      let lastIndex = 0
      error = new Error(format.replace(/%s/g, () => String(args[lastIndex++])))
      error.name = 'Invariant Violation'
    }
    error.framesToPop = 1
    throw error
  }
}

/**
 * @param {function:object} next
 * @returns {function:object}
 */
export function pendingActionEnhancer (next) {
  invariant(
    typeof next === 'function',
    'next expected a function, instead received %s.',
    next
  )

  return (payload, extra = {}) => {
    invariant(
      typeof extra === 'object' && extra !== null,
      'extra expected a object, instead received %s.',
      extra
    )

    const {
      meta
    } = extra
    return next(payload, {
      ...extra,
      meta: {
        ...meta,
        pending: true
      }
    })
  }
}

/**
 * @param {function:object} next
 * @returns {function:object}
 */
export function errorActionEnhancer (next) {
  invariant(
    typeof next === 'function',
    'next expected a function, instead received %s.',
    next
  )

  return (payload, extra = {}) => {
    invariant(
      typeof extra === 'object' && extra !== null,
      'extra expected a object, instead received %s.',
      extra
    )

    return next(payload, {
      ...extra,
      error: true
    })
  }
}

/**
 * @param {string} type
 * @param {string|void} prefix
 * @returns {string}
 */
export function defaultGetActionType (type, prefix) {
  invariant(
    typeof type === 'string',
    'type expected a string, instead received %s.',
    type
  )

  return prefix === undefined ? type : `${prefix}/${type}`
}

/**
 * @param {string} type
 * @returns {function:object}
 */
export function defaultCreatActionCreator (type) {
  invariant(
    typeof type === 'string' || typeof type === 'number',
    'type expected a string or a number, instead received %s.',
    type
  )

  return (payload, extra) => ({
    ...extra,
    type,
    payload
  })
}

/**
 * @param {object} state
 * @param {object} action
 * @param {string} action.type
 * @param {any} action.payload
 * @param {boolean|void} action.error
 * @param {object|void} action.meta
 * @returns {object}
 */
export function defaultActionHandle (state, action) {
  invariant(
    typeof state === 'object' && state !== null,
    'state expected a object, instead received %s.',
    state
  )

  const {
    payload,
    error,
    meta: {
      pending: pendingMeta
    } = {}
  } = action
  const {
    pending: pendingState
  } = state
  const nextPendingState = pendingState === undefined
    ? {}
    : { pending: false }
  return error || pendingMeta
    ? state
    : {
      ...state,
      ...payload,
      ...nextPendingState
    }
}

/**
 * @param {object} [options={}]
 * @param {string|void} options.prefix
 * @param {any} [options.initialState={}]
 * @param {function:string} [options.getActionType=defaultGetActionType]
 * @param {function:object} [options.actionHandle=defaultActionHandle]
 * @param {function:function} [options.createActionCreator=defaultCreatActionCreator]
 * @param {function:function} [options.createPendingActionCreator=pendingActionEnhancer]
 * @param {function:function} [options.createErrorActionCreator=errorActionEnhancer]
 * @returns {function:any}
 */
export function createReducer (options = {}) {
  const {
    prefix,
    initialState = {},
    getActionType = defaultGetActionType,
    actionHandle = defaultActionHandle,
    createActionCreator = defaultCreatActionCreator,
    createPendingActionCreator = pendingActionEnhancer,
    createErrorActionCreator = errorActionEnhancer
  } = options

  invariant(
    typeof getActionType === 'function',
    'options.getActionType expected a function, instead received %s.',
    getActionType
  )

  invariant(
    typeof createActionCreator === 'function',
    'options.createActionCreator expected a function, instead received %s.',
    createActionCreator
  )

  invariant(
    typeof createPendingActionCreator === 'function',
    'options.createPendingActionCreator expected a function, instead received %s.',
    createPendingActionCreator
  )

  invariant(
    typeof createErrorActionCreator === 'function',
    'options.createErrorActionCreator expected a function, instead received %s.',
    createErrorActionCreator
  )

  invariant(
    typeof actionHandle === 'function',
    'options.actionHandle expected a function, instead received %s.',
    actionHandle
  )

  /**
   * @var {Object.<string, function>}
   */
  const _handles = {}

  /**
   * @param {any} state
   * @param {object} action
   * @param {string} action.type
   * @param {any} action.payload
   * @param {boolean|void} action.error
   * @param {object|void} action.meta
   * @returns {object}
   */
  function reducer (state = initialState, action) {
    const handle = _handles[action.type]
    return handle ? handle(state, action) : state
  }

  /**
   * @returns {Object.<string, function>}
   */
  function getHandles () {
    return _handles
  }

  /**
   * @param {string} type
   * @param {function:any} handle
   * @param {function:function|void} enhancer
   * @returns {function:object}
   */
  function register (type, handle = actionHandle, enhancer) {
    invariant(
      typeof type === 'string',
      'type expected a string, instead received %s.',
      type
    )

    invariant(
      typeof handle === 'function',
      'handle expected a function, instead received %s.',
      handle
    )

    invariant(
      !enhancer || typeof enhancer === 'function',
      'enhancer expected a function, instead received %s.',
      enhancer
    )

    const actionType = getActionType(type, prefix)
    _handles[actionType] = handle

    const _actionCreator = createActionCreator(actionType)
    const _pendingActionCreator = createPendingActionCreator(_actionCreator)
    const _errorActionCreator = createErrorActionCreator(_actionCreator)

    let actionCreator

    if (enhancer !== undefined) {
      actionCreator = enhancer(_actionCreator)

      invariant(
        typeof actionCreator === 'function',
        'enhancer expected a function return a function, instead returned %s.',
        actionCreator
      )

      actionCreator.pending = enhancer(_pendingActionCreator)
      actionCreator.error = enhancer(_errorActionCreator)
    } else {
      actionCreator = _actionCreator
      actionCreator.pending = _pendingActionCreator
      actionCreator.error = _errorActionCreator
    }

    actionCreator.type = type
    actionCreator.actionType = actionType

    return actionCreator
  }

  reducer.getHandles = getHandles
  reducer.register = register

  return reducer
}

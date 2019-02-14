const {
  hasOwnProperty,
} = Object

/**
 * @param  {...function} fns
 * @returns {function}
 */
export function compose(...fns) {
  return fns.reduce((composed, fn) => (...args) => composed(fn(...args)))
}

/**
 * @param {string} name
 * @param {string} namespace
 * @returns {string}
 */
export function simpleActionTypeFactory(name, namespace) {
  return `${namespace !== undefined ? `${namespace}/` : ''}${name}`
}

/**
 * @param {string} actionType
 * @returns {function}
 */
export function fluxStandardActionFactory(actionType) {
  /**
   * @param {any} payload
   * @param {boolean} error
   * @param {any} meta
   * @returns {object}
   */
  function action(payload, error, meta) {
    return {
      type: actionType,
      payload,
      ...error ? {
        error: true,
      } : {},
      ...meta !== undefined ? {
        meta,
      } : {},
    }
  }

  /**
   * @param {any} meta
   * @returns {object}
   */
  function pending(meta) {
    return action(undefined, undefined, {
      ...meta,
      pending: true,
    })
  }

  /**
   * @param {Error} err
   * @param {any} meta
   * @returns {object}
   */
  function error(err, meta) {
    return action(err, true, meta)
  }

  action.pending = pending
  action.error = error

  return action
}

/**
 * @param {function} next
 * @returns {function}
 */
export function fluxStandardActionHandleEnhancer(next) {
  return (state, action) => {
    const {
      payload,
      error,
      meta: {
        pending,
      } = {},
    } = action

    if (pending || error) {
      const usePending = state.pending !== undefined
      const useError = state.error !== undefined

      if (usePending || useError) {
        return pending ? {
          ...state,
          ...usePending ? {
            pending: true,
          } : {},
          ...useError ? {
            error: null,
          } : {},
        } : {
          ...state,
          ...usePending ? {
            pending: false,
          } : {},
          ...useError ? {
            error: payload,
          } : {},
        }
      }

      return state
    }

    return next(state, action)
  }
}

/**
 * @param {function} actionTypeFactory
 * @param {function} actionFactory
 * @returns {function}
 */
export function createReducerCreator(actionTypeFactory, actionFactory) {
  return (options = {}) => {
    const {
      namespace,
      initialState,
      handles = {},
      actionEnhancer,
      handleEnhancer,
    } = options

    const _handles = {}
    const _actions = {}

    /**
     * @param {any} state
     * @param {object} action
     * @returns {any}
     */
    function reducer(state = initialState, action) {
      const handle = _handles[action.type]

      return handle ? handle(state, action) : state
    }

    Object.defineProperty(reducer, 'namespace', {
      configurable: false,
      enumerable: true,
      get() {
        return namespace
      },
    })

    Object.defineProperty(reducer, 'initialState', {
      configurable: false,
      enumerable: true,
      get() {
        return initialState
      },
    })

    Object.defineProperty(reducer, 'handles', {
      configurable: false,
      enumerable: true,
      get() {
        return _handles
      },
    })

    Object.defineProperty(reducer, 'actions', {
      configurable: false,
      enumerable: true,
      get() {
        return _actions
      },
    })

    Object.entries(handles).forEach(([name, handle]) => {
      const actionType = actionTypeFactory(name, namespace)
      const action = actionFactory(actionType)

      action.actionName = name
      action.actionType = actionType
      /* eslint-disable no-param-reassign */
      handle.actionName = name
      handle.actionType = actionType
      /* eslint-enable no-param-reassign */

      const enhancedAction = actionEnhancer ? actionEnhancer(action) : action
      const enhancedHandle = handleEnhancer ? handleEnhancer(handle) : handle

      if (enhancedAction !== action) {
        Object.keys(action).forEach((key) => {
          if (!hasOwnProperty.call(enhancedAction, key)) {
            enhancedAction[key] = action[key]
          }
        })
      }

      if (enhancedHandle !== handle) {
        Object.keys(handle).forEach((key) => {
          if (!hasOwnProperty.call(enhancedHandle, key)) {
            enhancedHandle[key] = handle[key]
          }
        })
      }

      _actions[name] = enhancedAction
      _handles[actionType] = enhancedHandle
    })

    return reducer
  }
}

/**
 * @function
 * @param {any} state
 * @param {object} action
 * @returns {any}
 */
export const createReducer = createReducerCreator(
  simpleActionTypeFactory,
  fluxStandardActionFactory,
)

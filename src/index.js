const {
  hasOwnProperty,
} = Object

export function compose(...fns) {
  return fns.reduce((composed, fn) => (...args) => composed(fn(...args)))
}

export function simpleActionTypeFactory(name, namespace) {
  return `${namespace !== undefined ? `${namespace}/` : ''}${name}`
}

export function fluxStandardActionFactory(actionType) {
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

  function pending(meta) {
    return action(undefined, undefined, {
      ...meta,
      pending: true,
    })
  }

  function error(err, meta) {
    return action(err, true, meta)
  }

  action.pending = pending
  action.error = error

  return action
}

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

export const createReducer = createReducerCreator(
  simpleActionTypeFactory,
  fluxStandardActionFactory,
)

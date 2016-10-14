const { hasOwnProperty } = Object.prototype

export const isNumber = value => typeof value == 'number';

export const isString = value => typeof value == 'string';

export const isFunction = value => typeof value == 'function'

export const isArray = Array.isArray

export const isObject = value => {
  const type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

export const isEmpty = value => {
  if (isArray(value) || isString(value)) { return !value.length }

  for (let key in value) {
    if (hasOwnProperty.call(value, key)) {
      return false;
    }
  }
  return true;
}

export const first = value => value && value[0]
export const last = value => value && value.length && value[value.length-1]

export const each = (collection, iteratee) => {
  if (collection == null) { return collection }

  if (isArray(collection)) {
    let idx = -1
    let len = collection.length
    while (++idx < len) {
      if (iteratee(collection[idx], idx) === false) {
        break;
      }
    }
  } else if (isObject(collection)) {
    for (let key in collection) {
      if (hasOwnProperty.call(collection, key)) {
        if (iteratee(collection[key], key) === false) {
          break;
        }
      }
    }
  }

  return collection
}

export const map = (collection, iteratee) => {
  if (collection == null) { return collection }

  const results = []

  if (isArray(collection)) {
    let idx = -1
    let len = collection.length
    while (++idx < len) {
      results.push(iteratee(collection[idx], idx))
    }
  } else if (isObject(collection)) {
    for (let key in collection) {
      if (hasOwnProperty.call(collection, key)) {
        results.push(iteratee(collection[key], key))
      }
    }
  }

  return results
}

export const filter = (collection, params) => {
  const results = []

  if (isArray(collection)) {
    let idx = -1
    let len = collection.length
    while (++idx < len) {
      const value = collection[idx]
      let match = true
      for (let key in params) {
        if (hasOwnProperty.call(params, key) && (!hasOwnProperty.call(value, key) || value[key] != params[key])) {
          match = false
          break;
        }
      }

      if (match) {
        results.push(value)
      }
    }
  }

  return results
}

export const find = (collection, params) => {
  let result = undefined

  if (isArray(collection)) {
    let idx = -1
    let len = collection.length
    while (++idx < len) {
      const value = collection[idx]
      let match
      if (isFunction(params)) {
        const iteratee = params

        if (iteratee(value, idx)) {
          match = true;
        }
      } else if (isObject(params)) {
        for (let key in params) {
          match = true
          if (hasOwnProperty.call(params, key) && (!hasOwnProperty.call(value, key) || value[key] != params[key])) {
            match = false;
            break;
          }
        }
      }

      if (match) {
        result = value
        break;
      }
    }
  }

  return result
}

export const clone = (obj) => {
  const result = {}
  
  for (let key in obj) {
    if (hasOwnProperty.call(obj, key)) {
      result[key] = obj[key]
    }
  }

  return result
}

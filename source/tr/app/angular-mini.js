goog.provide('tr.app.AngularMini');

/**
 * Partial port of Angular functionality used by UrlMatcher (ported from UI Router).
 * This set of functions is intended to be gradually replaced once UrlMatcher and ApplicationRouter are more fully-tested.
 * @see https://github.com/angular/angular.js/blob/master/src/Angular.js
 */

/**
 * 
 */
tr.app.AngularMini.equals = function(o1, o2) {
  if (o1 === o2) return true;
  if (o1 === null || o2 === null) return false;
  if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
  var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
  if (t1 == t2) {
    if (t1 == 'object') {
      if (tr.app.AngularMini.isArray(o1)) {
        if (!tr.app.AngularMini.isArray(o2)) return false;
        if ((length = o1.length) == o2.length) {
          for (key = 0; key < length; key++) {
            if (!tr.app.AngularMini.equals(o1[key], o2[key])) return false;
          }
          return true;
        }
      } else if (isDate(o1)) {
        if (!isDate(o2)) return false;
        return tr.app.AngularMini.equals(o1.getTime(), o2.getTime());
      } else if (isRegExp(o1) && isRegExp(o2)) {
        return o1.toString() == o2.toString();
      } else {
        if (tr.app.AngularMini.isScope(o1) ||
            tr.app.AngularMini.isScope(o2) ||
            tr.app.AngularMini.isWindow(o1) ||
            tr.app.AngularMini.isWindow(o2) ||
            tr.app.AngularMini.isArray(o2)) return false;
        keySet = {};
        for (key in o1) {
          if (key.charAt(0) === '$' || tr.app.AngularMini.isFunction(o1[key])) continue;
          if (!tr.app.AngularMini.equals(o1[key], o2[key])) return false;
          keySet[key] = true;
        }
        for (key in o2) {
          if (!keySet.hasOwnProperty(key) &&
              key.charAt(0) !== '$' &&
              o2[key] !== undefined &&
              !tr.app.AngularMini.isFunction(o2[key])) return false;
        }
        return true;
      }
    }
  }
  return false;
}

/**
 * 
 */
tr.app.AngularMini.extend = function(dst) {
  var h = dst.$$hashKey;

  for (var i = 1, ii = arguments.length; i < ii; i++) {
    var obj = arguments[i];
    if (obj) {
      var keys = Object.keys(obj);
      for (var j = 0, jj = keys.length; j < jj; j++) {
        var key = keys[j];
        dst[key] = obj[key];
      }
    }
  }

  tr.app.AngularMini.setHashKey(dst, h);
  return dst;
}

/**
 * 
 */
tr.app.AngularMini.filter = function(collection, callback) {
  var array = tr.app.AngularMini.isArray(collection);
  var result = array ? [] : {};
  tr.app.AngularMini.forEach(collection, function(val, i) {
    if (callback(val, i)) {
      result[array ? result.length : i] = val;
    }
  });
  return result;
}

/**
 * 
 */
tr.app.AngularMini.forEach = function(obj, iterator, context) {
  var key, length;
  if (obj) {
    if (tr.app.AngularMini.isFunction(obj)) {
      for (key in obj) {
        // Need to check if hasOwnProperty exists,
        // as on IE8 the result of querySelectorAll is an object without a hasOwnProperty function
        if (key != 'prototype' && key != 'length' && key != 'name' && (!obj.hasOwnProperty || obj.hasOwnProperty(key))) {
          iterator.call(context, obj[key], key, obj);
        }
      }
    } else if (tr.app.AngularMini.isArray(obj) || tr.app.AngularMini.isArrayLike(obj)) {
      var isPrimitive = typeof obj !== 'object';
      for (key = 0, length = obj.length; key < length; key++) {
        if (isPrimitive || key in obj) {
          iterator.call(context, obj[key], key, obj);
        }
      }
    } else if (obj.forEach && obj.forEach !== forEach) {
        obj.forEach(iterator, context, obj);
    } else {
      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          iterator.call(context, obj[key], key, obj);
        }
      }
    }
  }
  return obj;
}

/**
 * 
 */
tr.app.AngularMini.fromJson = function(json) {
  return tr.app.AngularMini.isString(json)
      ? JSON.parse(json)
      : json;
}

/**
 * 
 */
tr.app.AngularMini.identity = function($) {
  return $;
}

/**
 * 
 */
tr.app.AngularMini.indexOf = function(array, value) {
  if (Array.prototype.indexOf) {
    return array.indexOf(value, Number(arguments[2]) || 0);
  }
  var len = array.length >>> 0, from = Number(arguments[2]) || 0;
  from = (from < 0) ? Math.ceil(from) : Math.floor(from);

  if (from < 0) from += len;

  for (; from < len; from++) {
    if (from in array && array[from] === value) return from;
  }
  return -1;
}

/**
 * 
 */
tr.app.AngularMini.inherit = function(parent, extra) {
  return tr.app.AngularMini.extend(Object.create(parent), extra);
}

/**
 * 
 */
tr.app.AngularMini.isArray = Array.isArray;

/**
 * 
 */
tr.app.AngularMini.NODE_TYPE_ELEMENT_ = 1;

/**
 * 
 */
tr.app.AngularMini.isArrayLike = function(obj) {
  if (obj == null || tr.app.AngularMini.isWindow(obj)) {
    return false;
  }

  var length = obj.length;

  if (obj.nodeType === tr.app.AngularMini.NODE_TYPE_ELEMENT_ && length) {
    return true;
  }

  return tr.app.AngularMini.isString(obj) || tr.app.AngularMini.isArray(obj) || length === 0 ||
         typeof length === 'number' && length > 0 && (length - 1) in obj;
}

/**
 * 
 */
tr.app.AngularMini.isDefined = function(value) {
  return typeof value !== 'undefined';
}

/**
 * 
 */
tr.app.AngularMini.isFunction = function(value) {
  return typeof value === 'function';
}

/**
 * 
 */
tr.app.AngularMini.isObject = function(value) {
  // http://jsperf.com/isobject4
  return value !== null && typeof value === 'object';
}

/**
 * 
 */
tr.app.AngularMini.isRegExp = function(value) {
  return toString.call(value) === '[object RegExp]';
}

/**
 * 
 */
tr.app.AngularMini.isScope = function(obj) {
  return obj && obj.$evalAsync && obj.$watch;
}

/**
 * 
 */
tr.app.AngularMini.isString = function(value) {
  return typeof value === 'string';
}

/**
 * 
 */
tr.app.AngularMini.isWindow = function(obj) {
  return obj && obj.window === obj;
}

/**
 * 
 */
tr.app.AngularMini.map = function(collection, callback) {
  var result = tr.app.AngularMini.isArray(collection) ? [] : {};

  tr.app.AngularMini.forEach(collection, function(val, i) {
    result[i] = callback(val, i);
  });
  return result;
}

/**
 * 
 */
tr.app.AngularMini.setHashKey = function(obj, h) {
  if (h) {
    obj.$$hashKey = h;
  } else {
    delete obj.$$hashKey;
  }
}

/**
 * 
 */
tr.app.AngularMini.toJson = function(obj, pretty) {
  if (typeof obj === 'undefined') return undefined;
  if (!isNumber(pretty)) {
    pretty = pretty ? 2 : null;
  }
  return JSON.stringify(obj, toJsonReplacer, pretty);
}

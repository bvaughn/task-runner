goog.provide('tr.app.AngularMini_');

/**
 * Partial port of Angular functionality used by UrlMatcher (ported from UI Router).
 * This set of functions is intended to be gradually replaced once UrlMatcher and ApplicationRouter are more fully-tested.
 * @see https://github.com/angular/angular.js/blob/master/src/Angular.js
 * @private
 */
 tr.app.AngularMini_ = {};

/**
 * @private
 */
tr.app.AngularMini_.equals = function(o1, o2) {
  if (o1 === o2) return true;
  if (o1 === null || o2 === null) return false;
  if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
  var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
  if (t1 == t2) {
    if (t1 == 'object') {
      if (tr.app.AngularMini_.isArray(o1)) {
        if (!tr.app.AngularMini_.isArray(o2)) return false;
        if ((length = o1.length) == o2.length) {
          for (key = 0; key < length; key++) {
            if (!tr.app.AngularMini_.equals(o1[key], o2[key])) return false;
          }
          return true;
        }
      } else if (isDate(o1)) {
        if (!isDate(o2)) return false;
        return tr.app.AngularMini_.equals(o1.getTime(), o2.getTime());
      } else if (isRegExp(o1) && isRegExp(o2)) {
        return o1.toString() == o2.toString();
      } else {
        if (tr.app.AngularMini_.isScope(o1) ||
            tr.app.AngularMini_.isScope(o2) ||
            tr.app.AngularMini_.isWindow(o1) ||
            tr.app.AngularMini_.isWindow(o2) ||
            tr.app.AngularMini_.isArray(o2)) return false;
        keySet = {};
        for (key in o1) {
          if (key.charAt(0) === '$' || tr.app.AngularMini_.isFunction(o1[key])) continue;
          if (!tr.app.AngularMini_.equals(o1[key], o2[key])) return false;
          keySet[key] = true;
        }
        for (key in o2) {
          if (!keySet.hasOwnProperty(key) &&
              key.charAt(0) !== '$' &&
              o2[key] !== undefined &&
              !tr.app.AngularMini_.isFunction(o2[key])) return false;
        }
        return true;
      }
    }
  }
  return false;
}

/**
 * @private
 */
tr.app.AngularMini_.extend = function(dst) {
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

  tr.app.AngularMini_.setHashKey(dst, h);
  return dst;
}

/**
 * @private
 */
tr.app.AngularMini_.filter = function(collection, callback) {
  var array = tr.app.AngularMini_.isArray(collection);
  var result = array ? [] : {};
  tr.app.AngularMini_.forEach(collection, function(val, i) {
    if (callback(val, i)) {
      result[array ? result.length : i] = val;
    }
  });
  return result;
}

/**
 * @private
 */
tr.app.AngularMini_.forEach = function(obj, iterator, context) {
  var key, length;
  if (obj) {
    if (tr.app.AngularMini_.isFunction(obj)) {
      for (key in obj) {
        // Need to check if hasOwnProperty exists,
        // as on IE8 the result of querySelectorAll is an object without a hasOwnProperty function
        if (key != 'prototype' && key != 'length' && key != 'name' && (!obj.hasOwnProperty || obj.hasOwnProperty(key))) {
          iterator.call(context, obj[key], key, obj);
        }
      }
    } else if (tr.app.AngularMini_.isArray(obj) || tr.app.AngularMini_.isArrayLike(obj)) {
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
 * @private
 */
tr.app.AngularMini_.fromJson = function(json) {
  return tr.app.AngularMini_.isString(json)
      ? JSON.parse(json)
      : json;
}

/**
 * @private
 */
tr.app.AngularMini_.identity = function($) {
  return $;
}

/**
 * @private
 */
tr.app.AngularMini_.indexOf = function(array, value) {
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
 * @private
 */
tr.app.AngularMini_.inherit = function(parent, extra) {
  return tr.app.AngularMini_.extend(Object.create(parent), extra);
}

/**
 * @private
 */
tr.app.AngularMini_.isArray = Array.isArray;

/**
 * @private
 */
tr.app.AngularMini_.NODE_TYPE_ELEMENT_ = 1;

/**
 * @private
 */
tr.app.AngularMini_.isArrayLike = function(obj) {
  if (obj == null || tr.app.AngularMini_.isWindow(obj)) {
    return false;
  }

  var length = obj.length;

  if (obj.nodeType === tr.app.AngularMini_.NODE_TYPE_ELEMENT_ && length) {
    return true;
  }

  return tr.app.AngularMini_.isString(obj) || tr.app.AngularMini_.isArray(obj) || length === 0 ||
         typeof length === 'number' && length > 0 && (length - 1) in obj;
}

/**
 * @private
 */
tr.app.AngularMini_.isDefined = function(value) {
  return typeof value !== 'undefined';
}

/**
 * @private
 */
tr.app.AngularMini_.isFunction = function(value) {
  return typeof value === 'function';
}

/**
 * @private
 */
tr.app.AngularMini_.isObject = function(value) {
  // http://jsperf.com/isobject4
  return value !== null && typeof value === 'object';
}

/**
 * @private
 */
tr.app.AngularMini_.isRegExp = function(value) {
  return toString.call(value) === '[object RegExp]';
}

/**
 * @private
 */
tr.app.AngularMini_.isScope = function(obj) {
  return obj && obj.$evalAsync && obj.$watch;
}

/**
 * @private
 */
tr.app.AngularMini_.isString = function(value) {
  return typeof value === 'string';
}

/**
 * @private
 */
tr.app.AngularMini_.isWindow = function(obj) {
  return obj && obj.window === obj;
}

/**
 * @private
 */
tr.app.AngularMini_.map = function(collection, callback) {
  var result = tr.app.AngularMini_.isArray(collection) ? [] : {};

  tr.app.AngularMini_.forEach(collection, function(val, i) {
    result[i] = callback(val, i);
  });
  return result;
}

/**
 * @private
 */
tr.app.AngularMini_.setHashKey = function(obj, h) {
  if (h) {
    obj.$$hashKey = h;
  } else {
    delete obj.$$hashKey;
  }
}

/**
 * @private
 */
tr.app.AngularMini_.toJson = function(obj, pretty) {
  if (typeof obj === 'undefined') return undefined;
  if (!isNumber(pretty)) {
    pretty = pretty ? 2 : null;
  }
  return JSON.stringify(obj, toJsonReplacer, pretty);
}

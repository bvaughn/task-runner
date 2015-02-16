goog.provide('tr.Promise');

goog.require('goog.asserts');
goog.require('tr.Abstract');
goog.require('tr.enums.State');

/**
 * Acts as an adapter between Task Runner and several popular Promise libraries.
 *
 * <p>The following promise libraries are supported:
 *
 * <ul>
 * <li><strong>ES6 (Promise.prototype)</strong>: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 * <li><strong>Angular $q</strong>: https://docs.angularjs.org/api/ng/service/$q
 * <li><strong>Q</strong>: https://github.com/kriskowal/q
 * <li><strong>jQuery</strong>: http://api.jquery.com/deferred.promise/
 * </ul>
 *
 * <p>Note that depending on specific promises, reset/rerun behavior may not function as desired.
 *
 * @example
 * var aNewTask = tr.Promise.promiseToTask(yourPromise);
 * // You can treat this task like any other Task.
 *
 * @example
 * var aNewPromise = tr.Promise.taskToPromise(yourTask);
 * // This promise can be treated like any other Promise.
 *
 * @param {!Object} promise A Promise object
 * @param {string=} opt_taskName Optional task name.
 * @throws {Erorr} if invalid Promise object provided.
 * @throws {Erorr} if no supported Promise libraries are detected.
 * @extends {tr.Abstract}
 * @constructor
 * @struct
 */
tr.Promise = function(promise, opt_taskName) {
  goog.asserts.assert(goog.isDef(promise), "Invalid promise provided");

  tr.Abstract.call(this, opt_taskName || "Promise");

  this.promise_ = promise;

  if (tr.Promise.isAngularDetected_()) {
    this.observeForAngular_(promise);
  } else if (tr.Promise.isES6Detected_()) {
    this.observeForES6_(promise);
  } else if (tr.Promise.isJQueryDetected_()) {
    this.observeForJQuery_(promise);
  } else if (tr.Promise.isQDetected_()) {
    this.observeForQ_(promise);
  } else {
    throw 'No supported Promise libraries detected.'
  }
};
goog.inherits(tr.Promise, tr.Abstract);

/**
 * Wraps a Promise and returns a Task that will complete/error when the promise is resolved/rejected.
 *
 * <p>If you're working with a library that returns Promises, you can convert any Promise to a Task using this method.
 *
 * @param {!Object} promise A Promise object
 * @param {string=} opt_taskName Optional task name.
 * @throws {Erorr} if invalid Promise object provided.
 * @throws {Erorr} if no supported Promise libraries are detected.
 */
tr.Promise.promiseToTask = function(promise, opt_taskName) {
  return new tr.Promise(promise, opt_taskName);
};

/**
 * Wraps a Task and returns a Promise that will resolve/reject when the task is completed/errored.
 *
 * <p>If you're working with a library that expects Promises (e.g. Angular's UI Router), you can convert any Task to a Promise using this method.
 *
 * @param {!Object} promise A Promise object
 * @param {Object=} opt_$q Angular $q service.
 *                         This parameter is only required if Angular Promises are being used.
 *                         It is necessary because there is no global $injector from which to get $q.
 * @throws {Erorr} if invalid Task object provided.
 * @throws {Erorr} if no supported Promise libraries are detected.
 * @throws {Erorr} if Angular is detected but no $q implementation is provided
 */
tr.Promise.taskToPromise = function(task, opt_$q) {
  goog.asserts.assert(goog.isDef(task), "Invalid task provided");

  if (tr.Promise.isAngularDetected_()) {
    return this.createAngularPromise_(task, opt_$q);
  } else if (tr.Promise.isES6Detected_()) {
    return this.createES6PromisePromise_(task);
  } else if (tr.Promise.isJQueryDetected_()) {
    return this.createJQueryPromise_(task);
  } else if (tr.Promise.isQDetected_()) {
    return this.createQPromise_(task);
  } else {
    throw 'No supported Promise libraries detected.'
  }
};

/** @override */
tr.Promise.prototype.runImpl = goog.nullFunction;

/**
 * Completes with the specified data only if/once the task is running.
 * @param {Object=} data Data
 * @private
 */
tr.Promise.prototype.completeIfRunning_ = function(data) {
  if (this.getState() === tr.enums.State.RUNNING) {
    this.completeInternal(data);
  } else {
    var callback = goog.bind(
      function() {
        this.completeInternal(data);
        this.off(callback, "started");
      }, this);

    this.started(callback);
  }
};

/**
 * Errors with the specified data and message only if/once the task is running.
 * @param {Object=} data Data
 * @param {string=} errorMessage Error message
 * @private
 */
tr.Promise.prototype.errorIfRunning_ = function(data, errorMessage) {
  if (this.getState() === tr.enums.State.RUNNING) {
    this.errorInternal(data, errorMessage);
  } else {
    var callback = goog.bind(
      function() {
        this.errorInternal(data, errorMessage);
        this.off(callback, "started");
      }, this);

    this.started(callback);
  }
};

/**
 * Detects is Angular is present.
 * @private
 */
tr.Promise.isAngularDetected_ = function() {
  return goog.isDef(angular);
};

/**
 * Detects is ES6 Promise.prototype is supported.
 * @private
 */
tr.Promise.isES6Detected_ = function() {
  return goog.isDef(Promise);
};

/**
 * Detects is jQuery is present.
 * @private
 */
tr.Promise.isJQueryDetected_ = function() {
  return goog.isDef(jQuery) && goog.isDef(jQuery.Deferred);
};

/**
 * Detects is Q is present.
 * @private
 */
tr.Promise.isQDetected_ = function() {
  return goog.isDef(Q) && goog.isDef(Q.defer);
};

/**
 * @see https://docs.angularjs.org/api/ng/service/$q
 * @private
 */
tr.Promise.prototype.observeForAngular_ = function(promise) {
  var that = this;

  promise.then(function(data) {
    that.completeIfRunning_(data);
  }, function(data) {
    that.errorIfRunning_(data, data);
  });
};

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 * @private
 */
tr.Promise.prototype.observeForES6_ = function(promise) {
  var that = this;
  
  promise.then(function(data) {
    that.completeIfRunning_(data);
  }, function(data) {
    that.errorIfRunning_(data, data);
  });
};

/**
 * @see http://api.jquery.com/deferred.promise/
 * @private
 */
tr.Promise.prototype.observeForJQuery_ = function(promise) {
  var that = this;
  
  promise.then(function(data) {
    that.completeIfRunning_(data);
  }, function(data) {
    that.errorIfRunning_(data, data);
  });
};

/**
 * @see https://github.com/kriskowal/q
 * @private
 */
tr.Promise.prototype.observeForQ_ = function(promise) {
  var that = this;
  
  promise.then(function(data) {
    that.completeIfRunning_(data);
  }, function(data) {
    that.errorIfRunning_(data, data.message || data);
  });
};

/**
 * @see https://docs.angularjs.org/api/ng/service/$q
 * @private
 */
tr.Promise.createAngularPromise_ = function(task, $q) {
  goog.asserts.assert(goog.isDef($q), "Invalid $q provided");

  var deferred = $q.defer();
  task.completed(
    function(task) {
      deferred.resolve(task.getData());
    });
  task.errored(
    function(task) {
      deferred.reject(task.getErrorMessage());
    });

  return deferred.promise;
};

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 * @private
 */
tr.Promise.createES6PromisePromise_ = function(task) {
  return new Promise(function(resolve, reject) {
    task.completed(
      function(task) {
        resolve(task.getData());
      });
    task.errored(
      function(task) {
        reject(task.getErrorMessage());
      });
  });
};

/**
 * @see http://api.jquery.com/deferred.promise/
 * @private
 */
tr.Promise.createJQueryPromise_ = function(task) {
  var deferred = new jQuery.Deferred();
  task.completed(
    function(task) {
      deferred.resolve(task.getData());
    });
  task.errored(
    function(task) {
      deferred.reject(task.getErrorMessage());
    });

  return deferred.promise();
};

/**
 * @see https://github.com/kriskowal/q
 * @private
 */
tr.Promise.createQPromise_ = function(task) {
  var deferred = Q.defer();
  task.completed(
    function(task) {
      deferred.resolve(task.getData());
    });
  task.errored(
    function(task) {
      deferred.reject(task.getErrorMessage());
    });

  return deferred.promise;
};
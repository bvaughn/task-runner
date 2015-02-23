/// <reference path="../../definitions/angular.d.ts" />
/// <reference path="../../definitions/jquery.d.ts" />
/// <reference path="../../definitions/promise.d.ts" />
/// <reference path="../../definitions/q.d.ts" />

module tr {

  /**
   * Acts as an adapter between Task Runner and several popular Promise libraries.
   *
   * <p>The following promise libraries are supported:
   *
   * <ul>
   * <li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise">ES6 (Promise.prototype)</a>
   * <li><a href="https://docs.angularjs.org/api/ng/service/$q">Angular $q</a>
   * <li><a href="https://github.com/kriskowal/q">Q</a>
   * <li><a href="http://api.jquery.com/deferred.promise/">jQuery</a>
   * </ul>
   *
   * <p>Note that depending on specific promises, reset/rerun behavior may not function as desired.
   */
  export class Promise extends tr.Abstract {

    private promise_:any;

    /**
     * Constructor.
     *
     * @param promise A Promise object
     * @param name Optional task name.
     * @throws Erorr if invalid Promise object provided.
     * @throws Erorr if no supported Promise libraries are detected.
     */
    constructor(promise:any, name?:string) {
      super(name || "Promise");

      if (!promise) {
        throw Error("Invalid promise provided");
      }

      this.promise_ = promise;

      if (Promise.isAngularDetected()) {
        this.observeForAngular_(promise);
      } else if (Promise.isES6Detected()) {
        this.observeForES6_(promise);
      } else if (Promise.isJQueryDetected()) {
        this.observeForJQuery_(promise);
      } else if (Promise.isQDetected()) {
        this.observeForQ_(promise);
      } else {
        throw 'No supported Promise libraries detected.'
      }
    }

    /** @inheritDoc */
    protected runImpl():void {
      // No-op
    }

    // Static methods //////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Wraps a Promise and returns a Task that will complete/error when the promise is resolved/rejected.
     *
     * <p>If you're working with a library that returns Promises, you can convert any Promise to a Task using this method.
     *
     * @param promise A Promise object
     * @param name Optional task name.
     * @throws Error if invalid Promise object provided.
     * @throws Error if no supported Promise libraries are detected.
     */
    static promiseToTask(promise:any, name?:string):Promise {
      return new Promise(promise, name);
    }

    /**
     * Wraps a Task and returns a Promise that will resolve/reject when the task is completed/errored.
     *
     * <p>If you're working with a library that expects Promises (e.g. Angular's UI Router),
     * you can convert any Task to a Promise using this method.
     *
     * @param task Task to wrap
     * @param $q Angular $q service.
     *           This parameter is only required if Angular Promises are being used.
     *           It is necessary because there is no global $injector from which to get $q.
     * @throws Error if invalid Task object provided.
     * @throws Error if no supported Promise libraries are detected.
     * @throws Error if Angular is detected but no $q implementation is provided
     */
    static taskToPromise(task:tr.Task, $q?:ng.IQService):any {
      if (!task) {
        throw Error("Invalid task provided");
      }

      if (this.isAngularDetected()) {
        return this.createAngularPromise_(task, $q);
      } else if (this.isES6Detected()) {
        return this.createES6PromisePromise_(task);
      } else if (this.isJQueryDetected()) {
        return this.createJQueryPromise_(task);
      } else if (this.isQDetected()) {
        return this.createQPromise_(task);
      } else {
        throw Error("No supported Promise libraries detected.");
      }
    }

    // Static helpers //////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * @see https://docs.angularjs.org/api/ng/service/$q
     */
    static createAngularPromise_ = function(task:tr.Task, $q:ng.IQService):ng.IPromise<any> {
      if (!$q) {
        throw Error("Invalid $q provided");
      }

      var deferred = $q.defer();
      task.completed(
        function(task:tr.Task) {
          deferred.resolve(task.getData());
        });
      task.errored(
        function(task:tr.Task) {
          deferred.reject(task.getErrorMessage());
        });

      return deferred.promise;
    }

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
     */
    static createES6PromisePromise_ = function(task:tr.Task):es6.Promise {
      return new window["Promise"](function(resolve, reject) {
        task.completed(
          function(task:tr.Task) {
            resolve(task.getData());
          });
        task.errored(
          function(task:tr.Task) {
            reject(task.getErrorMessage());
          });
      });
    }

    /**
     * @see http://api.jquery.com/deferred.promise/
     */
    static createJQueryPromise_ = function(task:tr.Task):JQueryPromise<any> {
      var deferred:JQueryDeferred<any> = new window["jQuery"]["Deferred"]();
      task.completed(
        function(task:tr.Task) {
          deferred.resolve(task.getData());
        });
      task.errored(
        function(task:tr.Task) {
          deferred.reject(task.getErrorMessage());
        });

      return deferred.promise();
    }

    /**
     * @see https://github.com/kriskowal/q
     */
    static createQPromise_ = function(task:tr.Task):Object {
      var deferred = window["Q"].defer();
      task.completed(
        function(task:tr.Task) {
          deferred.resolve(task.getData());
        });
      task.errored(
        function(task:tr.Task) {
          deferred.reject(task.getErrorMessage());
        });

      return deferred.promise;
    }

    /**
     * Detects is Angular is present.
     */
    private static isAngularDetected():boolean {
      return window["angular"] !== undefined;
    }

    /**
     * Detects is ES6 Promise.prototype is supported.
     */
    private static isES6Detected():boolean {
      return window["Promise"] !== undefined;
    }

    /**
     * Detects is jQuery is present.
     */
    private static isJQueryDetected():boolean {
      return window["jQuery"] !== undefined && window["jQuery"]["Deferred"] !== undefined;
    }

    /**
     * Detects is Q is present.
     */
    private static isQDetected():boolean {
      return window["Q"] !== undefined && window["Q"]["defer"] !== undefined;
    }

    // Helper methods //////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * Completes with the specified data only if/once the task is running.
     * @param data Data
     */
    private completeIfRunning_(data):void {
      if (this.getState() === tr.enums.State.RUNNING) {
        this.completeInternal(data);
      } else {
        var callback =
          function() {
            this.completeInternal(data);
            this.off(callback, "started");
          }.bind(this);

        this.started(callback);
      }
    }

    /**
     * Errors with the specified data and message only if/once the task is running.
     * @param data Data
     * @param errorMessage Error message
     * @private
     */
    private errorIfRunning_(data, errorMessage):void {
      if (this.getState() === tr.enums.State.RUNNING) {
        this.errorInternal(data, errorMessage);
      } else {
        var callback =
          function() {
            this.errorInternal(data, errorMessage);
            this.off(callback, "started");
          }.bind(this);

        this.started(callback);
      }
    }
    /**
     * @see https://docs.angularjs.org/api/ng/service/$q
     */
    private observeForAngular_(promise:ng.IPromise<any>):void {
      var that = this;

      promise.then(
        function(data) {
          that.completeIfRunning_(data);
        }, function(data) {
          that.errorIfRunning_(data, data);
        });
    }

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
     */
    private observeForES6_(promise:es6.Promise):void {
      var that = this;

      promise.then(
        function(data) {
          that.completeIfRunning_(data);
        }, function(data) {
          that.errorIfRunning_(data, data);
        });
    }

    /**
     * @see http://api.jquery.com/deferred.promise/
     */
    private observeForJQuery_(promise:JQueryPromise<any>):void {
      var that = this;

      promise.then(
        function(data) {
          that.completeIfRunning_(data);
        }, function(data) {
          that.errorIfRunning_(data, data);
        });
    }

    /**
     * @see https://github.com/kriskowal/q
     */
    private observeForQ_(promise:Q.Promise):void {
      var that = this;

      promise.then(
        function(data) {
          that.completeIfRunning_(data);
        }, function(data) {
          that.errorIfRunning_(data, data.message || data);
        });
    }
  }
};
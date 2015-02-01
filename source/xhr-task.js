goog.provide('taskrunner.XHRTask');

goog.require('taskrunner.AbstractTask');
goog.require('taskrunner.TaskState');



/**
 * Creates an XHR request and completes upon successful response from the server.
 *
 * <p>The type of request created depends on whether a data object is provided:
 * <ul>
 * <li>If a data object is provided it will be converted to a URL-args string and a POST request will be created.
 * <li>If a data object is provided a GET request will be created.
 * </ul>
 *
 * @example
 * // Sends a POST request to "foo" with URL args "bar=1&baz=two"
 * var task = new taskrunner.XHRTask("foo", {bar: 1, baz: "two"});
 * task.run();
 *
 * @param {!string} url URL to load.
 * @param {Object=} opt_data Object containing POST data; if undefined a GET request will be used.
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {taskrunner.AbstractTask}
 * @constructor
 * @struct
 */
taskrunner.XHRTask = function(url, opt_data, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {!string} */
  this.url_ = url;

  /** @private {Object|undefined} */
  this.postData_ = opt_data;

  /** @private {XMLHttpRequest|undefined} */
  this.xhrHttpRequest_ = undefined;
};
goog.inherits(taskrunner.XHRTask, taskrunner.AbstractTask);


/** @override */
taskrunner.XHRTask.prototype.resetImpl = function() {
  this.xhrHttpRequest_ = undefined;
};


/** @override */
taskrunner.XHRTask.prototype.interruptImpl = function() {
  if (this.xhrHttpRequest_ !== undefined) {
    this.xhrHttpRequest_.abort();
    this.xhrHttpRequest_ = undefined;
  }
};


/** @override */
taskrunner.XHRTask.prototype.runImpl = function() {
  try {

    // Check if XHR completed while interrupted
    if (this.xhrHttpRequest_ !== undefined) {
      this.checkForCompletedOrErrored_();

    } else {
      var postDataString = this.createPostDataString_();
      var method = postDataString === undefined ? 'GET' : 'POST';

      this.xhrHttpRequest_ = new XMLHttpRequest();
      this.xhrHttpRequest_.onreadystatechange = this.onReadyStateChange_.bind(this);
      this.xhrHttpRequest_.open(method, this.url_, true);
      this.xhrHttpRequest_.send(postDataString);
    }

  } catch (error) {
    if (this.state_ === taskrunner.TaskState.RUNNING) {
      this.errorInternal(error, error.message);
    }
  }
};


/** @override */
taskrunner.XHRTask.prototype.onReadyStateChange_ = function() {
  if (this.state_ === taskrunner.TaskState.RUNNING) {
    if (this.xhrHttpRequest_.readyState === 4) {
      if (this.xhrHttpRequest_.status === 200) {
        this.completeInternal(this.xhrHttpRequest_.responseText);
      } else {
        this.errorInternal(this.xhrHttpRequest_.status, this.xhrHttpRequest_.responseText);
      }
    }
  }
};


/** @override */
taskrunner.XHRTask.prototype.createPostDataString_ = function() {
  if (this.postData_ !== undefined) {
    var dataStrings = [];

    for (var key in this.postData_) {
      dataStrings.push(key + '=' + this.postData_[key]);
    }

    return dataStrings.join("&");
  }

  return undefined;
};

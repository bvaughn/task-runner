goog.provide('taskrunner.XHRTask');

goog.require('goog.net.ErrorCode');
goog.require('goog.net.XhrIo');
goog.require('goog.structs.Map');
goog.require('goog.Uri.QueryData');
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
 * // Sends a POST request to "returns-json" with URL args "bar=1&baz=two"
 * var task = new taskrunner.XHRTask("returns-json", {bar: 1, baz: "two"});
 * task.run();
 *
 * @example
 * // Sends a GET request to that returns XML
 * var task = new taskrunner.XHRTask("returns-xml", null, taskrunner.XHRTask.ResponseType.XML);
 * task.run();
 *
 * @param {!string} url URL to load.
 * @param {Object=} opt_data Object containing POST data; if undefined a GET request will be used.
 * @param {taskrunner.XHRTask.ResponseType=} Expected reponse type.
 *     If undefined the static value set with taskrunner.XHRTask.setDefaultResponseType will be used.
 *     If no default response-type is set this value defaults to taskrunner.XHRTask.ResponseType.TEXT.
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {taskrunner.AbstractTask}
 * @constructor
 * @struct
 */
taskrunner.XHRTask = function(url, opt_data, opt_responseType, opt_taskName) {
  goog.base(this, opt_taskName);

  /** @private {!string} */
  this.url_ = url;

  /** @private {Object|undefined} */
  this.postData_ = opt_data;

  /** @private {!taskrunner.XHRTask.ResponseType} */
  this.ResponseType_ = opt_responseType || taskrunner.XHRTask.DEFAULT_RESPONSE_TYPE_ || taskrunner.XHRTask.ResponseType.TEXT;

  /** @private {goog.net.XhrIo|undefined} */
  this.xhrRequest_ = undefined;
};
goog.inherits(taskrunner.XHRTask, taskrunner.AbstractTask);


/**
 * @override
 * @inheritDoc
 */
taskrunner.XHRTask.prototype.resetImpl = function() {
  this.xhrRequest_ = undefined;
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.XHRTask.prototype.interruptImpl = function() {
  if (this.xhrRequest_ !== undefined) {
    this.xhrRequest_.abort();
    this.xhrRequest_ = undefined;
  }
};


/**
 * @override
 * @inheritDoc
 */
taskrunner.XHRTask.prototype.runImpl = function() {
  try {
    var postDataString = this.createPostDataString_();
    var method = postDataString === undefined ? 'GET' : 'POST';

    this.xhrRequest_ = new goog.net.XhrIo();

    goog.events.listen(this.xhrRequest_, goog.net.EventType.ERROR, goog.bind(this.onXhrRequestErrorOrTimeout, this));
    goog.events.listen(this.xhrRequest_, goog.net.EventType.SUCCESS, goog.bind(this.onXhrRequestSuccess, this));
    goog.events.listen(this.xhrRequest_, goog.net.EventType.TIMEOUT, goog.bind(this.onXhrRequestErrorOrTimeout, this));

    this.xhrRequest_.send(this.url_, method, postDataString);

  } catch (error) {
    if (this.state_ === taskrunner.TaskState.RUNNING) {
      this.errorInternal(error, error.message);
    }
  }
};


/** @private */
taskrunner.XHRTask.prototype.onXhrRequestSuccess = function() {
  if (this.state_ === taskrunner.TaskState.RUNNING) {
    try {
      var data;

      switch (this.ResponseType_) {
        case taskrunner.XHRTask.ResponseType.JSON:
          data = this.xhrRequest_.getResponseJson();
          break;
        case taskrunner.XHRTask.ResponseType.TEXT:
          data = this.xhrRequest_.getResponseText();
          break;
        case taskrunner.XHRTask.ResponseType.XML:
          data = this.xhrRequest_.getResponseXml();
          break;
      }

      this.completeInternal(data);
    } catch (error) {
      this.errorInternal(error, "Invalid response");
    }
  }
};


/** @private */
taskrunner.XHRTask.prototype.onXhrRequestErrorOrTimeout = function() {
  if (this.state_ === taskrunner.TaskState.RUNNING) {
    this.errorInternal(
      this.xhrRequest_.getLastErrorCode(),
      this.xhrRequest_.getLastError());
  }
};


/** @private */
taskrunner.XHRTask.prototype.createPostDataString_ = function() {
  if (this.postData_ !== undefined) {
    return goog.Uri.QueryData.createFromMap(
      new goog.structs.Map(this.postData_)).toString();
  }

  return undefined;
};


/**
 * Set the default response-type for all XHR requests that do not otherwise specify a response-type.
 */
taskrunner.XHRTask.setDefaultResponseType = function(responseType) {
  taskrunner.XHRTask.DEFAULT_RESPONSE_TYPE_ = responseType;
};


/**
 * Enumeration of XHR requestion response types.
 * @enum {number}
 */
taskrunner.XHRTask.ResponseType = {
  JSON: 1,
  TEXT: 2,
  XML: 3
};
goog.provide('taskrunner.XHRTask');

goog.require('taskrunner.AbstractTask');
goog.require('taskrunner.TaskState');



/**
 * Creates an XHR request and completes upon successful response from the server.
 * The type of request created depends on whether a data object is provided.
 * If one is provided, it will be converted to a URL-args string and a POST request will be created.
 * Else a GET request will be created.
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
};
goog.inherits(taskrunner.XHRTask, taskrunner.AbstractTask);


/** @override */
taskrunner.XHRTask.prototype.runImpl = function() {
  try {
    var that = this;

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        if (xhr.status == 200) {
          that.completeInternal(xhr.responseText);
        } else {
          that.errorInternal(xhr.status, xhr.responseText);
        }
      }
    }

    if (this.postData_ !== undefined) {
      var dataStrings = [];

      for (var key in this.postData_) {
        dataStrings.push(key + '=' + this.postData_[key]);
      }

      xhr.open("POST", this.url_, true);
      xhr.send(dataStrings.join("&"));

    } else {
      xhr.open("GET", this.url_, true);
      xhr.send();
    }

  } catch (error) {
    if (this.state_ == taskrunner.TaskState.RUNNING) {
      this.errorInternal(error, error.message);
    }
  }
};

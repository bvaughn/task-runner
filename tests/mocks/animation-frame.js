/**
 * Mocks window.requestAnimationFrame and window.cancelAnimationFrame functions for testing purposes.
 */
MockAnimationFrame = function() {
  this.animationIdCounter_ = 0;
  this.animationIds_ = [];
  this.animationIdtoCallbacksMap_ = {};
};

/**
 * Override cancelAnimationFrame, requestAnimationFrame.
 */
MockAnimationFrame.prototype.install = function() {
  this.cancelAnimationFrameBackup_ = window.cancelAnimationFrame;
  this.requestAnimationFrameBackup_ = window.requestAnimationFrame;

  window.cancelAnimationFrame = this.cancel_.bind(this);
  window.requestAnimationFrame = this.request_.bind(this);
};

/**
 * Revert overridden functions with defaults.
 */
MockAnimationFrame.prototype.uninstall = function() {
  window.cancelAnimationFrame = this.cancelAnimationFrameBackup_;
  window.requestAnimationFrame = this.requestAnimationFrameBackup_;
};

MockAnimationFrame.prototype.getLastId = function() {
  return this.animationIds_[this.animationIds_.length - 1];
};

MockAnimationFrame.prototype.getAnimationFrameCount = function() {
  return this.animationIds_.length;
};

/**
 * Call a pending requestAnimationFrame callback with the current timestamp.
 */
MockAnimationFrame.prototype.call = function(id) {
  this.animationIdtoCallbacksMap_[id](new Date().getTime());
  this.cancel_(id);
};

/**
 * Calls the most recent pending requestAnimationFrame callback with the current timestamp.
 */
MockAnimationFrame.prototype.callMostRecent = function() {
  this.call(this.getLastId());
};

MockAnimationFrame.prototype.cancel_ = function(id) {
  this.animationIds_.splice(this.animationIds_.indexOf(id), 1);

  delete this.animationIdtoCallbacksMap_[id];
};

MockAnimationFrame.prototype.request_ = function(callback) {
  var id = ++this.animationIdCounter_;

  this.animationIds_.push(id);
  this.animationIdtoCallbacksMap_[id] = callback;

  return id;
};
goog.provide('tr.MockAnimationFrame');

goog.require('goog.testing.PropertyReplacer');



/**
 * Mocks window.requestAnimationFrame and window.cancelAnimationFrame functions
 * for testing purposes. This class is safe to use with goog.testing.MockClock,
 * but should be installed after MockClock is installed in order to override
 * correctly.
 *
 * @constructor
 * @struct
 */
tr.MockAnimationFrame = function() {
  this.replacer_ = new goog.testing.PropertyReplacer();

  this.animationIdCounter_ = 0;
  this.animationIds_ = [];
  this.animationIdtoCallbacksMap_ = {};
};


/**
 * Override cancelAnimationFrame, requestAnimationFrame, and goog.now
 * with mock functions.
 */
tr.MockAnimationFrame.prototype.install = function() {
  this.replacer_.set(goog.global, 'cancelAnimationFrame',
      goog.bind(this.cancel_, this));

  this.replacer_.set(goog.global, 'requestAnimationFrame',
      goog.bind(this.request_, this));
};


/**
 * Revert overriden functions with defaults.
 */
tr.MockAnimationFrame.prototype.uninstall = function() {
  this.replacer_.reset();
};


/**
 * @return {!number} Id of most recent requestAnimationFrame callback.
 */
tr.MockAnimationFrame.prototype.getLastId = function() {
  return this.animationIds_[this.animationIds_.length - 1];
};


/**
 * @return {!number} Number of pending requestAnimationFrame callbacks.
 */
tr.MockAnimationFrame.prototype.getAnimationFrameCount = function() {
  return this.animationIds_.length;
};


/**
 * Call a pending requestAnimationFrame callback with the current timestamp.
 *
 * @param {!number} id
 */
tr.MockAnimationFrame.prototype.call = function(id) {
  this.animationIdtoCallbacksMap_[id](goog.now());
  this.cancel_(id);
};


/**
 * Calls the most recent pending requestAnimationFrame callback with the
 * current timestamp.
 */
tr.MockAnimationFrame.prototype.callMostRecent = function() {
  this.call(this.getLastId());
};


/**
 * @param {!number} id
 * @private
 */
tr.MockAnimationFrame.prototype.cancel_ = function(id) {
  this.animationIds_.splice(this.animationIds_.indexOf(id), 1);

  delete this.animationIdtoCallbacksMap_[id];
};


/**
 * @param {function(!number)=} callback
 * @return {!number}
 * @private
 */
tr.MockAnimationFrame.prototype.request_ = function(callback) {
  var id = ++this.animationIdCounter_;

  this.animationIds_.push(id);
  this.animationIdtoCallbacksMap_[id] = callback;

  return id;
};

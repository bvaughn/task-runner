goog.provide('tr.Chain');

goog.require('goog.asserts');
goog.require('tr.Abstract');
goog.require('tr.Composite');
goog.require('tr.Graph');
goog.require('tr.StopOnSuccess');

/**
 * Lightweight interface to create a dependency graph task.
 *
 * @example
 * new Chain().first(taskA, taskB).then(taskC).then(taskE, taskD).or(taskF).then(taskG).run();
 * // First Task A and B will be run in parallel.
 * // If they succeed Task C will be run next.
 * // If Task C succeeds, Task D and E will be run next, in parallel.
 * // If either Task D or E fails, Task F will be run; otherwise it will be skipped.
 * // Lastly Task G will be run.
 *
 * @param {function(!tr.Task)=} opt_completedCallback Optional on-complete callback method.
 * @param {function(!tr.Task)=} opt_erroredCallback Optional on-error callback method.
 * @extends {tr.Abstract}
 * @constructor
 * @struct
 */
tr.Chain = function(opt_completedCallback, opt_erroredCallback, opt_taskName) {
  goog.base(this, opt_taskName || "Chain");

  /**
   * @type {!tr.Graph}
   * @private
   */
  this.graph_ = new tr.Graph();
  this.graph_.completed(goog.bind(this.completeInternal, this));
  this.graph_.errored(goog.bind(this.errorInternal, this));

  /**
   * @type {!Array.<!tr.Task>}
   * @private
   */
  this.mostRecentTaskArgs_ = [];

  if (opt_completedCallback !== undefined) {
    this.completed(opt_completedCallback);
  }

  if (opt_erroredCallback !== undefined) {
    this.errored(opt_erroredCallback);
  }
};
goog.inherits(tr.Chain, tr.Abstract);

/**
 * Returns the inner decorated Graph task.
 *
 * @return {tr.Graph}
 */
tr.Chain.prototype.getDecoratedTask = function() {
  return this.graph_;
};

/**
 * Add one or more tasks to the beginning of the chain.
 *
 * @param {...tr.Task} varArgs One or more tasks
 * @return {tr.Chain}
 * @throws {Error} if this method is called once tasks have already been added to the chain.
 */
tr.Chain.prototype.first = function(varArgs) {
  goog.asserts.assert(this.graph_.getOperationsCount() === 0, 'Cannot call first after tasks have been added');

  this.then.apply(this, arguments);

  return this;
};

/**
 * Add one or more tasks to be run only if one of the previously-added tasks fail.
 *
 * @param {...tr.Task} varArgs One or more tasks
 * @return {tr.Chain}
 */
tr.Chain.prototype.or = function(varArgs) {
  // Remove the most recent batch of tasks (added with the previous call to or() or then()) from the Graph.
  this.graph_.removeAll(this.mostRecentTaskArgs_);

  // Use StopOnSuccess to ensure the correct continue-only-on-failure behavior.
  var stopOnSuccess = new tr.StopOnSuccess();

  // Wrap them in a parallel group (to preserve then() behavior).
  stopOnSuccess.add(
    new tr.Composite(true, this.mostRecentTaskArgs_));

  // Wrap the new batch of tasks in a parallel group as well.
  if (arguments.length > 1) {
    stopOnSuccess.add(
      new tr.Composite(true, arguments));
  } else {
    stopOnSuccess.add(arguments[0]);
  }

  // Re-add the new composite to the end of the Graph.
  this.graph_.addToEnd(stopOnSuccess);

  // Update our most-recent pointer to the newly-added composite in case an or() call follows.
  this.mostRecentTaskArgs_ = [stopOnSuccess];

  return this;
};

/**
 * Alias for "or".
 *
 * @param {...tr.Task} varArgs One or more tasks
 * @return {tr.Chain}
 */
tr.Chain.prototype.else = function(varArgs) {
  return this.or.apply(this, arguments);
};

/**
 * Alias for "or".
 *
 * @param {...tr.Task} varArgs One or more tasks
 * @return {tr.Chain}
 */
tr.Chain.prototype.otherwise = function(varArgs) {
  return this.or.apply(this, arguments);
};

/**
 * Add one or more tasks to be run after the tasks already in this chain have been run.
 *
 * @param {...tr.Task} varArgs One or more tasks
 * @return {tr.Chain}
 */
tr.Chain.prototype.then = function(varArgs) {
  this.mostRecentTaskArgs_ = arguments;

  this.graph_.addAllToEnd(arguments);

  return this;
};

/**
 * @inheritDoc
 */
tr.Chain.prototype.getOperationsCount = function() {
  return this.graph_.getOperationsCount();
};

/**
 * @inheritDoc
 */
tr.Chain.prototype.getCompletedOperationsCount = function() {
  return this.graph_.getCompletedOperationsCount();
};

/**
 * @override
 * @inheritDoc
 */
tr.Chain.prototype.runImpl = function() {
  this.graph_.run();
};

/**
 * @override
 * @inheritDoc
 */
tr.Chain.prototype.interruptImpl = function() {
  this.graph_.interrupt();
};

/**
 * @override
 * @inheritDoc
 */
tr.Chain.prototype.resetImpl = function() {
  this.graph_.reset();
};
goog.provide('tr.app.TransitionState');

goog.require('tr.Closure');
goog.require('tr.Failsafe');
goog.require('tr.app.State');
goog.require('tr.enums.State');

/**
 * <p class="alert alert-info">This class is only available in the <em>task-runner-engine</em> target.
 *
 * Special state used to resolve dependencies when transitioning from one {tr.app.State} to another.
 *
 * @example
 * var goToUserProfileTask = new tr.app.TransitionState();
 * 
 * // In this example, the highest-priority target state is one that displays a user-profile.
 * goToUserProfileTask.addTargetState(userProfileState, [loadSessionTask, loadUserProfileTask]);
 * 
 * // If the user-profile could not be loaded, fall back to viewing the user's homepage.
 * goToUserProfileTask.addTargetState(userHomePageState, [loadSessionTask]);
 * 
 * // If the neither could not be loaded, fall back to the login screen.
 * goToUserProfileTask.addTargetState(loginState, []);
 * 
 * // Change application-state to initiate the transition.
 * application.enterState(goToUserProfileTask);
 * 
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {tr.app.State}
 * @constructor
 * @struct
 */
tr.app.TransitionState = function(opt_taskName) {
  goog.base(this, opt_taskName || "TransitionState");

  /** @private {Array.<!tr.Task>=}  */
  this.blockingTasks_ = [];

  /** @private {Array.<!tr.Task>=} */
  this.prioritizedStates_ = [];

  /** @private {!Object} */
  this.taskIdToBlockingTasksMap_ = {};
};
goog.inherits(tr.app.TransitionState, tr.app.State);

/**
 * @override
 * @inheritDoc
 */
tr.app.TransitionState.prototype.beforeFirstRun = function() {
  // Once all of the blocker-tasks have completed, choose the most appropriate state.
  this.addToEnd(
    new tr.Closure(
      goog.bind(this.chooseState_, this), false, "Closure - state-chooser"));
};

/**
 * Add a target tr.app.State and its prerequisite blocking {@link tr.Task}s.
 * Multiple target states can be added; they should be added in the order of highest-to-lowest importance.
 * 
 * @param {!State} stateTask State task to be entered if all of the specified blockers succeed.
 * @param {Array.<!tr.Task>=} blockers Tasks that are pre-requisites to complete before the target state can be entered.
 * @return {!tr.app.StateTransitionTask}
 */
tr.app.TransitionState.prototype.addTargetState = function(stateTask, blockingTasks) {
  blockingTasks = blockingTasks || [];

  this.prioritizedStates_.push(stateTask);

  this.taskIdToBlockingTasksMap_[stateTask.getUniqueID()] = blockingTasks;

  for (var i = 0; i < blockingTasks.length; i++) {
    var task = blockingTasks[i];

    if (this.blockingTasks_.indexOf(task) >= 0) {
      continue;
    }

    this.blockingTasks_.push(task);

    // Wrap it in a Failsafe task so that a blocking-task failure won't interrupt the other blocking tasks.
    this.add(new tr.Failsafe(task));
  }

  return this;
};

/**
 * Picks the highest priority State that meets all blocking dependencies.
 * If no matching states can be found, this function will transition to an errored state.
 *
 * @private
 */
tr.app.TransitionState.prototype.chooseState_ = function() {
  for (var i = 0; i < this.prioritizedStates_.length; i++) {
    var stateTask = this.prioritizedStates_[i];
    var blockingTasks = this.taskIdToBlockingTasksMap_[stateTask.getUniqueID()];
    var blockingDependenciesMet = true;
    
    for (var x = 0; x < blockingTasks.length; x++) {
      var blockingTask = blockingTasks[x];

      if (blockingTask.getState() === tr.enums.State.ERRORED) {
        blockingDependenciesMet = false;

        break;
      }
    }

    if (blockingDependenciesMet) {
      this.application_.enterState(stateTask);

      return;
    }
  }

  this.errorInternal('No valid application states found');
};
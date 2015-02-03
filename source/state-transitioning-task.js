goog.provide('taskrunner.StateTransitioningTask');

goog.require('taskrunner.ClosureTask');
goog.require('taskrunner.FailsafeTask');
goog.require('taskrunner.StateTask');
goog.require('taskrunner.TaskState');



/**
 * Special state used to resolve dependencies when transitioning from one {taskrunner.StateTask} to another.
 *
 * @example
 * var goToUserProfileTask = new taskrunner.StateTransitioningTask(applicationTask);
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
 * applicationTask.enterState(goToUserProfileTask);
 * 
 * @param {!taskrunner.Task} applicationTask A reference to the ApplicationTask this state belongs to.
 * @param {string=} opt_taskName Optional semantically meaningful task name.
 * @extends {taskrunner.StateTask}
 * @constructor
 * @struct
 */
taskrunner.StateTransitioningTask = function(applicationTask, opt_taskName) {
  goog.base(this, applicationTask, opt_taskName);

  /** @private {!taskrunner.CompositeTask} */
  this.blockingTasks_ = new taskrunner.CompositeTask(true);

  /** @private {Array.<!taskrunner.Task>=} */
  this.prioritizedStateTasks_ = [];

  /** @private {!Object} */
  this.taskIdToBlockingTasksMap_ = {};
};
goog.inherits(taskrunner.StateTransitioningTask, taskrunner.StateTask);


/**
 * @override
 * @inheritDoc
 */
taskrunner.StateTransitioningTask.prototype.addTasksBeforeFirstRun = function() {
  this.addTask(this.blockingTasks_);
  
  // Once all of the blocker-tasks have completed, choose the most appropriate state.
  this.addTask(
    new taskrunner.ClosureTask(
      this.chooseState_.bind(this)),
    [this.blockingTasks_]);
};


/**
 * Add a target taskrunner.StateTask and its prerequisite blocking {@link taskrunner.Task}s.
 * Multiple target states can be added; they should be added in the order of highest-to-lowest importance.
 * 
 * @param {!StateTask} stateTask State task to be entered if all of the specified blockers succeed.
 * @param {Array.<!taskrunner.Task>=} blockers Tasks that are pre-requisites to complete before the target state can be entered.
 */
taskrunner.StateTransitioningTask.prototype.addTargetState = function(stateTask, blockingTasks) {
  this.prioritizedStateTasks_.push(stateTask);

  this.taskIdToBlockingTasksMap_[stateTask.getUniqueID()] = blockingTasks;

  for (var i = 0; i < blockingTasks.length; i++) {
    // Wrap it in a FailsafeTask so that a blocking-task failure won't interrupt the other blocking tasks.
    this.blockingTasks_.addTask(
      new taskrunner.FailsafeTask(
        blockingTasks[i]));
  }
};


/**
 * Picks the highest priority StateTask that meets all blocking dependencies.
 * If no matching states can be found, this function will transition to an errored state.
 *
 * @private
 */
taskrunner.StateTransitioningTask.prototype.chooseState_ = function() {
  for (var i = 0; i < this.prioritizedStateTasks_.length; i++) {
    var stateTask = this.prioritizedStateTasks_[i];
    var blockingTasks = this.taskIdToBlockingTasksMap_[stateTask.getUniqueID()];
    var blockingDependenciesMet = true;
    
    for (var x = 0; x < blockingTasks.length; x++) {
      var blockingTask = blockingTasks[x];

      if (blockingTask.getState() === taskrunner.TaskState.ERRORED) {
        blockingDependenciesMet = false;

        break;
      }
    }

    if (blockingDependenciesMet) {
      this.applicationTask_.enterState(stateTask);

      return;
    }
  }

  this.errorInternal('No valid application states found');
};
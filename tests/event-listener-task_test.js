goog.provide('goog.EventListenerTask.test');
goog.setTestOnly('goog.EventListenerTask.test');

goog.require('taskrunner.TaskState');
goog.require('taskrunner.EventListenerTask');

describe('goog.EventListenerTask', function() {

  var eventTarget;
  var eventType = 'click';
  var waitForEventTask;

  beforeEach(function() {
    eventTarget = {
      addEventListener: function(type, listener) {
        this.type_ = type;
        this.listener_ = listener;
      },
      dispatchEvent: function() {
        if (this.listener_) {
          this.dispatchedEvent_ = {type: eventType};

          this.listener_(this.dispatchedEvent_);
        }
      },
      removeEventListener: function(type, listener) {
        this.type_ = undefined;
        this.listener_ = undefined;
      }
    };

    waitForEventTask = new taskrunner.EventListenerTask(eventTarget, eventType);
  });

  it('should complete when an event of the correct type is received', function() {
    waitForEventTask.run();

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    eventTarget.dispatchEvent();

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(waitForEventTask.getData()).toBe(eventTarget.dispatchedEvent_);
  });

  it('should only complete once even if multiple matching events are dispatched', function() {
    waitForEventTask.run();

    eventTarget.dispatchEvent();

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.COMPLETED);

    eventTarget.dispatchEvent(); // Will error if task tries to complete again
  });

  it('should not complete when an event is dispatched before running', function() {
    eventTarget.dispatchEvent();

    waitForEventTask.run();
    
    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.RUNNING);
  });

  it('should not complete when an event is dispatched while interrupted', function() {
    waitForEventTask.run();
    waitForEventTask.interrupt();

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);

    eventTarget.dispatchEvent();

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
  });

  it('should reattach listener when rerun after an interruption', function() {
    waitForEventTask.run();
    waitForEventTask.interrupt();

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);

    waitForEventTask.run();

    eventTarget.dispatchEvent();

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });
});
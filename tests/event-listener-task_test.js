goog.provide('goog.EventListenerTask.test');
goog.setTestOnly('goog.EventListenerTask.test');

goog.require('goog.events.EventTarget');
goog.require('taskrunner.TaskState');
goog.require('taskrunner.EventListenerTask');

describe('goog.EventListenerTask', function() {

  var eventTarget;
  var eventType = 'click';
  var waitForEventTask;

  beforeEach(function() {
    eventTarget = new goog.events.EventTarget();

    waitForEventTask = new taskrunner.EventListenerTask(eventTarget, eventType);
  });

  it('should complete when an event of the correct type is received', function() {
    waitForEventTask.run();

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    eventTarget.dispatchEvent(eventType);

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
    expect(waitForEventTask.getData()).toBeTruthy();
  });

  it('should not complete when an event of the incorrect type is received', function() {
    waitForEventTask.run();

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.RUNNING);

    eventTarget.dispatchEvent('incorrect-type');

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.RUNNING);
  });

  it('should only complete once even if multiple matching events are dispatched', function() {
    waitForEventTask.run();

    eventTarget.dispatchEvent(eventType);

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.COMPLETED);

    eventTarget.dispatchEvent(eventType); // Will error if task tries to complete again
  });

  it('should not complete when an event is dispatched before running', function() {
    eventTarget.dispatchEvent(eventType);

    waitForEventTask.run();
    
    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.RUNNING);
  });

  it('should not complete when an event is dispatched while interrupted', function() {
    waitForEventTask.run();
    waitForEventTask.interrupt();

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);

    eventTarget.dispatchEvent(eventType);

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);
  });

  it('should reattach listener when rerun after an interruption', function() {
    waitForEventTask.run();
    waitForEventTask.interrupt();

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.INTERRUPTED);

    waitForEventTask.run();

    eventTarget.dispatchEvent(eventType);

    expect(waitForEventTask.getState()).toBe(taskrunner.TaskState.COMPLETED);
  });
});
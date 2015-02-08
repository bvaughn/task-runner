goog.provide('tr.Listener.test');
goog.setTestOnly('tr.Listener.test');

goog.require('goog.events.EventTarget');
goog.require('tr.Listener');
goog.require('tr.enums.State');

describe('tr.Listener', function() {

  var eventTarget;
  var eventType = 'click';
  var waitForEventTask;

  beforeEach(function() {
    eventTarget = new goog.events.EventTarget();

    waitForEventTask = new tr.Listener(eventTarget, eventType);
  });

  it('should complete when an event of the correct type is received', function() {
    waitForEventTask.run();

    expect(waitForEventTask.getState()).toBe(tr.enums.State.RUNNING);

    eventTarget.dispatchEvent(eventType);

    expect(waitForEventTask.getState()).toBe(tr.enums.State.COMPLETED);
    expect(waitForEventTask.getData()).toBeTruthy();
  });

  it('should not complete when an event of the incorrect type is received', function() {
    waitForEventTask.run();

    expect(waitForEventTask.getState()).toBe(tr.enums.State.RUNNING);

    eventTarget.dispatchEvent('incorrect-type');

    expect(waitForEventTask.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should only complete once even if multiple matching events are dispatched', function() {
    waitForEventTask.run();

    eventTarget.dispatchEvent(eventType);

    expect(waitForEventTask.getState()).toBe(tr.enums.State.COMPLETED);

    eventTarget.dispatchEvent(eventType); // Will error if task tries to complete again
  });

  it('should not complete when an event is dispatched before running', function() {
    eventTarget.dispatchEvent(eventType);

    waitForEventTask.run();
    
    expect(waitForEventTask.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should not complete when an event is dispatched while interrupted', function() {
    waitForEventTask.run();
    waitForEventTask.interrupt();

    expect(waitForEventTask.getState()).toBe(tr.enums.State.INTERRUPTED);

    eventTarget.dispatchEvent(eventType);

    expect(waitForEventTask.getState()).toBe(tr.enums.State.INTERRUPTED);
  });

  it('should reattach listener when rerun after an interruption', function() {
    waitForEventTask.run();
    waitForEventTask.interrupt();

    expect(waitForEventTask.getState()).toBe(tr.enums.State.INTERRUPTED);

    waitForEventTask.run();

    eventTarget.dispatchEvent(eventType);

    expect(waitForEventTask.getState()).toBe(tr.enums.State.COMPLETED);
  });
});
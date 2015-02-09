goog.provide('tr.app.Application.test');
goog.setTestOnly('tr.app.Application.test');

goog.require('tr.app.Application');
goog.require('tr.app.State');
goog.require('tr.enums.State');

describe('tr.app.Application', function() {

  var application;
  var stateTaskA;
  var stateTaskB;
  
  beforeEach(function() {
    application = new tr.app.Application();

    stateTaskA = new tr.app.State(application);
    stateTaskA.add(new tr.Sleep());
    
    stateTaskB = new tr.app.State(application);
    stateTaskB.add(new tr.Sleep());
  });

  it('should automatically run when the first state is entered', function() {
    application.enterState(stateTaskA);

    expect(stateTaskA.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should interrupt its current state when a new state is entered', function() {
    application.enterState(stateTaskA);

    expect(application.getState()).toBe(stateTaskA);
    expect(stateTaskA.getState()).toBe(tr.enums.State.RUNNING);
    expect(stateTaskB.getState()).toBe(tr.enums.State.INITIALIZED);

    application.enterState(stateTaskB);

    expect(application.getState()).toBe(stateTaskB);
    expect(stateTaskA.getState()).toBe(tr.enums.State.INTERRUPTED);
    expect(stateTaskB.getState()).toBe(tr.enums.State.RUNNING);
  });

  it('should restart the current state if it is reentered', function() {
    application.enterState(stateTaskA);

    expect(application.getState()).toBe(stateTaskA);
    expect(stateTaskA.getState()).toBe(tr.enums.State.RUNNING);

    application.enterState(stateTaskA);

    expect(application.getState()).toBe(stateTaskA);
    expect(stateTaskA.getState()).toBe(tr.enums.State.RUNNING);
  });
});
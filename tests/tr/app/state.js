goog.provide('tr.app.State.test');
goog.setTestOnly('tr.app.State.test');

goog.require('tr.app.Application');
goog.require('tr.Stub');
goog.require('tr.app.State');

describe('tr.app.State', function() {

  var application;
  var nullTaskA;
  var nullTaskB;
  
  beforeEach(function() {
    application = new tr.app.Application();

    nullTaskA = new tr.Stub();
    nullTaskB = new tr.Stub();
  });

  it('should expose the application', function() {
    var stateTask = new tr.app.State(application);

    expect(stateTask.getApplication()).toBe(application);
  });
});
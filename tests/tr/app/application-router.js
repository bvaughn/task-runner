goog.provide('tr.app.ApplicationRouter.test');
goog.setTestOnly('tr.app.ApplicationRouter.test');

goog.require('tr.app.Application');
goog.require('tr.Stub');
goog.require('tr.app.State');
goog.require('goog.testing.PropertyReplacer');

describe('tr.app.ApplicationRouter', function() {

  var application;
  var applicationRouter;
  var defaultState;
  var mockWindow;
  var factoryFunctionParams;
  var stateA;
  var stateAFactory;
  var stateB;
  var stateBFactory;
  
  beforeEach(function() {
    application = new tr.app.Application();
    applicationRouter = new tr.app.ApplicationRouter(application);
    applicationRouter.setDefaultRoute(
      function() {
        defaultState = new tr.app.State("Default State");

        return defaultState;
      });

    stateAFactory = function(params) {
      factoryFunctionParams = params;
      stateA = new tr.app.State("State A");

      return stateA;
    };

    stateBFactory = function(params) {
      factoryFunctionParams = params;
      stateB = new tr.app.State("State B");

      return stateB;
    };

    mockWindow = {
      addEventListener: function(eventType, handler) {
        mockWindow.handler_ = handler;
      },
      dispatchEvent: function(event) {
        mockWindow.handler_(event);
      },
      location: {
        hash: '',
        search: ''
      }
    };

    var propertyReplacer = new goog.testing.PropertyReplacer();
    propertyReplacer.set(goog.window, 'location', mockWindow.location);
    propertyReplacer.set(goog.window, 'addEventListener', mockWindow.addEventListener);
  });

  function setUrl(url, search) {
    mockWindow.location.hash = '#' + url; // TODO Update this once better URL support is implemented in ApplicationRouter
    
    if (search) {
      mockWindow.location.search = '?' + search;
    }
  }

  it('should error if a default state is not provided', function() {
    expect(function() {
      applicationRouter = new tr.app.ApplicationRouter(application);
      applicationRouter.start();
    }).toThrow();
  });

  it('should enter a default state if no other routes are specified', function() {
    applicationRouter.start();

    expect(defaultState).toBeTruthy();
    expect(application.getState()).toBe(defaultState);
  });

  it('should enter a state if its path matches the current URL', function() {
    setUrl('/some/state');

    applicationRouter.addPath('/some/state', stateAFactory);
    applicationRouter.start();

    expect(stateA).toBeTruthy();
    expect(application.getState()).toBe(stateA);
  });

  it('should enter a default state if no path matches the current URL', function() {
    setUrl('/something/else');

    applicationRouter.addPath('/some/state', stateAFactory);
    applicationRouter.start();

    expect(defaultState).toBeTruthy();
    expect(application.getState()).toBe(defaultState);
  });

  it('should ignore partial matches in favor of full matches', function() {
    setUrl('/user/123/posts');

    applicationRouter.addPath('/user/:userId', stateAFactory);
    applicationRouter.addPath('/user/:userId/posts', stateBFactory);
    applicationRouter.start();

    expect(stateB).toBeTruthy();
    expect(application.getState()).toBe(stateB);
  });

  it('should pass state parameters to factory function for matches', function() {
    setUrl('/user/ABC/post/XYZ');

    applicationRouter.addPath('/user/:userId/post/:postId', stateAFactory);
    applicationRouter.start();

    expect(factoryFunctionParams).toBeTruthy();
    expect(factoryFunctionParams.userId).toBe('ABC');
    expect(factoryFunctionParams.postId).toBe('XYZ');
  });

  it('should pass state parameters to factory function for query string matches', function() {
    setUrl('/contacts', 'myParam1=value1&myParam2=wowcool');

    applicationRouter.addPath('/contacts?myParam1&myParam2', stateAFactory);
    applicationRouter.start();

    expect(factoryFunctionParams).toBeTruthy();
    expect(factoryFunctionParams.myParam1).toBe('value1');
    expect(factoryFunctionParams.myParam2).toBe('wowcool');
  });

  it('should change states when a HASHCHANGE event is fired', function() {
    setUrl('/something/else');

    applicationRouter.addPath('/some/state', stateAFactory);
    applicationRouter.start();

    expect(defaultState).toBeTruthy();
    expect(application.getState()).toBe(defaultState);

    setUrl('/some/state');

    mockWindow.dispatchEvent({type: 'HASHCHANGE'});

    expect(stateA).toBeTruthy();
    expect(application.getState()).toBe(stateA);
  });
});
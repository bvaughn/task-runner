angular.module('taskRunner', ['ui.bootstrap', 'ui.router', 'ngSanitize', 'btford.markdown']).
  config(function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('index', {
      url: '/',
      templateUrl: 'app/views/index.html'
    });

    $stateProvider.state('getting-started-what-is-a-task', {
      url: '/getting-started/what-is-a-task',
      templateUrl: 'app/views/getting-started/what-is-a-task.html'
    });
    $stateProvider.state('getting-started-creating-tasks', {
      url: '/getting-started/creating-tasks',
      templateUrl: 'app/views/getting-started/creating-tasks.html'
    });
    $stateProvider.state('getting-started-chaining-tasks', {
      url: '/getting-started/chaining-tasks',
      templateUrl: 'app/views/getting-started/chaining-tasks.html'
    });
    $stateProvider.state('getting-started-working-with-promises', {
      url: '/getting-started/working-with-promises',
      templateUrl: 'app/views/getting-started/working-with-promises.html'
    });

    $stateProvider.state('sample-application-1', {
      url: '/samples-and-demos/demo-1',
      templateUrl: 'app/views/samples/demo-1.html'
    });
    $stateProvider.state('sample-application-2', {
      url: '/samples-and-demos/demo-2',
      templateUrl: 'app/views/samples/demo-2.html'
    });
    $stateProvider.state('sample-animation', {
      url: '/samples-and-demos/animation-1',
      templateUrl: 'app/views/samples/animation-1.html'
    });

    $stateProvider.state('contact', {
      url: '/contact',
      templateUrl: 'app/views/contact.html'
    });

    $stateProvider.state('license', {
      url: '/license',
      templateUrl: 'app/views/license.html'
    });

    $stateProvider.state('documentation', {
      url: '/documentation',
      templateUrl: 'app/views/documentation/layout.html'
    });
    $stateProvider.state('documentation.index', {
      parent: 'documentation',
      url: '/index',
      templateUrl: 'app/views/documentation/index.html'
    });
    $stateProvider.state('documentation.tr-Abstract', {
      parent: 'documentation',
      url: '/tr-Abstract',
      templateUrl: 'app/views/documentation/tr-Abstract.html'
    });
    $stateProvider.state('documentation.tr-Chain', {
      parent: 'documentation',
      url: '/tr-Chain',
      templateUrl: 'app/views/documentation/tr-Chain.html'
    });
    $stateProvider.state('documentation.tr-Closure', {
      parent: 'documentation',
      url: '/tr-Closure',
      templateUrl: 'app/views/documentation/tr-Closure.html'
    });
    $stateProvider.state('documentation.tr-Composite', {
      parent: 'documentation',
      url: '/tr-Composite',
      templateUrl: 'app/views/documentation/tr-Composite.html'
    });
    $stateProvider.state('documentation.tr-Factory', {
      parent: 'documentation',
      url: '/tr-Factory',
      templateUrl: 'app/views/documentation/tr-Factory.html'
    });
    $stateProvider.state('documentation.tr-Failsafe', {
      parent: 'documentation',
      url: '/tr-Failsafe',
      templateUrl: 'app/views/documentation/tr-Failsafe.html'
    });
    $stateProvider.state('documentation.tr-Graph', {
      parent: 'documentation',
      url: '/tr-Graph',
      templateUrl: 'app/views/documentation/tr-Graph.html'
    });
    $stateProvider.state('documentation.tr-Listener', {
      parent: 'documentation',
      url: '/tr-Listener',
      templateUrl: 'app/views/documentation/tr-Listener.html'
    });
    $stateProvider.state('documentation.tr-Observer', {
      parent: 'documentation',
      url: '/tr-Observer',
      templateUrl: 'app/views/documentation/tr-Observer.html'
    });
    $stateProvider.state('documentation.tr-Promise', {
      parent: 'documentation',
      url: '/tr-Promise',
      templateUrl: 'app/views/documentation/tr-Promise.html'
    });
    $stateProvider.state('documentation.tr-Retry', {
      parent: 'documentation',
      url: '/tr-Retry',
      templateUrl: 'app/views/documentation/tr-Retry.html'
    });
    $stateProvider.state('documentation.tr-Sleep', {
      parent: 'documentation',
      url: '/tr-Sleep',
      templateUrl: 'app/views/documentation/tr-Sleep.html'
    });
    $stateProvider.state('documentation.tr-StopOnSuccess', {
      parent: 'documentation',
      url: '/tr-StopOnSuccess',
      templateUrl: 'app/views/documentation/tr-StopOnSuccess.html'
    });
    $stateProvider.state('documentation.tr-Stub', {
      parent: 'documentation',
      url: '/tr-Stub',
      templateUrl: 'app/views/documentation/tr-Stub.html'
    });
    $stateProvider.state('documentation.tr-Timeout', {
      parent: 'documentation',
      url: '/tr-Timeout',
      templateUrl: 'app/views/documentation/tr-Timeout.html'
    });
    $stateProvider.state('documentation.tr-Tween', {
      parent: 'documentation',
      url: '/tr-Tween',
      templateUrl: 'app/views/documentation/tr-Tween.html'
    });
    $stateProvider.state('documentation.tr-Xhr', {
      parent: 'documentation',
      url: '/tr-Xhr',
      templateUrl: 'app/views/documentation/tr-Xhr.html'
    });
    $stateProvider.state('documentation.tr-app-ApplicationRouter', {
      parent: 'documentation',
      url: '/tr-app-ApplicationRouter',
      templateUrl: 'app/views/documentation/tr-app-ApplicationRouter.html'
    });
    $stateProvider.state('documentation.tr-app-Application', {
      parent: 'documentation',
      url: '/tr-app-Application',
      templateUrl: 'app/views/documentation/tr-app-Application.html'
    });
    $stateProvider.state('documentation.tr-app-State', {
      parent: 'documentation',
      url: '/tr-app-State',
      templateUrl: 'app/views/documentation/tr-app-State.html'
    });
    $stateProvider.state('documentation.tr-app-TransitionState', {
      parent: 'documentation',
      url: '/tr-app-TransitionState',
      templateUrl: 'app/views/documentation/tr-app-TransitionState.html'
    });
    $stateProvider.state('documentation.tr-app-UrlMatcher', {
      parent: 'documentation',
      url: '/tr-app-UrlMatcher',
      templateUrl: 'app/views/documentation/tr-app-UrlMatcher.html'
    });
    $stateProvider.state('documentation.tr-enums-Event', {
      parent: 'documentation',
      url: '/tr-enums-Event',
      templateUrl: 'app/views/documentation/tr-enums-Event.html'
    });
    $stateProvider.state('documentation.tr-enums-State', {
      parent: 'documentation',
      url: '/tr-enums-State',
      templateUrl: 'app/views/documentation/tr-enums-State.html'
    });

    $urlRouterProvider.otherwise('/');
  }).
  run(function($rootScope) {
    $rootScope.$on('$stateChangeSuccess', function() {
       document.body.scrollTop = document.documentElement.scrollTop = 0;
    });
  });
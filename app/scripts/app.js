angular.module('taskRunner', ['ui.bootstrap', 'ui.router', 'ngSanitize', 'btford.markdown']).
  config(function($locationProvider, $stateProvider, $urlRouterProvider) {
    $locationProvider.html5Mode(false);

    $stateProvider.state('index', {
      url: '/',
      templateUrl: 'app/views/index.html'
    });

    // Getting started
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

    // Tutorials
    $stateProvider.state('tutorial-typing-with-interval', {
      url: '/tutorials/typing-with-interval',
      templateUrl: 'app/views/tutorials/typing-with-interval.html'
    });
    $stateProvider.state('tutorial-crossfade-with-tween', {
      url: '/tutorials/crossfade-with-tween',
      templateUrl: 'app/views/tutorials/crossfade-with-tween.html'
    });

    // Demos
    $stateProvider.state('graph-and-tween-sample', {
      url: '/demos/graph-and-tween-sample',
      templateUrl: 'app/views/demos/graph-and-tween-sample.html'
    });
    $stateProvider.state('composite-and-xhr-sample', {
      url: '/demos/composite-and-xhr-sample',
      templateUrl: 'app/views/demos/composite-and-xhr-sample.html'
    });
    $stateProvider.state('chain-and-closure-animation', {
      url: '/demos/chain-and-closure-animation',
      templateUrl: 'app/views/demos/chain-and-closure-animation.html'
    });

    // API docuumentation
    $stateProvider.state('documentation', {
      url: '/documentation',
      templateUrl: 'app/views/documentation/layout.html'
    });
    $stateProvider.state('documentation.index', {
      parent: 'documentation',
      url: '/index',
      templateUrl: 'app/views/documentation/index.html'
    });
    $stateProvider.state('documentation.forClass', {
      parent: 'documentation',
      url: '/:className',
      templateUrl: 'app/views/documentation/for-class.html',
      controller: function ($scope, $stateParams) {
        if ($stateParams.className) {
          $scope.templateUrl = 'app/views/documentation/classes/' + $stateParams.className + '.html';
        } else {
          $scope.templateUrl = 'app/views/documentation/index.html';
        }
      }
    });

    $stateProvider.state('contact', {
      url: '/contact',
      templateUrl: 'app/views/contact.html'
    });

    $stateProvider.state('license', {
      url: '/license',
      templateUrl: 'app/views/license.html'
    });

    $urlRouterProvider.otherwise('/');
  }).
  run(function($rootScope) {
    $rootScope.$on('$stateChangeSuccess', function() {
       document.body.scrollTop = document.documentElement.scrollTop = 0;
    });
  });
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

    $stateProvider.state('graph-and-tween-sample', {
      url: '/samples-and-demos/graph-and-tween-sample',
      templateUrl: 'app/views/samples/graph-and-tween-sample.html'
    });
    $stateProvider.state('composite-and-xhr-sample', {
      url: '/samples-and-demos/composite-and-xhr-sample',
      templateUrl: 'app/views/samples/composite-and-xhr-sample.html'
    });
    $stateProvider.state('chain-and-closure-animation', {
      url: '/samples-and-demos/chain-and-closure-animation',
      templateUrl: 'app/views/samples/chain-and-closure-animation.html'
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

    $urlRouterProvider.otherwise('/');
  }).
  run(function($rootScope) {
    $rootScope.$on('$stateChangeSuccess', function() {
       document.body.scrollTop = document.documentElement.scrollTop = 0;
    });
  });
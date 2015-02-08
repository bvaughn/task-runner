angular.module('taskRunner', ['ui.bootstrap', 'ui.router']).
  config(function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('index', {
      url: '/',
      templateUrl: 'app/views/index.html'
    });

    $stateProvider.state('samples', {
      url: '/samples-and-demos',
      templateUrl: 'app/views/samples.html'
    });

    $stateProvider.state('contact', {
      url: '/contact',
      templateUrl: 'app/views/contact.html'
    });

    $stateProvider.state('license', {
      url: '/license',
      templateUrl: 'app/views/license.html'
    });

    $stateProvider.state('animation1', {
      url: '/samples-and-demos/animation-1',
      templateUrl: 'app/views/demos/animation-1.html'
    });

    $stateProvider.state('demo1', {
      url: '/samples-and-demos/demo-1',
      templateUrl: 'app/views/demos/demo-1.html'
    });

    $stateProvider.state('demo2', {
      url: '/samples-and-demos/demo-2',
      templateUrl: 'app/views/demos/demo-2.html'
    });

    $urlRouterProvider.otherwise('/');
  });

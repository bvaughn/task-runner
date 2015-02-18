angular.module('taskRunner').directive('prism',
  function($compile, $http) {
    return {
      restrict: 'EA',
      link: function($scope, $element, $attributes) {
        var parser = $attributes.hasOwnProperty('parser') ? $attributes['parser'] : 'markup';

        var highlight = function(text) {
          var html = Prism.highlight(text, Prism.languages[parser]);

          $element.html('<pre class="language-' + parser + '"><code>' + html + '</code></pre>');
        };

        var showError = function() {
          $element.html('<p class="alert alert-danger"><i class="fa fa-times"></i> The specified template could not be loaded.</p>');
        };

        if ($attributes.source) {
          $element.html('<i class="fa fa-spin fa-spinner"></i> Loading...');

          $http({method: 'GET', url: $attributes.source}).
            success(
              function(data) {
                if (data) {
                  highlight(data);
                } else {
                  showError();
                }
              }).
            error(showError);
        } else {
          highlight($element.html());
        }
      }
    };
});

angular.module('taskRunner').directive('markdown',
  function($http, $sanitize, markdownConverter) {
    var DOCS_BASE_URL = 'https://rawgit.com/bvaughn/task-runner/master/source/';
    
    return {
      restrict: 'EA',
      link: function($scope, $element, $attributes) {
        var url = DOCS_BASE_URL + $attributes.src;

        $http.get(url).
          success(function(data, status, headers, config) {
            var html = data ? $sanitize(markdownConverter.makeHtml(data)) : '';
            $element.html(html);
          }).
          error(function(data, status, headers, config) {
            $element.html('Error');
          });
      }
    };
  });

angular.module('taskRunner').directive('usage',
  function() {
    return {
      restrict: 'EA',
      scope: {
        source: '@'
      },
      templateUrl: 'app/views/directives/usage.html'
    };
  });

angular.module('taskRunner').directive('signature',
  function() {
    return {
      restrict: 'EA',
      scope: {
        params: '=?',
        returnType: '@'
      },
      link: function($scope, $element, $attributes) {
        if ($attributes.return) {
          if ($attributes.return.indexOf('{') >= 0) {
            var parsed = $scope.$eval($attributes.return);

            $scope.returnDescription = parsed.description;
            $scope.returnType = parsed.type;
          } else {
            $scope.returnType = $attributes.return;
          }
        }
      },
      templateUrl: 'app/views/directives/signature.html'
    };
  });

angular.module('taskRunner').directive('throws',
  function() {
    return {
      restrict: 'EA',
      scope: {
        errors: '='
      },
      templateUrl: 'app/views/directives/throws.html'
    };
  });

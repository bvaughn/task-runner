/**
 * Loads an external source file with Prism JS syntax highlighting.
 */
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

/**
 * Renders example usage code snippets using the Prism JS library for syntax highlighting.
 */
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

/**
 * Renders a method signature doc including (optional) typed parameters and (optional) return type information.
 */
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

/**
 * Renders a template displaying the various errors a method may throw.
 */
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

/**
 * Renders a class type with a link to the source code and a docs issue button.
 */
angular.module('taskRunner').directive('classname',
  function() {
    return {
      restrict: 'EA',
      scope: {
        name: '@',
        source: '@',
        super: '@?'
      },
      templateUrl: 'app/views/directives/classname.html'
    };
  });
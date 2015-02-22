var gulp = require('gulp');
var karma = require('gulp-karma');

var sources = [
  'source/*.ts',
  'source/tr/*.ts',
  'source/tr/enums/*.ts'
];
var sourcesWithApps = [
  'source/*.ts',
  'source/tr/*.ts',
  'source/tr/app/*.ts',
  'source/tr/enums/*.ts'
];
var testFiles = []; // Declared in the karma.conf.js

gulp.task('all', ['test', 'build']);
 
gulp.task('build', function() {
  buildHelper(sources, 'dist/task-runner', 'task-runner.js');
  buildHelper(sourcesWithApps, 'dist/task-runner-engine', 'task-runner.js');
});

/* Disabled for now due to poor formatting
gulp.task('docs', function() {
  var gulpDoxx = require('gulp-doxx');
 
  gulp.src([
      'source/tr/*.ts'
    ])
    .pipe(gulpDoxx({
      urlPrefix: 'http://rawgit.com/bvaughn/task-runner/master/docs/',
      title: 'Task Runner'
    }))
    .pipe(gulp.dest('docs'));
});
*/

gulp.task('test', function() {
  // Be sure to return the stream 
  return gulp.src(testFiles)
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'run'
    }))
    .on('error', function(err) {
      // Make sure failed tests cause gulp to exit non-zero 
      throw err;
    });
});

gulp.task('test:watch', function() {
  gulp.src(testFiles)
    .pipe(karma({
      configFile: 'karma.conf.js',
      action: 'watch'
    }));
});

var buildHelper = function(sources, directory, outputFile) {
  var typeScriptCompiler = require('gulp-tsc');

  gulp
    .src(sources)
    .pipe(typeScriptCompiler({
      module: "CommonJS",
      sourcemap: true,
      sourceRoot: "../../source/tr/",
      emitError: false,
      out: outputFile
    }))
    .pipe(gulp.dest(directory));
};
module.exports = function(grunt) {
  grunt.initConfig({
    jsdoc: {
      dist: {
        src: [
          'source/**/*.js',
          'source/README.md'
        ], 
        options: {
          destination: 'docs',
          private: false,
          template: "node_modules/jaguarjs-jsdoc/"
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('docs', ['jsdoc']);
  grunt.registerTask('docs', 'Generates documentation using Jsdoc3', function() {
    var tasks = ['jsdoc'];

    // Use the force option to ignore @private tag warnings
    grunt.option('force', true);

    grunt.task.run(tasks);
});
};

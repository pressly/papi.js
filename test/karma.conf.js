module.exports = function(config) {
  config.set({
    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,

    basePath: '../',
    frameworks: ['browserify', 'mocha'],

//    browsers: ['Chrome', 'Firefox'],

    files: [ 'test/**/*.js' ],
    exclude: [ ],

    preprocessors: {
      'test/**/*.js': ['browserify']
    },

    browserify: {
      debug: true,
      transform: [ 'babelify' ]
    }
  });
};

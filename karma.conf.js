// Karma configuration
// Generated on Thu Aug 20 2015 17:39:34 GMT-0400 (EDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'mocha'],

    client: {
      mocha: {
        reporter: 'html', // change Karma's debug.html to the mocha web reporter
        ui: 'bdd'
      }
    },

    // list of files / patterns to load in the browser
    files: [
      './node_modules/phantomjs-polyfill/bind-polyfill.js',
      'test/**/*.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/**/*.js': ['browserify']
    },

    browserify: {
      debug: true,
      transform: ['babelify'],
      extensions: ['.js']
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    //reporters: ['progress'],
    reporters: ['dots', 'saucelabs'],
    //reporters: ['spec'], // just like mocha


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    browserStack: {
      username: 'jeffbrenner',
      accessKey: 'Spvs8gA6h4HkqR9Ttz3r'
    },

    sauceLabs: {
      testName: 'Papi.js'
    },

    // define browsers
    customLaunchers: {
      bs_chrome_mac: {
        base: 'BrowserStack',
        browser: 'chrome',
        browser_version: '47.0',
        os: 'OS X',
        os_version: 'El Capitan'
      },
      bs_firefox_mac: {
        base: 'BrowserStack',
        browser: 'firefox',
        browser_version: '21.0',
        os: 'OS X',
        os_version: 'Mountain Lion'
      },
      bs_iphone5: {
        base: 'BrowserStack',
        device: 'iPhone 5',
        os: 'ios',
        os_version: '6.0'
      },
      bs_ie11_windows8: {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '11',
        os: 'Windows',
        os_version: '8.1'
      },
      bs_ie10_windows7: {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '10',
        os: 'Windows',
        os_version: '7'
      },
      bs_ie9_windows7: {
        base: 'BrowserStack',
        browser: 'ie',
        browser_version: '9',
        os: 'Windows',
        os_version: '7'
      },
      sl_chrome: {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'Windows 7',
        version: '35'
      },
      sl_firefox: {
        base: 'SauceLabs',
        browserName: 'firefox',
        version: '30'
      },
      sl_ios_safari: {
        base: 'SauceLabs',
        browserName: 'iphone',
        platform: 'OS X 10.9',
        version: '7.1'
      },
      sl_ie_11: {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 8.1',
        version: '11'
      }
    },




    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    //browsers: ['Chrome', 'Firefox', 'PhantomJS'],
    //browsers: ['PhantomJS'],
    //browsers: ['bs_firefox_mac', 'bs_iphone5', 'bs_ie11_windows8', 'bs_ie10_windows7', 'bs_ie9_windows7'],
    //browsers: ['bs_chrome_mac', 'bs_ie11_windows8', 'bs_ie9_windows7'],
    //browsers: ['bs_ie9_windows7'],
    browsers: ['sl_ie_11'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true
  })
}

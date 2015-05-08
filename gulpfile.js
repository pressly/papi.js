var gulp       = require('gulp')
  , connect    = require('gulp-connect')
  , browserify = require('browserify')
  , source     = require('vinyl-source-stream')
  , babelify   = require('babelify');

gulp.task('build', function () {
  return browserify({ entries: './src/index.js' })
    .transform(babelify)
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./build/'))
    .pipe(connect.reload());
});

gulp.task('connect', function() {
  connect.server({
    root: '.',
    port: '5555',
    livereload: true
  });
});

gulp.task('watch', function () {
  gulp.watch('src/**/*.js', { debounceDelay: 2000 }, ['build']);
});

gulp.task('default', ['connect', 'watch']);

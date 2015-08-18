var gulp       = require('gulp');
var connect    = require('gulp-connect');

gulp.task('build:es6', function() {
  return gulp.src('src/**/*.js')
    //.pipe(babel({loose: 'all', optional: ['runtime']}))
    .pipe(require('gulp-babel')({loose: 'all'}))
    .pipe(gulp.dest('build'));
});

gulp.task('build', ['build:es6'], function () {
  return require('browserify')({ entries: './build/index.js', standalone: 'Papi' })
    .bundle()
    .pipe(require('vinyl-source-stream')('papi.js'))
    .pipe(gulp.dest('build'))
    .pipe(connect.reload());
});

gulp.task('dist:minify', ['build'], function() {
  return gulp.src('build/papi.js')
  .pipe(require('gulp-size')({showFiles: true}))
  .pipe(require('gulp-rename')('papi.min.js'))
  .pipe(require('gulp-uglify')({mangle: true, preserveComments: 'some'}))
  .pipe(require('gulp-size')({showFiles: true}))
  .pipe(require('gulp-size')({showFiles: true, gzip: true}))
  .pipe(gulp.dest('dist'));
});

gulp.task('dist', ['build', 'dist:minify'], function() {
  return gulp.src('build/**/*')
  .pipe(gulp.dest('dist'));
});

gulp.task('connect', function() {
  connect.server({
    root: '.',
    port: '5555',
    livereload: true
  });
});

gulp.task('watch', function () {
  gulp.watch('src/**/*.js', { debounceDelay: 2000 }, ['build:bundle']);
});

gulp.task('default', ['connect', 'watch']);

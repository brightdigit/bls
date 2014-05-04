var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    bump = require('gulp-bump'),
    jshint = require('gulp-jshint'),
    beautify = require('gulp-beautify'),
    istanbul = require("gulp-istanbul"),
    coveralls = require('gulp-coveralls'),
    less = require('gulp-less'),
    bower = require('bower'),
    bowerRequireJS = require('bower-requirejs'),
    requirejs = require('requirejs'),
    es = require('event-stream'),
    coverageEnforcer = require("gulp-istanbul-enforcer"),
    jstConcat = require('gulp-jst-concat'),
    jst = require('gulp-jst');

gulp.task('default', ['JST', 'requirejs', 'less', 'beautify', 'lint', 'copy', 'test', 'enforce-coverage', 'coveralls', 'bump']);

gulp.task('JST', function () {
  gulp.src('static/templates/**/*html').pipe(jst()).pipe(jstConcat('jst.js', {
    renameKeys: ['^.*templates/(.*).js$', '$1'],
    amd: true
  })).pipe(gulp.dest('.tmp'));
});

gulp.task('copy', function () {
  //    gulp.src('src/**/*.html').pipe(gulp.dest('dist'));
  es.merge(
  gulp.src('bower_components/requirejs/require.js').pipe(gulp.dest('public/js')), gulp.src('static/html/*.html').pipe(gulp.dest('public')));
});

gulp.task('less', ['bower'], function () {
  gulp.src('static/less/**/*.less').pipe(less()).pipe(gulp.dest('public/css'));
});

gulp.task('bower', function (cb) {
  var install = bower.commands.install();

  install.on('log', function (message) {
    console.log(message);
  });
  install.on('error', function (error) {
    console.log(error);
    cb(error);
  });
  install.on('end', cb.bind(undefined, undefined));
  // place code for your default task here
});

gulp.task('bowerrjs', ['bower'], function (cb) {
  gulp.src("static/js/config.js").pipe(gulp.dest(".tmp"));
  var options = {
    config: ".tmp/config.js",
    baseUrl: 'js',
    transitive: true
  };

  bowerRequireJS(options, function (result) {
    console.log(result);
    cb(undefined, result);
  });
});

gulp.task('requirejs', ['bower', 'bowerrjs'], function (cb) {
  var config = {
    mainConfigFile: ".tmp/config.js",
    baseUrl: 'static/js',
    name: 'main',
    out: 'public/js/script.js',
    optimize: 'none'
  };

  requirejs.optimize(config, cb.bind(undefined, undefined), cb);
});

gulp.task('coveralls', ['enforce-coverage'], function () {
  gulp.src('coverage/**/lcov.info').pipe(coveralls());
});

gulp.task('enforce-coverage', ['test'], function () {
  var options = {
    thresholds: {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95
    },
    coverageDirectory: 'coverage',
    rootDirectory: ''
  };
  return gulp.src(['./static/js/**/*.js', './app/**/*.js']).pipe(coverageEnforcer(options));
});

gulp.task('test', function (cb) {
  gulp.src(['./static/js/**/*.js', './app/**/*.js']).pipe(istanbul()) // Covering files
  .on('end', function () {
    gulp.src(["./test/**/*.js"]).pipe(mocha()).pipe(istanbul.writeReports()) // Creating the reports after tests runned
    .on('end', cb);
  });
});

gulp.task('bump', function () {
  gulp.src(['./package.json', './bower.json']).pipe(bump({
    type: 'patch'
  })).pipe(gulp.dest('./'));
});

gulp.task('lint', function () {
  gulp.src(['./app/**/*.js', './test/**/*.js', './gulpfile.js', 'static/js/**/*.js']).pipe(jshint()).pipe(jshint.reporter('default'));
});

gulp.task('beautify', function () {
  gulp.src(['./app/**/*.js', './test/**/*.js', './gulpfile.js', 'static/js/**/*.js'], {
    base: '.'
  }).pipe(beautify({
    indentSize: 2,
    preserveNewlines: true
  })).pipe(gulp.dest('.'));
});
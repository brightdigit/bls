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
    jst = require('gulp-jst'),
    clean = require('gulp-clean'),
    nimport = require('node-nimport'),
    databaseConfig = require('./bls.ap.json'),
    expressService = require('gulp-express-service');

gulp.task('default', ['requirejs', 'less', 'copy', 'test', 'enforce-coverage', 'coveralls', 'bump']);

gulp.task('clean', function () {
  return gulp.src(['public', '.tmp'], {
    read: false
  }).pipe(clean());
});

gulp.task('express', ['requirejs', 'less', 'copy', 'bump'], function (cb) {
  return gulp.src(['./app/index/js']).pipe(expressService({
    file: './app/index.js',
    NODE_ENV: 'DEV'
  }));
});

gulp.task('database', function (cb) {
  var run = nimport.run(databaseConfig);

  run.on("error", function (error) {
    console.log(error);
    cb(error);
  });

  run.on("end", cb);
});

gulp.task('heroku:production', ['default']);
gulp.task('JST', ['clean'], function () {
  return gulp.src('static/templates/**/*html').pipe(jstConcat('jst.js', {
    renameKeys: ['^.*templates[/|\\\\](.*).html$', '$1'],
    amd: true
  })).pipe(gulp.dest('.tmp'));
});

gulp.task('copy', ['clean', 'bower'], function () {
  //    gulp.src('src/**/*.html').pipe(gulp.dest('dist'));
  return es.merge(
  gulp.src('bower_components/requirejs/require.js').pipe(gulp.dest('public/js')), gulp.src('static/html/*.html').pipe(gulp.dest('public')), gulp.src('static/fonts/**/*.*').pipe(gulp.dest('public/fonts')), gulp.src('bower_components/bootstrap/fonts/*.*').pipe(gulp.dest('public/fonts/bootstrap')), gulp.src('static/images/**/*.*').pipe(gulp.dest('public/images')));
});

gulp.task('less', ['bower'], function () {
  return gulp.src('static/less/**/*.less').pipe(less()).pipe(gulp.dest('public/css'));
});

gulp.task('bower', function (cb) {
  var install = bower.commands.install();

  install.on('log', function (message) {
    //console.log(message);
  });
  install.on('error', function (error) {
    console.log(error);
    cb(error);
  });
  install.on('end', cb.bind(undefined, undefined));
  // place code for your default task here
});

gulp.task('copy-rjs-config', ['clean'], function () {
  return gulp.src("static/js/config.js").pipe(gulp.dest(".tmp"));
});


gulp.task('bowerrjs', ['bower', 'copy-rjs-config'], function (cb) {
  var options = {
    config: ".tmp/config.js",
    baseUrl: 'static/js',
    transitive: true
  };

  bowerRequireJS(options, function (result) {
    console.log(result);
    cb(undefined, result);
  });
});

gulp.task('requirejs', ['bowerrjs', 'JST', 'beautify'], function (cb) {
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
  return gulp.src('coverage/**/lcov.info').pipe(coveralls());
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

gulp.task('lint', ['beautify'], function () {
  return gulp.src(['./app/**/*.js', './test/**/*.js', './gulpfile.js', 'static/js/**/*.js']).pipe(jshint()).pipe(jshint.reporter('default'));
});

gulp.task('beautify', function () {
  gulp.src(['./app/**/*.js', './test/**/*.js', './gulpfile.js', 'static/js/**/*.js'], {
    base: '.'
  }).pipe(beautify({
    indentSize: 2,
    preserveNewlines: true
  })).pipe(gulp.dest('.'));
});
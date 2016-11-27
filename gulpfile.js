'use strict';
var gulp = require('gulp');
var electron = require('electron-connect').server.create();

// ts
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
// var tsProject = ts.createProject('tsconfig.json');
// var uglify = require('gulp-uglify');
// var rename = require('gulp-rename');
// var del = require('del');

var TS_SRC = './ts/**/*.ts';
var DEST = './dist/';
var JS_DEST = './dist/js/';


var typescript = require('gulp-typescript');

var config = {
    ts : {
        src: [
            './src/ts/*.ts',       // プロジェクトのルート以下すべてのディレクトリの.tsファイルを対象とする
            '!./node_modules/**' // node_modulesは対象外
        ],
        dst: JS_DEST,
        options: { target: 'ES5', module: 'commonjs' }
    }
};

gulp.task('build', function () {
    return gulp.src(config.ts.src)
        .pipe(sourcemaps.init())
        .pipe(typescript(config.ts.options))
        .js
        .pipe(gulp.dest(config.ts.dst));
});

gulp.task('cp-lib', function() {
    gulp.src('src/**/*.!(ts)')
        .pipe(gulp.dest(DEST))
});

gulp.task("watch", function(){
    var watcher = gulp.watch(TS_SRC, ['build']);
    watcher.on('change', function(event) {
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
});

gulp.task('electron', function () {

    // Electronの起動
    electron.start();

    // BrowserProcess(MainProcess)が読み込むリソースが変更されたら, Electron自体を再起動
    gulp.watch(['src/index.js'], electron.restart);

    // RendererProcessが読み込むリソースが変更されたら, RendererProcessにreloadさせる
    gulp.watch(['src/**/*'], ["build", "cp-lib", electron.reload]);
});

gulp.task('default', ['build', 'cp-lib', 'electron']);
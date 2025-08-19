const { src, dest, series, parallel, watch } = require('gulp'); // 引入 Gulp 模块
const sass = require('gulp-dart-sass'); // 使用 Dart Sass 作为 SCSS 处理器
const postcss = require('gulp-postcss'); // PostCSS 处理器
const autoprefixer = require('autoprefixer'); // 自动添加浏览器前缀
const cleanCSS = require('gulp-clean-css'); // 压缩 CSS
const babel = require('gulp-babel'); // 转换 ES6+ 代码
const uglify = require('gulp-uglify'); // 压缩 JS
const htmlmin = require('gulp-htmlmin'); // 压缩 HTML
const connect = require('gulp-connect'); // 实现热重载，启动本地服务器

// 编译 SCSS
function styles() {
  return src('src/css/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(cleanCSS())
    .pipe(dest('dist/css'))
    .pipe(connect.reload());
}

// 编译 JS
function scripts() {
  return src('src/js/**/*.js')
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(uglify())
    .pipe(dest('dist/js'))
    .pipe(connect.reload());
}

// 处理 HTML
function html() {
  return src('src/**/*.html')
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest('dist'))
    .pipe(connect.reload());
}

// 静态资源（图片等）
function assets() {
  return src('src/assets/**/*')
    .pipe(dest('dist/assets'))
    .pipe(connect.reload());
}

// 启动本地开发服务器
function serve() {
  connect.server({
    root: 'dist',
    livereload: true,
    port: 3000
  });

  watch('src/css/**/*.scss', styles);
  watch('src/js/**/*.js', scripts);
  watch('src/**/*.html', html);
  watch('src/assets/**/*', assets);
}

// 构建任务
const build = series(parallel(styles, scripts, html, assets));

exports.styles = styles;
exports.scripts = scripts;
exports.html = html;
exports.assets = assets;
exports.build = build;
exports.serve = series(build, serve);
exports.default = build;

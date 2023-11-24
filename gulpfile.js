import gulp from 'gulp';
import plumber from 'gulp-plumber';
import sass from 'gulp-dart-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import browser from 'browser-sync';
import imagemin, { svgo } from 'gulp-imagemin';
import webp from 'gulp-webp';
import svgstore from 'gulp-svgstore';
import csso from 'postcss-csso';
import {deleteAsync} from 'del';
import rename from 'gulp-rename';
import terser from 'gulp-terser';
import htmlmin from 'gulp-htmlmin';

// HTML

const html = () => {
  return gulp.src('source/*.html')
  // .pipe(htmlmin({ collapseWhitespace: true }))
  .pipe(gulp.dest('build'));
};

// Styles

export const styles = () => {
  return gulp.src('source/sass/style.scss', { sourcemaps: true })
    .pipe(plumber())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer(),
      csso()
    ]))
    .pipe(rename('style.min.css'))
    .pipe(gulp.dest('build/css', { sourcemaps: '.' }))
    .pipe(browser.stream());
}

const vendorCSS = () => {
  return gulp.src('source/css/vendor/*.css*')
  .pipe(gulp.dest('build/css'));
}

// Scripts

const scripts = () => {
  return gulp.src('source/js/*.js')
  .pipe(terser())
  // .pipe(rename('app.min.js'))
  .pipe(gulp.dest('build/js'))
  .pipe(browser.stream());
}

const vendorJS = () => {
  return gulp.src('source/js/vendor/*.js*')
  .pipe(gulp.dest('build/js'));
}

// Images

const images = () => {
  return gulp.src('source/img/**/*.{jpg,png,svg}')
  .pipe(imagemin([
  imagemin.mozjpeg({quality: 75, progressive: true}),
  imagemin.optipng({optimizationLevel: 3}),
  imagemin.svgo({plugins: [{removeViewBox: false}]})
  ]))
  .pipe(gulp.dest('build/img'))
}

const copyImages = () => {
  return gulp.src('source/img/**/*.{jpg,png,svg}')
  .pipe(gulp.dest('build/img'))
}

// WebP

const createWebp = () => {
  return gulp.src(['source/img/**/*.{jpg,png}', '!source/img/icons'])
  .pipe(webp({quality: 90}))
  .pipe(gulp.dest('build/img'))
}

// Sprite

const sprite = () => {
  return gulp.src("source/img/icons/*.svg")
  .pipe(svgstore({
    inlineSvg: true
  }))
  .pipe(rename("sprite.svg"))
  .pipe(gulp.dest("build/img"));
  }

// Copy

const copy = (done) => {
  gulp.src([
  "source/fonts/*.{woff2,woff}",
  // "source/favicon.ico",
  // "source/manifest.webmanifest",
  // "source/apple-touch-icon-precomposed.png",
  ], {
  base: "source"
  })
  .pipe(gulp.dest("build"))
  done();
  }

// Clean

const clean = () => {
  return deleteAsync("build");
  };

// Server

const server = (done) => {
  browser.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

// Reload

const reload = (done) => {
  browser.reload();
  done();
  }

// Watcher

const watcher = () => {
  gulp.watch('source/sass/**/*.scss', gulp.series(styles));
  gulp.watch('source/js/**/*.js', gulp.series(scripts));
  gulp.watch('source/*.html', gulp.series(html, reload));
}

export default gulp.series(
  clean,
  copy,
  copyImages,
  gulp.parallel(
  styles,
  vendorCSS,
  html,
  scripts,
  vendorJS,
  sprite,
  createWebp
  ),
  gulp.series(
  server,
  watcher
  ));

export const build = gulp.series(
  clean,
  copy,
  gulp.parallel(
    styles,
    vendorCSS,
    html,
    scripts,
    vendorJS,
    images,
    sprite,
    createWebp
  )
);

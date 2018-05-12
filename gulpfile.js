const gulp = require("gulp");
const copy = require("gulp-copy");

gulp.task("copy", async function() {
  await gulp
    .src(["package.json", "README.md"])
    .pipe(copy("./dist/", { prefix: 1 }));
});

const {
    src,
    dest,
    watch,
    series,
    parallel
} = require('gulp');

const test = require('./index.js');


function testTask() {
    return src('demo.js')
        .pipe(test())
        .pipe(dest('output'));;
}

exports.default = testTask
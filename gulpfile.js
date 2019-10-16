const {
    src,
    dest,
    watch,
    series,
    parallel
} = require('gulp');

// const test = require('glup-enncryption');
const test = require('./app.js');


function testTask() {
    return src('example/demo.js')
        .pipe(test())
        .pipe(dest('output'));
}

exports.default = testTask
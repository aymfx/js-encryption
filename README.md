# gulp-enncryption

> 一个简单的用于加密的工具 还在完善当中 可以下载学习,请勿用于项目中

## 使用方法

First, install `gulp-enncryption` as a development dependency:

```shell
npm install --save-dev gulp-enncryption
```

Then, add it to your `gulpfile.js`:

```javascript
const {
    src,
    dest,
    watch,
    series,
    parallel
} = require('gulp');

const enncryption = require('glup-enncryption');
// const test = require('./app.js');


function testTask() {
    return src('index.js')
        .pipe(enncryption())
        .pipe(dest('output'));
}

exports.default = testTask
```
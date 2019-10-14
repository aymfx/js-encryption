/**
 * create by aymfx 20191015
 */
'use strict';
const gutil = require('gulp-util'); //按照gulp的统一规范打印错误日志
const through = require('through2'); //Node Stream的简单封装，目的是让链式流操作更加简单
const confusion = require('confusion');
const parse = require('esprima').parse; //将js转成ast
const toString = require('escodegen').generate; //将ast转成js
const replace = require('estraverse').replace; //遍历ast
const PLUGIN_NAME = 'glup-enncryption';

//-----------------------分割线------------------

var builders = require('ast-types').builders;
var replace = require('estraverse').replace;

var arrayExpression = builders.arrayExpression;
var blockStatement = builders.blockStatement;
var callExpression = builders.callExpression;
var expressionStatement = builders.expressionStatement;
var identifier = builders.identifier;
var functionExpression = builders.functionExpression;
var literal = builders.literal;
var memberExpression = builders.memberExpression;
var variableDeclaration = builders.variableDeclaration;
var variableDeclarator = builders.variableDeclarator;


//需要操作的东西
const strTohex = function (sourceCode, options) {
    let ast = parse(sourceCode);
    let obfuscated = confusion.transformAst(ast, confusion.createVariableName);
    console.log(obfuscated.body[0])
    let str = toString(obfuscated)
    //提取第一行的参数
    return str;
}

module.exports = function (options) {
    return through.obj(function (file, enc, cb) {

        // 如果文件为空，不做任何操作，转入下一个操作，即下一个 .pipe()
        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        // 插件不支持对 Stream 对直接操作，跑出异常
        if (file.isStream()) {
            this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
            return cb();
        }

        // 将文件内容转成字符串，并调用 preprocess 组件进行预处理
        // 然后将处理后的字符串，再转成Buffer形式
        var content = strTohex(file.contents.toString(), options || {})
        file.contents = Buffer.from(content)
        // 下面这两句基本是标配啦，可以参考下 through2 的API
        this.push(file);
        cb();
    });
};
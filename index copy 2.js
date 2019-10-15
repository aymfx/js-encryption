/**
 * create by aymfx 20191015
 */
'use strict';
const gutil = require('gulp-util'); //按照gulp的统一规范打印错误日志
const through = require('through2'); //Node Stream的简单封装，目的是让链式流操作更加简单
const esprima = require('esprima') //将js转成ast
const parse = esprima.parse; //将js转成ast
const toString = require('escodegen').generate; //将ast转成js
const replace = require('estraverse').replace; //遍历ast
const builders = require('ast-types').builders;
const PLUGIN_NAME = 'glup-enncryption';

//-----------------------分割线------------------

//类型

var arrayExpression = builders.arrayExpression;
var blockStatement = builders.blockStatement;
var callExpression = builders.callExpression;
var expressionStatement = builders.expressionStatement;
var identifier = builders.identifier;
var functionExpression = builders.functionExpression; //模具
var literal = builders.literal;
var memberExpression = builders.memberExpression;
var variableDeclaration = builders.variableDeclaration; //变量声明
var variableDeclarator = builders.variableDeclarator; //变量符号

function isFunction(node) {
    return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression';
}

function isStringLiteral(node) {
    return node.type === 'Literal' && typeof node.value === 'string';
}

function isPropertyAccess(node) {
    return node.type === 'MemberExpression' && !node.computed;
}

function isFnPropertyAccess(node) {
    return node.type === 'FunctionDeclaration' && !node.computed;
}

function isPropertyKey(node, parent) {
    return parent.type === 'Property' && parent.key === node;
}

function isStrictStatement(statement) {
    return statement.type === 'ExpressionStatement' &&
        statement.expression.type === 'Literal' &&
        statement.expression.value === 'use strict';
}

function wrapWithIife(body, stringMapName, stringMap) {
    console.log(body)
    var wrapperFunctionBody = blockStatement(body);
    var wrapperFunction = functionExpression(null, [stringMapName], wrapperFunctionBody);
    var iife = expressionStatement(
        callExpression(
            memberExpression(wrapperFunction, identifier('call'), false),
            [identifier('this'), stringMap]));
    return [iife];
}

function prependMap(body, stringMapName, stringMap) {
    var insertIndex = isStrictStatement(body[0]) ? 1 : 0;
    body.splice(insertIndex, 0,
        variableDeclaration('var', [
            variableDeclarator(stringMapName, stringMap)
        ])
    );
    return body;
}


function createVariableName(variableNames) { //创建一个数组的名字
    var name = '_x';
    do {
        name += (Math.random() * 0xffff) | 0;
    } while (variableNames.indexOf(name) !== -1);
    return name;
};

function createVariableName(variableNames) { //创建一个数组的名字
    var name = '_x';
    do {
        name += (Math.random() * 0xffff) | 0;
    } while (variableNames.indexOf(name) !== -1);
    return name;
};

function transformAst(ast, createVariableName) {
    var _privateName = '_ox' + (Math.random() * 0xffff) | 0;
    var usedVariables = {};
    var exposesVariables = false;
    var strings = [];
    var stringIndexes = Object.create(null);
    var stringMapIdentifier = identifier('');
    let num = 0

    function addString(string) {
        if (!(string in stringIndexes)) {
            stringIndexes[string] = {
                index: num++,
                value: string
            }
            return stringIndexes.index
        }
        return stringIndexes.index;
    }
    replace(ast, {
        enter: function (node, parent) {
            // if () {}
        },
        leave: function (node, parent) {

            if (node.type === esprima.Syntax.MemberExpression) { //修改属性提取
                console.log(node)
                let index = addString(node.property.name);
                node.computed = true
                node.property = {
                    type: "Identifier",
                    name: `${_privateName}[${index}]`
                }
                return node
            }
        }
    });
    stringMapIdentifier.name = _privateName;
    ast.body = prependMap(ast.body, stringMapIdentifier, arrayExpression(strings.map(literal)))

    return ast;
};



//-----------------------分割线------------------
//需要操作的东西
const strTohex = function (sourceCode, options) {
    let ast = parse(sourceCode);
    let obfuscated = transformAst(ast, createVariableName);
    // console.log(obfuscated.body[0])
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
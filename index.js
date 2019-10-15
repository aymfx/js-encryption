/**
 * create by aymfx 20191015
 */
'use strict';
const gutil = require('gulp-util'); //按照gulp的统一规范打印错误日志
const through = require('through2'); //Node Stream的简单封装，目的是让链式流操作更加简单
const parse = require('esprima').parse; //将js转成ast
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
var functionExpression = builders.functionExpression;
var literal = builders.literal;
var memberExpression = builders.memberExpression;
var variableDeclaration = builders.variableDeclaration;
var variableDeclarator = builders.variableDeclarator;

function isFunction(node) {
    return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression';
}

function isStringLiteral(node) {
    return node.type === 'Literal' && typeof node.value === 'string';
}

function isPropertyAccess(node) {
    return node.type === 'MemberExpression' && !node.computed;
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


function createVariableName(variableNames) {
    var name = '_x';
    do {
        name += (Math.random() * 0xffff) | 0;
    } while (variableNames.indexOf(name) !== -1);
    return name;
};

function transformAst(ast, createVariableName) {
    var usedVariables = {};
    var exposesVariables = false;
    var strings = [];
    var stringIndexes = Object.create(null);
    var stringMapIdentifier = identifier('');

    function addString(string) {
        if (!(string in stringIndexes)) {
            stringIndexes[string] = strings.push(string) - 1;
        }
        return stringIndexes[string];
    }

    replace(ast, {
        enter: function (node, parent) {
            // console.log(node)
            var index;
            if (node.type === 'VariableDeclaration' || node.type === 'FunctionDeclaration') {
                if (!exposesVariables) {
                    exposesVariables = !this.parents().some(isFunction);
                }
            } else if (node.type === 'Identifier') {
                usedVariables[node.name] = true;
                console.log(node.name)
            } else if (isStringLiteral(node) && !isPropertyKey(node, parent) && node.value !== 'use strict') {
                index = addString(node.value);
                return memberExpression(stringMapIdentifier, literal(index), true);
            } else if (isPropertyAccess(node)) {
                index = addString(node.property.name); //这里处理的是对象的属性
                console.log(index, node.property.name)
                return memberExpression(node.object,
                    memberExpression(stringMapIdentifier, literal(index), true), true);
            }
        }
    });

    stringMapIdentifier.name = createVariableName(Object.keys(usedVariables));
    console.log(stringMapIdentifier.name)
    var insertMap = exposesVariables ? prependMap : wrapWithIife;
    ast.body = insertMap(ast.body, stringMapIdentifier, arrayExpression(strings.map(literal)));

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
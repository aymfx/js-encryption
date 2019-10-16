'use strict';
const gutil = require('gulp-util'); //按照gulp的统一规范打印错误日志
const through = require('through2'); //Node Stream的简单封装，目的是让链式流操作更加简单
const parse = require('esprima').parse; //将js转成ast
const toString = require('escodegen').generate; //将ast转成js
const replace = require('estraverse').replace; //遍历ast
const builders = require('ast-types').builders;
const PLUGIN_NAME = 'glup-enncryption';
let code = `console.log('1212');var a={'v':'sdsd'}`
console.log(code)
console.log('----------------------分割线-------------------')
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
    return node.type === 'FunctionDeclaration';
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
    debugger
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
    debugger
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

function transformAst(ast, createVariableName) {
    var usedVariables = {};
    var strings = [];
    var stringIndexes = Object.create(null);
    var stringMapIdentifier = identifier('');

    function addString(string) {
        if (!(string in stringIndexes)) {
            stringIndexes[string] = strings.push(string) - 1;
        }
        return stringIndexes[string];
    }
    let num = 0
    replace(ast, {
        enter: function (node, parent) {
            var index;
            if (node.type === 'FunctionDeclaration') {
                debugger
                index = addString(node.id.name)
                // var wrapperFunctionBody = blockStatement(node.body);
                // return functionExpression(null, literal(index), wrapperFunctionBody);
            } else if (node.type === 'Identifier') {
                usedVariables[node.name] = true; //获取 所有的标志位 保证不会重复命名
            } else if (isPropertyAccess(node.type)) {
                node.computed = true
                index = addString(node.property.name); //这里处理的是对象的属性
                // console.log(node.property.name) // log
                // debugger
                var s = memberExpression(stringMapIdentifier, literal(index), true)
                debugger
                // console.log(s)
                var r = memberExpression(node.object,
                    memberExpression(stringMapIdentifier, literal(index), true), true);
                debugger
                return r
            }
        },
        leave: function (node, parent) {

        }
    });
    stringMapIdentifier.name = createVariableName(Object.keys(usedVariables));
    debugger
    ast.body = prependMap(ast.body, stringMapIdentifier, arrayExpression(strings.map(literal)));
    // ast.body = wrapWithIife(ast.body, stringMapIdentifier, arrayExpression(strings.map(literal)));

    return ast;
};

const strTohex = function (sourceCode, options) {
    let ast = parse(sourceCode);
    let obfuscated = transformAst(ast, createVariableName);
    let str = toString(obfuscated)
    //提取第一行的参数
    return str;
}

var content = strTohex(code, {})

console.log(content)
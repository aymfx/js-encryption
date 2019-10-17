const esprima = require('esprima'); //解析js的语法的包
const estraverse = require('estraverse'); //遍历树的包
const escodegen = require('escodegen'); //生成新的树的包
const {
    arrayExpression,
    variableDeclaration,
    memberExpression,
    assignmentExpression,
    variableDeclarator,
    callExpression,
    literal,
    identifier,
    binaryExpression
} = require('ast-types').builders;

const {
    prependMap,
    createVariableName,
    isPropertyAccess,
    isStringLiteral,
    isPropertyKey,
    stringToHex
} = require('./tools/index.js')

let baseOptions = {
    uncide: true,
    compress: true
}



// core
function strToHex(str, options) {
    options = Object.assign(baseOptions, options)
    let compress = options.compress ? {
        format: {
            indent: {
                style: '',
                base: 0,
                adjustMultilineComment: false
            },
            newline: '',
            space: ''
        }
    } : {};
    //
    let ast = esprima.parse(str)
    const stringMapIdentifier = identifier(''); //数组变量
    const usedVariables = []; //存贮所有的变量
    const stringIndexes = Object.create(null);
    const strings = []; //存贮有效的变量
    const fnValStringIdentifier = {}
    //添加字符串
    function addString(string) {
        if (!(string in stringIndexes)) {
            stringIndexes[string] = strings.push(stringToHex(string, options.uncide)) - 1;
        }
        return stringIndexes[string];
    }
    //遍历树
    estraverse.replace(ast, {
        enter(node, parent) {
            var index
            // console.log(node, ":", node.type)
            // debugger
            if (node.type === 'Identifier') {
                usedVariables[node.name] = true; //获取 所有的标志位 保证不会重复命名
                return
            } else if (node.type === 'VariableDeclarator') { //赋值是 改变 变量名字
                if (node.id.name in fnValStringIdentifier) {
                    return variableDeclarator(fnValStringIdentifier[node.id.name], node.init)
                } else {
                    let name = createVariableName(Object.keys(usedVariables))
                    fnValStringIdentifier[node.id.name] = identifier(name);
                    usedVariables.push(name) //防止变量重复
                    return variableDeclarator(fnValStringIdentifier[node.id.name], node.init)
                }
            } else if (node.type === 'AssignmentExpression') { //赋值时
                let {
                    operator,
                    left,
                    right
                } = node
                if (left.name in fnValStringIdentifier) {
                    left = fnValStringIdentifier[left.name]
                }

                if (right.name in fnValStringIdentifier) {
                    debugger
                    right = fnValStringIdentifier[right.name]
                }
                return assignmentExpression(operator,
                    left,
                    right)

            } else if (node.type == 'BinaryExpression') {
                let {
                    operator,
                    left,
                    right
                } = node
                if (left.name in fnValStringIdentifier) {
                    left = fnValStringIdentifier[left.name]
                }

                if (right.name in fnValStringIdentifier) {
                    right = fnValStringIdentifier[right.name]
                }
                return binaryExpression(operator,
                    left,
                    right)
            } else if (node.type === 'CallExpression') { //调用时
                let {
                    arguments: args,
                    callee
                } = node
                // debugger
                let arr = []
                args.map(item => {
                    if (item.name in fnValStringIdentifier) {
                        item = fnValStringIdentifier[item.name]
                    }
                    arr.push(item)
                })
                return callExpression(callee, arr)

            } else if (isStringLiteral(node) && !isPropertyKey(node, parent) && node.value !== 'use strict') {
                index = addString(node.value);
                return memberExpression(stringMapIdentifier, literal(index), true);
            } else if (isPropertyAccess(node)) { //MemberExpression
                index = addString(node.property.name);
                return memberExpression(node.object,
                    memberExpression(stringMapIdentifier, literal(index), true), true);

            }
        }
    });
    stringMapIdentifier.name = createVariableName(Object.keys(usedVariables));
    //生成新的树
    ast.body = prependMap(ast.body, stringMapIdentifier, arrayExpression(strings.map(literal)))

    return escodegen.generate(ast, compress).replace(/#x#/g, "\\x").replace(/#u#/g, "\\u")
}

module.exports = {
    strToHex
}

// ------ test ----------------
let code = `console.log(12121)
var a = 12;

function app(sss) {
    a = 19+a+a+a+a;
    console.log('xxx', sss, a)
}
app(a)`

let s = strToHex(code)
console.log(s)
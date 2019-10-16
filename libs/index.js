const esprima = require('esprima'); //解析js的语法的包
const estraverse = require('estraverse'); //遍历树的包
const escodegen = require('escodegen'); //生成新的树的包
const {
    arrayExpression,
    variableDeclaration,
    memberExpression,
    variableDeclarator,
    callExpression,
    literal,
    identifier
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
    uncide: true
}



// core
function strToHex(str, options) {
    options = Object.assign(baseOptions, options)
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
            } else if (node.type === 'VariableDeclarator') {
                fnValStringIdentifier[node.id.name] = identifier('_hex' + Date.now());
                return variableDeclarator(fnValStringIdentifier[node.id.name], node.init)

            } else if (node.type === 'CallExpression') {
                let {
                    arguments: args,
                    callee
                } = node
                debugger
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

    return escodegen.generate(ast).replace(/#x#/g, "\\x").replace(/#u#/g, "\\u")
}

module.exports = {
    strToHex
}

// ------ test ----------------
let code = `console.log(12121)
var a = 12;

function app(sss) {
    var a = 19;
    console.log('xxx', sss, a)
}

app(a)`

let s = strToHex(code)
console.log(s)
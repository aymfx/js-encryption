const esprima = require('esprima'); //解析js的语法的包
const estraverse = require('estraverse'); //遍历树的包
const escodegen = require('escodegen'); //生成新的树的包
const {
    arrayExpression,
    variableDeclaration,
    memberExpression,
    variableDeclarator,
    literal,
    identifier
} = require('ast-types').builders;

const {
    prependMap,
    createVariableName,
    isPropertyAccess,
    isStringLiteral,
    isPropertyKey
} = require('./tools/index.js')

// core
function strToHex(str) {
    let ast = esprima.parse(str)
    const stringMapIdentifier = identifier(''); //数组变量
    const usedVariables = []; //存贮所有的变量
    const stringIndexes = Object.create(null);
    const strings = []; //存贮有效的变量
    const exposesVariables = false;
    //添加字符串
    function addString(string) {
        if (!(string in stringIndexes)) {
            stringIndexes[string] = strings.push(string) - 1;
        }
        return stringIndexes[string];
    }
    //遍历树
    estraverse.replace(ast, {
        enter(node, parent) {
            var index
            if (node.type === 'Identifier') {
                usedVariables[node.name] = true; //获取 所有的标志位 保证不会重复命名
                return
            } else if (isStringLiteral(node) && !isPropertyKey(node, parent) && node.value !== 'use strict') {
                index = addString(node.value);
                return memberExpression(stringMapIdentifier, literal(index), true);
            } else if (isPropertyAccess(node)) { //MemberExpression
                if (!node.computed) {
                    index = addString(node.property.name);
                    return memberExpression(node.object,
                        memberExpression(stringMapIdentifier, literal(index), true), true);
                }

            }
        }
    });
    stringMapIdentifier.name = createVariableName(Object.keys(usedVariables));
    //生成新的树
    ast.body = prependMap(ast.body, stringMapIdentifier, arrayExpression(strings.map(literal)))

    return escodegen.generate(ast)
}

module.exports = {
    strToHex
}

// ------ test ----------------
let code = `var a = 2`

let s = strToHex(code)
console.log(s)
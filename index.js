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
let code = `console.log('1212');var a={'v':'sdsd'}`;
//解析js的语法
let ast = esprima.parseScript(code);
console.log('---------------ast-before------------')
console.log(ast)
console.log('---------------ast-before------------')

//----------------- tool ---------------------------
function prependMap(body, stringMapName, stringMap) {
    var insertIndex = isStrictStatement(body[0]) ? 1 : 0;
    body.splice(insertIndex, 0,
        variableDeclaration('var', [
            variableDeclarator(stringMapName, stringMap)
        ])
    );
    return body;
}

function isStrictStatement(statement) {
    return statement.type === 'ExpressionStatement' &&
        statement.expression.type === 'Literal' &&
        statement.expression.value === 'use strict';
}

function createVariableName(variableNames) { //创建一个数组的名字
    var name = '_x';
    do {
        name += (Math.random() * 0xffff) | 0;
    } while (variableNames.indexOf(name) !== -1);
    return name;
};

function isPropertyAccess(node) {
    return node.type === 'MemberExpression';
}

function isStringLiteral(node) {
    return node.type === 'Literal' && typeof node.value === 'string';
}

function isPropertyKey(node, parent) {
    return parent.type === 'Property' && parent.key === node;
}

//-------------------------------------------------------

//转换
function strToHex(ast) {
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
            console.log('enter: ' + node.type);
            var index;
            debugger
            if (node.type === 'Identifier') {
                usedVariables[node.name] = true; //获取 所有的标志位 保证不会重复命名
                return
            } else if (isStringLiteral(node) && !isPropertyKey(node, parent) && node.value !== 'use strict') {
                // debugger
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

    return ast
}
ast = strToHex(ast)

let r = escodegen.generate(ast);
console.log('---------------ast-after------------')
console.log(ast);
console.log('---------------ast-after------------')
console.log(r);
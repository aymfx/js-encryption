const esprima = require('esprima'); //解析js的语法的包
const estraverse = require('estraverse'); //遍历树的包
const escodegen = require('escodegen'); //生成新的树的包
const {
    arrayExpression,
    memberExpression,
    literal,
    identifier
} = require('ast-types').builders;
let code = `console.log('1212');var a={'v':'sdsd'}`;
//解析js的语法
let tree = esprima.parseScript(code);
let stringMapIdentifier = identifier('');
let strs = ['12', '233', '2323']
console.log('---------------tree-before------------')
console.log(tree)
console.log('---------------tree-before------------')

function prependMap(body, stringMapName, stringMap) {
    var insertIndex = isStrictStatement(body[0]) ? 1 : 0;
    body.splice(insertIndex, 0,
        variableDeclaration('var', [
            variableDeclarator(stringMapName, stringMap)
        ])
    );
    return body;
}
//遍历树
estraverse.replace(tree, {
    enter(node) {
        console.log('enter: ' + node.type);
        if (node.type == 'MemberExpression') {
            // var s = memberExpression(stringMapIdentifier, literal(0), true)
            var age = memberExpression(node.object, literal(0), true)
            console.log(s, age)
            return age;
        }
    }
});
//生成新的树
prependMap(body,stringMapIdentifier)
let r = escodegen.generate(tree);
console.log('---------------tree-after------------')
console.log(tree);
console.log('---------------tree-after------------')
console.log(r);
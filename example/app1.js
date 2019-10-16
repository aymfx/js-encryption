const esprima = require('esprima'); //解析js的语法的包
const estraverse = require('estraverse'); //遍历树的包
const escodegen = require('escodegen'); //生成新的树的包
const {
    arrayExpression,
    literal
} = require('ast-types').builders;
let code = `var a = ['a']`;
//解析js的语法
let tree = esprima.parseScript(code);
//-----------------
let a = literal(0) //{ value: 0, loc: null, type: 'Literal', comments: null, regex: null }
// console.log(tree)
let strings = ['a', 'b']
//-----------------
console.log('---------------tree-before------------')
console.log(tree)
console.log('---------------tree-before------------')
//遍历树
estraverse.replace(tree, {
    enter(node) {
        console.log('enter: ' + node.type);
        if (node.type == 'ArrayExpression') {
            let s = arrayExpression(strings.map(literal))
            console.log(s)
            return s
        }


    }
});
//生成新的树
let r = escodegen.generate(tree);
console.log('---------------tree-after------------')
console.log(tree);
console.log('---------------tree-after------------')
console.log(r);
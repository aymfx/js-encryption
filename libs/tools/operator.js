exports.prependMap = prependMap
exports.createVariableName = createVariableName
const {
    isStrictStatement
} = require('./tools.js')

const {
    variableDeclaration,
    variableDeclarator,
} = require('ast-types').builders;

//在js文件最前面插入数组
function prependMap(body, stringMapName, stringMap) {
    var insertIndex = isStrictStatement(body[0]) ? 1 : 0;
    body.splice(insertIndex, 0,
        variableDeclaration('var', [
            variableDeclarator(stringMapName, stringMap)
        ])
    );
    return body;
}

//创建一个有效的变量
function createVariableName(variableNames) {
    var name = '_x';
    do {
        name += (Math.random() * 0xffff) | 0;
    } while (variableNames.indexOf(name) !== -1);
    return name;
};
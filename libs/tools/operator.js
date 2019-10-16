exports.prependMap = prependMap
exports.createVariableName = createVariableName
exports.stringToHex = stringToHex
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
    if (stringMap.elements.length > 0) {
        body.splice(insertIndex, 0,
            variableDeclaration('var', [
                variableDeclarator(stringMapName, stringMap)
            ])
        );
    }
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

function stringToHex(str, hexall) {
    // debugger
    var val = "";
    for (var i = 0; i < str.length; i++) {
        var x = str.charCodeAt(i).toString(16);
        if (hexall) {
            // hex most strings include ASCII and Chinese
            if (x.length === 1) { // \r \n do not convert it
                val += str[i];
            } else if (x.length === 4) { // Chinese unicode
                val += "#u#" + x;
            } else {
                val += "#x#" + x;
            }
        } else {
            // only Chinese
            var reg = /([\u4E00-\u9FA5]|[\uFE30-\uFFA0])/;
            if (reg.test(str[i]) && x.length === 4) {
                val += "#u#" + x;
            } else {
                val += str[i];
            }
        }
    }
    return val;
}
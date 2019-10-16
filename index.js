'use strict';
const gutil = require('gulp-util'); //按照gulp的统一规范打印错误日志
const through = require('through2'); //Node Stream的简单封装，目的是让链式流操作更加简单
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

    return escodegen.generate(ast)
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
        var content = strToHex(esprima.parse(file.contents.toString()), options || {})
        file.contents = Buffer.from(content)
        // 下面这两句基本是标配啦，可以参考下 through2 的API
        this.push(file);
        cb();
    });
};
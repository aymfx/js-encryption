exports.isStrictStatement = isStrictStatement
exports.isPropertyAccess = isPropertyAccess
exports.isStringLiteral = isStringLiteral
exports.isPropertyKey = isPropertyKey


/**
 * 
 * 比较工具类
 */
//是否加了 'use strict' 头部
function isStrictStatement(statement) {
    return statement.type === 'ExpressionStatement' &&
        statement.expression.type === 'Literal' &&
        statement.expression.value === 'use strict';
}

function isPropertyAccess(node) {
    return node.type === 'MemberExpression' && !node.computed;
}

function isStringLiteral(node) {
    return node.type === 'Literal' && typeof node.value === 'string';
}

function isPropertyKey(node, parent) {
    return parent.type === 'Property' && parent.key === node;
}

//-------------------------------------------------
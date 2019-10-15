let code = `var s = 12;
function app(arg) {
    console.log(12199999921, arg)
}
app(0)`
const replace = require('estraverse').replace; 
const builders = require('ast-types').builders;
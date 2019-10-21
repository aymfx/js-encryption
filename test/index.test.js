const {
    strToHex
} = require('../libs/index.js')

test('函数', () => {
    function add(a,b){
        console.log()
    }
    var s = strToHex(`console.log(121)`)
    eval(s)
    console.log(s)
    expect(console.log.mock.calls[0][0]).toBe(121);
});
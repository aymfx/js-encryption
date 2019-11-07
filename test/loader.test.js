import compiler from './compiler.js';
import loader from '../src';
describe('project start', () => {
    test('loader', () => {
        expect(loader).toBeInstanceOf(Function);
    })
    test('console.log(1212)', async () => {
        const stats = await compiler('./instance/index.js');
        const output = stats.toJson().modules[0].source;
        expect(output).toBe(`console.log(1212)`);
    });
})



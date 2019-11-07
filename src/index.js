import { getOptions } from 'loader-utils';
import validateOptions from 'schema-utils';
const schema = {
    type: 'object',
    properties: {
        test: {
            type: 'string'
        }
    }
}
export default function loader(code) {
    const options = getOptions(this);
    validateOptions(schema, options, 'Example Loader');
    return code;
};
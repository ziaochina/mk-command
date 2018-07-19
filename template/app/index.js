const pkgJson = require('./package.json')

__webpack_public_path__ = window[`__pub_${pkgJson.name}__`];

import { defaultComponent } from 'mk-meta-engine'
const data = require('./data')
const config = require('./config')

require('./mock.js')
require('./style.less')

export default {
    name: pkgJson.name,
    version: pkgJson.version,
    description: pkgJson.description,
    meta: data.getMeta(),
    components: [],
    config: config,
    load: (cb) => {
        cb(defaultComponent, require('./action'), require('./reducer'))
	}
}
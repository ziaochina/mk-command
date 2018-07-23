//默认配置项目
var _options = {
	//webapi地址映射表
	webapiMap: {
		//'login':'/v1/sys/user/login'
	}
}

function config(options) {
	if (options) {
		Object.assign(_options, options)
	}
}

config.current = _options

export default config
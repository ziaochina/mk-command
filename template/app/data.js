export function getMeta() {
	return {
		name: 'root',
		component: '::div',
		className: '<appName>',
		children:[{
            name: 'lbl',
            component: '::div',
            children: '{{data.content}}'
        },{
            name:'btn',
            component: 'Button',
            children: 'world',
            onClick: '{{$world}}'
        }]
	}
}

export function getInitState() {
	return {
		data: {
			content: 'hello'
		}
	}
}
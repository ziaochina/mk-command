export function getMeta() {
	return {
		name: 'root',
		component: '::div',
		className: 'welcome',
		children:[{
            name: 'lbl',
            component: '::div',
            children: '{{data.content}}'
        }]
	}
}

export function getInitState() {
	return {
		data: {
			content: 'welcome MK!'
		}
	}
}
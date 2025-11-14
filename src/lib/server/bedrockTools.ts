export class CheckTheWeatherTool {
	static spec = {
		toolSpec: {
			name: 'check_the_weather',
			description: 'Check the weather for a specific zip code.',
			inputSchema: {
				json: {
					type: 'object',
					properties: {
						zip: {
							type: 'string',
							description: 'The zip code to check the weather for.'
						}
					},
					required: ['zip']
				}
			}
		}
	};
	static async run() {
		const text = 'The weather is 67 degrees and sunny.';
		return {
			response: [text],
			text: JSON.stringify(text)
		};
	}
}

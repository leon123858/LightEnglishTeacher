// import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { MODEL_TYPE } from '../contexts/SettingsContext';

export const getChatModel = (model: MODEL_TYPE, key: string, url: string) => {
	switch (model) {
		// case 'openai':
		// 	if (!openAIApiKey) throw new Error('OpenAI API key is missing.');
		// 	return new ChatOpenAI({
		// 		apiKey: openAIApiKey,
		// 		modelName: 'gpt-4o',
		// 		temperature: 0.7,
		// 	});
		case 'gemini':
			if (!key)
				throw new Error(
					'Google API Key is missing. Please set NEXT_PUBLIC_GOOGLE_API_KEY environment variable.'
				);
			return new ChatGoogleGenerativeAI({
				apiKey: key,
				model: 'gemini-1.5-flash',
				temperature: 0.7,
			});
		case 'ollama':
			if (!url) throw new Error('Ollama URL is missing.');
			try {
				new URL(url); // Validate URL format
			} catch (error: unknown) {
				console.error('Invalid Ollama URL:', error);
				throw new Error('Invalid Ollama URL format. Please check the URL.');
			}
			return new ChatOllama({
				baseUrl: url,
				model: 'qwen3:8b',
				temperature: 0.7,
			});
		default:
			throw new Error('Invalid model selected');
	}
};

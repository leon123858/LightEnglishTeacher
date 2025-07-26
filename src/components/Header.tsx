'use client';

import { useState } from 'react';

function generateKeyStrPlaceholder(model: string): string {
	switch (model) {
		case 'openai':
			return 'OpenAI API Key';
		case 'ollama':
			return 'Ollama URL';
		case 'gemini':
			return 'Google AI Studio Key';
		default:
			return 'API Key';
	}
}

export const Header = () => {
	const [model, setModel] = useState('gemini');
	const [keyStr, setKeyStr] = useState('');

	return (
		<header className='bg-gray-800 text-white p-4'>
			<div className='container mx-auto flex justify-between items-center'>
				<h1 className='text-xl font-bold'>Light English Teacher</h1>
				<div className='flex items-center space-x-4'>
					<select
						value={model}
						onChange={(e) => setModel(e.target.value)}
						className='p-2 border rounded-md bg-gray-700'
					>
						<option value='gemini'>Google Gemini</option>
						<option value='openai'>OpenAI (GPT-4o)</option>
						<option value='ollama'>Ollama (本地)</option>
					</select>
					<input
						type='password'
						placeholder={generateKeyStrPlaceholder(model)}
						value={keyStr}
						onChange={(e) => setKeyStr(e.target.value)}
						className='p-2 border rounded-md w-48 text-gray-800 bg-white'
					/>
				</div>
			</div>
		</header>
	);
};

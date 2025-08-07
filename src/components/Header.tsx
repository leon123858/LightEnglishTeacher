'use client';

import React from 'react';
import { MODEL_TYPE, useSettings } from '../contexts/SettingsContext'; // 導入 useSettings

// Header 不再需要接收 props
export const Header: React.FC = () => {
	// 直接從 context 獲取狀態和設定函數
	const { model, setModel, apiKey, setApiKey, url, setUrl } = useSettings();

	const generateInput = (model: MODEL_TYPE) => {
		switch (model) {
			case 'ollama':
				return (
					<input
						type={'text'}
						placeholder={'Ollama URL'}
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						className='p-2 border rounded-md w-48 text-gray-800 bg-white'
					/>
				);
			case 'gemini':
				return (
					<input
						type={'password'}
						placeholder={'Gemini API Key'}
						value={apiKey}
						onChange={(e) => setApiKey(e.target.value)}
						className='p-2 border rounded-md w-48 text-gray-800 bg-white'
					/>
				);
			default:
				throw Error('unexpected model');
		}
	};

	return (
		<header className='bg-gray-800 text-white p-4'>
			<div className='container mx-auto flex justify-between items-center'>
				<h1 className='text-xl font-bold'>Light English Teacher</h1>
				<div className='flex items-center space-x-4'>
					<select
						value={model}
						onChange={(e) => setModel(e.target.value as MODEL_TYPE)}
						className='p-2 border rounded-md bg-gray-700'
					>
						<option value='gemini'>Google Gemini</option>
						<option value='ollama'>Ollama (本地)</option>
					</select>
					{generateInput(model)}
				</div>
			</div>
		</header>
	);
};

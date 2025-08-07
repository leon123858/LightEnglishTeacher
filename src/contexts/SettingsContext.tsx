'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';

// define type for all model
export type MODEL_TYPE = 'ollama' | 'gemini';

// 定義 Context 的資料結構
interface SettingsContextType {
	model: MODEL_TYPE;
	setModel: (model: MODEL_TYPE) => void;
	apiKey: string;
	setApiKey: (key: string) => void;
	url: string;
	setUrl: (url: string) => void;
}

// 建立 Context，並提供一個預設值
const SettingsContext = createContext<SettingsContextType | undefined>(
	undefined
);

// 建立 Provider 元件
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
	const [model, setModel] = useState<MODEL_TYPE>('ollama');
	const [apiKey, setApiKey] = useState('');
	const [url, setUrl] = useState('http://localhost:11434');

	const value = {
		model,
		setModel,
		apiKey,
		setApiKey,
		url,
		setUrl,
	};

	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
};

// 建立一個自定義的 Hook，方便其他元件使用
export const useSettings = () => {
	const context = useContext(SettingsContext);
	if (context === undefined) {
		throw new Error('useSettings must be used within a SettingsProvider');
	}
	return context;
};

'use client';

import { useState } from 'react';
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
	SystemMessage,
	HumanMessage,
	AIMessage,
} from '@langchain/core/messages';
import { Header } from '../components/Header';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { ChatPanel } from '../components/ChatPanel';
import { AnalysisResult, ChatMessage as ChatMessageType } from '../types';

const masterPrompt = `
You are PEAT (Proactive English Article Tutor), an expert English tutor. Your goal is to help a user improve their English fluency by discussing an article they provide.
The user's native language is Traditional Chinese.

HERE IS THE ARTICLE:
---
...
---

YOUR TASK:
1.  Read and deeply understand the article's core ideas, key arguments, and specific vocabulary.
2.  Generate a response in a simple, parsable format. It MUST contain:
    - A one-sentence summary in English.
    - Three open-ended "conversation starters" based on the article. These questions should encourage the user to express opinions and reflections, not just repeat facts.

OUTPUT FORMAT (Strictly follow this format):
SUMMARY: [Your one-sentence summary here]
STARTER 1: [Your first conversation starter here]
STARTER 2: [Your second conversation starter here]
STARTER 3: [Your third conversation starter here]`;

const conversationPrompt = `
You are PEAT (Proactive English Article Tutor). Your goal is to help a user understand an English article and improve their language skills through a natural, guided conversation.
Your Persona:
- Curious: Genuinely interested in the user's thoughts and opinions about the article.
- Patient: Never rush the user. Give them space to think and respond.
- Encouraging: Use positive language. Acknowledge their effort and insights.

HERE IS THE ARTICLE:
---
...
---

YOUR TASK:
Keep your responses short, ideally 1-3 sentences, to keep the conversation moving.

OUTPUT FORMAT (Strictly follow this format):
THINK: [This is your private thought process. Analyze User's Input: Briefly summarize the user's main point. Identify Key Error (if any): Note the most significant grammatical error. If none, write "None." Plan Your Response: Decide on your question and how you will subtly model the correction.]
RESPONSE: [Your exact, user-facing message. It must follow all directives above.]`;

export default function Home() {
	// --- State Management ---
	const [model, setModel] = useState('ollama');
	const [openAIApiKey, setOpenAIApiKey] = useState('');
	const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
	const [article, setArticle] = useState('');
	const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
		null
	);
	const [chatHistory, setChatHistory] = useState<ChatMessageType[]>([
		new AIMessage(
			'Welcome to Light English Teacher! please provide an article to start.'
		),
	]);

	const [isAnalysisLoading, setAnalysisLoading] = useState(false);
	const [isChatLoading, setChatLoading] = useState(false);

	// --- Core Logic ---

	const getChatModel = () => {
		switch (model) {
			case 'openai':
				if (!openAIApiKey) throw new Error('OpenAI API key is missing.');
				return new ChatOpenAI({
					apiKey: openAIApiKey,
					modelName: 'gpt-4o',
					temperature: 0.7,
				});
			case 'gemini':
				// Gemini in client-side requires Google AI Studio key
				// We will assume the user has configured it in their environment for this example
				// Or we can add an input field for it. For now, we rely on env var.
				const geminiApiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
				if (!geminiApiKey)
					throw new Error(
						'Google API Key is missing. Please set NEXT_PUBLIC_GOOGLE_API_KEY environment variable.'
					);
				return new ChatGoogleGenerativeAI({
					apiKey: geminiApiKey,
					model: 'gemini-1.5-flash',
					temperature: 0.7,
				});
			case 'ollama':
				if (!ollamaUrl) throw new Error('Ollama URL is missing.');
				try {
					new URL(ollamaUrl); // Validate URL format
				} catch (error: unknown) {
					console.error('Invalid Ollama URL:', error);
					// If URL is invalid, we throw an error to inform the user
					// This can be caught in the UI to show a user-friendly message
					throw new Error('Invalid Ollama URL format. Please check the URL.');
				}
				return new ChatOllama({
					baseUrl: ollamaUrl,
					model: 'qwen3:8b',
					temperature: 0.7,
				});
			default:
				throw new Error('Invalid model selected');
		}
	};

	const handleAnalyze = async (article: string) => {
		setAnalysisLoading(true);
		setArticle(article);
		setAnalysisResult(null);

		const systemMessage = new SystemMessage(
			masterPrompt.replace('...', article)
		);

		// console.log(systemMessage.content); // 用來檢查結果

		try {
			const chatModel = getChatModel();
			const result = await chatModel.invoke([systemMessage]);
			const responseText = result.content.toString();

			const summaryMatch = responseText.match(/SUMMARY: (.*)/);
			const summary = summaryMatch
				? summaryMatch[1].trim()
				: '抱歉，無法生成摘要。';
			const starters = Array.from(
				responseText.matchAll(/STARTER \d+: (.*)/g)
			).map((match) => match[1].trim());

			if (starters.length === 0) throw new Error('無法解析對話啟動器。');

			setAnalysisResult({ summary, starters });
		} catch (error: any) {
			console.error('Analysis Error:', error);
			setAnalysisResult({
				summary: `分析失敗: ${error.message}`,
				starters: [],
			});
		} finally {
			setAnalysisLoading(false);
		}
	};

	const handleSendMessage = async (message: string) => {
		setChatLoading(true);
		const humanMessage = new HumanMessage(message);
		const newHistory: ChatMessageType[] = [...chatHistory, humanMessage];
		setChatHistory(newHistory);

		try {
			const chatModel = getChatModel();
			const systemMessage = new SystemMessage(
				conversationPrompt.replace('...', article)
			);
			const newHistorySlice =
				newHistory.length > 10
					? newHistory.slice(newHistory.length - 10)
					: newHistory;
			const result = await chatModel.invoke([
				systemMessage,
				...newHistorySlice,
			]);
			const responseText = result.content.toString();

			console.log('AI Response:', responseText); // 用來檢查結果

			const responseMatches = Array.from(
				responseText.matchAll(/RESPONSE: (.*)/g)
			).map((match) => match[1].trim());

			if (responseMatches.length === 0) {
				console.warn('can not parse AI response, using final response');
				// 如果沒有找到任何回應，則使用整個結果的最後一行作為回復
				const splitStr = responseText.split('\n');
				const lastResponse = splitStr[splitStr.length - 1].trim();
				setChatHistory([...newHistory, new AIMessage(lastResponse)]);
			} else {
				// 將最後一個回應作為AI消息
				const lastResponse = responseMatches[responseMatches.length - 1];
				setChatHistory([...newHistory, new AIMessage(lastResponse)]);
			}
		} catch (error: any) {
			console.error('Chat Error:', error);
			setChatHistory([
				...newHistory,
				new AIMessage(`抱歉，發生錯誤: ${error.message}`),
			]);
		} finally {
			setChatLoading(false);
		}
	};

	return (
		<div className='flex flex-col h-screen bg-[#F8F7F4]'>
			<Header />
			<main className='flex-1 container mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-y-auto'>
				<AnalysisPanel
					onAnalyze={handleAnalyze}
					isLoading={isAnalysisLoading}
					analysisResult={analysisResult}
					onStarterClick={handleSendMessage}
				/>
				<ChatPanel
					history={chatHistory}
					isLoading={isChatLoading}
					isReady={!!analysisResult}
					onSendMessage={handleSendMessage}
				/>
			</main>
		</div>
	);
}

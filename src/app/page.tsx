'use client';

import { useState } from 'react';
import {
	SystemMessage,
	HumanMessage,
	AIMessage,
} from '@langchain/core/messages';
import { Header } from '../components/Header';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { ChatPanel } from '../components/ChatPanel';
import { AnalysisResult, ChatMessage as ChatMessageType } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { getChatModel } from '../lib/requester';

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

HERE IS THE ARTICLE:
---
...
---

YOUR TASK:
Keep your responses short, ideally <10 sentences, to keep the conversation moving. Remember that you should not repeat same response to the user.
1.  Read the article and understand its core ideas, key arguments, and specific vocabulary.
2.  When the user asks a question or makes a comment, respond in a way that
		- Addresses their question or comment directly.
		- Encourages them to express their own opinions and reflections.
		- Uses simple, clear language appropriate for a non-native English speaker.
		- Do not use emojis or overly casual language.
3.  If the user makes a grammatical error, gently correct it by:
		- Rephrasing their sentence correctly.
		- Providing a brief explanation of the error.

OUTPUT FORMAT (Strictly follow this format):
THINK: [This is your private thought process. Analyze User's Input: Briefly summarize the user's main point. Identify Key Error (if any): Note the most significant grammatical error. If none, write "None." Plan Your Response: Decide on your question and how you will subtly model the correction.]
RESPONSE: [Your exact, user-facing message. It must follow all directives above.]`;

export default function Home() {
	// --- State Management ---
	const { model, apiKey, url } = useSettings();

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

	const handleAnalyze = async (article: string) => {
		setAnalysisLoading(true);
		setArticle(article);
		setAnalysisResult(null);

		const chatMessage = new HumanMessage(masterPrompt.replace('...', article));

		// console.log(systemMessage.content); // 用來檢查結果

		try {
			const chatModel = getChatModel(model, apiKey, url);
			const result = await chatModel.invoke([chatMessage]);
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
		} catch (error) {
			console.error('Analysis Error:', error);
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			setAnalysisResult({
				summary: `分析失敗: ${errorMessage}`,
				starters: [],
			});
		} finally {
			setAnalysisLoading(false);
		}
	};

	const handleSendMessage = async (message: string) => {
		setChatLoading(true);
		const humanMessage = new HumanMessage(message);
		const preHistory =
			chatHistory.length > 10
				? chatHistory.slice(chatHistory.length - 10)
				: chatHistory;
		const newHistory: ChatMessageType[] = [...chatHistory, humanMessage];
		setChatHistory(newHistory);

		try {
			const chatModel = getChatModel(model, apiKey, url);
			const systemMessage = new SystemMessage(
				conversationPrompt.replace('...', article)
			);
			const result = await chatModel.invoke([
				systemMessage,
				...preHistory,
				humanMessage,
			]);
			const responseText = result.content.toString();

			console.log('AI Response:', responseText); // 用來檢查結果

			const responseMatches = responseText.split('RESPONSE:');

			if (responseMatches.length === 1) {
				console.warn('can not parse AI response, using final response');
				// 如果沒有找到任何回應，則使用 think 標籤後的內容回復
				const splitStr = responseText.split('</think>');
				const lastResponse = splitStr[splitStr.length - 1].trim();
				setChatHistory([...newHistory, new AIMessage(lastResponse)]);
			} else {
				// 將最後一個回應作為AI消息
				const lastResponse = responseMatches[responseMatches.length - 1];
				setChatHistory([...newHistory, new AIMessage(lastResponse)]);
			}
		} catch (error) {
			console.error('Chat Error:', error);
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			setChatHistory([
				...newHistory,
				new AIMessage(`抱歉，發生錯誤: ${errorMessage}`),
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

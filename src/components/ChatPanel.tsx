import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { ChatMessage as ChatMessageType } from '../types';

// --- 語音辨識介面 ---
// 為了處理瀏覽器相容性，我們需要定義這個介面
interface SpeechRecognition extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	start(): void;
	stop(): void;
	onresult: (event: any) => void;
	onerror: (event: any) => void;
	onend: () => void;
}

// Props
interface ChatPanelProps {
	history: ChatMessageType[];
	isLoading: boolean;
	isReady: boolean;
	onSendMessage: (message: string) => void;
}

interface ChatMessageProps {
	message: ChatMessageType;
	onPlayAudio: (text: string) => void; // 新增 props 用於播放音訊
}

// Helper to render markdown
const createMarkup = (content: string) => {
	const dirty = marked.parse(content) as string;
	const clean = DOMPurify.sanitize(dirty);
	return { __html: clean };
};

// --- Sub Components ---

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onPlayAudio }) => {
	const isUser = message.getType() === 'human';
	const isAI = message.getType() === 'ai';
	const content = message.content.toString();

	if (isAI) {
		return (
			<div className='flex justify-start items-center gap-2 group'>
				<div
					className='p-3 rounded-2xl bg-white border border-gray-200 rounded-bl-md flex items-center gap-2'
					dangerouslySetInnerHTML={createMarkup(content)}
				></div>
				{/* AI 訊息的播放按鈕 */}
				<button
					onClick={() => onPlayAudio(content)}
					className='text-gray-400 hover:text-gray-600 transition-opacity opacity-0 group-hover:opacity-100'
					aria-label='Play audio'
				>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						className='h-5 w-5'
						viewBox='0 0 20 20'
						fill='currentColor'
					>
						<path
							fillRule='evenodd'
							d='M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z'
							clipRule='evenodd'
						/>
					</svg>
				</button>
			</div>
		);
	} else if (isUser) {
		return (
			<div className={'flex justify-end'}>
				<div
					className={
						'p-3 rounded-2xl bg-[#E57373] text-white rounded-br-md flex items-center gap-2'
					}
					dangerouslySetInnerHTML={createMarkup(content)}
				></div>
			</div>
		);
	}
	// 其他回傳不占位符號
	return null;
};

const AITypingIndicator = () => (
	<div className='flex justify-start'>
		<div className='p-3 rounded-2xl bg-white border border-gray-200 rounded-bl-md flex items-center gap-2'>
			<span className='w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75'></span>
			<span className='w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150'></span>
			<span className='w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300'></span>
		</div>
	</div>
);

// --- Main Component ---

export const ChatPanel: React.FC<ChatPanelProps> = ({
	history,
	isLoading,
	isReady,
	onSendMessage,
}) => {
	const [message, setMessage] = useState('');
	const [isRecording, setIsRecording] = useState(false); // 新增狀態來追蹤錄音狀態
	const endOfMessagesRef = useRef<HTMLDivElement>(null);
	const recognitionRef = useRef<SpeechRecognition | null>(null); // Ref 來保存語音辨識實例

	// --- 語音合成 (Text-to-Speech) ---
	const playAudio = (text: string) => {
		// 停止目前所有正在播放的語音
		window.speechSynthesis.cancel();
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = 'en-US'; // 設定語言為美式英語
		window.speechSynthesis.speak(utterance);
	};

	// --- 語音辨識 (Speech-to-Text) ---
	useEffect(() => {
		// 檢查瀏覽器是否支援 Web Speech API
		const SpeechRecognition =
			(window as any).SpeechRecognition ||
			(window as any).webkitSpeechRecognition;

		if (!SpeechRecognition) {
			console.warn('瀏覽器不支援語音辨識功能。');
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.continuous = false; // 只處理單句
		recognition.interimResults = false; // 只回傳最終結果
		recognition.lang = 'en-US'; // 設定辨識語言

		recognition.onresult = (event: any) => {
			const transcript = event.results[0][0].transcript;
			setMessage(transcript); // 將辨識結果設定到輸入框
		};

		recognition.onerror = (event: any) => {
			console.error('語音辨識錯誤:', event.error);
		};

		recognition.onend = () => {
			setIsRecording(false); // 辨識結束後更新狀態
		};

		recognitionRef.current = recognition;
	}, []);

	// --- 自動捲動與自動播放新訊息 ---
	useEffect(() => {
		endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });

		// 當有新訊息且不是來自使用者時，自動播放
		if (history.length > 0) {
			const lastMessage = history[history.length - 1];
			if (lastMessage.getType() === 'ai' && !isLoading && history.length > 1) {
				playAudio(lastMessage.content.toString());
			}
		}
	}, [history, isLoading]); // 依賴 history 和 isLoading

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (message.trim()) {
			onSendMessage(message);
			setMessage('');
		}
	};

	// --- 控制錄音的函式 ---
	const handleToggleRecording = () => {
		if (isRecording) {
			recognitionRef.current?.stop();
		} else {
			// 清空現有訊息並開始辨識
			setMessage('');
			recognitionRef.current?.start();
		}
		setIsRecording(!isRecording);
	};

	return (
		<div className='flex flex-col h-full bg-gray-100 p-4 md:p-6 rounded-2xl shadow-inner'>
			<div className='flex-grow space-y-4 overflow-y-auto pr-4'>
				{history.map((msg, index) => (
					<ChatMessage key={index} message={msg} onPlayAudio={playAudio} />
				))}
				{isLoading && <AITypingIndicator />}
				<div ref={endOfMessagesRef} />
			</div>
			<form onSubmit={handleSubmit} className='mt-4'>
				<div className='flex items-center space-x-2'>
					<input
						type='text'
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						className='flex-grow p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E57373] transition'
						placeholder={
							isReady
								? isRecording
									? '正在聆聽...'
									: '輸入您的訊息...'
								: '請先完成左側分析'
						}
						disabled={!isReady || isLoading}
					/>
					{/* 麥克風按鈕 */}
					<button
						type='button'
						onClick={handleToggleRecording}
						className={`p-3 rounded-lg transition-colors duration-300 disabled:bg-gray-400 ${
							isRecording
								? 'bg-red-500 text-white'
								: 'bg-gray-200 text-gray-700 hover:bg-gray-300'
						}`}
						disabled={!isReady || isLoading || !recognitionRef.current}
						aria-label={isRecording ? 'Stop recording' : 'Start recording'}
					>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							className='h-6 w-6'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
							/>
						</svg>
					</button>
					<button
						type='submit'
						className='bg-[#E57373] text-white font-bold py-3 px-5 rounded-lg hover:bg-red-500 transition-colors duration-300 disabled:bg-gray-400'
						disabled={!isReady || isLoading || !message.trim()}
					>
						發送
					</button>
				</div>
			</form>
		</div>
	);
};

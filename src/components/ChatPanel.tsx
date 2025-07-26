import React, { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { ChatMessage as ChatMessageType } from '../types';

// Props
interface ChatPanelProps {
	history: ChatMessageType[];
	isLoading: boolean;
	isReady: boolean;
	onSendMessage: (message: string) => void;
}

interface ChatMessageProps {
	message: ChatMessageType;
}

// Helper to render markdown
const createMarkup = (content: string) => {
	const dirty = marked.parse(content) as string;
	const clean = DOMPurify.sanitize(dirty);
	return { __html: clean };
};

// --- Sub Components ---

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
	const isUser = message.getType() === 'human';
	const isAI = message.getType() === 'ai';
	if (isAI) {
		return (
			<div className='flex justify-start'>
				<div
					// 靠左對話氣泡
					className={
						'p-3 rounded-2xl bg-white border border-gray-200 rounded-br-md flex items-center gap-2'
					}
					dangerouslySetInnerHTML={createMarkup(message.content.toString())}
				></div>
			</div>
		);
	} else if (isUser) {
		return (
			<div className={'flex justify-end'}>
				<div
					// 靠右對話氣泡
					className={
						'p-3 rounded-2xl bg-[#E57373] text-white rounded-bl-md flex items-center gap-2'
					}
					dangerouslySetInnerHTML={createMarkup(message.content.toString())}
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
	const endOfMessagesRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [history, isLoading]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (message.trim()) {
			onSendMessage(message);
			setMessage('');
		}
	};

	return (
		<div className='flex flex-col h-full bg-gray-100 p-4 md:p-6 rounded-2xl shadow-inner'>
			<div className='flex-grow space-y-4 overflow-y-auto pr-4'>
				{history.map((msg, index) => (
					<ChatMessage key={index} message={msg} />
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
						placeholder={isReady ? '輸入您的訊息...' : '請先完成左側分析'}
						disabled={!isReady || isLoading}
					/>
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

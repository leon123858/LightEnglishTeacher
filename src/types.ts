import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export type ChatMessage = SystemMessage | HumanMessage;
export type AnalysisResult = { summary: string; starters: string[] };

import React, { useState } from 'react';
import { AnalysisResult } from '../types';

// Props
interface AnalysisPanelProps {
  onAnalyze: (text: string) => void;
  isLoading: boolean;
  analysisResult: AnalysisResult | null;
  onStarterClick: (starter: string) => void;
}

interface ResultDisplayProps {
  result: AnalysisResult;
  onStarterClick: (starter: string) => void;
}

// --- Sub Components ---

const Loader = () => (
    <div className="flex justify-center items-center p-4">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#E57373]"></div>
    </div>
);

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, onStarterClick }) => (
    <div className="space-y-6 mt-6">
        <div>
            <h3 className="font-semibold text-gray-800">文章摘要</h3>
            <p className="text-gray-600 mt-2 p-4 bg-gray-50 rounded-lg border">{result.summary}</p>
        </div>
        <div>
            <h3 className="font-semibold text-gray-800">對話啟動器</h3>
            <p className="text-gray-600 text-sm mb-3">點擊下方任一問題，開始您的對話！</p>
            <div className="space-y-2">
                {result.starters.map((starter, index) => (
                    <button key={index} onClick={() => onStarterClick(starter)} className="w-full p-3 bg-[#E57373]/20 text-left text-gray-800 rounded-lg border border-[#E57373]/50 transition hover:bg-[#ef9a9a] hover:-translate-y-0.5">
                        {starter}
                    </button>
                ))}
            </div>
        </div>
    </div>
);

// --- Main Component ---

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ onAnalyze, isLoading, analysisResult, onStarterClick }) => {
    const [article, setArticle] = useState('');

    return (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-gray-800">文章分析</h2>
            <textarea
                className="w-full flex-grow p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#E57373] transition"
                placeholder="在這裡貼上您想分析的英文文章..."
                value={article}
                onChange={(e) => setArticle(e.target.value)}
                rows={10}
            />
            <button
                onClick={() => onAnalyze(article)}
                disabled={isLoading || !article.trim()}
                className="w-full mt-4 bg-[#E57373] text-white font-bold py-3 px-4 rounded-lg hover:bg-red-500 transition-colors duration-300 disabled:bg-gray-400"
            >
                {isLoading ? '分析中...' : '開始分析'}
            </button>
            
            {isLoading && <Loader />}
            {analysisResult && !isLoading && (
                <ResultDisplay result={analysisResult} onStarterClick={onStarterClick} />
            )}
        </div>
    );
};

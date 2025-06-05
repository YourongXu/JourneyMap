import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import PersonaCard from './PersonaCard';
import './App.css'; // 稍后创建这个CSS文件

function App() {
  const [rawText, setRawText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://127.0.0.1:5001/api'; // 后端API地址

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysisResult(null); // Clear previous results

    try {
      const response = await axios.post(`${API_BASE_URL}/analyze`, { raw_text: rawText });
      const newAnalysisId = response.data.analysis_id;
      await fetchAnalysisResult(newAnalysisId);
    } catch (err) {
      console.error("Analysis failed:", err);
      // 检查是否有详细的错误信息从后端返回
      if (err.response && err.response.data && err.response.data.error) {
          setError(`Analysis failed: ${err.response.data.error}`);
      } else {
          setError("Analysis failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysisResult = async (id) => {
    setError(null);
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/analysis/${id}`);
      setAnalysisResult(response.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error("Failed to fetch analysis result:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(`Failed to load analysis result: ${err.response.data.error}`);
      } else {
        setError("Failed to load analysis result.");
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>UX AI Assistant</h1>
      </header>

      <div className="main-content">
        <div className="input-section">
          <h2>Input User Interview Text</h2>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste user interview text here..."
            rows="15"
          ></textarea>
          <button onClick={handleAnalyze} disabled={loading || !rawText.trim()}>
            {loading ? 'Analyzing...' : 'Start Analysis'}
          </button>

          {error && <p className="error-message">{error}</p>}
        </div>

        {(analysisResult || loading) && (
          <div className="results-section">
            <h3>User Persona</h3>
            <PersonaCard 
              persona={analysisResult?.parsed_data?.persona_data} 
              isLoading={loading}
              error={!loading && !analysisResult?.parsed_data?.persona_data ? "Failed to generate persona data" : null}
            />
            
            {/* 如果JSON解析失败，显示原始Markdown */}
            {!loading && analysisResult && !analysisResult.parsed_data.persona_data && (
              <div className="markdown-content">
                <ReactMarkdown>{analysisResult.parsed_data.persona_md}</ReactMarkdown>
              </div>
            )}

            {!loading && analysisResult && (
              <>
                <h3>User Journey Map</h3>
                <div className="markdown-content">
                  {/* 使用 ReactMarkdown 组件渲染后端返回的 Markdown */}
                  <ReactMarkdown>{analysisResult.parsed_data.journey_map_md}</ReactMarkdown>
                </div>
              </>
            )}

            {/* TODO: 添加下载按钮，前端生成PDF/图片 */}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
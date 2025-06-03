import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css'; // 稍后创建这个CSS文件

function App() {
  const [rawText, setRawText] = useState('');
  const [analysisId, setAnalysisId] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // const [interviews, setInterviews] = useState([]); // 移除或注释掉此行，因为我们不需要持久化历史记录

  const API_BASE_URL = 'http://127.0.0.1:5000/api'; // 后端API地址

  // useEffect(() => { // 移除或注释掉整个 useEffect 块
  //   fetchInterviews();
  // }, []);

  // const fetchInterviews = async () => { // 移除或注释掉此函数
  //   try {
  //     const response = await axios.get(`${API_BASE_URL}/interviews`);
  //     setInterviews(response.data);
  //   } catch (err) {
  //     console.error("Failed to fetch interviews:", err);
  //     setError("Failed to load historical interviews.");
  //   }
  // };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysisResult(null); // Clear previous results
    setAnalysisId(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/analyze`, { raw_text: rawText });
      const newAnalysisId = response.data.analysis_id;
      setAnalysisId(newAnalysisId);
      await fetchAnalysisResult(newAnalysisId);
      // fetchInterviews(); // 移除或注释掉此行，因为不再有持久化历史记录
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

  // const loadPreviousAnalysis = (id) => { // 移除或注释掉此函数
  //   setAnalysisId(id);
  //   fetchAnalysisResult(id);
  // };

  return (
    <div className="App">
      <header className="App-header">
        <h1>UX AI Assistant</h1>
      </header>

      <div className="main-content">
        <div className="input-section">
          <h2>输入用户访谈文本</h2>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="粘贴用户访谈文本到这里..."
            rows="15"
          ></textarea>
          <button onClick={handleAnalyze} disabled={loading || !rawText.trim()}>
            {loading ? '分析中...' : '开始分析'}
          </button>

          {error && <p className="error-message">{error}</p>}
        </div>

        {/* 这里不再包含"历史访谈"部分，因为我们不需要持久化数据 */}
        {/* <div className="history-section">
          <h2>历史访谈</h2>
          {interviews.length === 0 && <p>暂无历史访谈。</p>}
          <ul>
            {interviews.map((interview) => (
              <li key={interview.analysis_id}>
                <button onClick={() => loadPreviousAnalysis(interview.analysis_id)}>
                  {interview.title} ({new Date(interview.timestamp).toLocaleDateString()})
                </button>
              </li>
            ))}
          </ul>
        </div> */}

        {analysisResult && (
          <div className="results-section">
            <h2>分析结果</h2>
            <p>分析ID: {analysisResult.analysis_id}</p>

            <h3>用户问题</h3>
            <pre>{analysisResult.parsed_data.user_problems.join('\n')}</pre>

            <h3>关键词句</h3>
            <pre>{analysisResult.parsed_data.keywords.join('\n')}</pre>

            <h3>情绪分析</h3>
            <p>整体情绪: {analysisResult.parsed_data.overall_sentiment}</p>
            <ul>
              {analysisResult.parsed_data.sentiment_segments.map((s, index) => (
                <li key={index}>
                  "{s.segment}" (情绪: {s.emotion})
                </li>
              ))}
            </ul>

            <h3>用户画像 (Persona)</h3>
            <div className="markdown-content">
              {/* 使用 ReactMarkdown 组件渲染后端返回的 Markdown */}
              <ReactMarkdown>{analysisResult.parsed_data.persona_md}</ReactMarkdown>
            </div>

            <h3>用户旅程图 (Journey Map)</h3>
            <div className="markdown-content">
              {/* 使用 ReactMarkdown 组件渲染后端返回的 Markdown */}
              <ReactMarkdown>{analysisResult.parsed_data.journey_map_md}</ReactMarkdown>
            </div>

            {/* TODO: 添加下载按钮，前端生成PDF/图片 */}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
import React, { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import './PersonaCard.css';

const PersonaCard = ({ persona, isLoading, error }) => {
  const [personaPhoto, setPersonaPhoto] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const cardRef = useRef(null);

  // 生成人物描述用于AI图片生成
  const generatePhotoPrompt = (persona) => {
    if (!persona) return '';
    
    const age = persona.age || 30;
    const occupation = persona.occupation || 'professional';
    const location = persona.location || '';
    
    // 基于名字判断性别
    const femaleNames = ['vera', 'shirley', 'jennifer', 'lisa', 'maria', 'susan', 'karen', 'nancy', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly', 'deborah', 'dorothy', 'jessica', 'ashley', 'emily', 'amanda', 'melissa', 'stephanie', 'nicole', 'elizabeth', 'heather', 'tiffany', 'amber', 'amy'];
    const name = persona.name?.toLowerCase() || '';
    const isFemale = femaleNames.some(fname => name.includes(fname)) || 
                    name.includes('ms.') || name.includes('mrs.');
    
    const gender = isFemale ? 'woman' : 'man';
    
    // 构建详细的提示词
    let prompt = `Professional headshot portrait of a ${age}-year-old ${gender}`;
    
    if (occupation.includes('teacher')) {
      prompt += ', friendly educator, warm smile, professional attire';
    } else if (occupation.includes('nutritionist')) {
      prompt += ', health professional, confident expression, modern business casual';
    } else {
      prompt += `, ${occupation}, professional appearance`;
    }
    
    prompt += ', high quality portrait photography, natural lighting, neutral background, looking at camera';
    
    return prompt;
  };

  // 尝试使用AI图片生成服务
  const generateAIPhoto = async (persona) => {
    const prompt = generatePhotoPrompt(persona);
    console.log('生成图片提示词:', prompt);
    
    // 这里需要调用实际的AI图片生成API
    // 示例使用Pollinations.ai (免费但质量有限)
    try {
      const response = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=500&model=flux&seed=${Math.floor(Math.random() * 1000000)}`);
      if (response.ok) {
        return response.url;
      }
    } catch (error) {
      console.log('AI图片生成失败:', error);
    }
    
    return null;
  };

  // 生成本地SVG头像（备用方案）
  const generateLocalAvatar = useCallback((persona) => {
    if (!persona || !persona.name) return null;
    
    const femaleNames = ['vera', 'shirley', 'jennifer', 'lisa', 'maria', 'susan', 'karen', 'nancy', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura', 'sarah', 'kimberly', 'deborah', 'dorothy', 'jessica', 'ashley', 'emily', 'amanda', 'melissa', 'stephanie', 'nicole', 'elizabeth', 'heather', 'tiffany', 'amber', 'amy'];
    const name = persona.name.toLowerCase();
    const isFemale = femaleNames.some(fname => name.includes(fname)) || 
                    name.includes('ms.') || name.includes('mrs.') ||
                    persona.name.includes('女') || persona.name.includes('小姐') || persona.name.includes('太太');
    
    const initials = persona.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
    
    const colors = isFemale ? 
      ['#ff6b9d', '#e74c3c', '#9b59b6', '#e91e63', '#ff5722'] :
      ['#4A90E2', '#3498db', '#2ecc71', '#f39c12', '#1abc9c'];
    
    const nameHash = persona.name.replace(/\s+/g, '').toLowerCase();
    const colorIndex = nameHash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const bgColor = colors[colorIndex];
    
    const svgContent = `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="bg-${nameHash}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${bgColor}dd;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="500" fill="url(#bg-${nameHash})" rx="12"/>
        <text x="200" y="275" font-family="system-ui,-apple-system,sans-serif" font-size="120" font-weight="300" text-anchor="middle" fill="white" opacity="0.95">${initials}</text>
      </svg>`;
    
    const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
    return dataUrl;
  }, []);

  // 获取头像函数 - 先尝试AI生成，失败则使用本地头像
  const fetchPersonaPhoto = useCallback(async (persona) => {
    if (!persona || !persona.name) return;
    
    setPhotoLoading(true);
    
    try {
      console.log('开始为', persona.name, '生成头像');
      
      // 首先尝试AI图片生成
      const aiPhoto = await generateAIPhoto(persona);
      
      if (aiPhoto) {
        console.log('AI图片生成成功:', aiPhoto);
        setPersonaPhoto(aiPhoto);
      } else {
        console.log('AI图片生成失败，使用本地头像');
        const localAvatar = generateLocalAvatar(persona);
        setPersonaPhoto(localAvatar);
      }
      
    } catch (error) {
      console.error('获取头像时出错:', error);
      // 出错时使用本地头像
      const localAvatar = generateLocalAvatar(persona);
      setPersonaPhoto(localAvatar);
    } finally {
      setPhotoLoading(false);
    }
  }, [generateLocalAvatar]);

  useEffect(() => {
    if (persona && !isLoading && !error) {
      fetchPersonaPhoto(persona);
    }
  }, [persona, isLoading, error, fetchPersonaPhoto]);

  const exportToPNG = async () => {
    if (!cardRef.current) {
      alert('Card not found for export');
      return;
    }

    try {
      console.log('开始导出...');
      
      const exportButton = cardRef.current.querySelector('.export-button');
      if (exportButton) {
        exportButton.style.display = 'none';
      }

      await new Promise(resolve => requestAnimationFrame(resolve));

      const element = cardRef.current;
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: false,
        allowTaint: true,
        logging: false,
        height: element.offsetHeight,
        width: element.offsetWidth,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const clonedCard = clonedDoc.querySelector('.persona-card');
          if (clonedCard) {
            clonedCard.style.margin = '0';
            clonedCard.style.transform = 'none';
            clonedCard.style.animation = 'none';
            clonedCard.style.transition = 'none';
          }
        }
      });

      if (exportButton) {
        exportButton.style.display = 'block';
      }

      const link = document.createElement('a');
      link.download = `${persona?.name || 'persona'}-card.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('导出成功完成');

    } catch (error) {
      console.error('导出失败:', error);
      
      const exportButton = cardRef.current?.querySelector('.export-button');
      if (exportButton) {
        exportButton.style.display = 'block';
      }
      
      alert(`导出失败: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="persona-card">
        <div className="loading">
          Generating persona card...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="persona-card">
        <div className="error">
          {error}
        </div>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="persona-card">
        <div className="loading">
          No persona data available
        </div>
      </div>
    );
  }

  return (
    <div className="persona-card" ref={cardRef}>
      <button className="export-button" onClick={exportToPNG}>
        Export PNG
      </button>
      <div className="persona-main-row">
        <div className="persona-photo-container">
          {photoLoading && (
            <div className="photo-loading">Generating photo...</div>
          )}
          {personaPhoto && !photoLoading ? (
            <img 
              src={personaPhoto} 
              alt={persona.name}
              className="persona-photo"
              onError={() => {
                setPersonaPhoto(generateLocalAvatar(persona));
              }}
              crossOrigin="anonymous"
            />
          ) : !photoLoading && (
            <div className="photo-placeholder">
              {persona.name ? persona.name.charAt(0).toUpperCase() : 'P'}
            </div>
          )}
        </div>
        <div className="persona-info-card">
          <h1 className="persona-name">{persona.name || 'Unknown'}</h1>
          <div className="persona-role">{persona.occupation || 'Professional'}</div>
          <div className="persona-details">
            <div className="detail-item">
              <span className="detail-label">Age:</span>
              <span className="detail-value">{persona.age || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Occupation:</span>
              <span className="detail-value">{persona.occupation || 'Not specified'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Location:</span>
              <span className="detail-value">{persona.location || 'Not specified'}</span>
            </div>
          </div>
          {persona.quote && (
            <div className="persona-quote">
              "{persona.quote}"
            </div>
          )}
          {persona.background && (
            <div className="persona-background">
              <h2 className="section-title">Background</h2>
              <p className="background-text">{persona.background}</p>
            </div>
          )}
        </div>
      </div>
      <div className="persona-divider" />
      <div className="persona-sections">
        <div className="persona-section">
          <h3>Goals</h3>
          <ul>
            {persona.goals && persona.goals.length > 0 ? (
              persona.goals.map((goal, index) => (
                <li key={index}>{goal}</li>
              ))
            ) : (
              <li>No goals specified</li>
            )}
          </ul>
        </div>
        <div className="persona-section">
          <h3>Pain Points</h3>
          <ul>
            {persona.painPoints && persona.painPoints.length > 0 ? (
              persona.painPoints.map((pain, index) => (
                <li key={index}>{pain}</li>
              ))
            ) : (
              <li>No pain points specified</li>
            )}
          </ul>
        </div>
        <div className="persona-section">
          <h3>Interests</h3>
          <ul>
            {persona.interests && persona.interests.length > 0 ? (
              persona.interests.map((interest, index) => (
                <li key={index}>{interest}</li>
              ))
            ) : (
              <li>No interests specified</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PersonaCard;
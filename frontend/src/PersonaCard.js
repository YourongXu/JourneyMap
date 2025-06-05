import React, { useRef } from 'react';
import './PersonaCard.css';

const PersonaCard = ({ personaData, showExportButton = true }) => {
  const cardRef = useRef(null);

  // If no persona data, show loading
  if (!personaData) {
    return (
      <div className="persona-card">
        <div className="persona-loading">Generating persona...</div>
      </div>
    );
  }

  // Export as image (requires html2canvas)
  const exportAsImage = async () => {
    try {
      const html2canvas = await import('html2canvas');
      const canvas = await html2canvas.default(cardRef.current, {
        backgroundColor: 'white',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      const link = document.createElement('a');
      link.download = `persona-${personaData.name || 'user'}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export requires html2canvas. Please run: npm install html2canvas');
    }
  };

  return (
    <div className="persona-container">
      {showExportButton && (
        <div className="persona-actions">
          <button onClick={exportAsImage} className="export-button">
            📸 Export as Image
          </button>
        </div>
      )}
      
      <div className="persona-card" ref={cardRef}>
        {/* Header - Photo and Basic Info */}
        <div className="persona-header">
          <div className="persona-image-container">
            <div className="persona-image-placeholder">
              <span className="persona-initials">{personaData.name ? personaData.name.charAt(0) : 'P'}</span>
            </div>
          </div>
          
          <div className="persona-basic-info">
            <h1 className="persona-name">{personaData.name || 'Persona'}</h1>
            <h2 className="persona-title">{personaData.title || personaData.occupation || 'User'}</h2>
            
            <div className="persona-details">
              <div className="detail-item">
                <span className="detail-label">Age:</span> {personaData.age || 'N/A'}
              </div>
              <div className="detail-item">
                <span className="detail-label">Occupation:</span> {personaData.occupation || 'N/A'}
              </div>
              <div className="detail-item">
                <span className="detail-label">Location:</span> {personaData.location || 'N/A'}
              </div>
            </div>
            
            {personaData.quote && (
              <div className="persona-quote">
                "{personaData.quote}"
              </div>
            )}
          </div>
        </div>

        {/* Background */}
        {personaData.background && (
          <div className="persona-section">
            <h3 className="section-title">Background</h3>
            <p className="background-text">{personaData.background}</p>
          </div>
        )}

        {/* Three columns - Goals, Pain Points, Interests */}
        <div className="persona-three-columns">
          <div className="column">
            <h3 className="column-title">Goals</h3>
            <ul className="column-list">
              {(personaData.goals || []).map((goal, index) => (
                <li key={index}>{goal}</li>
              ))}
              {(!personaData.goals || personaData.goals.length === 0) && (
                <li className="empty-item">No data</li>
              )}
            </ul>
          </div>
          
          <div className="column">
            <h3 className="column-title">Pain Points</h3>
            <ul className="column-list">
              {(personaData.painPoints || []).map((pain, index) => (
                <li key={index}>{pain}</li>
              ))}
              {(!personaData.painPoints || personaData.painPoints.length === 0) && (
                <li className="empty-item">No data</li>
              )}
            </ul>
          </div>
          
          <div className="column">
            <h3 className="column-title">Interests</h3>
            <ul className="column-list">
              {(personaData.interests || []).map((interest, index) => (
                <li key={index}>{interest}</li>
              ))}
              {(!personaData.interests || personaData.interests.length === 0) && (
                <li className="empty-item">No data</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaCard; 
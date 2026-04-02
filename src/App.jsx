import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('image'); // 'image' or 'text'

  // Image State
  const [imgPrompt, setImgPrompt] = useState('');
  const [image, setImage] = useState(null);
  const [loadingImg, setLoadingImg] = useState(false);
  const [errorImg, setErrorImg] = useState(null);

  // Text State
  const [txtPrompt, setTxtPrompt] = useState('');
  const [textResult, setTextResult] = useState('');
  const [loadingTxt, setLoadingTxt] = useState(false);
  const [errorTxt, setErrorTxt] = useState(null);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (image) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  const generateImage = async () => {
    if (!imgPrompt.trim()) {
      setErrorImg('Please enter a prompt to generate an image.');
      return;
    }

    const token = import.meta.env.VITE_HF_TOKEN;
    if (!token) {
      setErrorImg('Missing Hugging Face API token. Please check your .env file.');
      return;
    }

    setErrorImg(null);
    setLoadingImg(true);
    setImage(null);

    try {
      const response = await fetch(
        "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ inputs: imgPrompt }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 503) {
          throw new Error('Model is rapidly booting up! Please retry in a few seconds.');
        }
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      setImage(objectUrl);
    } catch (err) {
      setErrorImg(err.message || 'Something went wrong during generation.');
    } finally {
      setLoadingImg(false);
    }
  };

  const generateText = async () => {
    if (!txtPrompt.trim()) {
      setErrorTxt('Please enter a prompt for the AI to respond to.');
      return;
    }

    const token = import.meta.env.VITE_HF_TOKEN;
    if (!token) {
      setErrorTxt('Missing Hugging Face API token. Please check your .env file.');
      return;
    }

    setErrorTxt(null);
    setLoadingTxt(true);
    setTextResult(''); // Reset previous text

    try {
      const response = await fetch(
        "https://router.huggingface.co/v1/chat/completions",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            model: "Qwen/Qwen2.5-72B-Instruct",
            messages: [{ role: "user", content: txtPrompt }],
            max_tokens: 1000,
            stream: false
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        setTextResult(data.choices[0].message.content);
      } else {
        throw new Error("Invalid response format received from Hugging Face.");
      }
    } catch (err) {
      setErrorTxt(err.message || 'Something went wrong during generation.');
    } finally {
      setLoadingTxt(false);
    }
  };

  return (
    <div className="playground-container">
      {/* Left panel: Controls */}
      <aside className="controls-panel">
        <header className="brand-header">
          <h1>AI Studio</h1>
          <p>Text & Image Generation</p>
        </header>

        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => setActiveTab('image')}
          >
            🎨 Image Gen
          </button>
          <button
            className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveTab('text')}
          >
            💬 Text Gen
          </button>
        </div>

        {activeTab === 'image' ? (
          <div className="tab-content fade-in">
            <div className="input-section">
              <label htmlFor="imgPromptInput">Image Prompt</label>
              <textarea
                id="imgPromptInput"
                value={imgPrompt}
                onChange={(e) => setImgPrompt(e.target.value)}
                placeholder="Describe the image you want... (e.g. A cyberpunk city at sunset, highly detailed, 8k)"
                disabled={loadingImg}
              />
            </div>

            {errorImg && <div className="error-alert">⚠️ {errorImg}</div>}

            {loadingImg && (
              <div className="info-alert">
                <span className="spinner"></span>
                Generating Image rapidly...
              </div>
            )}

            <button
              className="generate-btn"
              onClick={generateImage}
              disabled={loadingImg || !imgPrompt.trim()}
            >
              {loadingImg ? 'Synthesizing...' : 'Generate Image'}
            </button>
          </div>
        ) : (
          <div className="tab-content fade-in">
            <div className="input-section">
              <label htmlFor="txtPromptInput">Text Prompt</label>
              <textarea
                id="txtPromptInput"
                value={txtPrompt}
                onChange={(e) => setTxtPrompt(e.target.value)}
                placeholder="Ask the AI a question or request a story..."
                disabled={loadingTxt}
              />
            </div>

            {errorTxt && <div className="error-alert">⚠️ {errorTxt}</div>}

            {loadingTxt && (
              <div className="info-alert">
                <span className="spinner"></span>
                Thinking rapidly...
              </div>
            )}

            <button
              className="generate-btn"
              onClick={generateText}
              disabled={loadingTxt || !txtPrompt.trim()}
            >
              {loadingTxt ? 'Processing...' : 'Generate Text'}
            </button>
          </div>
        )}
      </aside>

      {/* Right panel: Output space */}
      <main className="output-panel">
        {activeTab === 'image' ? (
          <div className={`canvas image-canvas ${!image && !loadingImg ? 'empty' : ''} ${loadingImg ? 'loading-pulse' : ''}`}>
            {loadingImg ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <h2>Synthesizing Pixels...</h2>
                <p>Processing neural pathways</p>
              </div>
            ) : image ? (
              <img src={image} alt={`Visual for: ${imgPrompt}`} className="generated-result" />
            ) : (
              <div className="empty-state">
                <div className="empty-icon">✨</div>
                <h2>Awaiting Inspiration</h2>
                <p>Your generated image will appear here.</p>
              </div>
            )}
          </div>
        ) : (
          <div className={`canvas text-canvas ${!textResult && !loadingTxt ? 'empty' : ''} ${loadingTxt ? 'loading-pulse' : ''}`}>
            {loadingTxt ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <h2>Generating Response...</h2>
                <p>Consulting vast language knowledge</p>
              </div>
            ) : textResult ? (
              <div className="text-result fade-in">
                <p className="text-output">{textResult}</p>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h2>Ready Context</h2>
                <p>Your generated text will appear here.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

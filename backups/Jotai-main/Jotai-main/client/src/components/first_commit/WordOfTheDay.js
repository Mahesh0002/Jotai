import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './WordOfTheDay.css';

const WordOfTheDay = () => {
  const [kanjiData, setKanjiData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const apiKey = process.env.REACT_APP_KANJI_API_KEY;
  const voiceRssKey = process.env.REACT_APP_VOICE_RSS_KEY;

  const kanjiList = ['愛', '勇', '力', '光', '風', '水', '火', '地', '空'];

  const fetchKanjiDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    const randomKanji = kanjiList[Math.floor(Math.random() * kanjiList.length)];

    try {
      const response = await fetch(
        `https://kanjialive-api.p.rapidapi.com/api/public/kanji/${randomKanji}`,
        {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'kanjialive-api.p.rapidapi.com',
          },
        }
      );

      if (!response.ok) throw new Error(`Error fetching Kanji: ${response.status}`);

      const kanjiDetails = await response.json();

      if (!kanjiDetails || !kanjiDetails.kanji) throw new Error('Invalid Kanji data received.');

      setKanjiData(kanjiDetails);
    } catch (err) {
      setError('Could not load Kanji. Showing a default example.');
      setKanjiData({
        kanji: { character: '力' }, // Default Kanji
        meaning: { english: 'Strength' },
        kunyomi: { romaji: ['ちから'] },
        onyomi: { romaji: ['リョク'] },
        examples: [
          { japanese: '力持ち', meaning: { english: 'Strong person' } },
          { japanese: '体力', meaning: { english: 'Physical strength' } },
        ],
      });
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    fetchKanjiDetails();
    const interval = setInterval(fetchKanjiDetails, 86400000); // Refresh every 24 hours
    return () => clearInterval(interval);
  }, [fetchKanjiDetails]);

  const speakText = (text) => {
    if (!text || text === 'N/A') return;
    const audio = new Audio(
      `https://api.voicerss.org/?key=${voiceRssKey}&hl=ja-jp&src=${encodeURIComponent(text)}`
    );
    audio.play().catch((err) => console.error('Audio playback error:', err));
  };

  const meaning = kanjiData?.meaning?.english || 'N/A';
  const kunyomi = kanjiData?.kunyomi?.romaji?.join(', ') || 'N/A';
  const onyomi = kanjiData?.onyomi?.romaji?.join(', ') || 'N/A';

  return (
    <motion.div
      className="word-of-the-day-widget"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h3>Daily Lore</h3>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.p
            key="loading"
            className="loading-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            Loading...
          </motion.p>
        )}
        {error && !loading && (
          <motion.p
            key="error"
            className="error-message"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.p>
        )}
        {kanjiData && !loading && (
          <motion.div
            key={kanjiData.kanji.character}
            className={`kanji-info${isExpanded ? ' expanded' : ''}`}
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.4 }}
            layout
          >
            <h4>Kanji: {kanjiData.kanji.character}</h4>
            <p>
              Meaning: {meaning}{" "}
              <button className="speak-btn" onClick={() => speakText(meaning)}>🔊</button>
            </p>
            <p>
              Kun-yomi: {kunyomi}{" "}
              <button className="speak-btn" onClick={() => speakText(kunyomi)}>🔊</button>
            </p>
            <p>
              On-yomi: {onyomi}{" "}
              <button className="speak-btn" onClick={() => speakText(onyomi)}>🔊</button>
            </p>

            <AnimatePresence>
              {isExpanded && kanjiData.examples?.length > 0 && (
                <motion.div
                  key="examples"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.35 }}
                >
                  <p>Examples:</p>
                  <ul>
                    {kanjiData.examples.map((example, index) => (
                      <li key={index}>
                        {example.japanese || 'N/A'} ({example.meaning?.english || 'N/A'})
                        <button className="speak-btn" onClick={() => speakText(example.japanese)}>🔊</button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="expand-btn"
        onClick={() => setIsExpanded((prev) => !prev)}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.04 }}
      >
        {isExpanded ? 'Show Less' : 'Show More'}
      </motion.button>
    </motion.div>
  );
};

export default WordOfTheDay;

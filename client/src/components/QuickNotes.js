import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './QuickNotes.css';

const QuickNotes = () => {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    const savedNotes = JSON.parse(localStorage.getItem('notes'));
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  const handleAddNote = () => {
    if (note.trim()) {
      const newNotes = [...notes, note];
      setNotes(newNotes);
      localStorage.setItem('notes', JSON.stringify(newNotes));
      setNote('');
    }
  };

  const handleRemoveNote = (index) => {
    const newNotes = notes.filter((_, i) => i !== index);
    setNotes(newNotes);
    localStorage.setItem('notes', JSON.stringify(newNotes));
  };

  return (
    <motion.div
      className="notes-card skill-mastery-animated"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h3 className="cyberpunk-flicker">Inventory Notes</h3>
      <div className="notes-bar">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Type your notes..."
          className="notes-input"
        />
        <button onClick={handleAddNote} className="add-note-btn animated-btn">
          Add Note
        </button>
      </div>
      <ul>
        <AnimatePresence>
          {notes.map((note, index) => (
            <motion.li
              key={note + index}
              className="neon-pulse"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              layout
            >
              {note}
              <button
                onClick={() => handleRemoveNote(index)}
                className="remove-btn"
              >
                Delete
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </motion.div>
  );
};

export default QuickNotes;

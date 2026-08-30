"use client"

import { useState } from "react"
import { useQuests } from "./QuestContext"
import { Check, Trash2, Plus, Edit } from 'lucide-react' // Added Edit icon
import "./DailyGoals.css"

// --- DailyGoals Component ---
function DailyGoals() {
  // Get quest context data and functions
  const { goals, animating, showLevelUp, addGoal, toggleComplete, deleteGoal, editGoal } = useQuests()

  const [showInput, setShowInput] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  
  // Edit functionality state
  const [editingGoal, setEditingGoal] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")

  // Handle form submission for adding new goal
  function handleAddGoal(e) {
    e.preventDefault()
    if (addGoal(title, description)) {
      setTitle("")
      setDescription("")
      setShowInput(false)
    }
  }

  // Handle edit goal
  function handleEditGoal(goal) {
    setEditingGoal(goal.id)
    setEditTitle(goal.title)
    setEditDescription(goal.description || "")
  }

  // Handle save edit
  function handleSaveEdit(e) {
    e.preventDefault()
    if (editTitle.trim()) {
      editGoal(editingGoal, editTitle, editDescription)
      setEditingGoal(null)
      setEditTitle("")
      setEditDescription("")
    }
  }

  // Handle cancel edit
  function handleCancelEdit() {
    setEditingGoal(null)
    setEditTitle("")
    setEditDescription("")
  }

  return (
    <div className="daily-goals">
      <h2>DAILY QUEST</h2>
      <div className="quest-container">
        <ul className="goals-list">
          {goals.map((goal) => {
            const isDeleting = animating[goal.id]?.deleting
            const isCompleting = animating[goal.id]?.completing
            const animationClasses = isDeleting
              ? "task-delete-animation"
              : isCompleting
                ? "task-complete-animation"
                : ""
            const completionClasses = goal.completed ? "completed-task" : ""

            // Check if this goal is being edited
            const isEditing = editingGoal === goal.id

            return (
              <li key={goal.id} className={`goal-item ${completionClasses} ${animationClasses}`} data-id={goal.id}>
                {isEditing ? (
                  // Edit mode
                  <form onSubmit={handleSaveEdit} className="edit-goal-form">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="edit-input"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className="edit-input"
                    />
                    <div className="edit-actions">
                      <button type="submit" className="save-btn">Save</button>
                      <button type="button" onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                    </div>
                  </form>
                ) : (
                  // Display mode
                  <>
                    <div className="goal-content">
                      <div className="goal-title">{goal.title}</div>
                      {goal.description && <div className="goal-description">{goal.description}</div>}
                    </div>
                    <div className="goal-actions">
                      <button
                        className={`goal-check-btn ${goal.completed ? "goal-completed" : ""}`}
                        onClick={() => toggleComplete(goal.id)}
                        aria-label={goal.completed ? "Mark as incomplete" : "Mark as complete"}
                        disabled={isCompleting}
                      >
                        <Check className="check-icon" />
                      </button>
                      <button
                        className="goal-edit-btn"
                        onClick={() => handleEditGoal(goal)}
                        aria-label="Edit goal"
                        disabled={isDeleting || isCompleting}
                      >
                        <Edit className="edit-icon" />
                      </button>
                      <button
                        className="goal-delete-btn"
                        onClick={() => deleteGoal(goal.id)}
                        aria-label="Delete goal"
                        disabled={isDeleting}
                      >
                        <Trash2 className="delete-icon" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>

        {/* Add Goal Button at the bottom */}
        {showInput ? (
          <form onSubmit={handleAddGoal} className="add-goal-form">
            <label>
              New Quest
              <input
                type="text"
                className="quest-input"
                placeholder="Add a new daily quest..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </label>
            <label>
              Description (optional)
              <input
                type="text"
                className="quest-input"
                placeholder="Add a description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button type="button" className="add-goal-btn cancel-btn" onClick={() => setShowInput(false)}>
                Cancel
              </button>
              <button type="submit" className="add-goal-btn add-quest-btn" id="add_daily_quest">
                <Plus className="add-icon" />
                Add Daily Quest
              </button>
            </div>
          </form>
        ) : (
          <button className="add-goal-btn" onClick={() => setShowInput(true)}>
            + Add Goal
          </button>
        )}
      </div>

      {/* Level Up Animation */}
      {showLevelUp && (
        <div className="level-up-animation">
          <span className="level-up-text">Level UP!</span>
          <span className="level-up-subtext">All Quests Completed</span>
        </div>
      )}
    </div>
  )
}

export default DailyGoals

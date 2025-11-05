import React from 'react';

// You will also need to pass the deleteTask and regenerateTask functions as props
const TaskItem = ({ task, loadingId, regenerateTask, deleteTask }) => {
  // Check if the current task is the one being loaded/regenerated
  const isLoading = loadingId === task.title;

  // Function to format the suggestion
  const formatSuggestion = (suggestion) => {
    if (!suggestion) return "Processing AI suggestion...";
    // Replace numbered list items with newlines for better readability
    return suggestion.replaceAll(/(\d+\.\s)/g, "\n$1").trim();
  };

  return (
    <li className="task-item">
      <div className="task-header">
        <b className="task-title">{task.title}</b>
        <div className="task-actions">
          <button
            onClick={() => regenerateTask(task.title)}
            className="action-button regenerate-button"
            disabled={isLoading} // Disable button while loading
          >
            🔁
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="action-button delete-button"
          >
            🗑️
          </button>
        </div>
      </div>

      <p className={`ai-suggestion ${task.aiSuggestion ? '' : 'placeholder'}`}>
        {isLoading
          ? "⚙️ Generating AI plan..."
          : formatSuggestion(task.aiSuggestion)}
      </p>
    </li>
  );
};

export default TaskItem;
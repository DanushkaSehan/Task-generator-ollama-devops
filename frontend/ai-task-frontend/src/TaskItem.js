import React from "react";

function TaskItem({ task, loadingId, regenerateTask, deleteTask }) {
  return (
    <li className="task-item">
      <div className="task-header">
        <b className="task-title">{task.title}</b>
        <div className="task-actions">
          <button
            onClick={() => regenerateTask(task.title)}
            className="action-button regenerate-button"
            disabled={loadingId === task.title}
          >
            Regenerate
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="action-button delete-button"
          >
            Delete
          </button>
        </div>
      </div>
      <p
        className={`ai-suggestion ${
          task.aiSuggestion ? "" : "placeholder"
        }`}
      >
        {loadingId === task.title
          ? "Generating AI plan..."
          : task.aiSuggestion
          ? task.aiSuggestion.replaceAll(/(\d+\.\s)/g, "\n$1").trim()
          : "Processing AI suggestion..."}
      </p>
    </li>
  );
}

export default TaskItem;

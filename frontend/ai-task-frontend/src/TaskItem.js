import React from "react";

function TaskItem({ task, loadingId, regenerateTask, deleteTask }) {
  // Function to convert AI suggestion text to HTML safely
  const formatSuggestion = (text) => {
    if (!text) return "Processing AI suggestion...";

    // Step 1: Escape < and > to prevent HTML injection
    let safe = text
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Step 2: Convert **bold** Markdown syntax
    safe = safe.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Step 3: Convert numbered list formatting ("1. ", "2. ", etc.)
    safe = safe.replace(/(\d+)\.\s/g, "<br/><span class='num'>$1.</span> ");

    // Step 4: Convert newlines into <br> for paragraph spacing
    safe = safe.replace(/\n/g, "<br/>");

    return safe;
  };

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

      <div
        className={`ai-suggestion ${
          task.aiSuggestion ? "" : "placeholder"
        }`}
        dangerouslySetInnerHTML={{
          __html:
            loadingId === task.title
              ? "Generating AI plan..."
              : formatSuggestion(task.aiSuggestion),
        }}
      />
    </li>
  );
}

export default TaskItem;

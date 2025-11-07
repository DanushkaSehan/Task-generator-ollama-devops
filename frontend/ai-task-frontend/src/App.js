import React, { useEffect, useState } from "react";
import axios from "axios";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import "./App.css";
import TaskItem from "./TaskItem";

let stompClient = null;

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  // 🆕 Unique session ID per user/page
  const [sessionId] = useState(() => {
    // Keep consistent per browser tab
    const existing = sessionStorage.getItem("sessionId");
    if (existing) return existing;
    const newId = Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem("sessionId", newId);
    return newId;
  });

  useEffect(() => {
    connectWebSocket();
    return () => stompClient && stompClient.deactivate();
  }, []);

  // 🧠 Connect WebSocket using SockJS + STOMP
  const connectWebSocket = () => {
    const ws = new SockJS("/ws");
    stompClient = new Client({
      webSocketFactory: () => ws,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("✅ Connected to WebSocket");

        // 🆕 Subscribe to a session-specific topic
        const topic = `/topic/task-updates/${sessionId}`;
        console.log(`📡 Subscribing to: ${topic}`);
        stompClient.subscribe(topic, (message) => {
          const updatedTask = JSON.parse(message.body);
          console.log("📩 Received task update:", updatedTask);

          setTasks((prev) => {
            const exists = prev.find((t) => t.id === updatedTask.id);
            if (exists) {
              return prev.map((t) =>
                t.id === updatedTask.id
                  ? { ...t, aiSuggestion: updatedTask.aiSuggestion }
                  : t
              );
            }
            return [...prev, updatedTask];
          });

          setLoadingId(null);
        });
      },
    });
    stompClient.activate();
  };

  // ✳️ Create task: send sessionId to backend
  const createTask = async () => {
    if (!title.trim()) return;
    try {
      await axios.post("/api/tasks", { title, sessionId });
      setLoadingId(title);
      setTitle("");
    } catch (e) {
      console.error("❌ Error creating task:", e);
    }
  };

  // ♻️ Regenerate task using same sessionId
  const regenerateTask = async (taskTitle) => {
    setLoadingId(taskTitle);
    try {
      await axios.post("/api/tasks", { title: taskTitle, sessionId });
    } catch (e) {
      console.error("❌ Error regenerating task:", e);
    }
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="app-container">
      <h1 className="main-title">🧠 AI Task Assistant</h1>

      <div className="input-section">
        <input
          placeholder="Enter a task (e.g., Build RTMP server)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="task-input"
        />
        <button onClick={createTask} className="add-button">
          ➕ Add Task
        </button>
      </div>

      <ul className="task-list">
        {tasks.map((t) => (
          <TaskItem
            key={t.id}
            task={t}
            loadingId={loadingId}
            regenerateTask={regenerateTask}
            deleteTask={deleteTask}
          />
        ))}
      </ul>
    </div>
  );
}

export default App;

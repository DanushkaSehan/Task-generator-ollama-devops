import React, { useEffect, useState } from "react";
import axios from "axios";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import './App.css'; // ⬅️ IMPORT THE CSS FILE
import TaskItem from './TaskItem'; // ⬅️ IMPORT TaskItem component

let stompClient = null;

function App() {
  const [tasks, setTasks] = useState(() => {
    // ... (rest of the state and hooks are unchanged)
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [title, setTitle] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  // Save tasks persistently
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    fetchTasks();
    connectWebSocket();

    return () => {
      if (stompClient) stompClient.deactivate();
    };
  }, []);

  const fetchTasks = async () => {
    // ... (unchanged)
    try {
      const res = await axios.get("/api/tasks");
      setTasks(res.data);
    } catch (e) {
      console.error("Error fetching tasks:", e);
    }
  };

  const connectWebSocket = () => {
    // ... (unchanged)
    const ws = new SockJS("/ws");
    stompClient = new Client({
      webSocketFactory: () => ws,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("✅ Connected to WebSocket");
        stompClient.subscribe("/topic/task-updates", (message) => {
          const updatedTask = JSON.parse(message.body);
          console.log("📩 Received:", updatedTask);

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

  const createTask = async () => {
    // ... (unchanged)
    if (!title.trim()) return;
    try {
      await axios.post("/api/tasks", { title });
      setLoadingId(title);
      setTitle("");
    } catch (e) {
      console.error("Error creating task:", e);
    }
  };

  const regenerateTask = async (taskTitle) => {
    // ... (unchanged)
    setLoadingId(taskTitle);
    try {
      await axios.post("/api/tasks", { title: taskTitle });
    } catch (e) {
      console.error("Error regenerating task:", e);
    }
  };
  
  // Note: deleteTask is only locally removing the task from the list,
  // it might be better to call an API endpoint here too for persistence.
  const deleteTask = (id) => { 
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };


  return (
    <div className="app-container"> {/* Using class name instead of style */}
      <h1 className="main-title">
        🧠 **AI Task Assistant**
      </h1>

      {/* Input Section */}
      <div className="input-section"> {/* Using class name instead of style */}
        <input
          placeholder="Enter a task (e.g., Build RTMP server)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="task-input" // Using class name instead of style
        />
        <button
          onClick={createTask}
          className="add-button" // Using class name instead of style
        >
          ➕ **Add Task**
        </button>
      </div>

      {/* Task List */}
      <ul className="task-list"> {/* Using class name instead of style */}
        {tasks.map((t) => (
          // Use the separated TaskItem component
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
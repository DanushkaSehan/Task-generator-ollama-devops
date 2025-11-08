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

  useEffect(() => {
    connectWebSocket();
    return () => stompClient && stompClient.deactivate();
  }, []);

  const connectWebSocket = () => {
    const ws = new SockJS("/ws");
    stompClient = new Client({
      webSocketFactory: () => ws,
      reconnectDelay: 5000,
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("Connected to WebSocket");
        stompClient.subscribe("/topic/task-updates", (message) => {
          const updatedTask = JSON.parse(message.body);
          setTasks((prev) => {
            const exists = prev.find((t) => t.id === updatedTask.id);
            if (exists) {
              return prev.map((t) =>
                t.id === updatedTask.id
                  ? { ...t, aiSuggestion: updatedTask.aiSuggestion }
                  : t
              );
            }
            return [updatedTask, ...prev];
          });
          setLoadingId(null);
        });
      },
      onStompError: (frame) => console.error("STOMP error:", frame),
    });
    stompClient.activate();
  };

  const createTask = async () => {
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
    setLoadingId(taskTitle);
    try {
      await axios.post("/api/tasks", { title: taskTitle });
    } catch (e) {
      console.error("Error regenerating task:", e);
    }
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="app-wrapper">
      <div className="main-container">
        <h1 className="main-title">AI Task Assistant</h1>
        <p className="subtitle">
          Smartly organize and refine your daily tasks with AI insights.
        </p>

        <div className="input-section">
          <input
            placeholder="Enter a task (e.g., Deploy AI backend)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="task-input"
          />
          <button onClick={createTask} className="add-button">
            Add
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
    </div>
  );
}

export default App;

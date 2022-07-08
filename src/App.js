import { useState, useEffect, useReducer } from "react";
import './App.css'

// fetch('http://localhost:5000/todos')
// .then(response => response.json())
// .then(data => console.log(data)
//   )

const initialTasks = [
  { id: 1, text: "Learn React", done: true, date: new Date(), color: "green" },
  { id: 2, text: "Learn Next js", done: false, date: new Date(), color: "red" }
];

const availableColors = ["green", "blue", "orange", "purple", "red"];

const StatusFilter = {
  ALL: "all",
  ACTIVE: "active",
  COMPLETED: "completed"
};

function deserializeDates(tasks) {
  return tasks.map((task) => {
    task.date = new Date(task.date);
    return task;
  });
}

function useLocalStorage(key, initialValue, initializer = (arg) => arg) {
  const [state, setState] = useState(() => {
    const storageValue = window.localStorage.getItem(key);

    if (storageValue !== null) {
      try {
        return initializer(JSON.parse(storageValue));
      } catch (err) {
        window.localStorage.removeItem(key);
      }
    }

    return initialValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

function tasksReducer(currentTasks, action) {
  switch (action.type) {
    case "addTask": {
      return [
        ...currentTasks,
        {
          id: Date.now(),
          text: action.payload,
          done: false,
          date: new Date(),
          color: ""
        }
      ];
    }
    case "deleteTask": {
      return currentTasks.filter((task) => task.id !== action.payload);
    }
    case "editTask": {
      const { taskId, newText } = action.payload;
      return currentTasks.map((task) =>
        task.id === taskId ? { ...task, text: newText } : task
      );
    }
    case "toggleTask": {
      return currentTasks.map((task) =>
        task.id === action.payload ? { ...task, done: !task.done } : task
      );
    }
    case "changeColor": {
      const { taskId, newColor } = action.payload;
      return currentTasks.map((task) =>
        task.id === taskId ? { ...task, color: newColor } : task
      );
    }
    case "markAllCompleted": {
      return currentTasks.map((task) => ({ ...task, done: true }));
    }
    case "clearCompleted": {
      return currentTasks.filter((task) => !task.done);
    }
    default: {
      throw new Error(`Неожиданный action.type "${action.type}"`);
    }
  }
}

function useLocalStorageReducer(
  key,
  reducer,
  initialValue,
  initializer = (arg) => arg
) {
  const [state, dispatch] = useReducer(
    reducer,
    initialValue,
    (initialValue) => {
      const loadFromLocalStorage = window.localStorage.getItem(key);
      if (loadFromLocalStorage !== null) {
        try {
          return initializer(JSON.parse(loadFromLocalStorage));
        } catch {
          window.localStorage.removeItem(key);
        }
      }
      return initialValue;
    }
  );

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, dispatch];
}

export default function App() {

  const [tasks, dispatch] = useLocalStorageReducer(
    "tasks",
    tasksReducer,
    initialTasks,
    deserializeDates
  );
  const [editedId, setEditedId] = useState(null);
  const [statusFilter, setStatusFilter] = useLocalStorage(
    "statusFilter",
    StatusFilter.ALL
  );
  const [search, setSearch] = useLocalStorage("search", "");
  const [colors, setColors] = useLocalStorage("colors", []);

  const cleanSearch = search.trim().toLowerCase();
  let filteredTasks = tasks;

  if (
    statusFilter !== StatusFilter.ALL ||
    colors.length !== 0 ||
    cleanSearch.length !== 0
  ) {
    filteredTasks = tasks.filter((task) => {
      const showDone = statusFilter === StatusFilter.COMPLETED;
      const statusMatches =
        statusFilter === StatusFilter.ALL || task.done === showDone;
      const searchMatches = task.text.toLowerCase().includes(cleanSearch);
      const colorMatches = colors.length === 0 || colors.includes(task.color);
      return statusMatches && searchMatches && colorMatches;
    });
  }

  const handleAdd = (event) => {
    event.preventDefault();

    const { value } = event.target.newTask;
    const newText = value.trim();

    if (newText === "") {
      return;
    }
    dispatch({ type: "addTask", payload: newText });

    event.target.reset();
    event.target.newTask.focus();
  };

  const handleEdit = (event, taskId) => {
    event.preventDefault();

    const { value } = event.target.changeName;
    const newText = value.trim();

    if (newText === "") {
      return;
    }

    dispatch({ type: "editTask", payload: { taskId, newText } });
    setEditedId(null);
  };

  const { activeTasks, completedTasks } = tasks.reduce(
    (obj, task) => {
      if (task.done) {
        obj.completedTasks++;
      } else {
        obj.activeTasks++;
      }
      return obj;
    },
    { activeTasks: 0, completedTasks: 0 }
  );

  return (
    <div className="App">
      <h1>What needs to be done?</h1>
      <form onSubmit={handleAdd}>
        <input type="text" name="newTask" />
        <button>Add #{tasks.length + 1}</button>
      </form>

      <div>
        {Object.entries(StatusFilter).map(([statusName, statusValue]) => {
          return (
            <button
              onClick={() => setStatusFilter(statusValue)}
              style={{
                fontWeight: statusFilter === statusValue ? "bold" : null
              }}
            >
              {capitalize(statusName.toLowerCase())}
            </button>
          );
        })}
      </div>

      <h2>
        {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}{" "}
        remaining
      </h2>

      <input
        type="search"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <ul style={{ listStyle: "none" }}>
        {filteredTasks.map((task) => (
          <li>
            {editedId === task.id ? (
              <form onSubmit={(e) => handleEdit(e, task.id)}>
                <input
                  type="text"
                  name="changeName"
                  defaultValue={task.text}
                  autoFocus
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditedId(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <div>
                <label>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() =>
                      dispatch({ type: "toggleTask", payload: task.id })
                    }
                  />
                  {task.done ? <del>{task.text}</del> : task.text}
                </label>
                <select
                  style={{ color: task.color }}
                  value={task.color}
                  onChange={(e) =>
                    dispatch({
                      type: "changeColor",
                      payload: { taskId: task.id, newColor: e.target.value }
                    })
                  }
                >
                  <option></option>
                  {availableColors.map((color) => {
                    return (
                      <option value={color} style={{ color }}>
                        {capitalize(color)}
                      </option>
                    );
                  })}
                </select>
                <button onClick={() => setEditedId(task.id)}>Edit</button>
                <button
                  onClick={() =>
                    dispatch({ type: "deleteTask", payload: task.id })
                  }
                >
                  Delete
                </button>

                <span>
                  {task.date.toLocaleTimeString(["ru"])},{" "}
                  {task.date.toLocaleDateString(["ru"])}
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p>
        {`Total: ${tasks.length}, Active: ${activeTasks}, Completed: ${completedTasks}`}
      </p>

      <h2>Actions</h2>
      <button onClick={() => dispatch({ type: "markAllCompleted" })}>
        Mark all completed
      </button>
      <button onClick={() => dispatch({ type: "clearCompleted" })}>
        Clear completed
      </button>

      <div>
        <h2>Filter By Color</h2>
        {availableColors.map((color) => {
          function handleCheckboxChange(e) {
            if (e.target.checked) {
              setColors((prevColors) => [...prevColors, color]);
            } else {
              setColors((prevColors) => prevColors.filter((c) => c !== color));
            }
          }
          return (
            <label>
              <input
                type="checkbox"
                checked={colors.includes(color)}
                onChange={handleCheckboxChange}
              />
              {capitalize(color)}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

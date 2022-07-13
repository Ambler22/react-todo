import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import App from "./App"

let id = 1

function createTask({ text, done = false, color = "" }) {
  return { id: id++, date: new Date(), text, color, done }
}

function getNewTaskInput() {
  return screen.getByRole("textbox", { name: /what needs to be done\?/i })
}

beforeEach(() => {
  window.localStorage.clear()
})

test("add new task", () => {
  render(<App initialTasks={[]} />)

  const tasksList = screen.getByRole("list", { name: /0 tasks remaining/i })

  const tasksRemainingHeading = screen.getByRole("heading", {
    name: /0 tasks remaining/i,
  })
  const totalActiveCompleted = screen.getByText(
    /Total: 0, Active: 0, Completed: 0/i
  )

  const newTaskInput = getNewTaskInput()
  const text = "This is a new todo"
  userEvent.type(newTaskInput, text)

  const addTaskButton = screen.getByRole("button", { name: /add #1/i })
  userEvent.click(addTaskButton)

  expect(screen.getByText(text)).toBeInTheDocument()
  expect(tasksList.children).toHaveLength(1)

  expect(addTaskButton).toHaveTextContent(/add #2/i)
  expect(tasksRemainingHeading).toHaveTextContent(/1 task remaining/i)
  expect(totalActiveCompleted).toHaveTextContent(
    /Total: 1, Active: 1, Completed: 0/i
  )

  expect(newTaskInput).toHaveFocus()
  expect(newTaskInput).toHaveValue("")
})

test("can not add empty task", () => {
  render(<App initialTasks={[]} />)

  const tasksList = screen.getByRole("list", { name: /0 tasks remaining/i })
  const newTaskInput = getNewTaskInput()
  userEvent.type(newTaskInput, "      ")

  const addTaskButton = screen.getByRole("button", { name: /add #1/i })
  userEvent.click(addTaskButton)

  expect(tasksList.children).toHaveLength(0)
})

test("delete task", () => {
  const task = createTask({ text: "Learn React" })
  render(<App initialTasks={[task]} />)

  const taskLabel = screen.getByText(task.text)
  const deleteTask = screen.getByRole("button", { name: /delete/i })
  userEvent.click(deleteTask)

  expect(taskLabel).not.toBeInTheDocument()
  expect(screen.getByRole("button", { name: /add #1/i })).toBeInTheDocument()
  expect(
    screen.getByRole("heading", { name: /0 tasks remaining/i })
  ).toBeInTheDocument()
  expect(
    screen.getByText(/Total: 0, Active: 0, Completed: 0/i)
  ).toBeInTheDocument()
})

test("edit task", () => {
  const task = createTask({ text: "Learn React" })
  render(<App initialTasks={[task]} />)
  const newTaskText = "qwerty"

  const editTaskButton = screen.getByRole("button", { name: /edit/i })
  userEvent.click(editTaskButton)
  const editTaskInput = screen.getByDisplayValue(task.text)

  expect(editTaskInput).toHaveFocus()

  userEvent.type(editTaskInput, newTaskText)
  const saveTaskButton = screen.getByRole("button", { name: /save/i })
  userEvent.click(saveTaskButton)

  expect(screen.getByText(task.text + newTaskText)).toBeInTheDocument()
  expect(saveTaskButton).not.toBeInTheDocument()
})

test("can not edit task with empty text", () => {
  const task = createTask({ text: "Learn React" })
  render(<App initialTasks={[task]} />)

  const editTaskButton = screen.getByRole("button", { name: /edit/i })
  userEvent.click(editTaskButton)
  const editTaskInput = screen.getByDisplayValue(task.text)

  userEvent.clear(editTaskInput)
  userEvent.type(editTaskInput, "      ")

  const saveTaskButton = screen.getByRole("button", { name: /save/i })
  userEvent.click(saveTaskButton)

  expect(saveTaskButton).toBeInTheDocument()
})

test("edit task cancel", () => {
  const task = createTask({ text: "Learn React" })
  render(<App initialTasks={[task]} />)
  const newTaskText = "qwerty"

  const editTaskButton = screen.getByRole("button", { name: /edit/i })
  userEvent.click(editTaskButton)
  const editTaskInput = screen.getByDisplayValue(task.text)
  userEvent.type(editTaskInput, newTaskText)
  const cancelTaskButton = screen.getByRole("button", { name: /cancel/i })
  userEvent.click(cancelTaskButton)

  expect(screen.queryByText(task.text + newTaskText)).not.toBeInTheDocument()
  expect(cancelTaskButton).not.toBeInTheDocument()
})

test("toggle task status", () => {
  const task = createTask({ text: "Learn React", done: false })
  render(<App initialTasks={[task]} />)

  const checkboxTask = screen.getByRole("checkbox", { name: task.text })
  const totalActiveCompleted = screen.getByText(
    /Total: 1, Active: 1, Completed: 0/i
  )

  expect(checkboxTask).not.toBeChecked()
  userEvent.click(checkboxTask)
  expect(checkboxTask).toBeChecked()

  const taskText = screen.getByText(task.text)
  expect(taskText.nodeName).toEqual("DEL")
  expect(totalActiveCompleted).toHaveTextContent(
    /Total: 1, Active: 0, Completed: 1/i
  )
})

test("change task color", () => {
  const task = createTask({ text: "Learn React", color: "blue" })
  render(<App initialTasks={[task]} />)

  const colorSelect = screen.getByDisplayValue(new RegExp(task.color, "i"))
  const greenOption = screen.getByRole("option", { name: /green/i })
  userEvent.selectOptions(colorSelect, greenOption)

  expect(greenOption.selected).toBe(true)
})

test("mark all completed", () => {
  const task1 = createTask({ text: "Learn React", done: false })
  const task2 = createTask({ text: "Learn JS", done: false })
  render(<App initialTasks={[task1, task2]} />)

  const markAllCompletedButton = screen.getByRole("button", {
    name: /mark all completed/i,
  })
  userEvent.click(markAllCompletedButton)

  const checkboxTask1 = screen.getByRole("checkbox", { name: task1.text })
  const checkboxTask2 = screen.getByRole("checkbox", { name: task2.text })

  expect(checkboxTask1).toBeChecked()
  expect(checkboxTask2).toBeChecked()
})

test("clear completed", () => {
  const task1 = createTask({ text: "Learn React", done: true })
  const task2 = createTask({ text: "Learn JS", done: true })
  render(<App initialTasks={[task1, task2]} />)

  const tasksList = screen.getByRole("list", { name: /2 tasks remaining/i })

  expect(tasksList.children).toHaveLength(2)

  const clearCompletedButton = screen.getByRole("button", {
    name: /clear completed/i,
  })
  userEvent.click(clearCompletedButton)

  expect(tasksList.children).toHaveLength(0)
  expect(screen.queryByText(task1.text)).not.toBeInTheDocument()
  expect(screen.queryByText(task2.text)).not.toBeInTheDocument()
})

test("status filter", () => {
  const activeTask = createTask({ text: "Learn React", done: false })
  const completedTask = createTask({ text: "Learn JS", done: true })
  render(<App initialTasks={[activeTask, completedTask]} />)

  const tasksList = screen.getByRole("list", { name: /2 tasks remaining/i })
  const allButton = screen.getByRole("button", { name: /^all$/i })

  expect(allButton).toHaveStyle({ fontWeight: "bold" })
  expect(tasksList.children).toHaveLength(2)

  const activeButton = screen.getByRole("button", { name: /^active$/i })
  userEvent.click(activeButton)

  expect(activeButton).toHaveStyle({ fontWeight: "bold" })
  expect(tasksList.children).toHaveLength(1)
  expect(screen.getByText(activeTask.text)).toBeInTheDocument()

  const completedButton = screen.getByRole("button", { name: /^completed$/i })
  userEvent.click(completedButton)

  expect(completedButton).toHaveStyle({ fontWeight: "bold" })
  expect(tasksList.children).toHaveLength(1)
  expect(screen.getByText(completedTask.text)).toBeInTheDocument()
})

test("search filter", () => {
  const task1 = createTask({ text: "Learn React", done: false })
  const task2 = createTask({ text: "Learn JS", done: false })
  render(<App initialTasks={[task1, task2]} />)
  const tasksList = screen.getByRole("list", { name: /2 tasks remaining/i })

  const searchTaskInput = screen.getByPlaceholderText(/search.../i)
  userEvent.type(searchTaskInput, "React")

  expect(tasksList.children).toHaveLength(1)
  expect(screen.getByText(task1.text)).toBeInTheDocument()

  userEvent.type(searchTaskInput, "Something")
  expect(tasksList.children).toHaveLength(0)
})

test("color filter", () => {
  const greenTask = createTask({
    text: "Learn React",
    done: false,
    color: "green",
  })
  const blueTask = createTask({ text: "Learn JS", done: false, color: "blue" })
  render(<App initialTasks={[greenTask, blueTask]} />)
  const tasksList = screen.getByRole("list", { name: /2 tasks remaining/i })

  const checkboxColorGreen = screen.getByRole("checkbox", { name: /green/i })
  const checkboxColorBlue = screen.getByRole("checkbox", { name: /blue/i })

  userEvent.click(checkboxColorGreen)

  expect(tasksList.children).toHaveLength(1)
  expect(screen.getByText(greenTask.text)).toBeInTheDocument()
  expect(checkboxColorGreen).toBeChecked()

  userEvent.click(checkboxColorGreen)
  userEvent.click(checkboxColorBlue)

  expect(tasksList.children).toHaveLength(1)
  expect(screen.getByText(blueTask.text)).toBeInTheDocument()
  expect(checkboxColorBlue).toBeChecked()
})

const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
var isValid = require("date-fns/isValid");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityAndCategoryProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const convertObjectToResponse = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, category, priority } = request.query;
  if (
    request.query.status === "TO DO" ||
    request.query.status === "IN PROGRESS" ||
    request.query.status === "DONE" ||
    request.query.category === "WORK" ||
    request.query.category === "HOME" ||
    request.query.category === "LEARNING" ||
    request.query.priority === "HIGH" ||
    request.query.priority === "MEDIUM" ||
    request.query.priority === "LOW" ||
    request.query.search_q !== undefined
  ) {
    let data = null;
    let getTodosQuery = "";

    switch (true) {
      case hasPriorityAndStatusProperties(request.query):
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}'
                AND priority = '${priority}';`;
        break;
      case hasCategoryAndStatusProperties(request.query):
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}'
                AND category = '${category}';`;
        break;
      case hasPriorityAndCategoryProperties(request.query):
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND category = '${category}'
                AND priority = '${priority}';`;
        break;
      case hasPriorityProperty(request.query):
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND priority = '${priority}';`;
        break;
      case hasStatusProperty(request.query):
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}';`;
        break;
      case hasCategoryProperty(request.query):
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND category = '${category}';`;
        break;
      default:
        getTodosQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%';`;
    }
    data = await database.all(getTodosQuery);
    response.send(data.map((each) => convertObjectToResponse(each)));
  } else {
    let inValidTodo = "";
    if (
      (request.query.status !== "TO%20DO" ||
        request.query.status !== "IN%20PROGRESS" ||
        request.query.status !== "DONE") &&
      request.query.category === undefined &&
      request.query.priority === undefined
    ) {
      inValidTodo = "Status";
    } else if (
      (request.query.category !== "WORK" ||
        request.query.category !== "HOME" ||
        request.query.category !== "LEARNING") &&
      request.query.priority === undefined
    ) {
      inValidTodo = "Category";
    } else if (
      request.query.priority !== "HIGH" ||
      request.query.priority !== "MEDIUM" ||
      request.query.priority !== "LOW"
    ) {
      inValidTodo = "Priority";
    }
    response.status(400);
    response.send(`Invalid Todo ${inValidTodo}`);
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(convertObjectToResponse(todo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  const dueDate = format(new Date(date), "yyyy-MM-dd");

  console.log(dueDate);

  const isValidDate = isValid(dueDate);

  const getTodosQuery = `
    SELECT
        *                                                                                                                                
    FROM
        todo
    WHERE
        dueDate = ${date};
    `;
  const queryDate = await database.get(getTodosQuery);
  response.send(queryDate);
  //} else {
  response.send(400);
  response.send("Invalid Due Date");
  // }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (
    (request.body.status === "TO DO" ||
      request.body.status === "IN PROGRESS" ||
      request.body.status === "DONE") &&
    (request.body.category === "WORK" ||
      request.body.category === "HOME" ||
      request.body.category === "LEARNING") &&
    (request.body.priority === "HIGH" ||
      request.body.priority === "MEDIUM" ||
      request.body.priority === "LOW") &&
    request.body.todo !== undefined &&
    request.body.dueDate !== undefined &&
    request.body.id !== undefined
  ) {
    const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status, category, due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');`;
    await database.run(postTodoQuery);
    response.send("Todo Successfully Added");
  } else {
    let inValidTodoPost = "";
    if (
      (request.body.status !== "TO DO" ||
        request.body.status !== "IN PROGRESS" ||
        request.body.status !== "DONE") &&
      (request.body.category === "WORK" ||
        request.body.category === "HOME" ||
        request.body.category === "LEARNING") &&
      (request.body.priority === "HIGH" ||
        request.body.priority === "MEDIUM" ||
        request.body.priority === "LOW") &&
      request.body.dueDate !== undefined
    ) {
      inValidTodoPost = "Status";
    } else if (
      (request.body.category !== "WORK" ||
        request.body.category !== "HOME" ||
        request.body.category !== "LEARNING") &&
      (request.body.status === "TO DO" ||
        request.body.status === "IN PROGRESS" ||
        request.body.status === "DONE") &&
      (request.body.priority === "HIGH" ||
        request.body.priority === "MEDIUM" ||
        request.body.priority === "LOW") &&
      request.body.dueDate !== undefined
    ) {
      inValidTodoPost = "Category";
    } else if (
      (request.body.priority !== "HIGH" ||
        request.body.priority !== "MEDIUM" ||
        request.body.priority !== "LOW") &&
      (request.body.status === "TO DO" ||
        request.body.status === "IN PROGRESS" ||
        request.body.status === "DONE") &&
      (request.body.category === "WORK" ||
        request.body.category === "HOME" ||
        request.body.category === "LEARNING") &&
      request.body.dueDate !== undefined
    ) {
      inValidTodoPost = "Priority";
    } else {
      response.status(400);
      response.send(`Invalid Due Date`);
    }
    response.status(400);
    response.send(`Invalid Todo ${inValidTodoPost}`);
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  if (
    request.body.status === "TO DO" ||
    request.body.status === "IN PROGRESS" ||
    request.body.status === "DONE" ||
    request.body.category === "WORK" ||
    request.body.category === "HOME" ||
    request.body.category === "LEARNING" ||
    request.body.priority === "HIGH" ||
    request.body.priority === "MEDIUM" ||
    request.body.priority === "LOW" ||
    request.body.todo !== undefined ||
    request.body.dueDate !== undefined
  ) {
    const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`;

    await database.run(updateTodoQuery);
    response.send(`${updateColumn} Updated`);
  } else {
    let inValidTodoPut = "";
    if (
      (request.body.status !== "TO DO" ||
        request.body.status !== "IN PROGRESS" ||
        request.body.status !== "DONE") &&
      request.body.category === undefined &&
      request.body.priority === undefined &&
      request.body.dueDate === undefined
    ) {
      inValidTodoPut = "Status";
    } else if (
      (request.body.category !== "WORK" ||
        request.body.category !== "HOME" ||
        request.body.category !== "LEARNING") &&
      request.body.priority === undefined &&
      request.body.dueDate === undefined
    ) {
      inValidTodoPut = "Category";
    } else if (
      (request.body.priority !== "HIGH" ||
        request.body.priority !== "MEDIUM" ||
        request.body.priority !== "LOW") &&
      request.body.dueDate === undefined
    ) {
      inValidTodoPut = "Priority";
    } else if (request.body.dueDate !== undefined) {
      response.status(400);
      response.send(`Invalid Due Date`);
    }
    response.status(400);
    response.send(`Invalid Todo ${inValidTodoPut}`);
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;

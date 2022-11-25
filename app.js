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

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, category, priority } = request.query;
  if (
    request.query.status === "TO%20DO" ||
    request.query.status === "IN%20PROGRESS" ||
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
                OR status = '${status}';`;
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
    response.send(data);
  } else if (
    request.query.status !== "TO%20DO" ||
    request.query.status !== "IN%20PROGRESS" ||
    request.query.status !== "DONE"
  ) {
    response.status(400);
    response.send(`Invalid Todo Status`);
  } else if (
    request.query.category !== "WORK" ||
    request.query.category !== "HOME" ||
    request.query.category !== "LEARNING"
  ) {
    response.status(400);
    response.send(`Invalid Todo Category`);
  } else if (
    request.query.priority !== "HIGH" ||
    request.query.priority !== "MEDIUM" ||
    request.query.priority !== "LOW"
  ) {
    response.status(400);
    response.send(`Invalid Todo Priority`);
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
  response.send(todo);
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

module.exports = app;

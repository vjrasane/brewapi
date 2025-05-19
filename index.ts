import { Elysia, status, t } from "elysia";

const { API_KEY } = process.env;

const app = new Elysia()

app.onBeforeHandle(async ({ query }) => {
  const { apiKey } = query;
  if (apiKey !== API_KEY) {
    return status(401);
  }
})

app.all("/api/v1/data", ({ request, body, headers }) => {
  console.log("----- REQUEST -----");
  console.log(new Date().toISOString());
  console.log(request.method)
  console.log("----- HEADERS -----");
  console.log(headers);
  console.log("----- BODY -----");
  console.log(body)
  console.log("----- END -----");
})

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

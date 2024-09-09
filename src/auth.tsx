import { ConvexHttpClient } from "convex/browser";
import html, { Html } from "@elysiajs/html";
import { api } from "../convex/_generated/api";
import Elysia from "elysia";
const client = new ConvexHttpClient(process.env.CONVEX_URL!);

const LoginButton = ({ provider }: { provider: string }) => {
  return (
    <button
      hx-post={`/auth/signin/${provider}`}
      hx-swap="outerHTML"
      class={`bg-blue-500`}
    >
      Sign in with {provider}
    </button>
  );
};

const authApp = new Elysia()
  .use(html())
  .get("/auth", () => (
    <html lang="en">
      <head>
        <title>Login</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          src="https://unpkg.com/htmx.org@2.0.2"
          integrity="sha384-Y7hw+L/jvKeWIRRkqWYfPcvVxHzVzn5REgzbawhxAuQGwX1XWe70vji+VSeHOThJ"
          crossorigin="anonymous"
        ></script>
      </head>
      <body>
        <div>
          <LoginButton provider="github" />
        </div>
      </body>
    </html>
  ))
  .post("/auth/signin/:provider", async ({ params }) => {
    console.log(params);
    const { redirect } = await client.action(api.auth.signIn, {
      provider: params.provider,
    });
    return new Response(null, {
      status: 302,
    });
  });

export default authApp;

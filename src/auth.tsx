import Elysia, { redirect } from "elysia";
import { html, Html } from "@elysiajs/html";
import { oauth2 } from "elysia-oauth2";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { GitHubIcon } from "./icons/GitHubIcon";
const client = new ConvexHttpClient(process.env.CONVEX_URL!);

const authApp = new Elysia()
  .use(html())
  .use(
    oauth2({
      GitHub: [
        process.env.GITHUB_CLIENT_ID!,
        process.env.GITHUB_CLIENT_SECRET!,
      ],
    })
  )
  .get("/login", () => {
    return (
      <html>
        <head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, shrink-to-fit=no"
          />
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
        <div class="grid place-items-center h-screen">
          <a class="relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-gray-900 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900" href="/auth/github"><GitHubIcon /> Login with GitHub</a>
        </div>
         
        </body>
      </html>
    
    )}
  )
  .get("/auth/github", ({ oauth2 }) => {
    try {
      return oauth2.redirect("GitHub");
    } catch (error) {
      console.error("Error redirecting to GitHub:", error);
      return "Error initiating GitHub login. Please try again.";
    }
  })
  .get("/auth/github/callback", async ({ oauth2, set, cookie, redirect }) => {
    try {
      const token = await oauth2.authorize("GitHub");

      // Fetch user info from GitHub
      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error(
          `GitHub API responded with status: ${userResponse.status}`
        );
      }

      const githubUser = await userResponse.json();

      if (!githubUser.login) {
        throw new Error("GitHub user information is incomplete");
      }

      const tokenIdentifier = `github:${githubUser.id}`;

      // Use Convex client to create or log in user
      const userId = await client.mutation(api.tasks.createUser, {
        username: githubUser.login,
        avatar: githubUser.avatar_url,
        tokenIdentifier,
      });

      if (!userId) {
        throw new Error("Failed to create or retrieve user from database");
      }

      // Set a cookie with the user ID
      cookie.userId.set({
        value: userId,
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 1 week
      });

      cookie.tokenIdentifier.set({
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
      });

      // Redirect to the main page

      return redirect("/");
    } catch (error) {
      console.error("Authentication error:", error);
      set.status = 400;
      if (error instanceof Error) {
        return `Authentication failed: ${error.message}`;
      }
      return "Authentication failed due to an unknown error";
    }
  })
  .onError(({ code, error, set }) => {
    console.error(`${code} error:`, error);
    set.status = code === "NOT_FOUND" ? 404 : 500;
    return `<html>
      <body>
        <h1>Error</h1>
        <p>${error.message}</p>
        <a href="/">Go back to home</a>
      </body>
    </html>`;
  })
  .get("/signout", ({ cookie, redirect }) => {
    cookie.userId.remove();
    cookie.tokenIdentifier.remove();
    return redirect("/");
  });

export default authApp;

// src/index.tsx
import { Elysia } from "elysia";
import { html, Html } from "@elysiajs/html";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import authApp from "./auth";
import DOMPurify from "isomorphic-dompurify";
import Post, { PostFullPage } from "./components/Post";
import PostsDisplay from "./components/PostsDisplay";
import PostForm from "./components/PostForm";
import Header from "./components/Header";
import UserProfilePage from "./components/UserProfilePage";

export const client = new ConvexHttpClient(process.env.CONVEX_URL!);

const app = new Elysia()
  .use(html())
  .use(authApp)
  .get("/", async ({ cookie, set }) => {
    const userId = cookie.userId.value as Id<"users"> | undefined;
    const user = userId
      ? await client.query(api.tasks.getCurrentUser, { userId })
      : null;

    set.headers["HX-Redirect"] = "/";
    return (
      <html id="root" lang="en">
        <head>
          <title>The Status Quo</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, shrink-to-fit=no"
          />
          <script src="https://cdn.tailwindcss.com"></script>
          <script
            src="https://unpkg.com/htmx.org@2.0.2"
            integrity="sha384-Y7hw+L/jvKeWIRRkqWYfPcvVxHzVzn5REgzbawhxAuQGwX1XWe70vji+VSeHOThJ"
            crossorigin="anonymous"
          ></script>
        </head>
        <body class="flex flex-col h-screen bg-gray-100">
          <Header user={user} />
          <main class="flex-grow flex flex-col overflow-hidden p-2">
            <div id="posts" class="flex justify-center overflow-y-auto mb-4">
              {await PostsDisplay({ cookie })}
            </div>
            <div class="bg-white p-2 shadow-md flex justify-center">
              <PostForm cookie={cookie} />
            </div>
          </main>
        </body>
      </html>
    );
  })
  .post("/post", async ({ body, cookie }) => {
    try {
      const { title, content } = body as { title: string; content: string };
      const newTitle = DOMPurify.sanitize(title);
      const newContent = DOMPurify.sanitize(content);
      const userId = cookie.userId.value as Id<"users"> | undefined;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      await client.mutation(api.tasks.postPost, {
        title: newTitle,
        content: newContent,
        userId,
      });
      return await PostsDisplay({ cookie });
    } catch (error) {
      console.error("Error creating post:", error);
      return <div>Error creating post. Please try again.</div>;
    }
  })
  .get("/api/user", async ({ cookie }) => {
    const userId = cookie.userId.value;
    if (!userId) {
      return { authenticated: false };
    }
    const user = await client.query(api.tasks.getUserById, {
      userId: userId as Id<"users">,
    });
    return { authenticated: true, user };
  })
  .get("/posts-display", async ({ cookie }) => {
    return await PostsDisplay({ cookie });
  })
  .delete("/api/deletePost/:postId", async ({ cookie, params }) => {
    try {
      const userId = cookie.userId.value as Id<"users"> | undefined;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const postId = params.postId as Id<"posts">;
      await client.mutation(api.tasks.deletePostById, { postId, userId });
      return await PostsDisplay({ cookie });
    } catch (error: any) {
      alert(error.message);
      return await PostsDisplay({ cookie });
    }
  })
  .patch("/api/likePost/:postId", async ({ cookie, params }) => {
    try {
      const userId = cookie.userId.value as Id<"users"> | undefined;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const postId = params.postId as Id<"posts">;

      // Perform the like/unlike mutation
      await client.mutation(api.tasks.modifyLikeToPost, { postId, userId });

      // Fetch the updated post and user data
      const postData = await client.query(api.tasks.getPostById, { postId });
      const postUser = await client.query(api.tasks.getUserById, {
        userId: postData.userId,
      });
      const user = await client.query(api.tasks.getCurrentUser, { userId });

      const postWithUser = { ...postData, user: postUser };

      // Return the updated Post component
      return Post({ post: postWithUser, user });
    } catch (error: any) {
      console.error("Error in likePost route:", error);
      return `<div>Error updating post. Please try again. ${error}</div>`;
    }
  })
  .get("/posts/:postId", async ({ cookie, params, redirect }) => {
    try {
      const userId = cookie.userId.value as Id<"users"> | undefined;
      const user = userId
        ? await client.query(api.tasks.getCurrentUser, { userId })
        : null;

      const postId = params.postId as Id<"posts">;
      const postData = await client.query(api.tasks.getPostById, { postId });
      if (!postData) {
        throw new Error("Post not found");
      }

      const postUser = await client.query(api.tasks.getUserById, {
        userId: postData.userId,
      });

      const postWithUser = { ...postData, user: postUser };

      return (
        <html id="root" lang="en">
          <head>
            <title>{postWithUser.title} - The Status Quo</title>
            <script
              src="https://unpkg.com/htmx.org@2.0.2"
              integrity="sha384-Y7hw+L/jvKeWIRRkqWYfPcvVxHzVzn5REgzbawhxAuQGwX1XWe70vji+VSeHOThJ"
              crossorigin="anonymous"
            ></script>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <Header user={user} />
          <body class="flex flex-col h-screen bg-gray-100">
            {/* Include your header here */}
            <main>
              <div class="flex justify-center overflow-hidden p-2" id="posts">
                {PostFullPage({ post: postWithUser, user })}
              </div>
            </main>
          </body>
        </html>
      );
    } catch (error: any) {
      console.error("Error fetching post:", error);
      return `<div>Error loading post. Please try again later.</div>`;
    }
  })
  .get("/users/:userId", async ({ cookie, params }) => {
    try {
      const userId = cookie.userId.value as Id<"users"> | undefined;
      const currentUser = userId
        ? await client.query(api.tasks.getCurrentUser, { userId })
        : null;
      const newUserId = params.userId as Id<"users">;
      const user = await client.query(api.tasks.getUserById, {
        userId: newUserId,
      });

      return (
        <html id="root" lang="en">
          <head>
            <title>{user?.username} - The Status Quo</title>
            <script
              src="https://unpkg.com/htmx.org@2.0.2"
              integrity="sha384-Y7hw+L/jvKeWIRRkqWYfPcvVxHzVzn5REgzbawhxAuQGwX1XWe70vji+VSeHOThJ"
              crossorigin="anonymous"
            ></script>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <Header user={user} />
          <body class="flex flex-col h-screen bg-gray-100">
            {/* Include your header here */}
            <main>
              <div class="flex justify-center overflow-hidden p-2" id="posts">
                {UserProfilePage({ currentUser, user })}
              </div>
            </main>
          </body>
        </html>
      );
    } catch (error: any) {
      console.error("Error fetching post:", error);
      return `<div>Error loading post. Please try again later.</div>`;
    }
  })
  .get("/redirect", ({ redirect }) => {
    redirect("/");
  })
  .onError(({ code, error, set }) => {
    console.error(`${code} error:`, error);
    set.status = code === "NOT_FOUND" ? 404 : 500;
    return `<html>
      <head>
      <title>The Status Quo</title>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1, shrink-to-fit=no"
          />

          <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
      <div class="grid place-items-center h-screen">
        <div>
          <h1 class="italic">where am i?</h1>
          <br />  
          <p>${error.message}</p>
          <a class="text-3xl text-blue-600 hover:text-blue-800" href="/">Go back to home</a>
        </div>
      </div>

      </body>
    </html>`;
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

// src/index.tsx
import { Elysia } from "elysia";
import { html, Html } from "@elysiajs/html";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import authApp from "./auth";

import { LikeIcon, FilledLikeIcon } from "./icons/LikeIcons";

const client = new ConvexHttpClient(process.env.CONVEX_URL!);

const PostsDisplay = async () => {
  try {
    const posts = await client.query(api.tasks.getPosts);
    const postsWithUsers = await Promise.all(
      posts.map(async (post: any) => {
        try {
          const user = await client.query(api.tasks.getUserById, {
            userId: post.userId,
          });
          return { ...post, user };
        } catch (error) {
          console.error(`Failed to fetch user for post ${post._id}:`, error);
          return { ...post, user: null };
        }
      })
    );
    return (
      <div class="overflow-y-auto h-full">
        {postsWithUsers.map((post: any) => (
          <Post key={post._id} post={post} />
        ))}
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return <div>Error loading posts. Please try again later.</div>;
  }
};

const Post = ({ post }: { post: any }) => {
  return (
    <div class="border p-2 mb-4 bg-white">
      <div class="flex justify-between flex-wrap">
        <div class="flex flex-col sm:flex-row gap-2">
          <h3 class="text-lg sm:text-xl font-bold">{post.title}</h3>
          {post.user ? (
            <div class="flex items-center gap-2">
              <img
                src={post.user[0].avatar}
                class="w-10 h-10 sm:w-5 sm:h-5 rounded-full"
              />
              <p class="text-sm sm:text-base">
                {post.user[0].username || "Unknown"}
              </p>
            </div>
          ) : (
            <p class="text-sm sm:text-base">Unable to load</p>
          )}
        </div>
        <div class="flex gap-2 items-center mt-2 sm:mt-0">
          <button
            hx-delete={`/api/deletePost/${post._id}`}
            hx-target="#posts"
            hx-swap="outerHTML"
            hx-confirm="Are you sure you want to delete this post?"
            class="bg-red-500 text-white px-2 py-1 hover:bg-red-600 text-sm sm:text-base"
          >
            Delete
          </button>
          <span class="text-xs sm:text-sm">
            {timeSince(new Date(post._creationTime))} ago
          </span>
        </div>
      </div>
      <p class="text-sm sm:text-base">{post.content}</p>
      <div class="flex items-center gap-1">
        <div class="hover:bg-gray-100 cursor-pointer rounded-full p-1">
          <LikeIcon />
        </div>
        <span class="text-sm sm:text-base">{post.likes_count}</span>
      </div>
    </div>
  );
};

const PostForm = async ({ cookie }: { cookie: any }) => {
  const userId = cookie.userId.value as Id<"users"> | undefined;
  const user = userId
    ? await client.query(api.tasks.getCurrentUser, { userId })
    : null;

  if (!user) {
    return (
      <div>
        <p>Please log in to create a post.</p>
        <a href="/login" class="text-blue-500 hover:underline">
          Log in
        </a>
      </div>
    );
  }
  return (
    <div>
      <form
        hx-post="/post"
        hx-target="#posts"
        hx-swap="outerHTML"
        hx-on--after-request="this.reset()"
        class="space-y-2"
      >
        <input
          type="text"
          name="title"
          placeholder="Title"
          required
          class="w-full p-2 border text-sm sm:text-base"
        />
        <textarea
          name="content"
          placeholder="Content"
          required
          class="w-full p-2 border text-sm sm:text-base"
        ></textarea>
        <button
          type="submit"
          class="w-full bg-blue-500 text-white p-2 hover:bg-blue-600 text-sm sm:text-base"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

const app = new Elysia()
  .use(html())
  .use(authApp)
  .get("/", async ({ cookie }) => {
    const userId = cookie.userId.value as Id<"users"> | undefined;
    const user = userId
      ? await client.query(api.tasks.getCurrentUser, { userId })
      : null;

    return (
      <html lang="en">
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
          <header class="bg-white shadow-md p-4 flex justify-between items-center flex-wrap">
            <h1 class="text-2xl sm:text-3xl font-bold">The Status Quo</h1>
            {user ? (
              <div class="flex items-center space-x-4 mt-2 sm:mt-0">
                <span class="text-sm sm:text-base">
                  Welcome, {user.username}
                </span>
                <a
                  href="/signout"
                  class="bg-red-500 text-white px-3 py-1 hover:bg-red-600 text-sm sm:text-base"
                >
                  Sign Out
                </a>
              </div>
            ) : (
              <a
                href="/login"
                class="bg-blue-500 text-white px-3 py-1 hover:bg-blue-600 text-sm sm:text-base"
              >
                Log In
              </a>
            )}
          </header>
          <main class="flex-grow flex flex-col overflow-hidden p-2">
            <div id="posts" class="flex-grow overflow-y-auto mb-4">
              <h2 class="text-2xl font-semibold mb-2">Posts</h2>
              {await PostsDisplay()}
            </div>
            <div class="bg-white p-2 shadow-md">
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
      const userId = cookie.userId.value as Id<"users"> | undefined;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      await client.mutation(api.tasks.postPost, {
        title,
        content,
        userId,
      });
      return await (
        <>
          {await PostsDisplay()}
          <script>document.body.dispatchEvent(new Event('resetForm'))</script>
        </>
      );
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
  .delete("/api/deletePost/:postId", async ({ cookie, params }) => {
    try {
      const userId = cookie.userId.value as Id<"users"> | undefined;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const postId = params.postId as Id<"posts">;
      await client.mutation(api.tasks.deletePostById, { postId, userId });
      return await PostsDisplay();
    } catch (error: any) {
      alert(error.message);
      return await PostsDisplay();
    }
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

function timeSince(date: Date) {
  let seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;

  if (interval > 2) {
    return Math.floor(interval) + " years";
  } else if (interval > 1) {
    return Math.floor(interval) + " year";
  }
  interval = seconds / 2592000;
  if (interval > 2) {
    return Math.floor(interval) + " months";
  } else if (interval > 1) {
    return Math.floor(interval) + " month";
  }
  interval = seconds / 86400;
  if (interval > 2) {
    return Math.floor(interval) + " days";
  } else if (interval > 1) {
    return Math.floor(interval) + " day";
  }
  interval = seconds / 3600;
  if (interval > 2) {
    return Math.floor(interval) + " hours";
  } else if (interval > 1) {
    return Math.floor(interval) + " hour";
  }
  interval = seconds / 60;
  if (interval > 2) {
    return Math.floor(interval) + " minutes";
  } else if (interval > 1) {
    return Math.floor(interval) + " minute";
  }
  return Math.floor(seconds) + " seconds";
}

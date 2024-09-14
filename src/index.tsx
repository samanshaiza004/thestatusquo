// src/index.tsx
import { Elysia } from "elysia";
import { html, Html } from "@elysiajs/html";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import authApp from "./auth";

import { LikeIcon, FilledLikeIcon } from "./icons/LikeIcons";
import { TrashIcon } from "./icons/TrashIcon";
import DOMPurify from "isomorphic-dompurify";

const client = new ConvexHttpClient(process.env.CONVEX_URL!);

const PostsDisplay = async ({ cookie }: { cookie: any }) => {
  const userId = cookie.userId.value as Id<"users"> | undefined;
  const user = userId
    ? await client.query(api.tasks.getCurrentUser, { userId })
    : null;

  try {
    const posts = await client.query(api.tasks.getPosts);

    const postsWithUsers = await Promise.all(
      posts.map(async (post: any) => {
        try {
          const postUser = await client.query(api.tasks.getUserById, {
            userId: post.userId,
          });
          return { ...post, user: postUser } // Assuming postUser is an array
        } catch (error) {
          console.error(`Failed to fetch user for post ${post._id}:`, error);
          return { ...post, user: null };
        }
      })
    );

    return (
      <div class="overflow-y-auto h-full">
        {postsWithUsers.map((post: any) => (
          <Post key={post._id} post={post} user={user} />
        ))}
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return <div>Error loading posts. Please try again later.</div>;
  }
};


const PostFullPage = ({ post, user }: { post: any, user: any | undefined}) => {
  return (
    <div id={post._id} class="border p-2 mb-2 bg-white">
      <div class="flex justify-between flex-wrap">
        <div class="flex flex-col sm:flex-row gap-2">
          <h3 class="text-3xl sm:text-2xl font-bold">{post.title}</h3>
          {post.user ? (
            <div onclick="event.stopPropagation()" class="flex items-center gap-2">
              <img
                src={post.user.avatar}
                
                class="w-10 h-10 sm:w-5 sm:h-5 rounded-full"
              />
              <p class="text-sm sm:text-base">
                {post.user.username || "Unknown"}
              </p>
            </div>
          ) : (
            <p class="text-sm sm:text-base">Unable to load</p>
          )}
        </div>
        <div class="flex gap-2 items-center mt-2 sm:mt-0">
          {user && post?.userId === user._id ? <button
            hx-delete={`/api/deletePost/${post._id}`}
            hx-target="#posts"
            hx-confirm="Are you sure you want to delete this post?"
            class="bg-rose-400 text-white px-2 py-1 hover:bg-red-500 text-sm sm:text-base"
            onclick="event.stopPropagation()"
          >
            <TrashIcon />
          </button>
          : null
          }
          
          <span class="text-xs sm:text-sm">
            {timeSince(new Date(post._creationTime))} ago
          </span>
        </div>
      </div>
      <p class="text-sm sm:text-base mb-2">{post.content}</p>
      <div class="flex items-center gap-1">
      <div
          hx-patch={`/api/likePost/${post._id}`}
          hx-target={`#${post._id}`}
          hx-swap="outerHTML"
          class="hover:bg-gray-100 hover:fill-rose-500 cursor-pointer rounded-full p-1"
           onclick="event.stopPropagation()"
        >
          {user && user.liked_posts.includes(post._id) ? (
            <FilledLikeIcon />
          ) : (
            <LikeIcon />
          )}
        </div>
        <span id={"like-count"} class="text-sm sm:text-base">{post.likes_count}</span>
      </div>
    </div>
  );
}

const Post = ({ post, user }: { post: any; user: any | undefined }) => {
  return (
    <div hx-get={`/posts/${post._id}`}
    hx-push-url="true"
    hx-target="body"
    hx-swap="outerHTML" id={post._id} class="border p-2 mb-2 bg-white cursor-pointer">
      <div class="flex justify-between flex-wrap">
        <div class="flex flex-col sm:flex-row gap-2">
          <h3 class="text-lg sm:text-xl font-bold">{post.title}</h3>
          {post.user ? (
            <div onclick="event.stopPropagation()" class="flex items-center gap-2">
              <img
                src={post.user.avatar}
                
                class="w-10 h-10 sm:w-5 sm:h-5 rounded-full"
              />
              <p class="text-sm sm:text-base">
                {post.user.username || "Unknown"}
              </p>
            </div>
          ) : (
            <p class="text-sm sm:text-base">Unable to load</p>
          )}
        </div>
        <div class="flex gap-2 items-center mt-2 sm:mt-0">
          {user && post?.userId === user._id ? <button
            hx-delete={`/api/deletePost/${post._id}`}
            hx-target="#posts"
            hx-confirm="Are you sure you want to delete this post?"
            class="bg-rose-400 text-white px-2 py-1 hover:bg-red-500 text-sm sm:text-base"
            onclick="event.stopPropagation()"
          >
            <TrashIcon />
          </button>
          : null
          }
          
          <span class="text-xs sm:text-sm">
            {timeSince(new Date(post._creationTime))} ago
          </span>
        </div>
      </div>
      <p class="text-sm sm:text-base mb-2">{post.content}</p>
      <div class="flex items-center gap-1">
      <div
          hx-patch={`/api/likePost/${post._id}`}
          hx-target={`#${post._id}`}
          hx-swap="outerHTML"
          class="hover:bg-gray-100 hover:fill-rose-500 cursor-pointer rounded-full p-1"
           onclick="event.stopPropagation()"
        >
          {user && user.liked_posts.includes(post._id) ? (
            <FilledLikeIcon />
          ) : (
            <LikeIcon />
          )}
        </div>
        <span id={"like-count"} class="text-sm sm:text-base">{post.likes_count}</span>
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
        <a href="/login" class="text-blue-400 hover:underline">
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
        hx-swap="innerHTML"
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
          class="w-full bg-blue-400 text-white p-2 hover:bg-blue-500 text-sm sm:text-base"
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
            <h1 class="text-3xl sm:text-2xl font-bold">The Status Quo</h1>
            {user ? (
              <div class="flex items-center space-x-4 mt-2 sm:mt-0">
                <span class="text-sm sm:text-base">
                  Welcome, {user.username}
                </span>
                <a
                  href="/signout"
                  class="bg-red-400 text-white px-3 py-1 hover:bg-red-500 text-sm sm:text-base"
                >
                  Sign Out
                </a>
              </div>
            ) : (
              <a
                href="/login"
                class="bg-blue-400 text-white px-3 py-1 hover:bg-blue-500 text-sm sm:text-base"
              >
                Log In
              </a>
            )}
          </header>
          <main class="flex-grow flex flex-col overflow-hidden p-2">
            <div id="posts" class="flex-grow overflow-y-auto mb-4">
              {await PostsDisplay({ cookie })}
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
      const newTitle = DOMPurify.sanitize(title)
      const newContent = DOMPurify.sanitize(content)
      const userId = cookie.userId.value as Id<"users"> | undefined;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      await client.mutation(api.tasks.postPost, {
        title: newTitle,
        content: newContent,
        userId,
      });
      return await PostsDisplay({ cookie })
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
      return await PostsDisplay({ cookie })
    } catch (error: any) {
      alert(error.message);
      return await PostsDisplay({ cookie })
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
      const postUser = await client.query(api.tasks.getUserById, { userId: postData.userId });
      const user = await client.query(api.tasks.getCurrentUser, { userId });
  
      const postWithUser = { ...postData, user: postUser };
  
      // Return the updated Post component
      return Post({ post: postWithUser, user });
    } catch (error: any) {
      console.error("Error in likePost route:", error);
      return `<div>Error updating post. Please try again. ${error}</div>`;
    }
  })
  .get("/posts/:postId", async ({ cookie, params }) => {
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
        <html lang="en">
          <head>
            <title>{postWithUser.title} - The Status Quo</title>
            <script
            src="https://unpkg.com/htmx.org@2.0.2"
            integrity="sha384-Y7hw+L/jvKeWIRRkqWYfPcvVxHzVzn5REgzbawhxAuQGwX1XWe70vji+VSeHOThJ"
            crossorigin="anonymous"
          ></script>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="flex flex-col h-screen bg-gray-100">
            {/* Include your header here */}
            <main class="flex-grow flex flex-col overflow-hidden p-2">
              {PostFullPage({ post: postWithUser, user })}
            </main>
          </body>
        </html>
      );
    } catch (error: any) {
      console.error("Error fetching post:", error);
      return `<div>Error loading post. Please try again later.</div>`;
    }
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

import { Elysia } from "elysia";
import { html, Html } from "@elysiajs/html";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
// require("dotenv").config();
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
      <div>
        {postsWithUsers.map((post: any, user: any) => (
          <Post key={post._id} post={post} user={user} />
        ))}
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return <div>Error loading posts. Please try again later.</div>;
  }
};

const Post = ({ post, user }: { post: any; user: any }) => {
  console.log("post.user: " + post.user[0].username);
  return (
    <div class="border p-4 mb-4 rounded-lg">
      <h3 class="text-xl font-bold">{post.title}</h3>
      <p>{post.content}</p>
      <p>Likes: {post.likes_count}</p>
      {post.user ? (
        <p>Author: {post.user[0].username || "Unknown"}</p>
      ) : (
        <p>Author: Unable to load</p>
      )}
    </div>
  );
};

const app = new Elysia()
  .use(html())
  .get("/", async () => (
    <html lang="en">
      <head>
        <title>The Status Quo</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          src="https://unpkg.com/htmx.org@2.0.2"
          integrity="sha384-Y7hw+L/jvKeWIRRkqWYfPcvVxHzVzn5REgzbawhxAuQGwX1XWe70vji+VSeHOThJ"
          crossorigin="anonymous"
        ></script>
      </head>
      <body class="p-4">
        <h1 class="text-3xl font-bold mb-4">The Status Quo</h1>
        <div>
          <h2 class="text-2xl font-semibold mb-2">Posts</h2>
          {await PostsDisplay()}
        </div>
      </body>
    </html>
  ))
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

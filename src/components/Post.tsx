import { Html } from "@elysiajs/html";
import { FilledLikeIcon, LikeIcon } from "../icons/LikeIcons";
import { TrashIcon } from "../icons/TrashIcon";
import timeSince from "../libs/timeSince";
export const PostFullPage = ({
  post,
  user,
}: {
  post: any;
  user: any | undefined;
}) => {
  return (
    <div id={post._id} class="w-10/12 h-screen border p-2 mb-2 bg-white">
      <div class="flex justify-between flex-wrap">
        <div class="flex flex-col sm:flex-row gap-2">
          <h3 class="text-9xl sm:text-4xl font-bold mb-3">{post.title}</h3>
          {post.user ? (
            <div
              onclick="event.stopPropagation()"
              hx-get={`/users/${user._id}`}
              hx-push-url="true"
              hx-target="body"
              hx-swap="outerHTML"
              class="flex cursor-pointer items-center gap-2 hover:underline"
            >
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
          {user && post?.userId === user._id ? (
            <button
              hx-delete={`/api/deletePost/${post._id}`}
              hx-target="#posts"
              hx-confirm="Are you sure you want to delete this post?"
              class="bg-rose-400 text-white px-2 py-1 hover:bg-red-500 text-sm sm:text-base"
              onclick="event.stopPropagation()"
            >
              <TrashIcon />
            </button>
          ) : null}

          <span class="text-xs sm:text-sm">
            {timeSince(new Date(post._creationTime))} ago
          </span>
        </div>
      </div>
      <p class="text-sm sm:text-base mb-6">{post.content}</p>
      <div class="flex items-center gap-1">
        {user ? (
          <div
            hx-patch={`/api/likePost/${post._id}`}
            hx-target={`#${post._id}`}
            hx-swap="outerHTML"
            class="hover:bg-gray-100 hover:fill-rose-500 cursor-pointer rounded-full p-1"
            onclick="event.stopPropagation()"
          >
            {user.liked_posts.includes(post._id) ? (
              <FilledLikeIcon />
            ) : (
              <LikeIcon />
            )}
          </div>
        ) : (
          <LikeIcon />
        )}

        <span id={"like-count"} class="text-sm sm:text-base">
          {post.likes_count}
        </span>
      </div>
    </div>
  );
};

const Post = ({ post, user }: { post: any; user: any | undefined }) => {
  return (
    <div
      hx-get={`/posts/${post._id}`}
      hx-push-url="true"
      hx-target="body"
      hx-swap="outerHTML"
      id={post._id}
      class="border p-3 mb-3 bg-white cursor-pointer hover:bg-gray-50"
    >
      <div class="flex justify-between flex-wrap">
        <div class="flex flex-col sm:flex-row gap-3">
          <h3 class="text-lg sm:text-xl font-bold">{post.title}</h3>
          {post.user ? (
            <div
              onclick="event.stopPropagation()"
              hx-get={`/users/${post.userId}`}
              hx-push-url="true"
              hx-target="body"
              hx-swap="outerHTML"
              class="flex items-center gap-2 hover:underline"
            >
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
          {user && post?.userId === user._id ? (
            <button
              hx-delete={`/api/deletePost/${post._id}`}
              hx-target="#posts"
              hx-swap="innerHTML"
              hx-confirm="Are you sure you want to delete this post?"
              class="bg-rose-400 text-white px-2 py-1 hover:bg-red-500 text-sm sm:text-base"
              onclick="event.stopPropagation()"
            >
              <TrashIcon />
            </button>
          ) : null}

          <span class="text-xs sm:text-sm">
            {timeSince(new Date(post._creationTime))} ago
          </span>
        </div>
      </div>
      <p class="text-sm sm:text-base mb-2">{post.content}</p>
      <div class="flex items-center gap-1">
        {user ? (
          <div
            hx-patch={`/api/likePost/${post._id}`}
            hx-target={`#${post._id}`}
            hx-swap="outerHTML"
            class="hover:bg-gray-100 hover:fill-rose-500 cursor-pointer rounded-full p-1"
            onclick="event.stopPropagation()"
          >
            {user.liked_posts.includes(post._id) ? (
              <FilledLikeIcon />
            ) : (
              <LikeIcon />
            )}
          </div>
        ) : (
          <div class="rounded-full p-1">
            <LikeIcon />
          </div>
        )}
        <span id={"like-count"} class="text-sm sm:text-base">
          {post.likes_count}
        </span>
      </div>
    </div>
  );
};

export default Post;

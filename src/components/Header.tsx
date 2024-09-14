import { Html } from "@elysiajs/html";
const Header = ({ user }: { user: any }) => {
  return (
    <header class="bg-white shadow-md p-4 flex justify-between items-center flex-wrap">
      <div
        hx-get="/"
        hx-trigger="click"
        hx-swap="none"
        class="text-3xl sm:text-2xl font-bold cursor-pointer"
      >
        The Status Quo
      </div>
      {user ? (
        <div class="flex items-center space-x-4 mt-2 sm:mt-0">
          <span class="text-sm sm:text-base">Welcome, {user.username}</span>
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
  );
};

export default Header;

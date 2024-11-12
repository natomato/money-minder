// this is the Layout File that creates the shell for Charts subpages
import { Form, Link, Outlet } from "@remix-run/react";

import { useUser } from "~/utils";

export default function ChartsPage() {
  const user = useUser();
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          {/* This redirects to the charts._index page, url:charts/  */}
          <Link to=".">Financial Planner</Link>
        </h1>
        <p>{user.email}</p>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="rounded bg-slate-600 px-4 py-2 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
          >
            Logout
          </button>
        </Form>
      </header>
      <Outlet />
    </div>
  );
}

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, NavLink, useLoaderData } from "@remix-run/react";

import { getChartsByUser } from "~/models/chart.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const chartListItems = await getChartsByUser(userId);
  return json({ chartListItems });
};

export default function ScenariosPage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to=".">Home</Link>
        </h1>
        <p className="text-3xl font-bold">Financial Plan Summary</p>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="rounded bg-slate-600 px-4 py-2 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
          >
            Logout
          </button>
        </Form>
      </header>
      <section className="flex bg-white">
        <div className="flex-1 p-6">
          <div className="grid grid-cols-3">
            {data.chartListItems.length === 0 ? (
              <p className="p-4">No charts yet</p>
            ) : (
              <ol>
                {data.chartListItems.map((chart) => (
                  <li key={chart.id}>
                    <NavLink
                      className={({ isActive }) =>
                        `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
                      }
                      to={`/charts/${chart.id}`}
                    >
                      {chart.name}
                    </NavLink>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <hr />
          <div>
            <div>Scenario: Lose Pension Early</div>
            <div>Balance Sheet Img</div>
            <div>
              <p>Streams</p>
              <p>Income: Pension</p>
              <p>Income: SSA Alice</p>
              <p>Expense: Basic Living</p>
            </div>
            <div>
              <p>Moments</p>
              <p>RIP: Alice 2046</p>
              <p>RIP: Bob 2026</p>
              <p>...</p>
            </div>
            <div>Created: 01/01/2024 by Alice</div>
          </div>
          <div className="">
            <Link to="" className="text-blue-500 underline">
              New Scenario
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

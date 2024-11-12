import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { getChartsByUser } from "~/models/chart.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  const chartListItems = await getChartsByUser(userId);
  return json({ chartListItems });
};

export default function () {
  const data = useLoaderData<typeof loader>();
  return (
    <section className="flex bg-white">
      <div className="flex-1 p-6">
        <div className="">
          {data.chartListItems.length === 0 ? (
            <p className="p-4">No charts yet</p>
          ) : (
            <ol>
              {data.chartListItems.map((chart) => (
                <li key={chart.id}>
                  <Link
                    className={"block border-b bg-white p-4 text-xl"}
                    to={`${chart.id}/streams`}
                  >
                    {chart.name}
                  </Link>
                </li>
              ))}
              <li key="demo123">
                <Link
                  className={"block border-b bg-white p-4 text-xl"}
                  to="demo123/streams"
                >
                  Sample Chart
                </Link>
              </li>
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

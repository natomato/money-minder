import type { LoaderFunctionArgs } from "@remix-run/node";

import { json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { getChart } from "~/models/chart.server";
import { shorten } from "~/utils";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.chartId, "chartId not found");
  const { chart } = await getChart(params.chartId);
  if (!chart) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ chart });
};

export default function () {
  const { chart } = useLoaderData<typeof loader>();

  return (
    <section id="balance-sheet" className="">
      <h1 className="text-2xl">Balance Sheet</h1>
      <div>
        <p>Todo: Add Chart</p>
      </div>
      <RowTotals totals={chart.totals} />
      <Outlet />
    </section>
  );
}

function RowTotals({ totals }: { totals: number[] }) {
  const columns = {
    gridTemplateColumns: `repeat(${totals.length}, minmax(0, 1fr))`,
  };
  return (
    <div className="grid" style={columns}>
      {totals.map((value, index) => {
        return (
          <div
            className="grid min-h-8 place-items-center rounded border border-solid border-slate-300 text-xs"
            key={`col-${index + 1}`}
          >
            {shorten(value)}
          </div>
        );
      })}
    </div>
  );
}

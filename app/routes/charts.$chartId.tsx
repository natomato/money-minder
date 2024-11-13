import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  NavLink,
  Outlet,
  useLoaderData,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import React, { PropsWithChildren } from "react";
import invariant from "tiny-invariant";

import { getChart } from "~/models/chart.server";
import { CHART_COLORS } from "~/utils/chart";
import { shorten } from "~/utils";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.chartId, "chartId not found");
  const { chart } = await getChart(params.chartId);
  if (!chart) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ chart });
};

const MQ = {
  TINY_MAX: 380,
  PHONE_MIN: 381,
  PHONE_MAX: 500,
  PHABLET_MIN: 501,
  PHABLET_MAX: 800,
  TABLET_MIN: 801,
  TABLET_MAX: 1030,
  MONITOR_MIN: 1031,
  MONITOR_LARGE: 2400,
};
// Adjust the number of tick marks displayed based on viewport width
function XAxis({ units, vw }: { units: number[]; vw: number }) {
  let tickMarks = 8;
  //use compact years, like `25, on small screens to fit more tickMarks
  const isCompact = vw <= MQ.PHABLET_MAX;
  let values = units.map((unit) => {
    if (isCompact) {
      return `'${unit.toString().slice(-2)}`;
    }
    return unit.toString();
  });

  if (vw <= MQ.TINY_MAX) {
    tickMarks = 8;
  } else if (vw <= MQ.PHONE_MAX) {
    tickMarks = 12;
  } else if (vw <= MQ.PHABLET_MAX) {
    tickMarks = 16;
  } else if (vw <= MQ.TABLET_MAX) {
    tickMarks = 16;
  } else if (vw <= MQ.MONITOR_LARGE) {
    tickMarks = 24;
  } else {
    tickMarks = 30;
  }

  values = pickEveryFew(values, tickMarks); //from ['1', '2', '3', '4'] => ['1', '', '3', '']

  const columns = {
    gridTemplateColumns: `repeat(${units.length}, minmax(0, 1fr))`,
  };
  return (
    <div className="grid" style={columns}>
      {values.map((value, index) => {
        if (value) {
          return (
            <div className="border-l-2 border-black text-sm" key={index}>
              {value}
            </div>
          );
        } else {
          return <div key={index}></div>;
        }
      })}
    </div>
  );
}

// Find the best fit for xaxis
// if given [1..10] and you have 10 slots = [1,2,3,4,5,6,7,8,9]
// if given [1..10] and you have 9 slots = same as 5
// if given [1..10] and you have 6 slots = same as 5
// if given [1..10] and you have 5 slots = ['1','', '3', '', '5'...'9']
// if given [1..10] and you have 4 slots = ['1', '', '', '4', ... '10']
function pickEveryFew(list: string[], spaceAvailable: number): string[] {
  const full = list.length;
  const half = Math.floor(full / 2);
  const third = Math.floor(full / 3);
  const fourth = Math.floor(full / 4);
  const fifth = Math.floor(full / 5);
  let addEvery;
  if (spaceAvailable >= full) {
    addEvery = 1;
  } else if (spaceAvailable >= half) {
    addEvery = 2;
  } else if (spaceAvailable >= third) {
    addEvery = 3;
  } else if (spaceAvailable >= fourth) {
    addEvery = 4;
  } else if (spaceAvailable >= fifth) {
    addEvery = 5;
  } else {
    addEvery = 5;
    console.log(
      "Reached the limit of the x-axis compactness. Cannot show less than 1 every 5",
    );
  }

  return list.map((v, idx) => {
    if (idx % addEvery === 0) {
      return v.toString();
    }
    return "";
  });
}

type ChartColor = keyof typeof CHART_COLORS;
interface BarProps {
  row: number;
  gridStart: number;
  gridStop: number;
  color: ChartColor;
  name: string;
  id: string;
}
function Bar({ gridStart, gridStop, row, color, name, id }: BarProps) {
  const position = {
    gridColumnStart: gridStart || "none",
    gridColumnEnd: gridStop || "none",
    gridRow: row,
  };
  const label = {
    gridColumnStart: -4,
    gridColumnEnd: -1,
    gridRow: row,
  };
  const barColor = color ? CHART_COLORS[color] : "";
  const classNames = `place-items-center text-sm min-h-8 flex rounded ${barColor}`;
  return (
    <>
      <div
        className="z-10 flex min-h-8 place-items-center text-sm"
        style={label}
        id={shorten(name)}
      >
        <Link
          to={`./streams/${id}`}
          className="overflow-hidden whitespace-nowrap"
        >
          {name}
        </Link>
      </div>
      <div className={classNames} style={position} id={shorten(id)}></div>
    </>
  );
}

interface GridProps {
  cols: number;
  rows: number;
}

const Grid: React.FC<PropsWithChildren<GridProps>> = ({
  rows,
  cols,
  children,
}) => {
  const columns = {
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rows}, 2rem)`,
  };

  return (
    <div className="grid" style={columns}>
      {children}
    </div>
  );
};

type NoRowBarProps = Omit<BarProps, "row">;
export default function ChartDetailsPage() {
  const { chart } = useLoaderData<typeof loader>();

  const gridCols = chart.xAxis.length;
  //TODO: get the vw in a clientLoader or useEffect, because browser only
  let vw = MQ.MONITOR_MIN;

  const bars = chart.streamsWithData.map((stream) => {
    const { startIndex, stopIndex, name, color, isIncome, id } = stream;

    const gridStart = stopIndex ? startIndex + 1 : 0;
    const gridStop = stopIndex ? stopIndex + 2 : 0;

    return { isIncome, props: { gridStart, gridStop, name, color, id } };
  });
  interface AccumulatorType {
    incomes: NoRowBarProps[];
    expenses: NoRowBarProps[];
  }
  const { incomes, expenses } = bars.reduce<AccumulatorType>(
    (acc, bar) => {
      if (bar.isIncome) {
        acc.incomes.push(bar.props);
      } else {
        acc.expenses.push(bar.props);
      }
      return acc;
    },
    { incomes: [], expenses: [] },
  );

  return (
    <main className="m-4 flex flex-col">
      <h1 className="mb-4 text-2xl">
        <NavLink to={`./streams`}>{chart.name}</NavLink>
      </h1>
      <section className="h-80 w-full font-sans text-2xl">
        <Grid rows={incomes.length} cols={gridCols}>
          {incomes.map((income, index) => (
            <Bar {...income} row={index + 1} key={shorten(income.id)} />
          ))}
        </Grid>
        <XAxis units={chart.xAxis} vw={vw} />
        <Grid rows={expenses.length} cols={gridCols}>
          {expenses.map((expense, index) => (
            <Bar {...expense} row={index + 1} key={shorten(expense.id)} />
          ))}
        </Grid>
      </section>
      <Outlet />
    </main>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (error instanceof Error) {
    return <div>An unexpected error occurred: {error.message}</div>;
  }

  if (!isRouteErrorResponse(error)) {
    return <h1>Unknown Error</h1>;
  }

  if (error.status === 404) {
    return <div>Note not found</div>;
  }

  return <div>An unexpected error occurred: {error.statusText}</div>;
}

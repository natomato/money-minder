import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import React, { PropsWithChildren } from "react";
import invariant from "tiny-invariant";

import { getChart } from "~/models/chart.server";
import type { StreamWithData, StreamColor } from "~/utils/chart";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.chartId, "chartId not found");
  const { chart } = await getChart(params.chartId);
  if (!chart) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ chart });
};

const CHART_COLORS: Record<StreamColor, string> = {
  SKY: "bg-sky-500",
  RED: "bg-red-500",
  PURPLE: "bg-purple-500",
  ORANGE: "bg-orange-500",
  GREEN: "bg-green-500",
  YELLOW: "bg-yellow-500",
  DEFAULT: "bg-slate-500",
} as const;

//TODO: refactor this to be useful when showing all cell values
export function Stream(stream: StreamWithData) {
  const columns = {
    gridTemplateColumns: `repeat(${stream.data.length}, minmax(0, 1fr))`,
  };
  const emptyCell = "grid place-items-center text-sm min-h-8";
  const filledCell = `${emptyCell} ${CHART_COLORS[stream.color]}`;
  return (
    <div className="grid" style={columns}>
      {stream.data.map((value, index) => {
        return (
          <div
            className={value ? filledCell : emptyCell}
            key={`${stream.name.substring(0, 4)}-${index}`}
          ></div>
        );
      })}
    </div>
  );
}

function XAxis({ units }: { units: number[] }) {
  const columns = {
    gridTemplateColumns: `repeat(${units.length}, minmax(0, 1fr))`,
  };
  return (
    <div className="grid" style={columns}>
      {units.map((unit) => {
        return (
          <div className="border-l-2 border-black text-sm" key={unit}>
            {unit}
          </div>
        );
      })}
    </div>
  );
}

function shorten(word: string, len = 6) {
  if (word.length <= len) return word;
  return word.substring(word.length - len);
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
  const classNames = `place-items-center text-sm min-h-8 flex ${barColor}`;
  const hideName = false; //TODO: enable a toggle button
  return (
    <>
      <div
        className="z-10 flex min-h-8 place-items-center text-sm"
        style={label}
        id={shorten(name)}
      >
        <p className="overflow-hidden whitespace-nowrap">
          {hideName ? "" : name}
        </p>
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
export default function ScenarioDetailsPage() {
  const { chart } = useLoaderData<typeof loader>();

  const gridCols = chart.xAxis.length;
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
    <main className="flex flex-row">
      <div className="h-80 w-full font-sans text-2xl">
        <Grid rows={incomes.length} cols={gridCols}>
          {incomes.map((income, index) => (
            <Bar {...income} row={index + 1} key={shorten(income.id)} />
          ))}
        </Grid>
        <XAxis units={chart.xAxis} />
        <Grid rows={expenses.length} cols={gridCols}>
          {expenses.map((expense, index) => (
            <Bar {...expense} row={index + 1} key={shorten(expense.id)} />
          ))}
        </Grid>
        <section id="timeline-editor" className="m-4">
          <p>Streams Editor</p>
        </section>
      </div>
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

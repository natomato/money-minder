import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import React, { PropsWithChildren } from "react";
import {
  useLoaderData,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import invariant from "tiny-invariant";

import type { StreamWithData } from "~/utils/chart";
import { getChart } from "~/models/chart.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.chartId, "chartId not found");
  const { chart } = await getChart(params.chartId);
  if (!chart) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ chart });
};

const CHART_COLORS = {
  SKY: "bg-sky-500",
  RED: "bg-red-500",
  PURPLE: "bg-purple-500",
  ORANGE: "bg-orange-500",
  GREEN: "bg-green-500",
  YELLOW: "bg-yellow-500",
} as const;

function Stream(stream: StreamWithData) {
  const columns = {
    gridTemplateColumns: `repeat(${stream.data.length}, minmax(0, 1fr))`,
  };
  const emptyCell = "grid place-items-center text-sm min-h-8";
  const filledCell = emptyCell + " " + CHART_COLORS[stream.color];
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

type ChartColor = keyof typeof CHART_COLORS;
function Bar({
  start,
  stop,
  color,
  label,
}: {
  start: number;
  stop: number;
  color: ChartColor;
  label: string;
}) {
  const position = { gridColumnStart: start, gridColumnEnd: stop };
  const barColor = color ? CHART_COLORS[color] : "";
  const classNames = `grid place-items-center text-sm min-h-8 ${barColor}`;
  return (
    <div className={classNames} style={position}>
      {label}
    </div>
  );
}

interface GridProps {
  cols: number;
}

const Grid: React.FC<PropsWithChildren<GridProps>> = ({ cols, children }) => {
  const columns = {
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
  };

  return (
    <div className="grid" style={columns}>
      {children}
    </div>
  );
};

export default function ScenarioDetailsPage() {
  const { chart } = useLoaderData<typeof loader>();

  const incomeStreams = chart.streamsWithData.filter(
    (stream) => stream.isIncome,
  );
  const expenseStreams = chart.streamsWithData.filter(
    (stream) => !stream.isIncome,
  );

  return (
    <main className="flex flex-row">
      <div className="h-80 w-full font-sans text-2xl">
        <Grid cols={17}>
          <Bar start={5} stop={15} color="PURPLE" label="Test" />
        </Grid>
        {incomeStreams.map((stream) => (
          <Stream {...stream} key={stream.name} />
        ))}
        <XAxis units={chart.xAxis} />
        {expenseStreams.map((stream) => (
          <Stream {...stream} key={stream.name} />
        ))}
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

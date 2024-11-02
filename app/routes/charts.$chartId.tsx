import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import invariant from "tiny-invariant";

import type { Timeline } from "~/models/chart.server";
import { getChartAndTimelines } from "~/models/chart.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.chartId, "chartId not found");
  const { chart, timelines, xAxis } = await getChartAndTimelines(
    params.chartId,
  );
  if (!chart) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ chart, timelines, xAxis });
};

interface TimelineCell {
  color?: string;
  label?: string;
  first?: boolean;
  last?: boolean;
}

function TimeLineCell({
  color,
  label,
  first = false,
  last = false,
}: TimelineCell) {
  color = color || "";
  label = label || "";
  let classNames = "h-8";
  if (color) {
    classNames = classNames + ` ${color}`;
  }
  if (label) {
    classNames = classNames + ` grid place-items-center`;
  }
  if (first) {
    classNames = classNames + ` rounded-l-lg`;
  }
  if (last) {
    classNames = classNames + ` rounded-r-lg`;
  }
  return <div className={classNames}>{label}</div>;
}

//Create an array of default props for a TimelineCell of the given size
function newTimeline(size: number): TimelineCell[] {
  return Array.from({ length: size }, () => {
    return {
      label: "",
      color: "",
      first: false,
      last: false,
    };
  });
}

//Modify the array of default Timeline props to indicate if a cell is part of the incomeExpenseStream or empty space
function addBar(
  timeline: TimelineCell,
  index: number,
  first: number,
  last: number,
  color: string,
) {
  return {
    ...timeline,
    color: index >= first && index <= last ? color : "",
    first: index == first,
    last: index == last,
  };
}

//Modify the array of default Timeline props to add a label
function addLabel(timeline: TimelineCell, index: number, label: string) {
  return {
    ...timeline,
    label: index == 0 ? label : "",
  };
}

function Timeline({
  label,
  position,
  xAxisBegin: first,
  xAxisEnd: last,
  total,
  color,
}: Timeline) {
  const columns = { gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` };

  const timelineProps = newTimeline(total)
    .map((timeline, index) => addBar(timeline, index, first, last, color))
    .map((timeline, index) => addLabel(timeline, index, String(position + 1)));

  return (
    <div className="grid" style={columns}>
      {timelineProps.map((props, index) => (
        <TimeLineCell {...props} key={`${label.substring(0, 4)}-${index}`} />
      ))}
    </div>
  );
}

interface xAxisProps {
  units: number[] | string[];
}

function XAxis({ units }: xAxisProps) {
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

function TimelineEditor({ label }: Timeline) {
  return (
    <div>
      <p>{label}</p>
    </div>
  );
}

export default function ScenarioDetailsPage() {
  const { xAxis, timelines } = useLoaderData<typeof loader>();

  const incomeStreams = timelines.filter((line) => line.isIncome);
  const expenseStreams = timelines.filter((line) => !line.isIncome);

  return (
    <div className="flex flex-col">
      <main className="flex bg-white">
        <div className="flex-1 p-6">
          <div className="flex flex-col">
            <div className="flex h-80 w-full flex-col font-sans text-2xl">
              {incomeStreams.map((timeline) => (
                <Timeline {...timeline} key={timeline.label} />
              ))}
              <XAxis units={xAxis} />
              {expenseStreams.map((timeline) => (
                <Timeline {...timeline} key={timeline.label} />
              ))}
              <section id="timeline-editor" className="m-4">
                <TimelineEditor {...expenseStreams[0]} />
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
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

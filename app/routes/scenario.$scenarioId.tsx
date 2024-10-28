import { Form, Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";

type IncomeExpenseStream = {
  name: string,
  amountPerYr: number,
  startDate: Date,
  endDate: Date,
}

const mockStreams = [
  { name: "Pension", amountPerYr: 60000, startDate: new Date('01/01/2024'), endDate: new Date('01/01/2034') },
  { name: "Living Expenses", amountPerYr: -65000, startDate: new Date('01/01/2024'), endDate: new Date('01/01/2034') },
  { name: "Land Sale", amountPerYr: 80000, startDate: new Date('01/01/2025'), endDate: new Date('01/01/2025') },
  { name: "Loan Repayment", amountPerYr: 36000, startDate: new Date('01/01/2025'), endDate: new Date('01/01/2032') },
]

const demoData = {
  chartStart: new Date('01/01/2024'),
  chartEnd: new Date('01/01/2040'),
  streams: mockStreams,
};


type TimelineCell = {
  color?: string,
  label?: string,
  first?: boolean,
  last?: boolean,
}

function TimeLineCell({ color, label, first = false, last = false }: TimelineCell) {
  color = color || "";
  label = label || "";
  let classNames = "h-8";
  if (color) { classNames = classNames + ` ${color}` }
  if (label) { classNames = classNames + ` grid place-items-center` }
  if (first) { classNames = classNames + ` rounded-l-lg` }
  if (last) { classNames = classNames + ` rounded-r-lg` }

  return (
    <div className={classNames}>{label}</div>
  );
}

type Timeline = {
  position: number,
  label: string,
  xAxisBegin: number,
  xAxisEnd: number,
  total: number,
  color: string,
}

//Create an array of default props for a TimelineCell of the given size
function newTimeline(size: number): TimelineCell[] {
  return Array.from({ length: size }, () => {
    return {
      label: '',
      color: '',
      first: false,
      last: false,
    }
  });
}

//Modify the array of default Timeline props to indicate if a cell is part of the incomeExpenseStream or empty space
function addBar(timeline: TimelineCell, index: number, first: number, last: number, color: string) {
  return {
    ...timeline,
    color: index >= first && index <= last ? color : '',
    first: index == first,
    last: index == last,
  }
}

//Modify the array of default Timeline props to add a label
function addLabel(timeline: TimelineCell, index: number, label: string) {
  return {
    ...timeline,
    label: index == 0 ? label : '',
  }
}


function Timeline({ label, position, xAxisBegin: first, xAxisEnd: last, total, color }: Timeline) {
  const columns = { gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }

  let timelineProps = newTimeline(total)
    .map((timeline, index) => addBar(timeline, index, first, last, color))
    .map((timeline, index) => addLabel(timeline, index, String(position + 1)))

  return (
    <div className="grid" style={columns} onClick={() => console.log(`clicked ${label}`)}>
      {timelineProps.map((props, index) => <TimeLineCell {...props} key={`${label.substr(0, 4)}-${index}`} />)}
    </div>
  )
}

type xAxisProps = {
  units: Array<number | string>
}

function XAxis({ units }: xAxisProps) {
  const columns = { gridTemplateColumns: `repeat(${units.length}, minmax(0, 1fr))` }
  return (
    <div className="grid" style={columns}>
      {units.map((unit) => {
        return <div className="text-sm border-l-2 border-black" key={unit}>{unit}</div>
      })}
    </div>
  )
}

function TimelineEditor({ label }: Timeline) {
  return (
    <div><p>{label}</p></div>
  )
}

function getYearsBetween(startDate: string | Date, stopDate: string | Date): number[] {
  const start: Date = new Date(startDate);
  const stop: Date = new Date(stopDate);
  const startYear: number = start.getUTCFullYear();
  const stopYear: number = stop.getUTCFullYear();
  const years: number[] = [];

  for (let year: number = startYear; year <= stopYear; year++) {
    years.push(year);
  }

  return years;
}

type SummaryProps = {
  unitOfTime: string,
  startDate: Date | string,
  endDate: Date | string,
}

//TODO: make demoData a prop
function FinPlanSummary({ unitOfTime = 'year', startDate = "2024", endDate = "2040" }: SummaryProps) {
  //calculate x-axis
  let xAxis: number[] = [];
  if (unitOfTime = 'year') {
    xAxis = getYearsBetween(startDate, endDate);
  }

  const colorsForTimelines = [
    "bg-sky-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-green-500",
    "bg-yellow-500",
  ]

  //convert stream to timeline
  const timelines = demoData.streams.map(({ name, startDate, endDate }: IncomeExpenseStream, index): Timeline => {
    let last = -1;
    let first = -1;
    if (unitOfTime = 'year') {
      first = xAxis.indexOf(startDate.getUTCFullYear());
      last = xAxis.indexOf(endDate.getUTCFullYear());
    }

    if (first == -1 || last == -1) {
      throw Error(`Unable to find the start, ${first}, or end, ${last}, date for the ${name} stream along the x-axis: ${xAxis[0]}...${xAxis[-1]}`)
    }

    let choice = index % colorsForTimelines.length; //repeat after last color used

    return {
      position: index,
      label: name,
      xAxisBegin: first,
      xAxisEnd: last,
      total: xAxis.length,
      color: colorsForTimelines[choice],
    }
  });

  return (
    <div className="flex h-full min-h-screen flex-col">
      <main className="flex flex-col border-solid border-red-200 font-sans text-2xl w-full h-80">
        <Timeline {...timelines[3]} />
        <Timeline {...timelines[2]} />
        <Timeline {...timelines[1]} />
        <XAxis units={xAxis} />
        <Timeline {...timelines[0]} />
        <section id='timeline-editor' className="m-4">
          <TimelineEditor {...timelines[0]} />
        </section>
      </main>
    </div >
  );
}

export default function SummaryPage() {

  return (
    <div className="flex h-full min-h-screen flex-col">
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

      <Outlet />
      <main className="flex h-full bg-white">
        <div className="flex-1 p-6">
          <FinPlanSummary />
        </div>
      </main>
    </div>
  );
}

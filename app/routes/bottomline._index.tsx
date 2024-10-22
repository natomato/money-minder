type IncomeExpenseStream = {
  name: string,
  amount: number,
  startDate: Date,
  endDate: Date,
}

const mockStreams = [
  { name: "Pension", amount: 60000, startDate: new Date('01/01/2024'), endDate: new Date('01/01/2034') },
  { name: "Living Expenses", amount: -65000, startDate: new Date('01/01/2024'), endDate: new Date('01/01/2034') },
  { name: "Land Sale", amount: 80000, startDate: new Date('01/01/2025'), endDate: new Date('01/01/2025') },
  { name: "Land Loan Repayment", amount: 36000, startDate: new Date('01/01/2025'), endDate: new Date('01/01/2032') },
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
  clickHandler?: (event: EventTarget) => void,
}

function TimeLineCell({ color, label, clickHandler, first = false, last = false }: TimelineCell) {
  color = color || "";
  label = label || "";
  clickHandler = clickHandler || undefined;
  let classNames = "h-8";
  if (color) { classNames = classNames + ` ${color}` }
  if (label) { classNames = classNames + ` grid place-items-center` }
  if (first) { classNames = classNames + ` rounded-l-lg` }
  if (last) { classNames = classNames + ` rounded-r-lg` }

  return (
    <div className={classNames} onClick={clickHandler}>{label}</div>
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
      clickHandler: () => { },
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

//TODO: rethink how to add click handlers
//NOTE: Only allowed 1 clickHandler function per cell
// Better to enable move on click, then let another part of screen show a webform when click on the stream where the lenght can be changed.
function addShrinkClickHandler(timeline: TimelineCell, index: number, first: number, last: number, clickHandler: () => {}) {
  return {
    ...timeline,
    clickHandler: index == first || index == last ? clickHandler : timeline.clickHandler,
  }
}

//NOTE: Only allowed 1 clickHandler function per cell
function addExpandClickHandler(timeline: TimelineCell, index: number, first: number, last: number, clickHandler: () => {}) {
  return {
    ...timeline,
    clickHandler: index == first - 1 || index == last + 1 ? clickHandler : timeline.clickHandler,
  }
}

function Timeline({ label, position, xAxisBegin: first, xAxisEnd: last, total, color }: Timeline) {
  const columns = { gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }
  const expand = ({ target }: Event) => { console.log('expand' + target) };
  const shrink = ({ target }: Event) => { console.log('shrink' + target) };

  let timelineProps = newTimeline(total)
    .map((timeline, index) => addBar(timeline, index, first, last, color))
    .map((timeline, index) => addLabel(timeline, index, String(position + 1)))
    .map((timeline, index) => addShrinkClickHandler(timeline, index, first, last, shrink))
    .map((timeline, index) => addExpandClickHandler(timeline, index, first, last, expand))

  console.log('tlp', timelineProps);
  return (
    <div className="grid" style={columns}>
      {timelineProps.map(props => <TimeLineCell {...props} key={position} />)}
    </div>
  )
}

function getYearsBetween(startDate: string | Date, stopDate: string | Date): number[] {
  const start: Date = new Date(startDate);
  const stop: Date = new Date(stopDate);
  const startYear: number = start.getFullYear();
  const stopYear: number = stop.getFullYear();
  const years: number[] = [];

  for (let year: number = startYear; year <= stopYear; year++) {
    years.push(year);
  }

  return years;
}

type BLDemoProps = {
  unitOfTime: string,
  startDate: Date | string,
  endDate: Date | string,
}

//TODO: make demoData a prop
export default function BottomLineDemo({ unitOfTime = 'year', startDate = "2024", endDate = "2040" }: BLDemoProps) {
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
    let last, first;
    if (unitOfTime = 'year') {
      first = xAxis.indexOf(startDate.getFullYear());
      last = xAxis.indexOf(endDate.getFullYear());
    }

    if (!first || !last) {
      throw Error(`Unable to find the start or end date for the ${name} stream along the x-axis: ${xAxis}`)
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
        <Timeline {...timelines[0]} />

        <p>...</p>
        <div className="grid grid-cols-8 border-solid border-2">
          <div></div>
          <div></div>
          <div className="bg-gradient-to-l from-sky-500 to-10%" onClick={() => { console.log('+c') }}></div>
          <div className="flex justify-center bg-sky-500 border-solid border-2 border-sky-700">C</div>
          <div className="hover:bg-gradient-to-r hover:from-sky-500 hover:to-10% border-dashed border-2 border-gray-100" onClick={() => { console.log('c+') }}></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <p>...</p>
        <div className="">
          {/* <div className="max-w-4xl mx-auto my-12"> */}
          <div className="relative w-[400px] h-[200px] border-l-2 border-b-2 border-black">
            {/* Y-axis labels */}
            <div className="absolute -left-10 top-0 bottom-0 flex flex-col-reverse justify-between">
              <span className="text-xs">-4</span>
              <span className="text-xs">-5</span>
            </div>

            {/* X-axis labels */}
            <div className="absolute left-0 right-0 -bottom-8 flex justify-between">
              <span className="text-xs transform -rotate-45 origin-top-left">2024</span>
              <span className="text-xs transform -rotate-45 origin-top-left">2040</span>
            </div>
          </div>
        </div>
      </main >
    </div >
  );
}


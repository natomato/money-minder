// Helper methods for bridging the divide between a chart as an array of values useful for the UI
// ie: StreamsWithData
//   [
//     id: <streamId>
//     data: [ 0, 0, 5, 5, 5, 5, 0, 0]    <--- Generated
//     isIncome: (above or below x-axis)
//     color: ...
//     amountPerYr: (when showValues toggled)
//     name: (to make the label)
//     boundary: (for UI to render correct end-cap)
//   ]
//
// and a chart as a list of Stream objects useful for storing and editing
// ie: streams[]
//   [
//     {amountPerYr: 0, startDate: '', stopDate: '', duration: 0, streamBoundary: '', ...}
//     {amountPerYr: 0, startDate: '', stopDate: '', duration: 0, streamBoundary: '', ...}
//     {amountPerYr: 0, startDate: '', stopDate: '', duration: 0, streamBoundary: '', ...}
//     {amountPerYr: 0, startDate: '', stopDate: '', duration: 0, streamBoundary: '', ...}
//     {amountPerYr: 0, startDate: '', stopDate: '', duration: 0, streamBoundary: '', ...}
//   ]

import type { Stream, Moment } from "@prisma/client";

import { Prisma } from "@prisma/client";

const chartWithElements = Prisma.validator<Prisma.ChartDefaultArgs>()({
  include: { streams: true, moments: true },
});
export type ChartWithElements = Prisma.ChartGetPayload<
  typeof chartWithElements
>;

export type StreamWithData = Stream & { data: number[] };

export const STREAM_COLORS = {
  SKY: "SKY",
  PURPLE: "PURPLE",
  RED: "RED",
  GREEN: "GREEN",
  ORANGE: "ORANGE",
  YELLOW: "YELLOW",
} as const;
export const STREAM_BOUNDARY = {
  Date_to_Date: "Date_to_Date",
  Date_to_Moment: "Date_to_Moment",
  Date_to_Duration: "Date_to_Duration",
  Moment_to_Date: "Moment_to_Date",
  Moment_to_Moment: "Moment_to_Moment",
  Moment_to_Duration: "Moment_to_Duration",
  Duration_to_Date: "Duration_to_Date",
  Duration_to_Moment: "Duration_to_Moment",
} as const;

interface ChartDates {
  startYear: number;
  stopYear: number;
  error: string;
}

type ChartData = {
  xAxis: number[];
  streamsWithData: StreamWithData[];
  totals: number[];
};
export function getChartData(chart: ChartWithElements): ChartData {
  const { streams, moments } = chart;
  const xAxis = getYears(chart.startDate, chart.stopDate);

  const streamsWithData = streams.map((stream): StreamWithData => {
    const [firstYear, lastYear] = getFirstAndLastYear(stream, moments);
    const streamWithData = { ...stream, data: [] } as StreamWithData;
    // calculate the streams value for each year on the x-axis
    streamWithData.data = xAxis.map((year) => {
      if (year < firstYear || year > lastYear) {
        return 0; //a stream where the start year is after the stop year will be all 0's
      } else {
        return stream.amountPerYr;
      }
    });
    return streamWithData;
  });

  const totals = getTotals(streamsWithData);
  return { xAxis, streamsWithData, totals };
}

export function getYears(startDate: Date, stopDate: Date): ChartData["xAxis"] {
  const { error, startYear, stopYear } = getChartLimits(startDate, stopDate);
  if (error) {
    throw Error(error);
  }
  const years: number[] = [];
  for (let year: number = startYear; year <= stopYear; year++) {
    years.push(year);
  }
  return years;
}

function getChartLimits(startDate: Date, stopDate: Date): ChartDates {
  let error = "";
  if (!startDate || !stopDate) {
    error = `Chart missing a start, ${startDate}, or stop, ${stopDate} date`;
  }
  const start: Date = new Date(startDate);
  const stop: Date = new Date(stopDate);
  const startYear: number = start.getUTCFullYear();
  const stopYear: number = stop.getUTCFullYear();
  if (startYear < 2000 || startYear > 2100) {
    error = `Chart start year is out of range, ${startYear}`;
  }
  if (stopYear < 2000 || stopYear > 2100) {
    error = `Chart stop year is out of range, ${stopYear}`;
  }

  return { startYear, stopYear, error };
}

function getMomentYear(
  id: string | undefined | null,
  moments: Moment[],
): number | undefined {
  return moments
    .filter((moment) => moment.id === id)
    .map((moment) => moment.date.getUTCFullYear())
    .pop();
}

function getFirstAndLastYear(
  stream: Stream,
  moments: Moment[],
): [number, number] {
  let firstYear = 0;
  let lastYear = 0;
  const duration = stream.setDuration;
  const boundary = stream.streamBoundary;
  const startMoment = getMomentYear(stream.startMomentId, moments);
  const stopMoment = getMomentYear(stream.stopMomentId, moments);
  const startDate = stream.startDate?.getUTCFullYear();
  const stopDate = stream.stopDate?.getUTCFullYear();

  // Compute the first and last year
  switch (boundary) {
    case STREAM_BOUNDARY.Date_to_Date:
      if (!startDate || !stopDate) {
        throw Error(
          `Stream boundary, ${boundary}, can not be determined between ${startDate} and ${stopDate}`,
        );
      }
      firstYear = startDate;
      lastYear = stopDate;
      break;

    case STREAM_BOUNDARY.Date_to_Moment:
      if (!startDate || !stopMoment) {
        throw Error(
          `Stream boundary, ${boundary}, can not be determined between date ${startDate} and ${stopMoment}`,
        );
      }
      firstYear = startDate;
      lastYear = stopMoment;
      break;

    case STREAM_BOUNDARY.Date_to_Duration:
      if (!startDate || !duration) {
        throw Error(
          `Stream boundary, ${boundary}, can not be determined between ${startDate} and a duration of ${duration}`,
        );
      }
      firstYear = startDate;
      lastYear = startDate + duration;
      break;

    case STREAM_BOUNDARY.Moment_to_Date:
      if (!startMoment || !stopDate) {
        throw Error(
          `Stream boundary, ${boundary}, can not be determined between ${startMoment} and ${stopDate}`,
        );
      }
      firstYear = startMoment;
      lastYear = stopDate;
      break;

    case STREAM_BOUNDARY.Moment_to_Moment:
      if (!startMoment || !stopMoment) {
        throw Error(
          `Stream boundary, ${boundary}, can not be determined between ${startMoment} and ${stopMoment}`,
        );
      }
      firstYear = startMoment;
      lastYear = stopMoment;
      break;

    case STREAM_BOUNDARY.Moment_to_Duration:
      if (!startMoment || !duration) {
        throw Error(
          `Stream boundary, ${boundary}, can not be determined between ${startMoment} and a duration of ${duration}`,
        );
      }
      firstYear = startMoment;
      lastYear = startMoment + duration;
      break;

    case STREAM_BOUNDARY.Duration_to_Date:
      if (!duration || !stopDate) {
        throw Error(
          `Stream boundary, ${boundary}, can not be determined with a duration of ${duration} and stop date ${stopDate}`,
        );
      }
      firstYear = stopDate - duration;
      lastYear = stopDate;
      break;

    case STREAM_BOUNDARY.Duration_to_Moment:
      if (!duration || !stopMoment) {
        throw Error(
          `Stream boundary, ${boundary}, can not be determined between ${duration} and ${stopMoment}`,
        );
      }
      firstYear = stopMoment - duration;
      lastYear = stopMoment;
      break;

    default:
      throw Error(
        `Stream boundary, ${boundary}, did not match any known stream boundary types.`,
      );
  }

  if (lastYear < firstYear) {
    //TODO: Not yet sure how I want to handle this state.
    // It can come from moving a moment's start or stop date.
    console.log(
      `Invalid range in stream, ${stream.name}. [${firstYear}...${lastYear}]`,
    );
  }
  if (firstYear < 2000 || lastYear > 2100) {
    throw Error(
      `Stream boundaries, ${firstYear}...${lastYear}, are out of range for the stream: ${stream.name}`,
    );
  }

  return [firstYear, lastYear];
}

export function getTotals(streams: StreamWithData[]) {
  const data = streams.map((stream) => stream.data);
  return sumColumns(data);
}

function sumColumns(data: number[][]): number[] {
  return transpose(data).map((col) => {
    return col.reduce((acc, val) => acc + val, 0);
  });
}

function transpose(data: number[][]): number[][] {
  if (data.length === 0) return [];

  const numRows = data.length;
  const numCols = data[0].length;

  let result: number[][] = Array(numCols)
    .fill([])
    .map(() => []);

  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      result[j][i] = data[i][j];
    }
  }

  return result;
}

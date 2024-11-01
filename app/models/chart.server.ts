import type { User, Chart, Stream, Moment } from "@prisma/client";

import { prisma } from "~/db.server";

export const STREAM_BOUNDARY = {
  Date_to_Date: "Date_to_Date",
  Date_to_Moment: "Date_to_Moment",
  Date_to_Duration: "Date_to_Duration",
  Moment_to_Date: "Moment_to_Date",
  Moment_to_Moment: "Moment_to_Moment",
  Moment_to_Duration: "Moment_to_Duration",
  Duration_to_Date: "Duration_to_Date",
  Duration_to_Moment: "Duration_to_Moment",
};

function getChart(id: Chart["id"]) {
  return prisma.chart.findUnique({
    where: { id },
    include: {
      streams: true,
      moments: true,
    }
  });
}

export async function getChartAndTimelines(id: Chart["id"]) {
  const chart = await getChart(id);
  if (!chart) { return { chart, timelines: [], xAxis: [] } }
  const { streams, moments } = chart
  const xAxis = createXAxis(chart);
  const timelines = convertStreamsToTimelines(streams, moments, xAxis)
  return {
    chart,
    xAxis,
    timelines,
  };
}

export function getChartsByUser(creatorId: User["id"]) {
  return prisma.chart.findMany({
    where: { creatorId },
    select: { id: true, name: true, updatedAt: true, },
    orderBy: { updatedAt: "desc" },
  });
}

function createMapOfMomentsToYear(moments: Moment[]): Record<string, number> {
  return moments.reduce((table, moment) => {
    table[moment.id] = moment.date.getUTCFullYear();
    return table;
  }, {} as Record<string, number>);
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

type XAxis = number[];
function createXAxis(chart: Chart): XAxis {
  //NOTE: currently only allow charting income by year
  return getYearsBetween(chart.startDate, chart.stopDate);
}

function getFirstAndLastYear(stream: Stream, moments: Moment[]): [number, number] {
  let startYear = 0;
  let stopYear = 0;
  const duration = stream.setDuration;
  const boundary = stream.streamBoundary;
  const momentsTable = createMapOfMomentsToYear(moments);
  const startMoment = stream.startMomentId ? momentsTable[stream.startMomentId] : null;
  const stopMoment = stream.stopMomentId ? momentsTable[stream.stopMomentId] : null;
  const startDate = stream.startDate ? stream.startDate.getUTCFullYear() : null;
  const stopDate = stream.stopDate ? stream.stopDate.getUTCFullYear() : null;

  // Compute the first and last year
  switch (boundary) {
    case STREAM_BOUNDARY.Date_to_Date:
      if (!startDate || !stopDate) {
        throw Error(`Stream boundary, ${boundary}, can not be determined between ${startDate} and ${stopDate}`)
      }
      startYear = startDate;
      stopYear = stopDate;
      break;

    case STREAM_BOUNDARY.Date_to_Moment:
      if (!startDate || !stopMoment) {
        throw Error(`Stream boundary, ${boundary}, can not be determined between date ${startDate} and ${stopMoment}`)
      }
      startYear = startDate;
      stopYear = stopMoment;
      break;

    case STREAM_BOUNDARY.Date_to_Duration:
      if (!startDate || !duration) {
        throw Error(`Stream boundary, ${boundary}, can not be determined between ${startDate} and a duration of ${duration}`)
      }
      startYear = startDate;
      stopYear = startDate + duration;
      break;

    case STREAM_BOUNDARY.Moment_to_Date:
      if (!startMoment || !stopDate) {
        throw Error(`Stream boundary, ${boundary}, can not be determined between ${startMoment} and ${stopDate}`)
      }
      startYear = startMoment;
      stopYear = stopDate;
      break;

    case STREAM_BOUNDARY.Moment_to_Moment:
      if (!startMoment || !stopMoment) {
        throw Error(`Stream boundary, ${boundary}, can not be determined between ${startMoment} and ${stopMoment}`)
      }
      startYear = startMoment;
      stopYear = stopMoment;
      break;

    case STREAM_BOUNDARY.Moment_to_Duration:
      if (!startMoment || !duration) {
        throw Error(`Stream boundary, ${boundary}, can not be determined between ${startMoment} and a duration of ${duration}`)
      }
      startYear = startMoment;
      stopYear = startMoment + duration;
      break;


    case STREAM_BOUNDARY.Duration_to_Date:
      if (!duration || !stopDate) {
        throw Error(`Stream boundary, ${boundary}, can not be determined with a duration of ${duration} and stop date ${stopDate}`)
      }
      startYear = stopDate - duration;
      stopYear = stopDate;
      break;

    case STREAM_BOUNDARY.Duration_to_Moment:
      if (!duration || !stopMoment) {
        throw Error(`Stream boundary, ${boundary}, can not be determined between ${duration} and ${stopMoment}`)
      }
      startYear = stopMoment - duration;
      stopYear = stopMoment;
      break;

    default:
      throw Error(`Stream boundary, ${boundary}, did not match any known stream boundary types.`)
  }

  if (startYear < 2000 || stopYear < 2000) {
    throw Error(`Stream boundaries, ${startYear}...${stopYear}, are out of range for the stream: ${stream.name}`)
  }

  return [startYear, stopYear];
}

export interface Timeline {
  position: number,
  label: string,
  xAxisBegin: number,
  xAxisEnd: number,
  total: number,
  color: string,
  isIncome: boolean,
}
export function convertStreamsToTimelines(streams: Stream[], moments: Moment[], xAxis: XAxis): Timeline[] {

  //TODO: add color to the db to allow users to change the color
  const colorsForTimelines = [
    "bg-sky-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-green-500",
    "bg-yellow-500",
  ]

  //convert an income stream to a timeline
  const timelines = streams.map((stream, index): Timeline => {
    const [firstYear, lastYear] = getFirstAndLastYear(stream, moments);

    // map the stream to points on the x-axis
    const firstPoint = xAxis.indexOf(firstYear);
    const lastPoint = xAxis.indexOf(lastYear);

    if (firstPoint == -1 || lastPoint == -1) {
      throw Error(`Unable to find the start, ${firstYear}, or end, ${lastYear}, point for the ${stream.name} stream along the x-axis: [${xAxis[0]}...${xAxis[xAxis.length - 1]}]`)
    }

    const choice = index % colorsForTimelines.length; //repeat after last color used

    return {
      position: index,
      label: stream.name,
      xAxisBegin: firstPoint,
      xAxisEnd: lastPoint,
      total: xAxis.length,
      color: colorsForTimelines[choice],
      isIncome: stream.amountPerYr > 0,
    }
  });
  return timelines
}

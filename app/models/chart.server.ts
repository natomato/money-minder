import type { User, Chart, Stream } from "@prisma/client";

import { prisma } from "~/db.server";
import type { ChartWithElements } from "~/utils/chart";
import { getChartData } from "~/utils/chart";

async function getChartRaw(id: Chart["id"]): Promise<ChartWithElements | null> {
  return await prisma.chart.findUnique({
    where: { id },
    include: {
      streams: true,
      moments: true,
    },
  });
}

export async function getChart(id: Chart["id"]) {
  const chartRaw = await getChartRaw(id);
  if (!chartRaw) {
    return { chart: undefined };
  }
  const chart = getChartData(chartRaw);
  return { chart };
}

export async function getStream(
  id: Stream["id"] | undefined,
): Promise<Stream | null> {
  return await prisma.stream.findUnique({
    where: { id },
    include: {
      startMoment: true,
      stopMoment: true,
    },
  });
}

export function getChartsByUser(creatorId: User["id"]) {
  return prisma.chart.findMany({
    where: { creatorId },
    select: { id: true, name: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function updateStream({
  id,
  amountPerYr,
}: {
  id: string;
  amountPerYr: number;
}) {
  return prisma.stream.update({
    where: { id },
    data: { amountPerYr },
  });
}

import type { User, Chart } from "@prisma/client";
import type { ChartWithElements } from "~/utils/chart";

import { prisma } from "~/db.server";
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

export function getChartsByUser(creatorId: User["id"]) {
  return prisma.chart.findMany({
    where: { creatorId },
    select: { id: true, name: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}

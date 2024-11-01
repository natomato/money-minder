import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { STREAM_BOUNDARY } from "~/models/chart.server";

const prisma = new PrismaClient();

async function generateUser(name: string) {
  const email = `${name}@test.run`;
  const password = await bcrypt.hash(`${name}iscool`, 10);

  return await prisma.user.create({
    data: {
      email,
      password: {
        create: {
          hash: password,
        },
      },
    },
  });
}

async function deleteUsers() {
  // cleanup the existing database
  await prisma.user.deleteMany({ where: { email: { contains: "test.run" } } }).catch(() => {
    // no worries if it doesn't exist yet
  });
}

async function seed() {
  await deleteUsers();
  const rachel = await generateUser("rachel");
  const alice = await generateUser("alice");
  const bob = await generateUser("bob");

  await prisma.note.create({
    data: {
      title: "My first note",
      body: "Hello, world!",
      userId: rachel.id,
    },
  });

  await prisma.note.create({
    data: {
      title: "My second note",
      body: "Hello, world!",
      userId: rachel.id,
    },
  });

  const chartNoPension = await prisma.chart.create({
    data: {
      id: 'demo123',
      name: "Living without the Pension",
      startDate: "2024-01-01T00:00:00-00:00",
      stopDate: "2040-01-01T00:00:00-00:00",
      savings: 200000,
      creatorId: alice.id,
    }
  });

  const momentRIPBob = await prisma.moment.create({
    data: {
      name: "RIP Bob",
      date: "2025-01-01T00:00:00-00:00",
      chartId: chartNoPension.id,
    }
  });

  const landSale = await prisma.moment.create({
    data: {
      name: "Cleveland Sold",
      date: "2026-01-01T00:00:00-00:00",
      chartId: chartNoPension.id,
    }
  });


  const landRevenue = await prisma.stream.create({
    data: {
      name: "Cleveland Sale",
      amountPerYr: 80000,
      streamBoundary: STREAM_BOUNDARY.Moment_to_Moment,
      startMomentId: landSale.id,
      stopMomentId: landSale.id,
      chartId: chartNoPension.id,
    }
  });

  const loanPayments = await prisma.stream.create({
    data: {
      name: "Loan Payments",
      amountPerYr: 36000,
      streamBoundary: STREAM_BOUNDARY.Moment_to_Duration,
      startMomentId: landSale.id,
      setDuration: 7,
      chartId: chartNoPension.id,
    }
  });

  const pension = await prisma.stream.create({
    data: {
      name: "Pension",
      amountPerYr: 80000,
      streamBoundary: STREAM_BOUNDARY.Date_to_Moment,
      startDate: "2024-01-01T00:00:00-00:00",
      stopMomentId: momentRIPBob.id,
      chartId: chartNoPension.id,
    }
  });

  // This is tricky. The current liv expenses for 2 people goes until the first person dies, could be Alice or Bob
  // I could create a new type of derived moment, RIP_1st_person, whose value updates based on who dies first.
  const currentlivExp = await prisma.stream.create({
    data: {
      name: "Living Expenses",
      amountPerYr: -60000,
      streamBoundary: STREAM_BOUNDARY.Date_to_Date,
      startDate: "2024-01-01T00:00:00-00:00",
      stopDate: "2040-01-01T00:00:00-00:00",
      chartId: chartNoPension.id,
    }
  });

  const ltcExp = await prisma.stream.create({
    data: {
      name: "Bob's Long Term Care Expenses",
      amountPerYr: -120000,
      streamBoundary: STREAM_BOUNDARY.Duration_to_Moment,
      setDuration: 2,
      stopMomentId: momentRIPBob.id,
      chartId: chartNoPension.id,
    }
  });


  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

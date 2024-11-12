import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  Outlet,
  useActionData,
  useLoaderData,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import React, { PropsWithChildren, useEffect, useRef } from "react";
import invariant from "tiny-invariant";

import { getStream, updateStream } from "~/models/chart.server";
import type { StreamWithData, StreamColor } from "~/utils/chart";
import { CHART_COLORS } from "~/utils/chart";
import { shorten } from "~/utils";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  invariant(params.chartId, "chartId not found");
  const stream = await getStream(params.streamId);
  if (!stream) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ stream });
};

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const amountPerYr = Number(formData.get("amountPerYr"));
  const name = formData.get("name");
  if (isNaN(amountPerYr)) {
    return json(
      { errors: { name: null, amount: "Amount is required" } },
      { status: 400 },
    );
  }

  if (typeof name !== "string" || name.length === 0) {
    return json(
      { errors: { name: "Name is required", amount: null } },
      { status: 400 },
    );
  }

  const livExpId = "cm363onr0000ieeg1g7ewnhnm";
  await updateStream({ id: livExpId, amountPerYr });
  return redirect("/charts/demo123");
};

export default function StreamDetails() {
  const { stream } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.errors?.name) {
      nameRef.current?.focus();
    } else if (actionData?.errors?.amount) {
      amountRef.current?.focus();
    }
  }, [actionData]);

  return (
    <section id="stream-details" className="">
      <h3 className="text-2xl font-bold">{stream.name}</h3>
      <Form
        method="post"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: "100%",
        }}
      >
        <div>
          <label className="flex w-full flex-col gap-1">
            <span>Name: </span>
            <input
              ref={nameRef}
              name="name"
              className="inline flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
              aria-invalid={actionData?.errors?.name ? true : undefined}
              aria-errormessage={
                actionData?.errors?.name ? "name-error" : undefined
              }
            />
          </label>
          {actionData?.errors?.name ? (
            <div className="pt-1 text-red-700" id="name-error">
              {actionData.errors.name}
            </div>
          ) : null}
        </div>
        <div>
          <label className="flex w-full flex-row gap-1">
            <span>Amount: </span>
            <input
              ref={amountRef}
              name="amountPerYr"
              type="text"
              inputMode="numeric"
              pattern="-?\d*"
              title="Accepts only numbers. No '$' or '.' decimal point"
              className="w-40 flex-1 rounded-md border-2 border-blue-500 px-3 py-2 text-lg leading-6"
              aria-invalid={actionData?.errors?.amount ? true : undefined}
              aria-errormessage={
                actionData?.errors?.amount ? "amount-error" : undefined
              }
            />
          </label>
          {actionData?.errors?.amount ? (
            <div className="pt-1 text-red-700" id="amount-error">
              {actionData.errors.amount}
            </div>
          ) : null}
        </div>

        <div className="text-right">
          <button
            type="submit"
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            Save
          </button>
        </div>
      </Form>
    </section>
  );
}

function Stream({ stream }: { stream: StreamWithData }) {
  const columns = {
    gridTemplateColumns: `repeat(${stream.data.length}, minmax(0, 1fr))`,
  };
  const emptyCell =
    "grid place-items-center text-xs min-h-8 rounded border-solid border-2 border-slate-300";
  const filledCell = `${emptyCell} ${CHART_COLORS[stream.color]}`;
  return (
    <div className="grid" style={columns}>
      {stream.data.map((value, index) => {
        return (
          <div
            className={value ? filledCell : emptyCell}
            key={`${stream.name.substring(0, 4)}-${index}`}
          >
            {shorten(value)}
          </div>
        );
      })}
    </div>
  );
}

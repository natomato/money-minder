import { Link } from "@remix-run/react";

export default function Scenarios() {

  return (
    <main className="flex h-full bg-white">
      <div className="flex-1 p-6">
        <div className="grid grid-cols-4">
          <div>Scenario: Lose Pension Early</div>
          <div>
            <p>Moments</p>
            <p>RIP: Alice 2046</p>
            <p>RIP: Bob 2026</p>
            <p>...</p>
          </div>
          <div>Balance Sheet Img</div>
          <div>Created: 01/01/2024 by Alice</div>
        </div>
        <div className="">
          <Link to="" className="text-blue-500 underline">
            New Scenario
          </Link>
        </div>
      </div>
    </main>
  );
}


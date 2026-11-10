"use client";

import dynamic from "next/dynamic";
import type { LogementCarte } from "./CarteLogements";

const CarteLogements = dynamic(() => import("./CarteLogements"), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full animate-pulse rounded-lg bg-gray-800" />
  ),
});

export default function CarteWrapper({
  logements,
}: {
  logements: LogementCarte[];
}) {
  return <CarteLogements logements={logements} />;
}
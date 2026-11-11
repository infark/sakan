"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { LogementCarte } from "./CarteLogements";

const CarteLogements = dynamic(() => import("./CarteLogements"), {
  ssr: false,
});

function Placeholder() {
  return <div className="h-96 w-full animate-pulse rounded-lg bg-gray-800" />;
}

export default function CarteWrapper({
  logements,
}: {
  logements: LogementCarte[];
}) {
  const [cle, setCle] = useState(0);

  useEffect(() => {
    setCle((c) => c + 1);
    return () => setCle(0);
  }, []);

  if (cle === 0) return <Placeholder />;

  return <CarteLogements key={cle} logements={logements} />;
}
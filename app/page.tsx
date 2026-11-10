import { Suspense } from "react";
import { supabase } from "@/lib/supabase";

type Logement = {
  id: number;
  titre: string;
  type: string;
  prix_mensuel: number;
  charges_incluses: boolean;
  meuble: boolean;
  quartier: string;
};

async function ListeLogements() {
  const { data, error } = await supabase
    .from("logements")
    .select("id, titre, type, prix_mensuel, charges_incluses, meuble, quartier")
    .eq("statut", "publie")
    .order("prix_mensuel", { ascending: true });

  const logements = (data ?? []) as Logement[];

  return (
    <>
      {error && (
        <p className="rounded bg-red-100 p-3 text-red-700">
          Erreur : {error.message}
        </p>
      )}

      <ul className="space-y-3">
        {logements.map((l) => (
          <li key={l.id} className="rounded-lg border p-4">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-semibold">{l.titre}</h2>
              <span className="whitespace-nowrap font-bold">
                {l.prix_mensuel} DT/mois
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {l.quartier} · {l.type}
              {l.meuble ? " · meublé" : ""}
              {l.charges_incluses ? " · charges incluses" : ""}
            </p>
          </li>
        ))}
      </ul>

      {!error && logements.length === 0 && (
        <p className="text-gray-500">Aucun logement pour le moment.</p>
      )}
    </>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">Sakan</h1>
      <p className="mb-6 text-gray-500">Logements étudiants à Tunis</p>

      <Suspense fallback={<p className="text-gray-500">Chargement…</p>}>
        <ListeLogements />
      </Suspense>
    </main>
  );
}
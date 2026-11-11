import { Suspense } from "react";
import { supabase } from "@/lib/supabase";
import RechercheLogements, {
  type Logement,
} from "@/components/RechercheLogements";

async function ChargerLogements() {
  const { data, error } = await supabase
    .from("logements")
    .select(
      "id, titre, type, prix_mensuel, charges_incluses, meuble, quartier, latitude, longitude, photos"
    )
    .eq("statut", "publie")
    .order("prix_mensuel", { ascending: true });

  if (error) {
    return (
      <p className="rounded bg-red-100 p-3 text-red-700">
        Erreur : {error.message}
      </p>
    );
  }

  return <RechercheLogements logements={(data ?? []) as Logement[]} />;
}

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">Sakan</h1>
      <p className="mb-6 text-gray-500">Logements étudiants à Tunis</p>

      <Suspense fallback={<p className="text-gray-500">Chargement…</p>}>
        <ChargerLogements />
      </Suspense>
    </main>
  );
}
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { urlPhoto } from "@/lib/photos";
import FormulaireAvis from "@/components/FormulaireAvis";
import ContactLogement from "@/components/ContactLogement";

const LIBELLES_TYPES: Record<string, string> = {
  chambre: "chambre",
  studio: "studio",
  s1: "S+1",
  s2: "S+2",
  s3: "S+3",
  colocation: "colocation",
};

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const logementId = Number(id);
  if (!Number.isInteger(logementId)) notFound();

  const { data: logement } = await supabase
    .from("logements")
    .select(
      "id, titre, description, type, prix_mensuel, charges_incluses, meuble, quartier, photos"
    )
    .eq("id", logementId)
    .eq("statut", "publie")
    .maybeSingle();

  if (!logement) notFound();

  const photos = (logement.photos ?? []) as string[];

  const { data: statsData } = await supabase.rpc("stats_quartier", {
    p_quartier: logement.quartier,
    p_type: logement.type,
  });
  const stats = statsData?.[0] ?? null;

  let comparaison: {
    moyenne: number;
    nb: number;
    min: number;
    max: number;
    verdict: string;
    couleur: string;
  } | null = null;

  if (stats && Number(stats.nb) >= 3) {
    const moyenne = Number(stats.prix_moyen);
    const ecart = Math.round(
      ((logement.prix_mensuel - moyenne) / moyenne) * 100
    );
    let verdict = "Dans la moyenne du quartier";
    let couleur = "text-gray-400";
    if (ecart <= -10) {
      verdict = `${Math.abs(ecart)} % moins cher que la moyenne`;
      couleur = "text-emerald-500";
    } else if (ecart >= 10) {
      verdict = `${ecart} % plus cher que la moyenne`;
      couleur = "text-orange-500";
    }
    comparaison = {
      moyenne,
      nb: Number(stats.nb),
      min: Number(stats.prix_min),
      max: Number(stats.prix_max),
      verdict,
      couleur,
    };
  }

  const { data: avisData } = await supabase
    .from("avis")
    .select("id, auteur_id, note, commentaire, created_at")
    .eq("logement_id", logementId)
    .order("created_at", { ascending: false });

  const avis = avisData ?? [];

  const pseudos = new Map<string, string>();
  const auteurIds = [...new Set(avis.map((a) => a.auteur_id))];
  if (auteurIds.length > 0) {
    const { data: profils } = await supabase
      .from("profils")
      .select("id, pseudo")
      .in("id", auteurIds);
    profils?.forEach((p) => pseudos.set(p.id, p.pseudo));
  }

  const moyenneAvis =
    avis.length > 0 ? avis.reduce((s, a) => s + a.note, 0) / avis.length : null;

  return (
    <>
      <Link href="/" className="text-sm text-gray-500 underline">
        ← Retour aux logements
      </Link>

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h1 className="text-3xl font-bold">{logement.titre}</h1>
        <span className="whitespace-nowrap text-xl font-bold">
          {logement.prix_mensuel} DT/mois
        </span>
      </div>

      <p className="mt-1 text-gray-500">
        {logement.quartier} · {logement.type}
        {logement.meuble ? " · meublé" : ""}
        {logement.charges_incluses ? " · charges incluses" : ""}
      </p>

      <ContactLogement logementId={logementId} />

      {comparaison && (
        <div className="mt-4 rounded-lg border p-4 text-sm">
          <p className={`font-semibold ${comparaison.couleur}`}>
            {comparaison.verdict}
          </p>
          <p className="mt-1 text-gray-500">
            Prix moyen pour {LIBELLES_TYPES[logement.type] ?? logement.type} à{" "}
            {logement.quartier} : {comparaison.moyenne} DT/mois (
            {comparaison.nb} annonces, de {comparaison.min} à {comparaison.max}{" "}
            DT)
          </p>
        </div>
      )}

      {photos.length > 0 && (
        <div className="mt-6 flex gap-3 overflow-x-auto">
          {photos.map((p) => (
            <img
              key={p}
              src={urlPhoto(p)}
              alt={logement.titre}
              className="h-64 w-auto flex-shrink-0 rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      {logement.description && (
        <p className="mt-6 whitespace-pre-line">{logement.description}</p>
      )}

      <section className="mt-10">
        <h2 className="mb-1 text-2xl font-bold">Avis des étudiants</h2>
        <p className="mb-4 text-gray-500">
          {moyenneAvis !== null
            ? `${moyenneAvis.toFixed(1)} / 5 · ${avis.length} avis`
            : "Aucun avis pour le moment."}
        </p>

        <ul className="mb-8 space-y-3">
          {avis.map((a) => (
            <li key={a.id} className="rounded-lg border p-4">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">
                  {pseudos.get(a.auteur_id) ?? "etudiant"}
                </span>
                <span>{"★".repeat(a.note) + "☆".repeat(5 - a.note)}</span>
              </div>
              {a.commentaire && <p className="mt-2">{a.commentaire}</p>}
              <p className="mt-2 text-xs text-gray-500">
                {new Date(a.created_at).toLocaleDateString("fr-FR")}
              </p>
            </li>
          ))}
        </ul>

        <FormulaireAvis logementId={logementId} />
      </section>
    </>
  );
}

export default function PageLogement({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Suspense fallback={<p className="text-gray-500">Chargement…</p>}>
        <Detail params={params} />
      </Suspense>
    </main>
  );
}
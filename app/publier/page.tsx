"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { compresserPhoto } from "@/lib/compresser";

const QUARTIERS: Record<string, [number, number]> = {
  "Centre-ville": [36.799, 10.18],
  "Lafayette": [36.811, 10.181],
  "El Menzah": [36.837, 10.175],
  "El Manar": [36.834, 10.148],
  "Ennasr": [36.848, 10.162],
  "Bardo": [36.809, 10.134],
  "Manouba": [36.81, 10.098],
  "Ariana": [36.8625, 10.1955],
  "Lac 1": [36.833, 10.229],
  "La Marsa": [36.878, 10.325],
};

const TYPES = [
  { value: "chambre", label: "Chambre" },
  { value: "studio", label: "Studio" },
  { value: "s1", label: "S+1" },
  { value: "s2", label: "S+2" },
  { value: "s3", label: "S+3" },
  { value: "colocation", label: "Colocation" },
];

const FORMATS_ACCEPTES = ["image/jpeg", "image/png", "image/webp"];

const MAX_PHOTOS = 5;
const MAX_OCTETS = 15 * 1024 * 1024;
const BUCKET = "logements-photos";

export default function Publier() {
  const [connecte, setConnecte] = useState<boolean | null>(null);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("chambre");
  const [prix, setPrix] = useState("");
  const [quartier, setQuartier] = useState("Centre-ville");
  const [meuble, setMeuble] = useState(false);
  const [charges, setCharges] = useState(false);
  const [tel, setTel] = useState("");
  const [fichiers, setFichiers] = useState<File[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setConnecte(!!data.session);
    });
  }, []);

  function choisirPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    setErreur(null);
    const choisis = Array.from(e.target.files ?? []);

    if (choisis.length > MAX_PHOTOS) {
      setErreur(`Maximum ${MAX_PHOTOS} photos.`);
      e.target.value = "";
      return;
    }
    if (choisis.some((f) => !FORMATS_ACCEPTES.includes(f.type))) {
      setErreur("Formats acceptés : JPG, PNG ou WebP.");
      e.target.value = "";
      return;
    }
    if (choisis.some((f) => f.size > MAX_OCTETS)) {
      setErreur("Chaque photo doit faire 15 Mo maximum.");
      e.target.value = "";
      return;
    }
    setFichiers(choisis);
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      setErreur("Session expirée, reconnecte-toi.");
      setChargement(false);
      return;
    }

    const chemins: string[] = [];
    for (const f of fichiers) {
      let blob: Blob;
      try {
        blob = await compresserPhoto(f);
      } catch {
        if (chemins.length > 0) {
          await supabase.storage.from(BUCKET).remove(chemins);
        }
        setErreur("Impossible de traiter une des photos.");
        setChargement(false);
        return;
      }

      const ext = blob.type === "image/webp" ? "webp" : "jpg";
      const chemin = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: errUpload } = await supabase.storage
        .from(BUCKET)
        .upload(chemin, blob, { contentType: blob.type });

      if (errUpload) {
        if (chemins.length > 0) {
          await supabase.storage.from(BUCKET).remove(chemins);
        }
        setErreur("Envoi d'une photo impossible : " + errUpload.message);
        setChargement(false);
        return;
      }
      chemins.push(chemin);
    }

    const [lat, lng] = QUARTIERS[quartier];
    const decalage = () => (Math.random() - 0.5) * 0.004;

    const { error } = await supabase.from("logements").insert({
      titre: titre.trim(),
      description: description.trim() || null,
      type,
      prix_mensuel: Number(prix),
      charges_incluses: charges,
      meuble,
      quartier,
      latitude: lat + decalage(),
      longitude: lng + decalage(),
      contact_tel: tel.trim() || null,
      photos: chemins,
      statut: "en_attente",
    });

    if (error) {
      if (chemins.length > 0) {
        await supabase.storage.from(BUCKET).remove(chemins);
      }
      setErreur(error.message);
    } else {
      setEnvoye(true);
    }
    setChargement(false);
  }

  if (connecte === null) {
    return (
      <main className="mx-auto max-w-xl p-6 text-gray-500">Chargement…</main>
    );
  }

  if (!connecte) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="mb-4 text-3xl font-bold">Publier un logement</h1>
        <p className="mb-4 text-gray-500">
          Tu dois être connecté pour publier une annonce.
        </p>
        <Link
          href="/connexion"
          className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white"
        >
          Se connecter
        </Link>
      </main>
    );
  }

  if (envoye) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="mb-4 text-3xl font-bold">Merci !</h1>
        <p className="mb-4 text-gray-500">
          Ton annonce a bien été envoyée. Elle sera visible après vérification.
        </p>
        <a href="/" className="underline">
          Retour à l&apos;accueil
        </a>
      </main>
    );
  }

  const champ = "w-full rounded border border-gray-600 bg-transparent p-3";

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Publier un logement</h1>

      <form onSubmit={soumettre} className="space-y-4">
        <input
          required
          minLength={5}
          maxLength={120}
          placeholder="Titre (ex : Chambre calme près de la fac)"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          className={champ}
        />

        <textarea
          maxLength={2000}
          rows={4}
          placeholder="Description (optionnel)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={champ}
        />

        <div className="grid grid-cols-2 gap-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={champ}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value} className="text-black">
                {t.label}
              </option>
            ))}
          </select>

          <input
            required
            type="number"
            min={1}
            placeholder="Prix (DT/mois)"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            className={champ}
          />
        </div>

        <select
          value={quartier}
          onChange={(e) => setQuartier(e.target.value)}
          className={champ}
        >
          {Object.keys(QUARTIERS).map((q) => (
            <option key={q} value={q} className="text-black">
              {q}
            </option>
          ))}
        </select>

        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={meuble}
              onChange={(e) => setMeuble(e.target.checked)}
            />
            Meublé
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={charges}
              onChange={(e) => setCharges(e.target.checked)}
            />
            Charges incluses
          </label>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Photos (jusqu&apos;à {MAX_PHOTOS}, 15 Mo chacune)
          </label>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={choisirPhotos}
            className="w-full text-sm"
          />
          {fichiers.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {fichiers.length} photo{fichiers.length > 1 ? "s" : ""}{" "}
              sélectionnée{fichiers.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        <input
          type="tel"
          placeholder="Téléphone de contact (optionnel)"
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          className={champ}
        />

        {erreur && (
          <p className="rounded bg-red-100 p-3 text-sm text-red-700">{erreur}</p>
        )}

        <button
          type="submit"
          disabled={chargement}
          className="w-full rounded bg-emerald-600 p-3 font-semibold text-white disabled:opacity-50"
        >
          {chargement ? "Envoi…" : "Envoyer mon annonce"}
        </button>
      </form>
    </main>
  );
}
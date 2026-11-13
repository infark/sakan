"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ContactLogement({
  logementId,
}: {
  logementId: number;
}) {
  const [etat, setEtat] = useState<
    "chargement" | "deconnecte" | "ok" | "erreur"
  >("chargement");
  const [tel, setTel] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);

  useEffect(() => {
    async function charger() {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setEtat("deconnecte");
        return;
      }
      const { data, error } = await supabase
        .from("logements")
        .select("contact_tel")
        .eq("id", logementId)
        .maybeSingle();

      if (error) {
        setEtat("erreur");
        return;
      }
      setTel(data?.contact_tel ?? null);
      setEtat("ok");
    }
    charger();
  }, [logementId]);

  async function copierNumero(numero: string) {
    try {
      await navigator.clipboard.writeText(numero);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      window.prompt("Copie le numéro :", numero);
    }
  }

  if (etat === "chargement") return null;

  const boite = "mt-4 rounded-lg border p-4 text-sm";

  if (etat === "deconnecte") {
    return (
      <div className={boite}>
        <Link href="/connexion" className="font-semibold underline">
          Connecte-toi
        </Link>{" "}
        pour voir le contact du propriétaire.
      </div>
    );
  }

  if (etat === "erreur") {
    return (
      <div className={boite}>
        Impossible de charger le contact pour le moment.
      </div>
    );
  }

  if (!tel) {
    return (
      <div className={boite}>
        Le propriétaire n&apos;a pas laissé de numéro de téléphone.
      </div>
    );
  }

  const chiffres = tel.replace(/\D/g, "");
  const international =
    chiffres.length === 8
      ? "216" + chiffres
      : chiffres.startsWith("00")
        ? chiffres.slice(2)
        : chiffres;

  return (
    <div className={boite}>
      <p className="mb-3 font-semibold">Contact : {tel}</p>
      <div className="flex flex-wrap gap-3">
        <a
          href={`tel:+${international}`}
          className="rounded bg-emerald-600 px-4 py-2 font-semibold text-white"
        >
          Appeler
        </a>
        <a
          href={`https://wa.me/${international}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-emerald-600 px-4 py-2 font-semibold text-emerald-500"
        >
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => copierNumero(tel)}
          className="rounded border border-gray-600 px-4 py-2 font-semibold"
        >
          {copie ? "Copié ✓" : "Copier le numéro"}
        </button>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Sur ordinateur, le bouton « Appeler » ne fonctionne que si une
        application d&apos;appel est installée.
      </p>
    </div>
  );
}
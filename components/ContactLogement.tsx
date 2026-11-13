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
      <div className={boite}>Impossible de charger le contact pour le moment.</div>
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
      <div className="flex gap-3">
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
      </div>
    </div>
  );
}
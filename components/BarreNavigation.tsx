"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function BarreNavigation() {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    async function verifierAdmin(u: User | null) {
      if (!u) {
        setAdmin(false);
        return;
      }
      const { data } = await supabase.rpc("est_admin");
      setAdmin(data === true);
    }

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      setPret(true);
      verifierAdmin(u);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setTimeout(() => verifierAdmin(u), 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 p-6 pb-0">
      <Link href="/" className="text-xl font-bold">
        Sakan
      </Link>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <Link
          href="/publier"
          className="rounded bg-emerald-600 px-3 py-1 font-semibold text-white"
        >
          Publier
        </Link>

        {pret &&
          (user ? (
            <>
              <Link href="/mes-annonces" className="underline">
                Mes annonces
              </Link>
              {admin && (
                <>
                  <Link href="/admin" className="underline">
                    Modération
                  </Link>
                  <Link href="/admin/signalements" className="underline">
                    Signalements
                  </Link>
                </>
              )}
              <span className="hidden text-gray-500 sm:inline">
                {user.email}
              </span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="underline"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link href="/connexion" className="underline">
              Se connecter
            </Link>
          ))}
      </div>
    </nav>
  );
}
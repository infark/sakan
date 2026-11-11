"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function BarreNavigation() {
  const [user, setUser] = useState<User | null>(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setPret(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (  
    <nav className="mx-auto flex max-w-3xl items-center justify-between p-6 pb-0">
      <Link href="/" className="text-xl font-bold">
        Sakan
      </Link>

      <div className="flex items-center gap-4 text-sm">
        <Link
          href="/publier"
          className="rounded bg-emerald-600 px-3 py-1 font-semibold text-white"
        >
          Publier
        </Link>

        {pret &&
          (user ? (
            <>
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
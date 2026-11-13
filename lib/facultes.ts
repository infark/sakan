export type Faculte = {
  id: string;
  nom: string;
  latitude: number;
  longitude: number;
};

// POSITIONS APPROXIMATIVES : à vérifier et corriger avant le lancement.
export const FACULTES: Faculte[] = [
  {
    id: "el-manar",
    nom: "Campus universitaire El Manar",
    latitude: 36.843,
    longitude: 10.14,
  },
  {
    id: "manouba",
    nom: "Campus de la Manouba",
    latitude: 36.815,
    longitude: 10.062,
  },
  {
    id: "centre-ville",
    nom: "Centre-ville de Tunis (repère)",
    latitude: 36.7995,
    longitude: 10.18,
  },
];
// Carte du restaurant — fiche officielle « Les Résidences H₂O ».
// Reprise par la migration du manager (table menu_restaurant) : toute modification
// doit être faite dans le manager ; ce fichier ne sert qu'à afficher la carte si
// Supabase ne répond pas.
//
// prix_libelle remplace le montant lorsque le prix n'en est pas un (fourchette, inclus, sur demande).

export const SECTIONS_RESTAURANT = [
  { section: 'Petit déjeuner', note: null },
  { section: 'Volailles', note: 'Sauté · grillé · soupe · braisé · kedjenou' },
  { section: 'Porc', note: null },
  { section: 'Poissons & fruits de mer', note: 'Modes de cuisson : braisé · soupe · sauté · grillé' },
  { section: 'Accompagnements', note: null },
  { section: 'Boissons', note: null },
  { section: 'Piscine — accès externe (restaurant)', note: "Atteindre le minimum de consommation donne accès à la grande piscine du restaurant." },
]

export const MENU_FALLBACK = [
  { ordre: 1, section: 'Petit déjeuner', categorie: 'petit_dejeuner', nom: 'Croissant & cake', prix: 0, prix_libelle: 'Inclus' },
  { ordre: 2, section: 'Petit déjeuner', categorie: 'petit_dejeuner', nom: 'Jus naturel', prix: 0, prix_libelle: 'Inclus' },
  { ordre: 3, section: 'Petit déjeuner', categorie: 'petit_dejeuner', nom: 'Yaourt', prix: 0, prix_libelle: 'Inclus' },
  { ordre: 4, section: 'Petit déjeuner', categorie: 'petit_dejeuner', nom: 'Pain', prix: 0, prix_libelle: 'Inclus' },
  { ordre: 5, section: 'Petit déjeuner', categorie: 'petit_dejeuner', nom: 'Omelette, jambon & saucisse', prix: 0, prix_libelle: 'Inclus' },
  { ordre: 6, section: 'Petit déjeuner', categorie: 'petit_dejeuner', nom: 'Café', prix: 0, prix_libelle: 'Inclus' },

  { ordre: 7, section: 'Volailles', categorie: 'plat', nom: 'Poulet entier', description: 'Avec attiéké', prix: 8000 },
  { ordre: 8, section: 'Volailles', categorie: 'plat', nom: 'Demi poulet', description: 'Avec attiéké', prix: 5000 },
  { ordre: 9, section: 'Volailles', categorie: 'plat', nom: 'Pondeuse entière', description: 'Avec attiéké', prix: 10000 },
  { ordre: 10, section: 'Volailles', categorie: 'plat', nom: 'Demi pondeuse', prix: 5000 },
  { ordre: 11, section: 'Volailles', categorie: 'plat', nom: 'Pintade entière', description: 'Avec attiéké', prix: 12000 },
  { ordre: 12, section: 'Volailles', categorie: 'plat', nom: 'Demi pintade', description: 'Avec attiéké', prix: 6000 },
  { ordre: 13, section: 'Volailles', categorie: 'plat', nom: 'Grouillon de dinde', prix: 5000 },
  { ordre: 14, section: 'Volailles', categorie: 'plat', nom: 'Saucisse de Toulouse', prix: 0, prix_libelle: 'Sur demande' },

  { ordre: 15, section: 'Porc', categorie: 'plat', nom: 'Plat de porc', description: 'Avec attiéké', prix: 10000 },

  { ordre: 16, section: 'Poissons & fruits de mer', categorie: 'plat', nom: 'Tilapia / Carpe', prix: 6000, prix_libelle: '6 000 – 12 000 F' },
  { ordre: 17, section: 'Poissons & fruits de mer', categorie: 'plat', nom: 'Saint-Pierre · Soso · Sol', prix: 0, prix_libelle: 'Selon taille' },
  { ordre: 18, section: 'Poissons & fruits de mer', categorie: 'plat', nom: 'Écrevisse', prix: 10000 },
  { ordre: 19, section: 'Poissons & fruits de mer', categorie: 'plat', nom: 'Gambas', prix: 10000 },
  { ordre: 20, section: 'Poissons & fruits de mer', categorie: 'plat', nom: 'Escargot', prix: 10000 },

  { ordre: 21, section: 'Accompagnements', categorie: 'accompagnement', nom: 'Attiéké', prix: 500 },
  { ordre: 22, section: 'Accompagnements', categorie: 'accompagnement', nom: 'Frite', prix: 1000 },
  { ordre: 23, section: 'Accompagnements', categorie: 'accompagnement', nom: 'Alloco', prix: 1000 },
  { ordre: 24, section: 'Accompagnements', categorie: 'accompagnement', nom: 'Djabloci', prix: 1000 },
  { ordre: 25, section: 'Accompagnements', categorie: 'accompagnement', nom: 'Igname', prix: 1000 },

  { ordre: 26, section: 'Boissons', categorie: 'jus', nom: 'Jus naturel', prix: 1000 },
  { ordre: 27, section: 'Boissons', categorie: 'boisson', nom: 'Eau', prix: 1000 },
  { ordre: 28, section: 'Boissons', categorie: 'boisson', nom: 'Sucrerie (sodas)', prix: 1000 },
  { ordre: 29, section: 'Boissons', categorie: 'boisson', nom: 'Bière', prix: 2000 },
  { ordre: 30, section: 'Boissons', categorie: 'boisson', nom: 'Cocktail', prix: 2000, prix_libelle: '2 000 – 3 000 F' },
  { ordre: 31, section: 'Boissons', categorie: 'boisson', nom: 'Shots (short)', prix: 1000, prix_libelle: '1 000 – 5 000 F' },
  { ordre: 32, section: 'Boissons', categorie: 'vin', nom: 'Vin', prix: 5000, prix_libelle: '5 000 – 10 000 F' },
  { ordre: 33, section: 'Boissons', categorie: 'boisson', nom: 'Liqueurs', prix: 15000, prix_libelle: '15 000 – 30 000 F' },
  { ordre: 34, section: 'Boissons', categorie: 'vin', nom: 'Champagne', prix: 40000, prix_libelle: '40 000 – 60 000 F' },

  { ordre: 35, section: 'Piscine — accès externe (restaurant)', categorie: 'piscine', nom: 'Nage simple — adulte', prix: 5000 },
  { ordre: 36, section: 'Piscine — accès externe (restaurant)', categorie: 'piscine', nom: 'Nage simple — adulte avec serviette', prix: 7000 },
  { ordre: 37, section: 'Piscine — accès externe (restaurant)', categorie: 'piscine', nom: 'Nage simple — enfant', prix: 3000 },
  { ordre: 38, section: 'Piscine — accès externe (restaurant)', categorie: 'piscine', nom: 'Nage simple — enfant (boisson sans alcool)', prix: 1000 },
  { ordre: 39, section: 'Piscine — accès externe (restaurant)', categorie: 'piscine', nom: 'Droit piscine via consommation — adulte', description: 'Consommation minimum', prix: 10000 },
  { ordre: 40, section: 'Piscine — accès externe (restaurant)', categorie: 'piscine', nom: 'Droit piscine via consommation — enfant', description: 'Consommation minimum', prix: 5000 },
]

// Infrastructures du restaurant et du bar (fiche « Restaurant & Bar »)
export const INFRASTRUCTURES_RESTAURANT = [
  'Grande piscine commune',
  'Terrasse à manger',
  'Parking 8–10 voitures',
  'Espace événementiel',
  'Bar climatisé 10–15 pers.',
  'Bar short & cocktails',
  'Toilettes H/F',
]

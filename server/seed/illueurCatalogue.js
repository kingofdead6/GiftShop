/**
 * First-boot seed for the illueur catalogue, generated from
 * client/src/illueur/data/catalogue.js. Used only when the database has no
 * collections and no pieces yet; after that the admin is the source of truth.
 */

export const seedCollections = [
  {
    "slug": "vases",
    "nom": "Vases & pots",
    "accroche": "Du papier froissé, un citron, un cactus. En PLA.",
    "tone": "#E9DFC9",
    "dark": false,
    "nouveau": false,
    "hero": "vase-sac-kraft",
    "ordre": 0
  },
  {
    "slug": "lampes",
    "nom": "Lampes",
    "accroche": "La lumière passe à travers chaque couche.",
    "tone": "#1C1A17",
    "dark": true,
    "nouveau": false,
    "hero": "lampe-vague",
    "ordre": 1
  },
  {
    "slug": "encens",
    "nom": "Porte-encens",
    "accroche": "Samurai, Meow, Alien, Moai. La nouvelle collection.",
    "tone": "#D9E4D0",
    "dark": false,
    "nouveau": true,
    "hero": "encens-moai",
    "ordre": 2
  },
  {
    "slug": "porte-lunettes",
    "nom": "Porte-lunettes",
    "accroche": "Des têtes low-poly qui gardent vos lunettes de soleil.",
    "tone": "#F1C9B5",
    "dark": false,
    "nouveau": false,
    "hero": "porte-lunettes-gorille",
    "ordre": 3
  },
  {
    "slug": "statement",
    "nom": "Pièces statement",
    "accroche": "Bustes grecs, Atlas porte-étagère, et un nœud pour vos bijoux.",
    "tone": "#DCD8E8",
    "dark": false,
    "nouveau": false,
    "hero": "buste-grec",
    "ordre": 4
  }
];

export const seedPieces = [
  {
    "slug": "vase-sac-kraft",
    "nom": "Vase Sac Kraft",
    "collection": "vases",
    "prix": 3200,
    "couleurs": [
      {
        "nom": "Kraft",
        "hex": "#C49A6C"
      },
      {
        "nom": "Blanc os",
        "hex": "#EEE8DC"
      },
      {
        "nom": "Noir mat",
        "hex": "#2B2A28"
      }
    ],
    "art": {
      "kind": "layers",
      "shape": "kraft"
    },
    "bg": "#EFE4D2",
    "resume": "Un sac en papier froissé, figé en plastique végétal. Pour les fleurs séchées ou les pinceaux.",
    "specs": {
      "hauteur": "22 cm",
      "impression": "7 h 40",
      "couche": "0,2 mm",
      "poids": "210 g"
    },
    "featured": true,
    "dark": false,
    "ordre": 0
  },
  {
    "slug": "vase-citron",
    "nom": "Vase Citron",
    "collection": "vases",
    "prix": 2800,
    "couleurs": [
      {
        "nom": "Citron",
        "hex": "#F2C230"
      },
      {
        "nom": "Vert cactus",
        "hex": "#4E8F4A"
      },
      {
        "nom": "Blanc os",
        "hex": "#EEE8DC"
      }
    ],
    "art": {
      "kind": "layers",
      "shape": "citron"
    },
    "bg": "#FBF0C9",
    "resume": "La peau d'un citron, pores compris, à l'échelle d'un vase. Une seule tige suffit.",
    "specs": {
      "hauteur": "16 cm",
      "impression": "5 h 10",
      "couche": "0,16 mm",
      "poids": "140 g"
    },
    "featured": true,
    "dark": false,
    "ordre": 1
  },
  {
    "slug": "pot-cactus",
    "nom": "Pot Cactus",
    "collection": "vases",
    "prix": 2400,
    "couleurs": [
      {
        "nom": "Vert cactus",
        "hex": "#4E8F4A"
      },
      {
        "nom": "Terracotta",
        "hex": "#C8653F"
      },
      {
        "nom": "Blanc os",
        "hex": "#EEE8DC"
      }
    ],
    "art": {
      "kind": "layers",
      "shape": "cactus"
    },
    "bg": "#DCEAD5",
    "resume": "Huit côtes, un sommet arrondi. Le pot a la forme de ce que vous devriez y planter.",
    "specs": {
      "hauteur": "14 cm",
      "impression": "4 h 25",
      "couche": "0,2 mm",
      "poids": "160 g"
    },
    "featured": false,
    "dark": false,
    "ordre": 2
  },
  {
    "slug": "vase-sculpte",
    "nom": "Vase Sculpté",
    "collection": "vases",
    "prix": 3600,
    "couleurs": [
      {
        "nom": "Forêt",
        "hex": "#2F6B4F"
      },
      {
        "nom": "Sauge",
        "hex": "#7FA38A"
      },
      {
        "nom": "Noir mat",
        "hex": "#2B2A28"
      }
    ],
    "art": {
      "kind": "layers",
      "shape": "sculpte"
    },
    "bg": "#D3E2D6",
    "resume": "Cinq lobes qui tournent en montant. Il change de profil à chaque pas autour de la table.",
    "specs": {
      "hauteur": "26 cm",
      "impression": "9 h 05",
      "couche": "0,2 mm",
      "poids": "260 g"
    },
    "featured": true,
    "dark": false,
    "ordre": 3
  },
  {
    "slug": "lampe-vague",
    "nom": "Lampe Vague",
    "collection": "lampes",
    "prix": 5900,
    "couleurs": [
      {
        "nom": "Lait",
        "hex": "#F4E7D3"
      },
      {
        "nom": "Ambre",
        "hex": "#F08A3C"
      },
      {
        "nom": "Rose poudré",
        "hex": "#E7A7A2"
      }
    ],
    "art": {
      "kind": "layers",
      "shape": "vague",
      "glow": true
    },
    "bg": "#221F1B",
    "dark": true,
    "resume": "Des ondulations fines comme une lithophanie. Éteinte, une sculpture. Allumée, une marée.",
    "specs": {
      "hauteur": "24 cm",
      "impression": "11 h 30",
      "couche": "0,12 mm",
      "ampoule": "LED E14 incluse"
    },
    "featured": true,
    "ordre": 4
  },
  {
    "slug": "lampe-flamme",
    "nom": "Lampe Flamme",
    "collection": "lampes",
    "prix": 5400,
    "couleurs": [
      {
        "nom": "Ambre",
        "hex": "#F08A3C"
      },
      {
        "nom": "Lait",
        "hex": "#F4E7D3"
      },
      {
        "nom": "Rouge laque",
        "hex": "#B3261E"
      }
    ],
    "art": {
      "kind": "layers",
      "shape": "flamme",
      "glow": true
    },
    "bg": "#1B1815",
    "dark": true,
    "resume": "Une flamme torsadée qui ne s’éteint pas. Parfaite sur une table de chevet.",
    "specs": {
      "hauteur": "28 cm",
      "impression": "12 h 10",
      "couche": "0,16 mm",
      "ampoule": "LED E14 incluse"
    },
    "featured": false,
    "ordre": 5
  },
  {
    "slug": "encens-samurai",
    "nom": "Samurai",
    "collection": "encens",
    "prix": 2600,
    "couleurs": [
      {
        "nom": "Rouge laque",
        "hex": "#B3261E"
      },
      {
        "nom": "Noir mat",
        "hex": "#2B2A28"
      },
      {
        "nom": "Blanc os",
        "hex": "#EEE8DC"
      }
    ],
    "art": {
      "kind": "figure",
      "figure": "samurai"
    },
    "bg": "#F3D9D2",
    "resume": "Casque kabuto, croissant doré. Le bâton d’encens se plante derrière lui, la fumée fait le reste.",
    "specs": {
      "hauteur": "11 cm",
      "impression": "3 h 50",
      "couche": "0,12 mm",
      "poids": "90 g"
    },
    "featured": true,
    "dark": false,
    "ordre": 6
  },
  {
    "slug": "encens-meow",
    "nom": "Meow",
    "collection": "encens",
    "prix": 2200,
    "couleurs": [
      {
        "nom": "Noir mat",
        "hex": "#2B2A28"
      },
      {
        "nom": "Blanc os",
        "hex": "#EEE8DC"
      },
      {
        "nom": "Ambre",
        "hex": "#F08A3C"
      }
    ],
    "art": {
      "kind": "figure",
      "figure": "meow"
    },
    "bg": "#E7E2F3",
    "resume": "Un chat assis, l’air de rien, pendant que votre salon sent le musc.",
    "specs": {
      "hauteur": "10 cm",
      "impression": "3 h 05",
      "couche": "0,12 mm",
      "poids": "75 g"
    },
    "featured": false,
    "dark": false,
    "ordre": 7
  },
  {
    "slug": "encens-alien",
    "nom": "Alien",
    "collection": "encens",
    "prix": 2200,
    "couleurs": [
      {
        "nom": "Vert alien",
        "hex": "#8DC26F"
      },
      {
        "nom": "Graphite",
        "hex": "#4A4A4A"
      },
      {
        "nom": "Lilas",
        "hex": "#A99BD4"
      }
    ],
    "art": {
      "kind": "figure",
      "figure": "alien"
    },
    "bg": "#DDEFD3",
    "resume": "Il a fait des années-lumière pour brûler votre encens. Soyez gentils.",
    "specs": {
      "hauteur": "10 cm",
      "impression": "2 h 55",
      "couche": "0,12 mm",
      "poids": "70 g"
    },
    "featured": false,
    "dark": false,
    "ordre": 8
  },
  {
    "slug": "encens-moai",
    "nom": "Moai",
    "collection": "encens",
    "prix": 2400,
    "couleurs": [
      {
        "nom": "Graphite",
        "hex": "#4A4A4A"
      },
      {
        "nom": "Terracotta",
        "hex": "#C8653F"
      },
      {
        "nom": "Blanc os",
        "hex": "#EEE8DC"
      }
    ],
    "art": {
      "kind": "figure",
      "figure": "moai"
    },
    "bg": "#E4E1DA",
    "resume": "Une tête de l’île de Pâques, regard au loin. La fumée sort de son crâne.",
    "specs": {
      "hauteur": "12 cm",
      "impression": "3 h 30",
      "couche": "0,16 mm",
      "poids": "95 g"
    },
    "featured": true,
    "dark": false,
    "ordre": 9
  },
  {
    "slug": "porte-lunettes-gorille",
    "nom": "Gorille",
    "collection": "porte-lunettes",
    "prix": 3400,
    "couleurs": [
      {
        "nom": "Graphite",
        "hex": "#4A4A4A"
      },
      {
        "nom": "Blanc os",
        "hex": "#EEE8DC"
      },
      {
        "nom": "Or",
        "hex": "#C9A34E"
      }
    ],
    "art": {
      "kind": "figure",
      "figure": "gorille"
    },
    "bg": "#F1C9B5",
    "resume": "Une tête low-poly qui porte vos lunettes de soleil mieux que vous.",
    "specs": {
      "hauteur": "17 cm",
      "impression": "6 h 20",
      "couche": "0,2 mm",
      "poids": "180 g"
    },
    "featured": true,
    "dark": false,
    "ordre": 10
  },
  {
    "slug": "porte-lunettes-ours",
    "nom": "Ours",
    "collection": "porte-lunettes",
    "prix": 3400,
    "couleurs": [
      {
        "nom": "Kraft",
        "hex": "#C49A6C"
      },
      {
        "nom": "Noir mat",
        "hex": "#2B2A28"
      },
      {
        "nom": "Blanc os",
        "hex": "#EEE8DC"
      }
    ],
    "art": {
      "kind": "figure",
      "figure": "ours"
    },
    "bg": "#EADBC4",
    "resume": "Rond, calme, et toujours prêt pour la plage.",
    "specs": {
      "hauteur": "16 cm",
      "impression": "6 h 00",
      "couche": "0,2 mm",
      "poids": "170 g"
    },
    "featured": false,
    "dark": false,
    "ordre": 11
  },
  {
    "slug": "porte-lunettes-rhino",
    "nom": "Rhino",
    "collection": "porte-lunettes",
    "prix": 3600,
    "couleurs": [
      {
        "nom": "Marbre",
        "hex": "#E6E1D8"
      },
      {
        "nom": "Graphite",
        "hex": "#4A4A4A"
      },
      {
        "nom": "Sauge",
        "hex": "#7FA38A"
      }
    ],
    "art": {
      "kind": "figure",
      "figure": "rhino"
    },
    "bg": "#D8E0E6",
    "resume": "La corne retient les lunettes. Il ne fallait pas plus d’excuse.",
    "specs": {
      "hauteur": "18 cm",
      "impression": "6 h 45",
      "couche": "0,2 mm",
      "poids": "190 g"
    },
    "featured": false,
    "dark": false,
    "ordre": 12
  },
  {
    "slug": "buste-grec",
    "nom": "Buste Grec",
    "collection": "statement",
    "prix": 4800,
    "couleurs": [
      {
        "nom": "Marbre",
        "hex": "#E6E1D8"
      },
      {
        "nom": "Noir mat",
        "hex": "#2B2A28"
      },
      {
        "nom": "Or",
        "hex": "#C9A34E"
      }
    ],
    "art": {
      "kind": "figure",
      "figure": "buste"
    },
    "bg": "#DCD8E8",
    "resume": "Apollon en low-poly, sur son socle. L’Antiquité, imprimée cette semaine.",
    "specs": {
      "hauteur": "25 cm",
      "impression": "10 h 15",
      "couche": "0,16 mm",
      "poids": "320 g"
    },
    "featured": true,
    "dark": false,
    "ordre": 13
  },
  {
    "slug": "etagere-atlas",
    "nom": "Étagère Atlas",
    "collection": "statement",
    "prix": 6500,
    "couleurs": [
      {
        "nom": "Marbre",
        "hex": "#E6E1D8"
      },
      {
        "nom": "Noir mat",
        "hex": "#2B2A28"
      },
      {
        "nom": "Terracotta",
        "hex": "#C8653F"
      }
    ],
    "art": {
      "kind": "figure",
      "figure": "atlas"
    },
    "bg": "#E8E2D6",
    "resume": "Le titan porte une étagère murale au lieu du ciel. Vis et chevilles fournies.",
    "specs": {
      "largeur": "32 cm",
      "impression": "14 h 40",
      "couche": "0,2 mm",
      "charge": "3 kg max"
    },
    "featured": false,
    "dark": false,
    "ordre": 14
  },
  {
    "slug": "vide-poche-noeud",
    "nom": "Vide-poche Nœud",
    "collection": "statement",
    "prix": 1900,
    "couleurs": [
      {
        "nom": "Rose poudré",
        "hex": "#E7A7A2"
      },
      {
        "nom": "Blanc os",
        "hex": "#EEE8DC"
      },
      {
        "nom": "Lilas",
        "hex": "#A99BD4"
      }
    ],
    "art": {
      "kind": "figure",
      "figure": "noeud"
    },
    "bg": "#F6DCDA",
    "resume": "Un nœud de ruban qui garde vos bagues et vos boucles d’oreilles.",
    "specs": {
      "largeur": "14 cm",
      "impression": "2 h 20",
      "couche": "0,16 mm",
      "poids": "60 g"
    },
    "featured": false,
    "dark": false,
    "ordre": 15
  }
];

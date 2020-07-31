
"use strict";

const skillsDefinition = [
    {
        "name": "Acrobaties",
        "ability": "dex",
        "classes": [
            "Barde",
            "Moine",
            "Roublard"
        ],
        "flags": [
            "armor_penality"
        ],
        "synergies": [
            {
                "skill": "Saut"
            }
        ]
    },
    {
        "name": "Art de la magie",
        "ability": "int",
        "classes": [
            "Barde",
            "Druide",
            "Ensorceleur",
            "Magicien",
            "Prêtre"
        ],
        "flags": [
            "learned"
        ],
        "synergies": [
            {
                "skill": "Utilisation d'objets magiques",
                "condition": "pour déchiffrer des sorts sur un parchemin"
            },
            {
                "skill": "Connaissances (mystères)"
            }
        ]
    },
    {
        "name": "Bluff",
        "ability": "cha",
        "classes": [
            "Roublard",
            "Ensorceleur",
            "Roublard"
        ],
        "flags": []
    },
    {
        "name": "Concentration",
        "ability": "con",
        "classes": [
            "Barde",
            "Druide",
            "Ensorceleur",
            "Magicien",
            "Moine",
            "Paladin",
            "Rôdeur"
        ],
        "flags": []
    },
    {
        "name": "Connaissances (architecture et ingénierie)",
        "ability": "int",
        "classes": [
            "Barde",
            "Magicien"
        ],
        "flags": [
            "learned"
        ],
        "synergies": []
    },
    {
        "name": "Connaissances (exploration souterraine)",
        "ability": "int",
        "classes": [
            "Barde",
            "Magicien",
            "Rôdeur"
        ],
        "flags": [
            "learned"
        ],
        "synergies": []
    },
    {
        "name": "Connaissances (folklore local)",
        "ability": "int",
        "classes": [
            "Barde",
            "Magicien",
            "Roublard"
        ],
        "flags": [
            "learned"
        ],
        "synergies": []
    },
    {
        "name": "Connaissances (géographie)",
        "ability": "int",
        "classes": [
            "Barde",
            "Magicien",
            "Rôdeur",
            "Roublard"
        ],
        "flags": [
            "learned"
        ],
        "synergies": []
    },
    {
        "name": "Connaissances (histoire)",
        "ability": "int",
        "classes": [
            "Barde",
            "Magicien",
            "Rôdeur",
            "Roublard"
        ],
        "flags": [
            "learned"
        ],
        "synergies": []
    },
    {
        "name": "Connaissances (mystères)",
        "ability": "int",
        "classes": [
            "Barde",
            "Ensorceleur",
            "Moine",
            "Prêtre"
        ],
        "flags": [
            "learned"
        ],
        "synergies": []
    },
    {
        "name": "Connaissances (nature)",
        "ability": "int",
        "classes": [
            "Barde",
            "Druide",
            "Magicien",
            "Rôdeur"
        ],
        "flags": [
            "learned"
        ],
        "synergies": [
            {
                "skill": "Survie"
            }
        ]
    },
    {
        "name": "Connaissances (noblesse)",
        "ability": "int",
        "classes": [
            "Barde",
            "Magicien",
            "Paladin"
        ],
        "flags": [
            "learned"
        ],
        "synergies": []
    },
    {
        "name": "Connaissances (plans)",
        "ability": "int",
        "classes": [
            "Barde",
            "Magicien",
            "Prêtre"
        ],
        "flags": [
            "learned"
        ],
        "synergies": []
    },
    {
        "name": "Connaissances (religion)",
        "ability": "int",
        "classes": [
            "Barde",
            "Magicien",
            "Prêtre"
        ],
        "flags": [
            "learned"
        ],
        "synergies": []
    },
    {
        "name": "Contrefaçon",
        "ability": "int",
        "classes": [
            "Roublard"
        ],
        "flags": []
    },
    {
        "name": "Crochetage",
        "ability": "dex",
        "classes": [
            "Roublard"
        ],
        "flags": [
            "learned"
        ]
    },
    {
        "name": "Décryptage",
        "ability": "int",
        "classes": [
            "Barde",
            "Magicien",
            "Roublard"
        ],
        "flags": [
            "learned"
        ]
    },
    {
        "name": "Déguisement",
        "ability": "cha",
        "classes": [
            "Barde",
            "Roublard"
        ],
        "flags": [],
        "synergies": [
            {
                "skill": "Bluff",
                "condition": "pour tenir un rôle"
            }
        ]
    },
    {
        "name": "Déplacement silencieux",
        "ability": "dex",
        "classes": [
            "Barde",
            "Moine",
            "Rôdeur",
            "Roublard"
        ],
        "flags": [
            "armor_penality"
        ]
    },
    {
        "name": "Désamorçage",
        "ability": "int",
        "classes": [
            "Roublard"
        ],
        "flags": [
            "learned"
        ]
    },
    {
        "name": "Détection",
        "ability": "sag",
        "classes": [
            "Druide",
            "Moine",
            "Rôdeur",
            "Roublard"
        ],
        "flags": []
    },
    {
        "name": "Diplomatie",
        "ability": "cha",
        "classes": [
            "Barde",
            "Druide",
            "Moine",
            "Paladin",
            "Prêtre",
            "Roublard"
        ],
        "flags": [],
        "synergies": [
            {
                "skill": "Bluff"
            },
            {
                "skill": "Psychologie"
            },
            {
                "skill": "Connaissances (noblesse)"
            }
        ]
    },
    {
        "name": "Discrétion",
        "ability": "dex",
        "classes": [
            "Barde",
            "Moine",
            "Rôdeur",
            "Roublard"
        ],
        "flags": [
            "armor_penality"
        ]
    },
    {
        "name": "Dressage",
        "ability": "cha",
        "classes": [
            "Barbare",
            "Druide",
            "Guerrier",
            "Paladin",
            "Rôdeur"
        ],
        "flags": [
            "learned"
        ]
    },
    {
        "name": "Equilibre",
        "ability": "dex",
        "classes": [
            "Barde",
            "Moine",
            "Roublard"
        ],
        "flags": [
            "armor_penality"
        ],
        "synergies": [
            {
                "skill": "Acrobaties"
            }
        ]
    },
    {
        "name": "Equitation",
        "ability": "dex",
        "classes": [
            "Barbare",
            "Druide",
            "Guerrier",
            "Paladin",
            "Rôdeur"
        ],
        "flags": [],
        "synergies": [
            {
                "skill": "Dessage"
            }
        ]
    },
    {
        "name": "Escalade",
        "ability": "for",
        "classes": [
            "Barbare",
            "Barde",
            "Guerrier",
            "Rôdeur",
            "Roublard"
        ],
        "flags": [
            "armor_penality"
        ],
        "synergies": [
            {
                "skill": "Maîtrise des cordes",
                "condition": "pour grimper à une corde"
            }
        ]
    },
    {
        "name": "Escamotage",
        "ability": "dex",
        "classes": [
            "Barde",
            "Roublard"
        ],
        "flags": [
            "armor_penality",
            "learned"
        ],
        "synergies": [
            {
                "skill": "Bluff"
            }
        ]
    },
    {
        "name": "Estimation",
        "ability": "int",
        "classes": [
            "Barde",
            "Roublard"
        ],
        "flags": []
    },
    {
        "name": "Evasion",
        "ability": "dex",
        "classes": [
            "Rôdeur",
            "Roublard"
        ],
        "flags": [
            "armor_penality"
        ],
        "synergies": [
            {
                "skill": "Evasion",
                "condition": "pour se libérer de cordes"
            }
        ]
    },
    {
        "name": "Fouille",
        "ability": "int",
        "classes": [
            "Barbare",
            "Guerrier",
            "Roublard"
        ],
        "flags": [
            {
                "skill": "Connaissances (architecture et ingénierie)",
                "condition": "pour trouver des passages ou compartiments secret"
            }
        ]
    },
    {
        "name": "Intimidation",
        "ability": "cha",
        "classes": [
            "Barbare",
            "Guerrier",
            "Roublard"
        ],
        "flags": [],
        "synergies": [
            {
                "skill": "Bluff"
            }
        ]
    },
    {
        "name": "Maîtrise des cordes",
        "ability": "dex",
        "classes": [
            "Rôdeur",
            "Roublard"
        ],
        "flags": [],
        "synergies": [
            {
                "skill": "Evasion",
                "condition": "pour ligoter quelqu'un"
            }
        ]
    },
    {
        "name": "Natation",
        "ability": "for",
        "classes": [
            "Barbare",
            "Barde",
            "Druide",
            "Moine",
            "Rôdeur",
            "Roublard"
        ],
        "flags": [
            "armor_penality"
        ]
    },
    {
        "name": "Perception auditive",
        "ability": "sag",
        "classes": [
            "Barbare",
            "Barde",
            "Druide",
            "Moine",
            "Rôdeur",
            "Roublard"
        ],
        "flags": []
    },
    {
        "name": "Premiers secours",
        "ability": "sag",
        "classes": [
            "Druide",
            "Paladin",
            "Prêtre",
            "Moine",
            "Rôdeur"
        ],
        "flags": []
    },
    {
        "name": "Psychologie",
        "ability": "sag",
        "classes": [
            "Barde",
            "Moine",
            "Paladin",
            "Roublard"
        ],
        "flags": []
    },
    {
        "name": "Renseignement",
        "ability": "cha",
        "classes": [
            "Barde",
            "Roublard"
        ],
        "flags": [],
        "synergies": [
            {
                "skill": "Connaissances (folklore local)"
            }
        ]
    },
    {
        "name": "Représentation",
        "ability": "cha",
        "classes": [
            "Barde",
            "Moine",
            "Roublard"
        ],
        "flags": []
    },
    {
        "name": "Saut",
        "ability": "for",
        "classes": [
            "Barbare",
            "Barde",
            "Guerrier",
            "Moine",
            "Rôdeur",
            "Roublard"
        ],
        "flags": [
            "armor_penality"
        ],
        "synergies": [
            {
                "skill": "Acrobaties"
            }
        ]
    },
    {
        "name": "Survie",
        "ability": "sag",
        "classes": [
            "Barbare",
            "Druide",
            "Rôdeur"
        ],
        "flags": [],
        "synergies": [
            {
                "skill": "Fouille",
                "condition": "pour suivre une piste"
            },
            {
                "skill": "Connaissances (exploration souterraine)",
                "condition": "sous terre"
            },
            {
                "skill": "Connaissances (géographie)",
                "condition": "pour éviter de se perdre ou pour éviter des dangers"
            },
            {
                "skill": "Connaissances (nature)",
                "condition": "dans un environement naturel à la surface"
            },
            {
                "skill": "Connaissances (plans)",
                "condition": "sur d'autres plan d'existence"
            }
        ]
    },
    {
        "name": "Utilisation d'objets magiques",
        "ability": "cha",
        "classes": [
            "Roublard"
        ],
        "flags": [
            "learned"
        ],
        "synergies": [
            {
                "skill": "Art de la magie",
                "condition": "lors de l'utilisation du parchemin"
            },
            {
                "skill": "Décryptage",
                "condition": "lors de l'utilisation du parchemin"
            }
        ]
    }
]

skillsDefinition.forEach(Object.freeze);
const skillsNames = skillsDefinition.map(skill => skill.name);
// console.log(skills_names);

console.log("skills - ok");

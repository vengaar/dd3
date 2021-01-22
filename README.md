# dd3

Feuilles de personnage pour dd 3.5 générée via un format json

[Demo](http://olivier.perriot.free.fr/rpg/dd3/personnages/)

## Les `modifiers`

### Liste des `targets`

En plus du nom de chaque compétences, les targets sont

* `vig`
* `ref`
* `vol`
* `hit`
* `damage`
* `ca`
* `init`
* `saves`, racourci pour ajouter un mmeme modifier pour vig, ref et vol
* `speed`, vitesse au sol
* `fly`, vitesse de vol
* `maneuverability`, manoeuvrabilité en vol

### Gestion des types

Seuls les `modifiers` avec un type `cumulatif` s'additionnent.

La liste des type cumulatif est défine dans `Modifier` (model.js)

    >> Modifier.cumulativeTypes

    <- Array(3) [ "esquive", "chance", undefined ]

Par defaut un `modifier` est de type `undefined` et est donc cummulatif.

## Equipements

Voici la structure attendu pour un équipent

| Champ | Format | Défaut | Optionnel | Description |
|:------|:-------|:------:|:---------:|:------------|
| `name` | str | - | oui | Le nom de l'équipent |
| `desc` | str | - | oui | Une description de l'équipement |
| `used` | bolean | true | - | Pour indiqué si l'équipent est équipé, eet donc si les `modifiers` associés doivent s'appliquer. |
| `weight` | integer | 0 | oui | Le poids unitaire de l'équipement en Kg |
| `quantity` | interger | 1 | oui | La quantité de l'équipement. Utilisé comme multiplicateur pour le poids et le prix |
| `price` | interger | 0 | oui | Le prix de l'équipement (pas encore géré) |
| `location` | Enum(`hiking`, `home`, str) | `hiking` | - | Pour indiqué si l'équipement est avec soi (`hiking`) ou au lieu de résidence (`home`). Sert aussi a calculé le poids total porté si la location est `hiking`. |
| `type` | Enum | - | oui | Le type de l'équipement. Voir ci-dessous les valeurs possibles. |
| `charges` | int | - | oui | Le cas échant le nombre de charges restantes de l'objet |
| `abilities` | Array[str] | - | oui | La liste des capacités de l'epuipement |
| `references` | Array[str,url] | - | oui | Les réference pour trouver l'objet. Si il y a des urls parmis les réferences, la première est utlisée comme lien sur le nom de l'équipement. |
| `attacks` | Object | - | oui | Objet complexe pour définir les attaques lié à l'équipement (doc à faire) |
|  |  |  |  |  |

Les valeurs possibles pour `type`

    >> Object.keys(equipmentTypeMapping)

    <- Array(7) [ "weapon", "armor", "clothing", "ring", "misc", "focus", "spell" ]

## Indentité

### Age

Deux options pour gérer l'âge de votre personnage.

Vous pouvez simplement mettre

    "age": 42,

Ou vous pouvez spécifier les années

    "year_birth": 366,
    "year_current": 377,

la défintion via les années prend précédence sur age

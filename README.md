# dd3

Feuilles de personnage pour dd 3.5 générée via un format json

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

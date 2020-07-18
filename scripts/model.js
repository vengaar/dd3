
class Modifier {

    constructor(source, value, type = "") {
        this.source = source
        this.value = value
        this.type = type
    }

}

const filterModifiersByConditions = (modifiers, has_condition) => {
    return modifiers.filter(modfier => ("condition" in modfier) === has_condition)
}

const getSumModifiers = modifiers => {
    return modifiers.reduce((acc, item) => acc += item.value, 0);
}

class Ability {

    constructor(name, base) {
        this.name = name
        this.base = base
        this.modifiers = []
    }

    get modifiers_total() {
        let total = 0
        this.modifiers.forEach(modifier => {
            total += modifier.value
        });
        return total
    }

    get total() {
        return this.base + this.modifiers_total
    }

    get bonus() {
        return Math.floor((this.total - 10) / 2)
    }

}

class Character {

    constructor(data) {

        console.log("*** Create new character ***")
        // Clone original data before assign for updates
        const _data = JSON.parse(JSON.stringify(data));
        Object.assign(this, _data)

        /**
         * Build modifiers
         */
        this.modifiers = []
        // Equipments modifiers
        this.equipments.forEach(equipment => {
            if ("modifiers" in equipment) {
                if (equipment.used) {
                    equipment.modifiers.forEach(modifier => {
                        modifier.source = equipment.name
                        this.modifiers.push(modifier)
                    });
                }
            }
        });
        // Race modifiers
        if ("modifiers" in this.race) {
            this.race.modifiers.forEach(modifier => {
                (modifier.source === undefined) ? modifier.source = `[${this.race.name}]` : modifier.source = modifier.source + ` [${this.race.name}]`;
                if (modifier.type === undefined) modifier.type = "[racial]";
                this.modifiers.push(modifier);
            });
        }

        /**
         * Abilities
         */
        this.abilities = {}
        for (let key in data.abilities) {
            this.abilities[key] = new Ability(key, data.abilities[key])
        }

        this.modifiers.forEach(modifier => {
            if (modifier.category == "ability") {
                this.abilities[modifier.target].modifiers.push(modifier)
            }
        });

        /**
         * Level + BA
         */
        this.level = 0
        this.ba = 0
        this.classes.forEach(current_class => {
            this.level += current_class.level
            this.ba += current_class.ba
        });
        if ("level_ajustement" in this.race) {
            this.level += this.race.level_ajustement
        }

        /**
         * AC
         */
        this.ca_modifiers = [
            new Modifier("base", 10, ""),
            new Modifier("dex", this.__get_ability_bonus("dex"), "[ability]")
        ]
        this.modifiers.forEach(modifier => {
            if (modifier.category == "ca") {
                this.ca_modifiers.push(modifier)
            }
        });

        /**
         * SAVES
         */
        this.saves = {
            "vig": [],
            "ref": [],
            "vol": [],
            "conditions": []
        }
        // classes
        this.classes.forEach(current_class => {
            this.saves.vig.push(new Modifier(current_class.name, current_class.saves.vig, "[class]"))
            this.saves.ref.push(new Modifier(current_class.name, current_class.saves.ref, "[class]"))
            this.saves.vol.push(new Modifier(current_class.name, current_class.saves.vol, "[class]"))
        });
        // abilities
        this.saves.vig.push(new Modifier("con", this.__get_ability_bonus("con"), "[ability]"))
        this.saves.ref.push(new Modifier("dex", this.__get_ability_bonus("dex"), "[ability]"))
        this.saves.vol.push(new Modifier("sag", this.__get_ability_bonus("sag"), "[ability]"))
        // others
        this.modifiers.forEach(modifier => {
            if (modifier.category == "saves") {
                // console.log(modifier)
                if ("condition" in modifier) {
                    this.saves.conditions.push(modifier)
                } else {
                    if ("target" in modifier) {
                        this.saves[modifier.target].push(modifier)
                    } else {
                        this.saves.vig.push(modifier)
                        this.saves.ref.push(modifier)
                        this.saves.vol.push(modifier)
                    }
                }
            }
        });

        this.attacks = this.__computeAttacks()
    }

    __computeAttacks() {

        let attacks = []

        // Global hit modifiers
        const global_hit_modifiers = [
            new Modifier("base", 10),
            new Modifier("ba", this.ba),
        ]
        this.modifiers.forEach(modifier => {
            if (modifier.category == "hit") global_hit_modifiers.push(modifier)
        });

        this.attacks.forEach(attack => {
            const attack_hit_modifiers = [
                new Modifier(attack.hit.ability, this.__get_ability_bonus(attack.hit.ability), attack.hit.ability, "[ability]"),
            ]
            attack.hit.modifiers.forEach(modifier => {
                if (modifier.source === undefined) modifier.source = "Arme";
                attack_hit_modifiers.push(modifier)
            });
            const hit_modifiers = global_hit_modifiers.concat(attack_hit_modifiers)
            // console.log(hit_modifiers)
            const hit = hit_modifiers.reduce((prev, cur) => prev + cur.value, 0)

            // Damage
            let damage_modifiers = []
            if ("ability" in attack.damage) {
                const modifier = new Modifier(attack.damage.ability, this.__get_ability_bonus(attack.damage.ability), "[ability]")
                damage_modifiers.push(modifier)
            }

            attack.damage.modifiers.forEach(modifier => {
                if (modifier.source === undefined) modifier.source = "Arme"
                damage_modifiers.push(modifier)
            });
            const damage = damage_modifiers.reduce((prev, cur) => prev + cur.value, 0)

            const computed_attack = {
                "name": attack.name,
                "hit_modifiers": hit_modifiers,
                "damage": attack.damage.base,
                "damage_modifiers": damage_modifiers,
                "crit": attack.crit,
                "specials": attack.specials
            }
            attacks.push(computed_attack)
        });
        return attacks
    }

    __get_ability_bonus(ability_name) {
        return this.abilities[ability_name].bonus
    }

    computeSkills = (skills) => {

        let computed_skills = {}
        skills.forEach(skill => {
            // console.log(skill);
            const rank = skill.name in this.skills ? this.skills[skill.name] : 0
            // console.log(`rank=${rank}`)

            let ability_bonus, enable;
            if (skill.flags.includes("learned") && rank === 0) {
                ability_bonus = 0
                enable = false
            } else {
                ability_bonus = this.__get_ability_bonus(skill.ability)
                enable = true
            }
            // console.log(`ability_bonus=${ability_bonus}`)

            const modifiers = [
                new Modifier("rank", rank, ""),
                new Modifier(skill.ability, ability_bonus, "[ability]"),
            ]

            let skill_class = false
            for (let _class of this.classes.values()) {
                // console.log(_class);
                if (skill.classes.includes(_class.name)) {
                    // console.log(`${skill.name} is class skill`)
                    skill_class = true;
                    break;
                }
            };
            // console.log("skill_class =", skill_class)

            let comments = []
            // Synergies
            if ("synergies" in skill) {
                skill.synergies.forEach(synergy => {
                    // console.log(synergy);
                    if (synergy.skill in this.skills) {
                        if (this.skills[synergy.skill] >= 5) {
                            // console.log(`Synergy possible for ${skill.name}`)
                            if ("condition" in synergy) {
                                comments.push(`+2 ${synergy.condition} (${synergy.skill})`)
                            } else {
                                // console.log(`Synergy applied for ${skill.name}`)
                                modifiers.push(new Modifier(synergy.skill, 2, "[synergie]"))
                                // comments.push(`Synergie ${synergy.skill} appliquée`)
                            }
                        } else {
                            const synergy_condition = ("condition" in synergy) ? `(${synergy.condition})` : ""
                            comments.push(`Synergie ${synergy.skill}${synergy_condition} non applicable`)
                        }
                    } else {
                        const synergy_condition = ("condition" in synergy) ? ` (${synergy.condition})` : ""
                        comments.push(`Synergie ${synergy.skill}${synergy_condition} non applicable`)
                    }
                });
            }
            const character_skill = {
                "name": skill.name,
                "rank": rank,
                "enable": enable,
                "class": skill_class,
                "flags": skill.flags,
                "modifiers": modifiers,
                "comments": comments,
            }
            computed_skills[skill.name] = character_skill
        });

        // Add character bonus
        this.modifiers.forEach(modifier => {
            // console.log(modifier)
            if (modifier.category == "skill") {
                computed_skills[modifier.target].total += modifier.value
                if (computed_skills[modifier.target].enable) {
                    computed_skills[modifier.target].modifiers.push(modifier)
                } else {
                    const comment = `${modifier.source} modificateur (${modifier.value}/${modifier.type}) appliqué`
                    computed_skills[modifier.target].comments.push(comment)
                }
            }
        });
        return Object.values(computed_skills)
    }

}

console.log("model - ok");

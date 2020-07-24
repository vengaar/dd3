
"use strict";

const search = (query, data) => {
    const keys = query.split(".");
    const key = keys.shift();
    const value = data[key]
    // console.log("search", key, value, keys)
    if (keys.length == 0) {
        return value
    } else {
        return search(keys.join("."), value)
    }
}

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

const filterModifiers = (modifiers, filters) => {
    const _modifiers = []
    modifiers.forEach(modifier => {
        let filters_match = false
        for (let criteria in filters) {
            if (modifier[criteria] == filters[criteria]) {
                filters_match = true
            } else {
                filters_match = false
                break
            }
        }
        if (filters_match) {
            _modifiers.push(modifier)
        }
    });
    return _modifiers
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

    constructor(data, skills_definition) {
        console.log("*** Create new character ***")
        // Clone original data to not update it
        const _data = JSON.parse(JSON.stringify(data));
        Object.assign(this, _data);
        this.skills_definition = skills_definition;
        this.compute();
    }

    compute = (modifiers = []) => {

        /**
         * Build powers
         */
        this.computedPowers = [].concat(this.powers)

        // from race
        this.race.powers.forEach(power => {
            power.source = this.race.name
            this.computedPowers.push(power)
        });

        // from classes
        this.level = 0
        this.ba_modifiers = []
        this.classes.forEach(current_class => {
            this.level += current_class.level
            this.ba += current_class.ba
            this.ba_modifiers.push(new Modifier(current_class.name, current_class.ba, "[class]"))
            current_class.powers.forEach(power => {
                power.source = current_class.name
                this.computedPowers.push(power)
            })
        });
        // console.log("computedPowers =", this.computedPowers)

        if ("level_ajustement" in this.race) {
            this.level += this.race.level_ajustement
        }
        this.ba = getSumModifiers(this.ba_modifiers)

        /**
         * Build modifiers
         */
        // console.log("=> modifiers <=")
        this.modifiers = modifiers
        // console.log("this.modifiers =", this.modifiers)

        // Powers modfiers (character/classes/races)
        this.computedPowers.forEach(power => {
            if ("modifiers" in power) {
                power.modifiers.forEach(modifier => {
                    modifier.source = power.name === undefined ? power.source : power.name;
                    this.modifiers.push(modifier);
                });
            }
        });

        // Equipments modifiers
        // console.log(this.equipments)
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
        // console.log("modifiers =", this.modifiers)

        /**
         * Abilities
         */
        this.computedAbilities = {}
        for (let key in this.abilities) {
            this.computedAbilities[key] = new Ability(key, this.abilities[key])
        }

        this.modifiers.forEach(modifier => {
            if (modifier.category == "ability") {
                this.computedAbilities[modifier.target].modifiers.push(modifier)
            }
        });

        /**
         * Init + AC
         */
        this.init = [
            new Modifier("dex", this.__get_ability_bonus("dex"), "[ability]")
        ]
        this.ca_modifiers = [
            new Modifier("base", 10, ""),
            new Modifier("dex", this.__get_ability_bonus("dex"), "[ability]")
        ]

        this.modifiers.forEach(modifier => {
            if (modifier.category == "init") {
                this.init.push(modifier)
            }
            if (modifier.category == "ca") {
                this.ca_modifiers.push(modifier)
            }
        });

        /**
         * SAVES
         */
        // console.log("=> saves <=")
        this.saves = {
            "vig": [],
            "ref": [],
            "vol": [],
            "conditions": []
        }
        // console.log("saves =", this.saves)

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
        // console.log("saves =", this.saves)

        this.computeMovement()
    }

    computeMovement = () => {

        // SIZE
        this.size = this.size || this.race.size
        // console.log("size =>", this.size, this.race.size)

        // SPEED
        this.speed = this.speed || this.race.speed
        // console.log("speed =>", this.speed, this.race.speed)
        const speedModifiers = filterModifiers(this.modifiers, { "target": "speed" })
        // console.log("speed =>", speedModifiers)
        // console.log("speed =>", getSumModifiers(speedModifiers))
        this.speed += getSumModifiers(speedModifiers)
        // console.log("speed =>", this.speed, this.race.speed)

        // FLY
        const flyModifiers = filterModifiers(this.modifiers, { "category": "fly" })
        // console.log("fly =>", flyModifiers)
        if (flyModifiers.length > 0) {
            const flyModifiersSpeed = filterModifiers(flyModifiers, { "target": "speed" })
            // console.log("flyModifiersSpeed =", flyModifiersSpeed)
            const flyModifiersManeuverability = filterModifiers(flyModifiers, { "target": "maneuverability" })
            let flyManeuverability = getSumModifiers(flyModifiersManeuverability)
            if (flyManeuverability < 1) flyManeuverability = 1;
            if (flyManeuverability > 4) flyManeuverability = 5;
            this.fly = {
                "speed": getSumModifiers(flyModifiersSpeed),
                "maneuverability": flyManeuverability
            }
            // console.log("fly =", this.fly)
        }
    }

    get computedAttacks() {

        const attacks = []

        // Global hit modifiers
        const global_hit_modifiers = [
            new Modifier("ba", this.ba),
        ]
        this.modifiers.forEach(modifier => {
            if (modifier.category == "hit") global_hit_modifiers.push(modifier)
        });

        this.attacks.forEach(attack => {
            // console.log("attack = ", attack)
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
                "nb_attack": attack.nb_attack || 1,
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

    get computedSkills() {

        const skills = {}
        this.skills_ranks = 0;
        this.skills_definition.forEach(skill => {
            // console.log(skill);
            const rank = skill.name in this.skills ? this.skills[skill.name] : 0
            // console.log(`rank=${rank}`)
            this.skills_ranks += rank;

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
            skills[skill.name] = {
                "name": skill.name,
                "rank": rank,
                "enable": enable,
                "class": skill_class,
                "flags": skill.flags,
                "modifiers": modifiers,
                "comments": comments,
            }
        });

        // Add character bonus
        this.modifiers.forEach(modifier => {
            // console.log(modifier)
            if (modifier.category == "skill") {
                skills[modifier.target].total += modifier.value
                if (skills[modifier.target].enable) {
                    skills[modifier.target].modifiers.push(modifier)
                } else {
                    const comment = `${modifier.source} modificateur (${modifier.value}/${modifier.type}) appliqué`
                    skills[modifier.target].comments.push(comment)
                }
            }
        });
        return Object.values(skills)
    }

    __get_ability_bonus = (ability_name) => {
        return this.computedAbilities[ability_name].bonus
    }

    restore = () => {
        // console.log("restore")
        Object.assign(this, this.backup)
        this.compute()
    }

    transform = (form) => {
        // console.log("transform =>", form)
        this.backup = JSON.parse(JSON.stringify(this));
        for (let key in form) {
            if (key in this) {
                this[key] = form[key]
            }
        }
        form.modifiers.forEach(modifier => { modifier.source = form.id })
        this.compute(form.modifiers)
        // console.log(this.backup)
    }

}

console.log("model - ok");


"use strict";

const clone = (data) => {
    return JSON.parse(JSON.stringify(data));
}

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

class Power {

    constructor(data) {
        // console.log(data)
        this.name = data.name || ""
        this.desc = data.desc || ""
        this.url = data.url
        this.level = data.level || ""
        this.type = data.type || ""
        this.source = data.source || ""
        this.modifiers = []
        if ("modifiers" in data) {
            data.modifiers.forEach(element => {
                const modifier = Modifier.fromObject(element)
                if (modifier.source === undefined) {
                    if (this.name !== "") {
                        modifier.source = this.name
                    } else {
                        modifier.source = this.source
                    }
                }
                this.modifiers.push(modifier)
            });
        }
        // console.log(this)
    }
}

class Ability {

    static names = ["for", "dex", "con", "sag", "int", "cha"]

    constructor(name, base) {
        this.name = name
        this.base = base
        this.modifiers = []
        this._total
        this._bonus
    }

    get total() {
        if (this._total === undefined) {
            this._total = this.base + getSumModifiers(this.modifiers)
        }
        return this._total
        // return this._total = this.base + getSumModifiers(this.modifiers)
    }

    get bonus() {
        if (this._bonus === undefined) {
            this._bonus = Math.floor((this.total - 10) / 2)
        }
        return this._bonus
        // return Math.floor((this.total - 10) / 2)
    }

}

class Modifier {

    static saves = ["vig", "ref", "vol"]
    static targets = [
        "hit", "damage", "ca", "init", "saves",
        "speed", "fly", "maneuverability"
    ].concat(Ability.names).concat(Modifier.saves)

    static categories = [
        "skill"
    ]

    constructor(source, value, type) {
        this.source = source;
        this.value = value;
        this.type = type || "";
        this.condition;
    }

    static fromObject(object) {
        const modifier = new this(object.source, object.value, object.type);

        if ("category" in object) {
            const category = object.category;
            if (Modifier.categories.includes(category)) {
                this.category = category;
            } else {
                console.warn(`Invalid category ${category} for modifier ${object}`)
                console.log(object)
            }
        }

        if ("target" in object) {
            const target = object.target;
            if (this.category == "skill") {
                modifier.target = target;
            } else {
                if (Modifier.targets.includes(target)) {
                    modifier.target = target;
                } else {
                    console.warn(`Invalid target ${target} for modifier ${object}`);
                    console.log(object)
                }
            }
        } else {
            console.warn(`Invalid modifier, target missing ${object}`);
            console.log(object)
        }

        if (object.condition) modifier.condition = object.condition;
        return modifier
    }

}

const filterModifiersByConditions = (modifiers, has_condition) => {
    return modifiers.filter(modifier => ("condition" in modifier) === has_condition)
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

class Character {

    constructor(data, skills_definition) {
        console.log("*** Create new character ***")
        // Clone original data to not update it
        // const _data = clone(data);
        // Object.assign(this, _data);
        Object.assign(this, data);
        this._abilities = data.abilities;
        Object.freeze(this._abilities)
        this._powers = data.powers;
        Object.freeze(this._powers)
        this._skills = data.skills;
        Object.freeze(this._skills)
        this.skills_definition = skills_definition;
        this.current_form = this.race.name
        this.compute();
    }

    compute = (modifiers = []) => {

        /**
         * Build powers
         */
        this.powers = this._powers.map(object => new Power(object))

        // from race
        this.race.powers.forEach(_power => {
            _power.source = this.race.name
            const power = new Power(_power)
            this.powers.push(power)
        });

        // from classes
        this.level = 0
        this.ba_modifiers = []
        this.classes.forEach(current_class => {
            this.level += current_class.level
            this.ba += current_class.ba
            this.ba_modifiers.push(new Modifier(current_class.name, current_class.ba, "base"))
            current_class.powers.forEach(_power => {
                _power.source = current_class.name
                const power = new Power(_power)
                this.powers.push(power)
            })
        });
        // console.log("powers =", this.powers)

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
        this.powers.forEach(power => {
            if ("modifiers" in power) {
                power.modifiers.forEach(modifier => {
                    this.modifiers.push(modifier);
                });
            }
        });

        // Equipments modifiers
        // console.log(this.equipments)
        this.equipments.forEach(equipment => {
            if ("modifiers" in equipment) {
                if (equipment.used === undefined) equipment.used = true;
                equipment.modifiers.forEach(_modifier => {
                    _modifier.source = equipment.name;
                    const modifier = Modifier.fromObject(_modifier)
                    if (equipment.used) {
                        this.modifiers.push(modifier);
                    }
                });
            }
        });
        // console.log("modifiers =", this.modifiers)

        /**
         * Abilities
         */
        this.abilities = {}
        for (let key in this._abilities) {
            this.abilities[key] = new Ability(key, this._abilities[key])
        }
        this.modifiers.forEach(modifier => {
            if (Ability.names.includes(modifier.target)) {
                this.abilities[modifier.target].modifiers.push(modifier)
            }
        });
        // console.log("abilities =", this.abilities)

        /**
         * Init + AC
         */
        this.init = [
            new Modifier("dex", this.__getAbilityBonus("dex"), "ability")
        ]
        this.ca_modifiers = [
            new Modifier("base", 10),
            new Modifier("dex", this.__getAbilityBonus("dex"), "ability")
        ]

        let best_armure
        this.modifiers.forEach(modifier => {
            if (modifier.target == "init") {
                this.init.push(modifier)
            }
            if (modifier.target == "ca") {
                if (modifier.type == "armure") {
                    if (best_armure === undefined) {
                        best_armure = modifier
                    } else {
                        if (modifier.value > best_armure.value) best_armure = modifier;
                    }
                } else {
                    this.ca_modifiers.push(modifier)
                }
            }
        });
        if (best_armure !== undefined) {
            this.ca_modifiers.push(best_armure)
        }
        // console.log("ca_modifiers =", this.ca_modifiers)

        this.saves = this.__computeSaves()
        this.attacks = this.__computeAttacks()
        this.skills = this.__computeSkills()
        this.__computeMovement()
    }

    __computeSaves = () => {

        // console.log("=> saves <=")
        saves = {
            "vig": [],
            "ref": [],
            "vol": [],
            "conditions": []
        }
        // console.log("saves =", saves)

        // classes
        this.classes.forEach(current_class => {
            saves.vig.push(new Modifier(current_class.name, current_class.saves.vig, "base"))
            saves.ref.push(new Modifier(current_class.name, current_class.saves.ref, "base"))
            saves.vol.push(new Modifier(current_class.name, current_class.saves.vol, "base"))
        });
        // abilities
        saves.vig.push(new Modifier("con", this.__getAbilityBonus("con"), "ability"))
        saves.ref.push(new Modifier("dex", this.__getAbilityBonus("dex"), "ability"))
        saves.vol.push(new Modifier("sag", this.__getAbilityBonus("sag"), "ability"))
        // others

        this.modifiers.forEach(modifier => {
            if (modifier.target == "saves") {
                if ("condition" in modifier) {
                    saves.conditions.push(modifier)
                } else {
                    saves.vig.push(modifier)
                    saves.ref.push(modifier)
                    saves.vol.push(modifier)
                }
            } else if (Modifier.saves.includes(modifier.target)) {
                if ("condition" in modifier) {
                    saves.conditions.push(modifier)
                } else {
                    saves[modifier.target].push(modifier)
                }
            }
        });
        console.log("saves =", saves)
        return saves
    }

    __computeMovement = () => {

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
        const flyModifiersSpeed = filterModifiers(this.modifiers, { "target": "fly" })
        console.log("flyModifiersSpeed =>", flyModifiersSpeed)
        if (flyModifiersSpeed.length > 0) {
            const flyModifiersManeuverability = filterModifiers(this.modifiers, { "target": "maneuverability" })
            let flyManeuverability = getSumModifiers(flyModifiersManeuverability)
            if (flyManeuverability < 1) flyManeuverability = 1;
            if (flyManeuverability > 4) flyManeuverability = 5;
            this.fly = {
                "speed": getSumModifiers(flyModifiersSpeed),
                "maneuverability": flyManeuverability
            }
            console.log("fly =", this.fly)
        }
    }

    __computeAttacks = () => {

        attacks = []

        // Global hit modifiers
        const global_hit_modifiers = [
            new Modifier("ba", this.ba)
        ]
        this.modifiers.forEach(modifier => {
            if (modifier.target == "hit") global_hit_modifiers.push(modifier)
        });

        this.equipments.forEach(equipment => {
            if ("attack" in equipment) {
                const attack = equipment.attack
                Object.freeze(attack)
                const attacks_modifiers = {
                    "hit": clone(global_hit_modifiers),
                    "damage": []
                }
                attacks_modifiers["hit"].push(new Modifier(attack.hit.ability, this.__getAbilityBonus(attack.hit.ability), "ability"))
                if ("ability" in attack.damage) {
                    const damage_ability = this.__getAbilityBonus(attack.damage.ability)
                    const damage_multiplier = attack.damage.multiplier || 1;
                    const damage = Math.floor(damage_ability * damage_multiplier)
                    const modifier = new Modifier(attack.damage.ability, damage, "ability")
                    attacks_modifiers["damage"].push(modifier)
                }

                // Weapon modifiers
                if ("modifiers" in equipment) {
                    equipment.modifiers.forEach(modifier => {
                        if (modifier.target == "hit") {
                            attacks_modifiers["hit"].push(modifier);
                        } else if (modifier.target == "damage") {
                            attacks_modifiers["damage"].push(modifier);
                        }
                    });
                }

                const computed_attack = {
                    "name": equipment.name,
                    "mode": "base",
                    "nb_attack": attack.nb_attack || 1,
                    "modifiers": attacks_modifiers,
                    "damage": attack.damage.base,
                    "crit": attack.crit,
                    "specials": equipment.specials || []
                }
                attacks.push(computed_attack)
                // console.log("computed_attack =", computed_attack)

                // Modes
                if ("modes" in attack) {
                    attack.modes.forEach(mode => {
                        // console.log(mode)
                        const attack_mode = clone(computed_attack)
                        mode.modifiers.forEach(modifier => {
                            // console.log(modifier)
                            attack_mode.modifiers[modifier.target].push(modifier)
                        })
                        attack_mode.mode = mode.name
                        attacks.push(attack_mode)
                    });
                }
            }
        });
        return attacks
    }

    __computeSkills = () => {

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
                ability_bonus = this.__getAbilityBonus(skill.ability)
                enable = true
            }
            // console.log(`ability_bonus=${ability_bonus}`)

            const modifiers = [
                new Modifier("rank", rank),
                new Modifier(skill.ability, ability_bonus, "ability"),
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
                                modifiers.push(new Modifier(synergy.skill, 2, "synergie"))
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

    __getAbilityBonus = (ability_name) => {
        return this.abilities[ability_name].bonus
    }

    restore = () => {
        // console.log("restore")
        Object.assign(this, this.backup)
        this.compute()
    }

    transform = (form) => {
        // console.log("transform =>", form)
        // console.log("transform =>", this.current_form, form.id)
        if (form.id !== this.current_form) {
            this.backup = JSON.parse(JSON.stringify(this));
            for (let key in form) {
                if (key in this) {
                    this[key] = form[key]
                }
            }
            form.modifiers.forEach(modifier => { modifier.source = form.id })
            this.current_form = form.id
            this.compute(form.modifiers)
            // console.log(this.backup)
        } else {
            // console.log(`Already in ${form.id}`)
        }
    }

}

console.log("model - ok");

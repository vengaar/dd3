
"use strict";

const clone = (data) => {
    return JSON.parse(JSON.stringify(data));
}

// const search = (query, data) => {
//     const keys = query.split(".");
//     const key = keys.shift();
//     const value = data[key]
//     // console.log("search", key, value, keys)
//     if (keys.length == 0) {
//         return value
//     } else {
//         return search(keys.join("."), value)
//     }
// }

const getSizeModifiers = size => {
    if (size in sizes) {
        const size_base = sizes[size]["base"]
        if (size_base === 0) {
            return []
        } else {
            const source = `Taille ${size}`
            const type = "taille"
            return [
                Modifier.fromObject({ "source": source, "type": type, "target": "hit", "value": size_base }),
                Modifier.fromObject({ "source": source, "type": type, "target": "ca", "value": size_base }),
                Modifier.fromObject({ "source": source, "type": type, "target": "grapple", "value": sizes[size]["grapple"] }),
            ]
        }
    } else {
        console.warn(`Invalid size ${size}, size must be one of ${Object.keys(sizes)}`);
        return []
    }
}

class Equipment {

    static locations = ["hiking", "home"]

    constructor(data) {
        this.name = data.name;
        this.desc = data.desc || "";
        this.used = (data.used === undefined) ? true : data.used;
        this.weight = data.weight || 0;
        this.quantity = data.quantity || 1;
        this.price = data.price || 0;
        this.location = data.location || "hiking";
        this.price = data.price || 0;
        this.charges = data.charges;
        this.references = data.references;
        this.attack = data.attack;
        this.modifiers = []
        if ("modifiers" in data) {
            data.modifiers.forEach(element => {
                const modifier = Modifier.fromObject(element)
                modifier.source = this.name
                this.modifiers.push(modifier)
            });
        }
    }
}

class Power {

    constructor(data) {
        // console.log(data)
        this.name = data.name || ""
        this.desc = data.desc || ""
        this.references = data.references
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

    static saves = ["vig", "ref", "vol"];
    static targets = [
        "hit", "grapple", "damage", "ca", "init", "saves", "nls", "spellAbilityBonus",
        "speed", "fly", "maneuverability", "skills"
    ].concat(Ability.names).concat(Modifier.saves).concat(skillsNames);
    static cumulativeTypes = ["esquive", "chance", undefined]

    constructor(source, value, type) {
        this.target = undefined;
        this.value = value;
        this.source = source;
        this.type = type;
        this.condition;
    }

    static fromObject(object) {
        const modifier = new this(object.source, object.value, object.type);
        if ("target" in object) {
            const target = object.target;
            if (Modifier.targets.includes(target)) {
                modifier.target = target;
            } else {
                console.warn(`Invalid target ${target} for modifier ${object}`);
                console.log(object)
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

const getSumModifiers = modifiers => {
    return modifiers.reduce((acc, item) => acc += item.value, 0);
}

class Character {

    constructor(data) {
        console.log(`*** Create new character - ${data.name} ***`)
        Object.assign(this, data);
        this.currentForm = this.name
        this.equipments = data.equipments.map(equipment => new Equipment(equipment))
        this.compute();
    }

    compute = (modifiers = []) => {

        /**
         * Build powers
         */
        this.powers = this.powersOwn.map(object => new Power(object))

        // from race
        this.race.powers.forEach(_power => {
            _power.source = this.race.name
            const power = new Power(_power)
            this.powers.push(power)
        });

        // from classes
        this.level = 0
        this.nls = []
        this.ba_modifiers = []
        this.classes.forEach(current_class => {
            this.level += current_class.level
            this.ba += current_class.ba
            if ("nls" in current_class) {
                this.nls.push(new Modifier(current_class.name, current_class.nls, "base"))
            }
            this.ba_modifiers.push(new Modifier(current_class.name, current_class.ba, "base"))
            current_class.powers.forEach(_power => {
                _power.source = current_class.name
                const power = new Power(_power)
                this.powers.push(power)
            })
        });
        // console.log("powers =", this.powers)
        this.ecl = this.level
        if ("level_ajustement" in this.race) {
            this.ecl += this.race.level_ajustement
        }
        this.ba = getSumModifiers(this.ba_modifiers)

        /**
         * Size
         */
        this.size = this.size || this.race.size
        // console.log("size =>", this.size, this.race.size)

        /**
         * Build modifiers
         */

        this.modifiersIndex = {}
        modifiers.forEach(modifier => { this.__addModifier(modifier) });
        getSizeModifiers(this.size).forEach(modifier => { this.__addModifier(modifier) });

        // Powers modfiers (character/classes/races)
        this.powers.forEach(power => {
            power.modifiers.forEach(modifier => {
                this.__addModifier(modifier)
            });
        });

        // Equipments modifiers
        this.equipments.forEach(equipment => {
            if (equipment.used) {
                equipment.modifiers.forEach(modifier => {
                    this.__addModifier(modifier);
                });
            }

        });
        // console.log("modifiersIndex =", this.modifiersIndex)

        this.abilities = this.__computeAbilities()

        /**
         * Hit points
         */
        this.hitPointsCon = this.level * this.__getAbilityBonus("con")
        this.hitPoints = this.hitPointsBasis + this.hitPointsCon

        /**
         * Init
         */
        this.init = [
            new Modifier("dex", this.__getAbilityBonus("dex"), "ability")
        ].concat(this.__getModifiers("init"))
        // console.log("init =", this.init)

        this.__computeCa()
        this.saves = this.__computeSaves()
        this.attacks = this.__computeAttacks()
        this.skills = this.__computeSkills()
        this.__computeMovement()
        this.__computeSpells()
    }

    __computeSpells = () => {
        // console.log(this.spellAbility)
        // console.log(this.spellsByLevel)
        if ("spellAbility" in this) {
            const spells = []
            const spellAbilityBonusModifiers = this.__getModifiers("spellAbilityBonus")
            const spellAbilityBonus = this.__getAbilityBonus(this.spellAbility) + getSumModifiers(spellAbilityBonusModifiers)
            for (let level in this.spellsByLevel) {
                // console.log(level);
                // console.log(this.spellsByLevel[level]);
                // console.log(this.__getBonusSpell(level))
                const intLevel = parseInt(level)
                spells.push(
                    {
                        "nbSpells": this.spellsByLevel[level] + this.__getBonusSpell(intLevel, spellAbilityBonus),
                        "savingThrow": 10 + intLevel + this.__getAbilityBonus(this.spellAbility)
                    }
                )
            }
            this.spells = spells
            // console.log("this.spells = ", this.spells)
        }
    }

    __getBonusSpell = (spellLevel, abilityBonus) => {
        if (spellLevel == 0) {
            return abilityBonus
        } else if (abilityBonus >= spellLevel) {
            return Math.floor((abilityBonus - spellLevel) / 4) + 1
        } else {
            return 0
        }
    }

    __computeAbilities = () => {
        const abilities = {}
        Ability.names.forEach(ability => {
            if (ability in this.abilitiesBasis) {
                abilities[ability] = new Ability(ability, this.abilitiesBasis[ability])
                abilities[ability].modifiers = this.__getModifiers(ability)
            } else {
                console.warn(`Missing ${ability} in character data`)
            }
        })
        // console.log("abilities =", abilities)
        return abilities
    }

    __computeCa = () => {
        const ca_modifiers = [
            new Modifier("base", 10),
            new Modifier("dex", this.__getAbilityBonus("dex"), "ability")
        ].concat(this.__getModifiers("ca"))
        this.caModifiers = ca_modifiers
        this.caModifiersConditional = this.__getModifiers("ca", true)
    }

    __computeSaves = () => {

        // console.log("=> saves <=")
        saves = {
            "vig": [],
            "ref": [],
            "vol": [],
            "conditions": this.__getModifiers("saves", true)
        }

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

        // Create vig, ref, vom from saves
        this.__getModifiers("saves").forEach(modifier => {
            Modifier.saves.forEach(save => {
                saves[save].push(modifier)
            })
        });

        Modifier.saves.forEach(save => {
            this.__getModifiers(save, true).forEach(modifier => {
                saves.conditions.push(modifier)
            })
            this.__getModifiers(save).forEach(modifier => {
                saves[save].push(modifier)
            })
        });
        // console.log("saves =", saves)
        return saves
    }

    __computeMovement = () => {

        // SPEED
        this.speedModifiers = [
            new Modifier(this.race.name, this.race.speed)
        ].concat(this.__getModifiers("speed"))

        // FLY
        const flyModifiersSpeed = this.__getModifiers("fly")
        if (flyModifiersSpeed.length > 0) {
            const flyModifiersManeuverability = this.__getModifiers("maneuverability")
            let flyManeuverability = getSumModifiers(flyModifiersManeuverability)
            if (flyManeuverability < 1) flyManeuverability = 1;
            if (flyManeuverability > 4) flyManeuverability = 5;
            this.fly = {
                "speedModifiers": flyModifiersSpeed,
                "maneuverability": flyManeuverability,
                "maneuverabilityModifiers": flyModifiersManeuverability
            }
            // console.log("fly =", this.fly)
        }
    }

    __computeAttacks = () => {

        // Global hit modifiers
        const global_hit_modifiers = [
            new Modifier("ba", this.ba)
        ].concat(this.__getModifiers("hit"))

        // grappel
        const grappleAbility = this.grappleAbility || "for"
        const grapple_modifiers = {
            "hit": [
                new Modifier("ba", this.ba),
                new Modifier(grappleAbility, this.__getAbilityBonus(grappleAbility), "ability"),
            ].concat(this.__getModifiers("grapple")),
            "damage": []
        }
        const grapple = {
            "name": "Lutte",
            "mode": "base",
            "nbAttack": 1,
            "modifiers": grapple_modifiers,
            "damage": "-",
            "crit": "-",
            "specials": [
                "Attaque générée automatiquement"
            ]
        }

        const attacks = [
            grapple
        ]

        this.equipments.forEach(equipment => {
            if (equipment.attack) {
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
                    const damage = (damage_ability >= 0) ? Math.floor(damage_ability * damage_multiplier) : damage_ability
                    const modifier = new Modifier(attack.damage.ability, damage, "ability")
                    attacks_modifiers["damage"].push(modifier)
                }
                if ("modifiers" in attack) {
                    attack.modifiers.forEach(_modifier => {
                        if (_modifier.source === undefined) _modifier.source = equipment.name;
                        const modifier = Modifier.fromObject(_modifier);
                        attacks_modifiers[modifier.target].push(modifier);
                    });
                }

                const computed_attack = {
                    "name": equipment.name,
                    "mode": "base",
                    "nbAttack": attack.nbAttack,
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
        this.totalRanks = 0;
        skillsDefinition.forEach(skill => {
            // console.log(skill);
            const rank = skill.name in this.skillsRanks ? this.skillsRanks[skill.name] : 0
            // console.log(`rank=${rank}`)
            this.totalRanks += rank;

            let enable
            if (skill.flags.includes("learned") && rank === 0) {
                enable = false
            } else {
                enable = true
            }
            // console.log(`ability_bonus=${ability_bonus}`)

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

            let conditions = this.__getModifiers(skill.name, true)
            let comments = []
            let modifiers = []
            if (enable) {
                modifiers = [
                    new Modifier("rank", rank),
                    new Modifier(skill.ability, this.__getAbilityBonus(skill.ability), "ability"),
                ].concat(this.__getModifiers(skill.name))
                this.__getModifiers("skills").forEach(modifier => {
                    modifiers.push(modifier)
                })
            }

            // Synergies
            if ("synergies" in skill) {
                skill.synergies.forEach(synergy => {
                    // console.log(synergy);
                    if (synergy.skill in this.skillsRanks) {
                        if (this.skillsRanks[synergy.skill] >= 5) {
                            // console.log(`Synergy possible for ${skill.name}`)
                            if ("condition" in synergy) {
                                const modifier = new Modifier(synergy.skill, 2, "synergie")
                                modifier.condition = synergy.condition
                                conditions.push(modifier)
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
                "conditions": conditions,
                "comments": comments,
            }
        });
        // console.log("skills = ", skills)
        return Object.values(skills)
    }

    __getAbilityBonus = (ability_name) => {
        return this.abilities[ability_name].bonus
    }

    __getModifiers = (target, conditional = false) => {
        if (target in this.modifiersIndex) {
            if (conditional) {
                return this.modifiersIndex[target].conditional
            } else {
                const exclusiveModifiers = Object.values(this.modifiersIndex[target].always.type)
                const cumulativeModifiers = this.modifiersIndex[target].always.modifiers
                return cumulativeModifiers.concat(exclusiveModifiers)
            }
        } else {
            return []
        }
    }

    __addModifier = modifier => {
        if (this.modifiersIndex[modifier.target] === undefined) {
            this.modifiersIndex[modifier.target] = {
                "conditional": [],
                "always": {
                    "modifiers": [],
                    "type": {}
                }
            }
        }
        if ("condition" in modifier) {
            this.modifiersIndex[modifier.target].conditional.push(modifier)
        } else {
            const always = this.modifiersIndex[modifier.target].always
            if (Modifier.cumulativeTypes.includes(modifier.type)) {
                always.modifiers.push(modifier)
            } else {
                // Add only max modifier for none cummulative type
                if (modifier.type in always.type) {
                    if (always.type[modifier.type].value < modifier.value) {
                        always.type[modifier.type] = modifier
                    }
                } else {
                    always.type[modifier.type] = modifier
                }
            }
        }
    }

    restore = () => {
        // console.log("restore")
        Object.assign(this, this.backup)
        this.compute()
    }

    transform = (form) => {
        // console.log("transform =>", form)
        // console.log("transform =>", this.currentForm, form.id)
        if (form.id !== this.currentForm) {
            this.backup = JSON.parse(JSON.stringify(this));
            for (let key in form) {
                if (key in this) {
                    this[key] = form[key]
                }
            }
            form.modifiers.forEach(modifier => { modifier.source = form.id })
            this.currentForm = form.id
            this.compute(form.modifiers)
            // console.log(this.backup)
        } else {
            // console.log(`Already in ${ form.id } `)
        }
    }

}

console.log("model - ok");


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
        Object.assign(this, data)
        this.abilities = {}
        for (let key in data.abilities) {
            this.abilities[key] = new Ability(key, data.abilities[key])
        }

        this.modifiers.forEach(modifier => {
            if (modifier.category == "ability") {
                this.abilities[modifier.target].modifiers.push(modifier)
            }
        });

        this.level = 0
        this.ba = 0
        this.save_vig = 0
        this.save_ref = 0
        this.save_vol = 0
        this.classes.forEach(current_class => {
            this.level += current_class.level
            this.ba += current_class.ba
            this.save_vig += current_class.saves.vig
            this.save_ref += current_class.saves.ref
            this.save_vol += current_class.saves.vol
        });
        if ("level_ajustement" in this.race) {
            this.level += this.race.level_ajustement
        }
        this.save_vig += this.get_ability_bonus("con")
        this.save_ref += this.get_ability_bonus("dex")
        this.save_vol += this.get_ability_bonus("sag")

        this.ca = 10 + this.get_ability_bonus("dex")
        this.modifiers.forEach(modifier => {
            if (modifier.category == "ca") {
                this.ca += modifier.value
            }
        });
    }

    get_attacks() {

        let attacks = []

        // Global hit modifiers
        const global_hit_modifiers = [
            {
                "source": "Base",
                "type": "",
                "value": 10,
            },
            {
                "source": "BA",
                "type": "",
                "value": this.ba,
            }
        ]
        this.modifiers.forEach(modifier => {
            if (modifier.category == "hit") {
                global_hit_modifiers.push(modifier)
            }
        });

        this.attacks.forEach(attack => {
            const attack_hit_modifiers = [
                {
                    "source": "Ability",
                    "type": "",
                    "value": this.get_ability_bonus(attack.hit.ability),
                }
            ]
            attack.hit.modifiers.forEach(modifier => {
                modifier["source"] = attack.name
                attack_hit_modifiers.push(modifier)
            });
            const hit_modifiers = global_hit_modifiers.concat(attack_hit_modifiers)
            console.log(hit_modifiers)
            const hit = hit_modifiers.reduce((prev, cur) => prev + cur.value, 0)

            // Damage
            let damage_modifiers = [
                {
                    "source": "Ability",
                    "type": "",
                    "value": this.get_ability_bonus(attack.damage.ability),
                }
            ]
            attack.damage.modifiers.forEach(modifier => {
                modifier["source"] = attack.name
                damage_modifiers.push(modifier)
            });
            const damage = damage_modifiers.reduce((prev, cur) => prev + cur.value, 0)

            const computed_attack = {
                "name": attack.name,
                "hit": formatHit(hit, this.ba),
                "hit_modifiers": hit_modifiers,
                "damage": `${attack.damage.base}${formatBonus(damage)}`,
                "damage_modifiers": damage_modifiers,
                "crit": attack.crit,
                "specials": attack.specials
            }
            attacks.push(computed_attack)
        });
        return attacks
    }

    get_ability_bonus(ability_name) {
        return this.abilities[ability_name].bonus
    }

}

const formatHit = (hit, ba) => {
    const formatted_hit = []
    nb_attacks = Math.ceil(ba / 5)
    // console.log(nb_attacks)
    for (let i = 1; i <= nb_attacks; i++) {
        formatted_hit.push(hit)
        hit = hit - 5
    }
    // console.log(formatted_hit)
    return formatted_hit.join("/")
}

const formatBonus = (bonus) => {
    if (bonus > 0) {
        return "+" + bonus;
    } else if (bonus === 0) {
        return ""
    } else {
        return bonus
    }
}

const compute_skills = (skills, character) => {
    let computed_skills = {}
    skills.forEach(skill => {
        // console.log(skill);

        if (skill.name in character.skills) {
            rank = character.skills[skill.name]
        } else {
            rank = 0
        }
        // console.log(`rank=${rank}`)

        let ability_bonus, skill_state;
        if (skill.flags.includes("learned") && rank === 0) {
            ability_bonus = 0
            skill_state = "disabled"
        } else {
            ability_bonus = character.get_ability_bonus(skill.ability)
            skill_state = ""
        }
        // console.log(`ability_bonus=${ability_bonus}`)

        let skill_player_class = false
        for (let player_class of character.classes.values()) {
            // console.log(player_class);
            if (skill.classes.includes(player_class.name)) {
                // console.log(`${skill.name} is class skill`)
                skill_player_class = true;
                break;
            }
        };
        // console.log("skill_class =", skill_class)

        let comments = []
        let bonus = 0
        // Synergies
        if ("synergies" in skill) {
            skill.synergies.forEach(synergy => {
                // console.log(synergy);
                if (synergy.skill in character.skills) {
                    if (character.skills[synergy.skill] >= 5) {
                        // console.log("Synergy found")
                        if ("condition" in synergy) {
                            comments.push(`+2 ${synergy.condition} (${synergy.skill})`)
                        } else {
                            comments.push(`Synergie ${synergy.skill} appliquée`)
                            bonus += 2
                        }
                    } else {
                        const synergy_condition = (condition in synergy) ? `(${synergy.condition})` : ""
                        comments.push(`Synergie ${synergy.skill}${synergy_condition} non applicable`)
                    }
                } else {
                    const synergy_condition = ("condition" in synergy) ? ` (${synergy.condition})` : ""
                    comments.push(`Synergie ${synergy.skill}${synergy_condition} non applicable`)
                }
            });
        }
        const total = rank + ability_bonus + bonus;
        const computed_skill = {
            "name": skill.name,
            "rank": rank,
            "total": total,
            "state": skill_state,
            "comments": comments,
            "flags": skill.flags,
            "class": skill_player_class
        }
        computed_skills[skill.name] = computed_skill
    });

    // Add character bonus
    character.modifiers.forEach(modifier => {
        // console.log(modifier)
        if (modifier.category == "skill") {
            computed_skills[modifier.target].total += modifier.value
            comment = `${modifier.source} modificateur (${modifier.value}/${modifier.type}) appliqué`
            computed_skills[modifier.target].comments.push(comment)
        }
    });

    return Object.values(computed_skills)

}

console.log("model - ok");

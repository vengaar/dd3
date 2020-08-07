
"use strict";

/**
 * Mapping
 */

const maneuverabilities = {
    1: "Déplorable",
    2: "Médiocre",
    3: "Moyenne",
    4: "Bonne",
    5: "Parfaite"
}
Object.freeze(maneuverabilities)

const color = "teal"

/**
 * Format methods
 */

const formatObjectValue = (obj, property) => {
    let value_formatted = ""
    if (property in obj) {
        const value = obj[property]
        value_formatted = (obj.url === undefined) ? value : `<a href=${obj.url}>${value}</a>`
    }
    return value_formatted
}

const formatHit = (hit, ba) => {
    const formatted_hit = []
    const nb_attacks = Math.ceil(ba / 5)
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
        return `+${bonus}`;
    } else if (bonus === 0) {
        return ""
    } else {
        return bonus
    }
}

const formatDetails = modifiers => {
    // CAUTION -> popup data -> no ""
    // console.log(modifiers)
    const details = ["<table class='ui very basic celled center aligned table'><tbody>"]
    modifiers.forEach(modifier => {
        const detail = `<tr><td class='capitalize'>${modifier.source}</td><td>${modifier.value}</td><td>${modifier.type}</td>`
        details.push(detail)
    });
    details.push("</tbody></table>")
    // console.log(details)
    return details.join("")
}

const formatConditions = modifiers => {
    // console.log(modifiers)
    const conditions = []
    modifiers.forEach(modifier => {
        if ("condition" in modifier) {
            const condition = `
                <tr>
                    <td class="collapsing"><span class="ui ${color} circular label">${formatBonus(modifier.value)}</span></td>
                    <td class="collapsing center aligned">${modifier.target}</span></td>
                    <td>${modifier.condition}</td>
                </tr>`
            conditions.push(condition)
        }
    });
    return conditions.join("")
}
const formatSkillConditions = modifiers => {
    const modfiers = []
    modifiers.forEach(modifier => {
        const item = `
            <div class="ui segment">
                <div class="ui ${color} circular label"><span class="lowercase">${formatBonus(modifier.value)}</span></div>
                ${modifier.condition}
                (${modifier.source})
                [${modifier.type}]
            </div>`
        modfiers.push(item)
    });
    return modfiers.join("")
}

const formatModifers = modifiers => {
    const modfiers = []
    modifiers.forEach(modifier => {
        const item = `
            <div class="ui segment">
                <div class="ui ${color} circular label"><span class="lowercase">${formatBonus(modifier.value)}</span></div>
                ${modifier.target}
                <span class="lowercase">[${modifier.type}]</span>
            </div>`
        modfiers.push(item)
    });
    return modfiers.join("")
}

/**
 * ALL DISPLAY METHODS
 */

const displayIdentity = character => {
    const attributes = ["name", "ecl", "alignment", "size", "speed", "height", "weight", "age", "ba", "gold"]
    attributes.forEach(attribute => {
        // console.log(attribute)
        $(`.dd3-id-${attribute}`).text(character[attribute])
    });
    $(`.dd3-id-hitPoints`).text(`${character.hitPoints} (${character.hitPointsBasis} + ${character.hitPointsCon})`)

    // Name
    $(".dd3-id-name").html(`<a href="${character.$name}">${character.name}</a>`);

    // Race
    $(".dd3-id-race-name").html(`<a href="${character.$race}">${character.race.name}</a>`);

    // Classes
    const classes = character.classes.map(current_class => {
        return `${current_class.name} ${current_class.level}`
    })
    $('.dd3-id-classes').text(classes.join(" / "));

    // Image
    $(".dd3-id-image").attr("src", character.image);

    // Gender
    const $gender = $(".dd3-id-gender")
    const genders = ["neuter", "mars", "venus"]
    genders.forEach(gender => { $gender.removeClass(gender) })
    $gender.addClass(character.gender);

    // Fly
    if ("fly" in character) {
        $(`.dd3-id-fly-speed`).text(character.fly.speed)
        // console.log(maneuverabilities)
        // console.log(character.fly)
        const maneuverability_name = maneuverabilities[character.fly.maneuverability]
        // console.log(maneuverability_name)
        $(`.dd3-id-fly-maneuverability`).text(maneuverability_name)
        $(`.dd3-id-fly`).fadeIn()
    } else {
        $(`.dd3-id-fly`).fadeOut()
    }

    const $character_forms = $('.dd3-id-forms')
    // console.log($character_forms)
    if ("forms" in character) {
        const values = [{ "name": character.race.name, "value": -1 }]
        for (let index in character.forms) {
            values.push({ "name": character.forms[index].id, "value": index });
        }
        // console.log(values)
        $character_forms.dropdown({
            "values": values,
            onChange: function (value, text, $selectedItem) {
                // console.log("Select form =>", value, text)
                // console.log("current_form =", character.current_form)
                $dimmer.dimmer('show');
                if (text == character.race.name) {
                    character.restore()
                    displayCharacter(character)
                } else {
                    const form = character.forms[value]
                    character.restore()
                    character.transform(form)
                    displayCharacter(character)
                }
                $dimmer.dimmer('hide');
            }
        });
        $character_forms.show()
    } else {
        $character_forms.hide()
    }
}

const displayAbilities = character => {
    const lines = []
    Object.values(character.abilities).forEach(ability => {
        // console.log(ability);
        let ability_css = ""
        if (ability.total > ability.base) {
            ability_css = "green"
        } else if (ability.total < ability.base) {
            ability_css = "red"
        }
        const line = `
            <tr>
                <td class="capitalize">${ability.name}</td>
                <td><b>${ability.base}</b></td>
                <td class="${ability_css}"><b>${ability.total}</b></td>
                <td><span class="ui ${color} circular label">${formatBonus(ability.bonus)}</span></td>
            </tr>`;
        lines.push(line)
    });
    $('.dd3-abilities > tbody').empty().append(lines);;
}

const displayCounters = character => {
    const init = getSumModifiers(character.init)
    $(".dd3-counters-init").text(`${formatBonus(init)}`)
    $(".dd3-counters-init-details").attr("data-html", formatDetails(character.init))
    $(".dd3-counters-ba").text(`${character.ba}`)
    $(".dd3-counters-ba-details").attr("data-html", formatDetails(character.ba_modifiers))
    const ca_modifiers = filterModifiersByConditions(character.ca_modifiers, false)
    $(".dd3-counters-ca").text(`${getSumModifiers(ca_modifiers)}`)
    $(".dd3-counters-ca-details").attr("data-html", formatDetails(ca_modifiers))
    const ca_conditions = filterModifiersByConditions(character.ca_modifiers, true)
    $(".dd3-counters-conditions").html(`${formatConditions(ca_conditions)}`)
}

const displaySaves = character => {
    $(".dd3-saves-vig").text(`${getSumModifiers(character.saves.vig)}`)
    $(".dd3-saves-vig-details").attr("data-html", formatDetails(character.saves.vig))
    $(".dd3-saves-ref").text(`${getSumModifiers(character.saves.ref)}`)
    $(".dd3-saves-ref-details").attr("data-html", formatDetails(character.saves.ref))
    $(".dd3-saves-vol").text(`${getSumModifiers(character.saves.vol)}`)
    $(".dd3-saves-vol-details").attr("data-html", formatDetails(character.saves.vol))
    $(".dd3-saves-conditions").html(`${formatConditions(character.saves.conditions)}`)
}

const displaySkills = character => {
    const flags_mappping = {
        "learned": '<i class="graduation cap icon"></i>',
        "armor_penality": '<i class="hiking icon"></i>'
    }
    $("#totalRanks").text(character.totalRanks)
    const lines = []
    character.skills.forEach(skill => {
        const skill_class_css = skill.class ? "left marked green" : ""
        const skill_flags = skill.flags.map(flag => {
            return flags_mappping[flag]
        })
        const comments = (skill.comments.length == 0) ? "" : `<i>${skill.comments.join("<br>")}</i>`
        const line = `
            <tr class="${skill_class_css} ${skill.state}">
                <td>${skill.name} ${skill_flags.join(" ")}</td>
                <td class="center aligned details" data-html="${formatDetails(skill.modifiers)}">
                    <div>${getSumModifiers(skill.modifiers)}</div>
                </td>
                <td>
                    ${formatSkillConditions(skill.conditions)}
                    ${comments}
                </td>
            </tr>`;
        lines.push(line)
    });
    $('#skills > tbody').empty().append(lines);
    $("#skills").tablesort()
}

const displayAttacks = character => {
    const lines = []
    character.attacks.forEach(attack => {
        // console.log(attack);
        const hit_max = getSumModifiers(attack.modifiers.hit)
        const hit = attack.nbAttack === undefined ? formatHit(hit_max, character.ba) : Array(attack.nbAttack).fill(hit_max).join("/")
        const damage_modifier = getSumModifiers(attack.modifiers.damage)
        const damage = `${attack.damage} ${formatBonus(damage_modifier)}`
        const mode = attack.mode == "base" ? "" : `<br>[${attack.mode}]`
        const line = `
            <tr>
                <td>${attack.name}${mode}</td>
                <td class="details" data-html="${formatDetails(attack.modifiers.hit)}">${hit}</td>
                <td class="details" style="white-space: nowrap;" data-html="${formatDetails(attack.modifiers.damage)}">${damage}</td>
                <td style="white-space: nowrap;">${attack.crit}</td>
                <td class="top aligned left aligned">${attack.specials.join("<br>")}</td>
            </tr>`;
        lines.push(line)
    });
    $('#attacks > tbody').empty().append(lines);
}

const displayPowers = character => {
    const lines = []
    character.powers.forEach(power => {
        const line = `
            <tr class="">
                <td>${power.type || "-"}</td>
                <td class="left aligned">
                    <div class="dd3-name">${formatObjectValue(power, "name")}</div>
                    <div class="dd3-desc">${power.desc || ""}</div>
                </td>
                <td>${power.source || "-"}</td>
                <td>${power.level || "-"}</td>
            </tr>`;
        lines.push(line)
    })
    $('#powers > tbody').empty().append(lines);
    $("#powers").tablesort()
}

const displayEquipments = character => {
    const lines = []
    for (let index in character.equipments) {
        const equipment = character.equipments[index]
        // console.log(equipment);
        const equipment_used = (equipment.used === undefined || equipment.used) ? "checked" : ""
        // console.log(equipment_used)
        const location = equipment.location || "hiking";
        let abilities = ""
        if ("abilities" in equipment) {
            abilities = `
                <div class="ui segment ${color}">
                    <i>${equipment.abilities.join("<br>")}</i>
                </div>`
        }
        const line = `
            <tr class="${location}">
                <td class="collapsing center aligned">
                    <div class="ui fitted _slider ${equipment_used} checkbox">
                        <input type="checkbox" name="${index}" tabindex="0" ${equipment_used} class="hidden">
                        <label></label>
                    </div>
                </td>
                <td class="collapsing center aligned" data-sort-value="${location}"><i class="${location} icon"></i></td>
                <td class="top aligned">
                    <div class="dd3-name">${equipment.name}</div>
                    <div class="dd3-desc">${equipment.desc || ""}</div>
                    ${abilities}
                </td>
                </td>
                <td class="top aligned" style="white-space: nowrap;">
                    ${formatModifers(equipment.modifiers || [])}
                </td>
            </tr>`;
        lines.push(line);
    }
    $('#equipments > tbody').empty().append(lines);
    $("#equipments").tablesort()
}

const displayCharacter = character => {
    // console.log(`Display ${character.name}`)
    // console.log(`character =  ${character}`)
    displayIdentity(character)
    displayCounters(character)
    displaySaves(character)
    displayAbilities(character)
    displaySkills(character)
    displayAttacks(character)
    displayPowers(character)
    displayEquipments(character)

    $('.details').popup({
        position: 'right center',
        observeChanges: true
    });

    $('.ui.checkbox').checkbox({
        onChange: function () {
            $dimmer.dimmer('show');
            const equipment = character.equipments[this.name]
            // console.log(equipment)
            equipment.used = this.checked
            character.compute()
            displayCharacter(character)
            $dimmer.dimmer('hide');
        }
    });
}

/**
 * Actions
 */

const $character_choice = $('#character_choice')
$character_choice.dropdown({
    onChange: function (value, text, $selectedItem) {
        // console.log(value)
        $dimmer.dimmer('show');
        const character_data_url = `data/characters/${value}.json`
        fetch(character_data_url, { cache: "reload" })
            .then(response => response.json())
            .then(json => {
                // console.log(`data character loaded`);
                character_data = json
                character_data.$name = character_data_url
                document.title = `DD3 - ${character_data.name}`;
                fetch(character_data.$race, { cache: "reload" })
                    .then(response => response.json())
                    .then(json => {
                        // console.log(`race loaded`);
                        race = json
                        Object.freeze(race)
                        // console.log(race);
                        character_data.race = race
                        Object.freeze(character_data)
                        character = new Character(character_data)
                        displayCharacter(character)
                        $dimmer.dimmer('hide');
                    });
            });
    }
});

/**
* Start page
*/

let character_data
let race
let character

$("#abilities").clone().attr("id", "left-abilities").appendTo("#left");
$("#saves").clone().attr("id", "left-saves").appendTo("#left");
$("#counters").clone().attr("id", "left-counters").appendTo("#left");
$("#card").clone().attr("id", "right-card").appendTo("#right");
$("#location-home").click(() => { $("#equipments > tbody > tr.home").fadeToggle() });
$("#location-self").click(() => { $("#equipments > tbody > tr.hiking").fadeToggle() });

const $dimmer = $("body").dimmer({
    transition: 'fade',
    displayLoader: true,
    loaderVariation: 'inverted',
    loaderText: 'Loading data'
})

const sticky_offset = 65
$('.ui.sticky').sticky({
    offset: sticky_offset,
    context: '#main',
    silent: true,
    observeChanges: true
});

$('.details').popup({
    position: 'right center',
    observeChanges: true
});

// $character_choice.dropdown('set selected', 'seleniel')
// $character_choice.dropdown('set selected', 'ronce')

console.log("main - ok");

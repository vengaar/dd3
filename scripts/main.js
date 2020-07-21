
"use strict";

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
    // console.log(modifiers)
    const details = ["<table class='ui very basic celled center aligned table'><tbody>"]
    modifiers.forEach(modifier => {
        const detail = `<tr><td class='capitalize'>${modifier.source || ""}</td><td>${modifier.value}</td><td>${modifier.type || ""}</td>`
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
            const category = modifier.target === undefined ? modifier.category : "";
            const target = modifier.target || "";
            const condition = `
                <tr>
                    <td class="collapsing"><span class="ui circular label">${formatBonus(modifier.value)}</span></td>
                    <td class="collapsing">${category}${target}</span></td>
                    <td>${modifier.condition}</td>
                </tr>`
            conditions.push(condition)
        }
    });
    return conditions.join("")
}

const formatModifers = modifiers => {
    const modfiers_as_list = []
    modifiers.forEach(modifier => {
        const item = `
            <div class="item">
                <i class="icon"><span class="ui circular label">${formatBonus(modifier.value)}</span></i>
                <div class="content">
                    <span class="capitalize">${modifier.category || ""}</span>
                    <span class="capitalize">${modifier.target || ""}</span>
                    <span class="lowercase">[${modifier.type}]</span>
                </div>
            </div>`
        modfiers_as_list.push(item)
    });
    return modfiers_as_list.join("")
}

/**
 * ALL DISPLAY METHODS
 */

const dispayIdentity = character => {
    const attributes = ["name", "level", "alignment", "race.name", "race.size", "race.speed", "size", "weight", "age", "ba", "hit_points"]
    attributes.forEach(attribute => {
        // console.log(attribute)
        $(`.dd3-id-${attribute.replace(".", "-")}`).text(search(attribute, character))
    });
    const classes = character.classes.map(current_class => {
        return `${current_class.name} ${current_class.level}`
    })
    $('.dd3-id-classes').text(classes.join(" / "));
    $(".dd3-id-image").attr("src", character.image);
    const $gender = $(".dd3-id-gender")
    const genders = ["neuter", "mars", "venus"]
    genders.forEach(gender => { $gender.removeClass(gender) })
    $gender.addClass(character.gender);
}

const dispayAbilities = character => {
    const lines = []
    Object.values(character.abilities).forEach(ability => {
        // console.log(ability);
        const line = `
            <tr>
                <td class="capitalize">${ability.name}</td>
                <td><b>${ability.base}</b></td>
                <td><b>${ability.total}</b></td>
                <td><span class="ui circular label">${ability.bonus}</span></td>
            </tr>`;
        lines.push(line)
    });
    $('.dd3-abilities > tbody').empty().append(lines);;
}

const dispayCounters = character => {
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

const dispaySaves = character => {
    $(".dd3-saves-vig").text(`${getSumModifiers(character.saves.vig)}`)
    $(".dd3-saves-vig-details").attr("data-html", formatDetails(character.saves.vig))
    $(".dd3-saves-ref").text(`${getSumModifiers(character.saves.ref)}`)
    $(".dd3-saves-ref-details").attr("data-html", formatDetails(character.saves.ref))
    $(".dd3-saves-vol").text(`${getSumModifiers(character.saves.vol)}`)
    $(".dd3-saves-vol-details").attr("data-html", formatDetails(character.saves.vol))
    $(".dd3-saves-conditions").html(`${formatConditions(character.saves.conditions)}`)
}

const dispaySkills = character => {
    const flags_mappping = {
        "learned": '<i class="graduation cap icon"></i>',
        "armor_penality": '<i class="hiking icon"></i>'
    }
    // console.log(character.skills_ranks)
    $("#skills_ranks").text(character.skills_ranks)
    const computed_skills = character.computeSkills(skills)
    const lines = []
    computed_skills.forEach(skill => {
        const skill_class_css = skill.class ? "left marked green" : ""
        const skill_flags = skill.flags.map(flag => {
            return flags_mappping[flag]
        })
        const line = `
            <tr class="${skill_class_css} ${skill.state}">
                <td>${skill.name} ${skill_flags.join(" ")}</td>
                <td class="center aligned details" data-html="${formatDetails(skill.modifiers)}">
                    <div>${getSumModifiers(skill.modifiers)}</div>
                </td>
                <td>${skill.comments.join("<br>")}</td>
            </tr>`;
        lines.push(line)
    });
    $('#skills > tbody').empty().append(lines);
    $("#skills").tablesort()
}

const dispayAttacks = character => {
    const lines = []
    character.attacks.forEach(attack => {
        // console.log(attack);
        const hit = getSumModifiers(attack.hit_modifiers)
        const damage_modifier = getSumModifiers(attack.damage_modifiers)
        const damage = `${attack.damage} ${formatBonus(damage_modifier)}`
        const line = `
            <tr>
                <td>${attack.name}</td>
                <td class="details" data-html="${formatDetails(attack.hit_modifiers)}">${formatHit(hit, character.ba)}</td>
                <td class="details" data-html="${formatDetails(attack.damage_modifiers)}">${damage}</td>
                <td>${attack.crit}</td>
                <td>${attack.specials.join("<br>")}</td>
            </tr>`;
        lines.push(line)
    });
    $('#attacks > tbody').empty().append(lines);
}

const dispayPowers = character => {
    const lines = []
    character.powers.forEach(power => {
        const line = `
            <tr class="">
                <td>${power.type || "-"}</td>
                <td class="left aligned">
                    <div class="dd3-power-name">${formatObjectValue(power, "name")}</div>
                    <div class="dd3-power-desc">${power.desc || ""}</div>
                </td>
                <td>${power.source || "-"}</td>
                <td>${power.level || "-"}</td>
            </tr>`;
        lines.push(line)
    })
    $('#powers > tbody').empty().append(lines);
    $("#powers").tablesort()
}

const dispayEquipments = character => {
    const lines = []
    for (let index in character.equipments) {
        const equipment = character.equipments[index]
        // console.log(equipment);
        const equipment_used = equipment.used ? "checked" : ""
        const equipment_disabled = equipment.used ? "" : "disabled"
        // console.log(equipment_used)
        const line = `
            <tr class="">
                <td class="collapsing">
                    <div class="ui fitted _slider ${equipment_used} checkbox">
                        <input  type="checkbox"
                                name="${index}"
                                tabindex="0" ${equipment_used} class="hidden">
                        <label></label>
                    </div>
                </td>
                <td class="${equipment_disabled}">${equipment.name}</td>
                <td class="${equipment_disabled}">
                    <div class="ui divided list">${formatModifers(equipment.modifiers)}</div>
                </td>
            </tr>`;
        lines.push(line);
    }
    $('#equipments > tbody').empty().append(lines);
}

const displayCharacter = character => {
    console.log(`Display ${character.name}`, character)
    dispayIdentity(character)
    dispayCounters(character)
    dispaySaves(character)
    dispayAbilities(character)
    dispaySkills(character)
    dispayAttacks(character)
    dispayPowers(character)
    dispayEquipments(character)

    $('.details').popup({
        position: 'right center',
    });

    $('.ui.sticky').sticky({
        offset: sticky_offset,
        context: '#main',
    });

    $('.ui.checkbox').checkbox({
        onChange: function () {
            $dimmer.dimmer('show');
            console.log(character_data.equipments[this.name])
            character_data.equipments[this.name].used = this.checked
            // console.log(character.data.equipments[this.name])
            character = new Character(character_data)
            displayCharacter(character)
            $dimmer.dimmer('hide');
        }
    });
}

/**
 * Fomantic
 */

const $dimmer = $("body").dimmer({
    transition: 'fade',
    displayLoader: true,
    loaderVariation: 'inverted',
    loaderText: 'Loading data'
}).dimmer('show');

const sticky_offset = 65
$('.ui.sticky').sticky({
    offset: sticky_offset,
    context: '#main',
});

/**
 * Actions
 */

const $character_choice = $('#character_choice')
$character_choice.dropdown({
    onChange: function (value, text, $selectedItem) {
        // console.log(value)
        $dimmer.dimmer('show');
        fetch(`data/characters/${value}.json`, { cache: "reload" })
            .then(response => response.json())
            .then(json => {
                console.log(`data character loaded`);
                character_data = json
                document.title = `DD3 - ${character_data.name}`;
                fetch(`data/races/${character_data.race}.json`, { cache: "reload" })
                    .then(response => response.json())
                    .then(json => {
                        console.log(`race loaded`);
                        race = json
                        console.log(race);
                        character_data.race = race
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

let skills
let character_data
let race
let character

$("#abilities").clone().attr("id", "left-abilities").appendTo("#left");
$("#saves").clone().attr("id", "left-saves").appendTo("#left");
$("#counters").clone().attr("id", "left-counters").appendTo("#left");
$("#card").clone().attr("id", "right-card").appendTo("#right");

fetch(`data/skills.json`)
    .then(response => response.json())
    .then(json => {
        skills = json
        console.log(`${skills.length} skills loaded => enable page`);
        $dimmer.dimmer('hide');
        // $character_choice.dropdown('set selected', 'seleniel')
    });

console.log("main - ok");

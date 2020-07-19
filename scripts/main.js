
"use strict";

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
        return "+" + bonus;
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
        const detail = `<tr><td class='capitalize'>${modifier.source}</td><td>${modifier.value}</td><td>${modifier.type}</td>`
        details.push(detail)
    });
    details.push("</tbody></table>")
    // console.log(details)
    return details.join("")
}

const formatModifiersConditions = modifiers => {
    // console.log(modifiers)
    const conditions = []
    modifiers.forEach(modifier => {
        if ("condition" in modifier) {
            const condition = `
                <div class="item">
                    <i class="icon"><span class="ui circular label">${formatBonus(modifier.value)}</span></i>
                    <div class="content">
                        <div class="header lowercase">${modifier.condition}</div>
                        <div class="description">${modifier.source}</div>
                    </div>
                </div>`
            conditions.push(condition)
        }
    });
    return conditions.join("")
}

const formatModifers = modifiers => {
    const modfiers_as_list = []
    modifiers.forEach(modifier => {
        const category = modifier.target === undefined ? modifier.category : ''
        const target = modifier.target === undefined ? '' : modifier.target
        const item = `
            <div class="item">
                <i class="icon"><span class="ui circular label">${formatBonus(modifier.value)}</span></i>
                <div class="content">
                    <span class="capitalize">${category}</span>
                    <span class="capitalize">${target}</span>
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
    const attributes = ["name", "level", "alignment", "race.name", "race.size", "race.speed", "size", "weight", "age"]
    attributes.forEach(attribute => {
        // console.log(attribute)
        $(`.dd3-id-${attribute.replace(".", "-")}`).text(search(attribute, character))
    });
    const classes = character.classes.map(current_class => {
        return `${current_class.name} ${current_class.level}`
    })
    $('.dd3-id-classes').text(classes.join(" / "));
    $(".dd3-id-image").attr("src", character.image);
    $(".dd3-id-gender").removeClass("neuter");
    $(".dd3-id-gender").addClass(character.gender);
}

const dispayAbilities = character => {
    $('#abilities > tbody').empty();
    Object.values(character.abilities).forEach(ability => {
        // console.log(ability);
        const line = `
            <tr>
                <td class="capitalize">${ability.name}</td>
                <td><b>${ability.base}</b></td>
                <td><b>${ability.total}</b></td>
                <td><span class="ui circular label">${ability.bonus}</span></td>
            </tr>`;
        $('#abilities > tbody:last-child').append(line);
    });
}

const dispayCounters = character => {
    $("#hit_points").text(`${character.hit_points}`)
    const ca_moficiers = filterModifiersByConditions(character.ca_modifiers, false)
    $("#ca").text(`${getSumModifiers(ca_moficiers)}`)
    $("#ca_details").html(`${formatDetails(ca_moficiers)}`)
    $("#hit").text(`${character.ba}`)
    const ca_conditions = filterModifiersByConditions(character.ca_modifiers, true)
    $("#counters_extras").html(`${formatModifiersConditions(ca_conditions)}`)
}

const dispaySaves = character => {
    $("#vig").text(`${getSumModifiers(character.saves.vig)}`)
    $("#vig_details").html(`${formatDetails(character.saves.vig)}`)
    $("#ref").text(`${getSumModifiers(character.saves.ref)}`)
    $("#ref_details").html(`${formatDetails(character.saves.ref)}`)
    $("#vol").text(`${getSumModifiers(character.saves.vol)}`)
    $("#vol_details").html(`${formatDetails(character.saves.vol)}`)
    $("#saves_conditions").html(`${formatModifiersConditions(character.saves.conditions)}`)
}

const dispaySkills = character => {

    const flags_mappping = {
        "learned": '<i class="graduation cap icon"></i>',
        "armor_penality": '<i class="hiking icon"></i>'
    }
    $('#skills > tbody').empty();
    const computed_skills = character.computeSkills(skills)
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
        $('#skills > tbody:last-child').append(line);
    });
    // console.log(character.skills_ranks)
    $("#skills_ranks").text(character.skills_ranks)
}

const dispayAttacks = character => {
    $('#attacks > tbody').empty();
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
        $('#attacks > tbody:last-child').append(line);
    });
}

const dispayPowers = character => {
    $('#powers > tbody').empty();
    character.powers.forEach(power => {
        const power_type = (power.type === undefined) ? "" : `[${power.type}]`
        const power_name = (power.name === undefined) ? "" : power.name
        const power_desc = (power.desc === undefined) ? "" : power.desc
        const power_source = (power.source === undefined) ? "-" : power.source
        const power_level = (power.level === undefined) ? "-" : power.level
        const line = `
        <tr class="">
            <td>
                <code>${power_type}</code>
                <b>${power_name}</b>
                <span class="">${power_desc}</span>
            </td>
            <td>${power_source}</td>
            <td>${power_level}</td>
        </tr>`;
        $('#powers > tbody:last-child').append(line);
    })
}

const dispayEquipments = character => {
    $('#equipments > tbody').empty();
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
        $('#equipments > tbody:last-child').append(line);
    }
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
        offset: 100,
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

$('.ui.sticky').sticky({
    offset: 100,
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

$("#identity").click(function () {
    $("#image").fadeToggle()
});

/**
* Start page
*/

let skills
let character_data
let race
let character

fetch(`data/skills.json`)
    .then(response => response.json())
    .then(json => {
        skills = json
        console.log(`${skills.length} skills loaded => enable page`);
        $dimmer.dimmer('hide');
        // $character_choice.dropdown('set selected', 'seleniel')
    });

console.log("main - ok");

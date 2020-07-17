
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

const formatDetails = modifiers => {
    // console.log(modifiers)
    details = ["<table class='ui very basic celled center aligned table'><tbody>"]
    modifiers.forEach(modifier => {
        detail = `<tr><td class='capitalize'>${modifier.source}</td><td>${modifier.value}</td><td>${modifier.type}</td>`
        details.push(detail)
    });
    details.push("</tbody></table>")
    // console.log(details)
    return details.join("")
}

const formatModifers = modifiers => {
    // console.log(modifiers)
    const modfiers_as_list = []
    let modifier_item
    modifiers.forEach(modifier => {
        if ("condition" in modifier) {
            modifier_item = `
            <div class="item">
                <i class="icon"><span class="ui circular label">${formatBonus(modifier.value)}</span></i>
                <div class="content">
                    <div class="header">Sur "${modifier.condition}"</div>
                    <div class="description">${modifier.source}</div>
                </div>
            </div>`
        } else {
            const category = modifier.target === undefined ? modifier.category : ''
            const target = modifier.target === undefined ? '' : modifier.target
            modifier_item = `
            <div class="item">
                <i class="icon"><span class="ui circular label">${formatBonus(modifier.value)}</span></i>
                <div class="content">
                    <span class="capitalize">${category}</span>
                    <span class="capitalize">${target}</span>
                    <span class="lowercase">[${modifier.type}]</span>
                </div>
            </div>`
        }
        modfiers_as_list.push(modifier_item)
    });
    // console.log(modfiers_as_list)
    return modfiers_as_list.join("")
}


/**
 *
 */

const dispaySkills = character => {

    const flags_mappping = {
        "learned": '<i class="graduation cap icon"></i>',
        "armor_penality": '<i class="hiking icon"></i>'
    }
    $('#skills > tbody').empty();
    computed_skills = character.computeSkills(skills)
    computed_skills.forEach(skill => {
        const skill_class_css = skill.class ? "left marked green" : ""
        const skill_flags = skill.flags.map(flag => {
            return flags_mappping[flag]
        })

        line = `
            <tr class="${skill_class_css} ${skill.state}">
                <td>${skill.name} ${skill_flags.join(" ")}</td>
                <td class="center aligned details" data-html="${formatDetails(skill.modifiers)}">
                    <div>${getSumModifiers(skill.modifiers)}</div>
                </td>
                <td>${skill.comments.join("<br>")}</td>
            </tr>`;
        $('#skills > tbody:last-child').append(line);
    });
}

const dispayAbilities = character => {

    $('#abilities > tbody').empty();
    Object.values(character.abilities).forEach(ability => {
        // console.log(ability);
        line = `
            <tr>
                <td class="capitalize">${ability.name}</td>
                <td><b>${ability.base}</b></td>
                <td><b>${ability.total}</b></td>
                <td><span class="ui circular label">${ability.bonus}</span></td>
            </tr>`;
        $('#abilities > tbody:last-child').append(line);
    });

}

const dispayIdentity = character => {

    const classes = character.classes.map(current_class => {
        return `${current_class.name} ${current_class.level}`
    })

    const identity = `
        <div class="content">
            <span class="right floated"><span class="ui grey circular label" id="level">${character.level}</span></span>
            <div class="header">${character.name}</div>
        </div>
        <div class="image">
            <img src="${character.image}">
        </div>
        <div class="extra content">
            <span class="right floated">${character.alignement}</span>
            ${classes.join(" / ")}
        </div>
        <div class="extra content">
            <span class="right floated">${character.race.size}</span>
            ${character.race.name} <i class="${character.gender} icon"></i>
        </div>
        <div class="extra content">
            ${character.taille} / ${character.poids} / ${character.age}
        </div>`
    $('#identity').html(identity);

    const counters = `
        <span class="item"><i class="heart icon"></i>${character.points_de_vie}</span>
        <span class="item details"><i class="shield icon"></i>${getSumModifiers(character.ca_modifiers)}</span>
        <div class="ui popup">${formatDetails(character.ca_modifiers)}</div>
        <span class="item"><i class="gavel icon"></i>${character.ba}</span>`
    $('#counters').html(counters);

    const saves = `
        <span class="item details"><i class="skull crossbones icon"></i>${getSumModifiers(character.saves.vig)}</span>
        <div class="ui popup">${formatDetails(character.saves.vig)}</div>
        <span class="item details"><i class="bomb icon"></i>${getSumModifiers(character.saves.ref)}</span>
        <div class="ui popup">${formatDetails(character.saves.ref)}</div>
        <span class="item details"><i class="brain icon"></i>${getSumModifiers(character.saves.vol)}</span>
        <div class="ui popup">${formatDetails(character.saves.vol)}</div>`
    $('#saves').html(saves);
    $('#saves_extras').html(formatModifers(character.saves.extras));

}

const dispayAttacks = character => {

    $('#attacks > tbody').empty();
    character.attacks.forEach(attack => {
        // console.log(attack);
        const hit = getSumModifiers(attack.hit_modifiers)
        const damage_modifier = getSumModifiers(attack.damage_modifiers)
        const damage = `${attack.damage} ${formatBonus(damage_modifier)}`
        line = `
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

}

const dispayEquipments = character => {

    $('#equipments > tbody').empty();
    for (let index in character.equipments) {
        const equipment = character.equipments[index]
        // console.log(equipment);
        const equipment_used = equipment.used ? "checked" : ""
        const equipment_disabled = equipment.used ? "" : "disabled"
        // console.log(equipment_used)
        line = `
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
    console.log(`Display ${character.name}`)
    dispayIdentity(character)
    dispayAbilities(character)
    dispaySkills(character)
    dispayAttacks(character)
    dispayPowers(character)
    dispayEquipments(character)

    $('.details').popup({
        position: 'right center',
    });

    $('.ui.checkbox').checkbox({
        onChange: function () {
            console.log(character_data.equipments[this.name])
            character_data.equipments[this.name].used = this.checked
            // console.log(character.data.equipments[this.name])
            character = new Character(character_data)
            displayCharacter(character)
        }
    });
}

/**
 * Start page
 */

const $character_choice = $('#character_choice')

let skills
let character_data
let character

fetch(`data/skills.json`)
    .then(response => response.json())
    .then(json => {
        skills = json
        console.log(`${skills.length} skills loaded => enable character dropdown`);
        $character_choice.removeClass('disabled')
        // $character_choice.dropdown('set selected', 'seleniel')
    });

$character_choice.dropdown({
    onChange: function (value, text, $selectedItem) {
        // console.log(value)
        fetch(`data/characters/${value}.json`, { cache: "reload" })
            .then(response => response.json())
            .then(json => {
                console.log(`data character loaded`);
                character_data = json
                character = new Character(character_data)
                displayCharacter(character)
            });
    }
});

console.log("main - ok");

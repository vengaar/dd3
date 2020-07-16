
const dispay_skills = character => {

    const flags_mappping = {
        "learned": '<i class="graduation cap icon"></i>',
        "armor_penality": '<i class="hiking icon"></i>'
    }
    computed_skills = compute_skills(skills, character)
    computed_skills.forEach(skill => {
        const skill_class_css = skill.class ? "left marked green" : ""
        const skill_flags = skill.flags.map(flag => {
            return flags_mappping[flag]
        })
        line = `
            <tr class="${skill_class_css} ${skill.state}">
                <td>${skill.name} ${skill_flags.join(" ")}</td>
                <td class="center aligned">${skill.total}</td>
                <td>${skill.comments.join("<br>")}</td>
            </tr>`;
        $('#skills > tbody:last-child').append(line);
    });
}

const dispay_abilities = character => {
    Object.values(character.abilities).forEach(ability => {
        // console.log(ability);
        line = `
            <tr>
                <td>${ability.name.toUpperCase()}</td>
                <td><b>${ability.base}</b></td>
                <td><b>${ability.total}</b></td>
                <td><span class="ui circular label">${ability.bonus}</span></td>
            </tr>`;
        $('#abilities > tbody:last-child').append(line);
    });
}

const dispay_identity = character => {

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
            <span class="right floated">${character.taille_category}</span>
            ${character.race.name} <i class="${character.gender} icon"></i>
        </div>
        <div class="extra content">
            ${character.taille} / ${character.poids} / ${character.age}
        </div>`
    $('#identity').append(identity);

    const counters = `
        <span class="item"><i class="heart icon"></i>${character.points_de_vie}</span>
        <span class="item"><i class="shield icon"></i>${character.ca}</span>
        <span class="item"><i class="gavel icon"></i>${character.ba}</span>`
    $('#counters').append(counters);

    const saves = `
        <span class="item"><i class="skull crossbones icon"></i></i>${character.save_vig}</span>
        <span class="item"><i class="bomb icon"></i>${character.save_ref}</span>
        <span class="item"><i class="brain icon"></i>${character.save_vol}</span>`
    $('#saves').append(saves);

}

const dispay_attacks = character => {

    character.get_attacks().forEach(attack => {
        // console.log(attack);
        line = `
            <tr>
                <td>${attack.name}</td>
                <td>
                    <div class="details">${attack.hit}</div>
                    <div class="ui popup">${formatModifiers(attack.hit_modifiers)}</div>
                </td>
                <td>
                    <div class="details">${attack.damage}</div>
                    <div class="ui popup">${formatModifiers(attack.damage_modifiers)}</div>
                </td>
                <td>${attack.crit}</td>
                <td>${attack.specials.join("<br>")}</td>
            </tr>`;
        $('#attacks > tbody:last-child').append(line);
    });

}

const formatModifiers = modifiers => {
    console.log(modifiers)
    details = ['<table class="ui very basic celled center aligned table"><tbody>']
    modifiers.forEach(modifier => {
        detail = `<tr><td>${modifier.source}</td><td>${modifier.value}</td><td>${modifier.type}</td>`
        details.push(detail)
    });
    details.push('</tbody></table>')
    console.log(details)
    return details.join("")
}

const display_charater = data => {
    // console.log(data)
    const character = new Character(data)
    dispay_identity(character)
    dispay_abilities(character)
    dispay_skills(character)
    dispay_attacks(character)

    $('.details').popup({
        inline: true,
        position: 'right center',
    });

}

const $character_choice = $('#character_choice')
$character_choice.dropdown({
    onChange: function (value, text, $selectedItem) {
        // console.log(value)
        fetch(`data/characters/${value}.json`)
            .then(response => response.json())
            .then(json => display_charater(json));
    }
});

let skills = {}
fetch(`data/skills.json`)
    .then(response => response.json())
    .then(json => {
        skills = json
        $character_choice.dropdown('set selected', 'ronce')
    });

console.log("main - ok");

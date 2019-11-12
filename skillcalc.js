/* CONSTANTS */
// Name of file containing character data
const CHARACTER_FILE = "characters.json";

// Name of file containing class data
const CLASS_FILE = "classes.json";

// Name of file containing ability data
const ABILITY_FILE = "abilities.json";

// Numeric values of letter skill ranks
const RANK_VALUES = {
    "e":  0,
    "e+": 1,
    "d":  2,
    "d+": 3,
    "c":  4,
    "c+": 5,
    "b":  6,
    "b+": 7,
    "a":  8,
    "a+": 9,
    "s":  10,
    "s+": 11,
};

// Placeholder text when no ability is selected
const NO_ABILITY = "-----";


/* VARIABLES */
// Table of character data.  Not an array because
// character names are alphabetized in dropdown and
// may not be in order as original JSON array.
var characters;

// Array of class data.
var classes;

// Array of ability data.
var abilities;


/* FUNCTIONS */
// Load a JSON data file
function loadFromJSON(path, dataCallback, namesCallback)
{
    let request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if ((this.readyState == 4) && (this.status == 200 || this.status == 0))
        {
            let array = JSON.parse(this.responseText);
            
            let names = [];
            let data = {};
            array.forEach(function(obj) {
                data[obj.name] = obj;
                names.push(obj.name);
            });

            dataCallback(data);

            if (namesCallback)
            {
                names.sort();
                namesCallback(names);
            }
        }
    }
    request.open("GET", path, true);
    request.send();
}

// Build list of values for a select object
function buildSelectorContent(values)
{
    let content = "";
    values.forEach(function(value) {
        content += "<option value=\"" + value + "\">" + value + "</option>\n";
    });
    return content;
}

function setCharacters(characterData)
{
    characters = characterData;
}

// Update character selector
function updateCharacterSelector(characterNames)
{
    document.getElementById("characterSelector").innerHTML = buildSelectorContent(characterNames);
}

function setClasses(classData)
{
    classes = classData;
}

function setAbilities(abilityData)
{
    abilities = abilityData;
}

// Update ability selectors
function updateAbilitySelectors(abilityNames)
{
    let content = buildSelectorContent(abilityNames);
    let i;
    for (i = 0; i < 5; i++)
    {
        document.getElementById("abilitySelector" + i).innerHTML = content;
    }
}

// Initialize the page
function webpageLoaded()
{
    // Initialize character, class, and ability data
    loadFromJSON(CHARACTER_FILE, setCharacters, updateCharacterSelector);
    loadFromJSON(CLASS_FILE, setClasses);
    loadFromJSON(ABILITY_FILE, setAbilities, updateAbilitySelectors);
}

// Get the name of the character currently selected
function getSelectedCharacterName()
{
    let selector = document.getElementById("characterSelector");
    return selector.options[selector.selectedIndex].text;
}

// Update currently displayed character name
function updateCharacterName(name)
{
    document.getElementById("characterName").innerHTML = name;
}

// Update currently displayed character portrait
function updateCharacterPortrait(character)
{
    let portraitFilename = character.portraitFilename || character.name.toLowerCase();
    document.getElementById("characterPortrait").src = "resources/characterportraits/" + portraitFilename + ".png";
}

// Change character portrait and character data
function changedCharacter()
{
    let name = getSelectedCharacterName();
    let character = characters[name];
    updateCharacterName(name);
    updateCharacterPortrait(character);
    // TODO: Update allowed skills
    // TODO: Clear selected skills
}

// Get name of ability selected by specified ability selector
function getSelectedAbilityName(n)
{
    let selector = document.getElementById("abilitySelector" + n);
    return selector.options[selector.selectedIndex].text;
}

// Update specified ability icon image
function updateAbilityIcon(n, ability)
{
    let iconFilename = ability.iconFilename || ability.name.toLowerCase();
    document.getElementById("abilityIcon" + n).src = "resources/abilityicons/" + iconFilename + ".png";
}

// Calculate the minimum skill requirements for an ability
function getAbilitySkillRequirements(ability)
{
    if (typeof(ability.skillRequirement) !== 'undefined')
    {
        return ability.skillRequirement;
    }
    else if (typeof(ability.classRequirement) !== 'undefined')
    {
        // TODO: Calculate minimum requirements among all possible classes
        //       Not currently necessary, but maybe in the future
        return classes[ability.classRequirement[0]].skillRequirements;
    }

    return {};
}

// Update minimum skill requirement text objects
function updateSkillRequirements()
{
    let minimumSkillRequirements = {
        "sword": "e",
        "lance": "e",
        "axe": "e",
        "bow": "e",
        "brawling": "e",
        "reason": "e",
        "faith": "e",
        "authority": "e",
        "heavyArmor": "e",
        "riding": "e",
        "flying": "e"
    };

    // Calculate minimum requirements among all skills
    let i;
    for (i = 0; i < 5; i++)
    {
        let abilityName = getSelectedAbilityName(i);
        if (abilityName != NO_ABILITY)
        {
            // TODO: Check if ability is budding talent FIRST (e.g. for Jeritza)

            let abilityRequirements = getAbilitySkillRequirements(abilities[abilityName]);
            Object.keys(abilityRequirements).forEach(function(key) {
                if (RANK_VALUES[abilityRequirements[key]] > RANK_VALUES[minimumSkillRequirements[key]])
                {
                    minimumSkillRequirements[key] = abilityRequirements[key];
                }
            });
        }
    }

    // TODO: Special per-character Authority requirements

    // Update skill requirement fields
    Object.keys(minimumSkillRequirements).forEach(function(key) {
        let requirement = minimumSkillRequirements[key];
        if (requirement == "e")
            requirement = "";
        document.getElementById(key + "SkillRank").innerHTML = requirement.toUpperCase();
    });
}

// Change ability icon and update required skill calculations
function changedAbility(n)
{
    let ability = abilities[getSelectedAbilityName(n)];
    updateAbilityIcon(n, ability);
    updateSkillRequirements();
}

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

// Placeholder text when nothing is selected
const NO_SELECTION = "-----";

// List of all skill names
const SKILL_NAMES = [
    "sword",
    "lance",
    "axe",
    "bow",
    "brawling",
    "reason",
    "faith",
    "authority",
    "heavyArmor",
    "riding",
    "flying"
];


/* VARIABLES */
// Table of character data.  Not an array because
// character names are alphabetized in dropdown and
// may not be in order as original JSON array.
var characters;

// Table of class data.
var classes;

// Table of ability data.
var allAbilities;

// Array of saved builds
var savedBuilds;


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

            names.sort();
            namesCallback(names);
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

// Get the value currently selected by a selector
function getSelectedValue(selectorName)
{
    let selector = document.getElementById(selectorName);
    return selector.options[selector.selectedIndex].text;
}

// Set full list of all characters
function setCharacters(characterData)
{
    characters = characterData;
}

// Update character selector
function updateCharacterSelector(characterNames)
{
    document.getElementById("characterSelector").innerHTML = buildSelectorContent(characterNames);
}

// Set full list of all classes
function setClasses(classData)
{
    classes = classData;
}

// Update class selector
function updateClassSelector(classNames)
{
    document.getElementById("classSelector").innerHTML = buildSelectorContent(classNames);
}

// Get the name of the currently selected class
function getSelectedClassName()
{
    return getSelectedValue("classSelector");
}

// Set full list of all abilities
function setAllAbilities(abilityData)
{
    allAbilities = abilityData;
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

// Get the name of the character currently selected
function getSelectedCharacterName()
{
    return getSelectedValue("characterSelector");
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

// Check whether or not the given character can be the given class
function characterCanBeClass(character, combatClass)
{
    // Special classes can only be used by specific units
    if (combatClass.special)
    {
        return (typeof(character.specialClasses) !== "undefined" && character.specialClasses.includes(combatClass.name));
    }
    else
    {
        // Check if unit is correct sex for class
        return (typeof(combatClass.sexRequirement) === "undefined") || (combatClass.sexRequirement === character.sex);
    }
}

// Check whether or not the given character can learn the given ability
function characterCanLearnAbility(character, ability)
{
    // Check if skill is a budding talent first (e.g. for Jeritza)
    if (ability.name === character.buddingTalentName)
    {
        return true;
    }

    // If there are only skill requirements, character can learn ability
    if (typeof(ability.skillRequirement) !== "undefined")
    {
        // EXCEPTION: Dark magic users exclusively learn dark magic skills
        if (ability.darkMagic)
        {
            return character.darkMagicUser;
        }
        else if (ability.blackMagic)
        {
            return !character.darkMagicUser;
        }

        return true;
    }

    // If there are class requirements, character must be able to certify as that class
    let intersect = false;
    if (typeof(ability.classRequirement) !== "undefined")
    {
        // Find classes the character can certify as
        let validClasses = ability.classRequirement.filter(function(abilityClass) {
            let cl = classes[abilityClass];
            return characterCanBeClass(character, cl);
        });

        if (validClasses.length > 0)
            return true;
    } 

    // By default, assume character CANNOT learn skill
    return false;
}

// Update class selector to only display allowed classes
function updateAllowedClasses(character)
{
    let allowedClasses = [];
    allowedClasses.push(NO_SELECTION); // Special case - no class selected
    Object.keys(classes).forEach(function(name) {
        if (characterCanBeClass(character, classes[name]))
        {
            allowedClasses.push(name);
        }
    });

    // Alphabetize and update selectors
    allowedClasses.sort();
    updateClassSelector(allowedClasses);
}

// Update ability selectors to only display allowed abilities
function updateAllowedAbilities(character)
{
    // Determine abilities character can learn
    let allowedAbilities = [];
    allowedAbilities.push(NO_SELECTION); // Special case - no ability selected
    Object.keys(allAbilities).forEach(function(name) {
        if (characterCanLearnAbility(character, allAbilities[name]))
        {
            allowedAbilities.push(name);
        }
    });

    // Alphabetize and update selectors
    allowedAbilities.sort();
    updateAbilitySelectors(allowedAbilities);
}

// Get name of ability selected by specified ability selector
function getSelectedAbilityName(n)
{
    return getSelectedValue("abilitySelector" + n);
}

// Update specified ability icon image
function updateAbilityIcon(n, ability)
{
    let iconFilename = "empty";

    if (ability !== null)
        iconFilename = ability.iconFilename || ability.name.toLowerCase();

    document.getElementById("abilityIcon" + n).src = "resources/abilityicons/" + iconFilename + ".png";
}

// Calculate the minimum skill requirements for an ability
function getAbilitySkillRequirements(ability)
{
    let buddingTalent = characters[getSelectedCharacterName()].buddingTalentName;
    if (buddingTalent && buddingTalent === ability.name)
    {
        return {};
    }
    if (typeof(ability.skillRequirement) !== 'undefined')
    {
        return ability.skillRequirement;
    }
    else if (typeof(ability.classRequirement) !== 'undefined')
    {
        // TODO: Calculate minimum requirements among ALL possible classes
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

    // Calculate certification requirements for desired class
    let desiredClassName = getSelectedClassName();
    if (desiredClassName != NO_SELECTION)
    {
        let desiredClass = classes[getSelectedClassName()];
        if (typeof(desiredClass.skillRequirements) !== "undefined")
        {
            let classRequirements = desiredClass.skillRequirements;
            Object.keys(classRequirements).forEach(function(skill) {
                minimumSkillRequirements[skill] = classRequirements[skill];
            });
        }
    }

    // Calculate minimum requirements among all skills
    let i;
    for (i = 0; i < 5; i++)
    {
        let abilityName = getSelectedAbilityName(i);
        if (abilityName != NO_SELECTION)
        {
            let abilityRequirements = getAbilitySkillRequirements(allAbilities[abilityName]);
            if (typeof(abilityRequirements) !== "undefined")
            {
                Object.keys(abilityRequirements).forEach(function(skill) {
                    if (RANK_VALUES[abilityRequirements[skill]] > RANK_VALUES[minimumSkillRequirements[skill]])
                    {
                        minimumSkillRequirements[skill] = abilityRequirements[skill];
                    }
                });
            }
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
    let ability = allAbilities[getSelectedAbilityName(n)];
    updateAbilityIcon(n, ability);
    updateSkillRequirements();
}

// Change character portrait and character data
function changedCharacter()
{
    let name = getSelectedCharacterName();
    let character = characters[name];
    updateCharacterName(name);
    updateCharacterPortrait(character);
    updateAllowedClasses(character);
    updateAllowedAbilities(character);
    for (let i = 0; i < 5; i++)
    {
        // Clear icons
        updateAbilityIcon(i, null);
    }
    updateSkillRequirements();
}

// Change the desired class
function changedClass()
{
    updateSkillRequirements();
}

// Turn displayed skill requirements into an object
function getSkillRequirement(skillName)
{
    return document.getElementById(skillName + "SkillRank").innerHTML;
}

// Generate HTML forming a row in the saved builds table
function formSavedBuildRow(build, rowNumber)
{
    let buildRow = "<tr>";

    // Basic info
    buildRow += `<td>${build.character}</td>`;
    buildRow += `<td>${build.class}</td>`;

    // Ability icons
    buildRow += "<td>";
    build.abilities.forEach(function(abilityName) {
        if (abilityName !== NO_SELECTION)
        {
            let ability = allAbilities[abilityName];
            let iconFilename = ability.iconFilename || ability.name.toLowerCase();
            buildRow += `<img src="resources/abilityicons/${iconFilename}.png">`;
        }
    });
    buildRow += "</td>"

    // Skill levels
    SKILL_NAMES.forEach(function(skillName) {
        buildRow += `<td>${build.skillRequirements[skillName].toUpperCase()}</td>`;
    });

    // Delete button
    buildRow += `<td><button type="button" onclick="deleteBuild(${rowNumber})">Delete</button></td>`;

    buildRow += "</tr>";
    return buildRow;
}

// Display the up to date saved builds table
function updateSavedBuildsTable()
{
    let buildTableText = "";
    let i;
    for (i = 0; i < savedBuilds.length; i++)
    {
        buildTableText += formSavedBuildRow(savedBuilds[i], i);
    }
    document.getElementById("savedbuildtable").innerHTML = buildTableText;
}

// Save the currently displayed build in the saved characters table
function saveBuild()
{
    let build = {
        "character": getSelectedCharacterName(),
        "class": getSelectedClassName(),
        "abilities": [
            getSelectedAbilityName(0),
            getSelectedAbilityName(1),
            getSelectedAbilityName(2),
            getSelectedAbilityName(3),
            getSelectedAbilityName(4)
        ],
        "skillRequirements": { }
    };

    SKILL_NAMES.forEach(function(skillName) {
        build.skillRequirements[skillName] = getSkillRequirement(skillName);
    });

    savedBuilds.push(build);
    updateSavedBuildsTable();
}

// Remove the specified build from the saved builds table
function deleteBuild(buildNumber)
{
    savedBuilds.splice(buildNumber, 1);
    updateSavedBuildsTable();
}

// Initialize the page
function webpageLoaded()
{
    // Initialize character, class, and ability data
    loadFromJSON(CHARACTER_FILE, setCharacters, updateCharacterSelector);
    loadFromJSON(CLASS_FILE, setClasses, updateClassSelector);
    loadFromJSON(ABILITY_FILE, setAllAbilities, updateAbilitySelectors);
    savedBuilds = [];
    updateSavedBuildsTable();
}

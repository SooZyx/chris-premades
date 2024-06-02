import {DialogApp} from '../../applications/dialog.js';
import {tokenUtils, genericUtils} from '../../utils.js';
/*
button, checkbox, radio, select, text, number, filePicker
    --dialog - 203 - buttons, select one
    --numberDialog - external, 1 number input, ok cancel
    almost -- selectTarget - 44 - check box, ok cancel
    remoteDialog - 15
    menu - 19
    remoteMenu - 5
    remoteSelectTarget - 1
    untested -- selectDocument - 32 - fancy button
    untested -- selectDocuments - 4 - fancy w checkbox
    remoteDocumentDialog - 6
    remoteDocumentsDialog - 4
        useSpellWhenEmpty - 1
*/
async function buttonDialog(title, content, buttons, options = {displayVertical: true}) {
    let inputs = [
        ['button', [], {displayVertical: options.displayVertical}]
    ];
    for (let [label, value] of buttons) {
        inputs[0][1].push({label: label, name: value});
    }
    let result = await DialogApp.dialog(title, content, inputs, undefined, {width: 400});
    return result.buttons;
}
async function numberDialog(title, content, input = {label: 'Label', name: 'identifier', options: {}}, options) {
    let inputs = [
        ['number', 
            {
                label: input.label,
                name: input.name,
                options: input.options
            }
        ]
    ];
    let result = await DialogApp.dialog(title, content, inputs, 'okCancel', options);
    return result[input.name];
}
async function selectTargetDialog(title, content, targets, options = {returnUuid: false, type: 'one', selectOptions: [], skipDeadandUnconscious: true, coverToken: undefined, reverseCover: false, displayDistance: true}) {
    let inputs = [
        [options?.type === 'multiple' ? 'checkbox' : options?.type === 'number' ? 'number' : options?.type === 'select' ? 'selectOption' : 'radio']
    ];
    let targetInputs = [];
    let number = 1;
    for (let i of targets) {
        let label;
        if (game.settings.get('chris-premades', 'Show Names')) {
            label = i.document.name;
        } else {
            if (i.document.disposition <= 0) {
                label = 'CHRISPREMADES.UnknownTarget (' + number + ')';
                number++;
            } else {
                label = i.document.name;
            }
        }
        if (options?.coverToken && !options?.reverseCover) {
            label += ' [' + tokenUtils.chris.checkCover(options.coverToken, i, undefined, true) + ']';
        } else if (options?.coverToken) {
            label += ' [' + tokenUtils.chris.checkCover(i, options.coverToken, undefined, true) + ']';
        }
        if (options?.displayDistance && options?.coverToken) {
            let distance = tokenUtils.chris.getDistance(options.coverToken, i);
            label += ' [' + +distance.toFixed(2) + ' ' + canvas.scene.grid.units + ' ]';
        }
        let image = i.document.texture.src;
        let value = i.id;
        let isDefaultSelected = targetInputs.length === 0;
        targetInputs.push({
            label: label,
            name: value,
            options: {image: image, isChecked: isDefaultSelected}
        });
    }
    inputs[0].push(targetInputs);
    if (options?.skipDeadandUnconscious) {
        inputs.push([
            'checkbox',
            [{
                label: 'CHRISPREMADES.SkipDeadAndUnconscious',
                name: 'skip',
                options: {isChecked: true}
            }]
        ]);
    }
    let selection = await DialogApp.dialog(title, content, inputs, 'okCancel');
    return selection;
}
async function confirm(title, content) {
    let selection = await DialogApp.dialog(title, content, undefined, 'yesNo');
    return selection.buttons;
}
async function selectDocumentDialog(title, content, documents, options = {useUuids: false, displayTooltips: false, sortAlphabetical: false, sortCR: false}) {
    if (options?.sortAlphabetical) {
        documents = documents.sort((a, b) => {
            return a.name.localeCompare(b.name, 'en', {'sensitivity': 'base'});
        });
    }
    if (options?.sortCR) {
        documents = documents.sort((a, b) => {
            return a.system?.details?.cr > b.system?.details?.cr ? -1 : 1;
        });
    }
    let inputs = [
        ['button', [], {displayAsRows: true}]
    ];
    for (let i of documents) {
        inputs[0][1].push({
            label: i.name,
            name: options?.useUuids ? i.actor.uuid : i,
            options: {
                image: i.image + (i.system?.details?.cr != undefined ? ` (CR ${genericUtils.decimalToFraction(i.system?.details?.cr)})` : ``),
                tooltip: options?.displayTooltips ? i.system.description.value.replace(/<[^>]*>?/gm, '') : undefined
            }
        });
    }
    let height = (inputs[0][1].length * 56 + 46);
    if (inputs[0][1].length > 14 ) height = 850;
    let result = await DialogApp.dialog(title, content, inputs, undefined, {height: height});
    return result.buttons;
}
async function selectDocumentsDialog(title, content, documents, options = {max: 5, useUuids: false, displayTooltips: false, sortAlphabetical: false, sortCR: false}) {
    if (options?.sortAlphabetical) {
        documents = documents.sort((a, b) => {
            return a.name.localeCompare(b.name, 'en', {'sensitivity': 'base'});
        });
    }
    if (options?.sortCR) {
        documents = documents.sort((a, b) => {
            return a.system?.details?.cr > b.system?.details?.cr ? -1 : 1;
        });
    }
    let inputs = [
        ['selectAmount', [], {displayAsRows: true, totalMax: options?.max}]
    ];
    for (let i of documents) {
        inputs[0][1].push({
            label: i.name,
            name: options?.useUuids ? i.actor.uuid : i,
            options: {
                image: i.image + (i.system?.details?.cr != undefined ? ` (CR ${genericUtils.decimalToFraction(i.system?.details?.cr)})` : ``),
                tooltip: options?.displayTooltips ? i.system.description.value.replace(/<[^>]*>?/gm, '') : undefined,
                minAmount: 0,
                maxAmount: options?.max ?? 5
            }
        });
    }
    let height = (inputs[0][1].length * 56 + 46);
    if (inputs[0][1].length > 14 ) height = 850;
    let result = await DialogApp.dialog(title, content, inputs, 'undefined', {height: height});
    return result.buttons;
}
export let dialogUtils = {
    buttonDialog,
    numberDialog,
    selectTargetDialog,
    selectDocumentDialog,
    selectDocumentsDialog,
    confirm
};
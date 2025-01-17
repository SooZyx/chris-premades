import {effectUtils, constants, genericUtils} from '../../utils.js';
let cleanUpList = [];
let validKeys = [
    'macro.CE',
    'macro.CUB',
    'macro.StatusEffect',
    'StatusEffect'
];
let effectData = {
    'name': 'Condition Advantage',
    'img': constants.tempConditionIcon,
    'duration': {
        'turns': 1
    },
    'changes': [
        {
            'key': 'flags.midi-qol.advantage.ability.save.all',
            'value': '1',
            'mode': 5,
            'priority': 120
        }
    ],
    'flags': {
        'chris-premades': {
            'effect': {
                'noAnimation': true
            }
        }
    }
};
async function preambleComplete(workflow) {
    if (!workflow.targets.size) return;
    if (workflow.item.system.save?.dc === null || workflow.item.system.save === undefined) return;
    let macros = workflow.item.flags['chris-premades']?.macros?.midi?.item ?? [];
    if (!workflow.item.effects.size && !macros.length) return;
    let itemConditions = new Set();
    workflow.item.effects.forEach(effect => {
        effect.changes.forEach(element => {
            if (validKeys.includes(element.key)) itemConditions.add(element.value.toLowerCase());
        });
        let effectConditions = effect.flags['chris-premades']?.conditions;
        if (effectConditions) effectConditions.forEach(c => itemConditions.add(c.toLowerCase()));
        itemConditions = itemConditions.union(effect.statuses ?? new Set());
    });
    let proneMacros = [
        'proneOnFail'
    ];
    if (macros.some(i => proneMacros.includes(i))) itemConditions.add('prone');
    if (!itemConditions.size) return;
    await Promise.all(workflow.targets.map(async token => {
        await Promise.all(itemConditions.map(async condition => {
            let flagData = token.document.actor?.flags?.['chris-premades']?.CR?.[condition];
            if (flagData) {
                let types = String(flagData).split(',').map(i => i.toLowerCase());
                if (types.includes('1') || types.includes('true') || types.includes(workflow.item.system.save.ability)) {
                    let effect = await effectUtils.createEffect(token.document.actor, effectData);
                    cleanUpList.push(effect.uuid);
                }
            }
        }));
    }));
}
async function RollComplete(workflow) {
    await Promise.all(cleanUpList.map(async i => {
        let effect = await fromUuid(i);
        if (effect) genericUtils.remove(effect);
    }));
    cleanUpList = [];
}
export let conditionResistance = {
    preambleComplete,
    RollComplete
};
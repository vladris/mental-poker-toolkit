// Random ID generator
const adjective = ['amazing', 'brave', 'courageous', 'daring', 'epic', 'fearless', 'gallant', 'heroic', 'intrepid', 'jovial', 'keen', 'lively', 'merry', 'noble', 'outstanding', 'plucky', 'quick', 'resolute', 'stalwart', 'tireless', 'unyielding', 'valiant', 'wily', 'xenial', 'youthful', 'zealous'];
const color = ['azure', 'blue', 'crimson', 'dusky', 'emerald', 'fuchsia', 'gold', 'hazel', 'indigo', 'jade', 'khaki', 'lavender', 'magenta', 'navy', 'olive', 'purple', 'quartz', 'red', 'sapphire', 'teal', 'umber', 'violet', 'white', 'xanthic', 'yellow', 'zaffre'];
const noun = ['archer', 'bard', 'cleric', 'druid', 'enchanter', 'fighter', 'guardian', 'hunter', 'illusionist', 'jester', 'knight', 'lancer', 'mage', 'necromancer', 'oracle', 'paladin', 'quartermaster', 'ranger', 'sorcerer', 'templar', 'undertaker', 'vanguard', 'warrior', 'xenomancer', 'yogi', 'zealot'];

export function generateId() {
    return `${adjective[Math.floor(Math.random() * adjective.length)]}-${color[Math.floor(Math.random() * color.length)]}-${noun[Math.floor(Math.random() * noun.length)]}`;
}
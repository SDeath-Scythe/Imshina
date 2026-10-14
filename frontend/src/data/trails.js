// Themed trails across the seeded places, matched by their English names (stable in the seed).
// A trail is complete when every one of its places is stamped. Places missing from the data are skipped.
export const TRAILS = [
  {
    id: 'shrines',
    name: 'The four great shrines', nameAr: 'المراقد الأربعة الكبرى',
    text: 'The holiest shrines of Baghdad, Najaf and Karbala.', textAr: 'أقدس المراقد في بغداد والنجف وكربلاء.',
    places: ['Al-Kadhimiya Shrine', 'Imam Ali Shrine', 'Imam Husayn Shrine', 'Al-Abbas Shrine'],
  },
  {
    id: 'baghdad',
    name: 'Old Baghdad', nameAr: 'بغداد القديمة',
    text: 'The Abbasid madrasa and palace, the book market and the national museum.', textAr: 'المدرسة والقصر العباسيان، وسوق الكتب، والمتحف الوطني.',
    places: ['Al-Mustansiriya School', 'Abbasid Palace', 'Al-Mutanabbi Street', 'Iraq National Museum'],
  },
  {
    id: 'babylon',
    name: 'Heart of Babylon', nameAr: 'قلب بابل',
    text: 'The gate, the palace and the lion of Nebuchadnezzar’s city.', textAr: 'البوابة والقصر وأسد مدينة نبوخذنصر.',
    places: ['Ancient City of Babylon', 'Ishtar Gate (Reconstruction)', "Nebuchadnezzar's Southern Palace", 'Lion of Babylon'],
  },
  {
    id: 'najaf',
    name: 'Najaf and Kufa', nameAr: 'النجف والكوفة',
    text: 'The shrine, the old city, the great cemetery and the mosque of Kufa.', textAr: 'المرقد والمدينة القديمة والمقبرة الكبرى ومسجد الكوفة.',
    places: ['Imam Ali Shrine', 'Najaf Old City', 'Wadi al-Salam Cemetery', 'Great Mosque of Kufa'],
  },
  {
    id: 'beyond',
    name: 'Beyond the cities', nameAr: 'ما وراء المدن',
    text: 'A desert fortress and two ancient mounds, far from the crowds.', textAr: 'حصن صحراوي وتلّان أثريان بعيدًا عن الزحام.',
    places: ['Al-Ukhaidir Fortress', 'Borsippa (Birs Nimrud)', 'Kish (Tell Uhaimir)'],
  },
]

/** Stamp counts that earn a milestone. The last one is "every place", whatever the total is. */
export const MILESTONES = [
  { id: 'first', at: 1 },
  { id: 'five', at: 5 },
  { id: 'ten', at: 10 },
  { id: 'all', at: Infinity },
]

/** Trails with their places resolved and progress counted. */
export function trailProgress(places = [], stampedIds = new Set()) {
  const byName = new Map(places.map((p) => [p.name, p]))
  return TRAILS.map((tr) => {
    const list = tr.places.map((n) => byName.get(n)).filter(Boolean)
    const done = list.filter((p) => stampedIds.has(p.id)).length
    return { ...tr, list, done, complete: list.length > 0 && done === list.length }
  }).filter((tr) => tr.list.length > 0)
}

/** Milestones with the real target filled in and whether each is reached. */
export function milestoneProgress(count, total) {
  return MILESTONES.map((m) => {
    const at = m.at === Infinity ? total : m.at
    return { ...m, at, reached: total > 0 && count >= at }
  }).filter((m, i, all) => m.at > 0 && (m.id === 'all' || m.at < total) && all.findIndex((x) => x.at === m.at) === i)
}

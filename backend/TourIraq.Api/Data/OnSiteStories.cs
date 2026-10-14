namespace TourIraq.Api.Data;

/// <summary>
/// A short story for each place that unlocks only after the traveller has collected its stamp on site:
/// a surprising fact and one thing to look for while standing there.
/// Facts are taken from the English Wikipedia article on each site (checked October 2026).
/// Keyed by the place's English name as seeded. Places without an entry simply have no story.
/// </summary>
public static class OnSiteStories
{
    public record Story(string Title, string Text, string LookFor, string TitleAr, string TextAr, string LookForAr);

    public static Story? For(string placeName) => All.GetValueOrDefault(placeName);

    public static bool Has(string placeName) => All.ContainsKey(placeName);

    private static readonly Dictionary<string, Story> All = new()
    {
        // ------------------------------------------------------------- Baghdad
        ["Al-Kadhimiya Shrine"] = new(
            "Six roofs of gold",
            "The shrine you see was restored under the Safavid Shah Ismail I between 1502 and 1524, over a cemetery where the seventh Imam, Musa al-Kadhim, was buried in 799.",
            "Count them: two great domes and four minarets, all six coated in gold. Inside, look up for Qur'anic verses written across the domes.",
            "ستة سقوف من ذهب",
            "يعود البناء الذي تراه إلى ترميم الشاه الصفوي إسماعيل الأول بين عامي 1502 و1524، فوق مقبرة دُفن فيها الإمام السابع موسى الكاظم سنة 799.",
            "عُدّها: قبتان كبيرتان وأربع مآذن، والستّ كلها مكسوّة بالذهب. وفي الداخل ارفع نظرك إلى الآيات القرآنية المكتوبة على القباب."),

        ["Al-Mustansiriya School"] = new(
            "A clock that called the prayers",
            "When it opened, the caliph is said to have given its library 80,000 books. In 1235 its entrance hall gained a monumental water-powered clock that announced the hours of prayer.",
            "At the main entrance, find the inscription naming the founder, the caliph al-Mustansir, then look up at the honeycomb vaulting (muqarnas) and the patterned brickwork.",
            "ساعة تعلن مواقيت الصلاة",
            "يُروى أن الخليفة أهدى مكتبتها عند افتتاحها 80 ألف كتاب. وفي سنة 1235 أُضيفت إلى بهو مدخلها ساعة مائية ضخمة تعلن مواقيت الصلاة.",
            "عند المدخل الرئيسي ابحث عن الكتابة التي تذكر اسم المؤسس الخليفة المستنصر، ثم انظر إلى المقرنصات في الأعلى وإلى زخارف الطابوق."),

        ["Abbasid Palace"] = new(
            "A palace that may not be one",
            "Some historians say the caliph al-Nasir built it between 1180 and 1184. Many scholars doubt it was ever a palace at all; it may have been a school or another public building.",
            "Stand under the western gate, more than 21 metres long, then walk the courtyard corridors and look for the muqarnas above the pointed arches.",
            "قصر قد لا يكون قصرًا",
            "يقول بعض المؤرخين إن الخليفة الناصر بناه بين عامي 1180 و1184. لكن كثيرًا من الباحثين يشكّون في أنه كان قصرًا أصلًا، فربما كان مدرسة أو مبنى عامًا آخر.",
            "قف تحت البوابة الغربية التي يزيد طولها على 21 مترًا، ثم امشِ في أروقة الفناء وانظر إلى المقرنصات فوق الأقواس المدببة."),

        ["Al-Mutanabbi Street"] = new(
            "The café that came back",
            "Shabandar Café has gathered Iraq’s politicians and writers since 1917. A car bomb killed 26 people on this street on 5 March 2007 and destroyed the café; it was restored, and the booksellers came back.",
            "The street opens with an arch carved with the poet’s verses. Walk to the far end to find his bronze statue facing the Tigris.",
            "المقهى الذي عاد",
            "يجمع مقهى الشابندر سياسيي العراق وكتّابه منذ سنة 1917. وفي 5 آذار 2007 قتل تفجير 26 شخصًا في هذا الشارع ودمّر المقهى، ثم أُعيد ترميمه وعاد باعة الكتب.",
            "يبدأ الشارع بقوس نُقشت عليه أبيات الشاعر. امشِ إلى نهايته لتجد تمثاله البرونزي مطلًّا على دجلة."),

        ["Iraq National Museum"] = new(
            "The objects that came home",
            "The collection began in 1922 in a government building, gathered by Gertrude Bell. About 15,000 objects were looted in 2003; when the museum reopened in 2009, around 6,000 had been returned.",
            "Look for the gold of Nimrud, made around 2,800 years ago, and the carved stones and clay tablets of Uruk, among the oldest writing on Earth.",
            "القطع التي عادت إلى بيتها",
            "بدأت المجموعة سنة 1922 في مبنى حكومي، وجمعتها غيرترود بيل. ونُهبت نحو 15 ألف قطعة سنة 2003، وعند إعادة افتتاح المتحف سنة 2009 كانت قرابة 6 آلاف منها قد أُعيدت.",
            "ابحث عن ذهب نمرود الذي صُنع قبل نحو 2800 عام، وعن منحوتات أوروك وألواحها الطينية، وهي من أقدم الكتابات في العالم."),

        // --------------------------------------------------------------- Najaf
        ["Imam Ali Shrine"] = new(
            "A clock from Manchester",
            "The shrine’s present form was completed in 1632 under Shah Safi, finishing a rebuild begun by Abbas I. The clock over one of its gates was made in Manchester, England, and brought here in 1887.",
            "Find the Clock Portal, then step back to see the double-shelled dome, 42 metres high, between twin minarets of 38 metres.",
            "ساعة من مانشستر",
            "اكتمل شكل المرقد الحالي سنة 1632 في عهد الشاه صفي، استكمالًا لإعادة بناء بدأها عباس الأول. أما الساعة فوق إحدى بواباته فصُنعت في مانشستر بإنجلترا وجُلبت إلى هنا سنة 1887.",
            "ابحث عن باب الساعة، ثم تراجع قليلًا لترى القبة المزدوجة بارتفاع 42 مترًا بين مئذنتين بارتفاع 38 مترًا."),

        ["Wadi al-Salam Cemetery"] = new(
            "1,400 years of burials, every day",
            "Burials have happened here daily for more than 1,400 years, which makes it one of the longest-used cemeteries in the world. Tradition places the tombs of the prophets Hud and Salih within it.",
            "Notice the shared family crypts that most modern burials use, and the shrine of Hud and Salih, a place of visit inside the cemetery.",
            "1400 عام من الدفن يوميًا",
            "يُدفن الناس هنا يوميًا منذ أكثر من 1400 عام، ما يجعلها من أطول المقابر استخدامًا في العالم. وتذكر الروايات أن فيها قبري النبيين هود وصالح.",
            "لاحظ السراديب العائلية المشتركة التي تُستخدم في معظم الدفن الحديث، ومقام هود وصالح داخل المقبرة."),

        ["Great Mosque of Kufa"] = new(
            "Older than it looks",
            "Excavations showed that the mosque stands on much older foundations. Its golden dome came much later, added in the Safavid period in the 17th and 18th centuries.",
            "Inside, look for the small markers on the floor: they show where Imam Ali held court and where later Imams prayed. Beside the south wall lie the ruins of the governor’s palace, Dar al-Imara.",
            "أقدم مما يبدو",
            "كشفت التنقيبات أن المسجد قائم على أسس أقدم منه بكثير. أما قبته الذهبية فأُضيفت بعد ذلك بزمن طويل، في العهد الصفوي خلال القرنين السابع عشر والثامن عشر.",
            "في الداخل ابحث عن العلامات الصغيرة على الأرض: تشير إلى مكان قضاء الإمام علي وإلى أماكن صلاة أئمة آخرين. وبجانب الجدار الجنوبي أطلال دار الإمارة."),

        ["Najaf Old City"] = new(
            "A thousand years of study",
            "The Hawza of Najaf has taught Shia scholars since the 11th century. The old city wall that once enclosed these streets was torn down in 1958 and replaced by a ring road.",
            "Walk the lanes around the shrine and look for the old schools, libraries and hospices built around it over the centuries.",
            "ألف عام من العلم",
            "تُدرّس حوزة النجف علماء الشيعة منذ القرن الحادي عشر. أما سور المدينة القديمة الذي كان يحيط بهذه الأزقة فهُدم سنة 1958 وحلّ محله طريق دائري.",
            "تجوّل في الأزقة المحيطة بالمرقد وابحث عن المدارس والمكتبات والتكايا القديمة التي بُنيت حوله عبر القرون."),

        // ------------------------------------------------------------- Karbala
        ["Imam Husayn Shrine"] = new(
            "Destroyed, and rebuilt",
            "In 850 the caliph al-Mutawakkil ordered the grave destroyed and the pit flooded with water. Pilgrims kept coming, and in 1384 Sultan Ahmad ibn Uways rebuilt the two minarets in gold.",
            "Look up at the golden dome, 27 metres high with twelve windows around its base. Directly beneath it, the tomb sits inside a metal lattice enclosure, the zarih.",
            "هُدم ثم أُعيد بناؤه",
            "في سنة 850 أمر الخليفة المتوكل بهدم القبر وإغراق موضعه بالماء. لكن الزوار لم ينقطعوا، وفي سنة 1384 أعاد السلطان أحمد بن أويس بناء المئذنتين بالذهب.",
            "ارفع نظرك إلى القبة الذهبية بارتفاع 27 مترًا والنوافذ الاثنتي عشرة حول قاعدتها. وتحتها مباشرة يقع القبر داخل الضريح، وهو سياج معدني مشبّك."),

        ["Al-Abbas Shrine"] = new(
            "The flag-bearer",
            "Abbas ibn Ali carried Husayn’s flag at the Battle of Karbala in 680. His shrine was rebuilt by the Ottoman sultans Suleiman the Magnificent, Murad III and Murad IV.",
            "Go inside and look up: the inner dome is covered in fine mirror work. Outside, walk Bayn al-Haramayn, the open space between this shrine and Imam Husayn’s.",
            "حامل الراية",
            "حمل العباس بن علي راية الحسين في معركة كربلاء سنة 680. وأعاد السلاطين العثمانيون سليمان القانوني ومراد الثالث ومراد الرابع بناء مرقده.",
            "ادخل وارفع نظرك: القبة من الداخل مكسوّة بأعمال المرايا الدقيقة. وفي الخارج امشِ في ما بين الحرمين، الساحة الممتدة بين هذا المرقد ومرقد الإمام الحسين."),

        ["Al-Ukhaidir Fortress"] = new(
            "A desert palace from 775",
            "Isa ibn Musa, a nephew of the first Abbasid caliph, built this fortress-palace in 775. Gertrude Bell surveyed it in the early 20th century and wrote the first major report on it.",
            "Find the great iwan, the vaulted reception hall, and walk the inner corridors to see how many different kinds of arch the builders used.",
            "قصر صحراوي من سنة 775",
            "بنى عيسى بن موسى، ابن أخي أول الخلفاء العباسيين، هذا القصر الحصين سنة 775. ومسحته غيرترود بيل في أوائل القرن العشرين وكتبت أول تقرير مفصّل عنه.",
            "ابحث عن الإيوان الكبير، قاعة الاستقبال المقببة، وامشِ في الأروقة الداخلية لترى كم نوعًا من الأقواس استخدمه البنّاؤون."),

        // ------------------------------------------------------------- Babylon
        ["Ancient City of Babylon"] = new(
            "A military base on the ruins",
            "In 2003 a military base, Camp Alpha, was built on the ancient city, with a helipad among the ruins; it drew wide criticism for the damage. In 2019 Babylon became a UNESCO World Heritage Site.",
            "Walk part of the Processional Way, the ceremonial road that led to the Ishtar Gate.",
            "قاعدة عسكرية فوق الأطلال",
            "في سنة 2003 أُقيمت قاعدة عسكرية باسم «كامب ألفا» فوق المدينة القديمة، فيها مهبط للمروحيات بين الأطلال، وتعرّضت لانتقاد واسع بسبب الأضرار. وفي سنة 2019 أُدرجت بابل في قائمة التراث العالمي لليونسكو.",
            "امشِ جزءًا من شارع الموكب، الطريق الاحتفالي الذي كان يقود إلى بوابة عشتار."),

        ["Ishtar Gate (Reconstruction)"] = new(
            "Three animals, three gods",
            "The original gate, built around 569 BC for Nebuchadnezzar II, now stands in Berlin, and German excavators took 118 of the 120 lion panels from the Processional Way. This smaller replica was finished in 1987.",
            "Look for the three animals: dragons for Marduk, aurochs (wild bulls) for Adad, and lions for Ishtar, set against blue glaze made to look like lapis lazuli.",
            "ثلاثة حيوانات لثلاثة آلهة",
            "البوابة الأصلية، التي بُنيت نحو سنة 569 ق.م لنبوخذنصر الثاني، قائمة اليوم في برلين، وأخذ المنقّبون الألمان 118 من لوحات الأسود الـ120 في شارع الموكب. أما هذه النسخة الأصغر فاكتملت سنة 1987.",
            "ابحث عن الحيوانات الثلاثة: التنين لمردوخ، والثور البري لأدد، والأسد لعشتار، على خلفية زرقاء مزججة تحاكي اللازورد."),

        ["Nebuchadnezzar's Southern Palace"] = new(
            "Two kings’ names in the bricks",
            "The walls you walk between were rebuilt on the ancient footprint from 1978 onwards: 250 rooms around five courtyards. Saddam Hussein had his name stamped into the new bricks, as Nebuchadnezzar had done in the old ones.",
            "Look down at the lower walls for bricks stamped with inscriptions, and compare the ancient courses near the ground with the new ones above.",
            "اسما ملكين في الطابوق",
            "أُعيد بناء الجدران التي تمشي بينها فوق مخطط القصر القديم منذ سنة 1978: 250 غرفة حول خمسة أفنية. وختم صدام حسين اسمه على الطابوق الجديد، كما فعل نبوخذنصر في الطابوق القديم.",
            "انظر إلى الجدران السفلى لترى الطابوق المختوم بالكتابات، وقارن بين الصفوف القديمة قرب الأرض والجديدة فوقها."),

        ["Lion of Babylon"] = new(
            "A lion over a man",
            "The statue is carved from black basalt, about two metres long on a one-metre platform. It shows a lion standing over a man lying on his back.",
            "Look for the hollow on the lion’s back, which may once have held a saddle or a figure of Ishtar. The base and the barrier are newer, from a 2013 restoration.",
            "أسد فوق رجل",
            "نُحت التمثال من البازلت الأسود، وطوله نحو مترين فوق منصة ارتفاعها متر. ويصوّر أسدًا واقفًا فوق رجل مستلقٍ على ظهره.",
            "ابحث عن التجويف في ظهر الأسد، فربما حمل يومًا سرجًا أو تمثالًا لعشتار. أما القاعدة والحاجز فأحدث عهدًا، من ترميم سنة 2013."),

        ["Borsippa (Birs Nimrud)"] = new(
            "The other Tower of Babel",
            "Later Arabic tradition identified this ziggurat with the Tower of Babel; it was really built for the god Nabu. Even in ruin it rises 52 metres over the flat plain, from a planned 70 metres in seven terraces.",
            "Look for stamped mud-bricks bonded with bitumen, and for the patches of modern cement on top, left by later repairs.",
            "برج بابل الآخر",
            "ربطت الروايات العربية المتأخرة هذه الزقورة ببرج بابل، لكنها بُنيت في الحقيقة للإله نابو. وما زالت ترتفع 52 مترًا فوق السهل المنبسط رغم خرابها، وكان مخططًا لها أن تبلغ 70 مترًا في سبع مصاطب.",
            "ابحث عن اللبن المختوم والمثبّت بالقار، وعن بقع الإسمنت الحديث في الأعلى من ترميمات لاحقة."),

        ["Kish (Tell Uhaimir)"] = new(
            "Where kingship came down from heaven",
            "The Sumerian King List says that after the flood, kingship descended from heaven and was first in Kish. The temple of its god Zababa stood here at Uhaimir.",
            "The site spreads over about 40 mounds and 24 square kilometres, split by the dry bed of the Euphrates. Leave any pottery you see where it lies.",
            "حيث نزلت الملكية من السماء",
            "يذكر ثبت الملوك السومريين أن الملكية بعد الطوفان نزلت من السماء وكانت أولًا في كيش. وكان معبد إلهها زبابا قائمًا هنا في تل الأحيمر.",
            "يمتد الموقع على نحو 40 تلًّا ومساحة 24 كيلومترًا مربعًا، ويشقّه مجرى الفرات القديم الجاف. اترك أي كسرة فخار تراها في مكانها."),
    };
}

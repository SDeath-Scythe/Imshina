using Microsoft.EntityFrameworkCore;
using TourIraq.Api.Models;

namespace TourIraq.Api.Data;

/// Idempotent demo seed. Every block checks whether its data already exists.
/// NOTE: coordinates are approximate. Verify them on a map before a live demo.
public static class SeedData
{
    private const string DemoPassword = "Demo@1234"; // LOCAL DEMO ONLY
    private static readonly Dictionary<string, string> ArabicGovernorateDescriptions = new()
    {
        ["Baghdad"] = "بغداد عاصمة العراق، أسسها الخليفة العباسي أبو جعفر المنصور سنة 762م. كانت مركزًا عالميًا للعلم والأدب، وتمزج اليوم بين آثار العصر العباسي وأسواق الكتب النابضة والمراقد المقدسة على ضفاف دجلة.",
        ["Najaf"] = "إحدى أقدس المدن لدى المسلمين الشيعة، وفيها مرقد الإمام علي ومقبرة تاريخية واسعة ومركز للعلوم الإسلامية منذ أكثر من ألف عام.",
        ["Karbala"] = "مدينة رئيسية للزيارة، شهدت واقعة كربلاء سنة 680م وتستضيف زيارة الأربعين، إحدى أكبر التجمعات السنوية في العالم. وتضم المحافظة أيضًا حصن الأخيضر العباسي.",
        ["Babylon"] = "تضم آثار مدينة بابل القديمة، المدرجة على قائمة التراث العالمي لليونسكو منذ عام 2019، إلى جانب مدينتي بورسيبا وكيش القريبتين اللتين أسهمتا في تشكيل حضارة بلاد الرافدين."
    };
    private static readonly Dictionary<string, (string Short, string Full)> ArabicPlaceDescriptions = new()
    {
        ["Al-Kadhimiya Shrine"] = ("مرقد ذو قباب ذهبية للإمامين موسى الكاظم ومحمد الجواد.", "يضم مجمع الكاظمية المقدس في شمال بغداد مرقد الإمام موسى الكاظم، الإمام السابع، وحفيده الإمام محمد الجواد، الإمام التاسع. ويشتهر بقبابه المذهبة ومآذنه العالية وأفنيته المزخرفة، ولا يزال مقصدًا نشطًا للزيارة."),
        ["Al-Mustansiriya School"] = ("مدرسة عباسية من القرن الثالث عشر، ومن أقدم الجامعات في العالم.", "أسس الخليفة العباسي المستنصر المدرسة المستنصرية لتكون مركزًا مهمًا للتعليم، حيث دُرّست فيها المذاهب الفقهية السنية الأربعة وعلوم أخرى. وتُعد واجهتها الآجرية ونقوشها وفناؤها من أبرز نماذج العمارة العباسية المتأخرة في بغداد."),
        ["Abbasid Palace"] = ("قصر عباسي نادر بقيت معالمه قرب نهر دجلة.", "يُعد القصر العباسي من المباني العباسية القليلة في بغداد التي بقيت واضحة المعالم. وتُظهر قاعاته المقببة وأفنيته وآجُره أسلوب العمارة في أواخر العصر العباسي."),
        ["Al-Mutanabbi Street"] = ("شارع بغداد التاريخي للكتب والمقاهي الأدبية.", "يُعد شارع المتنبي قلب تجارة الكتب في بغداد. وسُمّي باسم الشاعر أبي الطيب المتنبي من القرن العاشر، ويزدحم خصوصًا صباح الجمعة بالباعة والكتّاب والطلاب ورواد المقاهي القريبة، ومنها مقهى الشابندر التاريخي."),
        ["Iraq National Museum"] = ("مجموعة بارزة من آثار حضارات بلاد الرافدين.", "يضم المتحف الوطني العراقي كنوزًا من حضارات سومر وأكد وبابل وآشور، منها ألواح مسمارية وقطع ملكية ومنحوتات ضخمة توثق آلاف السنين من تاريخ الإنسان."),
        ["Imam Ali Shrine"] = ("المرقد ذو القبة الذهبية للإمام علي، في قلب مدينة النجف المقدسة.", "يُعد مرقد الإمام علي من أقدس المواقع لدى المسلمين الشيعة، ويضم ضريح الإمام علي بن أبي طالب، ابن عم النبي محمد وزوج ابنته وأول الأئمة عند الشيعة. وتجذب قبته الذهبية وأواوينه المزخرفة وقاعاته ذات المرايا ملايين الزوار سنويًا."),
        ["Wadi al-Salam Cemetery"] = ("من أكبر المقابر في العالم، بجوار مرقد الإمام علي.", "تمتد مقبرة وادي السلام على مساحة واسعة شمال مرقد الإمام علي. وقد اختار مسلمون من بلدان كثيرة أن يُدفنوا فيها على مدى قرون، مما جعلها من أكبر المقابر في العالم."),
        ["Great Mosque of Kufa"] = ("من أقدم مساجد العالم، في مدينة الكوفة الإسلامية المبكرة.", "تأسس مسجد الكوفة الكبير في السنوات الأولى للإسلام، بعد إنشاء الكوفة مدينةً عسكرية. ويرتبط اسمه بالإمام علي الذي اتخذ الكوفة عاصمة له، ويضم عددًا من المقامات ومواضع الصلاة الموقرة."),
        ["Najaf Old City"] = ("أزقة وأسواق ومدارس دينية تحيط بمرقد الإمام علي.", "تحيط المدينة القديمة في النجف بالمرقد، وتضم أزقة متعرجة وأسواقًا تقليدية ومدارس دينية. وهي مركز علمي حي يدرس فيه الطلاب ورجال الدين منذ قرون."),
        ["Imam Husayn Shrine"] = ("مرقد الإمام الحسين، مقصد زوار الأربعين.", "يقع مرقد الإمام الحسين في كربلاء ويضم ضريح الإمام الحسين بن علي، حفيد النبي محمد، الذي قُتل سنة 680م. وتستقبل قبته الذهبية وأفنيته الواسعة ملايين الزوار كل عام، ولا سيما في عاشوراء والأربعين."),
        ["Al-Abbas Shrine"] = ("مرقد العباس بن علي، أخي الإمام الحسين وحامل لوائه.", "يقع مرقد العباس على مسافة قصيرة سيرًا من مرقد الإمام الحسين. ويخلّد ذكرى العباس بن علي، أخي الإمام الحسين، المعروف بولائه وشجاعته في كربلاء. ويشتهر المرقد بقبته المذهبة وزخارفه الداخلية العاكسة."),
        ["Al-Ukhaidir Fortress"] = ("قصر عباسي محصّن في الصحراء جنوب غربي كربلاء.", "الأخيضر قصر محصّن واسع بقي بحالة جيدة في الصحراء. وتجعله أسواره الضخمة وأبراجه وقاعاته المقببة وأفنيته من أفضل المباني العباسية المبكرة حفظًا في العراق."),
        ["Ancient City of Babylon"] = ("آثار عاصمة حمورابي ونبوخذنصر الثاني، المدرجة على قائمة التراث العالمي لليونسكو.", "كانت بابل واحدة من أعظم مدن العالم القديم. ويمكن للزوار التجول بين الأسوار والبوابات المعاد بناؤها وطرق المواكب وأفنية القصور قرب نهر الفرات. أُدرجت بابل على قائمة التراث العالمي لليونسكو سنة 2019."),
        ["Ishtar Gate (Reconstruction)"] = ("إعادة بناء لبوابة بابل القديمة المزينة بالآجر المزجج.", "بُنيت بوابة عشتار الأصلية نحو سنة 575 قبل الميلاد في عهد نبوخذنصر الثاني، وزُينت بآجر أزرق مزجج ونقوش للتنانين والثيران. يوجد معظم الأصل اليوم في متحف بيرغامون ببرلين، بينما تقف إعادة بناء للبوابة في موقع بابل."),
        ["Nebuchadnezzar's Southern Palace"] = ("مجمع قصري واسع لنبوخذنصر الثاني يضم أفنية وقاعة للعرش.", "كان القصر الجنوبي مقر الإقامة الملكية الرئيسي ومركز الإدارة في بابل خلال العصر البابلي الحديث. وتعطي أفنيته وقاعة العرش الكبيرة تصورًا عن حجم السلطة الملكية في القرن السادس قبل الميلاد."),
        ["Lion of Babylon"] = ("تمثال أسد بازلتي قديم في موقع بابل الأثري.", "أسد بابل منحوتة كبيرة من البازلت لأسد يقف فوق هيئة إنسان. عُثر عليه في بابل ويعود إلى العصر البابلي الحديث، ولا يزال من أشهر رموز المدينة."),
        ["Borsippa (Birs Nimrud)"] = ("مدينة قديمة تضم زقورة مكرسة للإله نابو قرب الحلة.", "كانت بورسيبا مدينة شقيقة لبابل. ويحفظ تلّها المرتفع، المعروف باسم بُرس نمرود، بقايا مجمع معبد إزيدا وزقورة الإله نابو. وربطها التراث المحلي منذ زمن طويل ببرج بابل."),
        ["Kish (Tell Uhaimir)"] = ("مدينة سومرية مبكرة ورد ذكر ملوكها في قائمة الملوك السومرية.", "كانت كيش من أقدم مدن بلاد الرافدين القديمة وأكثرها أهمية. وتضم تلال تل الأحيمر والتلال المجاورة بقايا قصور ومعابد وزقورة تعود إلى الألف الثالث قبل الميلاد.")
    };
    private const string GeneralSafetyAr = "تحقّق من إرشادات السفر والظروف المحلية قبل الزيارة، واتبع تعليمات العاملين وأفراد الأمن. قد تتغير ساعات العمل؛ لذا يُستحسن التأكد منها محليًا.";
    private const string ModestSafetyAr = "يُرجى ارتداء ملابس محتشمة تغطي الكتفين والركبتين، وتغطية الشعر في المراقد عند الاقتضاء؛ تتوفر العباءات غالبًا عند المدخل. اخلع الحذاء حيث يُطلب منك ذلك، واستأذن قبل تصوير الأشخاص.";
    private static readonly Dictionary<string, (string Safety, string Tips)> ArabicPlaceGuidance = new()
    {
        ["Al-Kadhimiya Shrine"] = ($"{ModestSafetyAr} {GeneralSafetyAr}", "يُستحسن أن يستفسر الزوار غير المسلمين من العاملين عن قواعد الدخول. تكون الزيارة في الصباح الباكر أهدأ عادةً."),
        ["Al-Mustansiriya School"] = (GeneralSafetyAr, "استأذن قبل التصوير في الداخل؛ فقد تكون بعض أجزاء المبنى مغلقة أمام الزوار."),
        ["Abbasid Palace"] = (GeneralSafetyAr, "يختلف الباحثون حول تاريخ المبنى ووظيفته الأصلية؛ لذلك قد يقدم المرشدون روايات مختلفة."),
        ["Al-Mutanabbi Street"] = (GeneralSafetyAr, "يكون الشارع أكثر ازدحامًا وأجواءً صباح الجمعة. وغالبًا ما تكون أسعار الكتب قابلة للتفاوض."),
        ["Iraq National Museum"] = (GeneralSafetyAr, "تحقق مسبقًا من أيام الزيارة والتذاكر؛ فقد يفتح المتحف أحيانًا للمجموعات بالحجز فقط."),
        ["Imam Ali Shrine"] = ($"{ModestSafetyAr} {GeneralSafetyAr}", "يُستحسن أن يستفسر الزوار غير المسلمين من الأمن عن قواعد الدخول. قد تُقيّد الحقائب والهواتف عند المداخل."),
        ["Wadi al-Salam Cemetery"] = ($"تعامل مع المقبرة باحترام كبير، ولا تصوّر المعزين أو الجنازات. {GeneralSafetyAr}", "زُر المكان برفقة مرشد محلي يشرح عادات المقبرة وتاريخها."),
        ["Great Mosque of Kufa"] = ($"{ModestSafetyAr} {GeneralSafetyAr}", "اطلب من العاملين إرشادك إلى مواضع الصلاة الرئيسية والتقاليد المرتبطة بها."),
        ["Najaf Old City"] = ($"{ModestSafetyAr} {GeneralSafetyAr}", "تُعد الأسواق مكانًا مناسبًا لشراء المسابح والتمور والحلويات المحلية. فاوض بلطف."),
        ["Imam Husayn Shrine"] = ($"{ModestSafetyAr} {GeneralSafetyAr}", "تزدحم المدينة كثيرًا في عاشوراء والأربعين؛ لذا خطط للإقامة والتنقل قبل وقت كافٍ."),
        ["Al-Abbas Shrine"] = ($"{ModestSafetyAr} {GeneralSafetyAr}", "المشي بين المرقدين جزء شائع من تجربة الزيارة."),
        ["Al-Ukhaidir Fortress"] = ($"الموقع ناءٍ ويقع في منطقة صحراوية مفتوحة. اذهب مع مرشد وسائق يعرف الطريق، واحمل الماء وتجنب حر الظهيرة. {GeneralSafetyAr}", "توفر الزيارة في الصباح الباكر أو آخر النهار إضاءة جميلة وطقسًا ألطف للتصوير."),
        ["Ancient City of Babylon"] = ($"الموقع واسع ومكشوف مع قلة الظل؛ أحضر الماء وواقي الشمس وانتعل حذاءً مريحًا للمشي. {GeneralSafetyAr}", "أُعيد بناء كثير من المنشآت الحديثة فوق أساسات قديمة. اسأل مرشدك لتمييز الأجزاء الأصلية."),
        ["Ishtar Gate (Reconstruction)"] = ($"الأرض غير مستوية والشمس قوية؛ ارتدِ حذاءً متينًا. {GeneralSafetyAr}", "تأمل النقوش الحيوانية للثيران والتنانين على جدران البوابة المعاد بناؤها."),
        ["Nebuchadnezzar's Southern Palace"] = ($"الموقع واسع ومكشوف؛ أحضر الماء. {GeneralSafetyAr}", "أُعيد بناء أجزاء من القصر في العصر الحديث؛ اطلب من المرشد تمييز الآجر الأصلي من المعاد بناؤه."),
        ["Lion of Babylon"] = ($"الموقع واسع ومكشوف؛ أحضر الماء. {GeneralSafetyAr}", "يُستخدم التمثال كثيرًا كمعلم للتصوير؛ زُره مبكرًا لتجنب الازدحام."),
        ["Borsippa (Birs Nimrud)"] = ($"الموقع تلّ ناءٍ وأرضه غير مستوية؛ اذهب مع مرشد وأحضر الماء. {GeneralSafetyAr}", "الربط بين الموقع وبرج بابل رواية تراثية وليس اكتشافًا أثريًا مثبتًا."),
        ["Kish (Tell Uhaimir)"] = ($"الموقع تلال أثرية نائية وخدماته محدودة؛ زُره برفقة مرشد. {GeneralSafetyAr}", "تُناسب الزيارة المسافرين المهتمين بتاريخ بلاد الرافدين المبكر.")
    };
    private static readonly Dictionary<string, (string Title, string Summary, string Details)> ArabicHistoricalStories = new()
    {
        ["Burial of Imam Musa al-Kadhim"] = ("دفن الإمام موسى الكاظم", "توفي الإمام السابع في بغداد ودُفن هنا.", "توفي الإمام موسى الكاظم في بغداد سنة 799م (183هـ)، ودُفن في المقبرة التي تحولت لاحقًا إلى منطقة الكاظمية. ودُفن حفيده الإمام محمد الجواد إلى جواره سنة 835م، ولذلك عُرف المرقد بمرقد الإمامين الكاظمين."),
        ["Foundation of the Mustansiriya"] = ("تأسيس المدرسة المستنصرية", "بدأ البناء في عهد الخليفة المستنصر.", "بدأ بناء المدرسة المستنصرية سنة 1227م، وافتُتحت في أوائل ثلاثينيات القرن الثالث عشر. وشُيّدت قرب نهر دجلة، واستقطبت طلابًا وعلماء من أنحاء العالم الإسلامي حتى اجتياح المغول لبغداد سنة 1258م."),
        ["A surviving Abbasid building"] = ("مبنى عباسي باقٍ", "يُؤرَّخ المبنى عادةً إلى أواخر العصر العباسي.", "يُؤرَّخ المبنى عادةً إلى أواخر العصر العباسي، تقريبًا بين القرنين الثاني عشر والثالث عشر. ولا يزال المؤرخون والآثاريون يناقشون تاريخه الدقيق والجهة التي أمرت ببنائه ووظيفته الأصلية."),
        ["Street named after al-Mutanabbi"] = ("شارع يحمل اسم المتنبي", "سُمّي الشارع باسم الشاعر الشهير الذي توفي سنة 965م.", "يُعد أبو الطيب المتنبي من أشهر شعراء الأدب العربي، وتوفي سنة 965م. ويحمل الشارع اسمه رمزًا للتقاليد الأدبية العريقة في بغداد."),
        ["Looting and reopening"] = ("نهب المتحف وإعادة افتتاحه", "تعرض المتحف للنهب سنة 2003 وأُعيد افتتاحه للجمهور سنة 2015.", "تعرض المتحف للنهب في أبريل 2003 خلال حرب العراق، وسُرقت آلاف القطع. واستُعيد كثير منها لاحقًا بمساعدة دولية، ثم أُعيد افتتاح المتحف للجمهور سنة 2015."),
        ["Death and burial of Imam Ali"] = ("وفاة الإمام علي ودفنه", "توفي الإمام علي سنة 661م ودُفن في النجف.", "تعرض الإمام علي لهجوم في الكوفة سنة 661م (40هـ) وتوفي متأثرًا بجراحه. ووفقًا للتقاليد الشيعية، دُفن سرًا في الموقع الذي أصبحت فيه النجف، ثم نشأت حول ضريحه مدينة للزيارة."),
        ["A burial ground for centuries"] = ("مقبرة عبر القرون", "تتواصل الدفنات في هذا المكان منذ قرون وحتى اليوم.", "لقرب وادي السلام من مرقد الإمام علي، رغب كثير من المؤمنين في أن يُدفنوا فيه. ويصعب تحديد بدايته بدقة، ولا تزال الدفنات تُجرى فيه حتى اليوم."),
        ["Founding of the Kufa mosque"] = ("تأسيس مسجد الكوفة", "أُنشئ المسجد بعد تأسيس مدينة الكوفة بوقت قصير.", "تأسست الكوفة نحو سنة 638م (17هـ)، وبُني مسجدها الأول في وسط المدينة الجديدة. وفي سنة 656م اتخذ الإمام علي الكوفة عاصمة للخلافة. ووفقًا للتقاليد، تعرض للهجوم أثناء الصلاة هنا سنة 661م."),
        ["A centre of Islamic scholarship"] = ("مركز للعلوم الإسلامية", "خرّجت مدارس النجف علماء لنحو ألف عام.", "لطالما كانت حوزة النجف من أهم مراكز التعليم الشيعي، وما زالت تستقطب طلابًا من بلدان كثيرة."),
        ["Battle of Karbala"] = ("واقعة كربلاء", "قُتل الإمام الحسين وأصحابه في العاشر من محرم سنة 61هـ.", "في سنة 680م (10 محرم 61هـ)، قُتل الإمام الحسين بن علي ومجموعة من أفراد أسرته وأصحابه قرب كربلاء على يد قوات الخليفة الأموي يزيد الأول. وتُحيى ذكرى الواقعة كل عام في عاشوراء، وتقام زيارة الأربعين بعد أربعين يومًا."),
        ["Abbas ibn Ali at Karbala"] = ("العباس بن علي في كربلاء", "حمل العباس بن علي الراية وقُتل في واقعة كربلاء.", "يُذكر العباس بن علي بوصفه حامل راية معسكر الإمام الحسين، وقد قُتل في واقعة كربلاء سنة 680م."),
        ["Construction of the fortress"] = ("بناء الحصن", "بُني الحصن نحو سنة 775م ويُنسب إلى عيسى بن موسى.", "يعود تاريخ الحصن عمومًا إلى نحو سنة 775م، ويُنسب إلى عيسى بن موسى، ابن أخ الخليفة العباسي المنصور. ولا يزال الباحثون يناقشون غرضه الدقيق: أكان قصرًا أم حصنًا أم محطة للقوافل."),
        ["Reign of Hammurabi"] = ("حكم حمورابي", "جعل حمورابي بابل قوة بارزة وأصدر شريعة شهيرة.", "حكم حمورابي بابل تقريبًا من سنة 1792 إلى 1750 قبل الميلاد. ونُقشت شريعته الشهيرة على مسلة نُقلت لاحقًا إلى سوسة، وهي معروضة اليوم في متحف اللوفر."),
        ["Nebuchadnezzar II rebuilds Babylon"] = ("نبوخذنصر الثاني يعيد بناء بابل", "حكم نبوخذنصر الثاني من 605 إلى 562 قبل الميلاد وحوّل المدينة.", "بنى نبوخذنصر الثاني القصور والمعابد والأسوار أو أعاد بناءها، وأنشأ طريق الموكب. وقد وصف كتّاب يونانيون الحدائق المعلقة الشهيرة، لكن الآثار لم تثبت وجودها أو موقعها."),
        ["Construction of the Ishtar Gate"] = ("بناء بوابة عشتار", "بُنيت نحو سنة 575 قبل الميلاد مدخلًا احتفاليًا للمدينة.", "كانت البوابة تؤدي إلى طريق الموكب الذي سارت عليه تماثيل الآلهة خلال احتفالات رأس السنة."),
        ["The royal palace of Babylon"] = ("القصر الملكي في بابل", "كان مقر حكم نبوخذنصر الثاني.", "بُني مجمع القصر ووُسّع في عهد نبوخذنصر الثاني، وكان مركزًا سياسيًا واحتفاليًا للإمبراطورية البابلية الحديثة."),
        ["The Lion statue"] = ("تمثال الأسد", "منحوتة شهيرة من بابل.", "لا يزال الغرض الأصلي من التمثال موضع نقاش بين الباحثين؛ ومن التفسيرات المطروحة أنه رمز للسلطة الملكية أو نصب للحماية."),
        ["Temple of Nabu"] = ("معبد نابو", "كان معبد إزيدا، المكرس للإله نابو، مركزًا دينيًا مهمًا.", "ارتبط معبد نابو في بورسيبا بعبادة مردوخ في بابل، وكانت المدينتان وثيقتي الصلة في الاحتفالات الدينية."),
        ["Kish in the Sumerian King List"] = ("كيش في قائمة الملوك السومرية", "تروي الأسطورة أن الملكية نزلت إلى كيش بعد الطوفان.", "تذكر قائمة الملوك السومرية، وهي نص مدرسي دُوّن في زمن لاحق، أن الملكية نزلت من السماء إلى كيش بعد الطوفان. وهذه رواية تراثية وليست حقيقة تاريخية مثبتة.")
    };

    public static async Task InitializeAsync(AppDbContext db)
    {
        await using var tx = await db.Database.BeginTransactionAsync();

        await SeedUsersAsync(db);
        await SeedPlacesAsync(db);
        await SeedGuidesAsync(db);
        await SeedPartnersAndRewardsAsync(db);
        await SeedTripsAndGroupsAsync(db);
        await SeedBookingsAndReviewsAsync(db);

        await tx.CommitAsync();
    }

    // ------------------------------------------------------------------ users
    private static async Task<User> EnsureUserAsync(AppDbContext db, string name, string email,
        UserRole role, Gender gender, string country, string language)
    {
        email = email.Trim().ToLowerInvariant();
        var existing = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (existing is not null) return existing;

        var user = new User
        {
            FullName = name,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(DemoPassword, 10),
            Role = role,
            Gender = gender,
            Country = country,
            PreferredLanguage = language,
            IsVerified = true,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    private static async Task SeedUsersAsync(AppDbContext db)
    {
        await EnsureUserAsync(db, "Sarah Johnson", "tourist@touriraq.demo", UserRole.Tourist, Gender.Female, "United Kingdom", "English");
        await EnsureUserAsync(db, "James Miller", "tourist.male@touriraq.demo", UserRole.Tourist, Gender.Male, "Canada", "English");
        await EnsureUserAsync(db, "Rafidain Travel Office", "agency@touriraq.demo", UserRole.Agency, Gender.Male, "Iraq", "Arabic");
        await EnsureUserAsync(db, "System Admin", "admin@touriraq.demo", UserRole.Admin, Gender.Male, "Iraq", "English");
    }

    // ----------------------------------------------------------------- places
    private static async Task SeedPlacesAsync(AppDbContext db)
    {
        if (await db.Governorates.AnyAsync())
        {
            await BackfillArabicDescriptionsAsync(db);
            await FixPlaceCoordinatesAsync(db);
            return;
        }

        var baghdad = new Governorate
        {
            Name = "Baghdad",
            NameAr = "بغداد",
            Description = "Iraq's capital, founded in 762 CE by the Abbasid caliph al-Mansur. Once a global centre of science and literature, today it blends Abbasid monuments, bustling book markets and sacred shrines along the Tigris.",
            DescriptionAr = ArabicGovernorateDescriptions["Baghdad"]
        };
        var najaf = new Governorate
        {
            Name = "Najaf",
            NameAr = "النجف",
            Description = "One of the holiest cities in Shia Islam, home to the shrine of Imam Ali, a vast historic cemetery and a centre of Islamic scholarship for over a thousand years.",
            DescriptionAr = ArabicGovernorateDescriptions["Najaf"]
        };
        var karbala = new Governorate
        {
            Name = "Karbala",
            NameAr = "كربلاء",
            Description = "A major pilgrimage city, site of the Battle of Karbala in 680 CE and host of the Arbaeen pilgrimage, one of the largest annual gatherings in the world. The governorate also contains the Abbasid fortress of Al-Ukhaidir.",
            DescriptionAr = ArabicGovernorateDescriptions["Karbala"]
        };
        var babylon = new Governorate
        {
            Name = "Babylon",
            NameAr = "بابل",
            Description = "Home to the ruins of ancient Babylon, a UNESCO World Heritage Site since 2019, along with nearby Borsippa and Kish, cities that shaped Mesopotamian civilisation.",
            DescriptionAr = ArabicGovernorateDescriptions["Babylon"]
        };
        db.Governorates.AddRange(baghdad, najaf, karbala, babylon);

        const string modest = "Dress modestly (covered shoulders and knees; women usually cover hair at shrines; abayas are often available at the entrance). Remove shoes where requested. Ask before photographing people.";
        const string general = "Check current travel advisories and local conditions before visiting, and follow instructions from site staff and security. Opening hours can change; confirm locally.";

        Place P(Governorate g, string name, string nameAr, PlaceCategory cat, double lat, double lng, int radius,
            string shortDesc, string desc, string? safety, string? tips)
        {
            var arabicText = ArabicPlaceDescriptions.GetValueOrDefault(name, (string.Empty, string.Empty));
            var arabicGuidance = ArabicPlaceGuidance.GetValueOrDefault(name, (Safety: string.Empty, Tips: string.Empty));
            return new Place
            {
                Governorate = g,
                Name = name,
                NameAr = nameAr,
                Category = cat,
                Latitude = lat,
                Longitude = lng,
                StampRadiusMeters = radius,
                ShortDescription = shortDesc,
                Description = desc,
                ShortDescriptionAr = arabicText.Item1,
                DescriptionAr = arabicText.Item2,
                SafetyNotes = safety,
                SafetyNotesAr = arabicGuidance.Safety,
                CulturalTips = tips,
                CulturalTipsAr = arabicGuidance.Tips
            };
        }

        HistoricalEvent E(string title, EventType type, int? year, string? era, string summary, string details)
        {
            var arabicStory = ArabicHistoricalStories.GetValueOrDefault(title, (string.Empty, string.Empty, string.Empty));
            return new HistoricalEvent
            {
                Title = title,
                TitleAr = arabicStory.Item1,
                EventType = type,
                Year = year,
                Era = era,
                Summary = summary,
                SummaryAr = arabicStory.Item2,
                Details = details,
                DetailsAr = arabicStory.Item3
            };
        }

        // ---------------- Baghdad ----------------
        var kadhimiya = P(baghdad, "Al-Kadhimiya Shrine", "مرقد الإمامين الكاظمين", PlaceCategory.Religious, 33.3800, 44.3381, 150,
            "Golden-domed shrine of Imam Musa al-Kadhim and Imam Muhammad al-Jawad.",
            "Al-Kadhimiya is a revered Shia shrine complex in northern Baghdad. It holds the tombs of Imam Musa al-Kadhim, the seventh Imam, and his grandson Imam Muhammad al-Jawad, the ninth Imam. The complex is known for its gilded domes, tall minarets and richly decorated courtyards, and it remains an active place of pilgrimage.",
            modest + " " + general, "Non-Muslim visitors should ask staff about access rules. Visiting early in the morning is usually calmer.");
        kadhimiya.HistoricalEvents.Add(E("Burial of Imam Musa al-Kadhim", EventType.Story, 799, "Abbasid era",
            "The seventh Imam died in Baghdad and was buried here.",
            "Imam Musa al-Kadhim died in Baghdad in 799 CE (183 AH) and was buried in the cemetery that later grew into the Kadhimiya district. His grandson Imam Muhammad al-Jawad was buried beside him in 835 CE, which is why the shrine is known as the shrine of the 'two Kadhimayn' Imams."));

        var mustansiriya = P(baghdad, "Al-Mustansiriya School", "المدرسة المستنصرية", PlaceCategory.Heritage, 33.3385, 44.3896, 150,
            "A 13th-century Abbasid college, one of the oldest universities in the world.",
            "Founded by the Abbasid caliph al-Mustansir, the Mustansiriya was a major centre of learning that taught Islamic law across the four Sunni schools and other subjects. Its brick facade, inscriptions and central courtyard are among the finest surviving examples of late Abbasid architecture in Baghdad.",
            general, "Ask permission before photographing inside; parts of the building may be closed to visitors.");
        mustansiriya.HistoricalEvents.Add(E("Foundation of the Mustansiriya", EventType.Construction, 1227, "Late Abbasid era",
            "Construction began under Caliph al-Mustansir.",
            "Construction of the Mustansiriya began in 1227 CE and the college opened in the early 1230s. It stood near the Tigris and attracted students and scholars from across the Islamic world until the Mongol conquest of Baghdad in 1258."));

        var abbasidPalace = P(baghdad, "Abbasid Palace", "القصر العباسي", PlaceCategory.Archaeological, 33.3431, 44.3835, 150,
            "A rare surviving Abbasid-era palace building near the Tigris.",
            "The Abbasid Palace is one of very few Abbasid buildings in Baghdad to survive in a recognisable form. Its vaulted halls, courtyards and brickwork show the architectural style of the late Abbasid period.",
            general, "Scholars debate the exact date and original use of the building, so guides may offer different accounts.");
        abbasidPalace.HistoricalEvents.Add(E("A surviving Abbasid building", EventType.Construction, null, "Late Abbasid era (about 12th to 13th century)",
            "Usually dated to the late Abbasid period.",
            "The building is usually dated to the late Abbasid period, roughly the 12th to 13th century. Its precise date, patron and original function are still discussed by historians and archaeologists."));

        var mutanabbi = P(baghdad, "Al-Mutanabbi Street", "شارع المتنبي", PlaceCategory.Heritage, 33.3414, 44.3866, 150,
            "Baghdad's historic street of booksellers and literary cafes.",
            "Al-Mutanabbi Street is the heart of Baghdad's book trade. It is named after the 10th-century poet al-Mutanabbi and is especially lively on Friday mornings, when booksellers, writers and students fill the street and nearby cafes such as the historic Shahbandar Cafe.",
            general, "Fridays are busiest and most atmospheric. Book prices are often negotiable.");
        mutanabbi.HistoricalEvents.Add(E("Street named after al-Mutanabbi", EventType.Story, 965, "Abbasid era",
            "Named for the celebrated poet who died in 965 CE.",
            "Abu al-Tayyib al-Mutanabbi is among the most celebrated poets in Arabic literature and died in 965 CE. The street carries his name as a symbol of Baghdad's long literary tradition."));

        var museum = P(baghdad, "Iraq National Museum", "المتحف الوطني العراقي", PlaceCategory.Heritage, 33.3283, 44.3854, 150,
            "The world's most important collection of Mesopotamian antiquities.",
            "The Iraq Museum holds treasures from Sumer, Akkad, Babylon and Assyria, including cuneiform tablets, royal artefacts and monumental sculpture spanning thousands of years of human history.",
            general, "Check opening days and ticketing in advance; the museum sometimes opens by appointment for groups.");
        museum.HistoricalEvents.Add(E("Looting and reopening", EventType.Story, 2003, "Modern era",
            "Looted in 2003 and reopened to the public in 2015.",
            "The museum was looted in April 2003 during the Iraq war, and thousands of objects were stolen. Many were later recovered with international help. The museum reopened to the public in 2015."));

        // ---------------- Najaf ----------------
        var imamAli = P(najaf, "Imam Ali Shrine", "مرقد الإمام علي بن أبي طالب", PlaceCategory.Religious, 31.9959, 44.3146, 150,
            "The golden-domed shrine of Imam Ali, centre of the holy city of Najaf.",
            "The Imam Ali Shrine is one of the holiest sites in Shia Islam, holding the tomb of Imam Ali ibn Abi Talib, cousin and son-in-law of the Prophet Muhammad and the first Shia Imam. Its golden dome, tiled iwans and mirrored halls draw millions of pilgrims each year.",
            modest + " " + general, "Non-Muslim visitors should ask security about access rules. Bags and phones may be restricted at entrances.");
        imamAli.HistoricalEvents.Add(E("Death and burial of Imam Ali", EventType.Story, 661, "Rashidun era",
            "Imam Ali died in 661 CE and was buried at Najaf.",
            "Imam Ali was attacked in Kufa in 661 CE (40 AH) and died of his wounds. According to Shia tradition he was buried in secret at the site that became Najaf, which grew into a major pilgrimage city around his tomb."));

        var wadi = P(najaf, "Wadi al-Salam Cemetery", "مقبرة وادي السلام", PlaceCategory.Religious, 32.0172, 44.2975, 500,
            "One of the largest cemeteries in the world, beside the Imam Ali Shrine.",
            "Wadi al-Salam, the Valley of Peace, stretches over a vast area north of the Imam Ali Shrine. Muslims from many countries have chosen to be buried here for centuries, which makes it one of the largest cemeteries in the world.",
            "Treat the cemetery with great respect. Do not photograph mourners or funerals. " + general, "Visit with a local guide who can explain the customs and the history of the cemetery.");
        wadi.HistoricalEvents.Add(E("A burial ground for centuries", EventType.Story, null, "Medieval to modern",
            "Burials here continue today after many centuries.",
            "Because of its closeness to the tomb of Imam Ali, many believers have wished to be buried in Wadi al-Salam. Its exact age is hard to pin down, and burials continue to this day."));

        var kufa = P(najaf, "Great Mosque of Kufa", "مسجد الكوفة", PlaceCategory.Religious, 32.0286, 44.4008, 150,
            "One of the oldest mosques in the world, in the early Islamic garrison city of Kufa.",
            "The Great Mosque of Kufa was founded in the early years of Islam, when Kufa was established as a garrison city. It is associated with Imam Ali, who made Kufa his capital, and contains several revered shrines and prayer places.",
            modest + " " + general, "Ask staff to point out the main prayer spaces and their associated traditions.");
        kufa.HistoricalEvents.Add(E("Founding of the Kufa mosque", EventType.Construction, 638, "Early Islamic era",
            "Established soon after the founding of Kufa.",
            "Kufa was established around 638 CE (17 AH) and its first mosque was built at the centre of the new city. In 656 CE Imam Ali made Kufa the capital of the caliphate. According to tradition, he was attacked while praying here in 661 CE."));

        var najafOld = P(najaf, "Najaf Old City", "مدينة النجف القديمة", PlaceCategory.Heritage, 31.9959, 44.3146, 450,
            "Narrow lanes, bazaars and seminaries around the Imam Ali Shrine.",
            "The old city of Najaf surrounds the shrine with winding alleys, traditional markets and religious schools. It is a living centre of scholarship where students and clerics have studied for centuries.",
            modest + " " + general, "The bazaars are a good place to buy prayer beads, dates and local sweets. Bargain politely.");
        najafOld.HistoricalEvents.Add(E("A centre of Islamic scholarship", EventType.Story, null, "Medieval to modern",
            "Najaf's seminaries have trained scholars for about a thousand years.",
            "The Najaf seminary, known as the Hawza, has long been among the most important centres of Shia learning and attracts students from many countries."));

        // ---------------- Karbala ----------------
        var husayn = P(karbala, "Imam Husayn Shrine", "مرقد الإمام الحسين", PlaceCategory.Religious, 32.6164, 44.0325, 150,
            "The shrine of Imam Husayn, the destination of the Arbaeen pilgrimage.",
            "The Imam Husayn Shrine in Karbala marks the burial place of Imam Husayn ibn Ali, grandson of the Prophet Muhammad, who was killed in 680 CE. Its golden dome and large courtyards receive millions of pilgrims every year, especially during Ashura and Arbaeen.",
            modest + " " + general, "During Ashura and Arbaeen the city is extremely crowded; plan accommodation and transport well in advance.");
        husayn.HistoricalEvents.Add(E("Battle of Karbala", EventType.Battle, 680, "Early Umayyad era",
            "Imam Husayn and his companions were killed on 10 Muharram, 61 AH.",
            "In 680 CE (10 Muharram, 61 AH) Imam Husayn ibn Ali and a small group of family and companions were killed near Karbala by forces of the Umayyad caliph Yazid I. The event is commemorated every year on Ashura, and the Arbaeen pilgrimage takes place forty days later."));

        var abbas = P(karbala, "Al-Abbas Shrine", "مرقد العباس بن علي", PlaceCategory.Religious, 32.6172, 44.0362, 150,
            "Shrine of Abbas ibn Ali, Imam Husayn's half-brother and standard-bearer.",
            "The Al-Abbas Shrine stands a short walk from the Imam Husayn Shrine. It honours Abbas ibn Ali, the half-brother of Imam Husayn, remembered for his loyalty and courage at Karbala. The shrine is known for its mirrored interiors and gilded dome.",
            modest + " " + general, "The walk between the two shrines is a popular part of the pilgrimage experience.");
        abbas.HistoricalEvents.Add(E("Abbas ibn Ali at Karbala", EventType.Story, 680, "Early Umayyad era",
            "Abbas ibn Ali carried the standard and was killed at Karbala.",
            "Abbas ibn Ali is remembered as the standard-bearer of Imam Husayn's camp, and was killed in the Battle of Karbala in 680 CE."));

        var ukhaidir = P(karbala, "Al-Ukhaidir Fortress", "قصر الأخيضر", PlaceCategory.Archaeological, 32.4377, 43.6013, 500,
            "A fortified Abbasid palace in the desert south-west of Karbala.",
            "Al-Ukhaidir is a large, remarkably well-preserved fortified palace in the desert. Its massive walls, towers, vaulted halls and courtyards make it one of the best-preserved early Abbasid buildings in Iraq.",
            "The site is remote and in open desert. Go with a guide and a driver who knows the route, carry water, and avoid the midday heat. " + general,
            "Early morning or late afternoon gives the best light for photography and cooler temperatures.");
        ukhaidir.HistoricalEvents.Add(E("Construction of the fortress", EventType.Construction, 775, "Early Abbasid era",
            "Built around 775 CE and attributed to Isa ibn Musa.",
            "The fortress is generally dated to about 775 CE and is attributed to Isa ibn Musa, a nephew of the Abbasid caliph al-Mansur. Its exact purpose, whether palace, fort or caravan stop, is still discussed by scholars."));

        // ---------------- Babylon ----------------
        var babylonSite = P(babylon, "Ancient City of Babylon", "مدينة بابل الأثرية", PlaceCategory.Archaeological, 32.5425, 44.4211, 500,
            "The ruins of the capital of Hammurabi and Nebuchadnezzar II, a UNESCO World Heritage Site.",
            "Babylon was one of the great cities of the ancient world. Visitors can walk through reconstructed walls and gates, processional ways and palace courtyards at the site beside the Euphrates. Babylon was inscribed on UNESCO's World Heritage List in 2019.",
            "Large open site with little shade; bring water, sun protection and walking shoes. " + general,
            "Many structures are modern reconstructions on top of ancient foundations. Ask your guide which parts are original.");
        babylonSite.HistoricalEvents.Add(E("Reign of Hammurabi", EventType.Story, -1792, "Old Babylonian period",
            "Hammurabi made Babylon a leading power and issued a famous law code.",
            "Hammurabi ruled Babylon from about 1792 to 1750 BCE. The law code that carries his name was inscribed on a stele that was later carried to Susa and is now in the Louvre."));
        babylonSite.HistoricalEvents.Add(E("Nebuchadnezzar II rebuilds Babylon", EventType.Construction, -605, "Neo-Babylonian period",
            "Nebuchadnezzar II reigned from 605 to 562 BCE and transformed the city.",
            "Nebuchadnezzar II built or rebuilt palaces, temples, walls and the Processional Way. The famous Hanging Gardens are described by Greek writers, but their existence and location have not been confirmed archaeologically."));

        var ishtar = P(babylon, "Ishtar Gate (Reconstruction)", "بوابة عشتار", PlaceCategory.Archaeological, 32.5433, 44.4223, 400,
            "A reconstruction of the glazed-brick gateway to ancient Babylon.",
            "The original Ishtar Gate was built around 575 BCE under Nebuchadnezzar II and decorated with blue glazed bricks and reliefs of dragons and bulls. Much of the original is now in the Pergamon Museum in Berlin; a reconstruction stands at the site in Iraq.",
            "Uneven ground and strong sun; wear sturdy shoes. " + general, "Look for the animal reliefs (bulls and dragons) on the walls of the reconstructed gate.");
        ishtar.HistoricalEvents.Add(E("Construction of the Ishtar Gate", EventType.Construction, -575, "Neo-Babylonian period",
            "Built around 575 BCE as a ceremonial entrance to the city.",
            "The gate led onto the Processional Way, along which the statues of gods were carried during the New Year festival."));

        var palace = P(babylon, "Nebuchadnezzar's Southern Palace", "قصر نبوخذنصر الجنوبي", PlaceCategory.Archaeological, 32.5428, 44.4205, 400,
            "Large palace complex of Nebuchadnezzar II with courtyards and throne room.",
            "The Southern Palace was the main royal residence and administrative centre of Neo-Babylonian Babylon. Its courtyards and the large throne room give a sense of the scale of royal power in the 6th century BCE.",
            "Large open site; bring water. " + general, "Part of the palace has been rebuilt in modern times; ask guides to distinguish original and reconstructed brickwork.");
        palace.HistoricalEvents.Add(E("The royal palace of Babylon", EventType.Construction, -605, "Neo-Babylonian period",
            "The seat of Nebuchadnezzar II's government.",
            "Built and expanded during the reign of Nebuchadnezzar II, the palace complex was a political and ceremonial centre of the Neo-Babylonian empire."));

        var lion = P(babylon, "Lion of Babylon", "أسد بابل", PlaceCategory.Archaeological, 32.5450, 44.4213, 300,
            "An ancient basalt lion statue standing within the Babylon site.",
            "The Lion of Babylon is a large basalt sculpture of a lion standing over a human figure, found at Babylon and dated to the Neo-Babylonian period. It remains one of the best-known images of the city.",
            "Large open site; bring water. " + general, "Often used as a landmark for photos; consider visiting early to avoid crowds.");
        lion.HistoricalEvents.Add(E("The Lion statue", EventType.Other, null, "Neo-Babylonian period",
            "A famous sculpture from Babylon.",
            "The statue's original purpose is still discussed by scholars; interpretations include a symbol of royal power or a protective monument."));

        var borsippa = P(babylon, "Borsippa (Birs Nimrud)", "برس نمرود (بورسيبا)", PlaceCategory.Archaeological, 32.3920, 44.3417, 500,
            "An ancient city with a ziggurat dedicated to the god Nabu, near Hillah.",
            "Borsippa was a sister city of Babylon. Its tall mound, known as Birs Nimrud, preserves the remains of the Ezida temple complex and ziggurat of the god Nabu. The site has long been linked in local tradition with the Tower of Babel.",
            "Remote mound site with uneven ground; go with a guide and bring water. " + general, "The link to the Tower of Babel is a tradition rather than an archaeological finding.");
        borsippa.HistoricalEvents.Add(E("Temple of Nabu", EventType.Construction, null, "Neo-Babylonian period",
            "Ezida, the temple of Nabu, was a major religious centre.",
            "Borsippa's temple of Nabu was linked to the cult of Marduk in Babylon, and the two cities were closely connected in religious festivals."));

        var kish = P(babylon, "Kish (Tell Uhaimir)", "كيش (تل الأحيمر)", PlaceCategory.Archaeological, 32.5403, 44.6047, 500,
            "A very early Sumerian city whose rulers were remembered in the Sumerian King List.",
            "Kish was one of the oldest and most important cities of ancient Mesopotamia. The mounds at Tell Uhaimir and nearby tells contain remains of palaces, temples and a ziggurat from the third millennium BCE.",
            "Remote archaeological mounds with limited facilities; go with a guide. " + general, "Best for travellers with a strong interest in early Mesopotamian history.");
        kish.HistoricalEvents.Add(E("Kish in the Sumerian King List", EventType.Story, null, "Early Dynastic period",
            "Tradition says kingship first descended to Kish after the Flood.",
            "The Sumerian King List, a later scribal text, records that kingship was lowered from heaven to Kish after the Flood. It is a traditional account rather than a verified historical record."));

        db.Places.AddRange(kadhimiya, mustansiriya, abbasidPalace, mutanabbi, museum,
            imamAli, wadi, kufa, najafOld, husayn, abbas, ukhaidir,
            babylonSite, ishtar, palace, lion, borsippa, kish);
        await db.SaveChangesAsync();

    }

    // Coordinates checked against Wikipedia and Vici.org in Oct 2026 (see docs/PLACES.md).
    // Databases created before then hold positions up to 4 km off, which made stamping fail on site.
    // A radius of 0 keeps the existing radius.
    private static readonly Dictionary<string, (double Lat, double Lng, int Radius)> CheckedCoordinates = new()
    {
        ["Al-Kadhimiya Shrine"] = (33.3800, 44.3381, 0),
        ["Al-Mustansiriya School"] = (33.3385, 44.3896, 0),
        ["Abbasid Palace"] = (33.3431, 44.3835, 0),
        ["Iraq National Museum"] = (33.3283, 44.3854, 0),
        ["Imam Ali Shrine"] = (31.9959, 44.3146, 0),
        ["Wadi al-Salam Cemetery"] = (32.0172, 44.2975, 0),
        ["Great Mosque of Kufa"] = (32.0286, 44.4008, 0),
        ["Najaf Old City"] = (31.9959, 44.3146, 450),
        ["Al-Abbas Shrine"] = (32.6172, 44.0362, 0),
        ["Al-Ukhaidir Fortress"] = (32.4377, 43.6013, 0),
        ["Ancient City of Babylon"] = (32.5425, 44.4211, 0),
        ["Ishtar Gate (Reconstruction)"] = (32.5433, 44.4223, 0),
        ["Nebuchadnezzar's Southern Palace"] = (32.5428, 44.4205, 0),
        ["Lion of Babylon"] = (32.5450, 44.4213, 0),
        ["Borsippa (Birs Nimrud)"] = (32.3920, 44.3417, 0),
        ["Kish (Tell Uhaimir)"] = (32.5403, 44.6047, 0),
    };

    private static async Task FixPlaceCoordinatesAsync(AppDbContext db)
    {
        var names = CheckedCoordinates.Keys.ToList();
        foreach (var place in await db.Places.Where(p => names.Contains(p.Name)).ToListAsync())
        {
            var (lat, lng, radius) = CheckedCoordinates[place.Name];
            place.Latitude = lat;
            place.Longitude = lng;
            if (radius > 0) place.StampRadiusMeters = radius;
        }
        await db.SaveChangesAsync();
    }

    private static async Task BackfillArabicDescriptionsAsync(AppDbContext db)
    {
        foreach (var governorate in await db.Governorates.ToListAsync())
            if (string.IsNullOrWhiteSpace(governorate.DescriptionAr) && ArabicGovernorateDescriptions.TryGetValue(governorate.Name, out var description))
                governorate.DescriptionAr = description;

        foreach (var place in await db.Places.ToListAsync())
        {
            if (ArabicPlaceDescriptions.TryGetValue(place.Name, out var descriptions))
            {
                if (string.IsNullOrWhiteSpace(place.ShortDescriptionAr)) place.ShortDescriptionAr = descriptions.Short;
                if (string.IsNullOrWhiteSpace(place.DescriptionAr)) place.DescriptionAr = descriptions.Full;
            }
            if (ArabicPlaceGuidance.TryGetValue(place.Name, out var guidance))
            {
                if (string.IsNullOrWhiteSpace(place.SafetyNotesAr)) place.SafetyNotesAr = guidance.Safety;
                if (string.IsNullOrWhiteSpace(place.CulturalTipsAr)) place.CulturalTipsAr = guidance.Tips;
            }
        }

        foreach (var story in await db.HistoricalEvents.ToListAsync())
            if (ArabicHistoricalStories.TryGetValue(story.Title, out var translation))
            {
                if (string.IsNullOrWhiteSpace(story.TitleAr)) story.TitleAr = translation.Title;
                if (string.IsNullOrWhiteSpace(story.SummaryAr)) story.SummaryAr = translation.Summary;
                if (string.IsNullOrWhiteSpace(story.DetailsAr)) story.DetailsAr = translation.Details;
            }

        await db.SaveChangesAsync();
    }

    // ----------------------------------------------------------------- guides
    private static async Task SeedGuidesAsync(AppDbContext db)
    {
        var places = await db.Places.ToDictionaryAsync(p => p.Name);

        async Task EnsureGuide(string name, string email, Gender gender, string country, string bio,
            decimal price, string[] languages, string[] placeNames)
        {
            var user = await EnsureUserAsync(db, name, email, UserRole.Guide, gender, country, languages[0]);
            if (await db.GuideProfiles.AnyAsync(g => g.UserId == user.Id)) return;

            var profile = new GuideProfile { UserId = user.Id, Bio = bio, PricePerDay = price };
            foreach (var l in languages) profile.Languages.Add(new GuideLanguage { Language = l });
            foreach (var pn in placeNames)
                if (places.TryGetValue(pn, out var place))
                    profile.Places.Add(new GuidePlace { PlaceId = place.Id });
            db.GuideProfiles.Add(profile);
            await db.SaveChangesAsync();
        }

        await EnsureGuide("Ali Hassan", "guide.ali@touriraq.demo", Gender.Male, "Iraq",
            "Baghdad-born historian who loves walking visitors through Abbasid monuments, book markets and old Tigris-side neighbourhoods.",
            60m, new[] { "English", "Arabic" },
            new[] { "Al-Kadhimiya Shrine", "Al-Mustansiriya School", "Abbasid Palace", "Al-Mutanabbi Street", "Iraq National Museum" });

        await EnsureGuide("Zainab Karim", "guide.zainab@touriraq.demo", Gender.Female, "Iraq",
            "Specialises in respectful pilgrimage and heritage tours in Najaf and Karbala, with extra support for women travellers.",
            75m, new[] { "English", "Arabic", "Persian" },
            new[] { "Imam Ali Shrine", "Wadi al-Salam Cemetery", "Great Mosque of Kufa", "Najaf Old City", "Imam Husayn Shrine", "Al-Abbas Shrine", "Al-Ukhaidir Fortress" });

        await EnsureGuide("Omar Saad", "guide.omar@touriraq.demo", Gender.Male, "Iraq",
            "Archaeology graduate who has guided visitors around Babylon, Borsippa and Kish for years.",
            70m, new[] { "English", "Arabic", "German" },
            new[] { "Ancient City of Babylon", "Ishtar Gate (Reconstruction)", "Nebuchadnezzar's Southern Palace", "Lion of Babylon", "Borsippa (Birs Nimrud)", "Kish (Tell Uhaimir)" });

        await EnsureGuide("Noor Ahmed", "guide.noor@touriraq.demo", Gender.Female, "Iraq",
            "Cultural guide offering relaxed, family-friendly tours across Baghdad and Babylon.",
            65m, new[] { "English", "Arabic", "French" },
            new[] { "Iraq National Museum", "Al-Mutanabbi Street", "Ancient City of Babylon", "Ishtar Gate (Reconstruction)" });
    }

    // --------------------------------------------------------------- partners
    private static async Task SeedPartnersAndRewardsAsync(AppDbContext db)
    {
        if (await db.Partners.AnyAsync()) return;

        var gov = await db.Governorates.ToDictionaryAsync(g => g.Name);

        var tigris = new Partner { Name = "Tigris Terrace Restaurant (Demo)", Type = PartnerType.Restaurant, Governorate = gov["Baghdad"], Address = "Abu Nuwas Street, Baghdad", Latitude = 33.3220, Longitude = 44.4000 };
        var mansour = new Partner { Name = "Mansour Boutique Hotel (Demo)", Type = PartnerType.Hotel, Governorate = gov["Baghdad"], Address = "Al-Mansour District, Baghdad", Latitude = 33.3140, Longitude = 44.3500 };
        var najafShop = new Partner { Name = "Najaf Old City Gifts (Demo)", Type = PartnerType.Shop, Governorate = gov["Najaf"], Address = "Near the Old City bazaar, Najaf", Latitude = 32.0010, Longitude = 44.3150 };
        var karbalaCafe = new Partner { Name = "Karbala Date Palm Cafe (Demo)", Type = PartnerType.Restaurant, Governorate = gov["Karbala"], Address = "Central Karbala", Latitude = 32.6160, Longitude = 44.0340 };
        var babylonInn = new Partner { Name = "Babylon Gate Guesthouse (Demo)", Type = PartnerType.Hotel, Governorate = gov["Babylon"], Address = "Hillah, Babylon Governorate", Latitude = 32.4800, Longitude = 44.4200 };
        var hillahCrafts = new Partner { Name = "Hillah Crafts Stall (Demo)", Type = PartnerType.Shop, Governorate = gov["Babylon"], Address = "Central Market, Hillah", Latitude = 32.4850, Longitude = 44.4200 };

        db.Partners.AddRange(tigris, mansour, najafShop, karbalaCafe, babylonInn, hillahCrafts);

        db.Rewards.AddRange(
            new Reward { Partner = karbalaCafe, Title = "5% off your meal", DiscountPercent = 5, RequiredStamps = 1 },
            new Reward { Partner = tigris, Title = "10% Restaurant Discount", DiscountPercent = 10, RequiredStamps = 3 },
            new Reward { Partner = babylonInn, Title = "15% off one night", DiscountPercent = 15, RequiredStamps = 5 },
            new Reward { Partner = mansour, Title = "20% off your stay", DiscountPercent = 20, RequiredStamps = 8, ExpiresAt = new DateTime(2027, 12, 31, 0, 0, 0, DateTimeKind.Utc) });

        await db.SaveChangesAsync();
    }

    // ----------------------------------------------------- trips and groups
    private static async Task SeedTripsAndGroupsAsync(AppDbContext db)
    {
        var agency = await db.Users.FirstAsync(u => u.Email == "agency@touriraq.demo");
        var places = await db.Places.ToDictionaryAsync(p => p.Name);

        if (!await db.Trips.AnyAsync(t => t.IsReadyMade))
        {
            Trip T(string title, string desc, int days, decimal price, params string[][] dayPlaces)
            {
                var trip = new Trip { Title = title, Description = desc, DurationDays = days, Price = price, IsReadyMade = true, OwnerId = agency.Id };
                for (var d = 0; d < dayPlaces.Length; d++)
                    for (var i = 0; i < dayPlaces[d].Length; i++)
                        trip.TripPlaces.Add(new TripPlace { PlaceId = places[dayPlaces[d][i]].Id, DayNumber = d + 1, OrderInDay = i + 1 });
                return trip;
            }

            db.Trips.AddRange(
                T("Baghdad Heritage Highlights", "Two days exploring Abbasid Baghdad: the Mustansiriya, the Abbasid Palace, Al-Mutanabbi Street, the National Museum and the Kadhimiya shrine.", 2, 180m,
                    new[] { "Al-Mustansiriya School", "Abbasid Palace", "Al-Mutanabbi Street" },
                    new[] { "Iraq National Museum", "Al-Kadhimiya Shrine" }),
                T("Holy Cities: Najaf and Karbala", "Three days of pilgrimage and heritage in Najaf and Karbala, including Kufa and the desert fortress of Al-Ukhaidir.", 3, 320m,
                    new[] { "Imam Ali Shrine", "Najaf Old City", "Wadi al-Salam Cemetery" },
                    new[] { "Great Mosque of Kufa", "Imam Husayn Shrine", "Al-Abbas Shrine" },
                    new[] { "Al-Ukhaidir Fortress" }),
                T("Ancient Babylon and Beyond", "Two days in Mesopotamia: Babylon's gate, palace and lion, then Borsippa and Kish.", 2, 150m,
                    new[] { "Ancient City of Babylon", "Ishtar Gate (Reconstruction)", "Nebuchadnezzar's Southern Palace", "Lion of Babylon" },
                    new[] { "Borsippa (Birs Nimrud)", "Kish (Tell Uhaimir)" }));
            await db.SaveChangesAsync();
        }

        if (!await db.TourGroups.AnyAsync())
        {
            var holy = await db.Trips.FirstAsync(t => t.Title == "Holy Cities: Najaf and Karbala");
            var start = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(45));
            db.TourGroups.AddRange(
                new TourGroup { Name = "Najaf and Karbala Pilgrimage Group", Description = "A friendly mixed group travelling together with an agency guide.", GenderType = GroupGenderType.Mixed, MaxMembers = 12, CreatorId = agency.Id, TripId = holy.Id, StartDate = start },
                new TourGroup { Name = "Women's Baghdad Heritage Walk", Description = "A women-only walking tour of Baghdad's historic centre.", GenderType = GroupGenderType.WomenOnly, MaxMembers = 8, CreatorId = agency.Id, StartDate = start.AddDays(7) },
                new TourGroup { Name = "Babylon Archaeology Day (Men Only)", Description = "A one-day archaeology-focused trip to Babylon.", GenderType = GroupGenderType.MenOnly, MaxMembers = 10, CreatorId = agency.Id, StartDate = start.AddDays(14) });
            await db.SaveChangesAsync();
        }
    }

    // ------------------------------------------------ bookings and reviews
    private static async Task SeedBookingsAndReviewsAsync(AppDbContext db)
    {
        var tourist = await db.Users.FirstAsync(u => u.Email == "tourist@touriraq.demo");
        if (await db.Bookings.AnyAsync(b => b.UserId == tourist.Id)) return;

        var ali = await db.Users.FirstAsync(u => u.Email == "guide.ali@touriraq.demo");
        var zainab = await db.Users.FirstAsync(u => u.Email == "guide.zainab@touriraq.demo");
        var omar = await db.Users.FirstAsync(u => u.Email == "guide.omar@touriraq.demo");

        Booking B(User guide, decimal price, string start, string end) => new()
        {
            UserId = tourist.Id,
            Type = BookingType.Guide,
            GuideUserId = guide.Id,
            StartDate = DateOnly.Parse(start),
            EndDate = DateOnly.Parse(end),
            TotalPrice = price * (DateOnly.Parse(end).DayNumber - DateOnly.Parse(start).DayNumber + 1),
            Status = BookingStatus.Completed
        };

        var b1 = B(ali, 60m, "2026-03-10", "2026-03-12");
        var b2 = B(zainab, 75m, "2026-04-05", "2026-04-06");
        var b3 = B(omar, 70m, "2026-05-01", "2026-05-02"); // left un-reviewed so the review flow can be demoed
        db.Bookings.AddRange(b1, b2, b3);
        await db.SaveChangesAsync();

        db.GuideReviews.AddRange(
            new GuideReview { GuideUserId = ali.Id, TouristId = tourist.Id, BookingId = b1.Id, Rating = 5, Comment = "Ali made the Mustansiriya and Al-Mutanabbi Street come alive. Great stories and very well organised." },
            new GuideReview { GuideUserId = zainab.Id, TouristId = tourist.Id, BookingId = b2.Id, Rating = 4, Comment = "Respectful, knowledgeable and very helpful at the shrines. I would book again." });
        await db.SaveChangesAsync();

        // Recalculate aggregates from the reviews that actually exist.
        foreach (var profile in await db.GuideProfiles.ToListAsync())
        {
            var ratings = await db.GuideReviews.Where(r => r.GuideUserId == profile.UserId).Select(r => r.Rating).ToListAsync();
            profile.ReviewsCount = ratings.Count;
            profile.AvgRating = ratings.Count == 0 ? 0 : Math.Round(ratings.Average(), 2);
        }
        await db.SaveChangesAsync();
    }
}

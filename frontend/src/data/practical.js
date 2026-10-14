// "Before you go": practical facts for visitors to federal Iraq.
// These change. Each section lists its sources; re-check them all before each release
// and update CHECKED_ON. Last full check: October 2026.

export const CHECKED_ON = '2026-10-14'

export const SECTIONS = [
  {
    id: 'visa', icon: 'ticket',
    title: 'Visa', titleAr: 'التأشيرة',
    points: [
      ['Get an e-visa before you fly. Visa on arrival in federal Iraq ended on 1 March 2025 for most nationalities.',
        'احصل على تأشيرة إلكترونية قبل السفر. أُوقفت التأشيرة عند الوصول إلى العراق الاتحادي لمعظم الجنسيات في 1 آذار 2025.'],
      ['Apply only on the official portal, evisa.iq. It costs about $160 with health insurance included. Sites quoting $250 or more are middlemen.',
        'قدّم فقط عبر البوابة الرسمية evisa.iq. تكلفتها نحو 160 دولارًا وتشمل التأمين الصحي. المواقع التي تطلب 250 دولارًا أو أكثر وسطاء.'],
      ['Approval officially takes 24–72 hours, but allow one to two weeks.',
        'تستغرق الموافقة رسميًا من 24 إلى 72 ساعة، لكن خصّص أسبوعًا إلى أسبوعين.'],
      ['A Kurdistan Region visa doesn’t cover Baghdad, Najaf, Karbala or Babylon.',
        'تأشيرة إقليم كردستان لا تشمل بغداد والنجف وكربلاء وبابل.'],
    ],
    sources: [['Iraq e-visa portal', 'https://evisa.iq'], ['Visa policy of Iraq (Wikipedia)', 'https://en.wikipedia.org/wiki/Visa_policy_of_Iraq']],
  },
  {
    id: 'safety', icon: 'shield',
    title: 'Travel advice and checkpoints', titleAr: 'نصائح السفر ونقاط التفتيش',
    points: [
      ['Read your own government’s travel advice before you book. The UK, for example, advises against all but essential travel to Baghdad, Babil, Najaf and Karbala provinces, and against all travel to Sadr City and Jurf al-Sakr.',
        'اطّلع على نصائح السفر الصادرة عن حكومة بلدك قبل الحجز. فالمملكة المتحدة مثلًا تنصح بعدم السفر إلا للضرورة إلى محافظات بغداد وبابل والنجف وكربلاء، وبعدم السفر مطلقًا إلى مدينة الصدر وجرف الصخر.'],
      ['Travelling against that advice can cancel your travel insurance.',
        'السفر خلافًا لهذه النصائح قد يُبطل تأمين السفر الخاص بك.'],
      ['Checkpoints at city entrances and on main roads are normal. Keep your passport and printed visa with you.',
        'نقاط التفتيش عند مداخل المدن وعلى الطرق الرئيسية أمر طبيعي. احمل جواز سفرك ونسخة مطبوعة من تأشيرتك.'],
    ],
    sources: [['UK travel advice for Iraq', 'https://www.gov.uk/foreign-travel-advice/iraq']],
  },
  {
    id: 'money', icon: 'wallet',
    title: 'Money', titleAr: 'المال',
    points: [
      ['Bring cash. Prices are in Iraqi dinars (IQD), and cards work only in a few upscale hotels.',
        'أحضر نقودًا. الأسعار بالدينار العراقي، والبطاقات لا تعمل إلا في عدد قليل من الفنادق الراقية.'],
      ['US dollars are easy to exchange at the many exchange offices. Euros are harder outside big cities.',
        'يسهل صرف الدولار الأمريكي في مكاتب الصيرفة الكثيرة، أما اليورو فأصعب خارج المدن الكبرى.'],
      ['ATMs take Visa and Mastercard but can be hard to find.',
        'أجهزة الصراف الآلي تقبل فيزا وماستركارد لكن قد يصعب العثور عليها.'],
    ],
    sources: [['Against the Compass: travel guide to Iraq (Sept 2026)', 'https://againstthecompass.com/en/travel-iraq-federal/']],
  },
  {
    id: 'phone', icon: 'phone',
    title: 'Phone and internet', titleAr: 'الهاتف والإنترنت',
    points: [
      ['Buy a local SIM at a phone shop; not every shop sells them, so ask. Zain covers the south well. You may be asked for your passport.',
        'اشترِ شريحة محلية من محل هواتف، فليست كل المحلات تبيعها. شبكة زين تغطي الجنوب جيدًا. قد يُطلب منك جواز السفر.'],
      ['A one-week data plan costs around 10,000 IQD. An eSIM bought before you fly also works.',
        'تكلف باقة إنترنت أسبوعية نحو 10,000 دينار. وتعمل أيضًا الشريحة الإلكترونية (eSIM) التي تشتريها قبل السفر.'],
      ['Signal can be weak at remote sites such as Al-Ukhaidir and Kish. Open the place in Imshina before you lose it.',
        'قد تضعف الإشارة في المواقع البعيدة مثل الأخيضر وكيش. افتح المكان في امشينا قبل أن تفقدها.'],
    ],
    sources: [['Against the Compass: travel guide to Iraq (Sept 2026)', 'https://againstthecompass.com/en/travel-iraq-federal/']],
  },
  {
    id: 'shrines', icon: 'dome',
    title: 'At the shrines', titleAr: 'في المراقد',
    points: [
      ['Women must wear a full abaya at the shrines in Najaf and Karbala. Abayas are often lent at the entrance.',
        'يجب على النساء ارتداء العباءة الكاملة في مراقد النجف وكربلاء، وغالبًا ما تُعار عند المدخل.'],
      ['Everyone should cover shoulders and knees. Take off your shoes where asked, and expect bag checks.',
        'على الجميع تغطية الكتفين والركبتين. اخلع حذاءك حيث يُطلب ذلك، وتوقّع تفتيش الحقائب.'],
      ['Ask before photographing people, and follow staff instructions about cameras inside.',
        'استأذن قبل تصوير الناس، والتزم بتعليمات القائمين على المكان بشأن التصوير في الداخل.'],
    ],
    sources: [['Against the Compass: travel guide to Iraq (Sept 2026)', 'https://againstthecompass.com/en/travel-iraq-federal/']],
  },
  {
    id: 'arbaeen', icon: 'users',
    title: 'Arbaeen and busy dates', titleAr: 'الأربعين والمواسم المزدحمة',
    points: [
      ['Arbaeen brings millions of pilgrims to Karbala. The next one is expected around 25 July 2027; the exact day follows the lunar calendar.',
        'تجلب زيارة الأربعين ملايين الزائرين إلى كربلاء. ويُتوقع موعدها القادم نحو 25 تموز 2027، ويتحدد اليوم بدقة وفق التقويم القمري.'],
      ['In the weeks around it, roads close, hotels fill early and the shrines are extremely crowded. Plan a quieter visit, or book far ahead.',
        'في الأسابيع المحيطة بها تُغلق طرق وتمتلئ الفنادق مبكرًا وتزدحم المراقد بشدة. خطّط لزيارة في وقت أهدأ أو احجز مبكرًا جدًا.'],
    ],
    sources: [['Office Holidays: Arbaeen dates', 'https://www.officeholidays.com/holidays/arbaeen']],
  },
]

/** Emergency numbers for Iraq (source: UK travel advice, "Getting help", checked October 2026). */
export const EMERGENCY = [
  { id: 'police', number: '911' },
  { id: 'ambulance', number: '122' },
  { id: 'fire', number: '115' },
]
export const EMERGENCY_SOURCE = ['UK travel advice: getting help', 'https://www.gov.uk/foreign-travel-advice/iraq/getting-help']

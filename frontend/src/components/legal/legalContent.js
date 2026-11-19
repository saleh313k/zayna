// ============================================
// src/components/legal/legalContent.js
//
// DRAFT - MUST BE REVIEWED BY A QUALIFIED OMANI LAWYER BEFORE LAUNCH.
// Written from what the code actually does (see PROJECT_STATUS.md, section 5.6). Keep it in sync with the product:
// if the app starts collecting new data, using a new third party, or taking payments, update both languages here.
//
// Structure: each document has { title, intro, sections: [{ heading, paragraphs?: string[], items?: string[] }] }.
// ============================================

export const LEGAL_LAST_UPDATED = '2026-11-17';

export const privacy = {
  en: {
    title: 'Privacy Policy',
    intro:
      'This policy explains what personal data ZAYNA collects, why we collect it, who can see it, and the choices you have. ZAYNA is a booking platform that connects customers with salons in Oman.',
    sections: [
      {
        heading: '1. Who we are',
        paragraphs: [
          'ZAYNA (“we”, “us”) runs this website and booking service. To ask a question about your data, use the Contact button in the footer of the site.'
        ]
      },
      {
        heading: '2. What we collect',
        items: [
          'Account details: your name, email address, an optional phone number and your language choice. If you register with email, your password is stored only as a salted hash, never in readable form. If you sign in with Google, Google gives us your Google account identifier, email address and name.',
          'Bookings: the salon, service, stylist, date and time you choose, any notes you type, the booking status and, if a booking is cancelled, the reason given.',
          'Reviews: your star rating and comment. A review is public and shows your first name and the first letter of your last name.',
          'Loyalty points: the points you earn for completed appointments.',
          'Messages we send you: confirmations, reminders and cancellation notices for your bookings.',
          'Salon owners: business details such as the salon name, address, contact details, opening hours, services, prices and staff names.',
          'On your device: the site keeps a sign-in token, your basic profile and your language choice in your browser’s local storage so that you stay signed in. We do not use advertising cookies or analytics trackers.'
        ]
      },
      {
        heading: '3. Why we use your data',
        items: [
          'To create and secure your account and sign you in.',
          'To make, change and cancel bookings, and to let the salon prepare for your visit.',
          'To email you booking confirmations, reminders, cancellations and password-reset links.',
          'To publish reviews that come from real, completed visits.',
          'To keep the platform safe, prevent abuse and meet our legal obligations.'
        ],
        paragraphs: [
          'We rely on your consent, which you give when you create an account and use the service, and on what is necessary to provide the booking service you asked for. You can withdraw your consent at any time, but we may then be unable to provide the service.'
        ]
      },
      {
        heading: '4. Who can see your data',
        paragraphs: [
          'The salon you book with can see your name, your contact details, and the booking details and notes you provide. Anyone can see your reviews as described above. Our administrators can access account and booking data to run the platform, give support and handle reports. We do not sell your personal data.',
          'We use service providers to run ZAYNA: Google (sign-in, and the site also loads fonts from Google’s servers, which means your IP address is sent to Google), an email-delivery provider that sends our emails, our hosting provider, and EmailJS if you send a message through the site’s contact form. They may only process data to provide their service to us.'
        ]
      },
      {
        heading: '5. Transfers outside Oman',
        paragraphs: [
          'Some of these providers may process data outside Oman. We use them only as needed to run the service and aim to meet the requirements that apply to such transfers.'
        ]
      },
      {
        heading: '6. How long we keep your data',
        paragraphs: [
          'We keep your data while your account exists and for as long as needed for bookings, disputes and legal obligations. Reviews stay public unless they are removed. We do not yet delete data automatically; you can ask us to delete your account and data at any time (see “Your rights”).'
        ]
      },
      {
        heading: '7. Security',
        paragraphs: [
          'Passwords are stored as salted hashes, connections use HTTPS, and access to data is limited. No online service is perfectly secure. If a breach affects you, we will notify you and the competent authority as the law requires.'
        ]
      },
      {
        heading: '8. Your rights',
        paragraphs: [
          'As the law allows, you may ask to see the personal data we hold about you, correct it, receive a copy, have it deleted, object to or restrict its use, and withdraw your consent. Use the Contact button in the site footer. We will respond within the time the law requires. You may also complain to the competent authority in Oman (currently the Ministry of Transport, Communications and Information Technology).'
        ]
      },
      {
        heading: '9. Children',
        paragraphs: [
          'ZAYNA is intended for people aged 18 and over. If you believe a child has given us personal data, contact us and we will delete it.'
        ]
      },
      {
        heading: '10. Changes to this policy',
        paragraphs: [
          'We may update this policy. The date at the top shows the latest version. For important changes we will notify you in the app or by email.'
        ]
      }
    ]
  },
  ar: {
    title: 'سياسة الخصوصية',
    intro:
      'توضح هذه السياسة البيانات الشخصية التي تجمعها زينة (ZAYNA) ولماذا نجمعها ومن يستطيع الاطلاع عليها وما الخيارات المتاحة لك. زينة منصة حجز تربط العملاء بالصالونات في سلطنة عُمان.',
    sections: [
      {
        heading: '1. من نحن',
        paragraphs: [
          'تدير زينة (“نحن”) هذا الموقع وخدمة الحجز. لطرح أي سؤال بشأن بياناتك، استخدم زر «تواصل معنا» في أسفل الموقع.'
        ]
      },
      {
        heading: '2. ما الذي نجمعه',
        items: [
          'بيانات الحساب: اسمك وبريدك الإلكتروني ورقم هاتف اختياري واللغة التي تختارها. إذا سجّلت بالبريد الإلكتروني فإننا نحفظ كلمة المرور على شكل بصمة مشفّرة (Hash) فقط ولا نحفظها بصيغة مقروءة. وإذا سجّلت الدخول عبر جوجل فإن جوجل تزوّدنا بمعرّف حسابك وبريدك الإلكتروني واسمك.',
          'الحجوزات: الصالون والخدمة والمصفّف والتاريخ والوقت الذي تختاره وأي ملاحظات تكتبها وحالة الحجز، وسبب الإلغاء إن أُلغي الحجز.',
          'التقييمات: عدد النجوم وتعليقك. التقييم علني ويظهر فيه اسمك الأول والحرف الأول من اسم العائلة.',
          'نقاط الولاء: النقاط التي تكسبها عند إتمام المواعيد.',
          'الرسائل التي نرسلها لك: تأكيدات الحجز والتذكيرات وإشعارات الإلغاء.',
          'أصحاب الصالونات: بيانات النشاط مثل اسم الصالون والعنوان وبيانات التواصل وساعات العمل والخدمات والأسعار وأسماء العاملين.',
          'على جهازك: يحتفظ الموقع برمز تسجيل الدخول وبياناتك الأساسية واللغة التي اخترتها في التخزين المحلي للمتصفح حتى تبقى مسجّلاً. ولا نستخدم ملفات تعريف الارتباط الإعلانية ولا أدوات التتبع التحليلية.'
        ]
      },
      {
        heading: '3. لماذا نستخدم بياناتك',
        items: [
          'لإنشاء حسابك وحمايته وتسجيل دخولك.',
          'لإجراء الحجوزات وتعديلها وإلغائها ولتمكين الصالون من التحضير لزيارتك.',
          'لإرسال تأكيدات الحجز والتذكيرات والإلغاءات وروابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.',
          'لنشر تقييمات صادرة عن زيارات حقيقية مكتملة.',
          'للحفاظ على أمان المنصة ومنع إساءة الاستخدام والوفاء بالتزاماتنا القانونية.'
        ],
        paragraphs: [
          'نعتمد على موافقتك التي تقدّمها عند إنشاء الحساب واستخدام الخدمة، وعلى ما هو ضروري لتقديم خدمة الحجز التي طلبتها. يمكنك سحب موافقتك في أي وقت، وقد لا نتمكن عندها من تقديم الخدمة لك.'
        ]
      },
      {
        heading: '4. من يمكنه الاطلاع على بياناتك',
        paragraphs: [
          'يستطيع الصالون الذي تحجز لديه الاطلاع على اسمك وبيانات التواصل الخاصة بك وتفاصيل الحجز والملاحظات التي تقدّمها. ويستطيع أي شخص الاطلاع على تقييماتك بالصيغة الموضحة أعلاه. ويمكن لمسؤولي المنصة الوصول إلى بيانات الحساب والحجوزات لتشغيل المنصة وتقديم الدعم ومعالجة البلاغات. نحن لا نبيع بياناتك الشخصية.',
          'نستعين بمزوّدي خدمات لتشغيل زينة: جوجل (لتسجيل الدخول، كما يحمّل الموقع الخطوط من خوادم جوجل مما يعني إرسال عنوان IP الخاص بك إلى جوجل)، ومزوّد لإرسال البريد الإلكتروني، ومزوّد الاستضافة، وخدمة EmailJS إذا أرسلت رسالة عبر نموذج التواصل في الموقع. ولا يجوز لهم معالجة البيانات إلا لتقديم خدماتهم لنا.'
        ]
      },
      {
        heading: '5. النقل خارج سلطنة عُمان',
        paragraphs: [
          'قد يعالج بعض هؤلاء المزوّدين البيانات خارج سلطنة عُمان. ونستخدمهم بالقدر اللازم لتشغيل الخدمة فقط، ونسعى إلى استيفاء المتطلبات المنطبقة على مثل هذا النقل.'
        ]
      },
      {
        heading: '6. مدة الاحتفاظ ببياناتك',
        paragraphs: [
          'نحتفظ ببياناتك ما دام حسابك قائماً وللمدة اللازمة للحجوزات والنزاعات والالتزامات القانونية. وتبقى التقييمات علنية ما لم تُزل. لا نحذف البيانات تلقائياً حتى الآن؛ ويمكنك أن تطلب منا حذف حسابك وبياناتك في أي وقت (انظر «حقوقك»).'
        ]
      },
      {
        heading: '7. الأمان',
        paragraphs: [
          'تُحفظ كلمات المرور على شكل بصمات مشفّرة، وتستخدم الاتصالات بروتوكول HTTPS، ويُقيَّد الوصول إلى البيانات. لا توجد خدمة إلكترونية آمنة تماماً. وإذا أثّر أي اختراق عليك فسنبلغك والجهة المختصة وفق ما يقتضيه القانون.'
        ]
      },
      {
        heading: '8. حقوقك',
        paragraphs: [
          'وفق ما يسمح به القانون، يحق لك طلب الاطلاع على البيانات الشخصية التي نحتفظ بها عنك وتصحيحها والحصول على نسخة منها وحذفها والاعتراض على استخدامها أو تقييده وسحب موافقتك. استخدم زر «تواصل معنا» في أسفل الموقع. وسنرد خلال المدة التي يحددها القانون. ويحق لك أيضاً تقديم شكوى إلى الجهة المختصة في سلطنة عُمان (حالياً وزارة النقل والاتصالات وتقنية المعلومات).'
        ]
      },
      {
        heading: '9. الأطفال',
        paragraphs: [
          'زينة موجّهة للأشخاص الذين تبلغ أعمارهم 18 عاماً فأكثر. إذا اعتقدت أن طفلاً قدّم لنا بيانات شخصية فتواصل معنا وسنحذفها.'
        ]
      },
      {
        heading: '10. التغييرات على هذه السياسة',
        paragraphs: [
          'قد نحدّث هذه السياسة، ويبيّن التاريخ في أعلاها آخر نسخة. وعند إجراء تغييرات مهمة سنبلغك داخل التطبيق أو عبر البريد الإلكتروني.'
        ]
      }
    ]
  }
};

export const terms = {
  en: {
    title: 'Terms of Use',
    intro:
      'By creating an account or using ZAYNA you agree to these terms and to our Privacy Policy. If you do not agree, please do not use the service.',
    sections: [
      {
        heading: '1. What ZAYNA is',
        paragraphs: [
          'ZAYNA is an online platform that helps customers discover and book appointments with independent salons in Oman. Salons are separate businesses. The appointment and the services are an arrangement between you and the salon; ZAYNA is not the salon and does not provide the beauty services.'
        ]
      },
      {
        heading: '2. Your account',
        items: [
          'You must be 18 or older and give accurate information.',
          'Keep your password secure and tell us if you think your account was used without your permission. You are responsible for activity under your account.',
          'Do not create accounts for other people without their permission or use another person’s identity.'
        ]
      },
      {
        heading: '3. Bookings and cancellations',
        items: [
          'A booking is a request for a specific time with a specific salon. It is confirmed when the platform shows it as confirmed.',
          'You can cancel online until the cut-off time shown for your booking (a set number of hours before the appointment). After that, please contact the salon.',
          'You pay the salon at the appointment. ZAYNA does not currently take online payments.',
          'If you repeatedly miss appointments, we or the salon may limit your ability to book.'
        ]
      },
      {
        heading: '4. Reviews',
        items: [
          'You can review only an appointment you completed, once per booking.',
          'Reviews must be honest, based on your own experience, and must not contain unlawful, abusive or discriminatory content or private information about others.',
          'We may hide or remove reviews that break these rules.'
        ]
      },
      {
        heading: '5. Salons',
        items: [
          'Salon owners are responsible for the accuracy of their listing, services, prices, opening hours and availability, and for holding the licences and permits the law requires.',
          'We approve salons before they appear, and we may refuse, suspend or remove a salon that breaks these terms or the law.'
        ]
      },
      {
        heading: '6. Acceptable use',
        paragraphs: [
          'Do not misuse ZAYNA: do not try to break or overload the service, scrape its data, send spam, or book appointments you do not intend to keep.'
        ]
      },
      {
        heading: '7. Loyalty points',
        paragraphs: [
          'Points are a thank-you for completed appointments. They have no cash value, cannot be transferred or exchanged for money, and we may change or end the programme.'
        ]
      },
      {
        heading: '8. Availability and liability',
        paragraphs: [
          'We work to keep ZAYNA available but do not promise uninterrupted service. To the extent the law allows, ZAYNA is not responsible for the quality, safety or outcome of services provided by salons, or for losses caused by a salon cancelling or changing an appointment. Nothing in these terms limits any right you have under Omani law that cannot be limited.'
        ]
      },
      {
        heading: '9. Suspension and ending',
        paragraphs: [
          'You may stop using ZAYNA at any time and ask us to delete your account. We may suspend or close accounts that break these terms or put others at risk.'
        ]
      },
      {
        heading: '10. Changes to these terms',
        paragraphs: [
          'We may update these terms. Continuing to use ZAYNA after an update means you accept it. We will notify you of important changes.'
        ]
      },
      {
        heading: '11. Governing law',
        paragraphs: [
          'These terms are governed by the laws of the Sultanate of Oman, and the courts of Oman have jurisdiction, unless the law requires otherwise.'
        ]
      },
      {
        heading: '12. Contact',
        paragraphs: ['Use the Contact button in the footer of the site.']
      }
    ]
  },
  ar: {
    title: 'شروط الاستخدام',
    intro:
      'بإنشائك حساباً أو استخدامك زينة (ZAYNA) فإنك توافق على هذه الشروط وعلى سياسة الخصوصية. وإذا كنت لا توافق فيُرجى عدم استخدام الخدمة.',
    sections: [
      {
        heading: '1. ما هي زينة',
        paragraphs: [
          'زينة منصة إلكترونية تساعد العملاء على اكتشاف الصالونات المستقلة في سلطنة عُمان وحجز المواعيد لديها. الصالونات منشآت مستقلة، والموعد والخدمات ترتيب بينك وبين الصالون؛ وزينة ليست الصالون ولا تقدّم خدمات التجميل.'
        ]
      },
      {
        heading: '2. حسابك',
        items: [
          'يجب أن يكون عمرك 18 عاماً أو أكثر وأن تقدّم معلومات صحيحة.',
          'حافظ على سرّية كلمة المرور وأبلغنا إذا اعتقدت أن حسابك استُخدم دون إذنك. وأنت مسؤول عن النشاط الذي يتم عبر حسابك.',
          'لا تنشئ حسابات لأشخاص آخرين دون إذنهم ولا تنتحل هوية شخص آخر.'
        ]
      },
      {
        heading: '3. الحجوزات والإلغاء',
        items: [
          'الحجز هو طلب لموعد محدد لدى صالون محدد، ويصبح مؤكداً عندما تعرضه المنصة بوصفه مؤكداً.',
          'يمكنك الإلغاء عبر الإنترنت حتى الموعد النهائي المعروض لحجزك (عدد محدد من الساعات قبل الموعد). وبعد ذلك يُرجى التواصل مع الصالون.',
          'تدفع للصالون عند الموعد. ولا تقبل زينة المدفوعات الإلكترونية حالياً.',
          'إذا تكرر تغيّبك عن المواعيد فقد نقيّد نحن أو الصالون قدرتك على الحجز.'
        ]
      },
      {
        heading: '4. التقييمات',
        items: [
          'يمكنك تقييم موعد أتممته فقط، ومرة واحدة لكل حجز.',
          'يجب أن تكون التقييمات صادقة ومبنية على تجربتك الشخصية، ويجب ألا تتضمن محتوى مخالفاً للقانون أو مسيئاً أو تمييزياً أو معلومات خاصة عن الآخرين.',
          'يجوز لنا إخفاء أو إزالة التقييمات التي تخالف هذه القواعد.'
        ]
      },
      {
        heading: '5. الصالونات',
        items: [
          'أصحاب الصالونات مسؤولون عن دقة بيانات صالوناتهم وخدماتهم وأسعارهم وساعات عملهم وتوفّر المواعيد، وعن الحصول على التراخيص والتصاريح التي يشترطها القانون.',
          'نوافق على الصالونات قبل ظهورها، ويجوز لنا رفض أو إيقاف أو إزالة أي صالون يخالف هذه الشروط أو القانون.'
        ]
      },
      {
        heading: '6. الاستخدام المقبول',
        paragraphs: [
          'لا تُسئ استخدام زينة: لا تحاول تعطيل الخدمة أو إرهاقها أو سحب بياناتها أو إرسال رسائل مزعجة أو حجز مواعيد لا تنوي الالتزام بها.'
        ]
      },
      {
        heading: '7. نقاط الولاء',
        paragraphs: [
          'النقاط تقدير على المواعيد المكتملة، وليست لها قيمة نقدية ولا يمكن تحويلها أو استبدالها بالمال، ويجوز لنا تعديل البرنامج أو إنهاؤه.'
        ]
      },
      {
        heading: '8. التوفّر والمسؤولية',
        paragraphs: [
          'نعمل على إبقاء زينة متاحة لكننا لا نعد بخدمة دون انقطاع. وبالقدر الذي يسمح به القانون لا تتحمل زينة المسؤولية عن جودة الخدمات التي تقدمها الصالونات أو سلامتها أو نتائجها، ولا عن الخسائر الناتجة عن إلغاء الصالون موعداً أو تغييره. ولا يقيّد أي نص في هذه الشروط أي حق لك بموجب القانون العُماني لا يجوز تقييده.'
        ]
      },
      {
        heading: '9. الإيقاف والإنهاء',
        paragraphs: [
          'يمكنك التوقف عن استخدام زينة في أي وقت وطلب حذف حسابك. ويجوز لنا إيقاف أو إغلاق الحسابات التي تخالف هذه الشروط أو تعرّض الآخرين للخطر.'
        ]
      },
      {
        heading: '10. التغييرات على هذه الشروط',
        paragraphs: [
          'قد نحدّث هذه الشروط، واستمرارك في استخدام زينة بعد التحديث يعني قبولك له. وسنبلغك بالتغييرات المهمة.'
        ]
      },
      {
        heading: '11. القانون الواجب التطبيق',
        paragraphs: [
          'تخضع هذه الشروط لقوانين سلطنة عُمان، وتختص محاكم السلطنة بالنظر فيها ما لم يقتضِ القانون خلاف ذلك.'
        ]
      },
      {
        heading: '12. التواصل',
        paragraphs: ['استخدم زر «تواصل معنا» في أسفل الموقع.']
      }
    ]
  }
};

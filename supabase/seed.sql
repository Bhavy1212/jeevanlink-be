-- ============================================================
-- JeevanLink — Seed Data
-- Run AFTER 001_init_schema.sql to populate mock centres
-- ============================================================

insert into public.centres (id, name, name_hi, type, distance, distance_hi, hours, hours_hi, address, address_hi, verified)
values
  ('c1', 'City Hospital Blood Centre',      'सिटी अस्पताल रक्त केंद्र',        'hospital',  '1.2 km', '१.२ किमी', '24 Hours',            '२४ घंटे',             'Sector 12, Main Road',              'सेक्टर १२, मुख्य मार्ग',              true),
  ('c2', 'Community Blood Bank',            'कम्युनिटी ब्लड बैंक',              'bloodbank', '3.5 km', '३.५ किमी', '8:00 AM - 8:00 PM',   'सुबह ८:०० - रात ८:०', 'Link Road, Near Metro Station',     'लिंक रोड, मेट्रो स्टेशन के पास',    true),
  ('c3', 'Government Hospital Blood Centre','सरकारी अस्पताल रक्त केंद्र',       'hospital',  '4.8 km', '४.८ किमी', '24 Hours',            '२४ घंटे',             'Civil Lines',                       'सिविल लाइन्स',                        true),
  ('c4', 'Red Cross NGO Helpline',          'रेड क्रॉस एनजीओ हेल्पलाइन',        'ngo',       '2.1 km', '२.१ किमी', '9:00 AM - 6:00 PM',   'सुबह ९:०० - शाम ६:०', 'Model Town, Phase 1',               'मॉडल टाउन, फेज १',                    true),
  ('c5', 'Rotary Blood Bank NGO',           'रोटरी ब्लड बैंक एनजीओ',            'ngo',       '5.4 km', '५.४ किमी', '24 Hours',            '२४ घंटे',             'Green Avenue Road',                 'ग्रीन एवेन्यू रोड',                   true),
  ('c6', 'Metro Life Blood Bank',           'मेट्रो लाइफ ब्लड बैंक',            'bloodbank', '6.2 km', '६.२ किमी', '24 Hours',            '२४ घंटे',             'High Street Mall, Ground Floor',    'हाई स्ट्रीट मॉल, ग्राउंड फ्लोर',    true)
on conflict (id) do nothing;

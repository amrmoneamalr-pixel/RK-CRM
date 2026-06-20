import React from 'react';

const COUNTRY_CODES = [
  // Egypt first (most common for RK CRM)
  { code: 'eg', name: 'Egypt',                    dial: '+20',  tz: 'Africa/Cairo',                      test: (d) => /^(20)?(01[0125]\d{8})$/.test(d) || /^01[0125]\d{8}$/.test(d) },
  // Arab World
  { code: 'sa', name: 'Saudi Arabia',             dial: '+966', tz: 'Asia/Riyadh',                       test: (d) => /^966[5]\d{8}$/.test(d) || /^05\d{8}$/.test(d) },
  { code: 'ae', name: 'UAE',                      dial: '+971', tz: 'Asia/Dubai',                        test: (d) => /^971[5]\d{8}$/.test(d) },
  { code: 'kw', name: 'Kuwait',                   dial: '+965', tz: 'Asia/Kuwait',                       test: (d) => /^965[569]\d{7}$/.test(d) },
  { code: 'qa', name: 'Qatar',                    dial: '+974', tz: 'Asia/Qatar',                        test: (d) => /^974[3-7]\d{7}$/.test(d) },
  { code: 'bh', name: 'Bahrain',                  dial: '+973', tz: 'Asia/Bahrain',                      test: (d) => /^973[3-6]\d{7}$/.test(d) },
  { code: 'om', name: 'Oman',                     dial: '+968', tz: 'Asia/Muscat',                       test: (d) => /^968[79]\d{7}$/.test(d) },
  { code: 'jo', name: 'Jordan',                   dial: '+962', tz: 'Asia/Amman',                        test: (d) => /^962[7]\d{8}$/.test(d) },
  { code: 'lb', name: 'Lebanon',                  dial: '+961', tz: 'Asia/Beirut',                       test: (d) => /^961[37]\d{7}$/.test(d) },
  { code: 'iq', name: 'Iraq',                     dial: '+964', tz: 'Asia/Baghdad',                      test: (d) => /^964[7]\d{9}$/.test(d) },
  { code: 'sy', name: 'Syria',                    dial: '+963', tz: 'Asia/Damascus',                     test: (d) => /^963[9]\d{8}$/.test(d) },
  { code: 'ye', name: 'Yemen',                    dial: '+967', tz: 'Asia/Aden',                         test: (d) => /^967[7]\d{8}$/.test(d) },
  { code: 'ps', name: 'Palestine',                dial: '+970', tz: 'Asia/Gaza',                         test: (d) => /^970[5]\d{8}$/.test(d) },
  { code: 'ly', name: 'Libya',                    dial: '+218', tz: 'Africa/Tripoli',                    test: (d) => /^218[9]\d{8}$/.test(d) },
  { code: 'tn', name: 'Tunisia',                  dial: '+216', tz: 'Africa/Tunis',                      test: (d) => /^216[2-9]\d{7}$/.test(d) },
  { code: 'dz', name: 'Algeria',                  dial: '+213', tz: 'Africa/Algiers',                    test: (d) => /^213[5-7]\d{8}$/.test(d) },
  { code: 'ma', name: 'Morocco',                  dial: '+212', tz: 'Africa/Casablanca',                 test: (d) => /^212[5-7]\d{8}$/.test(d) },
  { code: 'sd', name: 'Sudan',                    dial: '+249', tz: 'Africa/Khartoum',                   test: (d) => /^249[9]\d{8}$/.test(d) },
  { code: 'mr', name: 'Mauritania',               dial: '+222', tz: 'Africa/Nouakchott',                 test: (d) => /^222[2-4]\d{7}$/.test(d) },
  { code: 'so', name: 'Somalia',                  dial: '+252', tz: 'Africa/Mogadishu',                  test: (d) => /^252[6-9]\d{7}$/.test(d) },
  { code: 'dj', name: 'Djibouti',                 dial: '+253', tz: 'Africa/Djibouti',                   test: (d) => /^253[7]\d{7}$/.test(d) },
  { code: 'km', name: 'Comoros',                  dial: '+269', tz: 'Indian/Comoro',                     test: (d) => /^269[3]\d{6}$/.test(d) },
  // Europe
  { code: 'tr', name: 'Turkey',                   dial: '+90',  tz: 'Europe/Istanbul',                   test: (d) => /^90[5]\d{9}$/.test(d) },
  { code: 'gb', name: 'UK',                       dial: '+44',  tz: 'Europe/London',                     test: (d) => /^44[7]\d{9}$/.test(d) },
  { code: 'de', name: 'Germany',                  dial: '+49',  tz: 'Europe/Berlin',                     test: (d) => /^49\d{10,11}$/.test(d) },
  { code: 'fr', name: 'France',                   dial: '+33',  tz: 'Europe/Paris',                      test: (d) => /^33[67]\d{8}$/.test(d) },
  { code: 'it', name: 'Italy',                    dial: '+39',  tz: 'Europe/Rome',                       test: (d) => /^39[3]\d{9}$/.test(d) },
  { code: 'es', name: 'Spain',                    dial: '+34',  tz: 'Europe/Madrid',                     test: (d) => /^34[6-7]\d{8}$/.test(d) },
  { code: 'nl', name: 'Netherlands',              dial: '+31',  tz: 'Europe/Amsterdam',                  test: (d) => /^31[6]\d{8}$/.test(d) },
  { code: 'be', name: 'Belgium',                  dial: '+32',  tz: 'Europe/Brussels',                   test: (d) => /^32[4]\d{8}$/.test(d) },
  { code: 'ch', name: 'Switzerland',              dial: '+41',  tz: 'Europe/Zurich',                     test: (d) => /^41[7]\d{8}$/.test(d) },
  { code: 'se', name: 'Sweden',                   dial: '+46',  tz: 'Europe/Stockholm',                  test: (d) => /^46[7]\d{8}$/.test(d) },
  { code: 'no', name: 'Norway',                   dial: '+47',  tz: 'Europe/Oslo',                       test: (d) => /^47[4-9]\d{7}$/.test(d) },
  { code: 'dk', name: 'Denmark',                  dial: '+45',  tz: 'Europe/Copenhagen',                 test: (d) => /^45[2-9]\d{7}$/.test(d) },
  { code: 'fi', name: 'Finland',                  dial: '+358', tz: 'Europe/Helsinki',                   test: (d) => /^358[4-5]\d{8}$/.test(d) },
  { code: 'pl', name: 'Poland',                   dial: '+48',  tz: 'Europe/Warsaw',                     test: (d) => /^48[5-7]\d{8}$/.test(d) },
  { code: 'pt', name: 'Portugal',                 dial: '+351', tz: 'Europe/Lisbon',                     test: (d) => /^351[9]\d{8}$/.test(d) },
  { code: 'gr', name: 'Greece',                   dial: '+30',  tz: 'Europe/Athens',                     test: (d) => /^30[6]\d{9}$/.test(d) },
  { code: 'at', name: 'Austria',                  dial: '+43',  tz: 'Europe/Vienna',                     test: (d) => /^43[6]\d{9,10}$/.test(d) },
  { code: 'ie', name: 'Ireland',                  dial: '+353', tz: 'Europe/Dublin',                     test: (d) => /^353[8]\d{8}$/.test(d) },
  { code: 'cz', name: 'Czech Republic',           dial: '+420', tz: 'Europe/Prague',                     test: (d) => /^420[6-7]\d{8}$/.test(d) },
  { code: 'sk', name: 'Slovakia',                 dial: '+421', tz: 'Europe/Bratislava',                 test: (d) => /^421[9]\d{8}$/.test(d) },
  { code: 'ro', name: 'Romania',                  dial: '+40',  tz: 'Europe/Bucharest',                  test: (d) => /^40[7]\d{8}$/.test(d) },
  { code: 'hu', name: 'Hungary',                  dial: '+36',  tz: 'Europe/Budapest',                   test: (d) => /^36[3-7]\d{8}$/.test(d) },
  { code: 'bg', name: 'Bulgaria',                 dial: '+359', tz: 'Europe/Sofia',                      test: (d) => /^359[8-9]\d{8}$/.test(d) },
  { code: 'hr', name: 'Croatia',                  dial: '+385', tz: 'Europe/Zagreb',                     test: (d) => /^385[9]\d{8}$/.test(d) },
  { code: 'rs', name: 'Serbia',                   dial: '+381', tz: 'Europe/Belgrade',                   test: (d) => /^381[6]\d{7,8}$/.test(d) },
  { code: 'ua', name: 'Ukraine',                  dial: '+380', tz: 'Europe/Kiev',                       test: (d) => /^380[6-9]\d{8}$/.test(d) },
  { code: 'ru', name: 'Russia',                   dial: '+7',   tz: 'Europe/Moscow',                     test: (d) => /^7[79]\d{9}$/.test(d) },
  { code: 'kz', name: 'Kazakhstan',               dial: '+7',   tz: 'Asia/Almaty',                       test: (d) => /^7[67]\d{9}$/.test(d) },
  { code: 'by', name: 'Belarus',                  dial: '+375', tz: 'Europe/Minsk',                      test: (d) => /^375[2-3]\d{8}$/.test(d) },
  { code: 'lt', name: 'Lithuania',                dial: '+370', tz: 'Europe/Vilnius',                    test: (d) => /^370[6]\d{7}$/.test(d) },
  { code: 'lv', name: 'Latvia',                   dial: '+371', tz: 'Europe/Riga',                       test: (d) => /^371[2]\d{7}$/.test(d) },
  { code: 'ee', name: 'Estonia',                  dial: '+372', tz: 'Europe/Tallinn',                    test: (d) => /^372[5]\d{6,7}$/.test(d) },
  { code: 'al', name: 'Albania',                  dial: '+355', tz: 'Europe/Tirane',                     test: (d) => /^355[6]\d{8}$/.test(d) },
  { code: 'mk', name: 'North Macedonia',          dial: '+389', tz: 'Europe/Skopje',                     test: (d) => /^389[7]\d{7}$/.test(d) },
  { code: 'ba', name: 'Bosnia',                   dial: '+387', tz: 'Europe/Sarajevo',                   test: (d) => /^387[6]\d{7}$/.test(d) },
  { code: 'me', name: 'Montenegro',               dial: '+382', tz: 'Europe/Podgorica',                  test: (d) => /^382[6]\d{7}$/.test(d) },
  { code: 'si', name: 'Slovenia',                 dial: '+386', tz: 'Europe/Ljubljana',                  test: (d) => /^386[3-7]\d{7}$/.test(d) },
  { code: 'cy', name: 'Cyprus',                   dial: '+357', tz: 'Asia/Nicosia',                      test: (d) => /^357[9]\d{7}$/.test(d) },
  { code: 'mt', name: 'Malta',                    dial: '+356', tz: 'Europe/Malta',                      test: (d) => /^356[7-9]\d{7}$/.test(d) },
  { code: 'lu', name: 'Luxembourg',               dial: '+352', tz: 'Europe/Luxembourg',                 test: (d) => /^352[6]\d{8}$/.test(d) },
  { code: 'is', name: 'Iceland',                  dial: '+354', tz: 'Atlantic/Reykjavik',                test: (d) => /^354[6-8]\d{6}$/.test(d) },
  { code: 'ge', name: 'Georgia',                  dial: '+995', tz: 'Asia/Tbilisi',                      test: (d) => /^995[5]\d{8}$/.test(d) },
  { code: 'am', name: 'Armenia',                  dial: '+374', tz: 'Asia/Yerevan',                      test: (d) => /^374[7]\d{7}$/.test(d) },
  { code: 'az', name: 'Azerbaijan',               dial: '+994', tz: 'Asia/Baku',                         test: (d) => /^994[5]\d{8}$/.test(d) },
  { code: 'md', name: 'Moldova',                  dial: '+373', tz: 'Europe/Chisinau',                   test: (d) => /^373[6-7]\d{7}$/.test(d) },
  // Americas
  { code: 'us', name: 'USA',                      dial: '+1',   tz: 'America/New_York',                  test: (d) => /^1[2-9]\d{9}$/.test(d) },
  { code: 'ca', name: 'Canada',                   dial: '+1',   tz: 'America/Toronto',                   test: (d) => /^1[2-9]\d{9}$/.test(d) },
  { code: 'mx', name: 'Mexico',                   dial: '+52',  tz: 'America/Mexico_City',               test: (d) => /^52[1-9]\d{9}$/.test(d) },
  { code: 'br', name: 'Brazil',                   dial: '+55',  tz: 'America/Sao_Paulo',                 test: (d) => /^55[1-9]\d{10}$/.test(d) },
  { code: 'ar', name: 'Argentina',                dial: '+54',  tz: 'America/Argentina/Buenos_Aires',    test: (d) => /^54[9]\d{10}$/.test(d) },
  { code: 'co', name: 'Colombia',                 dial: '+57',  tz: 'America/Bogota',                    test: (d) => /^57[3]\d{9}$/.test(d) },
  { code: 'cl', name: 'Chile',                    dial: '+56',  tz: 'America/Santiago',                  test: (d) => /^56[9]\d{8}$/.test(d) },
  { code: 'pe', name: 'Peru',                     dial: '+51',  tz: 'America/Lima',                      test: (d) => /^51[9]\d{8}$/.test(d) },
  { code: 've', name: 'Venezuela',                dial: '+58',  tz: 'America/Caracas',                   test: (d) => /^58[4]\d{9}$/.test(d) },
  { code: 'ec', name: 'Ecuador',                  dial: '+593', tz: 'America/Guayaquil',                 test: (d) => /^593[9]\d{8}$/.test(d) },
  { code: 'bo', name: 'Bolivia',                  dial: '+591', tz: 'America/La_Paz',                    test: (d) => /^591[6-7]\d{7}$/.test(d) },
  { code: 'py', name: 'Paraguay',                 dial: '+595', tz: 'America/Asuncion',                  test: (d) => /^595[9]\d{8}$/.test(d) },
  { code: 'uy', name: 'Uruguay',                  dial: '+598', tz: 'America/Montevideo',                test: (d) => /^598[9]\d{7}$/.test(d) },
  { code: 'cu', name: 'Cuba',                     dial: '+53',  tz: 'America/Havana',                    test: (d) => /^53[5]\d{7}$/.test(d) },
  { code: 'do', name: 'Dominican Republic',       dial: '+1',   tz: 'America/Santo_Domingo',             test: (d) => /^1(809|829|849)\d{7}$/.test(d) },
  { code: 'gt', name: 'Guatemala',                dial: '+502', tz: 'America/Guatemala',                 test: (d) => /^502[3-5]\d{7}$/.test(d) },
  { code: 'hn', name: 'Honduras',                 dial: '+504', tz: 'America/Tegucigalpa',               test: (d) => /^504[3-9]\d{7}$/.test(d) },
  { code: 'sv', name: 'El Salvador',              dial: '+503', tz: 'America/El_Salvador',               test: (d) => /^503[6-7]\d{7}$/.test(d) },
  { code: 'cr', name: 'Costa Rica',               dial: '+506', tz: 'America/Costa_Rica',               test: (d) => /^506[6-8]\d{7}$/.test(d) },
  { code: 'pa', name: 'Panama',                   dial: '+507', tz: 'America/Panama',                    test: (d) => /^507[6]\d{7}$/.test(d) },
  // Asia
  { code: 'in', name: 'India',                    dial: '+91',  tz: 'Asia/Kolkata',                      test: (d) => /^91[6-9]\d{9}$/.test(d) },
  { code: 'pk', name: 'Pakistan',                 dial: '+92',  tz: 'Asia/Karachi',                      test: (d) => /^92[3]\d{9}$/.test(d) },
  { code: 'bd', name: 'Bangladesh',               dial: '+880', tz: 'Asia/Dhaka',                        test: (d) => /^880[1]\d{9}$/.test(d) },
  { code: 'lk', name: 'Sri Lanka',                dial: '+94',  tz: 'Asia/Colombo',                      test: (d) => /^94[7]\d{8}$/.test(d) },
  { code: 'np', name: 'Nepal',                    dial: '+977', tz: 'Asia/Kathmandu',                    test: (d) => /^977[9]\d{9}$/.test(d) },
  { code: 'af', name: 'Afghanistan',              dial: '+93',  tz: 'Asia/Kabul',                        test: (d) => /^93[7]\d{8}$/.test(d) },
  { code: 'ir', name: 'Iran',                     dial: '+98',  tz: 'Asia/Tehran',                       test: (d) => /^98[9]\d{9}$/.test(d) },
  { code: 'cn', name: 'China',                    dial: '+86',  tz: 'Asia/Shanghai',                     test: (d) => /^86[1]\d{10}$/.test(d) },
  { code: 'jp', name: 'Japan',                    dial: '+81',  tz: 'Asia/Tokyo',                        test: (d) => /^81[7-9]\d{9}$/.test(d) },
  { code: 'kr', name: 'South Korea',              dial: '+82',  tz: 'Asia/Seoul',                        test: (d) => /^82[1]\d{9}$/.test(d) },
  { code: 'kp', name: 'North Korea',              dial: '+850', tz: 'Asia/Pyongyang',                    test: (d) => /^850\d{9}$/.test(d) },
  { code: 'id', name: 'Indonesia',                dial: '+62',  tz: 'Asia/Jakarta',                      test: (d) => /^62[8]\d{9,11}$/.test(d) },
  { code: 'my', name: 'Malaysia',                 dial: '+60',  tz: 'Asia/Kuala_Lumpur',                 test: (d) => /^60[1]\d{8,9}$/.test(d) },
  { code: 'sg', name: 'Singapore',                dial: '+65',  tz: 'Asia/Singapore',                    test: (d) => /^65[89]\d{7}$/.test(d) },
  { code: 'th', name: 'Thailand',                 dial: '+66',  tz: 'Asia/Bangkok',                      test: (d) => /^66[6-9]\d{8}$/.test(d) },
  { code: 'ph', name: 'Philippines',              dial: '+63',  tz: 'Asia/Manila',                       test: (d) => /^63[9]\d{9}$/.test(d) },
  { code: 'vn', name: 'Vietnam',                  dial: '+84',  tz: 'Asia/Ho_Chi_Minh',                  test: (d) => /^84[3-9]\d{8}$/.test(d) },
  { code: 'mm', name: 'Myanmar',                  dial: '+95',  tz: 'Asia/Rangoon',                      test: (d) => /^95[9]\d{8,9}$/.test(d) },
  { code: 'kh', name: 'Cambodia',                 dial: '+855', tz: 'Asia/Phnom_Penh',                   test: (d) => /^855[1-9]\d{7,8}$/.test(d) },
  { code: 'la', name: 'Laos',                     dial: '+856', tz: 'Asia/Vientiane',                    test: (d) => /^856[2]\d{8}$/.test(d) },
  { code: 'mn', name: 'Mongolia',                 dial: '+976', tz: 'Asia/Ulaanbaatar',                  test: (d) => /^976[7-9]\d{7}$/.test(d) },
  { code: 'tw', name: 'Taiwan',                   dial: '+886', tz: 'Asia/Taipei',                       test: (d) => /^886[9]\d{8}$/.test(d) },
  { code: 'hk', name: 'Hong Kong',                dial: '+852', tz: 'Asia/Hong_Kong',                    test: (d) => /^852[5-9]\d{7}$/.test(d) },
  { code: 'mo', name: 'Macau',                    dial: '+853', tz: 'Asia/Macau',                        test: (d) => /^853[6]\d{7}$/.test(d) },
  { code: 'bt', name: 'Bhutan',                   dial: '+975', tz: 'Asia/Thimphu',                      test: (d) => /^975[17]\d{6}$/.test(d) },
  { code: 'mv', name: 'Maldives',                 dial: '+960', tz: 'Indian/Maldives',                   test: (d) => /^960[7-9]\d{6}$/.test(d) },
  { code: 'tm', name: 'Turkmenistan',             dial: '+993', tz: 'Asia/Ashgabat',                     test: (d) => /^993[6]\d{7}$/.test(d) },
  { code: 'uz', name: 'Uzbekistan',               dial: '+998', tz: 'Asia/Tashkent',                     test: (d) => /^998[9]\d{8}$/.test(d) },
  { code: 'tj', name: 'Tajikistan',               dial: '+992', tz: 'Asia/Dushanbe',                     test: (d) => /^992[9]\d{8}$/.test(d) },
  { code: 'kg', name: 'Kyrgyzstan',               dial: '+996', tz: 'Asia/Bishkek',                      test: (d) => /^996[7]\d{8}$/.test(d) },
  // Africa
  { code: 'ng', name: 'Nigeria',                  dial: '+234', tz: 'Africa/Lagos',                      test: (d) => /^234[7-9]\d{9}$/.test(d) },
  { code: 'za', name: 'South Africa',             dial: '+27',  tz: 'Africa/Johannesburg',               test: (d) => /^27[6-8]\d{8}$/.test(d) },
  { code: 'ke', name: 'Kenya',                    dial: '+254', tz: 'Africa/Nairobi',                    test: (d) => /^254[7]\d{8}$/.test(d) },
  { code: 'et', name: 'Ethiopia',                 dial: '+251', tz: 'Africa/Addis_Ababa',                test: (d) => /^251[9]\d{8}$/.test(d) },
  { code: 'gh', name: 'Ghana',                    dial: '+233', tz: 'Africa/Accra',                      test: (d) => /^233[2-5]\d{8}$/.test(d) },
  { code: 'tz', name: 'Tanzania',                 dial: '+255', tz: 'Africa/Dar_es_Salaam',              test: (d) => /^255[6-7]\d{8}$/.test(d) },
  { code: 'ug', name: 'Uganda',                   dial: '+256', tz: 'Africa/Kampala',                    test: (d) => /^256[7]\d{8}$/.test(d) },
  { code: 'sn', name: 'Senegal',                  dial: '+221', tz: 'Africa/Dakar',                      test: (d) => /^221[7]\d{8}$/.test(d) },
  { code: 'ci', name: 'Ivory Coast',              dial: '+225', tz: 'Africa/Abidjan',                    test: (d) => /^225[0]\d{9}$/.test(d) },
  { code: 'cm', name: 'Cameroon',                 dial: '+237', tz: 'Africa/Douala',                     test: (d) => /^237[6]\d{8}$/.test(d) },
  { code: 'cd', name: 'DR Congo',                 dial: '+243', tz: 'Africa/Kinshasa',                   test: (d) => /^243[8-9]\d{8}$/.test(d) },
  { code: 'ao', name: 'Angola',                   dial: '+244', tz: 'Africa/Luanda',                     test: (d) => /^244[9]\d{8}$/.test(d) },
  { code: 'mz', name: 'Mozambique',               dial: '+258', tz: 'Africa/Maputo',                     test: (d) => /^258[8]\d{8}$/.test(d) },
  { code: 'mg', name: 'Madagascar',               dial: '+261', tz: 'Indian/Antananarivo',               test: (d) => /^261[3]\d{8}$/.test(d) },
  { code: 'ci', name: 'Cameroon',                 dial: '+237', tz: 'Africa/Douala',                     test: (d) => /^237[6]\d{8}$/.test(d) },
  { code: 'zw', name: 'Zimbabwe',                 dial: '+263', tz: 'Africa/Harare',                     test: (d) => /^263[7]\d{8}$/.test(d) },
  { code: 'zm', name: 'Zambia',                   dial: '+260', tz: 'Africa/Lusaka',                     test: (d) => /^260[9]\d{8}$/.test(d) },
  { code: 'rw', name: 'Rwanda',                   dial: '+250', tz: 'Africa/Kigali',                     test: (d) => /^250[7]\d{8}$/.test(d) },
  { code: 'ml', name: 'Mali',                     dial: '+223', tz: 'Africa/Bamako',                     test: (d) => /^223[6-7]\d{7}$/.test(d) },
  { code: 'bf', name: 'Burkina Faso',             dial: '+226', tz: 'Africa/Ouagadougou',                test: (d) => /^226[6-7]\d{7}$/.test(d) },
  { code: 'ne', name: 'Niger',                    dial: '+227', tz: 'Africa/Niamey',                     test: (d) => /^227[9]\d{7}$/.test(d) },
  { code: 'td', name: 'Chad',                     dial: '+235', tz: 'Africa/Ndjamena',                   test: (d) => /^235[6]\d{7}$/.test(d) },
  { code: 'gn', name: 'Guinea',                   dial: '+224', tz: 'Africa/Conakry',                    test: (d) => /^224[6]\d{8}$/.test(d) },
  { code: 'ss', name: 'South Sudan',              dial: '+211', tz: 'Africa/Juba',                       test: (d) => /^211[9]\d{8}$/.test(d) },
  { code: 'er', name: 'Eritrea',                  dial: '+291', tz: 'Africa/Asmara',                     test: (d) => /^291[7]\d{6}$/.test(d) },
  { code: 'tg', name: 'Togo',                     dial: '+228', tz: 'Africa/Lome',                       test: (d) => /^228[9]\d{7}$/.test(d) },
  { code: 'bj', name: 'Benin',                    dial: '+229', tz: 'Africa/Porto-Novo',                 test: (d) => /^229[9]\d{7}$/.test(d) },
  { code: 'gw', name: 'Guinea-Bissau',            dial: '+245', tz: 'Africa/Bissau',                     test: (d) => /^245[9]\d{7}$/.test(d) },
  { code: 'ga', name: 'Gabon',                    dial: '+241', tz: 'Africa/Libreville',                 test: (d) => /^241[0]\d{7}$/.test(d) },
  { code: 'cg', name: 'Republic of Congo',        dial: '+242', tz: 'Africa/Brazzaville',                test: (d) => /^242[0]\d{8}$/.test(d) },
  { code: 'mw', name: 'Malawi',                   dial: '+265', tz: 'Africa/Blantyre',                   test: (d) => /^265[9]\d{8}$/.test(d) },
  { code: 'ls', name: 'Lesotho',                  dial: '+266', tz: 'Africa/Maseru',                     test: (d) => /^266[5]\d{7}$/.test(d) },
  { code: 'bw', name: 'Botswana',                 dial: '+267', tz: 'Africa/Gaborone',                   test: (d) => /^267[7]\d{7}$/.test(d) },
  { code: 'sz', name: 'Eswatini',                 dial: '+268', tz: 'Africa/Mbabane',                    test: (d) => /^268[7]\d{7}$/.test(d) },
  { code: 'na', name: 'Namibia',                  dial: '+264', tz: 'Africa/Windhoek',                   test: (d) => /^264[8]\d{8}$/.test(d) },
  { code: 'sc', name: 'Seychelles',               dial: '+248', tz: 'Indian/Mahe',                       test: (d) => /^248[2]\d{6}$/.test(d) },
  { code: 'mu', name: 'Mauritius',                dial: '+230', tz: 'Indian/Mauritius',                  test: (d) => /^230[5]\d{7}$/.test(d) },
  { code: 'cv', name: 'Cape Verde',               dial: '+238', tz: 'Atlantic/Cape_Verde',               test: (d) => /^238[9]\d{6}$/.test(d) },
  { code: 'st', name: 'Sao Tome',                 dial: '+239', tz: 'Africa/Sao_Tome',                   test: (d) => /^239[9]\d{6}$/.test(d) },
  // Oceania
  { code: 'au', name: 'Australia',                dial: '+61',  tz: 'Australia/Sydney',                  test: (d) => /^61[4]\d{8}$/.test(d) },
  { code: 'nz', name: 'New Zealand',              dial: '+64',  tz: 'Pacific/Auckland',                  test: (d) => /^64[2]\d{7,9}$/.test(d) },
  { code: 'fj', name: 'Fiji',                     dial: '+679', tz: 'Pacific/Fiji',                      test: (d) => /^679[7-9]\d{6}$/.test(d) },
  { code: 'pg', name: 'Papua New Guinea',         dial: '+675', tz: 'Pacific/Port_Moresby',              test: (d) => /^675[7]\d{7}$/.test(d) },
];

export function detectCountry(phone) {
  if (!phone) return { code: 'eg', name: 'Egypt', dial: '+20', tz: 'Africa/Cairo' };
  let digits = phone.replace(/[\s\-\+\(\)\.]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  // Handle 0 + country code (e.g. 0201xxx)
  if (digits.startsWith('0') && digits.length > 11) digits = digits.slice(1);
  for (const c of COUNTRY_CODES) {
    if (c.test(digits)) return c;
  }
  return { code: 'eg', name: 'Egypt', dial: '+20', tz: 'Africa/Cairo' };
}

function localTime(tz) {
  try {
    return new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export default function PhoneFlag({ phone, size = 18 }) {
  const [show, setShow] = React.useState(false);
  const [time, setTime] = React.useState('');
  const country = detectCountry(phone);

  React.useEffect(() => {
    if (!show) return;
    setTime(localTime(country.tz));
    const t = setInterval(() => setTime(localTime(country.tz)), 10000);
    return () => clearInterval(t);
  }, [show, country.tz]);

  return (
    <span className="relative inline-flex items-center gap-1" style={{ verticalAlign: 'middle' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <img
        src={`https://flagcdn.com/w20/${country.code}.png`}
        srcSet={`https://flagcdn.com/w40/${country.code}.png 2x`}
        alt={country.name}
        style={{ width: size, height: 'auto', borderRadius: 2, display: 'block', cursor: 'default' }}
      />
      <span className="text-xs" style={{ color: '#8A9BB0', fontSize: 10 }}>{country.dial}</span>
      {show && (
        <span className="absolute left-1/2 z-50 whitespace-nowrap rounded-lg px-3 py-2 pointer-events-none"
          style={{ bottom: '120%', transform: 'translateX(-50%)', backgroundColor: '#1E2530', border: '1px solid #2D3748', boxShadow: '0 4px 12px #0008' }}>
          <div className="text-xs font-bold" style={{ color: '#FFFFFF' }}>{country.name}</div>
          <div className="text-xs mt-0.5" style={{ color: '#C9A84C' }}>🕐 {time}</div>
        </span>
      )}
    </span>
  );
}

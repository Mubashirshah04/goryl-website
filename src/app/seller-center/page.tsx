'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useCustomSession';
import { useUserProfileStore } from '@/store/userProfileStore';
import { 
  Store, Upload, CheckCircle, ArrowLeft, 
  User, Building2, Phone, MapPin, FileText, 
  CreditCard, Shield, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { submitApplication } from '@/lib/applicationService';

// Add global styles for mobile dropdown
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      select {
        font-size: 12px !important;
        -webkit-appearance: menulist !important;
        -moz-appearance: menulist !important;
        appearance: menulist !important;
      }
      select option {
        font-size: 14px !important;
        padding: 8px 12px !important;
        line-height: 1.5 !important;
      }
    }
  `;
  if (!document.querySelector('#mobile-dropdown-styles')) {
    style.id = 'mobile-dropdown-styles';
    document.head.appendChild(style);
  }
}

export default function SellerCenterPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const authLoading = status === 'loading';
  const { profile, fetchProfile } = useUserProfileStore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<'personal' | 'brand'>('personal');
  const [countrySearchOpen, setCountrySearchOpen] = useState(false);
  const [citySearchOpen, setCitySearchOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+92');
  const [phoneCodeSearchOpen, setPhoneCodeSearchOpen] = useState(false);
  const [phoneCodeSearch, setPhoneCodeSearch] = useState('');
  
  // Get ID format based on phone country code
  const getIdFormat = () => {
    // Map phone code to country name
    const selectedCountry = asianPhoneCodes.find(c => c.code === phoneCountryCode);
    const country = selectedCountry?.country || '';
    
    const idFormats: { [key: string]: { label: string, format: string, length: number, pattern: string } } = {
      'Pakistan': { label: 'CNIC', format: '12345-1234567-1', length: 13, pattern: 'XXXXX-XXXXXXX-X' },
      'India': { label: 'Aadhaar', format: '1234-1234-1234', length: 12, pattern: 'XXXX-XXXX-XXXX' },
      'Bangladesh': { label: 'NID', format: '1234567890123456', length: 16, pattern: 'XXXXXXXXXXXXXXXX' },
      'Sri Lanka': { label: 'NIC', format: '123456789V', length: 10, pattern: 'XXXXXXXXXV' },
      'Nepal': { label: 'Citizenship No', format: '12-34-56-78901', length: 11, pattern: 'XX-XX-XX-XXXXX' },
      'China': { label: 'ID Card', format: '123456789012345678', length: 18, pattern: 'XXXXXXXXXXXXXXXXXX' },
      'Japan': { label: 'My Number', format: '1234-5678-9012', length: 12, pattern: 'XXXX-XXXX-XXXX' },
      'South Korea': { label: 'RRN', format: '123456-1234567', length: 13, pattern: 'XXXXXX-XXXXXXX' },
      'Indonesia': { label: 'KTP', format: '1234567890123456', length: 16, pattern: 'XXXXXXXXXXXXXXXX' },
      'Malaysia': { label: 'MyKad', format: '123456-12-1234', length: 12, pattern: 'XXXXXX-XX-XXXX' },
      'Singapore': { label: 'NRIC', format: 'S1234567D', length: 9, pattern: 'SXXXXXXXD' },
      'Thailand': { label: 'ID Card', format: '1-2345-67890-12-3', length: 13, pattern: 'X-XXXX-XXXXX-XX-X' },
      'Philippines': { label: 'PhilSys ID', format: '1234-5678-9012', length: 12, pattern: 'XXXX-XXXX-XXXX' },
      'Vietnam': { label: 'CCCD', format: '123456789012', length: 12, pattern: 'XXXXXXXXXXXX' },
      'UAE': { label: 'Emirates ID', format: '123-1234-1234567-1', length: 15, pattern: 'XXX-XXXX-XXXXXXX-X' },
      'Saudi Arabia': { label: 'National ID', format: '1234567890', length: 10, pattern: 'XXXXXXXXXX' },
      'Turkey': { label: 'TC Kimlik', format: '12345678901', length: 11, pattern: 'XXXXXXXXXXX' },
      'Afghanistan': { label: 'Tazkira', format: '1234567890', length: 10, pattern: 'XXXXXXXXXX' },
      'Bhutan': { label: 'CID', format: '12345678901', length: 11, pattern: 'XXXXXXXXXXX' },
      'Maldives': { label: 'ID Card', format: 'A123456', length: 7, pattern: 'AXXXXXX' },
      'Mongolia': { label: 'ID Card', format: 'АБ12345678', length: 10, pattern: 'XXXXXXXXXX' },
      'Taiwan': { label: 'ID Card', format: 'A123456789', length: 10, pattern: 'AXXXXXXXXX' },
      'Hong Kong': { label: 'HKID', format: 'A123456(7)', length: 8, pattern: 'AXXXXXX(X)' },
      'Macau': { label: 'BIR', format: '1234567(8)', length: 8, pattern: 'XXXXXXX(X)' },
      'Myanmar': { label: 'NRC', format: '12/ABC(N)123456', length: 15, pattern: 'XX/XXX(X)XXXXXX' },
      'Cambodia': { label: 'ID Card', format: '123456789', length: 9, pattern: 'XXXXXXXXX' },
      'Laos': { label: 'ID Card', format: '1234567890', length: 10, pattern: 'XXXXXXXXXX' },
      'Brunei': { label: 'IC', format: '12-345678', length: 8, pattern: 'XX-XXXXXX' },
      'Timor-Leste': { label: 'ID Card', format: '1234567890', length: 10, pattern: 'XXXXXXXXXX' },
      'Kazakhstan': { label: 'IIN', format: '123456789012', length: 12, pattern: 'XXXXXXXXXXXX' },
      'Uzbekistan': { label: 'Passport', format: 'AA1234567', length: 9, pattern: 'AAXXXXXXX' },
      'Turkmenistan': { label: 'ID Card', format: '1234567', length: 7, pattern: 'XXXXXXX' },
      'Kyrgyzstan': { label: 'Passport', format: 'AN1234567', length: 9, pattern: 'AAXXXXXXX' },
      'Tajikistan': { label: 'Passport', format: 'A1234567', length: 8, pattern: 'AXXXXXXX' },
      'Iran': { label: 'National Code', format: '1234567890', length: 10, pattern: 'XXXXXXXXXX' },
      'Iraq': { label: 'National ID', format: '12345678901234', length: 14, pattern: 'XXXXXXXXXXXXXX' },
      'Yemen': { label: 'National ID', format: '1234567890', length: 10, pattern: 'XXXXXXXXXX' },
      'Oman': { label: 'Civil ID', format: '12345678', length: 8, pattern: 'XXXXXXXX' },
      'Kuwait': { label: 'Civil ID', format: '12345678901', length: 11, pattern: 'XXXXXXXXXXX' },
      'Qatar': { label: 'QID', format: '12345678901', length: 11, pattern: 'XXXXXXXXXXX' },
      'Bahrain': { label: 'CPR', format: '123456789', length: 9, pattern: 'XXXXXXXXX' },
      'Jordan': { label: 'National ID', format: '1234567890', length: 10, pattern: 'XXXXXXXXXX' },
      'Lebanon': { label: 'ID Card', format: '1234567890', length: 10, pattern: 'XXXXXXXXXX' },
      'Syria': { label: 'National ID', format: '12345678901', length: 11, pattern: 'XXXXXXXXXXX' },
      'Palestine': { label: 'ID Card', format: '123456789', length: 9, pattern: 'XXXXXXXXX' },
      'Israel': { label: 'Teudat Zehut', format: '123456789', length: 9, pattern: 'XXXXXXXXX' },
      'Cyprus': { label: 'ID Card', format: '12345678', length: 8, pattern: 'XXXXXXXX' },
      'Armenia': { label: 'Passport', format: 'AN1234567', length: 9, pattern: 'AAXXXXXXX' },
      'Azerbaijan': { label: 'ID Card', format: 'AZE1234567', length: 10, pattern: 'XXXXXXXXXX' },
      'Georgia': { label: 'ID Card', format: '12345678901', length: 11, pattern: 'XXXXXXXXXXX' },
      'North Korea': { label: 'ID Card', format: '123456789012', length: 12, pattern: 'XXXXXXXXXXXX' },
    };
    
    return idFormats[country] || { label: 'National ID', format: '123456789012', length: 12, pattern: 'XXXXXXXXXXXX' };
  };
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    phone: '',
    storeName: '',
    businessName: '',
    businessType: '',
    description: '',
    address: '',
    city: '',
    country: '',
    cnic: '',
    bankName: '',
    accountNumber: '',
    accountTitle: '',
    website: '',
    category: '',
  });

  // Asian country phone codes with digit lengths
  const asianPhoneCodes = [
    // South Asia
    { code: '+92', country: 'Pakistan', flag: '🇵🇰', digits: 10 },
    { code: '+91', country: 'India', flag: '🇮🇳', digits: 10 },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩', digits: 10 },
    { code: '+94', country: 'Sri Lanka', flag: '🇱🇰', digits: 9 },
    { code: '+977', country: 'Nepal', flag: '🇳🇵', digits: 10 },
    { code: '+975', country: 'Bhutan', flag: '🇧🇹', digits: 8 },
    { code: '+960', country: 'Maldives', flag: '🇲🇻', digits: 7 },
    { code: '+93', country: 'Afghanistan', flag: '🇦🇫', digits: 9 },
    
    // East Asia
    { code: '+86', country: 'China', flag: '🇨🇳', digits: 11 },
    { code: '+81', country: 'Japan', flag: '🇯🇵', digits: 10 },
    { code: '+82', country: 'South Korea', flag: '🇰🇷', digits: 10 },
    { code: '+850', country: 'North Korea', flag: '🇰🇵', digits: 10 },
    { code: '+976', country: 'Mongolia', flag: '🇲🇳', digits: 8 },
    { code: '+886', country: 'Taiwan', flag: '🇹🇼', digits: 9 },
    { code: '+852', country: 'Hong Kong', flag: '🇭🇰', digits: 8 },
    { code: '+853', country: 'Macau', flag: '🇲🇴', digits: 8 },
    
    // Southeast Asia
    { code: '+62', country: 'Indonesia', flag: '🇮🇩', digits: 11 },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾', digits: 10 },
    { code: '+65', country: 'Singapore', flag: '🇸🇬', digits: 8 },
    { code: '+66', country: 'Thailand', flag: '🇹🇭', digits: 9 },
    { code: '+63', country: 'Philippines', flag: '🇵🇭', digits: 10 },
    { code: '+84', country: 'Vietnam', flag: '🇻🇳', digits: 9 },
    { code: '+95', country: 'Myanmar', flag: '🇲🇲', digits: 9 },
    { code: '+855', country: 'Cambodia', flag: '🇰🇭', digits: 9 },
    { code: '+856', country: 'Laos', flag: '🇱🇦', digits: 10 },
    { code: '+673', country: 'Brunei', flag: '🇧🇳', digits: 7 },
    { code: '+670', country: 'Timor-Leste', flag: '🇹🇱', digits: 8 },
    
    // Central Asia
    { code: '+7', country: 'Kazakhstan', flag: '🇰🇿', digits: 10 },
    { code: '+998', country: 'Uzbekistan', flag: '🇺🇿', digits: 9 },
    { code: '+993', country: 'Turkmenistan', flag: '🇹🇲', digits: 8 },
    { code: '+996', country: 'Kyrgyzstan', flag: '🇰🇬', digits: 9 },
    { code: '+992', country: 'Tajikistan', flag: '🇹🇯', digits: 9 },
    
    // Middle East / West Asia
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', digits: 9 },
    { code: '+971', country: 'UAE', flag: '🇦🇪', digits: 9 },
    { code: '+90', country: 'Turkey', flag: '🇹🇷', digits: 10 },
    { code: '+98', country: 'Iran', flag: '🇮🇷', digits: 10 },
    { code: '+964', country: 'Iraq', flag: '🇮🇶', digits: 10 },
    { code: '+967', country: 'Yemen', flag: '🇾🇪', digits: 9 },
    { code: '+968', country: 'Oman', flag: '🇴🇲', digits: 8 },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼', digits: 8 },
    { code: '+974', country: 'Qatar', flag: '🇶🇦', digits: 8 },
    { code: '+973', country: 'Bahrain', flag: '🇧🇭', digits: 8 },
    { code: '+962', country: 'Jordan', flag: '🇯🇴', digits: 9 },
    { code: '+961', country: 'Lebanon', flag: '🇱🇧', digits: 8 },
    { code: '+963', country: 'Syria', flag: '🇸🇾', digits: 9 },
    { code: '+970', country: 'Palestine', flag: '🇵🇸', digits: 9 },
    { code: '+972', country: 'Israel', flag: '🇮🇱', digits: 9 },
    { code: '+357', country: 'Cyprus', flag: '🇨🇾', digits: 8 },
    { code: '+374', country: 'Armenia', flag: '🇦🇲', digits: 8 },
    { code: '+994', country: 'Azerbaijan', flag: '🇦🇿', digits: 9 },
    { code: '+995', country: 'Georgia', flag: '🇬🇪', digits: 9 },
  ];

  // All Asian countries with their major cities
  const asianCountries = {
    // South Asia
    'Pakistan': ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Abbottabad', 'Bahawalpur', 'Sargodha'],
    'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Surat', 'Kanpur', 'Nagpur', 'Indore', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Ludhiana', 'Agra', 'Nashik', 'Varanasi', 'Meerut', 'Rajkot', 'Kochi'],
    'Bangladesh': ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Narayanganj', 'Gazipur'],
    'Sri Lanka': ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Trincomalee', 'Batticaloa', 'Anuradhapura', 'Matara'],
    'Nepal': ['Kathmandu', 'Pokhara', 'Lalitpur', 'Biratnagar', 'Bharatpur', 'Birgunj', 'Dharan', 'Hetauda', 'Butwal'],
    'Bhutan': ['Thimphu', 'Phuentsholing', 'Punakha', 'Paro', 'Gelephu', 'Wangdue Phodrang'],
    'Maldives': ['Male', 'Addu City', 'Fuvahmulah', 'Kulhudhuffushi', 'Thinadhoo'],
    'Afghanistan': ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Jalalabad', 'Kunduz', 'Ghazni', 'Balkh'],
    
    // East Asia
    'China': ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Hangzhou', 'Wuhan', 'Xian', 'Tianjin', 'Nanjing', 'Chongqing', 'Shenyang', 'Dongguan', 'Suzhou', 'Qingdao', 'Dalian', 'Zhengzhou', 'Changsha', 'Harbin', 'Kunming'],
    'Japan': ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Hiroshima', 'Sendai', 'Kawasaki', 'Saitama', 'Kitakyushu', 'Chiba', 'Niigata'],
    'South Korea': ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Ulsan', 'Suwon', 'Changwon', 'Seongnam', 'Goyang', 'Yongin', 'Bucheon'],
    'North Korea': ['Pyongyang', 'Hamhung', 'Chongjin', 'Nampo', 'Wonsan', 'Sinuiju', 'Kaesong'],
    'Mongolia': ['Ulaanbaatar', 'Erdenet', 'Darkhan', 'Choibalsan', 'Khovd', 'Olgii'],
    'Taiwan': ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan', 'Hsinchu', 'Keelung', 'Chiayi', 'Changhua'],
    'Hong Kong': ['Hong Kong'],
    'Macau': ['Macau'],
    
    // Southeast Asia
    'Indonesia': ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Tangerang', 'Depok', 'Bekasi', 'Bogor', 'Batam', 'Pekanbaru', 'Bandar Lampung', 'Padang', 'Malang', 'Denpasar', 'Balikpapan', 'Samarinda', 'Manado'],
    'Malaysia': ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Malacca City', 'Kuching', 'Kota Kinabalu', 'Seremban', 'Kuantan', 'Alor Setar', 'Kota Bharu'],
    'Singapore': ['Singapore'],
    'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Krabi', 'Hua Hin', 'Ayutthaya', 'Nakhon Ratchasima', 'Hat Yai', 'Udon Thani', 'Khon Kaen', 'Chiang Rai', 'Nakhon Si Thammarat'],
    'Philippines': ['Manila', 'Quezon City', 'Davao', 'Cebu City', 'Makati', 'Pasig', 'Taguig', 'Caloocan', 'Zamboanga', 'Antipolo', 'Cagayan de Oro', 'Paranaque', 'Dasmarinas', 'Valenzuela', 'Bacoor', 'Iloilo City', 'Bacolod'],
    'Vietnam': ['Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hai Phong', 'Can Tho', 'Nha Trang', 'Hue', 'Bien Hoa', 'Vung Tau', 'Buon Ma Thuot', 'Quy Nhon', 'Vinh', 'My Tho', 'Rach Gia'],
    'Myanmar': ['Yangon', 'Mandalay', 'Naypyidaw', 'Mawlamyine', 'Bago', 'Pathein', 'Monywa', 'Sittwe', 'Meiktila', 'Taunggyi'],
    'Cambodia': ['Phnom Penh', 'Siem Reap', 'Battambang', 'Sihanoukville', 'Kampong Cham', 'Kampot', 'Kep'],
    'Laos': ['Vientiane', 'Luang Prabang', 'Pakse', 'Savannakhet', 'Thakhek', 'Xam Neua'],
    'Brunei': ['Bandar Seri Begawan', 'Kuala Belait', 'Seria', 'Tutong'],
    'Timor-Leste': ['Dili', 'Baucau', 'Maliana', 'Suai', 'Lospalos'],
    
    // Central Asia
    'Kazakhstan': ['Almaty', 'Nur-Sultan', 'Shymkent', 'Karaganda', 'Aktobe', 'Taraz', 'Pavlodar', 'Oskemen', 'Semey', 'Atyrau', 'Kostanay', 'Kyzylorda'],
    'Uzbekistan': ['Tashkent', 'Samarkand', 'Bukhara', 'Namangan', 'Andijan', 'Fergana', 'Nukus', 'Karshi', 'Kokand', 'Margilan'],
    'Turkmenistan': ['Ashgabat', 'Turkmenabat', 'Dasoguz', 'Mary', 'Balkanabat', 'Turkmenbashi'],
    'Kyrgyzstan': ['Bishkek', 'Osh', 'Jalal-Abad', 'Karakol', 'Tokmok', 'Naryn', 'Talas'],
    'Tajikistan': ['Dushanbe', 'Khujand', 'Kulob', 'Qurghonteppa', 'Istaravshan', 'Konibodom'],
    
    // Middle East (West Asia)
    'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Abha', 'Khamis Mushait', 'Buraidah', 'Najran', 'Hail', 'Hofuf', 'Jubail', 'Dhahran', 'Yanbu', 'Taif'],
    'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Al Ain'],
    'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep', 'Konya', 'Mersin', 'Kayseri', 'Eskisehir', 'Diyarbakir', 'Samsun', 'Denizli', 'Sanliurfa', 'Malatya', 'Kahramanmaras', 'Van', 'Batman', 'Elazig'],
    'Iran': ['Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Shiraz', 'Tabriz', 'Qom', 'Ahvaz', 'Kermanshah', 'Urmia', 'Rasht', 'Kerman', 'Zahedan', 'Hamadan', 'Yazd', 'Arak', 'Ardabil', 'Bandar Abbas', 'Qazvin', 'Zanjan'],
    'Iraq': ['Baghdad', 'Basra', 'Mosul', 'Erbil', 'Najaf', 'Karbala', 'Sulaymaniyah', 'Kirkuk', 'Nasiriyah', 'Amarah', 'Duhok', 'Ramadi', 'Fallujah', 'Samarra', 'Hillah', 'Kut'],
    'Yemen': ['Sanaa', 'Aden', 'Taiz', 'Hodeidah', 'Ibb', 'Dhamar', 'Mukalla', 'Zinjibar'],
    'Oman': ['Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Ibri', 'Buraimi', 'Rustaq'],
    'Kuwait': ['Kuwait City', 'Hawalli', 'Salmiya', 'Sabah Al Salem', 'Jahra', 'Farwaniya', 'Fahaheel'],
    'Qatar': ['Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Umm Salal', 'Dukhan'],
    'Bahrain': ['Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'Isa Town', 'Sitra'],
    'Jordan': ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Russeifa', 'Madaba', 'Jerash', 'Salt'],
    'Lebanon': ['Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Nabatieh', 'Jounieh', 'Zahle', 'Baalbek'],
    'Syria': ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama', 'Deir ez-Zor', 'Raqqa', 'Daraa', 'Tartus', 'Idlib'],
    'Palestine': ['Gaza City', 'Hebron', 'Nablus', 'Ramallah', 'Bethlehem', 'Khan Yunis', 'Rafah', 'Jenin', 'Tulkarm', 'Jericho'],
    'Israel': ['Jerusalem', 'Tel Aviv', 'Haifa', 'Rishon LeZion', 'Petah Tikva', 'Ashdod', 'Netanya', 'Beersheba', 'Holon', 'Bnei Brak'],
    'Cyprus': ['Nicosia', 'Limassol', 'Larnaca', 'Famagusta', 'Paphos', 'Kyrenia'],
    'Armenia': ['Yerevan', 'Gyumri', 'Vanadzor', 'Vagharshapat', 'Hrazdan', 'Abovyan'],
    'Azerbaijan': ['Baku', 'Ganja', 'Sumqayit', 'Mingachevir', 'Lankaran', 'Shirvan', 'Nakhchivan'],
    'Georgia': ['Tbilisi', 'Batumi', 'Kutaisi', 'Rustavi', 'Gori', 'Zugdidi', 'Poti', 'Sukhumi'],
  };

  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const [documents, setDocuments] = useState({
    cnicFront: null as File | null,
    cnicBack: null as File | null,
    businessLicense: null as File | null,
    taxCertificate: null as File | null,
    bankStatement: null as File | null,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth-login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.id && !profile) {
      fetchProfile(user.id);
    }
  }, [user?.id, profile, fetchProfile]);

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If country changes, update available cities
    if (name === 'country') {
      const cities = asianCountries[value as keyof typeof asianCountries] || [];
      setAvailableCities(cities);
      setFormData(prev => ({ ...prev, [name]: value, city: '' })); // Reset city when country changes
    } else if (name === 'storeName') {
      // Convert to lowercase and remove spaces for username
      const cleanStoreName = value.toLowerCase().replace(/\s+/g, '');
      setFormData(prev => ({ ...prev, [name]: cleanStoreName }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocuments(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate store name
    if (!formData.storeName || formData.storeName.length < 3) {
      toast.error('Store name must be at least 3 characters');
      return;
    }

    setLoading(true);

    try {
      // Validation
      if (!formData.fullName || !formData.phone || !formData.address) {
        toast.error('Please fill all required fields');
        setLoading(false);
        return;
      }

      if (!documents.cnicFront || !documents.cnicBack) {
        toast.error('Please upload CNIC front and back images');
        setLoading(false);
        return;
      }

      if (accountType === 'brand' && !documents.businessLicense) {
        toast.error('Please upload business license');
        setLoading(false);
        return;
      }

      // Upload files to AWS S3 and get URLs
      const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('path', path);
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          const data = await response.json();
          
          if (!response.ok) {
            console.error('Upload API error:', data);
            throw new Error(data.details || data.error || 'Upload failed');
          }
          
          console.log('✅ File uploaded successfully:', data.url);
          return data.url;
        } catch (error) {
          console.error('❌ Upload error:', error);
          toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          throw error;
        }
      };

      // Upload all documents
      const cnicFrontUrl = documents.cnicFront 
        ? await uploadFileToStorage(documents.cnicFront, `applications/${user?.id}/cnic-front`)
        : '';
      const cnicBackUrl = documents.cnicBack 
        ? await uploadFileToStorage(documents.cnicBack, `applications/${user?.id}/cnic-back`)
        : '';
      const businessLicenseUrl = documents.businessLicense 
        ? await uploadFileToStorage(documents.businessLicense, `applications/${user?.id}/business-license`)
        : '';

      // Submit application to DynamoDB with storage URLs
      const applicationData = {
        userId: user?.id || '',
        type: accountType === 'brand' ? ('brand' as const) : ('personal_seller' as const),
        status: 'pending' as const,
        user: {
          id: user?.id || '',
          name: formData.fullName,
          email: user?.email || '',
          phone: `${phoneCountryCode}${formData.phone}`,
        },
        businessName: formData.storeName,
        website: formData.website || '',
        description: formData.description || `${accountType === 'brand' ? 'Brand' : 'Personal'} seller account`,
        category: formData.category || 'General',
        estimatedRevenue: 0,
        location: `${formData.city}, ${formData.country}`,
        documents: [
          {
            id: `doc_cnic_front_${Date.now()}`,
            name: 'CNIC Front',
            type: 'image' as const,
            url: cnicFrontUrl,
            uploadedAt: new Date(),
            verified: false,
          },
          {
            id: `doc_cnic_back_${Date.now() + 1}`,
            name: 'CNIC Back',
            type: 'image' as const,
            url: cnicBackUrl,
            uploadedAt: new Date(),
            verified: false,
          },
          ...(accountType === 'brand' && businessLicenseUrl ? [{
            id: `doc_business_license_${Date.now() + 2}`,
            name: 'Business License',
            type: 'image' as const,
            url: businessLicenseUrl,
            uploadedAt: new Date(),
            verified: false,
          }] : []),
        ],
        notes: [],
      };

      const applicationId = await submitApplication(applicationData);
      console.log('✅ Application submitted with ID:', applicationId);
      
      toast.success('Application submitted successfully! We will review it shortly.');
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-6 md:py-12 px-3 md:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-3 md:mb-4">
            <Store className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Seller Center
          </h1>
          <p className="text-sm md:text-lg text-gray-600 dark:text-gray-400">
            Start selling your products on our platform
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-2xl p-4 md:p-8 lg:p-12">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
            {/* Personal Information */}
            <div className="space-y-3 md:space-y-6">
              <h2 className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 md:mb-4">
                Personal Information
              </h2>

              <div className="space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 md:mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full px-2 py-1.5 md:px-3 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-xs md:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 md:mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    className="w-full px-2 py-1.5 md:px-3 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-xs md:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 md:mb-2">
                    Phone Number *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative w-28">
                      <input
                        type="text"
                        value={asianPhoneCodes.find(c => c.code === phoneCountryCode)?.flag + ' ' + phoneCountryCode || phoneCodeSearch}
                        onChange={(e) => {
                          setPhoneCodeSearch(e.target.value);
                          setPhoneCodeSearchOpen(true);
                        }}
                        onFocus={() => setPhoneCodeSearchOpen(true)}
                        placeholder="🇵🇰 +92"
                        className="w-full px-2 py-1.5 md:px-3 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-xs md:text-sm"
                        readOnly
                      />
                      {phoneCodeSearchOpen && (
                        <div className="absolute z-50 w-64 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {asianPhoneCodes
                            .filter(item => 
                              item.country.toLowerCase().includes(phoneCodeSearch.toLowerCase()) ||
                              item.code.includes(phoneCodeSearch)
                            )
                            .map((item) => (
                              <div
                                key={item.code}
                                onClick={() => {
                                  setPhoneCountryCode(item.code);
                                  setPhoneCodeSearch('');
                                  setPhoneCodeSearchOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer text-xs md:text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
                              >
                                <span className="text-lg">{item.flag}</span>
                                <span className="flex-1">{item.country}</span>
                                <span className="text-gray-500 dark:text-gray-400">{item.code}</span>
                              </div>
                            ))}
                        </div>
                      )}
                      {phoneCodeSearchOpen && (
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setPhoneCodeSearchOpen(false)}
                        />
                      )}
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Only digits
                        const selectedCountry = asianPhoneCodes.find(c => c.code === phoneCountryCode);
                        if (selectedCountry && value.length <= selectedCountry.digits) {
                          handleInputChange({ target: { name: 'phone', value } } as any);
                        }
                      }}
                      placeholder={`${asianPhoneCodes.find(c => c.code === phoneCountryCode)?.digits || 10} digits`}
                      className="flex-1 px-2 py-1.5 md:px-3 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-xs md:text-sm"
                      required
                      minLength={asianPhoneCodes.find(c => c.code === phoneCountryCode)?.digits}
                      maxLength={asianPhoneCodes.find(c => c.code === phoneCountryCode)?.digits}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 md:mb-2">
                    {getIdFormat().label} *
                  </label>
                  <input
                    type="text"
                    name="cnic"
                    value={formData.cnic}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9A-Za-z]/g, ''); // Only alphanumeric
                      const currentIdFormat = getIdFormat();
                      const country = asianPhoneCodes.find(c => c.code === phoneCountryCode)?.country;
                      
                      // Check if raw value exceeds limit
                      if (rawValue.length > currentIdFormat.length) {
                        return; // Don't allow more than the limit
                      }
                      
                      let value = rawValue;
                      
                      // Auto-format based on country
                      if (country === 'Pakistan' && rawValue.length <= 13) {
                        // Format: XXXXX-XXXXXXX-X
                        if (value.length > 5 && value.length <= 12) {
                          value = value.slice(0, 5) + '-' + value.slice(5);
                        } else if (value.length > 12) {
                          value = value.slice(0, 5) + '-' + value.slice(5, 12) + '-' + value.slice(12);
                        }
                      } else if (country === 'India') {
                        // Format: XXXX-XXXX-XXXX
                        if (value.length > 4 && value.length <= 8) {
                          value = value.slice(0, 4) + '-' + value.slice(4);
                        } else if (value.length > 8) {
                          value = value.slice(0, 4) + '-' + value.slice(4, 8) + '-' + value.slice(8);
                        }
                      } else if (country === 'Nepal') {
                        // Format: XX-XX-XX-XXXXX
                        if (value.length > 2 && value.length <= 4) {
                          value = value.slice(0, 2) + '-' + value.slice(2);
                        } else if (value.length > 4 && value.length <= 6) {
                          value = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4);
                        } else if (value.length > 6) {
                          value = value.slice(0, 2) + '-' + value.slice(2, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6);
                        }
                      } else if (country === 'Japan') {
                        // Format: XXXX-XXXX-XXXX
                        if (value.length > 4 && value.length <= 8) {
                          value = value.slice(0, 4) + '-' + value.slice(4);
                        } else if (value.length > 8) {
                          value = value.slice(0, 4) + '-' + value.slice(4, 8) + '-' + value.slice(8);
                        }
                      } else if (country === 'South Korea') {
                        // Format: XXXXXX-XXXXXXX
                        if (value.length > 6) {
                          value = value.slice(0, 6) + '-' + value.slice(6);
                        }
                      } else if (country === 'Malaysia') {
                        // Format: XXXXXX-XX-XXXX
                        if (value.length > 6 && value.length <= 8) {
                          value = value.slice(0, 6) + '-' + value.slice(6);
                        } else if (value.length > 8) {
                          value = value.slice(0, 6) + '-' + value.slice(6, 8) + '-' + value.slice(8);
                        }
                      } else if (country === 'Thailand') {
                        // Format: X-XXXX-XXXXX-XX-X
                        if (value.length > 1 && value.length <= 5) {
                          value = value.slice(0, 1) + '-' + value.slice(1);
                        } else if (value.length > 5 && value.length <= 10) {
                          value = value.slice(0, 1) + '-' + value.slice(1, 5) + '-' + value.slice(5);
                        } else if (value.length > 10 && value.length <= 12) {
                          value = value.slice(0, 1) + '-' + value.slice(1, 5) + '-' + value.slice(5, 10) + '-' + value.slice(10);
                        } else if (value.length > 12) {
                          value = value.slice(0, 1) + '-' + value.slice(1, 5) + '-' + value.slice(5, 10) + '-' + value.slice(10, 12) + '-' + value.slice(12);
                        }
                      } else if (country === 'Philippines') {
                        // Format: XXXX-XXXX-XXXX
                        if (value.length > 4 && value.length <= 8) {
                          value = value.slice(0, 4) + '-' + value.slice(4);
                        } else if (value.length > 8) {
                          value = value.slice(0, 4) + '-' + value.slice(4, 8) + '-' + value.slice(8);
                        }
                      } else if (country === 'UAE') {
                        // Format: XXX-XXXX-XXXXXXX-X
                        if (value.length > 3 && value.length <= 7) {
                          value = value.slice(0, 3) + '-' + value.slice(3);
                        } else if (value.length > 7 && value.length <= 14) {
                          value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
                        } else if (value.length > 14) {
                          value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 14) + '-' + value.slice(14);
                        }
                      } else if (country === 'Brunei') {
                        // Format: XX-XXXXXX
                        if (value.length > 2) {
                          value = value.slice(0, 2) + '-' + value.slice(2);
                        }
                      }
                      
                      handleInputChange({ target: { name: 'cnic', value } } as any);
                    }}
                    placeholder={`${getIdFormat().format} (${getIdFormat().length} characters)`}
                    className="w-full px-2 py-1.5 md:px-3 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-xs md:text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Account Type *
              </label>
              <div className="space-y-3">
                <label
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    accountType === 'personal'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value="personal"
                    checked={accountType === 'personal'}
                    onChange={() => setAccountType('personal')}
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-gray-900 dark:text-white">Personal Seller</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sell as an individual</p>
                  </div>
                </label>

                <label
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    accountType === 'brand'
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value="brand"
                    checked={accountType === 'brand'}
                    onChange={() => setAccountType('brand')}
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-gray-900 dark:text-white">Brand/Business</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sell as a company</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Store Name - For All Users */}
            <div className="space-y-3 md:space-y-6">
              <h2 className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300 mb-2 md:mb-4">
                Store Information
              </h2>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 md:mb-2">
                  Store Name (Username) *
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleInputChange}
                  placeholder="myawesomestore"
                  className="w-full px-2 py-1.5 md:px-3 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-xs md:text-sm"
                  required
                  minLength={3}
                  pattern="[a-z0-9]+"
                  title="Only lowercase letters and numbers, no spaces"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will be your unique username. Only lowercase letters and numbers. Cannot be changed later.
                </p>
              </div>
            </div>

            {/* Business Information (if brand) */}
            {accountType === 'brand' && (
              <div className="space-y-6">
                <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Business Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 md:mb-2">
                      Business Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Tell us about your business..."
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-sm resize-none"
                      required={accountType === 'brand'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 md:mb-2">
                      Business Email *
                    </label>
                    <input
                      type="email"
                      name="businessEmail"
                      placeholder="business@example.com"
                      className="w-full px-2 py-1.5 md:px-3 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-xs md:text-sm"
                      required={accountType === 'brand'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 md:mb-2">
                      Business Phone *
                    </label>
                    <input
                      type="tel"
                      name="businessPhone"
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-2 py-1.5 md:px-3 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-xs md:text-sm"
                      required={accountType === 'brand'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 md:mb-2">
                      Business Address
                    </label>
                    <input
                      type="text"
                      name="businessAddress"
                      placeholder="123 Business St, City, State, ZIP"
                      className="w-full px-2 py-1.5 md:px-3 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-xs md:text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Address Information */}
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Address Information
              </h2>

              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 md:mb-2">
                    Country *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.country || countrySearch}
                      onChange={(e) => {
                        setCountrySearch(e.target.value);
                        setCountrySearchOpen(true);
                      }}
                      onFocus={() => setCountrySearchOpen(true)}
                      placeholder="Search country..."
                      className="w-full px-2 py-1.5 md:px-3 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-xs md:text-sm"
                      required
                    />
                    {countrySearchOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {Object.keys(asianCountries)
                          .filter(country => 
                            country.toLowerCase().includes(countrySearch.toLowerCase())
                          )
                          .map((country) => (
                            <div
                              key={country}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, country, city: '' }));
                                setAvailableCities(asianCountries[country as keyof typeof asianCountries] || []);
                                setCountrySearch('');
                                setCountrySearchOpen(false);
                              }}
                              className="px-3 py-2 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer text-xs md:text-sm text-gray-700 dark:text-gray-300"
                            >
                              {country}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  {countrySearchOpen && (
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setCountrySearchOpen(false)}
                    />
                  )}
                </div>

                <div className="relative">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 md:mb-2">
                    City *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.city || citySearch}
                      onChange={(e) => {
                        setCitySearch(e.target.value);
                        setCitySearchOpen(true);
                      }}
                      onFocus={() => formData.country && setCitySearchOpen(true)}
                      placeholder={formData.country ? "Search city..." : "First select a country"}
                      disabled={!formData.country}
                      className="w-full px-2 py-1.5 md:px-3 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                    {citySearchOpen && formData.country && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {availableCities
                          .filter(city => 
                            city.toLowerCase().includes(citySearch.toLowerCase())
                          )
                          .map((city) => (
                            <div
                              key={city}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, city }));
                                setCitySearch('');
                                setCitySearchOpen(false);
                              }}
                              className="px-3 py-2 hover:bg-purple-50 dark:hover:bg-gray-700 cursor-pointer text-xs md:text-sm text-gray-700 dark:text-gray-300"
                            >
                              {city}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  {citySearchOpen && (
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setCitySearchOpen(false)}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 md:mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House # 123, Street Name, Area"
                    className="w-full px-2 py-1.5 md:px-3 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-xs md:text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Banking Information (Personal) / Tax & Banking (Brand) */}
            <div className="space-y-6">
              <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">
                {accountType === 'brand' ? 'Tax & Banking Information' : 'Banking Information'}
              </h2>

              <div className="space-y-4">
                {accountType === 'brand' && (
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 md:mb-2">
                      Tax ID / EIN
                    </label>
                    <input
                      type="text"
                      name="taxId"
                      placeholder="XX-XXXXXXX"
                      className="w-full px-2 py-1.5 md:px-3 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-xs md:text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 md:mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="Bank of America"
                    className="w-full px-2 py-1.5 md:px-3 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-xs md:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 md:mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    placeholder="XXXXXXXXXXXX"
                    className="w-full px-2 py-1.5 md:px-3 md:py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:text-white text-xs md:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* KYC Documents */}
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  KYC Documents
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Upload the following documents for verification
                </p>
              </div>

              <div className="space-y-4">
                {accountType === 'brand' && (
                  <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg gap-2">
                      <div className="flex-1">
                        <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Business License *</span>
                        {documents.businessLicense && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            ✓ {documents.businessLicense.name}
                          </p>
                        )}
                      </div>
                      <label className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        {documents.businessLicense ? 'Change' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileChange(e, 'businessLicense')}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg gap-2">
                      <div className="flex-1">
                        <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Tax Certificate</span>
                        {documents.taxCertificate && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            ✓ {documents.taxCertificate.name}
                          </p>
                        )}
                      </div>
                      <label className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        {documents.taxCertificate ? 'Change' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileChange(e, 'taxCertificate')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg gap-2">
                  <div className="flex-1">
                    <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Identity Proof (Passport/Driver License) *</span>
                    {documents.cnicFront && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ {documents.cnicFront.name}
                      </p>
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    {documents.cnicFront ? 'Change' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'cnicFront')}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg gap-2">
                  <div className="flex-1">
                    <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Address Proof (Utility Bill) *</span>
                    {documents.cnicBack && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ {documents.cnicBack.name}
                      </p>
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    {documents.cnicBack ? 'Change' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, 'cnicBack')}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg gap-2">
                  <div className="flex-1">
                    <span className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">Bank Statement</span>
                    {documents.bankStatement && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ {documents.bankStatement.name}
                      </p>
                    )}
                  </div>
                  <label className="flex items-center gap-2 px-3 py-2 text-xs md:text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    {documents.bankStatement ? 'Change' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, 'bankStatement')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <Shield className="w-8 h-8 mx-auto mb-3 text-purple-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Secure & Safe</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your data is encrypted and protected</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Quick Approval</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Get approved within 24-48 hours</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center">
            <Store className="w-8 h-8 mx-auto mb-3 text-blue-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Start Selling</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Begin selling immediately after approval</p>
          </div>
        </div>
      </div>
    </div>
  );
}

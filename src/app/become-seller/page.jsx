'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStoreCognito';
import { useUserProfileStore } from '@/store/userProfileStore';
import { User, Building2, Store, FileText, CheckCircle, ArrowLeft, ArrowRight, Camera, MapPin, Phone, Globe, CreditCard, Check, Search, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { submitApplication } from '@/lib/applicationService';
import { uploadFile } from '@/lib/firebaseStorage';
export default function BecomeSellerPage() {
    // All hooks must be called at the top, before any return or conditional
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showPhoneCountryDropdown, setShowPhoneCountryDropdown] = useState(false);
    const [phoneCountrySearch, setPhoneCountrySearch] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [citySearch, setCitySearch] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [cameraType, setCameraType] = useState(null);
    const [cameraStream, setCameraStream] = useState(null);
    const [applicationData, setApplicationData] = useState({
        accountType: 'personal',
        fullName: '',
        email: '',
        businessName: '',
        website: '',
        phone: '',
        countryCode: '+1',
        businessType: '',
        description: '',
        address: '',
        city: '',
        country: '',
        registrationNumber: '',
        taxId: '',
        stripeAccountId: '',
        documents: {
            idProofFront: null,
            idProofBack: null,
            businessProof: null,
            addressProof: null
        }
    });
    const { user, loading: authLoading } = useAuthStore();
    const { profile, fetchProfile } = useUserProfileStore();
    const router = useRouter();
    // Fetch user profile when component mounts
    useEffect(() => {
        if (user === null || user === void 0 ? void 0 : user.sub) {
            fetchProfile(user.sub);
        }
    }, [user === null || user === void 0 ? void 0 : user.sub, fetchProfile]);
    // Load saved application data from localStorage
    useEffect(() => {
        const savedData = localStorage.getItem('brandApplication') || localStorage.getItem('companyApplication');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            setApplicationData(prev => (Object.assign(Object.assign(Object.assign({}, prev), parsed), { accountType: localStorage.getItem('brandApplication') ? 'brand' : 'company' })));
        }
    }, []);
    useEffect(() => {
        const handleClickOutside = (event) => {
            const target = event.target;
            // Don't close if clicking inside the dropdown or search input
            if (showCountryDropdown && !target.closest('.country-dropdown')) {
                setShowCountryDropdown(false);
            }
            if (showPhoneCountryDropdown && !target.closest('.phone-country-dropdown')) {
                setShowPhoneCountryDropdown(false);
            }
            if (showCityDropdown && !target.closest('.city-dropdown')) {
                setShowCityDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCountryDropdown, showPhoneCountryDropdown, showCityDropdown]);
    const handleNextStep = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }
    };
    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };
    // ...existing code...
    // Main render logic with conditional rendering
    if (authLoading || !user) {
        return (<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{authLoading ? 'Loading...' : 'Redirecting to login...'}</p>
        </div>
      </div>);
    }
    // Countries data with flags and codes
    const countries = [
        { code: '+1', flag: '🇺🇸', name: 'United States' },
        { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
        { code: '+91', flag: '🇮🇳', name: 'India' },
        { code: '+86', flag: '🇨🇳', name: 'China' },
        { code: '+33', flag: '🇫🇷', name: 'France' },
        { code: '+49', flag: '🇩🇪', name: 'Germany' },
        { code: '+81', flag: '🇯🇵', name: 'Japan' },
        { code: '+82', flag: '🇰🇷', name: 'South Korea' },
        { code: '+61', flag: '🇦🇺', name: 'Australia' },
        { code: '+55', flag: '🇧🇷', name: 'Brazil' },
        { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
        { code: '+971', flag: '🇦🇪', name: 'UAE' },
        { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
        { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
        { code: '+94', flag: '🇱🇰', name: 'Sri Lanka' },
        { code: '+977', flag: '🇳🇵', name: 'Nepal' },
        { code: '+93', flag: '🇦🇫', name: 'Afghanistan' },
        { code: '+98', flag: '🇮🇷', name: 'Iran' },
        { code: '+90', flag: '🇹🇷', name: 'Turkey' },
        { code: '+20', flag: '🇪🇬', name: 'Egypt' },
        { code: '+27', flag: '🇿🇦', name: 'South Africa' },
        { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
        { code: '+254', flag: '🇰🇪', name: 'Kenya' },
        { code: '+212', flag: '🇲🇦', name: 'Morocco' },
        { code: '+213', flag: '🇩🇿', name: 'Algeria' },
        { code: '+216', flag: '🇹🇳', name: 'Tunisia' },
        { code: '+218', flag: '🇱🇾', name: 'Libya' },
        { code: '+220', flag: '🇬🇲', name: 'Gambia' },
        { code: '+221', flag: '🇸🇳', name: 'Senegal' },
        { code: '+222', flag: '🇲🇷', name: 'Mauritania' },
        { code: '+223', flag: '🇲🇱', name: 'Mali' },
        { code: '+224', flag: '🇬🇳', name: 'Guinea' },
        { code: '+225', flag: '🇨🇮', name: 'Ivory Coast' },
        { code: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
        { code: '+227', flag: '🇳🇪', name: 'Niger' },
        { code: '+228', flag: '🇹🇬', name: 'Togo' },
        { code: '+229', flag: '🇧🇯', name: 'Benin' },
        { code: '+230', flag: '🇲🇺', name: 'Mauritius' },
        { code: '+231', flag: '🇱🇷', name: 'Liberia' },
        { code: '+232', flag: '🇸🇱', name: 'Sierra Leone' },
        { code: '+233', flag: '🇬🇭', name: 'Ghana' },
        { code: '+235', flag: '🇹🇩', name: 'Chad' },
        { code: '+236', flag: '🇨🇫', name: 'Central African Republic' },
        { code: '+237', flag: '🇨🇲', name: 'Cameroon' },
        { code: '+238', flag: '🇨🇻', name: 'Cape Verde' },
        { code: '+239', flag: '🇸🇹', name: 'São Tomé and Príncipe' },
        { code: '+240', flag: '🇬🇶', name: 'Equatorial Guinea' },
        { code: '+241', flag: '🇬🇦', name: 'Gabon' },
        { code: '+242', flag: '🇨🇬', name: 'Republic of the Congo' },
        { code: '+243', flag: '🇨🇩', name: 'Democratic Republic of the Congo' },
        { code: '+244', flag: '🇦🇴', name: 'Angola' },
        { code: '+245', flag: '🇬🇼', name: 'Guinea-Bissau' },
        { code: '+246', flag: '🇮🇴', name: 'British Indian Ocean Territory' },
        { code: '+248', flag: '🇸🇨', name: 'Seychelles' },
        { code: '+249', flag: '🇸🇩', name: 'Sudan' },
        { code: '+250', flag: '🇷🇼', name: 'Rwanda' },
        { code: '+251', flag: '🇪🇹', name: 'Ethiopia' },
        { code: '+252', flag: '🇸🇴', name: 'Somalia' },
        { code: '+253', flag: '🇩🇯', name: 'Djibouti' },
        { code: '+255', flag: '🇹🇿', name: 'Tanzania' },
        { code: '+256', flag: '🇺🇬', name: 'Uganda' },
        { code: '+257', flag: '🇧🇮', name: 'Burundi' },
        { code: '+258', flag: '🇲🇿', name: 'Mozambique' },
        { code: '+260', flag: '🇿🇲', name: 'Zambia' },
        { code: '+261', flag: '🇲🇬', name: 'Madagascar' },
        { code: '+262', flag: '🇷🇪', name: 'Réunion' },
        { code: '+263', flag: '🇿🇼', name: 'Zimbabwe' },
        { code: '+264', flag: '🇳🇦', name: 'Namibia' },
        { code: '+265', flag: '🇲🇼', name: 'Malawi' },
        { code: '+266', flag: '🇱🇸', name: 'Lesotho' },
        { code: '+267', flag: '🇧🇼', name: 'Botswana' },
        { code: '+268', flag: '🇸🇿', name: 'Eswatini' },
        { code: '+269', flag: '🇰🇲', name: 'Comoros' },
        { code: '+290', flag: '🇸🇭', name: 'Saint Helena' },
        { code: '+291', flag: '🇪🇷', name: 'Eritrea' },
        { code: '+297', flag: '🇦🇼', name: 'Aruba' },
        { code: '+298', flag: '🇫🇴', name: 'Faroe Islands' },
        { code: '+299', flag: '🇬🇱', name: 'Greenland' },
        { code: '+350', flag: '🇬🇮', name: 'Gibraltar' },
        { code: '+351', flag: '🇵🇹', name: 'Portugal' },
        { code: '+352', flag: '🇱🇺', name: 'Luxembourg' },
        { code: '+353', flag: '🇮🇪', name: 'Ireland' },
        { code: '+354', flag: '🇮🇸', name: 'Iceland' },
        { code: '+355', flag: '🇦🇱', name: 'Albania' },
        { code: '+356', flag: '🇲🇹', name: 'Malta' },
        { code: '+357', flag: '🇨🇾', name: 'Cyprus' },
        { code: '+358', flag: '🇫🇮', name: 'Finland' },
        { code: '+359', flag: '🇧🇬', name: 'Bulgaria' },
        { code: '+370', flag: '🇱🇹', name: 'Lithuania' },
        { code: '+371', flag: '🇱🇻', name: 'Latvia' },
        { code: '+372', flag: '🇪🇪', name: 'Estonia' },
        { code: '+373', flag: '🇲🇩', name: 'Moldova' },
        { code: '+374', flag: '🇦🇲', name: 'Armenia' },
        { code: '+375', flag: '🇧🇾', name: 'Belarus' },
        { code: '+376', flag: '🇦🇩', name: 'Andorra' },
        { code: '+377', flag: '🇲🇨', name: 'Monaco' },
        { code: '+378', flag: '🇸🇲', name: 'San Marino' },
        { code: '+380', flag: '🇺🇦', name: 'Ukraine' },
        { code: '+381', flag: '🇷🇸', name: 'Serbia' },
        { code: '+382', flag: '🇲🇪', name: 'Montenegro' },
        { code: '+383', flag: '🇽🇰', name: 'Kosovo' },
        { code: '+385', flag: '🇭🇷', name: 'Croatia' },
        { code: '+386', flag: '🇸🇮', name: 'Slovenia' },
        { code: '+387', flag: '🇧🇦', name: 'Bosnia and Herzegovina' },
        { code: '+389', flag: '🇲🇰', name: 'North Macedonia' },
        { code: '+420', flag: '🇨🇿', name: 'Czech Republic' },
        { code: '+421', flag: '🇸🇰', name: 'Slovakia' },
        { code: '+423', flag: '🇱🇮', name: 'Liechtenstein' },
        { code: '+500', flag: '🇫🇰', name: 'Falkland Islands' },
        { code: '+501', flag: '🇧🇿', name: 'Belize' },
        { code: '+502', flag: '🇬🇹', name: 'Guatemala' },
        { code: '+503', flag: '🇸🇻', name: 'El Salvador' },
        { code: '+504', flag: '🇭🇳', name: 'Honduras' },
        { code: '+505', flag: '🇳🇮', name: 'Nicaragua' },
        { code: '+506', flag: '🇨🇷', name: 'Costa Rica' },
        { code: '+507', flag: '🇵🇦', name: 'Panama' },
        { code: '+508', flag: '🇵🇲', name: 'Saint Pierre and Miquelon' },
        { code: '+509', flag: '🇭🇹', name: 'Haiti' },
        { code: '+590', flag: '🇬🇵', name: 'Guadeloupe' },
        { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
        { code: '+592', flag: '🇬🇾', name: 'Guyana' },
        { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
        { code: '+594', flag: '🇬🇫', name: 'French Guiana' },
        { code: '+595', flag: '🇵🇾', name: 'Paraguay' },
        { code: '+596', flag: '🇲🇶', name: 'Martinique' },
        { code: '+597', flag: '🇸🇷', name: 'Suriname' },
        { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
        { code: '+599', flag: '🇧🇶', name: 'Caribbean Netherlands' },
        { code: '+670', flag: '🇹🇱', name: 'East Timor' },
        { code: '+672', flag: '🇦🇶', name: 'Antarctica' },
        { code: '+673', flag: '🇧🇳', name: 'Brunei' },
        { code: '+674', flag: '🇳🇷', name: 'Nauru' },
        { code: '+675', flag: '🇵🇬', name: 'Papua New Guinea' },
        { code: '+676', flag: '🇹🇴', name: 'Tonga' },
        { code: '+677', flag: '🇸🇧', name: 'Solomon Islands' },
        { code: '+678', flag: '🇻🇺', name: 'Vanuatu' },
        { code: '+679', flag: '🇫🇯', name: 'Fiji' },
        { code: '+680', flag: '🇵🇼', name: 'Palau' },
        { code: '+681', flag: '🇼🇫', name: 'Wallis and Futuna' },
        { code: '+682', flag: '🇨🇰', name: 'Cook Islands' },
        { code: '+683', flag: '🇳🇺', name: 'Niue' },
        { code: '+684', flag: '🇦🇸', name: 'American Samoa' },
        { code: '+685', flag: '🇼🇸', name: 'Samoa' },
        { code: '+686', flag: '🇰🇮', name: 'Kiribati' },
        { code: '+687', flag: '🇳🇨', name: 'New Caledonia' },
        { code: '+688', flag: '🇹🇻', name: 'Tuvalu' },
        { code: '+689', flag: '🇵🇫', name: 'French Polynesia' },
        { code: '+690', flag: '🇹🇰', name: 'Tokelau' },
        { code: '+691', flag: '🇫🇲', name: 'Micronesia' },
        { code: '+692', flag: '🇲🇭', name: 'Marshall Islands' },
        { code: '+850', flag: '🇰🇵', name: 'North Korea' },
        { code: '+852', flag: '🇭🇰', name: 'Hong Kong' },
        { code: '+853', flag: '🇲🇴', name: 'Macau' },
        { code: '+855', flag: '🇰🇭', name: 'Cambodia' },
        { code: '+856', flag: '🇱🇦', name: 'Laos' },
        { code: '+886', flag: '🇹🇼', name: 'Taiwan' },
        { code: '+960', flag: '🇲🇻', name: 'Maldives' },
        { code: '+961', flag: '🇱🇧', name: 'Lebanon' },
        { code: '+962', flag: '🇯🇴', name: 'Jordan' },
        { code: '+963', flag: '🇸🇾', name: 'Syria' },
        { code: '+964', flag: '🇮🇶', name: 'Iraq' },
        { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
        { code: '+967', flag: '🇾🇪', name: 'Yemen' },
        { code: '+968', flag: '🇴🇲', name: 'Oman' },
        { code: '+970', flag: '🇵🇸', name: 'Palestine' },
        { code: '+972', flag: '🇮🇱', name: 'Israel' },
        { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
        { code: '+974', flag: '🇶🇦', name: 'Qatar' },
        { code: '+975', flag: '🇧🇹', name: 'Bhutan' },
        { code: '+976', flag: '🇲🇳', name: 'Mongolia' },
        { code: '+992', flag: '🇹🇯', name: 'Tajikistan' },
        { code: '+993', flag: '🇹🇲', name: 'Turkmenistan' },
        { code: '+994', flag: '🇦🇿', name: 'Azerbaijan' },
        { code: '+995', flag: '🇬🇪', name: 'Georgia' },
        { code: '+996', flag: '🇰🇬', name: 'Kyrgyzstan' },
        { code: '+998', flag: '🇺🇿', name: 'Uzbekistan' }
    ];
    // Cities data organized by country
    const citiesByCountry = {
        'Pakistan': ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Sukkur', 'Larkana', 'Bahawalpur', 'Sargodha', 'Jhang', 'Sheikhupura', 'Rahim Yar Khan', 'Gujrat', 'Kasur'],
        'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara'],
        'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington'],
        'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Newcastle', 'Leicester', 'Coventry', 'Cardiff', 'Belfast', 'Nottingham', 'Hull', 'Bradford', 'Stoke-on-Trent', 'Wolverhampton', 'Plymouth'],
        'China': ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen', 'Tianjin', 'Wuhan', 'Chengdu', 'Nanjing', 'Xi\'an', 'Hangzhou', 'Dongguan', 'Foshan', 'Jinan', 'Shenyang', 'Harbin', 'Zhengzhou', 'Qingdao', 'Dalian', 'Ningbo', 'Xiamen'],
        'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Bremen', 'Dresden', 'Hannover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster'],
        'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne'],
        'Japan': ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kawasaki', 'Kyoto', 'Saitama', 'Hiroshima', 'Sendai', 'Kitakyushu', 'Chiba', 'Sakai', 'Niigata', 'Hamamatsu', 'Okayama', 'Kumamoto', 'Shizuoka'],
        'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong', 'Hobart', 'Geelong', 'Townsville', 'Cairns', 'Darwin', 'Toowoomba', 'Ballarat', 'Bendigo', 'Albury', 'Launceston'],
        'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Goiânia', 'Belém', 'Porto Alegre', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal', 'Teresina'],
        'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Taif', 'Tabuk', 'Buraidah', 'Khamis Mushait', 'Hail', 'Hofuf', 'Mubarraz', 'Ha\'il', 'Jubail', 'Yanbu', 'Abha', 'Najran', 'Al Qunfudhah', 'Sakaka'],
        'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain', 'Khor Fakkan', 'Kalba', 'Dibba Al-Fujairah', 'Masafi', 'Hatta', 'Madinat Zayed', 'Liwa', 'Ruwais', 'Ghayathi', 'Sila', 'Delma Island', 'Sir Bani Yas'],
        'Bangladesh': ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Narayanganj', 'Gazipur', 'Jessore', 'Cox\'s Bazar', 'Bogra', 'Dinajpur', 'Pabna', 'Kushtia', 'Faridpur', 'Saidpur', 'Nawabganj'],
        'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Mersin', 'Diyarbakır', 'Kayseri', 'Eskişehir', 'Urfa', 'Malatya', 'Erzurum', 'Van', 'Batman', 'Elazığ', 'Isparta', 'Trabzon'],
        'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'El Mahalla El Kubra', 'Tanta', 'Asyut', 'Ismailia', 'Faiyum', 'Zagazig', 'Aswan', 'Damietta', 'Minya', 'Beni Suef', 'Hurghada', 'Qena'],
        'South Africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Pietermaritzburg', 'Nelspruit', 'Kimberley', 'Polokwane', 'Rustenburg', 'Welkom', 'Klerksdorp', 'Potchefstroom', 'Vereeniging', 'Soweto', 'Tembisa', 'Umlazi', 'Khayelitsha'],
        'Nigeria': ['Lagos', 'Kano', 'Ibadan', 'Benin City', 'Port Harcourt', 'Jos', 'Ilorin', 'Abuja', 'Kaduna', 'Maiduguri', 'Zaria', 'Aba', 'Ilesa', 'Onitsha', 'Iwo', 'Ado-Ekiti', 'Akure', 'Gusau', 'Ijebu-Ode', 'Effon-Alaiye'],
        'Kenya': ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 'Garissa', 'Kakamega', 'Nyeri', 'Meru', 'Machakos', 'Kisii', 'Naivasha', 'Nanyuki', 'Kericho', 'Embu', 'Voi', 'Kilifi']
    };
    // Business types with all categories from category pages
    const businessTypes = [
        'Electronics & Technology',
        'Fashion & Apparel',
        'Beauty & Health',
        'Home & Garden',
        'Sports & Fitness',
        'Books & Media',
        'Toys & Games',
        'Automotive',
        'Food & Beverages',
        'Business & Industrial',
        'Collectibles & Art',
        'Jewelry & Watches',
        'Musical Instruments',
        'Office & School Supplies',
        'Pet Supplies',
        'Travel & Luggage',
        'Health & Medicine',
        'Fruits & Vegetables',
        'Dairy Products',
        'Meat & Poultry',
        'Bakery & Confectionery',
        'Beverages & Drinks',
        'Snacks & Nuts',
        'Spices & Seasonings',
        'Organic Products',
        'Baby Products',
        'Women\'s Fashion',
        'Men\'s Fashion',
        'Kids\' Fashion',
        'Shoes & Footwear',
        'Accessories',
        'Jewelry',
        'Watches',
        'Bags & Handbags',
        'Cosmetics',
        'Skincare',
        'Hair Care',
        'Personal Care',
        'Fitness Equipment',
        'Sports Apparel',
        'Outdoor Gear',
        'Team Sports',
        'Individual Sports',
        'Water Sports',
        'Winter Sports',
        'Exercise & Yoga',
        'Supplements',
        'Medical Equipment',
        'Pharmaceuticals',
        'Health Supplements',
        'Medical Devices',
        'Diagnostic Equipment',
        'Surgical Instruments',
        'Dental Equipment',
        'Veterinary Supplies',
        'Laboratory Equipment',
        'Rehabilitation Equipment',
        'Emergency Medical',
        'Other'
    ];
    // Filter countries based on search
    const filteredCountries = countries.filter(country => country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        country.code.includes(countrySearch));
    // Filter cities based on selected country
    const filteredCities = selectedCountry ?
        (citiesByCountry[selectedCountry] || []).filter(city => city.toLowerCase().includes(citySearch.toLowerCase())) : [];
    // Handle country selection
    const handleCountrySelect = (country) => {
        setSelectedCountry(country.name);
        setApplicationData(prev => (Object.assign(Object.assign({}, prev), { country: country.name })));
        setShowCountryDropdown(false);
        setCountrySearch('');
        setSelectedCity('');
        setApplicationData(prev => (Object.assign(Object.assign({}, prev), { city: '' })));
    };
    // Handle city selection
    const handleCitySelect = (city) => {
        setSelectedCity(city);
        setApplicationData(prev => (Object.assign(Object.assign({}, prev), { city })));
        setShowCityDropdown(false);
        setCitySearch('');
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setApplicationData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
    };
    const handleFileChange = (e, field) => {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (file) {
            setApplicationData(prev => (Object.assign(Object.assign({}, prev), { documents: Object.assign(Object.assign({}, prev.documents), { [field]: file }) })));
        }
    };
    const uploadDocumentFile = async (file, userId, fieldName) => {
        try {
            console.log(`📤 Starting upload for ${fieldName}:`, { fileName: file.name, fileSize: file.size });
            const result = await uploadFile(file, `applications/${userId}/${file.name}`);
            console.log(`✅ Upload completed for ${fieldName}:`, result);
            return result.url;
        }
        catch (error) {
            console.error(`❌ Upload failed for ${fieldName}:`, error);
            throw error;
        }
    };
    const handleSubmit = async (e) => {
        var _a, _b, _c, _d;
        e.preventDefault();
        if (!user) {
            toast.error('Please login to submit application');
            return;
        }
        setLoading(true);
        console.log('🚀 Starting application submission...');
        try {
            // Upload documents to Firebase Storage
            const documentUrls = [];
            console.log('📁 Uploading documents to Firebase Storage...');
            console.log('📄 Documents to be uploaded:', {
                idProofFront: (_a = applicationData.documents.idProofFront) === null || _a === void 0 ? void 0 : _a.name,
                idProofBack: (_b = applicationData.documents.idProofBack) === null || _b === void 0 ? void 0 : _b.name,
                businessProof: (_c = applicationData.documents.businessProof) === null || _c === void 0 ? void 0 : _c.name,
                addressProof: (_d = applicationData.documents.addressProof) === null || _d === void 0 ? void 0 : _d.name
            });
            // Upload documents
            if (applicationData.documents.idProofFront) {
                const url = await uploadDocumentFile(applicationData.documents.idProofFront, user.sub, 'idProofFront');
                documentUrls.push({
                    id: 'idProofFront',
                    name: applicationData.documents.idProofFront.name,
                    type: 'image',
                    url: url,
                    uploadedAt: new Date(),
                    verified: false
                });
            }
            if (applicationData.documents.idProofBack) {
                const url = await uploadDocumentFile(applicationData.documents.idProofBack, user.sub, 'idProofBack');
                documentUrls.push({
                    id: 'idProofBack',
                    name: applicationData.documents.idProofBack.name,
                    type: 'image',
                    url: url,
                    uploadedAt: new Date(),
                    verified: false
                });
            }
            if (applicationData.documents.businessProof) {
                const url = await uploadDocumentFile(applicationData.documents.businessProof, user.sub, 'businessProof');
                documentUrls.push({
                    id: 'businessProof',
                    name: applicationData.documents.businessProof.name,
                    type: 'image',
                    url: url,
                    uploadedAt: new Date(),
                    verified: false
                });
            }
            if (applicationData.documents.addressProof) {
                const url = await uploadDocumentFile(applicationData.documents.addressProof, user.sub, 'addressProof');
                documentUrls.push({
                    id: 'addressProof',
                    name: applicationData.documents.addressProof.name,
                    type: 'image',
                    url: url,
                    uploadedAt: new Date(),
                    verified: false
                });
            }
            console.log('📋 Preparing application payload...');
            // Prepare application payload with correct structure for applicationService
            const applicationPayload = {
                userId: user.sub,
                user: {
                    id: user.sub,
                    name: applicationData.fullName,
                    email: applicationData.email,
                    phone: applicationData.phone
                },
                type: applicationData.accountType === 'personal' ? 'personal_seller' :
                    applicationData.accountType === 'brand' ? 'brand' : 'company',
                status: 'pending',
                businessName: applicationData.businessName,
                website: applicationData.website,
                description: applicationData.description,
                category: 'General',
                estimatedRevenue: 0,
                location: `${applicationData.city}, ${applicationData.country}`,
                documents: documentUrls,
                notes: []
            };
            console.log('📤 Submitting application to Firebase...');
            console.log('📄 Application payload:', applicationPayload);
            // Submit application to Firebase
            const applicationId = await submitApplication(applicationPayload);
            console.log('✅ Application submitted successfully with ID:', applicationId);
            // Clear saved data from localStorage
            localStorage.removeItem('brandApplication');
            localStorage.removeItem('companyApplication');
            toast.success('Application submitted successfully! We\'ll review it within 24-48 hours.');
            // Use ID-based routing
            router.push('/profile/' + user.sub);
        }
        catch (error) {
            console.error('❌ Application submission error:', error);
            // More specific error messages
            if (error.message.includes('storage/unauthorized')) {
                toast.error('Upload failed: Unauthorized. Please check your permissions.');
            }
            else if (error.message.includes('storage/quota-exceeded')) {
                toast.error('Upload failed: Storage quota exceeded.');
            }
            else if (error.message.includes('storage/network-request-failed')) {
                toast.error('Upload failed: Network error. Please check your connection.');
            }
            else if (error.message.includes('permission-denied')) {
                toast.error('Permission denied. Please check your Firebase configuration.');
            }
            else {
                toast.error(`Failed to submit application: ${error.message}`);
            }
        }
        finally {
            setLoading(false);
        }
    };
    const steps = [
        { number: 1, title: 'Account Type', icon: User },
        { number: 2, title: 'Business Info', icon: Building2 },
        { number: 3, title: 'Payment Setup', icon: CreditCard },
        { number: 4, title: 'Documents', icon: FileText },
        { number: 5, title: 'Review', icon: CheckCircle }
    ];
    // Camera functionality
    const startCamera = async (type, documentType) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: type === 'front' ? 'user' : 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            setCameraStream(stream);
            setCameraType(type);
            setShowCamera(true);
            // Store document type for later use
            setApplicationData(prev => (Object.assign(Object.assign({}, prev), { currentDocumentType: documentType })));
        }
        catch (error) {
            toast.error('Camera access denied. Please allow camera access to continue.');
        }
    };
    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setShowCamera(false);
        setCameraType(null);
    };
    const capturePhoto = () => {
        const video = document.getElementById('camera-video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (video && ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `document_${cameraType}_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setApplicationData(prev => {
                        const newDocuments = Object.assign({}, prev.documents);
                        if (prev.currentDocumentType === 'id') {
                            newDocuments[`idProof${cameraType === 'front' ? 'Front' : 'Back'}`] = file;
                        }
                        else if (prev.currentDocumentType === 'business') {
                            newDocuments.businessProof = file;
                        }
                        else if (prev.currentDocumentType === 'address') {
                            newDocuments.addressProof = file;
                        }
                        return Object.assign(Object.assign({}, prev), { documents: newDocuments });
                    });
                    toast.success('Document captured successfully!');
                    stopCamera();
                }
            }, 'image/jpeg', 0.8);
        }
    };
    const renderStepContent = () => {
        var _a, _b, _c, _d, _e;
        switch (currentStep) {
            case 1:
                return (<div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Choose your account type</h3>
            <div className="space-y-4">
              <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer transition-all duration-200">
                <input type="radio" name="accountType" value="personal" checked={applicationData.accountType === 'personal'} onChange={handleInputChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"/>
                <div className="ml-3">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-purple-600 mr-2"/>
                    <span className="font-medium text-gray-900 dark:text-white">Personal Seller</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">For individual sellers and creators</p>
                </div>
              </label>
              
              <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer transition-all duration-200">
                <input type="radio" name="accountType" value="brand" checked={applicationData.accountType === 'brand'} onChange={handleInputChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"/>
                <div className="ml-3">
                  <div className="flex items-center">
                    <Store className="w-5 h-5 text-purple-600 mr-2"/>
                    <span className="font-medium text-gray-900 dark:text-white">Brand Account</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">For established brands and retailers</p>
                </div>
              </label>
              
              <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer transition-all duration-200">
                <input type="radio" name="accountType" value="company" checked={applicationData.accountType === 'company'} onChange={handleInputChange} className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"/>
                <div className="ml-3">
                  <div className="flex items-center">
                    <Building2 className="w-5 h-5 text-purple-600 mr-2"/>
                    <span className="font-medium text-gray-900 dark:text-white">Company Account</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">For businesses with multiple brands</p>
                </div>
              </label>
            </div>
          </div>);
            case 2:
                return (<div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Business Information</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input id="fullName" name="fullName" type="text" required value={applicationData.fullName} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="Enter your full name"/>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                  <input id="email" name="email" type="email" required value={applicationData.email} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="your-email@example.com"/>
                </div>

              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                  {applicationData.accountType === 'personal' ? 'Business Name' :
                        applicationData.accountType === 'brand' ? 'Brand Name' : 'Company Name'} <span className="text-red-500">*</span>
                </label>
                <input id="businessName" name="businessName" type="text" required value={applicationData.businessName} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder={`Enter your ${applicationData.accountType === 'personal' ? 'business' : applicationData.accountType} name`}/>
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                  Website URL <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                  <input id="website" name="website" type="url" value={applicationData.website} onChange={handleInputChange} className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm" placeholder="https://yourwebsite.com"/>
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex space-x-1">
                  <div className="relative w-28">
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 cursor-pointer flex items-center justify-between phone-country-dropdown" onClick={() => setShowPhoneCountryDropdown(!showPhoneCountryDropdown)}>
                      <div className="flex items-center space-x-1">
                        <span>{(_a = countries.find(c => c.code === applicationData.countryCode)) === null || _a === void 0 ? void 0 : _a.flag}</span>
                        <span className="text-xs">{applicationData.countryCode}</span>
                      </div>
                      <ChevronDown className="w-4 h-4"/>
                    </div>
                    
                    {showPhoneCountryDropdown && (<div className="phone-country-dropdown absolute z-50 w-80 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-1 border-b border-gray-200">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                            <input type="text" placeholder="Search countries..." value={phoneCountrySearch} onChange={(e) => setPhoneCountrySearch(e.target.value)} className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500"/>
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {countries.filter(country => country.name.toLowerCase().includes(phoneCountrySearch.toLowerCase()) ||
                            country.code.includes(phoneCountrySearch)).map((country) => (<div key={country.code} className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer" onClick={() => {
                                setApplicationData(prev => (Object.assign(Object.assign({}, prev), { countryCode: country.code })));
                                setShowPhoneCountryDropdown(false);
                                setPhoneCountrySearch('');
                            }}>
                              <span className="text-sm mr-2">{country.flag}</span>
                              <span className="text-xs font-medium mr-2">{country.code}</span>
                              <span className="text-xs text-gray-600 flex-1">{country.name}</span>
                            </div>))}
                        </div>
                      </div>)}
                  </div>
                  <div className="flex-1 relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-5 h-5"/>
                    <input id="phone" name="phone" type="tel" required value={applicationData.phone} onChange={handleInputChange} className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm" placeholder="(555) 123-4567"/>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                  Business type <span className="text-red-500">*</span>
                </label>
                <select id="businessType" name="businessType" value={applicationData.businessType} onChange={handleInputChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-lg">
                  <option value="">Select business type</option>
                  {businessTypes.map((type) => (<option key={type} value={type.toLowerCase().replace(/\s+/g, '-')}>
                      {type}
                    </option>))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea id="description" name="description" rows={3} required value={applicationData.description} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="Tell us about your business..."/>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                  <input id="address" name="address" type="text" required value={applicationData.address} onChange={handleInputChange} className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm" placeholder="Business address"/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-black focus:outline-none focus:ring-purple-500 focus:border-purple-500 cursor-pointer flex items-center justify-between country-dropdown" onClick={() => setShowCountryDropdown(!showCountryDropdown)}>
                      <span className="truncate text-black">
                        {selectedCountry || 'Select Country'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500"/>
                    </div>
                    
                    {showCountryDropdown && (<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto country-dropdown">
                        <div className="p-1">
                          <input type="text" placeholder="Search countries..." value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-purple-500 focus:border-purple-500" onClick={(e) => e.stopPropagation()}/>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredCountries.map((country) => (<div key={country.code} className="px-2 py-1 text-sm text-black hover:bg-purple-50 cursor-pointer flex items-center space-x-2" onClick={() => handleCountrySelect(country.name)}>
                              <span>{country.flag}</span>
                              <span className="truncate text-black">{country.name}</span>
                            </div>))}
                        </div>
                      </div>)}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-black focus:outline-none focus:ring-purple-500 focus:border-purple-500 cursor-pointer flex items-center justify-between city-dropdown" onClick={() => selectedCountry && setShowCityDropdown(!showCityDropdown)}>
                      <span className="truncate text-black">
                        {selectedCity || (selectedCountry ? 'Select City' : 'Select Country First')}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500"/>
                    </div>
                    
                    {showCityDropdown && selectedCountry && (<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto city-dropdown">
                        <div className="p-1">
                          <input type="text" placeholder="Search cities..." value={citySearch} onChange={(e) => setCitySearch(e.target.value)} className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-purple-500 focus:border-purple-500" onClick={(e) => e.stopPropagation()}/>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredCities.map((city) => (<div key={city} className="px-2 py-1 text-sm text-black hover:bg-purple-50 cursor-pointer" onClick={() => handleCitySelect(city)}>
                              {city}
                            </div>))}
                        </div>
                      </div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>);
            case 3:
                return (<div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payment Setup</h3>
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <CreditCard className="w-8 h-8 text-purple-600 mr-3"/>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Stripe Payment Integration</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Secure payment processing with Stripe</p>
                </div>
              </div>
                
                <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5"/>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Fast & Secure Payments</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Process payments instantly with industry-leading security</p>
                  </div>
                  </div>

                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5"/>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Global Reach</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Accept payments from customers worldwide</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Check className="w-5 h-5 text-green-500 mt-0.5"/>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Low Fees</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">Competitive rates starting from 2.9% + 30¢</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <label htmlFor="stripeAccountId" className="block text-sm font-medium text-gray-700">
                  Stripe Account ID (Optional)
                    </label>
                    <input id="stripeAccountId" name="stripeAccountId" type="text" value={applicationData.stripeAccountId} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500" placeholder="acct_1234567890 (if you have an existing Stripe account)"/>
                    <p className="mt-1 text-xs text-gray-500">
                  Leave blank if you don't have a Stripe account yet. We'll help you set one up after approval.
                    </p>
              </div>
            </div>
          </div>);
            case 4:
                return (<div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Required Documents</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">All documents are required. Use live camera scan for better quality.</p>
            <div className="space-y-6">
              {/* ID Proof Front */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Proof Front (Passport, Driver's License, or National ID) *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-300">
                    <div className="space-y-2 text-center">
                      <Camera className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500"/>
                      <button type="button" onClick={() => startCamera('front', 'id')} className="text-sm font-medium text-purple-600 hover:text-purple-500">
                        📷 Live Scan Front
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-300">
                    <div className="space-y-1 text-center">
                      <FileText className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500"/>
                      <label htmlFor="idProofFront" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                        <span className="text-sm">Upload File</span>
                        <input id="idProofFront" name="idProofFront" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'idProofFront')} className="sr-only"/>
                      </label>
                    </div>
                  </div>
                </div>
                {applicationData.documents.idProofFront && (<p className="mt-2 text-sm text-green-600">✓ {applicationData.documents.idProofFront.name}</p>)}
              </div>

              {/* ID Proof Back */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Proof Back (Passport, Driver's License, or National ID) *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-300">
                    <div className="space-y-2 text-center">
                      <Camera className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500"/>
                      <button type="button" onClick={() => startCamera('back', 'id')} className="text-sm font-medium text-purple-600 hover:text-purple-500">
                        📷 Live Scan Back
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-300">
                    <div className="space-y-1 text-center">
                      <FileText className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500"/>
                      <label htmlFor="idProofBack" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                        <span className="text-sm">Upload File</span>
                        <input id="idProofBack" name="idProofBack" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'idProofBack')} className="sr-only"/>
                      </label>
                    </div>
                  </div>
                </div>
                {applicationData.documents.idProofBack && (<p className="mt-2 text-sm text-green-600">✓ {applicationData.documents.idProofBack.name}</p>)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Proof (Business License, Registration Certificate) *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-300">
                    <div className="space-y-2 text-center">
                      <Camera className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500"/>
                      <button type="button" onClick={() => startCamera('front', 'business')} className="text-sm font-medium text-purple-600 hover:text-purple-500">
                        📷 Live Scan
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-300">
                    <div className="space-y-1 text-center">
                      <FileText className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500"/>
                      <label htmlFor="businessProof" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                        <span className="text-sm">Upload File</span>
                        <input id="businessProof" name="businessProof" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'businessProof')} className="sr-only"/>
                      </label>
                    </div>
                  </div>
                </div>
                {applicationData.documents.businessProof && (<p className="mt-2 text-sm text-green-600">✓ {applicationData.documents.businessProof.name}</p>)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address Proof (Utility Bill, Bank Statement) *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-300">
                    <div className="space-y-2 text-center">
                      <Camera className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500"/>
                      <button type="button" onClick={() => startCamera('front', 'address')} className="text-sm font-medium text-purple-600 hover:text-purple-500">
                        📷 Live Scan
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-300">
                    <div className="space-y-1 text-center">
                      <MapPin className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500"/>
                      <label htmlFor="addressProof" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                        <span className="text-sm">Upload File</span>
                        <input id="addressProof" name="addressProof" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'addressProof')} className="sr-only"/>
                      </label>
                    </div>
                  </div>
                </div>
                {applicationData.documents.addressProof && (<p className="mt-2 text-sm text-green-600">✓ {applicationData.documents.addressProof.name}</p>)}
              </div>
            </div>
          </div>);
            case 5:
                return (<div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Review Your Application</h3>
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Account Type</h4>
                <p className="text-sm text-gray-600 capitalize">{applicationData.accountType} Seller</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Business Information</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {applicationData.businessName}</p>
                  <p><strong>Phone:</strong> {applicationData.phone}</p>
                  <p><strong>Website:</strong> {applicationData.website || 'Not provided'}</p>
                  <p><strong>Business Type:</strong> {applicationData.businessType}</p>
                  <p><strong>Address:</strong> {applicationData.address}, {applicationData.city}, {applicationData.country}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Payment Setup</h4>
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>Stripe Account:</strong> {applicationData.stripeAccountId || 'Will be set up after approval'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Documents</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>✓ ID Proof Front: {((_b = applicationData.documents.idProofFront) === null || _b === void 0 ? void 0 : _b.name) || 'Not uploaded'}</p>
                  <p>✓ ID Proof Back: {((_c = applicationData.documents.idProofBack) === null || _c === void 0 ? void 0 : _c.name) || 'Not uploaded'}</p>
                  <p>✓ Business Proof: {((_d = applicationData.documents.businessProof) === null || _d === void 0 ? void 0 : _d.name) || 'Not uploaded'}</p>
                  <p>✓ Address Proof: {((_e = applicationData.documents.addressProof) === null || _e === void 0 ? void 0 : _e.name) || 'Not uploaded'}</p>
                </div>
              </div>
            </div>
          </div>);
            default:
                return null;
        }
    };
    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return applicationData.accountType;
            case 2:
                return applicationData.fullName && applicationData.email && applicationData.businessName && applicationData.phone && applicationData.businessType && applicationData.description && applicationData.address && applicationData.city && applicationData.country;
            case 3:
                return applicationData.stripeAccountId; // Stripe setup is now required
            case 4:
                return applicationData.documents.idProofFront && applicationData.documents.idProofBack && applicationData.documents.businessProof && applicationData.documents.addressProof;
            default:
                return true;
        }
    };
    return (<div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
            <span className="text-white font-bold text-xl sm:text-2xl">Z</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
            Become a Seller
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Complete your seller application
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white shadow-xl border border-gray-200 rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center justify-between overflow-x-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            return (<div key={step.number} className="flex items-center min-w-0">
                  <div className={`flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full transition-all duration-300 ${isCompleted ? 'bg-green-500 shadow-lg' : isActive ? 'bg-purple-600 shadow-lg' : 'bg-purple-100 border-2 border-purple-300'}`}>
                  {isCompleted ? (<CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white"/>) : (<Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${isActive ? 'text-white' : 'text-purple-600'}`}/>)}
                </div>
                {index < steps.length - 1 && (<div className={`w-8 sm:w-16 h-1 mx-2 sm:mx-4 transition-all duration-300 ${isCompleted ? 'bg-green-500' : 'bg-purple-200'}`}/>)}
              </div>);
        })}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-xl border border-gray-200 rounded-3xl p-4 sm:p-6 lg:p-8">
          <form onSubmit={handleSubmit}>
            {renderStepContent()}
            
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between gap-4">
              <button type="button" onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))} disabled={currentStep === 1} className="inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg">
                <ArrowLeft className="w-4 h-4 mr-2"/>
                Previous
              </button>
              
              {currentStep < 5 ? (<button type="button" onClick={() => setCurrentStep(prev => prev + 1)} disabled={!canProceed()} className="inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2"/>
                </button>) : (<button type="submit" disabled={loading || !canProceed()} className="inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg">
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>)}
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300">
            <ArrowLeft className="w-4 h-4 mr-1"/>
            Back to home
          </Link>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (<div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Scan Document - {cameraType === 'front' ? 'Front' : 'Back'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Position your document clearly in the camera view</p>
            </div>
            
            <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4">
              <video id="camera-video" autoPlay playsInline className="w-full h-48 sm:h-64 object-cover" ref={(video) => {
                if (video && cameraStream) {
                    video.srcObject = cameraStream;
                }
            }}/>
              <div className="absolute inset-0 border-2 border-dashed border-purple-400 rounded-lg pointer-events-none">
                <div className="absolute top-2 left-2 right-2 bottom-2 border border-purple-300 rounded"></div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={stopCamera} className="flex-1 px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300">
                Cancel
              </button>
              <button type="button" onClick={capturePhoto} className="flex-1 px-4 py-3 bg-purple-600 text-sm font-medium rounded-lg text-white hover:bg-purple-700 transition-all duration-300">
                📷 Capture Photo
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}


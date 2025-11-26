'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from '@/hooks/useCustomSession'
import { useUserProfileStore } from '@/store/userProfileStore'
import { 
  User, Building2, Store, Upload, FileText, CheckCircle, 
  ArrowLeft, ArrowRight, Camera, MapPin, Phone, Globe, 
  CreditCard, Shield, Check, Search, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import { submitApplication } from '@/lib/applicationService'
import { uploadFile } from '@/lib/firebaseStorage'
// ✅ AWS DYNAMODB - Firestore removed
import { Application } from '@/lib/types'
import { createArtisanKYC, createBusinessKYC, validateCNIC } from '@/lib/kycService'
import { AlertCircle, FileImage, FileVideo, X, AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  strictValidateCNIC,
  validateDocumentImage,
  strictCheckCNICDuplication,
  validateSelfieRequirements,
  generateDeviceFingerprint,
  getClientIP
} from '@/lib/kycVerificationService'
import { verifyFaceMatch, loadFaceModels, validateSelfieForVerification } from '@/lib/faceVerificationService'

interface ApplicationData {
  accountType: 'personal' | 'brand'
  fullName: string
  email: string
  businessName: string
  website: string
  phone: string
  countryCode: string
  businessType: string
  description: string
  address: string
  city: string
  country: string
  registrationNumber: string
  taxId: string
  currentDocumentType?: 'id' | 'business' | 'address'
  documents: {
    idProofFront: File | null
    idProofBack: File | null
    businessProof: File | null
    addressProof: File | null
  }
  // KYC Fields for Artisan
  kycCnic?: string
  kycCnicFront?: File | null
  kycCnicBack?: File | null
  kycSelfie?: File | null
  kycProvince?: string
  kycPostalCode?: string
  kycProductionAddress?: string
  kycProductProof?: File[]
  kycProductDescription?: string
  kycBankName?: string
  kycBankAccountNumber?: string
  kycBankAccountTitle?: string
  // KYC Fields for Business
  kycBusinessRegistrationId?: string
  kycFbrNTN?: string
  kycBusinessLicense?: File | null
  kycTaxCertificate?: File | null
  kycIban?: string
}

export default function BecomeSellerPage() {
  // All hooks must be called at the top, before any return or conditional
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showPhoneCountryDropdown, setShowPhoneCountryDropdown] = useState(false)
  const [phoneCountrySearch, setPhoneCountrySearch] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [citySearch, setCitySearch] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [cameraType, setCameraType] = useState<'front' | 'back' | 'selfie' | null>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [showSelfieCamera, setShowSelfieCamera] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const [selfieVerificationInProgress, setSelfieVerificationInProgress] = useState(false)
  // Strict verification states
  const [cnicValidation, setCnicValidation] = useState<{ isValid: boolean; errors: string[]; formatted: string } | null>(null)
  const [documentValidations, setDocumentValidations] = useState<Record<string, { isValid: boolean; errors: string[]; warnings: string[]; qualityScore: number }>>({})
  const [cnicDuplicateCheck, setCnicDuplicateCheck] = useState<{ isDuplicate: boolean; riskScore: number } | null>(null)
  const [isValidatingDocuments, setIsValidatingDocuments] = useState(false)
  const [faceVerificationResult, setFaceVerificationResult] = useState<{ success: boolean; similarityScore: number; errors: string[]; warnings: string[] } | null>(null)
  const [isVerifyingFace, setIsVerifyingFace] = useState(false)
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false)
  const [applicationData, setApplicationData] = useState<ApplicationData>({
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
    documents: {
      idProofFront: null,
      idProofBack: null,
      businessProof: null,
      addressProof: null
    },
    // KYC Artisan fields
    kycCnic: '',
    kycCnicFront: null,
    kycCnicBack: null,
    kycSelfie: null,
    kycProvince: '',
    kycPostalCode: '',
    kycProductionAddress: '',
    kycProductProof: [],
    kycProductDescription: '',
    kycBankName: '',
    kycBankAccountNumber: '',
    kycBankAccountTitle: '',
    // KYC Business fields
    kycBusinessRegistrationId: '',
    kycFbrNTN: '',
    kycBusinessLicense: null,
    kycTaxCertificate: null,
    kycIban: ''
  })
  const { data: session, status } = useSession()
  const user = session?.user
  const authLoading = status === 'loading'
  const { profile, fetchProfile } = useUserProfileStore()
  const router = useRouter()

  // Fetch user profile when component mounts
  useEffect(() => {
    if (user?.id || user?.email) {
      fetchProfile(user.id || user.email)
    }
  }, [user?.id, user?.email, fetchProfile])

  // Load face verification models early (when user reaches step 2) for better UX
  useEffect(() => {
    // Start loading models as soon as user reaches step 2 (Business Info) for faster UX
    if (currentStep >= 2 && !faceModelsLoaded) {
      console.log('🔄 Starting to load face models (early pre-load)...')
      
      // Set timeout for model loading (20 seconds) - if takes too long, allow user to proceed
      const loadingTimeout = setTimeout(() => {
        console.warn('⏱️ Face models taking too long to load, allowing fallback')
        setFaceModelsLoaded(true) // Allow user to proceed anyway
        toast.warning('Face models loading slowly. You can still proceed with camera verification.')
      }, 20000) // Reduced to 20 seconds
      
      loadFaceModels()
        .then(() => {
          clearTimeout(loadingTimeout)
          setFaceModelsLoaded(true)
          console.log('✅ Face verification models loaded successfully')
        })
        .catch((error) => {
          clearTimeout(loadingTimeout)
          console.error('❌ Failed to load face models:', error)
          // Set to true anyway so user can proceed - basic face detection can work
          setFaceModelsLoaded(true)
          console.warn('⚠️ Continuing without full models - basic face detection will work')
        })
    }
  }, [currentStep, faceModelsLoaded])

  // Load saved application data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('brandApplication') || localStorage.getItem('companyApplication')
    if (savedData) {
      const parsed = JSON.parse(savedData)
      setApplicationData(prev => ({
        ...prev,
        ...parsed,
        accountType: localStorage.getItem('brandApplication') ? 'brand' : 'personal'
      }))
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Don't close if clicking inside the dropdown or search input
      if (showCountryDropdown && !target.closest('.country-dropdown')) {
        setShowCountryDropdown(false)
      }
      if (showPhoneCountryDropdown && !target.closest('.phone-country-dropdown')) {
        setShowPhoneCountryDropdown(false)
      }
      if (showCityDropdown && !target.closest('.city-dropdown')) {
        setShowCityDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCountryDropdown, showPhoneCountryDropdown, showCityDropdown])

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }



  // ...existing code...

  // Main render logic with conditional rendering
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{authLoading ? 'Loading...' : 'Redirecting to login...'}</p>
        </div>
      </div>
    )
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
  ]

  // Cities data organized by country
  const citiesByCountry: { [key: string]: string[] } = {
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
  }

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
  ]

  // Filter countries based on search
  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.includes(countrySearch)
  )

  // Filter cities based on selected country
  const filteredCities = selectedCountry ? 
    (citiesByCountry[selectedCountry] || []).filter(city => 
      city.toLowerCase().includes(citySearch.toLowerCase())
    ) : []

  // Handle country selection
  const handleCountrySelect = (country: any) => {
    setSelectedCountry(country.name)
    setApplicationData(prev => ({ ...prev, country: country.name }))
    setShowCountryDropdown(false)
    setCountrySearch('')
    setSelectedCity('')
    setApplicationData(prev => ({ ...prev, city: '' }))
  }

  // Handle city selection
  const handleCitySelect = (city: string) => {
    setSelectedCity(city)
    setApplicationData(prev => ({ ...prev, city }))
    setShowCityDropdown(false)
    setCitySearch('')
  }






  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setApplicationData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof ApplicationData['documents']) => {
    const file = e.target.files?.[0]
    if (file) {
      setApplicationData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [field]: file
        }
      }))
    }
  }

  const uploadDocumentFile = async (file: File | null | undefined, userId: string, fieldName: string): Promise<string | null> => {
    if (!file) return null;
    try {
      console.log(`📤 Starting upload for ${fieldName}:`, { fileName: file.name, fileSize: file.size })
      const result = await uploadFile(file, `applications/${userId}/${file.name}`)
      console.log(`✅ Upload completed for ${fieldName}:`, result)
      return (result as any).url || null
    } catch (error) {
      console.error(`❌ Upload failed for ${fieldName}:`, error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please login to submit application')
      return
    }

    setLoading(true)
    console.log('🚀 Starting application submission...')

    try {
      console.log('📋 Preparing application payload...')
      
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
              applicationData.accountType as 'personal_seller' | 'brand',
        status: 'pending' as const,
        businessName: applicationData.businessName,
        website: applicationData.website,
        description: applicationData.description,
        category: 'General',
        estimatedRevenue: 0,
        location: `${applicationData.city}, ${applicationData.country}`,
        documents: [], // KYC documents will be handled separately
        notes: []
      };

      console.log('📤 Submitting application to Firebase...')
      console.log('📄 Application payload:', applicationPayload)

      // Submit application to Firebase
      const applicationId = await submitApplication(applicationPayload);
      
      console.log('✅ Application submitted successfully with ID:', applicationId)
      
      // Now submit KYC data based on account type
      try {
        if (applicationData.accountType === 'personal') {
          // Artisan KYC
          const artisanKYCData = {
            fullName: applicationData.fullName,
            email: applicationData.email,
            phone: applicationData.phone,
            cnic: applicationData.kycCnic || '',
            cnicFrontFile: applicationData.kycCnicFront,
            cnicBackFile: applicationData.kycCnicBack,
            selfieFile: applicationData.kycSelfie,
            address: {
              street: applicationData.address,
              city: applicationData.city,
              province: applicationData.kycProvince || '',
              postalCode: applicationData.kycPostalCode || '',
              country: applicationData.country
            },
            productionAddress: applicationData.kycProductionAddress || '',
            productProofFiles: applicationData.kycProductProof || [],
            productDescription: applicationData.kycProductDescription || '',
            bankName: applicationData.kycBankName,
            bankAccountNumber: applicationData.kycBankAccountNumber,
            bankAccountTitle: applicationData.kycBankAccountTitle
          };
          
          const kycId = await createArtisanKYC(artisanKYCData, user.sub, user.email || '');
          
          // Link KYC to application
          const { doc, updateDoc } = await import('@/lib/firestore');
          const { db } = await import('@/lib/firebase');
          await updateDoc(doc(db, 'applications', applicationId), {
            kycId: kycId,
            kycStatus: 'pending',
            updatedAt: new Date()
          });
          
          toast.success('Application and KYC submitted successfully! Pending admin review.')
          router.push(`/seller-kyc/status?kycId=${kycId}&applicationId=${applicationId}`)
        } else {
          // Business KYC
          const businessKYCData = {
            fullName: applicationData.fullName,
            businessName: applicationData.businessName,
            email: applicationData.email,
            phone: applicationData.phone,
            businessRegistrationId: applicationData.kycBusinessRegistrationId,
            fbrNTN: applicationData.kycFbrNTN,
            businessLicenseFile: applicationData.kycBusinessLicense,
            taxCertificateFile: applicationData.kycTaxCertificate,
            cnic: applicationData.kycCnic || '',
            cnicFrontFile: applicationData.kycCnicFront,
            cnicBackFile: applicationData.kycCnicBack,
            address: {
              street: applicationData.address,
              city: applicationData.city,
              province: applicationData.kycProvince || '',
              postalCode: applicationData.kycPostalCode || '',
              country: applicationData.country
            },
            bankName: applicationData.kycBankName || '',
            bankAccountNumber: applicationData.kycBankAccountNumber || '',
            bankAccountTitle: applicationData.kycBankAccountTitle || '',
            iban: applicationData.kycIban
          };
          
          const kycId = await createBusinessKYC(businessKYCData, user.sub, user.email || '');
          
          // Link KYC to application
          const { doc, updateDoc } = await import('@/lib/firestore');
          const { db } = await import('@/lib/firebase');
          await updateDoc(doc(db, 'applications', applicationId), {
            kycId: kycId,
            kycStatus: 'pending',
            updatedAt: new Date()
          });
          
          toast.success('Application and KYC submitted successfully! Pending admin review.')
          router.push(`/seller-kyc/status?kycId=${kycId}&applicationId=${applicationId}`)
        }
      } catch (kycError: any) {
        console.error('KYC submission error:', kycError)
        // Application is still submitted, but KYC failed
        toast.error(`Application submitted but KYC failed: ${kycError.message}`)
        router.push(`/profile/${user.sub}?tab=application`)
      }
      
      // Clear saved data from localStorage
      localStorage.removeItem('brandApplication')
      localStorage.removeItem('companyApplication')
    } catch (error: any) {
      console.error('❌ Application submission error:', error)
      
      // More specific error messages
      if (error.message.includes('storage/unauthorized')) {
        toast.error('Upload failed: Unauthorized. Please check your permissions.')
      } else if (error.message.includes('storage/quota-exceeded')) {
        toast.error('Upload failed: Storage quota exceeded.')
      } else if (error.message.includes('storage/network-request-failed')) {
        toast.error('Upload failed: Network error. Please check your connection.')
      } else if (error.message.includes('permission-denied')) {
        toast.error('Permission denied. Please check your Firebase configuration.')
      } else {
        toast.error(`Failed to submit application: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Account Type', icon: User },
    { number: 2, title: 'Business Info', icon: Building2 },
    { number: 4, title: 'KYC Verification', icon: Shield },
    { number: 5, title: 'Review', icon: CheckCircle }
  ]

  // Camera functionality
  const startCamera = async (type: 'front' | 'back', documentType: 'id' | 'business' | 'address') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: type === 'front' ? 'user' : 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      setCameraStream(stream)
      setCameraType(type)
      setShowCamera(true)
      // Store document type for later use
      setApplicationData(prev => ({
        ...prev,
        currentDocumentType: documentType
      }))
    } catch (error) {
      toast.error('Camera access denied. Please allow camera access to continue.')
    }
  }

  // Start selfie camera with real-time face detection
  const startSelfieCamera = async () => {
    if (!applicationData.kycCnicFront) {
      toast.error('⚠️ Please upload CNIC Front first to verify face match')
      return
    }

    if (!faceModelsLoaded) {
      toast.warning('⚠️ Face verification models loading... Please wait')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user', // Front camera for selfie
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      setCameraStream(stream)
      setCameraType('selfie')
      setShowSelfieCamera(true)
      setFaceDetected(false)
      
      // Start simple face detection
      startSimpleFaceDetection(stream)
    } catch (error) {
      toast.error('Camera access denied. Please allow camera access for face verification.')
    }
  }

  // Simple face detection - no liveness steps
  const startSimpleFaceDetection = async (stream: MediaStream) => {
    const video = document.getElementById('selfie-camera-video') as HTMLVideoElement
    if (!video) {
      setTimeout(() => startSimpleFaceDetection(stream), 500)
      return
    }

    video.srcObject = stream
    await video.play()

    let lastWarningTime = 0

    const detectLoop = async () => {
      if (!showSelfieCamera || !stream.active || !video) return

      try {
        const { detectFaceInVideo } = await import('@/lib/faceVerificationService')
        const detection = await detectFaceInVideo(video)

        const isGoodFace = detection.faceDetected && detection.isFacingForward && detection.faceCount === 1
        setFaceDetected(isGoodFace)

        // Show warnings (throttled)
        const now = Date.now()
        if (now - lastWarningTime > 3000) {
          if (detection.faceCount === 0) {
            // No face - will show in UI
          } else if (detection.faceCount > 1) {
            toast.warning('⚠️ Multiple faces detected. Only one person should be in frame.', { duration: 2000 })
            lastWarningTime = now
          } else if (!detection.isFacingForward) {
            toast.warning('⚠️ Please look directly at the camera', { duration: 2000 })
            lastWarningTime = now
          }
        }

        // Continue detection loop
        if (showSelfieCamera && stream.active) {
          setTimeout(() => detectLoop(), 500)
        }
      } catch (error) {
        console.error('Face detection error:', error)
        setTimeout(() => {
          if (showSelfieCamera && stream.active) {
            detectLoop()
          }
        }, 1000)
      }
    }

    // Start detection loop after video loads
    video.addEventListener('loadedmetadata', () => {
      setTimeout(detectLoop, 500)
    }, { once: true })
    
    setTimeout(detectLoop, 1000)
  }

  const stopSelfieCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowSelfieCamera(false)
    setCameraType(null)
    setFaceDetected(false)
  }

  // Capture selfie from camera and verify face
  const captureAndVerifySelfie = async () => {
    const video = document.getElementById('selfie-camera-video') as HTMLVideoElement
    if (!video || !applicationData.kycCnicFront || !faceModelsLoaded) {
      toast.error('Camera not ready or CNIC missing')
      return
    }

    setSelfieVerificationInProgress(true)

    try {
      // Capture frame from video
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Canvas context not available')
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      // Convert to file
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Failed to capture image')
          setSelfieVerificationInProgress(false)
          return
        }

        const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' })

        // Immediately verify face match
        toast.info('🔄 Verifying face match with CNIC...')
        
        const faceVerification = await verifyFaceMatch(
          applicationData.kycCnicFront,
          file,
          80 // 80% similarity required
        )

        setFaceVerificationResult(faceVerification)

        if (!faceVerification.success) {
          toast.error(`❌ Face verification failed: ${faceVerification.errors.join(', ')}`)
          setSelfieVerificationInProgress(false)
          return
        }

        // Validate document quality
        const imageValidation = await validateDocumentImage(file, 'selfie')
        setDocumentValidations(prev => ({
          ...prev,
          selfie: imageValidation
        }))

        if (!imageValidation.isValid) {
          toast.error(`Document quality check failed: ${imageValidation.errors.join(', ')}`)
          setSelfieVerificationInProgress(false)
          return
        }

        // Success - save selfie
        setApplicationData(prev => ({ ...prev, kycSelfie: file }))
        stopSelfieCamera()
        toast.success(`✅ Face verified! Similarity: ${faceVerification.similarityScore.toFixed(1)}%`)
        setSelfieVerificationInProgress(false)
      }, 'image/jpeg', 0.92) // High quality
    } catch (error: any) {
      console.error('Capture error:', error)
      toast.error(`Failed to capture selfie: ${error.message}`)
      setSelfieVerificationInProgress(false)
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCamera(false)
    setCameraType(null)
  }

  const capturePhoto = () => {
    const video = document.getElementById('camera-video') as HTMLVideoElement
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (video && ctx) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `document_${cameraType}_${Date.now()}.jpg`, { type: 'image/jpeg' })
          
          setApplicationData(prev => {
            const newDocuments = { ...prev.documents }
            
            if (prev.currentDocumentType === 'id') {
              newDocuments[`idProof${cameraType === 'front' ? 'Front' : 'Back'}`] = file
            } else if (prev.currentDocumentType === 'business') {
              newDocuments.businessProof = file
            } else if (prev.currentDocumentType === 'address') {
              newDocuments.addressProof = file
            }
            
            return {
              ...prev,
              documents: newDocuments
            }
          })
          
          toast.success('Document captured successfully!')
          stopCamera()
        }
      }, 'image/jpeg', 0.8)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Choose your account type</h3>
            <div className="space-y-4">
              <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer transition-all duration-200">
                <input
                  type="radio"
                  name="accountType"
                  value="personal"
                  checked={applicationData.accountType === 'personal'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="font-medium text-gray-900 dark:text-white">Personal Seller</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">For individual sellers and creators</p>
                </div>
              </label>
              
              <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer transition-all duration-200">
                <input
                  type="radio"
                  name="accountType"
                  value="brand"
                  checked={applicationData.accountType === 'brand'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    <Store className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="font-medium text-gray-900 dark:text-white">Brand Account</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">For established brands and retailers</p>
                </div>
              </label>
              
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Business Information</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={applicationData.fullName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                  <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={applicationData.email}
                    onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="your-email@example.com"
                  />
                </div>

              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                  {applicationData.accountType === 'personal' ? 'Business Name' : 'Brand Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  value={applicationData.businessName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder={`Enter your ${applicationData.accountType === 'personal' ? 'business' : applicationData.accountType} name`}
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                  Website URL
                </label>
                <div className="mt-1 relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="website"
                    name="website"
                    type="url"
                    value={applicationData.website}
                    onChange={handleInputChange}
                    className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex space-x-1">
                  <div className="relative w-28">
                    <div 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 cursor-pointer flex items-center justify-between phone-country-dropdown"
                      onClick={() => setShowPhoneCountryDropdown(!showPhoneCountryDropdown)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{countries.find(c => c.code === applicationData.countryCode)?.flag}</span>
                        <span className="text-xs">{applicationData.countryCode}</span>
                      </div>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                    
                    {showPhoneCountryDropdown && (
                      <div className="phone-country-dropdown absolute z-50 w-80 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-1 border-b border-gray-200">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                              type="text"
                              placeholder="Search countries..."
                              value={phoneCountrySearch}
                              onChange={(e) => setPhoneCountrySearch(e.target.value)}
                              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {countries.filter(country => 
                            country.name.toLowerCase().includes(phoneCountrySearch.toLowerCase()) ||
                            country.code.includes(phoneCountrySearch)
                          ).map((country) => (
                            <div
                              key={country.code}
                              className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setApplicationData(prev => ({
                                  ...prev,
                                  countryCode: country.code,
                                  // Also update the main country field to match
                                  country: country.name,
                                  // Clear city when country changes
                                  city: ''
                                }))
                                // Also update the main country selection
                                setSelectedCountry(country.name)
                                // Clear city selection
                                setSelectedCity('')
                                setShowPhoneCountryDropdown(false)
                                setPhoneCountrySearch('')
                              }}
                            >
                              <span className="text-sm mr-2">{country.flag}</span>
                              <span className="text-xs font-medium mr-2">{country.code}</span>
                              <span className="text-xs text-gray-600 flex-1">{country.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-5 h-5" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={applicationData.phone}
                      onChange={handleInputChange}
                      className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg bg-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                  Business type <span className="text-red-500">*</span>
                </label>
                <select
                  id="businessType"
                  name="businessType"
                  value={applicationData.businessType}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-lg"
                >
                  <option value="">Select business type</option>
                  {businessTypes.map((type) => (
                    <option key={type} value={type.toLowerCase().replace(/\s+/g, '-')}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  required
                  value={applicationData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Tell us about your business..."
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    value={applicationData.address}
                    onChange={handleInputChange}
                    className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                    placeholder="Business address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-black focus:outline-none focus:ring-purple-500 focus:border-purple-500 cursor-pointer flex items-center justify-between country-dropdown"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    >
                      <span className="truncate text-black">
                        {selectedCountry || 'Select Country'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    {showCountryDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto country-dropdown">
                        <div className="p-1">
                          <input
                            type="text"
                            placeholder="Search countries..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredCountries.map((country) => (
                            <div
                              key={country.code}
                              className="px-2 py-1 text-sm text-black hover:bg-purple-50 cursor-pointer flex items-center space-x-2"
                              onClick={() => handleCountrySelect(country.name)}
                            >
                              <span>{country.flag}</span>
                              <span className="truncate text-black">{country.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-black focus:outline-none focus:ring-purple-500 focus:border-purple-500 cursor-pointer flex items-center justify-between city-dropdown"
                      onClick={() => selectedCountry && setShowCityDropdown(!showCityDropdown)}
                    >
                      <span className="truncate text-black">
                        {selectedCity || (selectedCountry ? 'Select City' : 'Select Country First')}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                    
                    {showCityDropdown && selectedCountry && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto city-dropdown">
                        <div className="p-1">
                          <input
                            type="text"
                            placeholder="Search cities..."
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredCities.map((city) => (
                            <div
                              key={city}
                              className="px-2 py-1 text-sm text-black hover:bg-purple-50 cursor-pointer"
                              onClick={() => handleCitySelect(city)}
                            >
                              {city}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 3:
        // Show Artisan KYC for Personal sellers
        if (applicationData.accountType === 'personal') {
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">KYC Verification (Artisan Seller)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Complete your verification to start selling. All fields are required.</p>
                <div className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-900 mb-2">🔒 Strict Anti-Fraud Verification</h4>
                      <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                        <li><strong>Face Match Required:</strong> Your selfie will be compared with CNIC photo using AI (80%+ similarity required)</li>
                        <li><strong>CNIC Validation:</strong> CNIC number is verified with checksum algorithm</li>
                        <li><strong>Duplicate Check:</strong> CNIC cannot be used on multiple accounts</li>
                        <li><strong>Document Quality:</strong> All images must meet quality standards (minimum 800x500px, clear visibility)</li>
                        <li><strong>Liveness Detection:</strong> Screenshots or printed photos will be rejected</li>
                      </ul>
                      <p className="text-xs text-red-700 mt-2 font-semibold">
                        ⚠️ Fraud attempts will result in permanent ban from the platform.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* CNIC Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CNIC Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicationData.kycCnic || ''}
                    onChange={async (e) => {
                      const value = e.target.value.replace(/[^0-9-]/g, '');
                      setApplicationData(prev => ({ ...prev, kycCnic: value }));
                      
                      // Real-time strict validation
                      if (value.length >= 13) {
                        const validation = await strictValidateCNIC(value);
                        setCnicValidation(validation);
                        
                        if (validation.isValid && user?.sub) {
                          // Check for duplication
                          const duplicateCheck = await strictCheckCNICDuplication(value, user.sub);
                          setCnicDuplicateCheck(duplicateCheck);
                          
                          if (duplicateCheck.isDuplicate) {
                            toast.error(`⚠️ CNIC already registered. Risk Score: ${duplicateCheck.riskScore}%`);
                          }
                        }
                      } else {
                        setCnicValidation(null);
                        setCnicDuplicateCheck(null);
                      }
                    }}
                    onBlur={async () => {
                      if (applicationData.kycCnic && applicationData.kycCnic.length >= 13 && user?.sub) {
                        const validation = strictValidateCNIC(applicationData.kycCnic);
                        setCnicValidation(validation);
                        if (validation.isValid) {
                          const duplicateCheck = await strictCheckCNICDuplication(applicationData.kycCnic, user.sub);
                          setCnicDuplicateCheck(duplicateCheck);
                        }
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      cnicValidation ? (cnicValidation.isValid ? 'border-green-500' : 'border-red-500') : 'border-gray-300'
                    }`}
                    placeholder="12345-1234567-1"
                    maxLength={15}
                  />
                  {cnicValidation && (
                    <div className={`mt-2 p-2 rounded-lg text-sm ${
                      cnicValidation.isValid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                      {cnicValidation.isValid ? (
                        <div className="flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          <span>Valid CNIC: {cnicValidation.formatted}</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center font-semibold mb-1">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            <span>Invalid CNIC</span>
                          </div>
                          <ul className="list-disc list-inside text-xs ml-6">
                            {cnicValidation.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {cnicDuplicateCheck && cnicDuplicateCheck.isDuplicate && (
                    <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded-lg">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
                        <div className="flex-1">
                          <p className="font-semibold text-red-900">CNIC Already Registered</p>
                          <p className="text-sm text-red-700 mt-1">
                            This CNIC is associated with another account. Risk Score: {cnicDuplicateCheck.riskScore}%
                          </p>
                          <p className="text-xs text-red-600 mt-2">
                            ⚠️ Multiple accounts with the same CNIC are not allowed for security reasons.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Format: XXXXX-XXXXXXX-X (Pakistan CNIC)</p>
                </div>

                {/* CNIC Front */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CNIC Front Image <span className="text-red-500">*</span>
                  </label>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-500 transition-colors">
                    <div className="space-y-1 text-center w-full">
                      {!applicationData.kycCnicFront ? (
                        <>
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                            <span>Upload CNIC Front</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setIsValidatingDocuments(true);
                                  try {
                                    const validation = await validateDocumentImage(file, 'cnicFront');
                                    setDocumentValidations(prev => ({
                                      ...prev,
                                      cnicFront: validation
                                    }));
                                    
                                    if (!validation.isValid) {
                                      toast.error(`CNIC Front: ${validation.errors.join(', ')}`);
                                      return;
                                    }
                                    
                                    if (validation.qualityScore < 70) {
                                      toast.warning(`CNIC Front quality: ${validation.qualityScore}% - Image may be rejected`);
                                    } else {
                                      toast.success(`CNIC Front uploaded - Quality: ${validation.qualityScore}%`);
                                    }
                                    
                                    setApplicationData(prev => ({ ...prev, kycCnicFront: file }));
                                  } catch (error) {
                                    toast.error('Failed to validate image');
                                  } finally {
                                    setIsValidatingDocuments(false);
                                  }
                                }
                              }}
                            />
                          </label>
                          <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                          {isValidatingDocuments && (
                            <div className="text-center py-2">
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                              <span className="ml-2 text-xs text-gray-600">Validating...</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-2">
                          <div className={`flex items-center justify-between p-3 rounded-lg border ${
                            documentValidations.cnicFront?.isValid ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center space-x-2 flex-1">
                              {documentValidations.cnicFront?.isValid ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <FileImage className="w-5 h-5 text-purple-600" />
                              )}
                              <div className="flex-1">
                                <span className="text-sm text-gray-700 block">{applicationData.kycCnicFront.name}</span>
                                {documentValidations.cnicFront && (
                                  <span className={`text-xs font-medium ${
                                    documentValidations.cnicFront.qualityScore >= 70 ? 'text-green-600' : 
                                    documentValidations.cnicFront.qualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    Quality: {documentValidations.cnicFront.qualityScore}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setApplicationData(prev => ({ ...prev, kycCnicFront: null }));
                                setDocumentValidations(prev => {
                                  const newValidations = { ...prev };
                                  delete newValidations.cnicFront;
                                  return newValidations;
                                });
                              }}
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {documentValidations.cnicFront?.warnings && documentValidations.cnicFront.warnings.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                              {documentValidations.cnicFront.warnings.map((w, i) => (
                                <p key={i}>⚠️ {w}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CNIC Back */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CNIC Back Image <span className="text-red-500">*</span>
                  </label>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-500 transition-colors">
                    <div className="space-y-1 text-center w-full">
                      {!applicationData.kycCnicBack ? (
                        <>
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                            <span>Upload CNIC Back</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setIsValidatingDocuments(true);
                                  try {
                                    const validation = await validateDocumentImage(file, 'cnicBack');
                                    setDocumentValidations(prev => ({
                                      ...prev,
                                      cnicBack: validation
                                    }));
                                    
                                    if (!validation.isValid) {
                                      toast.error(`CNIC Back: ${validation.errors.join(', ')}`);
                                      return;
                                    }
                                    
                                    if (validation.qualityScore < 70) {
                                      toast.warning(`CNIC Back quality: ${validation.qualityScore}% - Image may be rejected`);
                                    } else {
                                      toast.success(`CNIC Back uploaded - Quality: ${validation.qualityScore}%`);
                                    }
                                    
                                    setApplicationData(prev => ({ ...prev, kycCnicBack: file }));
                                  } catch (error) {
                                    toast.error('Failed to validate image');
                                  } finally {
                                    setIsValidatingDocuments(false);
                                  }
                                }
                              }}
                            />
                          </label>
                          <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <div className={`flex items-center justify-between p-3 rounded-lg border ${
                            documentValidations.cnicBack?.isValid ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center space-x-2 flex-1">
                              {documentValidations.cnicBack?.isValid ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <FileImage className="w-5 h-5 text-purple-600" />
                              )}
                              <div className="flex-1">
                                <span className="text-sm text-gray-700 block">{applicationData.kycCnicBack.name}</span>
                                {documentValidations.cnicBack && (
                                  <span className={`text-xs font-medium ${
                                    documentValidations.cnicBack.qualityScore >= 70 ? 'text-green-600' : 
                                    documentValidations.cnicBack.qualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    Quality: {documentValidations.cnicBack.qualityScore}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setApplicationData(prev => ({ ...prev, kycCnicBack: null }));
                                setDocumentValidations(prev => {
                                  const newValidations = { ...prev };
                                  delete newValidations.cnicBack;
                                  return newValidations;
                                });
                              }}
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          {documentValidations.cnicBack?.warnings && documentValidations.cnicBack.warnings.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                              {documentValidations.cnicBack.warnings.map((w, i) => (
                                <p key={i}>⚠️ {w}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selfie with CNIC */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Selfie with CNIC <span className="text-red-500">*</span>
                    <span className="ml-2 text-xs font-normal text-red-600">(Face Verification Required)</span>
                  </label>
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-3">
                    <div className="flex items-start">
                      <Shield className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-sm text-red-900">
                        <p className="font-bold mb-2">🔒 STRICT FACE VERIFICATION INSTRUCTIONS:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li><strong>Hold your CNIC next to your face</strong> - Both must be clearly visible in same photo</li>
                          <li><strong>Look directly at camera</strong> - Face must be facing forward (no side angles)</li>
                          <li><strong>Use good lighting</strong> - Avoid shadows on your face or CNIC</li>
                          <li><strong>Take a LIVE photo</strong> - Screenshots, printed photos, or photos of photos will be REJECTED</li>
                          <li><strong>Remove mask/glasses</strong> - Face must be fully visible (medical exceptions noted)</li>
                          <li><strong>Face must match CNIC photo</strong> - AI will verify 80%+ similarity (VERY STRICT)</li>
                          <li><strong>CNIC photo on CNIC must be readable</strong> - Photo on ID card should be clear</li>
                        </ul>
                        <div className="mt-3 p-2 bg-red-100 rounded border border-red-300">
                          <p className="text-xs font-bold text-red-900">
                            ⚠️ FRAUD DETECTION: Face mismatch, fake photos, or fraud attempts will result in:
                          </p>
                          <ul className="text-xs text-red-800 mt-1 list-disc list-inside">
                            <li>Immediate application rejection</li>
                            <li>Permanent ban from the platform</li>
                            <li>Legal action if fraudulent documents detected</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* REAL-TIME CAMERA CAPTURE - NO FILE UPLOAD ALLOWED */}
                  {!showSelfieCamera ? (
                    <div className="space-y-4">
                      {!applicationData.kycSelfie ? (
                        <div className="border-2 border-red-400 border-dashed rounded-lg p-8 text-center bg-red-50">
                          <div className="space-y-4">
                            <div className="flex flex-col items-center">
                              <Camera className="w-16 h-16 text-red-600 mb-4" />
                              <h4 className="text-lg font-bold text-red-900 mb-2">🔒 Live Face Verification Required</h4>
                              <p className="text-sm text-red-800 mb-4 max-w-md mx-auto">
                                <strong>File upload is disabled for security.</strong> You must use your camera for real-time face verification to prevent fraud.
                              </p>
                              <button
                                type="button"
                                onClick={startSelfieCamera}
                                disabled={!applicationData.kycCnicFront || !faceModelsLoaded}
                                className={`px-8 py-4 rounded-lg font-bold text-white text-lg transition-all shadow-lg ${
                                  !applicationData.kycCnicFront || !faceModelsLoaded
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-purple-600 hover:bg-purple-700 hover:shadow-xl transform hover:scale-105'
                                }`}
                              >
                                {!applicationData.kycCnicFront ? (
                                  '⚠️ Upload CNIC Front First'
                                ) : !faceModelsLoaded ? (
                                  '⏳ Loading Face Models...'
                                ) : (
                                  '📷 Start Live Camera Verification'
                                )}
                              </button>
                              {!applicationData.kycCnicFront && (
                                <p className="text-xs text-red-700 mt-2">
                                  Please upload CNIC Front image first before capturing selfie
                                </p>
                              )}
                              {!faceModelsLoaded && (
                                <p className="text-xs text-red-700 mt-2">
                                  Face verification models are loading. Please wait...
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className={`flex items-center justify-between p-3 rounded-lg border ${
                            faceVerificationResult?.success ? 'bg-green-50 border-green-300' : 
                            faceVerificationResult && !faceVerificationResult.success ? 'bg-red-50 border-red-300' :
                            'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center space-x-2 flex-1">
                              {faceVerificationResult?.success ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : faceVerificationResult && !faceVerificationResult.success ? (
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                              ) : (
                                <FileImage className="w-5 h-5 text-purple-600" />
                              )}
                              <div className="flex-1">
                                <span className="text-sm text-gray-700 block">{applicationData.kycSelfie.name}</span>
                                {faceVerificationResult && (
                                  <div className="mt-1">
                                    <span className={`text-xs font-bold ${
                                      faceVerificationResult.success ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                      Face Match: {faceVerificationResult.similarityScore.toFixed(1)}% 
                                      {faceVerificationResult.success ? ' ✅ Verified' : ' ❌ Failed'}
                                    </span>
                                  </div>
                                )}
                                {documentValidations.selfie && (
                                  <span className={`text-xs font-medium ml-2 ${
                                    documentValidations.selfie.qualityScore >= 70 ? 'text-green-600' : 
                                    documentValidations.selfie.qualityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    Quality: {documentValidations.selfie.qualityScore}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setApplicationData(prev => ({ ...prev, kycSelfie: null }));
                                setFaceVerificationResult(null);
                                setDocumentValidations(prev => {
                                  const newValidations = { ...prev };
                                  delete newValidations.selfie;
                                  return newValidations;
                                });
                              }}
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Face Verification Result */}
                          {faceVerificationResult && (
                            <div className={`p-3 rounded-lg ${
                              faceVerificationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                            }`}>
                              {faceVerificationResult.success ? (
                                <div className="text-sm text-green-800">
                                  <div className="flex items-center font-semibold mb-1">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Face Match Verified
                                  </div>
                                  <p className="text-xs">Your face matches the CNIC photo. Similarity: {faceVerificationResult.similarityScore.toFixed(1)}%</p>
                                </div>
                              ) : (
                                <div className="text-sm text-red-800">
                                  <div className="flex items-center font-semibold mb-1">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Face Match Failed
                                  </div>
                                  <ul className="list-disc list-inside text-xs mt-1">
                                    {faceVerificationResult.errors.map((err, i) => (
                                      <li key={i}>{err}</li>
                                    ))}
                                  </ul>
                                  {faceVerificationResult.warnings.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs font-semibold">Warnings:</p>
                                      <ul className="list-disc list-inside text-xs">
                                        {faceVerificationResult.warnings.map((w, i) => (
                                          <li key={i}>{w}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {isVerifyingFace && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800 flex items-center">
                              <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent mr-2"></div>
                              Verifying face match with CNIC...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // CAMERA VIEW - Real-time face verification
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        id="selfie-camera-video"
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-auto max-h-[500px] object-cover"
                      />
                      
                      {/* Liveness Detection Overlay - Step by Step */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        {faceDetected ? (
                          <div className="bg-green-500/20 border-4 border-green-500 rounded-full p-8 mb-4">
                            <CheckCircle2 className="w-16 h-16 text-green-500" />
                            <p className="text-green-500 font-bold text-lg mt-2">Face Detected ✓</p>
                            <p className="text-white text-sm mt-1">Ready to capture & verify</p>
                          </div>
                        ) : (
                          <div className="bg-yellow-500/20 border-4 border-yellow-500 rounded-full p-8 mb-4">
                            <AlertCircle className="w-16 h-16 text-yellow-500" />
                            <p className="text-yellow-500 font-bold text-lg mt-2">Initializing...</p>
                            <p className="text-white text-sm mt-1">Position your face in the center</p>
                          </div>
                        )}
                      </div>

                      {/* Instructions Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <div className="text-white text-center">
                          <p className="text-sm font-semibold mb-2">
                            {faceDetected ? '✅ Face detected - Ready to capture!' : '⏳ Position your face in front of camera...'}
                          </p>
                          <p className="text-xs opacity-90">
                            Hold your CNIC next to your face
                          </p>
                        </div>
                      </div>

                      {/* Camera Controls */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4 z-10">
                        <button
                          type="button"
                          onClick={stopSelfieCamera}
                          className="px-6 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 shadow-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={captureAndVerifySelfie}
                          disabled={!faceDetected || selfieVerificationInProgress}
                          className={`px-8 py-3 rounded-full font-bold text-white shadow-lg transition-all ${
                            faceDetected && !selfieVerificationInProgress
                              ? 'bg-green-600 hover:bg-green-700 transform hover:scale-105'
                              : 'bg-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {selfieVerificationInProgress ? (
                            <span className="flex items-center">
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              Verifying...
                            </span>
                          ) : (
                            '📸 Capture & Verify'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Province */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={applicationData.kycProvince || ''}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, kycProvince: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Province</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                    <option value="Azad Kashmir">Azad Kashmir</option>
                  </select>
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={applicationData.kycPostalCode || ''}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, kycPostalCode: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Production Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Production Address (Where you make products) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={applicationData.kycProductionAddress || ''}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, kycProductionAddress: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Home studio, shop address, workshop location, etc."
                    required
                  />
                </div>

                {/* Product Proof */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Proof (Videos or Photos) <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-blue-800">Upload at least 1 video or 2-3 photos showing your handmade products</p>
                  </div>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-500 transition-colors">
                    <div className="space-y-1 text-center w-full">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                        <span>Upload {applicationData.kycProductProof && applicationData.kycProductProof.length > 0 ? 'More' : 'Files'}</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          multiple
                          className="sr-only"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setApplicationData(prev => ({
                              ...prev,
                              kycProductProof: [...(prev.kycProductProof || []), ...files]
                            }));
                          }}
                        />
                      </label>
                      <p className="text-xs text-gray-500">PNG, JPG, MP4 up to 10MB each</p>
                    </div>
                  </div>
                  {applicationData.kycProductProof && applicationData.kycProductProof.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {applicationData.kycProductProof.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2">
                            {file.type.startsWith('video/') ? (
                              <FileVideo className="w-5 h-5 text-purple-600" />
                            ) : (
                              <FileImage className="w-5 h-5 text-purple-600" />
                            )}
                            <span className="text-sm text-gray-700">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setApplicationData(prev => ({
                                ...prev,
                                kycProductProof: prev.kycProductProof?.filter((_, i) => i !== index) || []
                              }));
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={applicationData.kycProductDescription || ''}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, kycProductDescription: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Describe what you create, your process, materials used, etc."
                    required
                  />
                </div>


                {/* Bank Details (Optional for Tier 2) */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Bank Details (Optional - for Tier 2 upgrade)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bank Name</label>
                      <input
                        type="text"
                        value={applicationData.kycBankName || ''}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, kycBankName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Number</label>
                      <input
                        type="text"
                        value={applicationData.kycBankAccountNumber || ''}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, kycBankAccountNumber: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Title</label>
                      <input
                        type="text"
                        value={applicationData.kycBankAccountTitle || ''}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, kycBankAccountTitle: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        } else {
          // Business KYC for Brand/Company
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">KYC Verification (Business Seller)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Complete your business verification. All fields are required.</p>
              </div>
              
              <div className="space-y-4">
                {/* Business Registration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business Registration ID
                  </label>
                  <input
                    type="text"
                    value={applicationData.kycBusinessRegistrationId || ''}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, kycBusinessRegistrationId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Registration number from SECP/Registrar"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    FBR NTN (Pakistan) *
                  </label>
                  <input
                    type="text"
                    value={applicationData.kycFbrNTN || ''}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, kycFbrNTN: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="1234567-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Federal Board of Revenue National Tax Number</p>
                </div>

                {/* CNIC */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Owner CNIC Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicationData.kycCnic || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9-]/g, '');
                      setApplicationData(prev => ({ ...prev, kycCnic: value }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="12345-1234567-1"
                    maxLength={15}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CNIC Front */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CNIC Front <span className="text-red-500">*</span>
                    </label>
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-500 transition-colors">
                      <div className="space-y-1 text-center w-full">
                        {!applicationData.kycCnicFront ? (
                          <>
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setApplicationData(prev => ({ ...prev, kycCnicFront: file }));
                                }}
                              />
                            </label>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <FileImage className="w-5 h-5 text-purple-600" />
                                <span className="text-sm text-gray-700">{applicationData.kycCnicFront.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setApplicationData(prev => ({ ...prev, kycCnicFront: null }))}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setApplicationData(prev => ({ ...prev, kycCnicFront: null }))}
                              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                              Change
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CNIC Back */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      CNIC Back <span className="text-red-500">*</span>
                    </label>
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-500 transition-colors">
                      <div className="space-y-1 text-center w-full">
                        {!applicationData.kycCnicBack ? (
                          <>
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                              <span>Upload</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) setApplicationData(prev => ({ ...prev, kycCnicBack: file }));
                                }}
                              />
                            </label>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <FileImage className="w-5 h-5 text-purple-600" />
                                <span className="text-sm text-gray-700">{applicationData.kycCnicBack.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setApplicationData(prev => ({ ...prev, kycCnicBack: null }))}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setApplicationData(prev => ({ ...prev, kycCnicBack: null }))}
                              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                              Change
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business License */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Business License
                  </label>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-500 transition-colors">
                    <div className="space-y-1 text-center w-full">
                      {!applicationData.kycBusinessLicense ? (
                        <>
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                            <span>Upload Business License</span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setApplicationData(prev => ({ ...prev, kycBusinessLicense: file }));
                              }}
                            />
                          </label>
                          <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileImage className="w-5 h-5 text-purple-600" />
                              <span className="text-sm text-gray-700">{applicationData.kycBusinessLicense.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setApplicationData(prev => ({ ...prev, kycBusinessLicense: null }))}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setApplicationData(prev => ({ ...prev, kycBusinessLicense: null }))}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                          >
                            Change File
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tax Certificate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tax Certificate
                  </label>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-500 transition-colors">
                    <div className="space-y-1 text-center w-full">
                      {!applicationData.kycTaxCertificate ? (
                        <>
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                            <span>Upload Tax Certificate</span>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setApplicationData(prev => ({ ...prev, kycTaxCertificate: file }));
                              }}
                            />
                          </label>
                          <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FileImage className="w-5 h-5 text-purple-600" />
                              <span className="text-sm text-gray-700">{applicationData.kycTaxCertificate.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setApplicationData(prev => ({ ...prev, kycTaxCertificate: null }))}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setApplicationData(prev => ({ ...prev, kycTaxCertificate: null }))}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                          >
                            Change File
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Province */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Province <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={applicationData.kycProvince || ''}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, kycProvince: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select Province</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                    <option value="Azad Kashmir">Azad Kashmir</option>
                  </select>
                </div>

                {/* Bank Details */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Bank Details <span className="text-red-500">*</span></h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bank Name</label>
                      <input
                        type="text"
                        value={applicationData.kycBankName || ''}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, kycBankName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Number</label>
                        <input
                          type="text"
                          value={applicationData.kycBankAccountNumber || ''}
                          onChange={(e) => setApplicationData(prev => ({ ...prev, kycBankAccountNumber: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Title</label>
                        <input
                          type="text"
                          value={applicationData.kycBankAccountTitle || ''}
                          onChange={(e) => setApplicationData(prev => ({ ...prev, kycBankAccountTitle: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">IBAN (Optional)</label>
                      <input
                        type="text"
                        value={applicationData.kycIban || ''}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, kycIban: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="PK36 SCBL 0000 0011 2345 6702"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Review Your Application</h3>
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
                <h4 className="font-medium text-gray-900 dark:text-white">KYC Verification</h4>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  {applicationData.accountType === 'personal' ? (
                    <>
                      <p>✓ CNIC: {applicationData.kycCnic || 'Not provided'}</p>
                      <p>✓ CNIC Front: {applicationData.kycCnicFront?.name || 'Not uploaded'}</p>
                      <p>✓ CNIC Back: {applicationData.kycCnicBack?.name || 'Not uploaded'}</p>
                      <p>✓ Selfie with CNIC: {applicationData.kycSelfie?.name || 'Not uploaded'}</p>
                      {faceVerificationResult && (
                        <p className={faceVerificationResult.success ? 'text-green-700' : 'text-red-700'}>
                          {faceVerificationResult.success ? '✅' : '❌'} Face Verification: {faceVerificationResult.similarityScore.toFixed(1)}% 
                          {faceVerificationResult.success ? ' (Verified)' : ' (Failed - Required: 80%+)'}
                        </p>
                      )}
                      {applicationData.kycSelfie && !faceVerificationResult && (
                        <p className="text-yellow-700">⚠️ Face verification pending - Please wait for verification to complete</p>
                      )}
                      <p>✓ Province: {applicationData.kycProvince || 'Not provided'}</p>
                      <p>✓ Production Address: {applicationData.kycProductionAddress ? 'Provided' : 'Not provided'}</p>
                      <p>✓ Product Proof: {applicationData.kycProductProof?.length || 0} file(s) uploaded</p>
                      <p>✓ Product Description: {applicationData.kycProductDescription ? 'Provided' : 'Not provided'}</p>
                    </>
                  ) : (
                    <>
                      <p>✓ CNIC: {applicationData.kycCnic || 'Not provided'}</p>
                      <p>✓ CNIC Front: {applicationData.kycCnicFront?.name || 'Not uploaded'}</p>
                      <p>✓ CNIC Back: {applicationData.kycCnicBack?.name || 'Not uploaded'}</p>
                      <p>✓ Business Registration ID: {applicationData.kycBusinessRegistrationId || 'Not provided'}</p>
                      <p>✓ FBR NTN: {applicationData.kycFbrNTN || 'Not provided'}</p>
                      <p>✓ Business License: {applicationData.kycBusinessLicense?.name || 'Not uploaded'}</p>
                      <p>✓ Tax Certificate: {applicationData.kycTaxCertificate?.name || 'Not uploaded'}</p>
                      <p>✓ Province: {applicationData.kycProvince || 'Not provided'}</p>
                      <p>✓ Bank Name: {applicationData.kycBankName || 'Not provided'}</p>
                      <p>✓ Account Number: {applicationData.kycBankAccountNumber || 'Not provided'}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return applicationData.accountType
      case 2:
        return applicationData.fullName && applicationData.email && applicationData.businessName && applicationData.phone && applicationData.businessType && applicationData.description && applicationData.address && applicationData.city && applicationData.country
      case 3:
        return true // Payment setup step removed
      case 4:
        // STRICT KYC validation with face verification
        if (applicationData.accountType === 'personal') {
          // Artisan KYC validation - must pass ALL strict checks
          const hasRequiredFields = applicationData.kycCnic && 
                 applicationData.kycCnicFront && 
                 applicationData.kycCnicBack && 
                 applicationData.kycSelfie && 
                 applicationData.kycProvince && 
                 applicationData.kycProductionAddress && 
                 applicationData.kycProductProof && 
                 applicationData.kycProductProof.length > 0 &&
                 applicationData.kycProductDescription &&
                 true; // Removed Payoneer requirement
          
          // Strict CNIC validation
          const cnicValid = cnicValidation?.isValid === true && !cnicDuplicateCheck?.isDuplicate;
          
          // Document quality validation
          const documentsValid = 
            documentValidations.cnicFront?.isValid === true &&
            documentValidations.cnicBack?.isValid === true &&
            documentValidations.selfie?.isValid === true &&
            (documentValidations.cnicFront?.qualityScore || 0) >= 60 &&
            (documentValidations.cnicBack?.qualityScore || 0) >= 60 &&
            (documentValidations.selfie?.qualityScore || 0) >= 60;
          
          // STRICT FACE VERIFICATION - Face must match CNIC (80%+ similarity required)
          const faceVerified = faceVerificationResult?.success === true;
          
          if (!hasRequiredFields) return false;
          if (!cnicValid) {
            toast.error('CNIC validation failed or duplicate detected');
            return false;
          }
          if (!documentsValid) {
            toast.error('Document quality checks failed. Please upload clear images.');
            return false;
          }
          if (!faceVerified) {
            toast.error('Face verification failed. Selfie must match CNIC photo (80%+ similarity required).');
            return false;
          }
          
          return true;
        } else {
          // Business KYC validation
          const hasRequiredFields = applicationData.kycCnic && 
                 applicationData.kycCnicFront && 
                 applicationData.kycCnicBack && 
                 applicationData.kycProvince && 
                 (applicationData.kycBusinessRegistrationId || applicationData.kycFbrNTN) &&
                 applicationData.kycBankName &&
                 applicationData.kycBankAccountNumber &&
                 applicationData.kycBankAccountTitle;
          
          // Strict CNIC validation
          const cnicValid = cnicValidation?.isValid === true && !cnicDuplicateCheck?.isDuplicate;
          
          // Document quality validation
          const documentsValid = 
            documentValidations.cnicFront?.isValid === true &&
            documentValidations.cnicBack?.isValid === true &&
            (documentValidations.cnicFront?.qualityScore || 0) >= 60 &&
            (documentValidations.cnicBack?.qualityScore || 0) >= 60;
          
          // Business sellers also need face verification (for security)
          const faceVerified = faceVerificationResult?.success === true || !applicationData.kycSelfie; // Optional for business but recommended
          
          if (!hasRequiredFields) return false;
          if (!cnicValid) {
            toast.error('CNIC validation failed or duplicate detected');
            return false;
          }
          if (!documentsValid) {
            toast.error('Document quality checks failed. Please upload clear images.');
            return false;
          }
          
          return true;
        }
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
            <span className="text-white font-bold text-xl sm:text-2xl">Z</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
            Start Selling
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Complete your seller application
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white shadow-xl border border-gray-200 rounded-3xl p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex items-center justify-between overflow-x-auto">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.number
            const isCompleted = currentStep > step.number
            
            return (
              <div key={step.number} className="flex items-center min-w-0">
                  <div className={`flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full transition-all duration-300 ${
                    isCompleted ? 'bg-green-500 shadow-lg' : isActive ? 'bg-purple-600 shadow-lg' : 'bg-purple-100 border-2 border-purple-300'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  ) : (
                      <Icon className={`w-4 h-4 sm:w-6 sm:h-6 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                  )}
                </div>
                {index < steps.length - 1 && (
                    <div className={`w-8 sm:w-16 h-1 mx-2 sm:mx-4 transition-all duration-300 ${
                      isCompleted ? 'bg-green-500' : 'bg-purple-200'
                  }`} />
                )}
              </div>
            )
          })}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow-xl border border-gray-200 rounded-3xl p-4 sm:p-6 lg:p-8">
          <form onSubmit={handleSubmit}>
            {renderStepContent()}
            
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                className="inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </button>
              
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceed()}
                  className="inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !canProceed()}
                  className="inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors duration-300">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to home
          </Link>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Scan Document - {cameraType === 'front' ? 'Front' : 'Back'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Position your document clearly in the camera view</p>
            </div>
            
            <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4">
              <video
                id="camera-video"
                autoPlay
                playsInline
                className="w-full h-48 sm:h-64 object-cover"
                ref={(video) => {
                  if (video && cameraStream) {
                    video.srcObject = cameraStream
                  }
                }}
              />
              <div className="absolute inset-0 border-2 border-dashed border-purple-400 rounded-lg pointer-events-none">
                <div className="absolute top-2 left-2 right-2 bottom-2 border border-purple-300 rounded"></div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={stopCamera}
                className="flex-1 px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="flex-1 px-4 py-3 bg-purple-600 text-sm font-medium rounded-lg text-white hover:bg-purple-700 transition-all duration-300"
              >
                📷 Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



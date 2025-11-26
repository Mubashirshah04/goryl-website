'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Users, MapPin, Clock, DollarSign, ArrowRight, Heart, Zap, Globe, Award } from 'lucide-react';
import { toast } from 'sonner';
export default function Careers() {
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const departments = [
        { id: 'all', name: 'All Departments' },
        { id: 'engineering', name: 'Engineering' },
        { id: 'design', name: 'Design' },
        { id: 'marketing', name: 'Marketing' },
        { id: 'sales', name: 'Sales' },
        { id: 'operations', name: 'Operations' },
        { id: 'finance', name: 'Finance' },
        { id: 'hr', name: 'Human Resources' }
    ];
    const jobs = [
        {
            id: 1,
            title: 'Senior Frontend Developer',
            department: 'engineering',
            location: 'Remote / New York',
            type: 'Full-time',
            salary: '$120k - $150k',
            description: 'Join our engineering team to build the next generation of e-commerce experiences.',
            requirements: ['React/Next.js', 'TypeScript', '5+ years experience', 'Team leadership']
        },
        {
            id: 2,
            title: 'Product Designer',
            department: 'design',
            location: 'San Francisco',
            type: 'Full-time',
            salary: '$100k - $130k',
            description: 'Create beautiful and intuitive user experiences for millions of users.',
            requirements: ['Figma', 'User research', '3+ years experience', 'Portfolio required']
        },
        {
            id: 3,
            title: 'Growth Marketing Manager',
            department: 'marketing',
            location: 'Remote',
            type: 'Full-time',
            salary: '$90k - $120k',
            description: 'Drive user acquisition and retention through innovative marketing strategies.',
            requirements: ['Digital marketing', 'Analytics', '4+ years experience', 'Performance marketing']
        },
        {
            id: 4,
            title: 'Sales Development Representative',
            department: 'sales',
            location: 'Austin',
            type: 'Full-time',
            salary: '$60k - $80k',
            description: 'Generate new business opportunities and build relationships with potential clients.',
            requirements: ['Sales experience', 'CRM tools', '1+ years experience', 'Strong communication']
        },
        {
            id: 5,
            title: 'Operations Analyst',
            department: 'operations',
            location: 'Chicago',
            type: 'Full-time',
            salary: '$70k - $90k',
            description: 'Optimize business processes and improve operational efficiency.',
            requirements: ['Data analysis', 'Process improvement', '2+ years experience', 'SQL/Excel']
        },
        {
            id: 6,
            title: 'Financial Analyst',
            department: 'finance',
            location: 'Remote',
            type: 'Full-time',
            salary: '$80k - $100k',
            description: 'Provide financial insights and support strategic decision-making.',
            requirements: ['Financial modeling', 'Excel', '3+ years experience', 'CPA preferred']
        }
    ];
    const filteredJobs = jobs.filter(job => (selectedDepartment === 'all' || job.department === selectedDepartment) &&
        (searchQuery === '' || job.title.toLowerCase().includes(searchQuery.toLowerCase())));
    const handleApply = (jobTitle) => {
        toast.success(`Application submitted for ${jobTitle}! We'll be in touch soon.`);
    };
    const values = [
        { icon: <Heart className="w-8 h-8"/>, title: 'Customer First', description: 'Everything we do is centered around our customers' },
        { icon: <Zap className="w-8 h-8"/>, title: 'Innovation', description: 'We constantly push boundaries and embrace new ideas' },
        { icon: <Users className="w-8 h-8"/>, title: 'Collaboration', description: 'Great things happen when we work together' },
        { icon: <Globe className="w-8 h-8"/>, title: 'Global Impact', description: 'We serve customers worldwide with diverse perspectives' },
        { icon: <Award className="w-8 h-8"/>, title: 'Excellence', description: 'We strive for excellence in everything we do' }
    ];
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-5xl font-bold mb-6">Join Our Team</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Build the future of e-commerce with a team that values innovation, collaboration, and making a global impact.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <Users className="w-4 h-4"/>
                <span>200+ Team Members</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <Globe className="w-4 h-4"/>
                <span>50+ Countries</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <Award className="w-4 h-4"/>
                <span>Best Workplace 2024</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-gray-600 dark:text-gray-300">The principles that guide everything we do</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {values.map((value, index) => (<motion.div key={value.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }} className="text-center p-6 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="text-purple-600 mb-4 flex justify-center">{value.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </motion.div>))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Work With Us</h2>
            <p className="text-gray-600 dark:text-gray-300">We offer competitive benefits and a great work environment</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
            { title: 'Health & Wellness', items: ['Comprehensive health insurance', 'Mental health support', 'Gym membership', 'Wellness programs'] },
            { title: 'Work-Life Balance', items: ['Flexible work hours', 'Unlimited PTO', 'Remote work options', 'Parental leave'] },
            { title: 'Growth & Development', items: ['Learning budget', 'Conference attendance', 'Mentorship programs', 'Career advancement'] },
            { title: 'Team & Culture', items: ['Regular team events', 'Diversity initiatives', 'Employee resource groups', 'Recognition programs'] },
            { title: 'Financial Benefits', items: ['Competitive salary', 'Equity options', '401(k) matching', 'Performance bonuses'] },
            { title: 'Office Perks', items: ['Modern office spaces', 'Free meals', 'Game rooms', 'Pet-friendly environment'] }
        ].map((benefit, index) => (<motion.div key={benefit.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{benefit.title}</h3>
                <ul className="space-y-2">
                  {benefit.items.map((item) => (<li key={item} className="flex items-center gap-2 text-gray-600">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      {item}
                    </li>))}
                </ul>
              </motion.div>))}
          </div>
        </div>
      </div>

      {/* Job Listings Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Open Positions</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Find your perfect role and join our growing team</p>

            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1">
                <input type="text" placeholder="Search jobs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {departments.map((dept) => (<button key={dept.id} onClick={() => setSelectedDepartment(dept.id)} className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${selectedDepartment === dept.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {dept.name}
                  </button>))}
              </div>
            </div>
          </motion.div>

          {/* Job Cards */}
          <div className="space-y-6">
            {filteredJobs.map((job, index) => (<motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{job.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4"/>
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4"/>
                        {job.type}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4"/>
                        {job.salary}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {job.requirements.map((req) => (<span key={req} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {req}
                        </span>))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleApply(job.title)} className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                      Apply Now
                      <ArrowRight className="w-4 h-4"/>
                    </button>
                    <button className="text-purple-600 hover:text-purple-700 transition-colors text-sm">
                      Save Job
                    </button>
                  </div>
                </div>
              </motion.div>))}
          </div>

          {filteredJobs.length === 0 && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }} className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No jobs found</h3>
              <p className="text-gray-600 dark:text-gray-300">Try adjusting your search criteria or check back later for new openings.</p>
            </motion.div>)}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}>
            <h2 className="text-3xl font-bold mb-4">Don't See the Right Role?</h2>
            <p className="text-gray-300 mb-8">We're always looking for talented individuals. Send us your resume and we'll keep you in mind for future opportunities.</p>
            <button className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors">
              Submit General Application
            </button>
          </motion.div>
        </div>
      </div>
    </div>);
}

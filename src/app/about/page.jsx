'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Target, Award, Globe, Heart, Shield, TrendingUp } from 'lucide-react';
const teamMembers = [
    {
        name: 'Axha Bhai',
        role: 'CEO & Founder',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
        bio: 'Former tech executive with 15+ years in e-commerce'
    },
    {
        name: 'Axha bhai Bs thoda ghussay wala',
        role: 'CTO',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
        bio: 'Expert in scalable platforms and AI-driven solutions'
    },
    {
        name: 'pata nhi',
        role: 'Head of Operations',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face',
        bio: 'Supply chain specialist with global logistics experience'
    },
    {
        name: 'wow',
        role: 'Head of Marketing',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
        bio: 'Digital marketing expert with focus on growth strategies'
    }
];
const values = [
    {
        icon: <Heart className="w-8 h-8 text-purple-600"/>,
        title: 'Customer First',
        description: 'Every decision we make is centered around our customers\' needs and satisfaction.'
    },
    {
        icon: <Shield className="w-8 h-8 text-purple-600"/>,
        title: 'Trust & Security',
        description: 'We prioritize the security and privacy of our customers and sellers.'
    },
    {
        icon: <Globe className="w-8 h-8 text-purple-600"/>,
        title: 'Global Reach',
        description: 'Connecting buyers and sellers from around the world seamlessly.'
    },
    {
        icon: <TrendingUp className="w-8 h-8 text-purple-600"/>,
        title: 'Innovation',
        description: 'Continuously improving our platform with cutting-edge technology.'
    }
];
const milestones = [
    { year: '2020', title: 'Founded', description: 'Zaillisy was established with a vision to revolutionize e-commerce' },
    { year: '2021', title: '10K Users', description: 'Reached our first 10,000 active users milestone' },
    { year: '2022', title: 'Global Launch', description: 'Expanded to 50+ countries worldwide' },
    { year: '2023', title: '1M+ Products', description: 'Platform now hosts over 1 million products' },
    { year: '2024', title: '10M+ Users', description: 'Celebrated 10 million active users globally' }
];
export default function AboutPage() {
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                About Zaillisy
              </h1>
              <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-3xl mx-auto">
                Connecting millions of buyers and sellers worldwide through innovative e-commerce solutions
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                At Zaillisy, we believe that commerce should be accessible, secure, and beneficial for everyone. 
                Our mission is to create the world's most customer-centric e-commerce platform that empowers 
                both buyers and sellers to thrive in the digital economy.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                We're committed to building a sustainable, inclusive marketplace that connects people across 
                borders, cultures, and communities through the power of technology and human connection.
              </p>
              <div className="flex items-center space-x-4">
                <Target className="w-6 h-6 text-purple-600"/>
                <span className="text-purple-600 font-semibold">Empowering Global Commerce</span>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="relative">
              <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop&crop=center" alt="Zaillisy Team" width="600" height="400" className="rounded-lg shadow-lg"/>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
            { number: '10M+', label: 'Active Users' },
            { number: '50K+', label: 'Sellers' },
            { number: '1M+', label: 'Products' },
            { number: '50+', label: 'Countries' }
        ].map((stat, index) => (<motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300">{stat.label}</div>
              </motion.div>))}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (<motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} className="text-center">
                <div className="mb-4 flex justify-center">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {value.description}
                </p>
              </motion.div>))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              The passionate individuals driving Zaillisy's success
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (<motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} className="bg-white rounded-lg shadow-sm overflow-hidden text-center">
                <div className="relative h-48">
                  <img src={member.image} alt={member.name} className="object-cover w-full h-full"/>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-purple-600 font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {member.bio}
                  </p>
                </div>
              </motion.div>))}
          </div>
        </div>
      </div>

      {/* Milestones Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Key milestones in Zaillisy's growth story
            </p>
          </div>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-purple-200 h-full"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (<motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="text-2xl font-bold text-purple-600 mb-2">
                        {milestone.year}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Timeline dot */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-purple-600 rounded-full border-4 border-white shadow-lg"></div>
                </motion.div>))}
            </div>
          </div>
        </div>
      </div>

      {/* Awards Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Recognition & Awards
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Industry recognition for our innovation and customer service
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
            {
                title: 'Best E-commerce Platform 2024',
                organization: 'Tech Awards',
                description: 'Recognized for innovation and user experience'
            },
            {
                title: 'Customer Choice Award',
                organization: 'Consumer Reports',
                description: 'Highest customer satisfaction in our category'
            },
            {
                title: 'Global Expansion Award',
                organization: 'International Business',
                description: 'Outstanding growth in international markets'
            }
        ].map((award, index) => (<motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center">
                <Award className="w-12 h-12 text-purple-600 mx-auto mb-4"/>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {award.title}
                </h3>
                <p className="text-purple-600 font-medium mb-3">
                  {award.organization}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  {award.description}
                </p>
              </motion.div>))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Join the Zaillisy Community
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Whether you're a buyer looking for amazing products or a seller wanting to reach millions of customers, 
              we're here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Start Shopping
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors">
                Become a Seller
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>);
}

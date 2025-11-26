'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shirt, Users, HelpCircle, Download, Printer } from 'lucide-react';
export default function SizeGuide() {
    const [selectedCategory, setSelectedCategory] = useState('clothing');
    const categories = [
        { id: 'clothing', name: 'Clothing', icon: <Shirt className="w-5 h-5"/> },
        { id: 'shoes', name: 'Shoes', icon: <Users className="w-5 h-5"/> },
        { id: 'accessories', name: 'Accessories', icon: <HelpCircle className="w-5 h-5"/> }
    ];
    const clothingSizes = [
        { size: 'XS', chest: '32-34"', waist: '26-28"', hips: '34-36"', fit: 'Slim' },
        { size: 'S', chest: '34-36"', waist: '28-30"', hips: '36-38"', fit: 'Regular' },
        { size: 'M', chest: '36-38"', waist: '30-32"', hips: '38-40"', fit: 'Regular' },
        { size: 'L', chest: '38-40"', waist: '32-34"', hips: '40-42"', fit: 'Regular' },
        { size: 'XL', chest: '40-42"', waist: '34-36"', hips: '42-44"', fit: 'Relaxed' },
        { size: 'XXL', chest: '42-44"', waist: '36-38"', hips: '44-46"', fit: 'Relaxed' }
    ];
    const shoeSizes = [
        { us: '6', eu: '39', uk: '5.5', cm: '24' },
        { us: '7', eu: '40', uk: '6.5', cm: '25' },
        { us: '8', eu: '41', uk: '7.5', cm: '26' },
        { us: '9', eu: '42', uk: '8.5', cm: '27' },
        { us: '10', eu: '43', uk: '9.5', cm: '28' },
        { us: '11', eu: '44', uk: '10.5', cm: '29' },
        { us: '12', eu: '45', uk: '11.5', cm: '30' }
    ];
    const measurementSteps = [
        {
            step: 1,
            title: 'Chest/Bust',
            description: 'Measure around the fullest part of your chest, keeping the tape horizontal',
            image: '👕'
        },
        {
            step: 2,
            title: 'Waist',
            description: 'Measure around your natural waistline, keeping the tape comfortably loose',
            image: '📏'
        },
        {
            step: 3,
            title: 'Hips',
            description: 'Measure around the fullest part of your hips, keeping the tape horizontal',
            image: '📐'
        },
        {
            step: 4,
            title: 'Inseam',
            description: 'Measure from the crotch to the bottom of your ankle',
            image: '👖'
        }
    ];
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Size Guide</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Find your perfect fit with our comprehensive size charts and measurement guide</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How to Measure</h2>
          <p className="text-gray-600 dark:text-gray-300">Follow these simple steps to get accurate measurements</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {measurementSteps.map((step, index) => (<motion.div key={step.step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
              <div className="text-4xl mb-4">{step.image}</div>
              <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mx-auto mb-4">
                {step.step}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm">{step.description}</p>
            </motion.div>))}
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
            {categories.map((category) => (<button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedCategory === category.id
                ? 'bg-blue-500 text-white'
                : 'text-gray-700 hover:bg-gray-100'}`}>
                {category.icon}
                {category.name}
              </button>))}
          </div>
        </div>

        {selectedCategory === 'clothing' && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Clothing Size Chart</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Size</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Chest</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Waist</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Hips</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Fit</th>
                  </tr>
                </thead>
                <tbody>
                  {clothingSizes.map((size, index) => (<tr key={size.size} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{size.size}</td>
                      <td className="py-3 px-4 text-gray-600">{size.chest}</td>
                      <td className="py-3 px-4 text-gray-600">{size.waist}</td>
                      <td className="py-3 px-4 text-gray-600">{size.hips}</td>
                      <td className="py-3 px-4 text-gray-600">{size.fit}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </motion.div>)}

        {selectedCategory === 'shoes' && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Shoe Size Chart</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">US</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">EU</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">UK</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">CM</th>
                  </tr>
                </thead>
                <tbody>
                  {shoeSizes.map((size, index) => (<tr key={size.us} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{size.us}</td>
                      <td className="py-3 px-4 text-gray-600">{size.eu}</td>
                      <td className="py-3 px-4 text-gray-600">{size.uk}</td>
                      <td className="py-3 px-4 text-gray-600">{size.cm}</td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </motion.div>)}

        {selectedCategory === 'accessories' && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Accessories Size Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hats & Caps</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Small:</span>
                    <span className="font-medium">6 7/8 - 7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Medium:</span>
                    <span className="font-medium">7 1/8 - 7 1/4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Large:</span>
                    <span className="font-medium">7 3/8 - 7 1/2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">X-Large:</span>
                    <span className="font-medium">7 5/8 - 7 3/4</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Belts</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Small:</span>
                    <span className="font-medium">28" - 32"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Medium:</span>
                    <span className="font-medium">32" - 36"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Large:</span>
                    <span className="font-medium">36" - 40"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">X-Large:</span>
                    <span className="font-medium">40" - 44"</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>)}
      </div>

      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Size Guide Tools</h2>
            <p className="text-gray-600 dark:text-gray-300">Download or print our size guides for easy reference</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="bg-gray-50 rounded-xl p-8 text-center">
              <Download className="w-12 h-12 text-blue-500 mx-auto mb-4"/>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Download PDF</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Get a printable version of our complete size guide</p>
              <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors">
                Download Size Guide
              </button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }} className="bg-gray-50 rounded-xl p-8 text-center">
              <Printer className="w-12 h-12 text-green-500 mx-auto mb-4"/>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Print Guide</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Print the size guide for easy reference at home</p>
              <button className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors">
                Print Size Guide
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}>
            <h2 className="text-3xl font-bold mb-4">Still Unsure About Your Size?</h2>
            <p className="text-gray-300 mb-8">Our customer support team can help you find the perfect fit</p>
            <button className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors">Contact Support</button>
          </motion.div>
        </div>
      </div>
    </div>);
}

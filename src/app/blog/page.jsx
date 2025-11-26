'use client';
import { motion } from 'framer-motion';
import { Calendar, User, ArrowRight, Search } from 'lucide-react';
export default function Blog() {
    const articles = [
        {
            title: 'The Future of Social Commerce: Trends to Watch in 2025',
            excerpt: 'Discover the latest trends shaping the future of social commerce and how they will impact online shopping.',
            author: 'Sarah Johnson',
            date: 'December 15, 2024',
            category: 'Industry Trends',
            readTime: '5 min read'
        },
        {
            title: 'How AI is Revolutionizing Product Recommendations',
            excerpt: 'Learn how artificial intelligence is transforming the way we discover and purchase products online.',
            author: 'Michael Chen',
            date: 'December 10, 2024',
            category: 'Technology',
            readTime: '7 min read'
        },
        {
            title: 'Building Trust in E-commerce: Best Practices for Sellers',
            excerpt: 'Essential strategies for building customer trust and increasing sales in the competitive e-commerce landscape.',
            author: 'Emily Rodriguez',
            date: 'December 5, 2024',
            category: 'Business Tips',
            readTime: '6 min read'
        },
        {
            title: 'Sustainability in E-commerce: A Guide for Conscious Shopping',
            excerpt: 'How consumers and businesses can work together to create a more sustainable shopping experience.',
            author: 'David Thompson',
            date: 'November 30, 2024',
            category: 'Sustainability',
            readTime: '8 min read'
        }
    ];
    return (<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <h1 className="text-5xl font-bold mb-6">Blog</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Insights, updates, and stories from the world of e-commerce and social commerce.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
                <input type="text" placeholder="Search articles..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"/>
              </div>
              <div className="flex gap-2">
                {['All', 'Industry Trends', 'Technology', 'Business Tips', 'Sustainability'].map((category) => (<button key={category} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700 transition-colors">
                    {category}
                  </button>))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Articles */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map((article, index) => (<motion.article key={article.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {article.category}
                    </span>
                    <span className="text-gray-500 text-sm">{article.readTime}</span>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-900 mb-3 hover:text-purple-600 transition-colors">
                    {article.title}
                  </h2>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4"/>
                        {article.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4"/>
                        {article.date}
                      </div>
                    </div>
                    
                    <button className="text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1">
                      Read More
                      <ArrowRight className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              </motion.article>))}
          </div>
        </div>
      </div>


    </div>);
}

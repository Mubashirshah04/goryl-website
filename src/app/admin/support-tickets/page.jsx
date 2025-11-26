'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Download, Eye, User } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
const demoTickets = [];
export default function SupportTicketsPage() {
    const [tickets, setTickets] = useState(demoTickets);
    const [filteredTickets, setFilteredTickets] = useState(demoTickets);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const [loading, setLoading] = useState(false);
    // Filter tickets based on search and filters
    React.useEffect(() => {
        let filtered = tickets;
        if (searchQuery) {
            filtered = filtered.filter(ticket => ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.description.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        if (statusFilter !== 'all') {
            filtered = filtered.filter(ticket => ticket.status === statusFilter);
        }
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
        }
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(ticket => ticket.category === categoryFilter);
        }
        setFilteredTickets(filtered);
    }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter]);
    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'bg-red-100 text-red-800';
            case 'in-progress': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    const handleStatusUpdate = async (ticketId, newStatus) => {
        setLoading(true);
        try {
            // Update ticket status in database
            // await updateTicketStatus(ticketId, newStatus)
            setTickets(prev => prev.map(ticket => ticket.id === ticketId
                ? Object.assign(Object.assign({}, ticket), { status: newStatus, updatedAt: new Date() }) : ticket));
            toast.success('Ticket status updated successfully');
        }
        catch (error) {
            toast.error('Failed to update ticket status');
        }
        finally {
            setLoading(false);
        }
    };
    const handleReply = async (ticketId) => {
        if (!replyMessage.trim()) {
            toast.error('Please enter a reply message');
            return;
        }
        setLoading(true);
        try {
            // Add reply to database
            // await addTicketReply(ticketId, replyMessage)
            setTickets(prev => prev.map(ticket => ticket.id === ticketId
                ? Object.assign(Object.assign({}, ticket), { messages: [
                        ...ticket.messages,
                        {
                            id: Date.now().toString(),
                            sender: 'admin',
                            senderName: 'Admin',
                            message: replyMessage,
                            timestamp: new Date()
                        }
                    ], updatedAt: new Date() }) : ticket));
            setReplyMessage('');
            toast.success('Reply sent successfully');
        }
        catch (error) {
            toast.error('Failed to send reply');
        }
        finally {
            setLoading(false);
        }
    };
    const exportTickets = () => {
        // Export functionality
        toast.success('Exporting tickets...');
    };
    return (<AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
            <p className="text-gray-600 dark:text-gray-300">Manage customer support requests</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={exportTickets} className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="w-4 h-4"/>
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
              <input type="text" placeholder="Search tickets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            </div>
            
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="account">Account</option>
              <option value="product">Product</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.length === 0 ? (<tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300"/>
                      <p className="text-lg font-medium">No support tickets found</p>
                      <p className="text-sm">Support tickets will appear here when customers submit requests.</p>
                    </td>
                  </tr>) : (filteredTickets.map((ticket) => (<motion.tr key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{ticket.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {ticket.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600"/>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{ticket.userName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{ticket.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 capitalize">{ticket.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {ticket.createdAt.toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                          {ticket.createdAt.toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button onClick={() => {
                setSelectedTicket(ticket);
                setShowTicketModal(true);
            }} className="text-blue-600 hover:text-blue-800 transition-colors">
                            <Eye className="w-4 h-4"/>
                          </button>
                        </div>
                      </td>
                    </motion.tr>)))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>);
}

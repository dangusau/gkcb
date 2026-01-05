import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { 
  Calendar, 
  Newspaper, 
  ShoppingBag, 
  ChevronLeft, 
  MapPin, 
  Clock, 
  Briefcase, 
  Plus, 
  Search, 
  DollarSign, 
  Filter,
  X,
  CheckCircle
} from 'lucide-react';
import { Event, Classified, Job } from '../types';
import { supabase } from '../services/supabase';

const Explore = () => {
    const [view, setView] = useState<'explore' | 'jobs'>('explore');
    const navigate = useNavigate();
    
    const [events, setEvents] = useState<Event[]>([]);
    const [classifieds, setClassifieds] = useState<Classified[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

    const [jobTab, setJobTab] = useState<'all' | 'my' | 'new'>('all');
    const [jobSearch, setJobSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState("All");
    const [showFilters, setShowFilters] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        // Get current user
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        getUser();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch events
                const { data: eventsData, error: eventsError } = await supabase
                    .from('events')
                    .select('*')
                    .order('start_time', { ascending: true })
                    .gte('start_time', new Date().toISOString())
                    .limit(3);

                if (eventsError) throw eventsError;
                
                // Fetch classifieds
                const { data: classifiedsData, error: classifiedsError } = await supabase
                    .from('classifieds')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(4);

                if (classifiedsError) throw classifiedsError;
                
                // Fetch jobs
                const { data: jobsData, error: jobsError } = await supabase
                    .from('jobs')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (jobsError) throw jobsError;
                
                // Mark user's jobs with is_owner flag
                let userId = null;
                if (currentUser) {
                    // In your schema, profiles.id is the same as auth.users.id
                    // So we can use currentUser.id directly as the profile id
                    userId = currentUser.id;
                }

                const jobsWithOwnership = jobsData?.map(job => ({
                    ...job,
                    is_owner: userId ? job.employer_id === userId : false
                })) || [];

                setEvents(eventsData || []);
                setClassifieds(classifiedsData || []);
                setJobs(jobsWithOwnership || []);
                setFilteredJobs(jobsWithOwnership || []);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser]);

    useEffect(() => {
        let result = jobs;

        if (jobTab === 'my') {
            result = result.filter(job => job.is_owner);
        }

        if (jobSearch) {
            const term = jobSearch.toLowerCase();
            result = result.filter(job => 
                job.title.toLowerCase().includes(term) || 
                job.company.toLowerCase().includes(term) ||
                job.location?.toLowerCase().includes(term)
            );
        }

        if (selectedType !== 'All') {
            result = result.filter(job => job.type === selectedType);
        }

        setFilteredJobs(result);
    }, [jobSearch, jobTab, jobs, selectedType]);

    const jobTypes = ['All', 'Full-time', 'Part-time', 'Contract', 'Remote', 'Internship'];

    const QuickAction = ({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick?: () => void }) => (
        <button 
            onClick={onClick} 
            className="flex flex-col items-center gap-2 group active:scale-95 transition-transform"
        >
            <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                <Icon size={28} className="text-white" />
            </div>
            <span className="text-xs font-bold text-gray-700">{label}</span>
        </button>
    );

    const clearFilters = () => {
        setJobSearch("");
        setSelectedType("All");
        setJobTab('all');
    };

    const formatEventDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const formatEventTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const formatTimeAgo = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const [jobForm, setJobForm] = useState({
        title: '',
        company: '',
        type: '',
        salary_range: '',
        location: '',
        description: '',
    });

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setJobForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePostJob = async () => {
        if (!jobForm.title || !jobForm.company || !jobForm.description) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            // Get authenticated user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Please sign in to post a job');
                return;
            }

            // Check if profile exists in the profiles table
            // In your schema, profiles.id is the same as auth.users.id
            const { data: existingProfile, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
                throw profileError;
            }

            // If profile doesn't exist, create one
            let profileId = user.id;
            if (!existingProfile) {
                // Create a basic profile for the user
                const { data: newProfile, error: createError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: user.id,
                            first_name: user.user_metadata?.full_name?.split(' ')[0] || 'User',
                            email: user.email || '',
                            last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                            role: 'member',
                            approval_status: 'pending'
                        }
                    ])
                    .select('id')
                    .single();

                if (createError) {
                    console.error('Error creating profile:', createError);
                    throw createError;
                }
                profileId = newProfile.id;
            } else {
                profileId = existingProfile.id;
            }

            const newJob = {
                title: jobForm.title,
                company: jobForm.company,
                type: jobForm.type || null,
                salary_range: jobForm.salary_range || null,
                location: jobForm.location || null,
                description: jobForm.description,
                employer_id: profileId,
                created_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from('jobs')
                .insert([newJob])
                .select()
                .single();

            if (error) throw error;

            // Refresh jobs list
            const { data: updatedJobs, error: jobsError } = await supabase
                .from('jobs')
                .select('*')
                .order('created_at', { ascending: false });

            if (jobsError) throw jobsError;

            // Mark ownership
            const jobsWithOwnership = updatedJobs?.map(job => ({
                ...job,
                is_owner: job.employer_id === profileId
            })) || [];

            setJobs(jobsWithOwnership);
            setFilteredJobs(jobsWithOwnership);
            
            // Reset form and switch to my listings
            setJobForm({
                title: '',
                company: '',
                type: '',
                salary_range: '',
                location: '',
                description: '',
            });
            setJobTab('my');
            
            alert('Job posted successfully!');
        } catch (error) {
            console.error('Error posting job:', error);
            alert('Failed to post job. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 flex flex-col items-center justify-center safe-area">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading Explore...</p>
                </div>
            </div>
        );
    }

    // --- EMPLOYMENT BOARD VIEW ---
    if (view === 'jobs') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
                {/* Custom Sub-page Header */}
                <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-50 to-blue-50">
                    <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-200/80">
                        <button 
                            onClick={() => setView('explore')}
                            className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800">Employment Board</h1>
                            <p className="text-xs text-gray-500">Find & post jobs in your network</p>
                        </div>
                    </div>
                </div>

                {/* Main Content - MATCHING MEMBERS PAGE WIDTH */}
                <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
                    {/* Search & Filter Section */}
                    <div className="mb-6">
                        {/* Search Bar - Hidden in New Tab */}
                        {jobTab !== 'new' && (
                            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-4 mb-4">
                                <div className="relative mb-3 group">
                                    <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                                        <Search className="text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                                        placeholder="Search jobs, companies, locations..."
                                        value={jobSearch}
                                        onChange={(e) => setJobSearch(e.target.value)}
                                    />
                                    {jobSearch && (
                                        <button
                                            onClick={() => setJobSearch('')}
                                            className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>

                                {/* Filter Button */}
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 font-medium"
                                    >
                                        <Filter size={16} />
                                        {selectedType !== 'All' ? `${selectedType}` : 'Filter by Type'}
                                    </button>
                                    
                                    {(jobSearch || selectedType !== 'All') && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                        >
                                            <X size={14} />
                                            Clear All
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Main Tabs */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setJobTab('all')}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                    jobTab === 'all'
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                }`}
                            >
                                <Search size={16} />
                                Find Jobs
                            </button>
                            <button
                                onClick={() => setJobTab('my')}
                                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                    jobTab === 'my'
                                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                }`}
                            >
                                <Briefcase size={16} />
                                My Listings
                            </button>
                            <button
                                onClick={() => setJobTab('new')}
                                className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 flex items-center gap-2 ${
                                    jobTab === 'new' 
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200/50' 
                                        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm hover:shadow-md hover:shadow-blue-200/50'
                                }`}
                            >
                                <Plus size={18} />
                                Post Job
                            </button>
                        </div>

                        {/* Job Type Filters */}
                        {showFilters && jobTab !== 'new' && (
                            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-4 animate-fade-in mb-4">
                                <h4 className="text-sm font-bold text-gray-900 mb-3">Filter by Job Type</h4>
                                <div className="flex flex-wrap gap-2">
                                    {jobTypes.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setSelectedType(type);
                                                setShowFilters(false);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                                                selectedType === type
                                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            <Briefcase size={12} />
                                            {type}
                                            {selectedType === type && (
                                                <CheckCircle size={12} className="ml-1" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Banner */}
                    {jobTab !== 'new' && (
                        <div className="mb-6">
                            <div className="bg-gradient-to-r from-blue-600/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-blue-200/50 p-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white/80 rounded-xl p-3 text-center">
                                        <div className="text-2xl font-bold text-gray-900">{jobs.length}</div>
                                        <div className="text-xs text-gray-600">Total Jobs</div>
                                    </div>
                                    <div className="bg-white/80 rounded-xl p-3 text-center">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {jobs.filter(j => j.is_owner).length}
                                        </div>
                                        <div className="text-xs text-gray-600">My Listings</div>
                                    </div>
                                    <div className="bg-white/80 rounded-xl p-3 text-center">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {selectedType === 'All' ? jobs.length : filteredJobs.length}
                                        </div>
                                        <div className="text-xs text-gray-600">{selectedType}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content Area */}
                    {jobTab === 'new' ? (
                        // Post Job Form
                        <div>
                            {/* Form Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl overflow-hidden mb-6">
                                <div className="p-6 text-white text-center">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Briefcase size={28} className="text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold mb-2">Post a Job Opening</h2>
                                    <p className="text-sm opacity-90">Find the best talent in your network</p>
                                </div>
                            </div>

                            {/* Form Body */}
                            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden mb-6">
                                <div className="p-6 space-y-6">
                                    {/* Job Info Section */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                                                <Briefcase size={14} className="text-white" />
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-900">Job Information</h3>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-700">Job Title *</label>
                                                <input 
                                                    type="text" 
                                                    name="title"
                                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm"
                                                    placeholder="e.g. Sales Manager"
                                                    value={jobForm.title}
                                                    onChange={handleFormChange}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-700">Company *</label>
                                                <input 
                                                    type="text" 
                                                    name="company"
                                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm"
                                                    placeholder="Your Company Name"
                                                    value={jobForm.company}
                                                    onChange={handleFormChange}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-gray-700">Job Type</label>
                                                    <div className="relative">
                                                        <select 
                                                            name="type"
                                                            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm text-gray-700"
                                                            value={jobForm.type}
                                                            onChange={handleFormChange}
                                                        >
                                                            <option value="">Select type...</option>
                                                            {jobTypes.filter(t => t !== 'All').map(type => (
                                                                <option key={type} value={type}>{type}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                            <div className="w-2 h-2 border-r-2 border-b-2 border-gray-400 transform rotate-45"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-semibold text-gray-700">Salary Range</label>
                                                    <div className="relative">
                                                        <input 
                                                            type="text" 
                                                            name="salary_range"
                                                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm"
                                                            placeholder="e.g. 150k-200k"
                                                            value={jobForm.salary_range}
                                                            onChange={handleFormChange}
                                                        />
                                                        <DollarSign size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-700">Location</label>
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        name="location"
                                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm"
                                                        placeholder="e.g. Kano, Nigeria"
                                                        value={jobForm.location}
                                                        onChange={handleFormChange}
                                                    />
                                                    <MapPin size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-700">Job Description *</label>
                                                <textarea 
                                                    name="description"
                                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200 text-sm min-h-[140px] resize-none"
                                                    placeholder="Describe the role, requirements, and benefits..."
                                                    value={jobForm.description}
                                                    onChange={handleFormChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button 
                                        onClick={handlePostJob}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200/50 active:scale-[0.98] transition-all duration-200 text-sm mt-4"
                                    >
                                        Publish Job Listing
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Job List View
                        <div>
                            {filteredJobs.length === 0 ? (
                                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-8 text-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                                        {jobTab === 'all' ? 'No Jobs Found' : 'No Jobs in Your Listings'}
                                    </h4>
                                    <p className="text-gray-600 text-sm mb-6">
                                        {jobSearch || selectedType !== 'All'
                                            ? 'Try adjusting your search or filters'
                                            : jobTab === 'all'
                                            ? 'No job listings available'
                                            : 'Post your first job to get started'}
                                    </p>
                                    {(jobSearch || selectedType !== 'All') && (
                                        <button
                                            onClick={clearFilters}
                                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold px-6 py-3 rounded-lg transition-colors active:scale-95"
                                        >
                                            Clear Filters
                                        </button>
                                    )}
                                    {jobTab === 'my' && filteredJobs.length === 0 && !jobSearch && selectedType === 'All' && (
                                        <button
                                            onClick={() => setJobTab('new')}
                                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold px-6 py-3 rounded-lg transition-colors active:scale-95 mt-2"
                                        >
                                            Post Your First Job
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredJobs.map((job) => (
                                        <div 
                                            key={job.id} 
                                            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl transition-shadow"
                                        >
                                            {/* Job Header */}
                                            <div className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="relative">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold overflow-hidden">
                                                                {job.logo_url ? (
                                                                    <img 
                                                                        src={job.logo_url} 
                                                                        alt={job.company}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    job.company.substring(0, 2).toUpperCase()
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="text-sm font-bold text-gray-900 truncate">
                                                                    {job.title}
                                                                </h3>
                                                            </div>
                                                            <p className="text-xs text-gray-600 truncate mt-1">
                                                                {job.company}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {job.type && (
                                                                    <span className="px-2 py-0.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-[10px] font-bold rounded-lg">
                                                                        {job.type}
                                                                    </span>
                                                                )}
                                                                {job.salary_range && (
                                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                        <DollarSign size={10} />
                                                                        {job.salary_range}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Posted Time */}
                                                    <div className="flex-shrink-0 ml-2">
                                                        <span className="text-xs text-gray-400">
                                                            {formatTimeAgo(job.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Job Details */}
                                            <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                                                <div className="space-y-2">
                                                    {job.location && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                                            <MapPin size={12} />
                                                            <span>{job.location}</span>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <Clock size={12} />
                                                        <span>Posted {formatTimeAgo(job.created_at)}</span>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 mt-4">
                                                    <button className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-lg transition-all active:scale-95">
                                                        {job.is_owner ? 'Manage Listing' : 'Apply Now'}
                                                    </button>
                                                    {!job.is_owner && (
                                                        <button className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center">
                                                            <Briefcase size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // --- MAIN EXPLORE VIEW ---
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50">
            {/* Fixed Header */}
            <Header title="Explore GKBC" showBack={false} />

            {/* Main Content - MATCHING MEMBERS PAGE WIDTH */}
            <main className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto">
                {/* Quick Actions Grid */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 p-6 mb-6">
                    <div className="grid grid-cols-3 gap-4">
                        <QuickAction 
                            icon={Briefcase} 
                            label="Jobs" 
                            color="bg-gradient-to-br from-blue-600 to-blue-700" 
                            onClick={() => setView('jobs')} 
                        />
                        <QuickAction 
                            icon={Calendar} 
                            label="Events" 
                            color="bg-gradient-to-br from-orange-500 to-orange-600" 
                            onClick={() => navigate('/events')} 
                        />
                        <QuickAction 
                            icon={ShoppingBag} 
                            label="Market" 
                            color="bg-gradient-to-br from-emerald-500 to-emerald-600" 
                            onClick={() => navigate('/market')} 
                        />
                    </div>
                </div>

                {/* Upcoming Events Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg flex items-center justify-center">
                                <Calendar size={16} className="text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Upcoming Events</h2>
                        </div>
                        <button 
                            onClick={() => navigate('/events')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-bold"
                        >
                            View All
                        </button>
                    </div>
                    
                    <div className="flex overflow-x-auto gap-4 scrollbar-hide scroll-smooth pb-2 -mx-4 px-4">
                        {events.slice(0, 3).map(event => (
                            <div 
                                key={event.id} 
                                onClick={() => navigate(`/event/${event.id}`)}
                                className="min-w-[280px] bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl transition-shadow active:scale-[0.98]"
                            >
                                <div className="h-40 bg-gradient-to-br from-orange-100 to-orange-50 relative overflow-hidden">
                                    {event.image_url && (
                                        <img 
                                            src={event.image_url} 
                                            alt={event.title} 
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs font-bold text-orange-700 shadow-sm">
                                        {formatEventDate(event.start_time)}
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2">{event.title}</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Clock size={12} />
                                            <span>{formatEventTime(event.start_time)}</span>
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center gap-2 text-xs text-gray-600">
                                                <MapPin size={12} />
                                                <span className="line-clamp-1">{event.location}</span>
                                            </div>
                                        )}
                                    </div>
                                    <button className="w-full mt-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white text-sm font-bold rounded-lg transition-all active:scale-95">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Marketplace Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                                <ShoppingBag size={16} className="text-white" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Marketplace</h2>
                        </div>
                        <button 
                            onClick={() => navigate('/market')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-bold"
                        >
                            View All
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {classifieds.slice(0, 4).map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => navigate(`/market/${item.id}`)}
                                className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden hover:shadow-xl transition-shadow active:scale-[0.98]"
                            >
                                <div className="h-36 bg-gradient-to-br from-emerald-100 to-emerald-50 overflow-hidden">
                                    {item.image_url && (
                                        <img 
                                            src={item.image_url} 
                                            alt={item.title} 
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-gray-900 text-xs mb-1 line-clamp-1">{item.title}</h4>
                                    {item.price && (
                                        <p className="text-blue-600 font-bold text-sm mb-2">{item.price}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        {item.category && (
                                            <span className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-[10px] font-bold rounded-lg">
                                                {item.category}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gray-500">{formatTimeAgo(item.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats Banner */}
                <div className="mt-8">
                    <div className="bg-gradient-to-r from-blue-600/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-blue-200/50 p-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/80 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-gray-900">{events.length}</div>
                                <div className="text-xs text-gray-600">Events</div>
                            </div>
                            <div className="bg-white/80 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {classifieds.length}
                                </div>
                                <div className="text-xs text-gray-600">Listings</div>
                            </div>
                            <div className="bg-white/80 rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                    {jobs.length}
                                </div>
                                <div className="text-xs text-gray-600">Jobs</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Explore;
import React from 'react';
import { MapPin, Briefcase, DollarSign, Clock, Mail, Phone } from 'lucide-react';
import { Job } from '../../types/explore';
import { formatTimeAgo } from '../../utils/formatters';

interface Props {
  job: Job;
}

const JobCard: React.FC<Props> = ({ job }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-5">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border border-blue-200">
          <div className="flex items-start gap-4">
            {/* Company Avatar */}
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-md border-2 border-white">
              {job.company_avatar ? (
                <img src={job.company_avatar} alt={job.company_name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                job.company_name?.charAt(0) || 'C'
              )}
            </div>

            {/* Title and Salary */}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{job.title}</h3>
                  <p className="text-blue-700 font-medium">{job.company_name}</p>
                </div>
                {job.salary && (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                    {job.salary}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase size={16} className="text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Type</div>
              <div className="font-medium text-gray-900">{job.job_type}</div>
            </div>
          </div>

          {job.location && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin size={16} className="text-green-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Location</div>
                <div className="font-medium text-gray-900 truncate">{job.location}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock size={16} className="text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Posted</div>
              <div className="font-medium text-gray-900">{formatTimeAgo(job.created_at)}</div>
            </div>
          </div>

          {/* Category badge */}
          {job.category && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 font-bold text-xs">🏢</span>
              </div>
              <div>
                <div className="text-xs text-gray-500">Category</div>
                <div className="font-medium text-gray-900 truncate">{job.category}</div>
              </div>
            </div>
          )}
        </div>

        {/* Description Preview */}
        {job.description && (
          <div className="mb-4">
            <div className="text-sm text-gray-500 mb-2 font-medium">Description</div>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm line-clamp-3">
              {job.description}
            </p>
          </div>
        )}

        {/* Contact Information - Always show if available */}
        <div className="border-t border-gray-100 pt-4">
          <div className="text-sm text-gray-500 mb-3 font-medium">Contact Information</div>
          <div className="space-y-2">
            {job.contact_email && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">Email</div>
                  <a 
                    href={`mailto:${job.contact_email}`}
                    className="text-blue-600 font-medium truncate block hover:text-blue-700"
                  >
                    {job.contact_email}
                  </a>
                </div>
              </div>
            )}

            {job.contact_phone && (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone size={14} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">Phone</div>
                  <a 
                    href={`tel:${job.contact_phone}`}
                    className="text-green-600 font-medium truncate block hover:text-green-700"
                  >
                    {job.contact_phone}
                  </a>
                </div>
              </div>
            )}

            {/* Fallback message if no contact info */}
            {!job.contact_email && !job.contact_phone && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">Contact details not provided</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
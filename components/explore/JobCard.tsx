import React from 'react';
import { MapPin, Briefcase, DollarSign, Clock } from 'lucide-react';
import { Job } from '../../types/explore';
import { formatTimeAgo } from '../../utils/formatters';

interface Props {
  job: Job;
}

const JobCard: React.FC<Props> = ({ job }) => {
  return (
    <div className="bg-white rounded-xl shadow border p-4">
      <div className="flex items-start gap-3">
        {/* Company Avatar */}
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
          {job.company_avatar ? (
            <img src={job.company_avatar} alt={job.company_name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            job.company_name?.charAt(0) || 'C'
          )}
        </div>

        {/* Job Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-900 truncate">{job.title}</h3>
              <p className="text-sm text-gray-600">{job.company_name}</p>
            </div>
            {job.salary && (
              <span className="text-green-600 font-bold whitespace-nowrap">
                {job.salary}
              </span>
            )}
          </div>

          {/* Job Info */}
          <div className="flex flex-wrap gap-3 mt-3">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Briefcase size={14} />
              <span>{job.job_type}</span>
            </div>
            {job.location && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin size={14} />
                <span>{job.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock size={14} />
              <span>{formatTimeAgo(job.created_at)}</span>
            </div>
          </div>

          {/* Description Preview */}
          {job.description && (
            <p className="text-gray-700 text-sm mt-3 line-clamp-2">
              {job.description}
            </p>
          )}

          {/* Contact Button */}
          <button className="mt-4 w-full py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors">
            Contact for Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
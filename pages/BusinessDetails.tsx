import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Phone, Mail, Globe, Share2, MoreVertical } from 'lucide-react';
import { businessService } from '../services/supabase/business';
import { Business } from '../types/business';
import { formatTimeAgo } from '../utils/formatters';

const BusinessDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    if (id) {
      loadBusiness();
    }
  }, [id]);

  const loadBusiness = async () => {
    try {
      const data = await businessService.getBusinessDetails(id!);
      setBusiness(data);
    } catch (error) {
      console.error('Error loading business:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async () => {
    if (!business || !newReview.comment.trim()) return;
    try {
      await businessService.addReview(business.id, newReview.rating, newReview.comment);
      await loadBusiness(); // Refresh business data
      setNewReview({ rating: 5, comment: '' });
    } catch (error) {
      console.error('Error adding review:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Business Not Found</h2>
          <button onClick={() => navigate('/businesses')} className="text-blue-600">
            Back to Businesses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10 p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2">
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-2">
          <button className="p-2">
            <Share2 size={20} />
          </button>
          <button className="p-2">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Banner */}
      <div className="h-48 bg-gray-200">
        {business.banner_url && (
          <img
            src={business.banner_url}
            alt={business.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Business Info */}
      <div className="p-4 -mt-16 relative">
        <div className="flex items-end gap-4 mb-4">
          <div className="w-24 h-24 bg-white border-4 border-white rounded-xl shadow-lg overflow-hidden">
            {business.logo_url && (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{business.name}</h1>
              {business.is_registered && business.verification_status === 'approved' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                  ✓ Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{business.average_rating.toFixed(1)}</span>
                <span className="text-gray-400">({business.review_count})</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>{business.location_axis}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Type & Category */}
        <div className="flex gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm ${
            business.business_type === 'products' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {business.business_type}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
            {business.category}
          </span>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="font-bold mb-2">About</h3>
          <p className="text-gray-700 whitespace-pre-line">{business.description}</p>
        </div>

        {/* Contact Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-bold mb-3">Contact Information</h3>
          <div className="space-y-3">
            {business.address && (
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-gray-500" />
                <span>{business.address}</span>
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-gray-500" />
                <a href={`tel:${business.phone}`} className="text-blue-600">
                  {business.phone}
                </a>
              </div>
            )}
            {business.email && (
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-gray-500" />
                <a href={`mailto:${business.email}`} className="text-blue-600">
                  {business.email}
                </a>
              </div>
            )}
            {business.website && (
              <div className="flex items-center gap-3">
                <Globe size={18} className="text-gray-500" />
                <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                  {business.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Reviews ({business.review_count})</h3>
            <div className="flex items-center gap-1">
              <Star size={18} className="text-yellow-500 fill-yellow-500" />
              <span className="font-bold">{business.average_rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Add Review */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <h4 className="font-bold mb-3">Add Your Review</h4>
            <div className="flex gap-2 mb-3">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                  className="text-2xl"
                >
                  <Star
                    size={24}
                    className={star <= newReview.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Share your experience..."
              className="w-full p-3 border rounded-lg mb-3"
              rows={3}
            />
            <button
              onClick={handleAddReview}
              disabled={!newReview.comment.trim()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
            >
              Submit Review
            </button>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {business.reviews.map((review, index) => (
              <div key={index} className="border-b pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm">
                    {review.user_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="font-bold">{review.user_name}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span>•</span>
                      <span>{formatTimeAgo(review.created_at)}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-3 z-30">
        <button className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium">
          Call Now
        </button>
        <button className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium">
          Get Directions
        </button>
      </div>
    </div>
  );
};

export default BusinessDetails;
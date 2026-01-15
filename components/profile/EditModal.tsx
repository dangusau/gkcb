import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  type: string;
  data: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: any, avatarFile?: File, headerFile?: File) => Promise<void>;
}

const MARKET_AREAS = [
  'Central / Old City',
  'Sabon Gari / Kantin Kwari',
  'Farm Center / Beirut',
  'France Road',
  'Zoo Road',
  'Zaria Road',
  'Dawanau',
  'Sharada / Challawa',
  'Hotoro',
  'Gyadi-Gyadi / Tarauni',
  'Jigawa Road',
  'Mariri / Sheka',
  'Bompai',
  'Transport (Kano Line / Sabon Gari Park)',
  'Others'
];

const MARKETPLACE_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Vehicles',
  'Property',
  'Services',
  'Others'
];

const EditModal: React.FC<Props> = ({ type, data, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      if (type === 'profile') {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          bio: data.bio || '',
          phone: data.phone || '',
          address: data.address || '',
          business_name: data.business_name || '',
          business_type: data.business_type || '',
          market_area: data.market_area || ''
        });
      } else if (type === 'listing') {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          price: data.price || '',
          category: data.category || '',
          condition: data.condition || 'used',
          location: data.location || ''
        });
      } else if (type === 'business') {
        setFormData({
          name: data.name || '',
          description: data.description || '',
          business_type: data.business_type || '',
          category: data.category || '',
          location_axis: data.location_axis || '',
          address: data.address || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || ''
        });
      } else if (type === 'job') {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          salary: data.salary || '',
          job_type: data.job_type || 'full-time',
          location: data.location || ''
        });
      } else if (type === 'event') {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          event_date: data.event_date ? data.event_date.split('T')[0] + 'T' + data.event_date.split('T')[1].substring(0, 5) : '',
          location: data.location || ''
        });
      }
    }
  }, [data, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Transform data based on function parameters
      let transformedData = { ...formData };
      
      if (type === 'event') {
        // Format datetime-local to ISO string
        if (transformedData.event_date) {
          transformedData.event_date = new Date(transformedData.event_date).toISOString();
        }
      }
      
      if (type === 'listing') {
        // Ensure price is numeric
        if (transformedData.price) {
          transformedData.price = parseFloat(transformedData.price);
        }
      }

      await onSave(transformedData);
    } catch (error) {
      console.error('Save error:', error);
      setErrors({ general: 'Failed to save. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  const renderForm = () => {
    switch (type) {
      case 'profile':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name *</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg h-32"
                maxLength={500}
                placeholder="Tell us about yourself..."
              />
              <div className="text-right text-sm text-gray-500">
                {formData.bio?.length || 0}/500
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                placeholder="+234 800 000 0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                placeholder="City, State"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Business Name</label>
              <input
                type="text"
                name="business_name"
                value={formData.business_name || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                placeholder="Your business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Business Type *</label>
              <select
                name="business_type"
                value={formData.business_type || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              >
                <option value="">Select type</option>
                <option value="products">Products</option>
                <option value="services">Services</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Market Area</label>
              <select
                name="market_area"
                value={formData.market_area || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              >
                <option value="">Select market area</option>
                {MARKET_AREAS.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'listing':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg h-32"
                maxLength={1000}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Price (₦) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Condition *</label>
                <select
                  name="condition"
                  value={formData.condition || 'used'}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category || ''}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                  required
                >
                  <option value="">Select category</option>
                  {MARKETPLACE_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 'business':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Business Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg h-32"
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Business Type *</label>
                <select
                  name="business_type"
                  value={formData.business_type || ''}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                  required
                >
                  <option value="">Select type</option>
                  <option value="products">Products</option>
                  <option value="services">Services</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category || ''}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                  required
                  placeholder="e.g., Retail, Service"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Market Area</label>
              <select
                name="location_axis"
                value={formData.location_axis || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              >
                <option value="">Select market area</option>
                {MARKET_AREAS.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                placeholder="https://example.com"
              />
            </div>
          </div>
        );

      case 'job':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Job Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg h-32"
                maxLength={1000}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Salary</label>
                <input
                  type="text"
                  name="salary"
                  value={formData.salary || ''}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                  placeholder="e.g., ₦100,000/month"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Job Type</label>
                <select
                  name="job_type"
                  value={formData.job_type || 'full-time'}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="remote">Remote</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
            </div>
          </div>
        );

      case 'event':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Event Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg h-32"
                maxLength={1000}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Event Date & Time *</label>
              <input
                type="datetime-local"
                name="event_date"
                value={formData.event_date || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location || ''}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'profile': return 'Edit Profile';
      case 'listing': return 'Edit Listing';
      case 'business': return 'Edit Business';
      case 'job': return 'Edit Job';
      case 'event': return 'Edit Event';
      default: return 'Edit';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{getTitle()}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          {renderForm()}

          {errors.general && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
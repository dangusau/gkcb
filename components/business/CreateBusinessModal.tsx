import React, { useState } from 'react';
import { X, Upload, Store, MapPin, Mail, Phone, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { LOCATION_AXIS } from '../../types/business';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (businessData: any) => Promise<string>;
}

const CreateBusinessModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [businessType, setBusinessType] = useState<'products' | 'services'>('products');
  const [category, setCategory] = useState('');
  const [locationAxis, setLocationAxis] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('Submitting business form...');
      
      // Validate required fields
      if (!name.trim()) {
        throw new Error('Business name is required');
      }
      if (!description.trim()) {
        throw new Error('Description is required');
      }
      if (!category.trim()) {
        throw new Error('Category is required');
      }
      if (!locationAxis.trim()) {
        throw new Error('Location axis is required');
      }
      if (!phone.trim()) {
        throw new Error('Phone number is required');
      }

      const businessData = {
        name: name.trim(),
        description: description.trim(),
        business_type: businessType,
        category: category.trim(),
        location_axis: locationAxis,
        address: address.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim(),
        website: website.trim() || undefined,
        logo_file: logoFile || undefined,
        banner_file: bannerFile || undefined,
        is_registered: isRegistered
      };

      console.log('Calling onSubmit with data:', businessData);
      const businessId = await onSubmit(businessData);
      
      console.log('Business created successfully with ID:', businessId);
      setSuccess('✅ Business submitted successfully! It will be visible after admin approval.');
      
      // Reset form after success
      setTimeout(() => {
        resetForm();
        onClose();
      }, 3000);
    } catch (error: any) {
      console.error('Error creating business:', error);
      setError(error.message || 'Failed to create business. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setBusinessType('products');
    setCategory('');
    setLocationAxis('');
    setAddress('');
    setEmail('');
    setPhone('');
    setWebsite('');
    setLogoFile(null);
    setBannerFile(null);
    setIsRegistered(false);
    setStep(1);
    setError('');
    setSuccess('');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Logo file size should be less than 5MB');
        return;
      }
      setLogoFile(file);
      setError('');
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Banner file size should be less than 10MB');
        return;
      }
      setBannerFile(file);
      setError('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">List Your Business</h2>
          <button 
            onClick={() => {
              resetForm();
              onClose();
            }} 
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={uploading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mx-4 mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-2">
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Success!</p>
              <p className="text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex border-b mt-4">
          <button
            onClick={() => !uploading && setStep(1)}
            className={`flex-1 py-3 text-center ${step === 1 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'} ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={uploading}
          >
            Basic Info
          </button>
          <button
            onClick={() => !uploading && setStep(2)}
            className={`flex-1 py-3 text-center ${step === 2 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'} ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={uploading}
          >
            Details
          </button>
          <button
            onClick={() => !uploading && setStep(3)}
            className={`flex-1 py-3 text-center ${step === 3 ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'} ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={uploading}
          >
            Contact
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Business Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter business name"
                  className="w-full p-3 border rounded-lg disabled:opacity-50"
                  required
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your business..."
                  className="w-full p-3 border rounded-lg h-32 disabled:opacity-50"
                  maxLength={500}
                  required
                  disabled={uploading}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {description.length}/500
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Business Type *</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as 'products' | 'services')}
                    className="w-full p-3 border rounded-lg disabled:opacity-50"
                    required
                    disabled={uploading}
                  >
                    <option value="products">Products/Sales</option>
                    <option value="services">Service Provider</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Electronics, Fashion, Plumbing"
                    className="w-full p-3 border rounded-lg disabled:opacity-50"
                    required
                    disabled={uploading}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading || !name || !description || !category}
              >
                Next: Business Details
              </button>
            </>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Location Axis *</label>
                <select
                  value={locationAxis}
                  onChange={(e) => setLocationAxis(e.target.value)}
                  className="w-full p-3 border rounded-lg disabled:opacity-50"
                  required
                  disabled={uploading}
                >
                  <option value="">Select location axis</option>
                  {LOCATION_AXIS.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Full Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, building, etc."
                  className="w-full p-3 border rounded-lg disabled:opacity-50"
                  disabled={uploading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Logo (Optional)</label>
                  <label className={`block aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500'} ${logoFile ? 'border-blue-500' : 'border-gray-300'}`}>
                    {logoFile ? (
                      <div className="relative w-full h-full">
                        <img
                          src={URL.createObjectURL(logoFile)}
                          alt="Logo preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {!uploading && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLogoFile(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 bg-black/70 text-white rounded-full flex items-center justify-center"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Upload Logo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Banner (Optional)</label>
                  <label className={`block aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500'} ${bannerFile ? 'border-blue-500' : 'border-gray-300'}`}>
                    {bannerFile ? (
                      <div className="relative w-full h-full">
                        <img
                          src={URL.createObjectURL(bannerFile)}
                          alt="Banner preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {!uploading && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBannerFile(null);
                            }}
                            className="absolute top-2 right-2 w-6 h-6 bg-black/70 text-white rounded-full flex items-center justify-center"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Upload Banner</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg disabled:opacity-50"
                  disabled={uploading}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading || !locationAxis}
                >
                  Next: Contact Info
                </button>
              </div>
            </>
          )}

          {/* Step 3: Contact & Submit */}
          {step === 3 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Mail size={16} className="inline mr-2" />
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="business@email.com"
                    className="w-full p-3 border rounded-lg disabled:opacity-50"
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Phone size={16} className="inline mr-2" />
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="080XXXXXXXX"
                    className="w-full p-3 border rounded-lg disabled:opacity-50"
                    required
                    disabled={uploading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Globe size={16} className="inline mr-2" />
                  Website (Optional)
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-3 border rounded-lg disabled:opacity-50"
                  disabled={uploading}
                />
              </div>

              <div className={`flex items-center gap-3 p-4 rounded-lg ${uploading ? 'opacity-50' : ''}`}>
                <input
                  type="checkbox"
                  id="isRegistered"
                  checked={isRegistered}
                  onChange={(e) => setIsRegistered(e.target.checked)}
                  className="w-5 h-5"
                  disabled={uploading}
                />
                <label htmlFor="isRegistered" className="flex-1">
                  <div className="font-medium">Registered Business</div>
                  <p className="text-sm text-gray-600">
                    Check if your business is officially registered with CAC. 
                    Verified businesses get a badge.
                  </p>
                </label>
                <CheckCircle size={24} className="text-blue-600" />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg disabled:opacity-50"
                  disabled={uploading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={uploading || !phone}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Submit Business'
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateBusinessModal;
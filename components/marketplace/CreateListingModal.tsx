import React, { useState } from 'react';
import { X, Upload, DollarSign, MapPin } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (listingData: any) => Promise<void>;
}

const CATEGORIES = [
  'Electronics',
  'Fashion',
  'Vehicles',
  'Property',
  'Services',
  'Others'
];

const CONDITIONS = ['new', 'used', 'refurbished'];

const CreateListingModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('used');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    console.log('📋 SUBMITTING FORM DATA:');
    console.log('Title:', title);
    console.log('Description:', description);
    console.log('Price:', price);
    console.log('Category:', category);
    console.log('Condition:', condition);
    console.log('Location:', location);
    console.log('Images count:', images.length);
    console.log('Images details:', images.map((img, i) => `${i}: ${img.name} (${img.size} bytes)`));

    try {
      const listingData = {
        title,
        description,
        price: parseFloat(price),
        category,
        condition,
        location,
        images // This should be the File objects
      };

      console.log('📦 SENDING TO PARENT:', listingData);
      await onSubmit(listingData);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating listing:', error);
      alert('Failed to create listing. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory('');
    setCondition('used');
    setLocation('');
    setImages([]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 FILE INPUT TRIGGERED');
    console.log('Files in input:', e.target.files);
    
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      console.log('📁 NEW FILES TO ADD:', newFiles.map(f => `${f.name} (${f.size} bytes)`));
      
      setImages(prev => {
        const updated = [...prev, ...newFiles].slice(0, 5);
        console.log('📁 UPDATED IMAGES STATE:', updated.map(f => f.name));
        return updated;
      });
      
      // Reset input to allow selecting same file again
      e.target.value = '';
    } else {
      console.log('📁 NO FILES SELECTED');
    }
  };

  const removeImage = (index: number) => {
    console.log('🗑️ Removing image at index:', index);
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      console.log('🗑️ New images array:', newImages.map(f => f.name));
      return newImages;
    });
  };

  const debugImages = () => {
    console.log('🐛 CURRENT IMAGES STATE:');
    console.log('Length:', images.length);
    images.forEach((img, i) => {
      console.log(`  ${i}: ${img.name} - ${img.size} bytes - ${img.type}`);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Create Listing</h2>
          <button 
            type="button"
            onClick={debugImages}
            className="text-xs bg-gray-100 px-2 py-1 rounded"
          >
            Debug
          </button>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you selling?"
              className="w-full p-3 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item..."
              className="w-full p-3 border rounded-lg h-32"
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Price (₦) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 pl-10 border rounded-lg"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 border rounded-lg"
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Condition *</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full p-3 border rounded-lg"
              >
                {CONDITIONS.map(cond => (
                  <option key={cond} value={cond}>
                    {cond.charAt(0).toUpperCase() + cond.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State"
                  className="w-full p-3 pl-10 border rounded-lg"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Images ({images.length}/5)
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {images.map((file, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/70 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500">
                  <Upload size={24} className="text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Upload up to 5 photos. First photo will be the cover image.
            </p>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Creating Listing...' : 'Post Listing'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateListingModal;